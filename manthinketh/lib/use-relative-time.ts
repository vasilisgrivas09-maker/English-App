"use client";

import { useEffect, useReducer } from "react";
import { formatRelativeTime } from "./storage";

/** «πριν 2 λεπτά» — ανανεώνεται μόνο του κάθε 30 δευτερόλεπτα. */
export function useRelativeTime(timestamp: number | null) {
  const [, tick] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    if (!timestamp) return;
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [timestamp]);

  return formatRelativeTime(timestamp);
}
