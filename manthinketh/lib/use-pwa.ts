"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createClientStore } from "./client-store";

/**
 * Ανιχνεύει αν η εφαρμογή τρέχει εγκατεστημένη και δηλώνει τον service worker.
 * Δεν εμφανίζεται banner εγκατάστασης — η προσθήκη στην αρχική οθόνη γίνεται
 * από το μενού του browser.
 */
const standaloneStore = createClientStore<boolean>(() => {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}, false);

export function usePwa() {
  const isStandalone = useSyncExternalStore(
    standaloneStore.subscribe,
    standaloneStore.getSnapshot,
    standaloneStore.getServerSnapshot,
  );

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const onChange = () => standaloneStore.set(media.matches);
    media.addEventListener("change", onChange);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => media.removeEventListener("change", onChange);
  }, []);

  return { isStandalone };
}
