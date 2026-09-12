"use client";

import { Check, ChevronRight, Lightbulb, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EXERCISE_LABEL,
  blankOut,
  effortFor,
  isCorrect as evaluate,
  type Exercise,
} from "@/lib/exercises";
import { newCard, nextReviewLabel, qualityFor, review, type SrsCard } from "@/lib/srs";
import { CategoryBadge, ConfettiBurst } from "./ui";

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    synth.speak(utterance);
  } catch {
    // Η εκφώνηση είναι προαιρετική — αν δεν υποστηρίζεται, απλώς δεν κάνει τίποτα.
  }
}

type Props = {
  exercise: Exercise;
  isLast: boolean;
  isMastered: boolean;
  srsCard?: SrsCard;
  onToggleMastered: () => void;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
};

export function ExerciseRunner({
  exercise,
  isLast,
  isMastered,
  srsCard,
  onToggleMastered,
  onAnswered,
  onNext,
}: Props) {
  const [typed, setTyped] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [reviewHint, setReviewHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Ο γονέας δίνει key={exercise.id}, άρα κάθε άσκηση ξεκινά με καθαρό state.
  useEffect(() => {
    if (exercise.type === "mc") return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [exercise.type]);

  useEffect(() => {
    if (!checked) return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [checked]);

  const canSubmit = exercise.type === "mc" ? Boolean(selected) : typed.trim().length > 0;

  const check = useCallback(() => {
    if (checked || !canSubmit) return;
    const result = evaluate(exercise, typed, selected);
    const next = review(srsCard ?? newCard(), qualityFor(result, effortFor(exercise.type)));
    setCorrect(result);
    setChecked(true);
    setReviewHint(nextReviewLabel(next));
    onAnswered(result);
  }, [canSubmit, checked, exercise, onAnswered, selected, srsCard, typed]);

  // Πλήρης χειρισμός από πληκτρολόγιο: 1-4 για επιλογή, Enter για έλεγχο/επόμενο.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Όσο είναι ανοιχτό modal, το πληκτρολόγιο ανήκει σε εκείνο.
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === "Enter") {
        event.preventDefault();
        if (checked) onNext();
        else check();
        return;
      }
      if (exercise.type !== "mc" || checked) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < (exercise.options?.length ?? 0)) {
        event.preventDefault();
        setSelected(exercise.options![index]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [check, checked, exercise.options, exercise.type, onNext]);

  const sentence = exercise.word.sent;

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-[20px] border border-zinc-200 bg-white md:rounded-[28px] dark:border-zinc-800 dark:bg-zinc-900">
      {checked && correct && <ConfettiBurst />}
      <div className="min-w-0 p-4 md:p-8">
        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-2 md:mb-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CategoryBadge cat={exercise.word.cat} />
            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] break-words dark:border-zinc-700 dark:bg-zinc-800">
              {EXERCISE_LABEL[exercise.type]}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleMastered}
            aria-pressed={isMastered}
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium ${
              isMastered
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            }`}
          >
            {isMastered ? "✓ Γνωστή" : "Σημείωσε ως γνωστή"}
          </button>
        </div>

        {exercise.type === "mc" && (
          <>
            <div className="mb-5 min-w-0 md:mb-6">
              <div className="mb-2 text-[13px] font-semibold tracking-wide uppercase opacity-60">
                Πώς μεταφράζεται;
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[26px] leading-none font-bold tracking-tight break-words md:text-[30px]">
                  {exercise.word.en}
                </div>
                <button
                  type="button"
                  onClick={() => speak(exercise.word.en)}
                  aria-label={`Άκου την προφορά: ${exercise.word.en}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  <Volume2 size={14} />
                </button>
              </div>
              <div className="mt-3 overflow-hidden rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-[13px] leading-[1.5] italic break-words md:text-[14px] dark:border-zinc-700 dark:bg-zinc-800/60">
                &ldquo;{sentence}&rdquo;
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-2.5 md:grid-cols-2">
              {exercise.options?.map((option, index) => {
                const isSelected = selected === option;
                const isAnswer = option === exercise.correct;
                let tone =
                  "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600";
                if (checked) {
                  if (isAnswer) {
                    tone =
                      "bg-[#ecfdf5] dark:bg-[#0f221c] border-[#10b981] text-[#065f46] dark:text-[#a7f3d0]";
                  } else if (isSelected) {
                    tone =
                      "bg-[#fff1ee] dark:bg-[#2a1511] border-[#ff4d2e] text-[#7f1d1d] dark:text-[#fecaca]";
                  }
                } else if (isSelected) {
                  tone = "bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 dark:border-white";
                }
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={checked}
                    onClick={() => setSelected(option)}
                    className={`flex h-auto min-h-[52px] w-full min-w-0 items-center justify-between gap-2 rounded-[14px] border px-4 py-3 text-left text-[14px] font-medium break-words transition ${tone}`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <kbd className="hidden h-5 w-5 shrink-0 place-items-center rounded-[6px] border border-current text-[10px] opacity-40 md:grid">
                        {index + 1}
                      </kbd>
                      <span className="min-w-0 break-words">{option}</span>
                    </span>
                    {checked && isAnswer && <Check size={18} className="ml-2 shrink-0" />}
                    {checked && isSelected && !isAnswer && <X size={18} className="ml-2 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {exercise.type === "fill" && (
          <>
            <div className="mb-5 min-w-0 md:mb-6">
              <div className="mb-2 text-[13px] font-semibold tracking-wide uppercase opacity-60">
                Συμπλήρωσε το κενό με την αγγλική λέξη
              </div>
              <div className="overflow-hidden rounded-[16px] border border-zinc-200 bg-zinc-50 p-3 text-[15px] leading-[1.6] break-words md:p-4 md:text-[16px] dark:border-zinc-700 dark:bg-zinc-800/60">
                {checked ? sentence : blankOut(sentence, exercise.word.en)}
              </div>
              <div className="mt-3 flex min-w-0 items-center gap-2 text-[12px] break-words opacity-70">
                <Lightbulb size={14} className="shrink-0" /> Υπόδειξη:
                <span className="font-medium break-words">{exercise.word.el}</span>
              </div>
            </div>
            <AnswerInput ref={inputRef} value={typed} onChange={setTyped} disabled={checked} />
          </>
        )}

        {exercise.type === "type" && (
          <>
            <div className="mb-5 min-w-0 md:mb-6">
              <div className="mb-2 text-[13px] font-semibold tracking-wide uppercase opacity-60">
                Μετάφρασε στα Αγγλικά
              </div>
              <div className="text-[26px] font-bold tracking-tight break-words md:text-[30px]">
                {exercise.word.el}
              </div>
              <div className="mt-2 text-[12px] break-words opacity-70 md:text-[13px]">
                Γράψε τη μετάφραση στα αγγλικά χωρίς να κοιτάξεις τη λύση
              </div>
              <div className="mt-3 overflow-hidden rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-[13px] leading-[1.5] italic break-words md:text-[14px] dark:border-zinc-700 dark:bg-zinc-800/60">
                &ldquo;{checked ? sentence : blankOut(sentence, exercise.word.en)}&rdquo;
              </div>
            </div>
            <AnswerInput ref={inputRef} value={typed} onChange={setTyped} disabled={checked} />
          </>
        )}

        {checked && (
          <div
            ref={resultRef}
            className={`relative mt-5 min-w-0 animate-pop-in overflow-hidden rounded-[16px] border p-4 ${
              correct
                ? "border-[#a7f3d0] bg-[#ecfdf5] dark:border-[#1a3d31] dark:bg-[#0f221c]"
                : "border-[#fed7aa] bg-[#fff7ed] dark:border-[#4a211c] dark:bg-[#2a1511]"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                  correct ? "bg-[#10b981] text-white" : "bg-[#ff4d2e] text-white"
                }`}
              >
                {correct ? <Check size={16} /> : <X size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">
                  {correct ? "Σωστά! Μπράβο." : "Όχι ακριβώς."}
                  {reviewHint && (
                    <span className="ml-2 font-medium opacity-70">· {reviewHint}</span>
                  )}
                </div>
                <div className="mt-1 text-[13px] leading-[1.5] break-words">
                  {exercise.type === "mc" ? (
                    <>
                      <span className="font-semibold">{exercise.word.en}</span> σημαίνει{" "}
                      <span className="font-semibold">{exercise.correct}</span>.
                    </>
                  ) : (
                    <>
                      Η σωστή απάντηση είναι{" "}
                      <span className="font-mono font-semibold">{exercise.correct}</span> (
                      {exercise.word.el}).
                    </>
                  )}
                  <div className="mt-2 flex items-center gap-2 italic opacity-80">
                    <span className="break-words">&ldquo;{sentence}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => speak(sentence)}
                      aria-label="Άκου την πρόταση"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current/20 bg-white/60 not-italic dark:bg-black/20"
                    >
                      <Volume2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex justify-end p-3 md:p-4">
        {!checked ? (
          <button
            type="button"
            onClick={check}
            disabled={!canSubmit}
            className="h-10 rounded-full bg-zinc-900 px-6 text-[13px] font-medium text-white press transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 md:h-11 md:text-[14px] dark:bg-white dark:text-black"
          >
            Έλεγχος
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            autoFocus
            className="glow-gold flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-6 text-[13px] font-medium text-white press transition hover:opacity-90 md:h-11 md:text-[14px] dark:bg-white dark:text-black"
          >
            {isLast ? "Ολοκλήρωση" : "Επόμενο"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function AnswerInput({
  ref,
  value,
  onChange,
  disabled,
}: {
  ref: React.Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder="Γράψε την αγγλική λέξη..."
      aria-label="Η απάντησή σου"
      className="h-[52px] w-full min-w-0 rounded-[14px] border border-zinc-300 bg-white px-4 text-[15px] transition outline-none focus:border-zinc-900 disabled:opacity-60 md:h-[54px] dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-white"
    />
  );
}
