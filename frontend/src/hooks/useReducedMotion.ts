import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (callback: () => void): (() => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

const getSnapshot = (): boolean => window.matchMedia(QUERY).matches;

// True when the visitor prefers reduced motion (re-renders on change).
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
