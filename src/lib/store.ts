"use client";

import type Lenis from "lenis";
import { useSyncExternalStore } from "react";

/* ---------- Lenis instance ---------- */
let lenis: Lenis | null = null;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};
export const getLenis = () => lenis;

/* ---------- Page ready signal ----------
 * false while the preloader or a page transition covers the screen,
 * true once the page is revealed. Intro animations wait for it.
 */
let ready = false;
const subscribers = new Set<() => void>();
const subscribe = (cb: () => void) => {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
};
export const getPageReady = () => ready;
export const setPageReady = (value: boolean) => {
  if (ready === value) return;
  ready = value;
  subscribers.forEach((cb) => cb());
};
export function usePageReady() {
  return useSyncExternalStore(subscribe, getPageReady, () => false);
}

/* ---------- Shared mutable state for WebGL (read inside useFrame) ---------- */
export const heroState = { progress: 0 };

/** Written by the hero scene when the pointer is over the portrait silhouette; read by the cursor. */
export const cursorBus = { lens: false };
