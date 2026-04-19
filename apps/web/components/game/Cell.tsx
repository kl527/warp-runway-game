"use client";

import { memo } from "react";
import type { CellKind } from "@/lib/game/map";

export type DisplayKind =
  | CellKind
  | "player"
  | "employee"
  | "employee_quitting"
  | "easter_egg"
  | "hire_locked";

interface CellProps {
  char: string;
  kind: DisplayKind;
  ready?: boolean;
}

const CLASS_BY_KIND: Record<DisplayKind, string> = {
  wall: "text-slate-600",
  floor: "text-slate-700/60",
  hire: "text-amber-300 animate-door-idle drop-shadow-glow-amber",
  vc: "text-amber-300 animate-door-idle drop-shadow-glow-amber",
  dashboard: "text-amber-300 animate-door-idle drop-shadow-glow-amber",
  coffee: "text-amber-300 animate-door-idle drop-shadow-glow-amber",
  sign: "text-amber-200/80",
  player: "text-emerald-400 animate-player-pulse drop-shadow-glow-emerald",
  employee: "text-cyan-300 drop-shadow-glow-cyan",
  employee_quitting: "text-rose-300 animate-pulse font-bold drop-shadow-glow-rose",
  easter_egg: "text-fuchsia-400 animate-pulse font-bold drop-shadow-glow-fuchsia",
  hire_locked: "text-slate-500 opacity-60",
};

const READY_CLASS =
  "text-slate-950 font-bold bg-amber-300 rounded-sm animate-door-ready ring-1 ring-amber-200 drop-shadow-glow-amber-strong";

function CellImpl({ char, kind, ready }: CellProps) {
  return <span className={ready ? READY_CLASS : CLASS_BY_KIND[kind]}>{char}</span>;
}

export const Cell = memo(CellImpl);
