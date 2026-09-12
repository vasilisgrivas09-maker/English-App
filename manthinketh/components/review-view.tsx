"use client";

import { ArrowLeft, CalendarClock, RotateCcw, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { REVIEW_SIZE, buildReviewSession, type Exercise } from "@/lib/exercises";
import { ALL_WORDS } from "@/lib/words";
import { isDue, isLearned, type SrsDeck } from "@/lib/srs";
import { useNow } from "@/lib/use-now";
import { ExerciseRunner } from "./exercise-runner";
import { Progressbar } from "./ui";

type Props = {
  srs: SrsDeck;
  learned: Set<string>;
  dueCount: number;
  onToggleKnown: (en: string) => void;
  onAnswered: (en: string, correct: boolean, type: Exercise["type"]) => void;
};

type Session = {
  queue: Exercise[];
  scheduled: number;
  index: number;
  right: number;
  wrong: number;
  done: boolean;
};

export function ReviewView({ srs, learned, dueCount, onToggleKnown, onAnswered }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const now = useNow();

  const stats = useMemo(() => {
    let learning = 0;
    for (const word of ALL_WORDS) {
      const card = srs[word.en];
      if (card && !isLearned(card) && !learned.has(word.en)) learning += 1;
    }
    return {
      due: now ? ALL_WORDS.filter((word) => isDue(srs[word.en], now)).length : 0,
      learning,
      learned: learned.size,
    };
  }, [learned, now, srs]);

  const start = () => {
    const built = buildReviewSession(srs);
    setSession({
      queue: built.exercises,
      scheduled: built.dueCount,
      index: 0,
      right: 0,
      wrong: 0,
      done: false,
    });
  };

  if (!session) {
    return (
      <div className="min-w-0 animate-pop-in overflow-hidden rounded-[20px] border border-zinc-200 bg-white p-4 md:rounded-[24px] md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-[20px] font-bold tracking-tight break-words md:text-[22px]">
          Επανάληψη SM-2
        </h2>
        <p className="mt-2 text-[13px] leading-[1.6] break-words opacity-70 md:text-[14px]">
          Κάθε λέξη έχει το δικό της διάστημα. Σωστή απάντηση → ξανά σε λίγες μέρες. Λάθος → γυρίζει
          πίσω σήμερα. Έτσι επαναλαμβάνεις λίγο πριν ξεχάσεις.
        </p>

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Σήμερα", value: stats.due },
            { label: "Σε εξέλιξη", value: stats.learning },
            { label: "Μαθημένες", value: stats.learned },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-[14px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="text-[11px] font-semibold tracking-wide uppercase opacity-60">
                {item.label}
              </div>
              <div className="mt-1 text-[24px] font-bold tabular-nums">{item.value}</div>
            </div>
          ))}
        </div>

        {dueCount === 0 && (
          <p className="mt-5 text-[13px] leading-[1.5] opacity-70">
            Δεν έχεις λέξεις προγραμματισμένες για σήμερα. Η συνεδρία θα πιάσει τις πιο αδύναμες.
          </p>
        )}

        <button
          type="button"
          onClick={start}
          className="glow-gold mt-8 flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-full bg-zinc-900 text-[13px] font-medium text-white press transition hover:opacity-90 md:h-12 md:text-[14px] dark:bg-white dark:text-black"
        >
          <RotateCcw size={18} />
          {dueCount > 0
            ? `Επανάληψη σήμερα (${Math.min(dueCount, REVIEW_SIZE)} λέξεις)`
            : `Εξάσκηση (${REVIEW_SIZE} λέξεις)`}
        </button>
      </div>
    );
  }

  if (session.done) {
    const total = session.right + session.wrong;
    const score = total ? Math.round((session.right / total) * 100) : 0;
    return (
      <div className="min-w-0 animate-pop-in overflow-hidden rounded-[20px] border border-zinc-200 bg-white p-6 text-center md:rounded-[24px] md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600 animate-celebrate dark:bg-brand-900 dark:text-brand-300">
          <Trophy size={24} />
        </div>
        <h2 className="mt-4 text-[20px] font-bold tracking-tight md:text-[22px]">
          Τέλος επανάληψης
        </h2>
        <p className="mt-1 text-[13px] opacity-70">
          {session.right} σωστά από {total}
          {session.scheduled > 0 ? ` · ${session.scheduled} ήταν για σήμερα` : ""}
        </p>
        <div className="mx-auto mt-5 max-w-[320px]">
          <Progressbar value={score} />
          <div className="mt-2 text-[12px] font-medium">{score}% επιτυχία</div>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={start}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-[13px] font-medium text-white press transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            <RotateCcw size={16} /> Νέα επανάληψη
          </button>
          <button
            type="button"
            onClick={() => setSession(null)}
            className="h-11 rounded-full border border-zinc-200 bg-white px-5 text-[13px] font-medium press dark:border-zinc-700 dark:bg-zinc-800"
          >
            Πίσω στη σύνοψη
          </button>
        </div>
      </div>
    );
  }

  const exercise = session.queue[session.index];
  const isLast = session.index + 1 >= session.queue.length;

  return (
    <>
      <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setSession(null)}
          className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-[13px] press md:h-11 md:px-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <ArrowLeft size={16} /> Τέλος επανάληψης
        </button>
        <div className="flex shrink-0 items-center gap-2 text-[12px] opacity-60">
          {session.scheduled > 0 && (
            <span className="hidden items-center gap-1 sm:inline-flex">
              <CalendarClock size={12} /> {session.scheduled} σήμερα
            </span>
          )}
          <span className="tabular-nums">
            {session.index + 1}/{session.queue.length}
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 md:w-24 dark:bg-zinc-800">
            <div
              className="h-full bg-brand-600 transition-all dark:bg-brand-300"
              style={{ width: `${((session.index + 1) / session.queue.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <ExerciseRunner
        key={exercise.id}
        exercise={exercise}
        isLast={isLast}
        isMastered={learned.has(exercise.word.en)}
        srsCard={srs[exercise.word.en]}
        onToggleMastered={() => onToggleKnown(exercise.word.en)}
        onAnswered={(correct) => {
          onAnswered(exercise.word.en, correct, exercise.type);
          setSession((prev) =>
            prev
              ? { ...prev, right: prev.right + (correct ? 1 : 0), wrong: prev.wrong + (correct ? 0 : 1) }
              : prev,
          );
        }}
        onNext={() =>
          setSession((prev) => {
            if (!prev) return prev;
            if (prev.index + 1 >= prev.queue.length) return { ...prev, done: true };
            return { ...prev, index: prev.index + 1 };
          })
        }
      />
    </>
  );
}
