"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useNow } from "./use-now";
import { createClientStore } from "./client-store";
import type { Attempts } from "./exercises";
import {
  coerceAttempts,
  coerceLessonProgress,
  readRaw,
  removeRaw,
  STORAGE_KEYS,
  writeRaw,
  type CurrentLesson,
  type LessonProgress,
  type ProgressSnapshot,
} from "./storage";
import {
  coerceDeck,
  isDue,
  isLearned,
  newCard,
  qualityFor,
  review,
  type SrsDeck,
} from "./srs";
import { ALL_WORDS } from "./words";

export type ProgressState = {
  /** Λέξεις που ο χρήστης σήμανε χειροκίνητα ως γνωστές. */
  manualKnown: Set<string>;
  attempts: Attempts;
  srs: SrsDeck;
  lessonProgress: LessonProgress;
  currentLesson: CurrentLesson;
  lastSaved: number | null;
  /** true μόνο στην πρώτη φόρτωση, αν βρέθηκε αποθηκευμένη πρόοδος. */
  restored: boolean;
};

const EMPTY: ProgressState = {
  manualKnown: new Set<string>(),
  attempts: {},
  srs: {},
  lessonProgress: {},
  currentLesson: { id: null, exIdx: 0 },
  lastSaved: null,
  restored: false,
};

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Παλιότερες εκδόσεις δεν είχαν spaced repetition. Οι λέξεις που είχαν
 * απαντηθεί σωστά μπαίνουν στο πρώτο στάδιο και ζητούν επιβεβαίωση σήμερα.
 */
function migrateToSrs(attempts: Attempts, manualKnown: Set<string>, now: number): SrsDeck {
  const deck: SrsDeck = {};
  const seen = new Set([...Object.keys(attempts), ...manualKnown]);
  for (const en of seen) {
    const attempt = attempts[en];
    const wasCorrect = (attempt?.c ?? 0) > 0 || manualKnown.has(en);
    if (!wasCorrect) continue;
    deck[en] = { ...newCard(now), reps: 1, interval: 1, due: now };
  }
  return deck;
}

function loadFromStorage(): ProgressState {
  const now = Date.now();
  const storedKnown = parse<unknown>(readRaw(STORAGE_KEYS.mastered));
  const attempts = coerceAttempts(parse<unknown>(readRaw(STORAGE_KEYS.attempts)));
  const lessonProgress = coerceLessonProgress(parse<unknown>(readRaw(STORAGE_KEYS.lessonProgress)));
  const currentLesson = parse<Partial<CurrentLesson>>(readRaw(STORAGE_KEYS.currentLesson));
  const lastActive = Number(readRaw(STORAGE_KEYS.lastActive));
  const storedSrs = readRaw(STORAGE_KEYS.srs);

  const manualKnown = new Set<string>(
    Array.isArray(storedKnown)
      ? storedKnown.filter((value): value is string => typeof value === "string")
      : [],
  );

  const srs = storedSrs
    ? coerceDeck(parse<unknown>(storedSrs))
    : migrateToSrs(attempts, manualKnown, now);

  if (!storedSrs && Object.keys(srs).length > 0) {
    writeRaw(STORAGE_KEYS.srs, JSON.stringify(srs));
  }

  return {
    manualKnown,
    attempts,
    srs,
    lessonProgress,
    currentLesson: {
      id: typeof currentLesson?.id === "number" ? currentLesson.id : null,
      exIdx: typeof currentLesson?.exIdx === "number" ? currentLesson.exIdx : 0,
    },
    lastSaved: Number.isFinite(lastActive) && lastActive > 0 ? lastActive : null,
    restored:
      manualKnown.size > 0 ||
      Object.keys(attempts).length > 0 ||
      Object.keys(lessonProgress).length > 0 ||
      Object.keys(srs).length > 0,
  };
}

const store = createClientStore<ProgressState>(loadFromStorage, EMPTY);

function persist(state: ProgressState): ProgressState {
  const lastSaved = Date.now();
  writeRaw(STORAGE_KEYS.mastered, JSON.stringify([...state.manualKnown]));
  writeRaw(STORAGE_KEYS.attempts, JSON.stringify(state.attempts));
  writeRaw(STORAGE_KEYS.srs, JSON.stringify(state.srs));
  writeRaw(STORAGE_KEYS.lessonProgress, JSON.stringify(state.lessonProgress));
  writeRaw(STORAGE_KEYS.currentLesson, JSON.stringify(state.currentLesson));
  writeRaw(STORAGE_KEYS.lastActive, String(lastSaved));
  return { ...state, lastSaved };
}

function update(mutate: (previous: ProgressState) => ProgressState) {
  store.set((previous) => persist(mutate(previous)));
}

