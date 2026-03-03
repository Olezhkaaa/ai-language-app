import Link from "next/link";
import { lessons } from "@/lib/lessons";

export default function LessonsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold">Уроки</h1>
        <p className="mt-2 text-slate-600">
          Пошаговые уроки с теорией, практикой и проверкой.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {lessons.map((lesson) => (
          <article
            key={lesson.id}
            className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-semibold">{lesson.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{lesson.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[lesson.level, `${lesson.durationMinutes} мин`, "Практика"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href={`/lessons/${lesson.id}`}
              className="self-start rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Открыть урок
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
