import type { Attempts } from "./exercises";
import type { SrsDeck } from "./srs";

export const STORAGE_KEYS = {
  mastered: "amt_mastered",
  attempts: "amt_attempts",
  lessonProgress: "amt_lessonProgress",
  currentLesson: "amt_currentLesson",
  lastActive: "amt_lastActive",
  srs: "amt_srs",
  theme: "amt_theme",
} as const;

export type LessonProgress = Record<number, number>;

export type CurrentLesson = { id: number | null; exIdx: number };

export type ProgressSnapshot = {
  mastered: string[];
  attempts: Attempts;
  lessonProgress: LessonProgress;
  currentLesson: CurrentLesson;
  srs?: SrsDeck;
  exportedAt?: string;
  version?: number;
  totalWords?: number;
};

export function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeRaw(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Παλιότερες εκδόσεις αποθήκευαν { exercisesDone } αντί για σκέτο νούμερο. */
export function coerceLessonProgress(input: unknown): LessonProgress {
  const out: LessonProgress = {};
  if (!input || typeof input !== "object") return out;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const lessonId = Number(key);
    if (!Number.isInteger(lessonId)) continue;
    if (typeof value === "number") {
      out[lessonId] = value;
    } else if (value && typeof value === "object" && typeof (value as { exercisesDone?: unknown }).exercisesDone === "number") {
      out[lessonId] = (value as { exercisesDone: number }).exercisesDone;
    }
  }
  return out;
}

export function coerceAttempts(input: unknown): Attempts {
  const out: Attempts = {};
  if (!input || typeof input !== "object") return out;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const { c, w } = value as { c?: unknown; w?: unknown };
    out[key] = {
      c: typeof c === "number" && c >= 0 ? c : 0,
      w: typeof w === "number" && w >= 0 ? w : 0,
    };
  }
  return out;
}

export function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return "—";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "μόλις τώρα";
  if (seconds < 60) return `πριν ${seconds} δευτ.`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "πριν 1 λεπτό";
  if (minutes < 60) return `πριν ${minutes} λεπτά`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "πριν 1 ώρα";
  if (hours < 24) return `πριν ${hours} ώρες`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "πριν 1 μέρα" : `πριν ${days} μέρες`;
}