export function useProgress() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  /** Μια λέξη μετράει ως μαθημένη όταν πέρασε δύο διαστήματα SM-2 ή σημάνθηκε χειροκίνητα. */
  const learned = useMemo(() => {
    const set = new Set(state.manualKnown);
    for (const [en, card] of Object.entries(state.srs)) {
      if (isLearned(card)) set.add(en);
    }
    return set;
  }, [state.manualKnown, state.srs]);

  const now = useNow();

  const dueCount = useMemo(() => {
    if (!now) return 0;
    return ALL_WORDS.reduce(
      (count, word) => count + (isDue(state.srs[word.en], now) ? 1 : 0),
      0,
    );
  }, [now, state.srs]);

  const setKnown = useCallback((en: string, known: boolean) => {
    update((previous) => {
      const manualKnown = new Set(previous.manualKnown);
      if (known) manualKnown.add(en);
      else manualKnown.delete(en);
      // Το «ξεμαρκάρισμα» επαναφέρει τη λέξη στην κυκλοφορία επαναλήψεων.
      const srs = known
        ? previous.srs
        : { ...previous.srs, [en]: newCard() };
      return { ...previous, manualKnown, srs };
    });
  }, []);

  const recordAttempt = useCallback(
    (en: string, correct: boolean, effort: "recognition" | "recall") => {
      update((previous) => {
        const attempt = previous.attempts[en] ?? { c: 0, w: 0 };
        const card = previous.srs[en] ?? newCard();
        return {
          ...previous,
          attempts: {
            ...previous.attempts,
            [en]: { c: attempt.c + (correct ? 1 : 0), w: attempt.w + (correct ? 0 : 1) },
          },
          srs: { ...previous.srs, [en]: review(card, qualityFor(correct, effort)) },
        };
      });
    },
    [],
  );

  const setLessonProgress = useCallback((lessonId: number, done: number) => {
    update((previous) => ({
      ...previous,
      lessonProgress: { ...previous.lessonProgress, [lessonId]: done },
    }));
  }, []);

  const setCurrentLesson = useCallback((currentLesson: CurrentLesson) => {
    update((previous) => ({ ...previous, currentLesson }));
  }, []);

  const dismissRestored = useCallback(() => {
    store.set((previous) => (previous.restored ? { ...previous, restored: false } : previous));
  }, []);

  const reset = useCallback(() => {
    for (const key of [
      STORAGE_KEYS.mastered,
      STORAGE_KEYS.attempts,
      STORAGE_KEYS.srs,
      STORAGE_KEYS.lessonProgress,
      STORAGE_KEYS.currentLesson,
      STORAGE_KEYS.lastActive,
    ]) {
      removeRaw(key);
    }
    store.set({ ...EMPTY, manualKnown: new Set<string>() });
  }, []);

  const exportSnapshot = useCallback((): ProgressSnapshot => {
    const current = store.getSnapshot();
    return {
      mastered: [...current.manualKnown],
      attempts: current.attempts,
      srs: current.srs,
      lessonProgress: current.lessonProgress,
      currentLesson: current.currentLesson,
      exportedAt: new Date().toISOString(),
      version: 2,
    };
  }, []);

  const importSnapshot = useCallback((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Μη έγκυρο αρχείο");
    const data = input as Partial<ProgressSnapshot>;
    const manualKnown = new Set<string>(
      Array.isArray(data.mastered)
        ? data.mastered.filter((value): value is string => typeof value === "string")
        : [],
    );
    const attempts = coerceAttempts(data.attempts);
    const lessonProgress = coerceLessonProgress(data.lessonProgress);
    const srs = data.srs ? coerceDeck(data.srs) : migrateToSrs(attempts, manualKnown, Date.now());
    if (
      manualKnown.size === 0 &&
      Object.keys(attempts).length === 0 &&
      Object.keys(lessonProgress).length === 0 &&
      Object.keys(srs).length === 0
    ) {
      throw new Error("Το αρχείο δεν περιέχει πρόοδο");
    }
    update((previous) => ({
      ...previous,
      manualKnown,
      attempts,
      srs,
      lessonProgress,
      currentLesson: {
        id: typeof data.currentLesson?.id === "number" ? data.currentLesson.id : null,
        exIdx: typeof data.currentLesson?.exIdx === "number" ? data.currentLesson.exIdx : 0,
      },
    }));
  }, []);

  return {
    ...state,
    learned,
    dueCount,
    setKnown,
    recordAttempt,
    setLessonProgress,
    setCurrentLesson,
    dismissRestored,
    reset,
    exportSnapshot,
    importSnapshot,
  };
}
