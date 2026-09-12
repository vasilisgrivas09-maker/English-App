/**
 * Spaced repetition κατά SM-2 (SuperMemo 2).
 *
 * Κάθε λέξη κρατά έναν «συντελεστή ευκολίας» (ease factor) και ένα διάστημα σε
 * μέρες. Σωστή απάντηση → το διάστημα μεγαλώνει· λάθος → η λέξη ξαναμπαίνει στην
 * αρχή. Έτσι επαναλαμβάνεις κάθε λέξη λίγο πριν την ξεχάσεις, αντί να θεωρείται
 * «μαθημένη» με μία σωστή απάντηση.
 */

export const DAY_MS = 86_400_000;

/** Ποιότητα ανάκλησης 0-5, όπως στο SM-2. */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export type SrsCard = {
  /** Ease factor. Ξεκινά στο 2.5 και δεν πέφτει κάτω από 1.3. */
  ef: number;
  /** Τρέχον διάστημα επανάληψης σε μέρες. */
  interval: number;
  /** Συνεχόμενες επιτυχημένες επαναλήψεις. */
  reps: number;
  /** Πόσες φορές ξεχάστηκε αφού είχε μαθευτεί. */
  lapses: number;
  /** Πότε πρέπει να ξαναεμφανιστεί (epoch ms). */
  due: number;
  /** Πότε απαντήθηκε τελευταία φορά (epoch ms). */
  last: number;
};

export type SrsDeck = Record<string, SrsCard>;

export const MIN_EF = 1.3;
const START_EF = 2.5;

/** Από πόσες μέρες διαστήματος και πάνω θεωρούμε τη λέξη «μαθημένη». */
export const LEARNED_INTERVAL_DAYS = 7;

export function newCard(now = Date.now()): SrsCard {
  return { ef: START_EF, interval: 0, reps: 0, lapses: 0, due: now, last: 0 };
}

/**
 * Ενημερώνει την κάρτα μετά από μια απάντηση.
 * Τα πρώτα δύο βήματα είναι σταθερά (1 και 6 μέρες) όπως ορίζει το SM-2.
 */
export function review(card: SrsCard, quality: Quality, now = Date.now()): SrsCard {
  const passed = quality >= 3;

  const ef = Math.max(
    MIN_EF,
    card.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  if (!passed) {
    return {
      ef,
      interval: 0,
      reps: 0,
      lapses: card.lapses + (card.reps > 0 ? 1 : 0),
      // Τα λάθη επανέρχονται στην ίδια συνεδρία, με 10 λεπτά χαλάρωση.
      due: now + 10 * 60_000,
      last: now,
    };
  }

  const reps = card.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(card.interval * ef);

  return {
    ef,
    interval,
    reps,
    lapses: card.lapses,
    due: now + interval * DAY_MS,
    last: now,
  };
}

/**
 * Μεταφράζει το αποτέλεσμα μιας άσκησης σε ποιότητα SM-2. Οι ασκήσεις
 * πληκτρολόγησης απαιτούν ενεργητική ανάκληση, άρα αξίζουν παραπάνω.
 */
export function qualityFor(correct: boolean, effort: "recognition" | "recall"): Quality {
  if (!correct) return 2;
  return effort === "recall" ? 5 : 4;
}

export function isLearned(card: SrsCard | undefined): boolean {
  return Boolean(card && card.reps >= 2 && card.interval >= LEARNED_INTERVAL_DAYS);
}

export function isDue(card: SrsCard | undefined, now = Date.now()): boolean {
  return Boolean(card && card.due <= now);
}

/** Ημέρες μέχρι την επόμενη επανάληψη (0 = σήμερα). */
export function daysUntilDue(card: SrsCard, now = Date.now()): number {
  return Math.max(0, Math.ceil((card.due - now) / DAY_MS));
}

export function nextReviewLabel(card: SrsCard | undefined, now = Date.now()): string | null {
  if (!card || card.last === 0) return null;
  const days = daysUntilDue(card, now);
  if (days === 0) return "Ξανά σήμερα";
  if (days === 1) return "Ξανά αύριο";
  return `Ξανά σε ${days} μέρες`;
}

/**
 * Πόσο «αδύναμη» είναι μια λέξη. Μεγαλύτερο = χρειάζεται περισσότερη δουλειά.
 * Χρησιμοποιείται όταν δεν υπάρχουν λέξεις προς επανάληψη σήμερα.
 */
export function weakness(card: SrsCard | undefined, now = Date.now()): number {
  if (!card) return 100;
  const overdueDays = Math.max(0, (now - card.due) / DAY_MS);
  return card.lapses * 10 + (MIN_EF + 1.2 - card.ef) * 8 + overdueDays - card.reps;
}

export function coerceDeck(input: unknown): SrsDeck {
  const deck: SrsDeck = {};
  if (!input || typeof input !== "object") return deck;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const card = value as Partial<SrsCard>;
    const number = (candidate: unknown, fallback: number) =>
      typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallback;
    deck[key] = {
      ef: Math.max(MIN_EF, number(card.ef, START_EF)),
      interval: Math.max(0, number(card.interval, 0)),
      reps: Math.max(0, Math.floor(number(card.reps, 0))),
      lapses: Math.max(0, Math.floor(number(card.lapses, 0))),
      due: number(card.due, Date.now()),
      last: number(card.last, 0),
    };
  }
  return deck;
}
