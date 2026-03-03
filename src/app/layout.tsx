import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Language Academy",
  description: "Полноценная платформа для изучения иностранных языков.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  AL
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">AI Language Academy</p>
                  <p className="text-xs text-slate-500">Персональная траектория обучения</p>
                </div>
              </div>
              <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
                <Link href="/" className="rounded-full px-3 py-2 hover:bg-slate-100">
                  Тренер
                </Link>
                <Link href="/lessons" className="rounded-full px-3 py-2 hover:bg-slate-100">
                  Уроки
                </Link>
                <Link href="/practice" className="rounded-full px-3 py-2 hover:bg-slate-100">
                  Практика
                </Link>
                <Link href="/vocabulary" className="rounded-full px-3 py-2 hover:bg-slate-100">
                  Словарь
                </Link>
                <Link href="/progress" className="rounded-full px-3 py-2 hover:bg-slate-100">
                  Прогресс
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
