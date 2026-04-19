"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "@/lib/game/store";
import { cellKey, getMap } from "@/lib/game/map";
import {
  selectEmployees,
  selectNearbyDoor,
  selectPosition,
} from "@/lib/game/selectors";
import { Cell, type DisplayKind } from "./Cell";
import { FloorArt } from "./FloorArt";
import { FloatingToasts } from "./FloatingToasts";
import { useShallow } from "zustand/react/shallow";
import { EASTER_EGG_CHAR } from "@/lib/game/constants";
import { useScreenShake } from "@/lib/game/useScreenShake";

export function GameCanvas() {
  const position = useGameStore(selectPosition);
  const round = useGameStore((s) => s.round);
  const employees = useGameStore(useShallow(selectEmployees));
  const easterEggs = useGameStore(useShallow((s) => s.easterEggs));
  const nearby = useGameStore(useShallow(selectNearbyDoor));
  const week = useGameStore((s) => s.week);
  const hireCooldownUntilWeek = useGameStore((s) => s.hireCooldownUntilWeek);
  const hireLocked = week < hireCooldownUntilWeek;

  const map = useMemo(() => getMap(round), [round]);

  const employeeMap = useMemo(() => {
    const m = new Map<string, { char: string; quitting: boolean }>();
    for (const e of employees) {
      m.set(cellKey(e.x, e.y), {
        char: e.role.char,
        quitting: e.quittingSinceTick !== null,
      });
    }
    return m;
  }, [employees]);

  const eggSet = useMemo(() => {
    const s = new Set<string>();
    for (const e of easterEggs) s.add(cellKey(e.x, e.y));
    return s;
  }, [easterEggs]);

  const playerKey = cellKey(position.x, position.y);
  const readyKey = nearby ? cellKey(nearby.x, nearby.y) : null;

  const gridStyle = {
    gridTemplateColumns: `repeat(${map.width}, 1ch)`,
    gridTemplateRows: `repeat(${map.height}, 1em)`,
  };

  const { shakeKey } = useScreenShake();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shakeKey === 0) return;
    const el = stageRef.current;
    if (!el) return;
    el.classList.remove("animate-screen-shake");
    // Force reflow so the browser restarts the animation.
    void el.offsetHeight;
    el.classList.add("animate-screen-shake");
    const t = window.setTimeout(() => {
      el.classList.remove("animate-screen-shake");
    }, 450);
    return () => window.clearTimeout(t);
  }, [shakeKey]);

  return (
    <div className="flex flex-col items-center gap-2">
      <InteractHint nearby={nearby} />
      <div
        ref={stageRef}
        className="game-stage text-sm md:text-base"
        aria-label="Office map"
      >
        <FloorArt round={round} />
        <div className="game-grid" style={gridStyle}>
          {map.cells.map((base) => {
          const key = cellKey(base.x, base.y);
          let char = base.char;
          let kind: DisplayKind = base.kind;
          let ready = false;
          if (key === playerKey) {
            char = "@";
            kind = "player";
          } else if (employeeMap.has(key)) {
            const emp = employeeMap.get(key)!;
            char = emp.char;
            kind = emp.quitting ? "employee_quitting" : "employee";
          } else if (eggSet.has(key)) {
            char = EASTER_EGG_CHAR;
            kind = "easter_egg";
          } else if (base.kind === "hire" && hireLocked) {
            kind = "hire_locked";
          } else if (key === readyKey && !(nearby?.kind === "hire" && nearby.locked)) {
            ready = true;
          }
            return <Cell key={key} char={char} kind={kind} ready={ready} />;
          })}
        </div>
        <FloatingToasts map={map} playerX={position.x} playerY={position.y} />
      </div>
    </div>
  );
}

function InteractHint({
  nearby,
}: {
  nearby: ReturnType<typeof selectNearbyDoor>;
}) {
  if (nearby?.locked) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-rose-500/60 bg-rose-950/40 px-3 py-1.5 text-xs md:text-sm text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
        <span className="text-rose-300">⏳</span>
        <span>
          <span className="font-bold text-rose-100">{nearby.label}</span> locked —{" "}
          <span className="font-bold">{nearby.lockedReason}</span>
          <span className="text-rose-300/80"> · let the team settle before hiring again</span>
        </span>
      </div>
    );
  }
  if (nearby) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-400 bg-amber-400/10 px-3 py-1.5 text-xs md:text-sm text-amber-200 animate-hint-pulse shadow-[0_0_12px_rgba(251,191,36,0.35)]">
        <span className="text-amber-300">▶</span>
        <span>
          Press{" "}
          <kbd className="rounded border border-amber-300/60 bg-amber-300/10 px-1.5 py-0.5 font-bold text-amber-100">
            SPACE
          </kbd>{" "}
          to enter{" "}
          <span className="font-bold text-amber-100">{nearby.label}</span>
          <span className="text-amber-300/80"> — {nearby.action}</span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs md:text-sm text-slate-400">
      <span className="text-slate-500">ⓘ</span>
      <span>
        Walk{" "}
        <span className="text-emerald-400 font-bold">@</span> onto a room door{" "}
        <span className="text-amber-300 font-bold">H</span>
        <span className="text-slate-600">/</span>
        <span className="text-amber-300 font-bold">V</span>
        <span className="text-slate-600">/</span>
        <span className="text-amber-300 font-bold">B</span>
        <span className="text-slate-600">/</span>
        <span className="text-amber-300 font-bold">C</span>, then press{" "}
        <kbd className="rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-slate-200">
          SPACE
        </kbd>{" "}
        to enter.
      </span>
    </div>
  );
}
