"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  align?: "sheet" | "center";
  zIndex?: string;
  children: React.ReactNode;
};

/**
 * Ελαφρύ modal: κλείνει με Escape ή κλικ στο backdrop, κλειδώνει το scroll
 * και κρατάει το focus μέσα του με Tab cycling.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  className = "max-w-[520px]",
  align = "sheet",
  zIndex = "z-70",
  children,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex justify-center p-3 md:p-6 ${
        align === "sheet" ? "items-end md:items-center" : "items-center"
      }`}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative w-full animate-pop-in overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-2xl md:rounded-[24px] dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
