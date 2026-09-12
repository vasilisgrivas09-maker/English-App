"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createClientStore } from "./client-store";
import { STORAGE_KEYS, readRaw, writeRaw } from "./storage";

export type Theme = "light" | "dark";

/**
 * Το inline script στο layout έχει ήδη βάλει την κλάση `dark` πριν το πρώτο paint.
 * Εδώ απλώς διαβάζουμε την ίδια πηγή αλήθειας.
 */
function loadTheme(): Theme {
  const stored = readRaw(STORAGE_KEYS.theme);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const store = createClientStore<Theme>(loadTheme, "light");

export function useTheme() {
  const theme = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#0a0a0b" : "#0f5132");
    writeRaw(STORAGE_KEYS.theme, next);
    store.set(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(store.getSnapshot() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
