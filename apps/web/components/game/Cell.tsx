"use client";

import { memo } from "react";
import type { CellKind } from "@/lib/game/map";

export type DisplayKind =
  | CellKind
  | "player"
  | "employee"
  | "employee_quitting"
  | "easter_egg";

interface CellProps {
  char: string;
  kind: DisplayKind;
  ready?: boolean;
}

const CLASS_BY_KIND: Record<DisplayKind, string> = {
  wall: "text-slate-500",
  floor: "text-slate-800",
  hire: "text-amber-300 animate-door-idle",
  vc: "text-amber-300 animate-door-idle",
  dashboard: "text-amber-300 animate-door-idle",
  coffee: "text-amber-300 animate-door-idle",
  sign: "text-amber-200/70",
  player: "text-emerald-400 animate-player-pulse",
  employee: "text-cyan-400",
  employee_quitting: "text-yellow-400 animate-pulse font-bold",
  easter_egg: "text-fuchsia-400 animate-pulse font-bold",
};

const READY_CLASS =
  "text-slate-950 font-bold bg-amber-300 rounded-sm animate-door-ready ring-1 ring-amber-200";

function CellImpl({ char, kind, ready }: CellProps) {
  return <span className={ready ? READY_CLASS : CLASS_BY_KIND[kind]}>{char}</span>;
}

export const Cell = memo(CellImpl);
