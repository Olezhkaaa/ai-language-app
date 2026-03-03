const vocabSets = [
  {
    title: "Путешествия",
    words: 42,
    progress: "12 / 42",
  },
  {
    title: "Бизнес",
    words: 30,
    progress: "5 / 30",
  },
  {
    title: "Повседневная речь",
    words: 55,
    progress: "18 / 55",
  },
];

export default function VocabularyPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold">Словарь</h1>
        <p className="mt-2 text-slate-600">
          Личные наборы слов, карточки и повторения.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {vocabSets.map((set) => (
          <article
            key={set.title}
            className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-semibold">{set.title}</h2>
              <p className="text-sm text-slate-500">{set.words} слов</p>
            </div>
            <div className="text-sm text-slate-600">Прогресс: {set.progress}</div>
            <button className="self-start rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              Учить
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
