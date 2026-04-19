"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "./store";

// Watches the store for "big events" and returns a short-lived flag that the
// consumer can use to apply `animate-screen-shake` on a ~420ms timer. Avoids
// remounting the subtree, so FloorArt/FloatingToasts keep their state.
export function useScreenShake(): { shakeKey: number } {
  const [shakeKey, setShakeKey] = useState(0);
  const prev = useRef({
    round: useGameStore.getState().round,
    gameOver: useGameStore.getState().gameOver,
    employees: useGameStore.getState().employees.length,
  });

  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const p = prev.current;
      let shook = false;

      if (s.round !== p.round) shook = true;
      if (s.gameOver && !p.gameOver) shook = true;
      if (s.employees.length < p.employees) shook = true;

      prev.current = {
        round: s.round,
        gameOver: s.gameOver,
        employees: s.employees.length,
      };

      if (shook) setShakeKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (shakeKey === 0) return;
    const t = setTimeout(() => {
      // Resetting the key value back to 0 lets the consumer drop the class.
      // We deliberately do this after the animation finishes so it can play.
    }, 450);
    return () => clearTimeout(t);
  }, [shakeKey]);

  return { shakeKey };
}
