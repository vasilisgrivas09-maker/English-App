import { isDue, weakness, type SrsCard, type SrsDeck } from "./srs";
import {
  ALL_WORDS,
  CAT1,
  CAT2,
  CAT3,
  LESSON_SPLIT,
  LESSON_TITLES,
  type CategorizedWord,
  type Category,
} from "./words";

export type ExerciseType = "mc" | "fill" | "type";

export type Exercise = {
  id: string;
  type: ExerciseType;
  word: CategorizedWord;
  options?: string[];
  correct: string;
};

export type Lesson = {
  id: number;
  title: string;
  words: CategorizedWord[];
  exercises: Exercise[];
};

export type Attempt = { c: number; w: number };
export type Attempts = Record<string, Attempt>;

/**
 * Deterministic PRNG. Τα μαθήματα πρέπει να παράγονται ίδια σε server και client
 * (αλλιώς σπάει το hydration) και ίδια σε κάθε session, ώστε το αποθηκευμένο
 * index άσκησης να δείχνει πραγματικά στην ίδια άσκηση.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const BLANK = "_____";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** «co-operators» ↔ «cooperators», «Long-cherished» ↔ «long cherished». */
function loosePattern(token: string) {
  return escapeRegExp(token).replace(/[-\s]+/g, "[-\\s]*");
}

/** Το βιβλίο χρησιμοποιεί κλιτούς τύπους: Nourishing → nourished, Cease → ceases. */
function stemPattern(token: string) {
  const stem = token.replace(/(ing|ed|es|s|e)$/i, "");
  if (stem.length < 4) return null;
  return `${escapeRegExp(stem)}\\w*`;
}

function replaceFirstMatch(sentence: string, pattern: string): string | null {
  let regex: RegExp;
  try {
    regex = new RegExp(`(^|[^\\p{L}])(${pattern})(?![\\p{L}])`, "giu");
  } catch {
    return null;
  }
  if (!regex.test(sentence)) return null;
  regex.lastIndex = 0;
  return sentence.replace(regex, (_match, prefix) => `${prefix}${BLANK}`);
}

/**
 * Κρύβει τη λέξη-στόχο μέσα στην πρόταση. Επιστρέφει null όταν η λέξη δεν
 * εντοπίζεται καθόλου — τότε η άσκηση «συμπλήρωσε το κενό» δεν έχει νόημα.
 */
export function blankSentence(sentence: string, word: string): string | null {
  const target = word.trim();
  if (!target) return null;

  const whole = replaceFirstMatch(sentence, loosePattern(target));
  if (whole) return whole;

  // Ίδια ρίζα με κατάληξη: «Bid» → «bids», «Steer» → «steers».
  const inflected = replaceFirstMatch(sentence, `${loosePattern(target)}\\w*`);
  if (inflected) return inflected;

  const tokens = target.split(/\s+/).filter(Boolean);

  // Φράσεις: κρύβουμε κάθε κομμάτι που βρίσκουμε (π.χ. «bind ... down»).
  if (tokens.length > 1) {
    let result = sentence;
    let hits = 0;
    for (const token of tokens) {
      const exact = replaceFirstMatch(result, loosePattern(token));
      const stem = exact ?? (stemPattern(token) ? replaceFirstMatch(result, stemPattern(token)!) : null);
      if (stem) {
        result = stem;
        hits += 1;
      }
    }
    if (hits > 0) return result;
  }

  const stem = stemPattern(target);
  return stem ? replaceFirstMatch(sentence, stem) : null;
}

export function blankOut(sentence: string, word: string): string {
  return blankSentence(sentence, word) ?? sentence;
}

export function canBlank(sentence: string, word: string): boolean {
  return blankSentence(sentence, word) !== null;
}

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isCorrect(exercise: Exercise, typed: string, selected: string | null) {
  if (exercise.type === "mc") return selected === exercise.correct;
  return normalizeAnswer(typed) === normalizeAnswer(exercise.correct);
}

function distractors(word: CategorizedWord, rand: () => number) {
  const sameCategory = ALL_WORDS.filter((w) => w.cat === word.cat && w.en !== word.en);
  const picked = shuffle(sameCategory, rand)
    .slice(0, 3)
    .map((w) => w.el);
  return shuffle([word.el, ...picked], rand);
}

