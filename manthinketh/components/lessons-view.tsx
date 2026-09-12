"use client";

import { CalendarClock, ChevronRight, Layers, Play, Settings, Sparkles } from "lucide-react";
import { LESSONS } from "@/lib/exercises";
import { useRelativeTime } from "@/lib/use-relative-time";
import { ALL_WORDS, CATEGORY_TOTALS, type Category } from "@/lib/words";
import { isDue, type SrsDeck } from "@/lib/srs";
import type { LessonProgress } from "@/lib/storage";
import { useNow } from "@/lib/use-now";
import { Progressbar, ProgressRing } from "./ui";

type Props = {
  learned: Set<string>;
  srs: SrsDeck;
  lessonProgress: LessonProgress;
  lastSaved: number | null;
  dueCount: number;
  onStartLesson: (lessonId: number) => void;
  onOpenSettings: () => void;
};

const CATEGORY_HINTS: { cat: Category; text: string; wrap: string; dot: string }[] = [
  {
    cat: 1,
    text: "Έντονα — μετάφραση, κενό, πληκτρολόγηση",
    wrap: "bg-[#fff1ee] dark:bg-[#2a1511] border-[#ffd5cc] dark:border-[#4a211c]",
    dot: "bg-[#ff4d2e]",
  },
  {
    cat: 2,
    text: "Μεσαία — μετάφραση & κενό",
    wrap: "bg-[#eef2ff] dark:bg-[#121a33] border-[#c7d2fe] dark:border-[#1e2a5a]",
    dot: "bg-[#2563eb]",
  },
  {
    cat: 3,
    text: "Ελαφρά — μόνο μετάφραση",
    wrap: "bg-brand-50 dark:bg-brand-900/50 border-brand-100 dark:border-brand-700/50",
    dot: "bg-brand-500",
  },
];

