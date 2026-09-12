"use client";

import { ArrowLeft, Check, GraduationCap, Layers, RotateCcw, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LESSONS, effortFor } from "@/lib/exercises";
import { useProgress } from "@/lib/use-progress";
import { usePwa } from "@/lib/use-pwa";
import { useRelativeTime } from "@/lib/use-relative-time";
import { useTheme } from "@/lib/use-theme";
import { ALL_WORDS } from "@/lib/words";
import { ExerciseRunner } from "./exercise-runner";
import { SiteHeader } from "./site-header";
import { StorageDialog } from "./storage-dialog";
import { ViewSkeleton } from "./ui";

const LessonsView = dynamic(
  () => import("./lessons-view").then((mod) => ({ default: mod.LessonsView })),
  { loading: ViewSkeleton },
);
const ReviewView = dynamic(
  () => import("./review-view").then((mod) => ({ default: mod.ReviewView })),
  { loading: ViewSkeleton },
);
const VocabView = dynamic(
  () => import("./vocab-view").then((mod) => ({ default: mod.VocabView })),
  { loading: ViewSkeleton },
);

type Tab = "lessons" | "review" | "vocab";

const TABS: { id: Tab; label: string; icon: typeof Layers }[] = [
  { id: "lessons", label: "Μαθήματα", icon: Layers },
  { id: "review", label: "Επανάληψη", icon: RotateCcw },
  { id: "vocab", label: "Λεξιλόγιο", icon: GraduationCap },
];

const TOTAL_WORDS = ALL_WORDS.length;

