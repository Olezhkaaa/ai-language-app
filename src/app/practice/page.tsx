const practiceTracks = [
  {
    title: "Разговорные сценарии",
    description: "Тренируй диалоги с ИИ по реальным ситуациям.",
  },
  {
    title: "Аудирование",
    description: "Короткие аудио и вопросы по содержанию.",
  },
  {
    title: "Произношение",
    description: "Повтори фразы и получи обратную связь.",
  },
];

export default function PracticePage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold">Практика</h1>
        <p className="mt-2 text-slate-600">
          Задания на речь, аудирование и произношение.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {practiceTracks.map((track) => (
          <article
            key={track.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">{track.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{track.description}</p>
            <button className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
              Открыть тренажер
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
