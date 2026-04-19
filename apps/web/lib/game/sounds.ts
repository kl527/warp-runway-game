"use client";

import { useSyncExternalStore } from "react";

export type SfxId =
  | "hire"
  | "cash"
  | "death"
  | "level_up"
  | "footstep"
  | "coffee"
  | "egg_pickup"
  | "quit_alert"
  | "quit_leave"
  | "fundraise_success"
  | "fundraise_fail"
  | "event_good"
  | "event_bad"
  | "modal_open"
  | "modal_close";

// Some slots reuse existing files until dedicated assets land:
//   - Neutral UI blips (modal_open/close, event_good) reuse footstep.wav.
//   - Negative ticks (quit_leave, event_bad) reuse fundraise_fail.wav.
//   - fundraise_success reuses cash.wav — a closed round deserves the ring.
const FILES: Record<SfxId, string> = {
  hire: "/sounds/hire.wav",
  cash: "/sounds/cash.wav",
  death: "/sounds/death.wav",
  level_up: "/sounds/level_up.wav",
  footstep: "/sounds/footstep.wav",
  coffee: "/sounds/coffee.wav",
  egg_pickup: "/sounds/egg_pickup.wav",
  quit_alert: "/sounds/quit_alert.wav",
  quit_leave: "/sounds/fundraise_fail.wav",
  fundraise_success: "/sounds/cash.wav",
  fundraise_fail: "/sounds/fundraise_fail.wav",
  event_good: "/sounds/footstep.wav",
  event_bad: "/sounds/fundraise_fail.wav",
  modal_open: "/sounds/footstep.wav",
  modal_close: "/sounds/footstep.wav",
};

// Per-effect volume. Keeps footsteps quieter than big moments.
const VOLUMES: Record<SfxId, number> = {
  hire: 0.4,
  cash: 0.4,
  death: 0.55,
  level_up: 0.55,
  footstep: 0.18,
  coffee: 0.35,
  egg_pickup: 0.5,
  quit_alert: 0.45,
  quit_leave: 0.5,
  fundraise_success: 0.55,
  fundraise_fail: 0.45,
  event_good: 0.3,
  event_bad: 0.3,
  modal_open: 0.3,
  modal_close: 0.3,
};

const FOOTSTEP_MIN_GAP_MS = 90;
const MUTED_KEY = "warp-runway:sfx-muted";

// A tiny pool per id so overlapping plays don't cut each other off.
const POOL_SIZE = 3;
const pools = new Map<SfxId, HTMLAudioElement[]>();
const poolIdx = new Map<SfxId, number>();
const lastPlayAt = new Map<SfxId, number>();
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadMuted(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

let muted = loadMuted();

function saveMuted(next: boolean): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(MUTED_KEY, next ? "1" : "0");
  } catch {
    // localStorage can throw in private mode; swallow.
  }
}

function getPool(id: SfxId): HTMLAudioElement[] | null {
  if (!isBrowser()) return null;
  let pool = pools.get(id);
  if (pool) return pool;
  const src = FILES[id];
  const vol = VOLUMES[id];
  pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = vol;
    // Missing files dispatch an 'error' event — swallow so the console stays
    // quiet in dev when assets haven't been dropped in yet.
    a.addEventListener("error", () => {}, { passive: true });
    pool.push(a);
  }
  pools.set(id, pool);
  poolIdx.set(id, 0);
  return pool;
}

function notify(): void {
  for (const l of listeners) l();
}

export const sfx = {
  play(id: SfxId): void {
    if (muted) return;
    if (id === "footstep") {
      const now = Date.now();
      const last = lastPlayAt.get(id) ?? 0;
      if (now - last < FOOTSTEP_MIN_GAP_MS) return;
      lastPlayAt.set(id, now);
    }
    const pool = getPool(id);
    if (!pool) return;
    const idx = (poolIdx.get(id) ?? 0) % pool.length;
    poolIdx.set(id, idx + 1);
    const el = pool[idx];
    try {
      el.currentTime = 0;
    } catch {
      // Safari throws if the media isn't ready yet; safe to ignore.
    }
    // play() rejects on decode errors / autoplay blocks; we don't care.
    void el.play().catch(() => {});
  },
  get muted(): boolean {
    return muted;
  },
  setMuted(next: boolean): void {
    if (muted === next) return;
    muted = next;
    saveMuted(next);
    if (next) {
      for (const pool of pools.values()) {
        for (const el of pool) {
          try {
            el.pause();
            el.currentTime = 0;
          } catch {
            // Ignore; element may not be ready.
          }
        }
      }
    }
    notify();
  },
  toggleMuted(): void {
    sfx.setMuted(!muted);
  },
};

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getMutedSnapshot(): boolean {
  return muted;
}

function getMutedServerSnapshot(): boolean {
  return false;
}

export function useSfxMuted(): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    getMutedSnapshot,
    getMutedServerSnapshot,
  );
  return [value, sfx.setMuted];
}