export function AppShell() {
  const progress = useProgress();
  const { isDark, toggleTheme } = useTheme();
  const { isStandalone } = usePwa();
  const lastSavedLabel = useRelativeTime(progress.lastSaved);

  const [tab, setTab] = useState<Tab>("lessons");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [completedLesson, setCompletedLesson] = useState<number | null>(null);

  useEffect(() => {
    if (!progress.restored) return;
    const id = window.setTimeout(progress.dismissRestored, 4500);
    return () => window.clearTimeout(id);
  }, [progress.restored, progress.dismissRestored]);

  const activeLesson = useMemo(() => {
    const id = progress.currentLesson.id;
    if (id === null) return null;
    return LESSONS[id] ?? null;
  }, [progress.currentLesson.id]);

  const exerciseIndex = activeLesson
    ? Math.min(Math.max(progress.currentLesson.exIdx, 0), activeLesson.exercises.length - 1)
    : 0;
  const exercise = activeLesson?.exercises[exerciseIndex] ?? null;

  const startLesson = useCallback(
    (lessonId: number) => {
      const lesson = LESSONS[lessonId];
      if (!lesson) return;
      const done = progress.lessonProgress[lessonId] ?? 0;
      setCompletedLesson(null);
      progress.setCurrentLesson({
        id: lessonId,
        exIdx: done >= lesson.exercises.length ? 0 : done,
      });
    },
    [progress],
  );

  const exitLesson = useCallback(() => {
    progress.setCurrentLesson({ id: null, exIdx: 0 });
  }, [progress]);

  const advanceLesson = useCallback(() => {
    if (!activeLesson) return;
    const next = exerciseIndex + 1;
    if (next < activeLesson.exercises.length) {
      progress.setLessonProgress(activeLesson.id, next);
      progress.setCurrentLesson({ id: activeLesson.id, exIdx: next });
      return;
    }
    progress.setLessonProgress(activeLesson.id, activeLesson.exercises.length);
    progress.setCurrentLesson({ id: null, exIdx: 0 });
    setCompletedLesson(activeLesson.id);
  }, [activeLesson, exerciseIndex, progress]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setCompletedLesson(null);
    if (next !== "lessons") exitLesson();
  };

  const toggleKnown = useCallback(
    (en: string) => progress.setKnown(en, !progress.learned.has(en)),
    [progress],
  );

  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden">
      <SiteHeader
        learnedCount={progress.learned.size}
        totalWords={TOTAL_WORDS}
        dueCount={progress.dueCount}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
        isStandalone={isStandalone}
      />

      {progress.restored && (
        <button
          type="button"
          role="status"
          onClick={progress.dismissRestored}
          className="fixed bottom-4 left-1/2 z-60 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 animate-toast-in items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-xl dark:bg-white dark:text-black"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] text-zinc-900 dark:bg-zinc-900 dark:text-white">
            <Check size={12} />
          </span>
          Η πρόοδός σου φορτώθηκε
          {progress.lastSaved && (
            <span className="ml-1 hidden text-[11px] opacity-70 sm:inline">· {lastSavedLabel}</span>
          )}
        </button>
      )}

      <div className="mx-auto w-full max-w-[1280px] overflow-x-hidden px-safe pt-4 md:px-6 md:pt-6">
        <div
          className="w-full"
          role="tablist"
          aria-label="Ενότητες εφαρμογής"
        >
          <div className="flex w-full min-w-0 gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-1 sm:w-fit sm:gap-2 dark:border-zinc-800 dark:bg-zinc-900">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onPointerEnter={() => {
                  if (id === "review") void import("./review-view");
                  if (id === "vocab") void import("./vocab-view");
                  if (id === "lessons") void import("./lessons-view");
                }}
                onClick={() => switchTab(id)}
                className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[12px] font-medium whitespace-nowrap transition-all press sm:flex-none sm:gap-2 sm:px-4 sm:text-[13px] md:h-11 ${
                  tab === id
                    ? "bg-zinc-900 text-white shadow dark:bg-white dark:text-black"
                    : "bg-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                <Icon size={16} className="hidden shrink-0 xs:block" />
                <span className="truncate">{label}</span>
                {id === "review" && progress.dueCount > 0 && (
                  <span className="grid min-w-4 place-items-center rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-zinc-900">
                    {progress.dueCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1280px] flex-1 overflow-x-hidden px-safe py-4 md:px-6 md:py-8">
        {tab === "lessons" && !activeLesson && completedLesson !== null && (
          <LessonComplete
            lessonId={completedLesson}
            onRestart={() => startLesson(completedLesson)}
            onBack={() => setCompletedLesson(null)}
            onReview={() => switchTab("review")}
          />
        )}

        {tab === "lessons" && !activeLesson && completedLesson === null && (
          <LessonsView
            learned={progress.learned}
            srs={progress.srs}
            lessonProgress={progress.lessonProgress}
            lastSaved={progress.lastSaved}
            dueCount={progress.dueCount}
            onStartLesson={startLesson}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {tab === "lessons" && activeLesson && exercise && (
          <div className="mx-auto w-full max-w-[720px] min-w-0 overflow-hidden">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
              <button
                type="button"
                onClick={exitLesson}
                className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-[13px] press md:h-11 md:px-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <ArrowLeft size={16} /> Μαθήματα
              </button>
              <div className="flex min-w-0 items-center gap-2 overflow-hidden text-[11px] md:text-[12px]">
                <span className="truncate opacity-60">
                  {activeLesson.title} · {exerciseIndex + 1}/{activeLesson.exercises.length}
                </span>
                <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-200 md:w-24 dark:bg-zinc-800">
                  <div
                    className="h-full bg-brand-600 transition-all dark:bg-brand-300"
                    style={{
                      width: `${((exerciseIndex + 1) / activeLesson.exercises.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <ExerciseRunner
              key={exercise.id}
              exercise={exercise}
              isLast={exerciseIndex + 1 === activeLesson.exercises.length}
              isMastered={progress.learned.has(exercise.word.en)}
              srsCard={progress.srs[exercise.word.en]}
              onToggleMastered={() => toggleKnown(exercise.word.en)}
              onAnswered={(correct) =>
                progress.recordAttempt(exercise.word.en, correct, effortFor(exercise.type))
              }
              onNext={advanceLesson}
            />
          </div>
        )}

        {tab === "review" && (
          <div className="mx-auto w-full max-w-[760px] min-w-0 overflow-hidden">
            <ReviewView
              srs={progress.srs}
              learned={progress.learned}
              dueCount={progress.dueCount}
              onToggleKnown={toggleKnown}
              onAnswered={(en, correct, type) =>
                progress.recordAttempt(en, correct, effortFor(type))
              }
            />
          </div>
        )}

        {tab === "vocab" && (
          <VocabView
            learned={progress.learned}
            srs={progress.srs}
            attempts={progress.attempts}
            onToggleKnown={toggleKnown}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-[1280px] overflow-hidden px-safe pt-2 pb-safe md:px-6">
        <p className="text-center text-[10px] tracking-wide break-words opacity-50 md:text-[11px]">
          As a Man Thinketh · {TOTAL_WORDS} λέξεις · SM-2 · αποθήκευση στη συσκευή σου
        </p>
      </footer>

      {settingsOpen && (
        <StorageDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          lastSaved={progress.lastSaved}
          masteredCount={progress.learned.size}
          totalWords={TOTAL_WORDS}
          onExport={progress.exportSnapshot}
          onImport={progress.importSnapshot}
          onReset={progress.reset}
        />
      )}
    </div>
  );
}

function LessonComplete({
  lessonId,
  onRestart,
  onBack,
  onReview,
}: {
  lessonId: number;
  onRestart: () => void;
  onBack: () => void;
  onReview: () => void;
}) {
  const lesson = LESSONS[lessonId];
  return (
    <div className="mx-auto max-w-[560px] animate-pop-in rounded-[20px] border border-zinc-200 bg-white p-6 text-center md:rounded-[24px] md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600 animate-celebrate dark:bg-brand-900 dark:text-brand-300">
        <Trophy size={24} />
      </div>
      <h2 className="mt-4 text-[20px] font-bold tracking-tight md:text-[22px]">
        Ολοκλήρωσες το μάθημα {lessonId + 1}
      </h2>
      <p className="mt-1 text-[13px] opacity-70">
        {lesson?.title} · {lesson?.exercises.length} ασκήσεις. Οι λέξεις μπήκαν στο SM-2.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="h-11 rounded-full bg-zinc-900 px-5 text-[13px] font-medium text-white press transition hover:opacity-90 dark:bg-white dark:text-black"
        >
          Επόμενο μάθημα
        </button>
        <button
          type="button"
          onClick={onReview}
          className="h-11 rounded-full border border-zinc-200 bg-white px-5 text-[13px] font-medium press dark:border-zinc-700 dark:bg-zinc-800"
        >
          Πάμε σε επανάληψη
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="h-11 rounded-full border border-zinc-200 bg-white px-5 text-[13px] font-medium press dark:border-zinc-700 dark:bg-zinc-800"
        >
          Ξανά
        </button>
      </div>
    </div>
  );
}
