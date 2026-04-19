"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "./store";
import { sfx } from "./sounds";
import type { GameState, LogEntry, ModalState } from "./state";

interface Snapshot {
  employeeCount: number;
  quittingIds: Set<string>;
  eggCount: number;
  round: GameState["round"];
  fundraiseLockoutUntilWeek: number;
  modalKind: ModalState["kind"] | null;
  gameOver: GameState["gameOver"];
  lastInteractionWeek: number;
  lastLogKey: string | null;
}

function logKey(entry: LogEntry | undefined): string | null {
  if (!entry) return null;
  return `${entry.week}:${entry.message}`;
}

function snapshot(s: GameState): Snapshot {
  const quittingIds = new Set<string>();
  for (const e of s.employees) {
    if (e.quittingSinceTick !== null) quittingIds.add(e.id);
  }
  return {
    employeeCount: s.employees.length,
    quittingIds,
    eggCount: s.easterEggs.length,
    round: s.round,
    fundraiseLockoutUntilWeek: s.fundraiseLockoutUntilWeek,
    modalKind: s.modal?.kind ?? null,
    gameOver: s.gameOver,
    lastInteractionWeek: s.lastInteractionWeek,
    lastLogKey: logKey(s.eventLog[s.eventLog.length - 1]),
  };
}

// Watches the store for transitions worth sounding and plays the right SFX.
// Modeled on useScreenShake: one subscription per GameShell mount, own prev ref.
export function useSoundEffects(): void {
  const prev = useRef<Snapshot | null>(null);

  useEffect(() => {
    prev.current = snapshot(useGameStore.getState());
    const unsub = useGameStore.subscribe((s) => {
      const next = snapshot(s);
      const p = prev.current;
      prev.current = next;
      if (!p) return;

      let handled = false;
      const claim = (id: Parameters<typeof sfx.play>[0]) => {
        sfx.play(id);
        handled = true;
      };

      // Terminal states first — they outrank tick-driven chatter.
      if (!p.gameOver && next.gameOver) {
        claim(next.gameOver === "unicorn" ? "level_up" : "death");
      }

      // Round closed (fundraise success) overrides the generic modal-close.
      const roundChanged = p.round !== next.round;
      if (roundChanged) claim("fundraise_success");

      // Fundraise failure: lockout was pushed out.
      if (
        next.fundraiseLockoutUntilWeek > p.fundraiseLockoutUntilWeek &&
        !roundChanged
      ) {
        claim("fundraise_fail");
      }

      // Headcount dropped → someone walked.
      if (next.employeeCount < p.employeeCount) {
        claim("quit_leave");
      }
      // Headcount went up → hire click already played the "hire" SFX. Mark
      // handled so the event-tone fallback doesn't double-sound it.
      if (next.employeeCount > p.employeeCount) {
        handled = true;
      }

      // New yellow flags (quit alert). Only fire if the id wasn't already yellow.
      for (const id of next.quittingIds) {
        if (!p.quittingIds.has(id)) {
          claim("quit_alert");
          break;
        }
      }

      // Easter egg count dropped → pickup (stale-expiry false positives are
      // rare enough to ignore).
      if (next.eggCount < p.eggCount && !roundChanged) {
        claim("egg_pickup");
      }

      // Coffee interaction: lastInteractionWeek advances only on coffee tiles.
      if (next.lastInteractionWeek !== p.lastInteractionWeek) {
        claim("coffee");
      }

      // Modal transitions — skip if game just ended or a more specific SFX
      // already fired for this transition (fundraise_success/fail, etc.).
      if (!next.gameOver) {
        if (p.modalKind === null && next.modalKind !== null) {
          claim("modal_open");
        } else if (p.modalKind !== null && next.modalKind === null && !handled) {
          claim("modal_close");
        }
      }

      // Event log tone — only if nothing more specific already fired. Most
      // specific SFX correlate with a same-tick log entry (quit, raise, etc.)
      // and we don't want to double-sound them.
      if (!handled && next.lastLogKey && next.lastLogKey !== p.lastLogKey) {
        const entry = s.eventLog[s.eventLog.length - 1];
        if (entry) {
          if (entry.tone === "good") sfx.play("event_good");
          else if (entry.tone === "bad") sfx.play("event_bad");
        }
      }
    });
    return () => unsub();
  }, []);
}
