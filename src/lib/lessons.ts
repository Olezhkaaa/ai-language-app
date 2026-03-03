export type LessonTask = {
  id: string;
  title: string;
  prompt: string;
  hint?: string;
  expected?: string[];
};

export type Lesson = {
  id: string;
  title: string;
  level: "A1" | "A2" | "B1" | "B2";
  durationMinutes: number;
  description: string;
  goals: string[];
  vocabulary: string[];
  tasks: LessonTask[];
};

export const lessons: Lesson[] = [
  {
    id: "intro",
    title: "Урок 1. Знакомство",
    level: "A1",
    durationMinutes: 25,
    description: "Базовые приветствия и короткий рассказ о себе.",
    goals: ["Поздороваться", "Назвать имя", "Сказать откуда ты"],
    vocabulary: ["Hi", "Nice to meet you", "I'm from", "My name is"],
    tasks: [
      {
        id: "intro-task-1",
        title: "Диалог",
        prompt: "Скажи: Привет! Меня зовут Анна. Я из Москвы.",
        hint: "Используй: Hi! My name is ... I am from ...",
        expected: ["my name is", "i am from"],
      },
      {
        id: "intro-task-2",
        title: "Вопрос",
        prompt: "Как спросить: Откуда ты?",
        hint: "Фраза начинается с Where...",
        expected: ["where are you from"],
      },
    ],
  },
  {
    id: "travel",
    title: "Урок 2. Путешествия",
    level: "A2",
    durationMinutes: 30,
    description: "Фразы в аэропорту и отеле.",
    goals: ["Спросить о брони", "Уточнить время вылета"],
    vocabulary: ["reservation", "flight", "check-in", "boarding pass"],
    tasks: [
      {
        id: "travel-task-1",
        title: "Ситуация",
        prompt: "Как сказать: У меня есть бронь на завтра?",
        expected: ["reservation", "tomorrow"],
      },
      {
        id: "travel-task-2",
        title: "Аэропорт",
        prompt: "Спроси: Где мой посадочный талон?",
        expected: ["boarding pass"],
      },
    ],
  },
  {
    id: "work",
    title: "Урок 3. Работа",
    level: "B1",
    durationMinutes: 35,
    description: "Деловая переписка и звонки.",
    goals: ["Назначить встречу", "Подтвердить детали"],
    vocabulary: ["schedule", "meeting", "confirm", "availability"],
    tasks: [
      {
        id: "work-task-1",
        title: "Письмо",
        prompt: "Напиши: Можем ли мы назначить встречу на пятницу?",
        expected: ["meeting", "friday"],
      },
      {
        id: "work-task-2",
        title: "Подтверждение",
        prompt: "Подтверди, что время подходит.",
        expected: ["confirm", "works for me"],
      },
    ],
  },
];

export const getLessonById = (id: string) => lessons.find((lesson) => lesson.id === id);
