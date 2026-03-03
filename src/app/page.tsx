"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "text" | "voice" | "handwriting";
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [handwritingMode, setHandwritingMode] = useState(false);
  const [handwritingText, setHandwritingText] = useState("");
  const [handwritingBusy, setHandwritingBusy] = useState(false);
  const [practicePhrase, setPracticePhrase] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [pronunciationFeedback, setPronunciationFeedback] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sendToChatRef = useRef(true);
  const finalTranscriptRef = useRef("");
  const practicePhraseRef = useRef("");
  const liveTranscriptRef = useRef("");
  const finalizeGuardRef = useRef(false);
  const manualStopRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    practicePhraseRef.current = practicePhrase;
  }, [practicePhrase]);

  useEffect(() => {
    const SpeechRecognition =
      (window as typeof window & { SpeechRecognition?: typeof window.SpeechRecognition })
        .SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    const finalize = (forceTranscript?: string) => {
      if (finalizeGuardRef.current) return;
      finalizeGuardRef.current = true;
      setIsListening(false);
      const finalText = finalTranscriptRef.current.trim();
      const fallbackText = liveTranscriptRef.current.trim();
      const transcript = forceTranscript?.trim() || finalText || fallbackText;
      if (transcript) {
        setLastTranscript(transcript);
        if (practicePhraseRef.current) {
          const score = calculateSimilarity(transcript, practicePhraseRef.current);
          setPronunciationScore(score);
          setPronunciationFeedback(
            score >= 80
              ? "Отличное произношение!"
              : score >= 60
                ? "Хорошо, но можно четче произнести ключевые слова."
                : "Попробуй повторить медленнее и отчетливее."
          );
        }
        if (sendToChatRef.current) {
          setInput(transcript);
          sendMessage(transcript, "voice");
        }
      }
      finalTranscriptRef.current = "";
      setLiveTranscript("");
      liveTranscriptRef.current = "";
    };

    recognition.onstart = () => {
      finalizeGuardRef.current = false;
      setIsListening(true);
      setSpeechError("");
    };
    recognition.onend = () => {
      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }
      finalize();
    };
    recognition.onerror = (event) => {
      if (event.error && event.error !== "aborted") {
        setSpeechError(event.error || "Ошибка распознавания речи");
      }
      finalize();
    };
    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += `${text} `;
        } else {
          interim += text;
        }
      }
      if (finalChunk) {
        finalTranscriptRef.current += finalChunk;
      }
      const combined = `${finalTranscriptRef.current}${interim}`.trim();
      setLiveTranscript(combined);
      liveTranscriptRef.current = combined;
    };

    recognitionRef.current = recognition;
  }, []);

  const sendMessage = async (text: string, source: ChatMessage["source"] = "text") => {
    if (!text.trim()) return;
    const newMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text.trim(),
      source,
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsSending(true);

    const assistantId = generateId();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), language: "English" }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let displayText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.token) {
                  fullResponse += data.token;
                  
                  // Try to extract clean text without JSON markup
                  const jsonMatch = fullResponse.match(/\{\s*"reply"\s*:\s*"([^"]*)"/);
                  if (jsonMatch && jsonMatch[1]) {
                    displayText = jsonMatch[1]
                      .replace(/\\n/g, "\n")
                      .replace(/\\"/g, '"')
                      .replace(/\\\\/g, "\\");
                  } else {
                    // Fallback: show text but filter out obvious JSON
                    displayText = fullResponse
                      .replace(/^\s*\{[\s\S]*?"reply"\s*:\s*"/, "")
                      .replace(/"[\s\S]*$/, "")
                      .replace(/\\n/g, "\n")
                      .replace(/\\"/g, '"');
                  }
                  
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId ? { ...msg, content: displayText } : msg
                    )
                  );
                }
                if (data.done) {
                  const jsonMatch = fullResponse.match(/\{[\s\S]*"reply"[\s\S]*"practice"[\s\S]*\}/);
                  if (jsonMatch) {
                    try {
                      const parsed = JSON.parse(jsonMatch[0]) as { reply?: string; practice?: string };
                      const cleanReply = (parsed.reply || fullResponse)
                        .replace(/\\n/g, "\n")
                        .replace(/\\"/g, '"');
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantId ? { ...msg, content: cleanReply } : msg
                        )
                      );
                      if (parsed.practice) {
                        setPracticePhrase(parsed.practice);
                      }
                    } catch {
                      // keep displayText as is
                    }
                  }
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: "Не удалось получить ответ. Проверь соединение с Ollama." }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input, "text");
    setInput("");
  };

  const startListening = (sendToChat = true) => {
    if (isListening || !recognitionRef.current) return;
    setSpeechError("");
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    finalTranscriptRef.current = "";
    sendToChatRef.current = sendToChat;
    manualStopRef.current = false;
    finalizeGuardRef.current = false;
    try {
      recognitionRef.current.abort();
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;
    try {
      const finalText = finalTranscriptRef.current.trim();
      const fallbackText = liveTranscriptRef.current.trim();
      const transcript = finalText || fallbackText;
      manualStopRef.current = true;
      
      if (transcript) {
        setLastTranscript(transcript);
        if (practicePhraseRef.current) {
          const score = calculateSimilarity(transcript, practicePhraseRef.current);
          setPronunciationScore(score);
          setPronunciationFeedback(
            score >= 80
              ? "Отличное произношение!"
              : score >= 60
                ? "Хорошо, но можно четче произнести ключевые слова."
                : "Попробуй повторить медленнее и отчетливее."
          );
        }
        if (sendToChatRef.current) {
          setInput(transcript);
          sendMessage(transcript, "voice");
        }
      } else {
        setSpeechError("Текст не распознан. Попробуй говорить четче.");
      }
      
      finalizeGuardRef.current = true;
      setIsListening(false);
      finalTranscriptRef.current = "";
      setLiveTranscript("");
      liveTranscriptRef.current = "";
      recognitionRef.current.abort();
    } catch (error) {
      console.error('Stop listening error:', error);
      setIsListening(false);
      setSpeechError("Ошибка остановки распознавания.");
    }
  };

  const toggleHandwriting = () => setHandwritingMode((prev) => !prev);

  const speak = (text: string) => {
    console.log('Попытка озвучить:', text);
    
    if (!('speechSynthesis' in window)) {
      console.error('Speech Synthesis API не поддерживается');
      alert('Ваш браузер не поддерживает озвучивание текста');
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      
      // Получаем список доступных голосов
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Доступные голоса:', voices.length, voices);
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Пытаемся найти английский голос
        const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
        if (englishVoice) {
          console.log('Используем голос:', englishVoice.name, englishVoice.lang);
          utterance.voice = englishVoice;
        } else {
          console.warn('Английский голос не найден, используем голос по умолчанию');
        }
        
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => {
          console.log('Озвучивание начато');
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          console.log('Озвучивание завершено');
          setIsSpeaking(false);
        };
        
        utterance.onerror = (event) => {
          console.error('Ошибка озвучивания:', event.error, event);
          setIsSpeaking(false);
          if (event.error === 'not-allowed') {
            alert('Озвучивание заблокировано браузером. Попробуйте снова после взаимодействия со страницей.');
          } else {
            alert(`Ошибка озвучивания: ${event.error || 'неизвестная ошибка'}`);
          }
        };
        
        console.log('Запуск озвучивания...');
        window.speechSynthesis.speak(utterance);
      };
      
      // Проверяем, загружены ли голоса
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        console.log('Ожидание загрузки голосов...');
        // Голоса еще не загружены, ждем события
        window.speechSynthesis.onvoiceschanged = () => {
          console.log('Голоса загружены');
          loadVoices();
        };
      } else {
        loadVoices();
      }
    } catch (error) {
      console.error('Исключение при озвучивании:', error);
      setIsSpeaking(false);
      alert(`Исключение: ${error}`);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    lastPoint.current = getCanvasPoint(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !canvasRef.current || !lastPoint.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const current = getCanvasPoint(event);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
    lastPoint.current = current;
  };

  const handlePointerUp = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHandwritingText("");
  };

  const submitHandwriting = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHandwritingBusy(true);
    try {
      const imageData = canvas.toDataURL("image/png");
      const response = await fetch("/api/handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData }),
      });
      const data = (await response.json()) as { text?: string };
      const text = data.text ?? "";
      setHandwritingText(text);
      if (text) {
        setInput(text);
      }
    } catch {
      setHandwritingText("Не удалось распознать текст.");
    } finally {
      setHandwritingBusy(false);
    }
  };

  const calculateSimilarity = (spoken: string, target: string) => {
    const a = spoken.trim().toLowerCase();
    const b = target.trim().toLowerCase();
    if (!a || !b) return 0;
    const distance = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 0;
    return Math.round((1 - distance / maxLen) * 100);
  };

  const levenshtein = (a: string, b: string) => {
    const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          AI Language Coach
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Полноценная практика иностранных языков
        </h1>
        <p className="max-w-2xl text-slate-600">
          Персональный тренер, живые диалоги, голос и рукописный ввод, плюс
          ежедневные задания.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Диалог с тренером</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              English B1
            </span>
          </div>

          <div className="flex h-[420px] flex-col gap-4 overflow-y-auto rounded-2xl bg-slate-50 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Напиши фразу, включи микрофон или используй рукописный ввод.
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.role === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <p>{message.content}</p>
                      {message.source && message.role === "user" && (
                        <span className="mt-2 block text-[10px] uppercase tracking-[0.2em] text-slate-400">
                          {message.source}
                        </span>
                      )}
                    </div>
                    {message.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() => speak(message.content)}
                        disabled={isSpeaking}
                        className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600 disabled:bg-slate-400"
                      >
                        🔊 Озвучить
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Например: How was your day?"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
              <button
                type="submit"
                disabled={isSending}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSending ? "Отправка..." : "Отправить"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onPointerDown={() => startListening()}
                onPointerUp={stopListening}
                onPointerLeave={stopListening}
                onPointerCancel={stopListening}
                onTouchStart={() => startListening()}
                onTouchEnd={stopListening}
                onTouchCancel={stopListening}
                disabled={!recognitionSupported}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isListening ? "Говорите..." : "🎙️ Зажмите и говорите"}
              </button>
              <button
                type="button"
                onClick={toggleHandwriting}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
              >
                ✍️ Рукописный ввод
              </button>
              {!recognitionSupported && (
                <span className="text-xs text-rose-500">
                  Голосовой ввод не поддерживается этим браузером.
                </span>
              )}
            </div>
            {(liveTranscript || speechError) && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                {liveTranscript && (
                  <p>
                    Сейчас: <span className="font-semibold">{liveTranscript}</span>
                  </p>
                )}
                {speechError && <p className="mt-2 text-rose-500">{speechError}</p>}
              </div>
            )}
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Рукописный ввод</h3>
              <span className="text-xs text-slate-400">Альтернатива клавиатуре</span>
            </div>
            <p className="text-sm text-slate-600">
              Напиши фразу на английском, распознай текст и отправь в чат.
            </p>

            {handwritingMode ? (
              <div className="flex flex-col gap-3">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={200}
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitHandwriting}
                    disabled={handwritingBusy}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {handwritingBusy ? "Распознаю..." : "Распознать"}
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Очистить
                  </button>
                  {handwritingText && (
                    <button
                      type="button"
                      onClick={() => sendMessage(handwritingText, "handwriting")}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Отправить текст
                    </button>
                  )}
                </div>
                {handwritingText && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                    Распознанный текст: <span className="font-semibold">{handwritingText}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Нажми “Рукописный ввод”, чтобы открыть холст.
              </div>
            )}
          </aside>

          <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Произношение</h3>
              <span className="text-xs text-slate-400">Голосовая практика</span>
            </div>
            <p className="text-sm text-slate-600">
              Выбери фразу для тренировки и произнеси ее. Оценка формируется по совпадению текста.
            </p>
            <div className="flex flex-col gap-3">
              <input
                value={practicePhrase}
                onChange={(event) => setPracticePhrase(event.target.value)}
                placeholder="Фраза для произношения"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onPointerDown={() => startListening(false)}
                  onPointerUp={stopListening}
                  onPointerLeave={stopListening}
                  onPointerCancel={stopListening}
                  onTouchStart={() => startListening(false)}
                  onTouchEnd={stopListening}
                  onTouchCancel={stopListening}
                  disabled={!recognitionSupported}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isListening ? "Говорите..." : "Зажмите и произнесите"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPracticePhrase("");
                    setPronunciationScore(null);
                    setPronunciationFeedback("");
                    setLastTranscript("");
                  }}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Очистить
                </button>
              </div>
            </div>
            {lastTranscript && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p>
                  Распознано: <span className="font-semibold">{lastTranscript}</span>
                </p>
                {pronunciationScore !== null && (
                  <p className="mt-2">
                    Оценка: <span className="font-semibold">{pronunciationScore}%</span>
                  </p>
                )}
                {pronunciationFeedback && (
                  <p className="mt-2 text-slate-500">{pronunciationFeedback}</p>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "План на сегодня",
            items: [
              "Диалог: рассказ о себе",
              "10 новых слов по теме " + "Travel",
              "Грамматика: Present Perfect",
            ],
          },
          {
            title: "Слабые места",
            items: [
              "Произношение звука th",
              "Артикли a/the",
              "Скорость речи",
            ],
          },
          {
            title: "Цели недели",
            items: ["3 разговорные сессии", "2 диктанта", "1 контрольный урок"],
          },
        ].map((card) => (
          <div
            key={card.title}
            className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-base font-semibold">{card.title}</h3>
            <ul className="flex flex-col gap-2 text-sm text-slate-600">
              {card.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-900" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
