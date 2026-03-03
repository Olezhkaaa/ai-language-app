const metrics = [
  { label: "Разговорные сессии", value: "8" },
  { label: "Слов выучено", value: "124" },
  { label: "Точность грамматики", value: "82%" },
  { label: "Дни подряд", value: "5" },
];

const history = [
  { date: "Пн", score: "75%" },
  { date: "Вт", score: "78%" },
  { date: "Ср", score: "82%" },
  { date: "Чт", score: "80%" },
  { date: "Пт", score: "84%" },
];

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold">Прогресс</h1>
        <p className="mt-2 text-slate-600">
          Статистика и динамика обучения по неделям.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Динамика недели</h2>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {history.map((item) => (
            <div key={item.date} className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">{item.date}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{item.score}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
