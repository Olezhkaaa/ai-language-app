import { NextResponse } from "next/server";

type ChatRequest = {
  message?: string;
  language?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;
  const message = body.message?.trim();
  const language = body.language ?? "English";

  if (!message) {
    return NextResponse.json({ reply: "Напиши сообщение для практики." }, { status: 400 });
  }

  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5";

  try {
    const prompt = `You are an experienced, patient, and encouraging language teacher.

CORE RULES:
1. DETECT the language of the student's message automatically
2. If student writes in Russian - respond in Russian, explaining ${language}
3. If student writes in ${language} - respond in ${language}, practicing conversation
4. If student writes in another language - adapt accordingly
5. Always be supportive and motivating

YOUR RESPONSIBILITIES:
- Correct ALL mistakes (grammar, spelling, word choice) gently
- Explain WHY something is wrong in the student's native language
- Provide 2-3 alternative ways to say the same thing
- Give cultural context and real-life usage examples
- Ask follow-up questions to continue the conversation naturally
- Adapt difficulty to student's level (judge from their message)
- Use simple vocabulary when explaining complex concepts
- Encourage the student after every message

RESPONSE FORMAT:
- For Russian messages: explain ${language} grammar/vocabulary in Russian
- For ${language} messages: respond naturally in ${language}, then give tips
- Mark corrections clearly: ❌ Wrong → ✅ Correct
- End with a question or task to practice

IMPORTANT:
- Never ignore mistakes - teaching moment!
- Always provide the "practice" phrase in ${language}
- Be conversational and warm, not robotic
- Vary your responses - don't repeat the same phrases

Student message: ${message}

Return ONLY valid JSON:
{
  "reply": "your complete teacher response",
  "practice": "useful ${language} phrase to practice (3-8 words)"
}`;
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 500,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { reply: "Не удалось получить ответ от локальной модели." },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const json = JSON.parse(line);
                  if (json.response) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: json.response })}\n\n`));
                  }
                  if (json.done) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                  }
                } catch {
                  // ignore parse errors
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { reply: "Ошибка подключения к локальной модели. Проверь, что Ollama запущена." },
      { status: 502 }
    );
  }
}
