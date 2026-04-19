"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useActions, useGameStore } from "@/lib/game/store";
import { CRITIC_INTERVAL_WEEKS, TICK_MS } from "@/lib/game/constants";
import {
  selectGameOver,
  selectModal,
  selectPaused,
  selectSpeed,
} from "@/lib/game/selectors";
import { buildDigest } from "@/lib/ai/buildDigest";
import { GameCanvas } from "./GameCanvas";
import { HUD } from "./HUD";
import { EventLog } from "./EventLog";
import { HireModal } from "./modals/HireModal";
import { FundraiseModal } from "./modals/FundraiseModal";
import { DashboardOverlay } from "./modals/DashboardOverlay";
import { ChoiceModal } from "./modals/ChoiceModal";
import { AiCriticModal } from "./modals/AiCriticModal";
import { EndScreen } from "./EndScreen";
import { MobileBlock } from "./MobileBlock";

function useIsMobile(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return narrow;
}

export function GameShell() {
  const actions = useActions();
  const paused = useGameStore(selectPaused);
  const modal = useGameStore(selectModal);
  const gameOver = useGameStore(selectGameOver);
  const speed = useGameStore(selectSpeed);
  const week = useGameStore((s) => s.week);
  const narrow = useIsMobile();
  const lastCritiqueWeek = useRef(0);
  const critiqueInFlight = useRef(false);

  useEffect(() => {
    if (gameOver || modal || paused) return;
    if (week === 0) return;
    if (week - lastCritiqueWeek.current < CRITIC_INTERVAL_WEEKS) return;
    if (critiqueInFlight.current) return;

    lastCritiqueWeek.current = week;
    critiqueInFlight.current = true;
    const ac = new AbortController();
    const snapshot = useGameStore.getState();
    const digest = buildDigest(snapshot).text;

    (async () => {
      try {
        const res = await fetch("/api/ai/critique", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ digest }),
          signal: ac.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { critique?: string };
        if (!data.critique) return;
        actions.openAiCritic(data.critique);
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          console.warn("critique fetch failed", err);
        }
      } finally {
        critiqueInFlight.current = false;
      }
    })();

    return () => ac.abort();
  }, [week, gameOver, modal, paused, actions]);

  // Keyboard.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        actions.closeModal();
        return;
      }
      if (modal || gameOver) return;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          actions.move(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          actions.move(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          actions.move(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          actions.move(1, 0);
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          actions.interact();
          break;
        case "p":
        case "P":
          e.preventDefault();
          actions.togglePause();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, modal, gameOver]);

  // Tick loop.
  useEffect(() => {
    if (paused || modal || gameOver) return;
    const interval = setInterval(() => actions.tick(), TICK_MS / speed);
    return () => clearInterval(interval);
  }, [paused, modal, gameOver, speed, actions]);

  if (narrow) return <MobileBlock />;

  return (
    <main className="min-h-screen flex flex-col">
      <HUD />
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <GameCanvas />
      </div>
      <EventLog />
      <Controls />
      <AnimatePresence>
        {modal?.kind === "hire" && <HireModal key="hire" />}
        {modal?.kind === "fundraise" && <FundraiseModal key="fund" />}
        {modal?.kind === "dashboard" && <DashboardOverlay key="dash" />}
        {modal?.kind === "choice" && <ChoiceModal key="choice" />}
        {modal?.kind === "ai_critic" && <AiCriticModal key="aicritic" />}
      </AnimatePresence>
      {gameOver && <EndScreen />}
    </main>
  );
}

function Controls() {
  return (
    <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-800 flex flex-wrap gap-4 justify-center">
      <span>
        <kbd className="text-slate-300">← ↑ ↓ →</kbd> / <kbd className="text-slate-300">WASD</kbd> move
      </span>
      <span>
        <kbd className="text-slate-300">Space</kbd> interact
      </span>
      <span>
        <kbd className="text-slate-300">P</kbd> pause
      </span>
      <span>
        <kbd className="text-slate-300">Esc</kbd> close modal
      </span>
    </div>
  );
}
