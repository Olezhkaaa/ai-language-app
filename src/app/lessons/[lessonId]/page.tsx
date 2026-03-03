import { notFound } from "next/navigation";
import LessonClient from "./LessonClient";
import { getLessonById } from "@/lib/lessons";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonPage({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          {lesson.level} · {lesson.durationMinutes} минут
        </p>
        <h1 className="text-3xl font-semibold">{lesson.title}</h1>
        <p className="text-slate-600">{lesson.description}</p>
      </header>

      <LessonClient lesson={lesson} />
    </div>
  );
}
