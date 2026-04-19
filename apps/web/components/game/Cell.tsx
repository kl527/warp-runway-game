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
}

const CLASS_BY_KIND: Record<DisplayKind, string> = {
  wall: "text-slate-500",
  floor: "text-slate-800",
  hire: "text-amber-300",
  vc: "text-amber-300",
  dashboard: "text-amber-300",
  coffee: "text-amber-300",
  sign: "text-amber-200/70",
  player: "text-emerald-400 animate-player-pulse",
  employee: "text-cyan-400",
  employee_quitting: "text-yellow-400 animate-pulse font-bold",
  easter_egg: "text-fuchsia-400 animate-pulse font-bold",
};

function CellImpl({ char, kind }: CellProps) {
  return <span className={CLASS_BY_KIND[kind]}>{char}</span>;
}

export const Cell = memo(CellImpl);
