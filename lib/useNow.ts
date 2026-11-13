"use client";

import { useSyncExternalStore } from "react";

let currentNow = 0;
const subscribers = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function updateNow() {
  currentNow = Date.now();
  subscribers.forEach((callback) => callback());
}

function subscribe(callback: () => void) {
  subscribers.add(callback);

  if (subscribers.size === 1) {
    setTimeout(updateNow, 0);
    intervalId = setInterval(updateNow, 60000);
  } else if (currentNow === 0) {
    setTimeout(updateNow, 0);
  }

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot() {
  return currentNow;
}

function getServerSnapshot() {
  return 0;
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

