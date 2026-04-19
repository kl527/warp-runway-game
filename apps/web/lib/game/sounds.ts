"use client";

import useSound from "use-sound";

// Stub-safe wrappers. If the files are missing, Howler logs a warning but
// does not throw, and `play()` becomes a no-op.
function safeHook(path: string) {
  return () => {
    const [play] = useSound(path, { volume: 0.4 });
    return play as () => void;
  };
}

export const useHireSound = safeHook("/sounds/hire.wav");
export const useCashSound = safeHook("/sounds/cash.wav");
export const useDeathSound = safeHook("/sounds/death.wav");
export const useLevelUpSound = safeHook("/sounds/level_up.wav");
