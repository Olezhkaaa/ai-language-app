"use client";

import { useMemo, useState } from "react";
import type { Lesson, LessonTask } from "@/lib/lessons";

type LessonClientProps = {
  lesson: Lesson;
};

type TaskState = {
  answer: string;
  completed: boolean;
  feedback?: string;
};

const buildInitialState = (tasks: LessonTask[]) =>
  tasks.reduce<Record<string, TaskState>>((acc, task) => {
    acc[task.id] = { answer: "", completed: false };
    return acc;
  }, {});

const storageKey = (lessonId: string) => `lesson-progress:${lessonId}`;

export default function LessonClient({ lesson }: LessonClientProps) {
  const [taskState, setTaskState] = useState<Record<string, TaskState>>(() => {
    if (typeof window === "undefined") return buildInitialState(lesson.tasks);
    const saved = window.localStorage.getItem(storageKey(lesson.id));
    return saved ? (JSON.parse(saved) as Record<string, TaskState>) : buildInitialState(lesson.tasks);
  });

  const completion = useMemo(() => {
    const total = lesson.tasks.length;
    const done = Object.values(taskState).filter((task) => task.completed).length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [lesson.tasks.length, taskState]);

  const updateStorage = (nextState: Record<string, TaskState>) => {
    setTaskState(nextState);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(lesson.id), JSON.stringify(nextState));
    }
  };

  const handleAnswerChange = (taskId: string, value: string) => {
    const nextState = {
      ...taskState,
      [taskId]: {
        ...taskState[taskId],
        answer: value,
      },
    };
    updateStorage(nextState);
  };

  const checkTask = (task: LessonTask) => {
    const currentAnswer = taskState[task.id]?.answer ?? "";
    const answer = currentAnswer.trim().toLowerCase();
    if (!answer) {
      const nextState = {
        ...taskState,
        [task.id]: {
          answer: currentAnswer,
          completed: false,
          feedback: "Напиши ответ перед проверкой.",
        },
      };
      updateStorage(nextState);
      return;
    }
    const expected = task.expected ?? [];
    const isMatch = expected.length === 0 || expected.some((phrase) => answer.includes(phrase.toLowerCase()));
    const feedback = isMatch
      ? "Отлично! Идем дальше."
      : "Проверь формулировку и попробуй еще раз.";
    const nextState = {
      ...taskState,
      [task.id]: {
        answer: currentAnswer,
        completed: isMatch,
        feedback,
      },
    };
    updateStorage(nextState);
  };

  const resetLesson = () => {
    const resetState = buildInitialState(lesson.tasks);
    updateStorage(resetState);
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Цели урока</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
            {lesson.goals.map((goal) => (
              <li key={goal} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-900" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Словарь урока</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {lesson.vocabulary.map((word) => (
              <span
                key={word}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Задания</h2>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>Прогресс: {completion.done} / {completion.total}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
              {completion.percent}%
            </span>
            <button
              onClick={resetLesson}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Сбросить
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {lesson.tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-2xl border p-4 ${
                taskState[task.id]?.completed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
                <p className="text-sm text-slate-600">{task.prompt}</p>
                {task.hint && <p className="text-xs text-slate-400">Подсказка: {task.hint}</p>}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  value={taskState[task.id]?.answer ?? ""}
                  onChange={(event) => handleAnswerChange(task.id, event.target.value)}
                  placeholder="Напиши ответ здесь"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => checkTask(task)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Проверить
                  </button>
                  {taskState[task.id]?.feedback && (
                    <span className="text-xs text-slate-500">{taskState[task.id]?.feedback}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