export function LessonsView({
  learned,
  srs,
  lessonProgress,
  lastSaved,
  dueCount,
  onStartLesson,
  onOpenSettings,
}: Props) {
  const totalWords = ALL_WORDS.length;
  const learnedCount = learned.size;
  const savedAgo = useRelativeTime(lastSaved);
  const now = useNow();

  return (
    <>
      <div className="flex min-w-0 flex-col items-start gap-5 overflow-hidden rounded-[20px] border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm animate-pop-in md:flex-row md:gap-8 md:rounded-[24px] md:p-8 dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="w-full min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] uppercase opacity-60 md:text-[11px]">
            <Sparkles size={14} /> 12 μαθήματα · spaced repetition
          </div>
          <h1 className="text-[22px] leading-[1.1] font-bold tracking-tight break-words md:text-[34px]">
            Μάθε τις {totalWords} λέξεις του{" "}
            <span className="font-display italic font-normal break-words">As a Man Thinketh</span> με
            ένταση
          </h1>
          <p className="mt-3 max-w-[560px] text-[13px] leading-[1.6] break-words opacity-70 md:text-[14px]">
            Κάθε μάθημα εισάγει λέξεις. Μετά τις αναλαμβάνει το SM-2: μια σωστή απάντηση δεν φτάνει —
            η λέξη ξανάρχεται σε 1 μέρα, μετά 6, μετά όλο και αραιότερα.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 md:mt-5">
            {CATEGORY_HINTS.map((hint) => (
              <div
                key={hint.cat}
                className={`flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-[11px] md:text-[12px] ${hint.wrap}`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${hint.dot}`}
                >
                  {hint.cat}
                </span>
                {hint.text}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full min-w-0 shrink-0 md:w-[300px]">
          <div className="rounded-[18px] border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold tracking-wide uppercase opacity-60">
                Μαθημένες
              </span>
              <span className="text-[12px] font-medium tabular-nums">
                {Math.round((learnedCount / totalWords) * 100)}%
              </span>
            </div>
            <Progressbar value={(learnedCount / totalWords) * 100} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {([1, 2, 3] as Category[]).map((cat) => (
                <div
                  key={cat}
                  className="rounded-[12px] border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div
                    className={`mb-1.5 h-2 w-2 rounded-full ${
                      cat === 1 ? "bg-[#ff4d2e]" : cat === 2 ? "bg-[#2563eb]" : "bg-brand-500"
                    }`}
                  />
                  <div className="text-[11px] opacity-60">Cat {cat}</div>
                  <div className="text-[13px] font-semibold tabular-nums">
                    {ALL_WORDS.filter((w) => w.cat === cat && learned.has(w.en)).length}/
                    {CATEGORY_TOTALS[cat]}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px]">
                {dueCount > 0 ? (
                  <>
                    <CalendarClock size={12} className="text-gold-500" />
                    <span className="font-medium">{dueCount} για σήμερα</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
                    <span className="font-medium">Αποθηκεύεται τοπικά</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] press hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <Settings size={12} /> Διαχείριση
              </button>
            </div>
            {lastSaved && (
              <div className="mt-2 text-[10px] opacity-60">Τελευταία αποθήκευση: {savedAgo}</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid w-full min-w-0 grid-cols-1 gap-3 md:mt-6 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {LESSONS.map((lesson, index) => {
          const done = lessonProgress[lesson.id] ?? 0;
          const total = lesson.exercises.length;
          const percent = total ? Math.round((done / total) * 100) : 0;
          const knownHere = lesson.words.filter((w) => learned.has(w.en)).length;
          const dueHere = now ? lesson.words.filter((w) => isDue(srs[w.en], now)).length : 0;
          const counts = {
            1: lesson.words.filter((w) => w.cat === 1).length,
            2: lesson.words.filter((w) => w.cat === 2).length,
            3: lesson.words.filter((w) => w.cat === 3).length,
          };

          return (
            <div
              key={lesson.id}
              className="card-perf lift group w-full min-w-0 overflow-hidden rounded-[18px] border border-zinc-200 bg-white/90 p-4 animate-rise md:rounded-[20px] md:p-5 dark:border-zinc-800 dark:bg-zinc-900/90"
              style={{ ["--i" as string]: index }}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-[13px] font-bold text-white dark:bg-white dark:text-black">
                    {lesson.id + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold tracking-tight break-words md:text-[14px]">
                      {lesson.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] opacity-60">
                      {lesson.words.length} λέξεις · {knownHere} έμαθες
                      {dueHere > 0 && (
                        <span className="text-gold-500">{dueHere} σήμερα</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <ProgressRing value={percent} size={44} />
                  <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums">
                    {percent}%
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {([1, 2, 3] as Category[]).map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {counts[cat]} {cat === 1 ? "Έντονα" : cat === 2 ? "Μεσαία" : "Ελαφρά"}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex min-w-0 flex-wrap gap-1.5">
                {lesson.words.slice(0, 6).map((word) => (
                  <span
                    key={word.en}
                    className={`rounded-full border px-2 py-1 text-[11px] break-all ${
                      learned.has(word.en)
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  >
                    {word.en}
                  </span>
                ))}
                {lesson.words.length > 6 && (
                  <span className="rounded-full bg-transparent px-2 py-1 text-[11px]">
                    +{lesson.words.length - 6}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onStartLesson(lesson.id)}
                className="mt-5 flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-full bg-zinc-900 text-[13px] font-medium text-white press transition hover:opacity-90 md:h-11 dark:bg-white dark:text-black"
              >
                <Play size={16} />
                {done > 0 && done < total ? "Συνέχεια" : done >= total ? "Επανάληψη" : "Έναρξη"}
                <ChevronRight size={16} className="opacity-60" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] opacity-50">
        <Layers size={12} /> {LESSONS.reduce((sum, lesson) => sum + lesson.exercises.length, 0)}{" "}
        ασκήσεις συνολικά
      </div>
    </>
  );
}
