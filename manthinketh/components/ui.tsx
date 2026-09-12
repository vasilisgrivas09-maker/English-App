"use client";

import { CATEGORY_META, type Category } from "@/lib/words";

export function CategoryBadge({ cat }: { cat: Category }) {
  const meta = CATEGORY_META[cat] ?? CATEGORY_META[3];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

export function ProgressRing({ value, size = 52 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90 transform" aria-hidden="true" focusable="false">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        className="text-zinc-200 dark:text-zinc-800"
        strokeWidth={4}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        className="text-brand-600 transition-all duration-700 dark:text-brand-300"
        strokeWidth={4}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Progressbar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-brand-600 transition-all duration-700 dark:bg-brand-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function ViewSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="skeleton h-36 rounded-[20px]" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="skeleton h-44 rounded-[18px]" />
        <div className="skeleton h-44 rounded-[18px]" />
        <div className="hidden h-44 rounded-[18px] skeleton md:block" />
      </div>
    </div>
  );
}

const CONFETTI = ["✦", "✧", "•", "★", "·"] as const;

/** Μικρή έκρηξη συμβόλων μετά από σωστή απάντηση. Σταματάει μόνη της. */
export function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {CONFETTI.map((mark, index) => (
        <span
          key={index}
          className="animate-confetti absolute bottom-6 left-1/2 text-[13px] text-gold-400"
          style={{
            ["--i" as string]: index,
            ["--dx" as string]: `${(index - 2) * 28}px`,
            ["--rot" as string]: `${(index - 2) * 18}deg`,
          }}
        >
          {mark}
        </span>
      ))}
    </div>
  );
}