function exercisesForWord(word: CategorizedWord, suffix: string, rand: () => number): Exercise[] {
  const list: Exercise[] = [
    {
      id: `${word.en}-mc-${suffix}`,
      type: "mc",
      word,
      options: distractors(word, rand),
      correct: word.el,
    },
  ];
  const fillable = canBlank(word.sent, word.en);
  if ((word.cat === 1 || word.cat === 2) && fillable) {
    list.push({ id: `${word.en}-fill-${suffix}`, type: "fill", word, correct: word.en });
  }
  // Αν η λέξη δεν εμφανίζεται στην πρόταση, δίνουμε EL→EN αντί για κενό χωρίς κενό.
  if (word.cat === 1 || (word.cat === 2 && !fillable)) {
    list.push({ id: `${word.en}-type-${suffix}`, type: "type", word, correct: word.en });
  }
  return list;
}

/** Τα 12 μαθήματα. Σταθερά, cache-αρισμένα σε module level. */
export const LESSONS: Lesson[] = (() => {
  const rand = mulberry32(20250912);
  const pools: Record<Category, CategorizedWord[]> = {
    1: CAT1.map((w) => ({ ...w, cat: 1 as const })),
    2: CAT2.map((w) => ({ ...w, cat: 2 as const })),
    3: CAT3.map((w) => ({ ...w, cat: 3 as const })),
  };
  const cursor: Record<Category, number> = { 1: 0, 2: 0, 3: 0 };

  return LESSON_TITLES.map((title, index) => {
    const words: CategorizedWord[] = [];
    for (const cat of [1, 2, 3] as Category[]) {
      const take = LESSON_SPLIT[cat][index];
      words.push(...pools[cat].slice(cursor[cat], cursor[cat] + take));
      cursor[cat] += take;
    }
    const exercises = words.flatMap((word) => exercisesForWord(word, String(index), rand));
    return { id: index, title, words, exercises: shuffle(exercises, rand) };
  });
})();

export const REVIEW_SIZE = 20;

/**
 * Μία άσκηση ανά λέξη, με δυσκολία που ανεβαίνει όσο ωριμάζει η κάρτα:
 * αναγνώριση → συμπλήρωση κενού → ελεύθερη ανάκληση.
 */
function exerciseForCard(word: CategorizedWord, card: SrsCard | undefined): Exercise {
  const reps = card?.reps ?? 0;
  const fillable = canBlank(word.sent, word.en);

  if (reps >= 3 || (reps >= 2 && !fillable)) {
    return { id: `${word.en}-type-r`, type: "type", word, correct: word.en };
  }
  if (reps >= 1 && fillable) {
    return { id: `${word.en}-fill-r`, type: "fill", word, correct: word.en };
  }
  return {
    id: `${word.en}-mc-r`,
    type: "mc",
    word,
    options: distractors(word, Math.random),
    correct: word.el,
  };
}

export type ReviewSession = {
  exercises: Exercise[];
  /** Πόσες από τις λέξεις της συνεδρίας ήταν πραγματικά προγραμματισμένες για σήμερα. */
  dueCount: number;
};

/**
 * Χτίζει τη συνεδρία επανάληψης: πρώτα ό,τι έχει προγραμματίσει το SM-2 για
 * σήμερα, και αν περισσεύει χώρος συμπληρώνει με τις πιο αδύναμες λέξεις.
 */
export function buildReviewSession(srs: SrsDeck, limit = REVIEW_SIZE): ReviewSession {
  const now = Date.now();

  const due = ALL_WORDS.filter((word) => isDue(srs[word.en], now)).sort(
    (a, b) => (srs[a.en]?.due ?? 0) - (srs[b.en]?.due ?? 0),
  );

  const picked = due.slice(0, limit);
  const dueCount = picked.length;

  if (picked.length < limit) {
    const chosen = new Set(picked.map((word) => word.en));
    const filler = ALL_WORDS.filter((word) => !chosen.has(word.en)).sort(
      (a, b) => weakness(srs[b.en], now) - weakness(srs[a.en], now),
    );
    picked.push(...filler.slice(0, limit - picked.length));
  }

  return {
    exercises: shuffle(picked).map((word) => exerciseForCard(word, srs[word.en])),
    dueCount,
  };
}

/** Οι ασκήσεις πληκτρολόγησης απαιτούν ενεργητική ανάκληση, οι επιλογές μόνο αναγνώριση. */
export function effortFor(type: ExerciseType): "recognition" | "recall" {
  return type === "mc" ? "recognition" : "recall";
}

export const EXERCISE_LABEL: Record<ExerciseType, string> = {
  mc: "Μετάφραση EN→EL",
  fill: "Συμπλήρωση κενού",
  type: "Μετάφραση EL→EN",
};
