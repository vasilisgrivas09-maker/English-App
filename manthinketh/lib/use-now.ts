"use client";

import { useSyncExternalStore } from "react";
import { createClientStore } from "./client-store";

const store = createClientStore(() => Date.now(), 0);

if (typeof window !== "undefined") {
  window.setInterval(() => store.set(Date.now()), 60_000);
}

/** Σταθερό «τώρα» που ανανεώνεται κάθε λεπτό. */
export function useNow() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
