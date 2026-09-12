/**
 * Έλεγχος ποιότητας δεδομένων: κάθε λέξη πρέπει να εντοπίζεται στην πρότασή της
 * (αλλιώς δεν παράγεται άσκηση «συμπλήρωσε το κενό») και οι ασκήσεις να είναι σωστές.
 * Τρέξε το με: npm run check:data
 */
import { LESSONS, blankSentence } from "../lib/exercises";
import { ALL_WORDS, CATEGORY_TOTALS } from "../lib/words";

let failures = 0;

const duplicates = ALL_WORDS.map((w) => w.en).filter((en, i, all) => all.indexOf(en) !== i);
if (duplicates.length > 0) {
  failures += 1;
  console.error(`✗ Διπλές λέξεις: ${[...new Set(duplicates)].join(", ")}`);
}

const unblankable = ALL_WORDS.filter((w) => blankSentence(w.sent, w.en) === null);
console.log(
  `Λέξεις χωρίς εντοπισμό στην πρόταση: ${unblankable.length}` +
    (unblankable.length ? ` → ${unblankable.map((w) => w.en).join(", ")}` : ""),
);

const brokenFill = LESSONS.flatMap((lesson) => lesson.exercises).filter(
  (exercise) => exercise.type === "fill" && blankSentence(exercise.word.sent, exercise.word.en) === null,
);
if (brokenFill.length > 0) {
  failures += 1;
  console.error(`✗ Ασκήσεις κενού χωρίς κενό: ${brokenFill.map((e) => e.word.en).join(", ")}`);
}

const covered = new Set(LESSONS.flatMap((lesson) => lesson.words.map((word) => word.en)));
if (covered.size !== ALL_WORDS.length) {
  failures += 1;
  console.error(`✗ Λέξεις εκτός μαθημάτων: ${ALL_WORDS.length - covered.size}`);
}

for (const lesson of LESSONS) {
  const bad = lesson.exercises.filter(
    (exercise) => exercise.type === "mc" && !exercise.options?.includes(exercise.correct),
  );
  if (bad.length > 0) {
    failures += 1;
    console.error(`✗ Μάθημα ${lesson.id + 1}: σωστή απάντηση εκτός επιλογών (${bad.length})`);
  }
}

console.log(
  `Σύνολο: ${ALL_WORDS.length} λέξεις (Cat1 ${CATEGORY_TOTALS[1]} / Cat2 ${CATEGORY_TOTALS[2]} / Cat3 ${CATEGORY_TOTALS[3]}), ` +
    `${LESSONS.length} μαθήματα, ${LESSONS.reduce((sum, l) => sum + l.exercises.length, 0)} ασκήσεις`,
);

if (failures > 0) {
  console.error(`\n${failures} έλεγχοι απέτυχαν`);
  process.exit(1);
}
console.log("✓ Όλοι οι έλεγχοι πέρασαν");
