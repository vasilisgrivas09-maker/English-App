"use client";

import { CalendarClock, Moon, Settings, Sun, Trophy } from "lucide-react";
import { CATEGORY_TOTALS } from "@/lib/words";
import { BrandMark } from "./brand-mark";

type Props = {
  learnedCount: number;
  totalWords: number;
  dueCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  isStandalone: boolean;
};

export function SiteHeader({
  learnedCount,
  totalWords,
  dueCount,
  isDark,
  onToggleTheme,
  onOpenSettings,
  isStandalone,
}: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-paper/80 pt-safe backdrop-blur-xl dark:border-zinc-800/80 dark:bg-ink/80">
      <div className="mx-auto flex h-[60px] w-full max-w-[1280px] min-w-0 items-center justify-between gap-2 px-safe md:h-[68px] md:px-6">
        <div className="flex min-w-0 shrink items-center gap-2.5 md:gap-3">
          <BrandMark size={38} />
          <div className="min-w-0 leading-none">
            <div className="flex items-center gap-1.5 truncate text-[14px] font-semibold tracking-tight md:text-[15px]">
              <span lang="en">As a Man Thinketh</span>
              {isStandalone && (
                <span className="rounded-full border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-brand-700 dark:border-brand-700/60 dark:bg-brand-900/60 dark:text-brand-300">
                  APP
                </span>
              )}
            </div>
            <div className="mt-[3px] truncate text-[10px] font-medium tracking-[0.14em] uppercase opacity-55 md:text-[11px]">
              ΒΙΒΛΙΟ ΑΣΚΗΣΕΩΝ
            </div>
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 md:gap-3">
          <div className="hidden min-w-0 items-center gap-3 rounded-full border border-zinc-200 bg-white/70 py-1.5 pr-3 pl-4 md:flex dark:border-zinc-800 dark:bg-zinc-900/70">
            <span className="flex min-w-0 items-center gap-2">
              <Trophy size={14} className="text-gold-500" />
              <span className="text-[13px] font-semibold tabular-nums">
                {learnedCount} / {totalWords}
              </span>
            </span>
            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff4d2e]" />
              <span className="text-[11px] tabular-nums">{CATEGORY_TOTALS[1]}</span>
              <span className="ml-1 h-2 w-2 rounded-full bg-[#2563eb]" />
              <span className="text-[11px] tabular-nums">{CATEGORY_TOTALS[2]}</span>
              <span className="ml-1 h-2 w-2 rounded-full bg-brand-500" />
              <span className="text-[11px] tabular-nums">{CATEGORY_TOTALS[3]}</span>
            </span>
          </div>

          {dueCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-gold-300/70 bg-gold-300/15 px-2.5 py-1.5 text-[11px] font-semibold text-gold-500 dark:border-gold-500/40 dark:text-gold-300">
              <CalendarClock size={13} />
              <span className="tabular-nums">{dueCount}</span>
              <span className="hidden xs:inline">για σήμερα</span>
            </span>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white/70 press transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:bg-zinc-800"
            title="Διαχείριση προόδου"
            aria-label="Διαχείριση προόδου"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white/70 press transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:bg-zinc-800"
            title={isDark ? "Φωτεινό θέμα" : "Σκοτεινό θέμα"}
            aria-label={isDark ? "Εναλλαγή σε φωτεινό θέμα" : "Εναλλαγή σε σκοτεινό θέμα"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2 overflow-hidden px-safe pb-2.5 md:hidden">
        <span className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-medium text-brand-700 dark:border-brand-700/50 dark:bg-brand-900/50 dark:text-brand-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
          τοπικά
        </span>
        <span className="flex min-w-0 shrink items-center gap-1.5 text-[12px]">
          <Trophy size={12} className="shrink-0 text-gold-500" />
          <span className="font-semibold tabular-nums">
            {learnedCount}/{totalWords}
          </span>
          <span className="hidden truncate opacity-55 xs:inline">έμαθες</span>
        </span>
        <span className="flex shrink-0 gap-1">
          <span className="rounded-full bg-[#ff4d2e] px-2 py-1 text-[10px] font-bold text-white tabular-nums">
            Έ {CATEGORY_TOTALS[1]}
          </span>
          <span className="rounded-full bg-[#2563eb] px-2 py-1 text-[10px] font-bold text-white tabular-nums">
            Μ {CATEGORY_TOTALS[2]}
          </span>
          <span className="rounded-full bg-brand-500 px-2 py-1 text-[10px] font-bold text-white tabular-nums">
            Ε {CATEGORY_TOTALS[3]}
          </span>
        </span>
      </div>
    </header>
  );
}
