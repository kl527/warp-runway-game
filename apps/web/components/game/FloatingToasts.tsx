"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import type { MapDef } from "@/lib/game/map";

interface Toast {
  id: number;
  text: string;
  tone: "good" | "bad";
  x: number;
  y: number;
}

interface Props {
  map: MapDef;
  playerX: number;
  playerY: number;
}

function formatDelta(n: number, prefix: string): string {
  const sign = n >= 0 ? "+" : "-";
  const abs = Math.abs(n);
  const fmt =
    abs >= 1_000_000
      ? `${(abs / 1_000_000).toFixed(1)}M`
      : abs >= 1_000
        ? `${(abs / 1_000).toFixed(1)}k`
        : `${Math.round(abs)}`;
  return `${sign}${prefix}${fmt}`;
}

export function FloatingToasts({ map, playerX, playerY }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const prev = useRef<{ balance: number; morale: number }>({
    balance: useGameStore.getState().balance,
    morale: useGameStore.getState().morale,
  });
  const playerPos = useRef({ x: playerX, y: playerY });
  playerPos.current = { x: playerX, y: playerY };

  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const prevBal = prev.current.balance;
      const prevMor = prev.current.morale;
      const dBal = s.balance - prevBal;
      const dMor = s.morale - prevMor;
      prev.current.balance = s.balance;
      prev.current.morale = s.morale;

      const next: Toast[] = [];
      if (Math.abs(dBal) >= 500) {
        next.push({
          id: ++idRef.current,
          text: formatDelta(dBal, "$"),
          tone: dBal >= 0 ? "good" : "bad",
          x: playerPos.current.x,
          y: playerPos.current.y,
        });
      }
      if (Math.abs(dMor) >= 3) {
        next.push({
          id: ++idRef.current,
          text: `${dMor >= 0 ? "+" : "-"}${Math.abs(Math.round(dMor))}♥`,
          tone: dMor >= 0 ? "good" : "bad",
          x: playerPos.current.x,
          y: playerPos.current.y,
        });
      }

      if (next.length > 0) {
        setToasts((t) => [...t, ...next]);
        for (const toast of next) {
          const toastId = toast.id;
          setTimeout(() => {
            setToasts((t) => t.filter((x) => x.id !== toastId));
          }, 900);
        }
      }
    });
    return () => unsub();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-layer">
      {toasts.map((t) => {
        const leftPct = ((t.x + 0.5) / map.width) * 100;
        const topPct = (t.y / map.height) * 100;
        const color =
          t.tone === "good"
            ? "text-emerald-300 drop-shadow-glow-emerald"
            : "text-rose-300 drop-shadow-glow-rose";
        return (
          <span
            key={t.id}
            className={`absolute text-[11px] md:text-xs font-bold tabular-nums animate-toast-rise ${color}`}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: "translate(-50%, 0)",
              whiteSpace: "nowrap",
            }}
          >
            {t.text}
          </span>
        );
      })}
    </div>
  );
}
