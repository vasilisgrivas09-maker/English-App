"use client";

import { Check, Filter, Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import type { Attempts } from "@/lib/exercises";
import { nextReviewLabel, type SrsDeck } from "@/lib/srs";
import { useNow } from "@/lib/use-now";
import { ALL_WORDS, type Category } from "@/lib/words";
import { CategoryBadge } from "./ui";

type StatusFilter = "all" | "unknown" | "known" | "due";

type Props = {
  learned: Set<string>;
  srs: SrsDeck;
  attempts: Attempts;
  onToggleKnown: (en: string) => void;
};

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "Όλες",
  unknown: "Άγνωστες",
  known: "Μαθημένες",
  due: "Σήμερα",
};

export function VocabView({ learned, srs, attempts, onToggleKnown }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<0 | Category>(0);
  const [status, setStatus] = useState<StatusFilter>("all");
  const deferredQuery = useDeferredValue(query);
  const now = useNow();

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return ALL_WORDS.filter((word) => {
      const card = srs[word.en];
      const isKnown = learned.has(word.en);
      if (category !== 0 && word.cat !== category) return false;
      if (status === "known" && !isKnown) return false;
      if (status === "unknown" && isKnown) return false;
      if (status === "due" && !(now && card && card.due <= now)) return false;
      if (!needle) return true;
      return (
        word.en.toLowerCase().includes(needle) ||
        word.el.toLowerCase().includes(needle) ||
        word.sent.toLowerCase().includes(needle)
      );
    });
  }, [category, deferredQuery, learned, now, srs, status]);

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="flex w-full min-w-0 flex-col justify-between gap-3 overflow-hidden rounded-[16px] border border-zinc-200 bg-white/90 p-3 md:flex-row md:items-center md:rounded-[20px] md:p-4 dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex w-full min-w-0 flex-1 items-center gap-2">
          <div className="relative w-full min-w-0 max-w-full flex-1 md:max-w-[380px]">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 opacity-50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="text"
              placeholder="Αναζήτηση EN, EL ή πρόταση..."
              aria-label="Αναζήτηση λέξεων"
              className="h-10 w-full min-w-0 rounded-full border border-zinc-200 bg-zinc-50 pr-9 pl-9 text-[13px] outline-none dark:border-zinc-700 dark:bg-zinc-800"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Καθαρισμός αναζήτησης"
                className="absolute top-1/2 right-3 -translate-y-1/2 opacity-50 hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto">
          <div className="flex w-full flex-wrap gap-1 rounded-full bg-zinc-100 p-1 sm:w-auto dark:bg-zinc-800">
            {([0, 1, 2, 3] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                aria-pressed={category === value}
                className={`h-8 min-w-0 shrink-0 rounded-full px-3 text-[12px] font-medium press md:h-7 ${
                  category === value
                    ? "border border-zinc-200 bg-white shadow dark:border-zinc-600 dark:bg-zinc-700"
                    : "opacity-70"
                }`}
              >
                {value === 0 ? "Όλες" : value === 1 ? "Έντονα" : value === 2 ? "Μεσαία" : "Ελαφρά"}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-wrap gap-1 rounded-full bg-zinc-100 p-1 sm:w-auto dark:bg-zinc-800">
            {(["all", "unknown", "known", "due"] as StatusFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                aria-pressed={status === value}
                className={`h-8 min-w-0 shrink-0 rounded-full px-3 text-[12px] font-medium press md:h-7 ${
                  status === value
                    ? "border border-zinc-200 bg-white shadow dark:border-zinc-600 dark:bg-zinc-700"
                    : "opacity-70"
                }`}
              >
                {STATUS_LABEL[value]}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1 text-[11px] opacity-60">
            <Filter size={12} /> {results.length} λέξεις
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-zinc-300 p-10 text-center text-[13px] opacity-60 dark:border-zinc-700">
          Καμία λέξη δεν ταιριάζει με τα φίλτρα σου.
        </div>
      ) : (
        <div className="mt-4 grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map((word) => {
            const attempt = attempts[word.en];
            const card = srs[word.en];
            const isKnown = learned.has(word.en);
            const hint = now ? nextReviewLabel(card, now) : null;
            return (
              <div
                key={`${word.cat}-${word.en}`}
                className={`card-perf lift w-full min-w-0 overflow-hidden rounded-[16px] border bg-white p-4 break-words md:rounded-[18px] dark:bg-zinc-900 ${
                  isKnown
                    ? "border-zinc-900 dark:border-white"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="text-[14px] font-bold tracking-tight break-all md:text-[15px]">
                        {word.en}
                      </span>
                      <CategoryBadge cat={word.cat} />
                    </div>
                    <div className="mt-1 text-[13px] font-medium break-words opacity-90">
                      {word.el}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleKnown(word.en)}
                    aria-pressed={isKnown}
                    aria-label={
                      isKnown
                        ? `Αφαίρεση του ${word.en} από τις μαθημένες`
                        : `Σημείωση του ${word.en} ως μαθημένη`
                    }
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[12px] press ${
                      isKnown
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  >
                    {isKnown ? <Check size={14} /> : "+"}
                  </button>
                </div>
                <div className="mt-3 overflow-hidden rounded-[10px] border border-zinc-100 bg-zinc-50 p-2.5 text-[12px] leading-[1.5] italic break-words opacity-80 dark:border-zinc-700/60 dark:bg-zinc-800/60">
                  &ldquo;{word.sent}&rdquo;
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] opacity-60">
                  {attempt && (
                    <>
                      <span className="flex items-center gap-1">
                        <Check size={12} /> {attempt.c}
                      </span>
                      <span className="flex items-center gap-1">
                        <X size={12} /> {attempt.w}
                      </span>
                    </>
                  )}
                  {hint && <span>{hint}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
