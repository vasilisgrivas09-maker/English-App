/**
 * Μικροσκοπικό external store για κατάσταση που ζει μόνο στον browser
 * (localStorage, matchMedia, navigator). Το διαβάζουμε με useSyncExternalStore
 * ώστε το SSR/hydration να χρησιμοποιεί το server snapshot και μετά να γίνεται
 * ένα καθαρό re-render με τα πραγματικά δεδομένα της συσκευής.
 */
export type ClientStore<T> = {
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  set: (updater: T | ((previous: T) => T)) => void;
};

export function createClientStore<T>(load: () => T, serverSnapshot: T): ClientStore<T> {
  let snapshot: T | undefined;
  let loaded = false;
  let nudged = false;
  const listeners = new Set<() => void>();

  const getSnapshot = () => {
    if (!loaded) {
      snapshot = load();
      loaded = true;
    }
    return snapshot as T;
  };

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      // Στο hydration render το React κρατάει το server snapshot. Μια ειδοποίηση
      // αμέσως μετά το πρώτο subscribe το κάνει να ξαναδιαβάσει τα πραγματικά
      // δεδομένα της συσκευής και να ξανασχεδιάσει μία φορά.
      if (!nudged) {
        nudged = true;
        queueMicrotask(notify);
      }
      return () => {
        listeners.delete(listener);
      };
    },
    set: (updater) => {
      const previous = getSnapshot();
      const next = typeof updater === "function" ? (updater as (p: T) => T)(previous) : updater;
      if (Object.is(next, previous)) return;
      snapshot = next;
      notify();
    },
  };
}
