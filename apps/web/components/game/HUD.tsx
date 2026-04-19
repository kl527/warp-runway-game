"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore, useActions } from "@/lib/game/store";
import { selectHUD } from "@/lib/game/selectors";
import { useShallow } from "zustand/react/shallow";

function fmt(n: number): string {
  if (!isFinite(n)) return "inf";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

function fmtMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${fmt(Math.abs(n))}`;
}

function balanceColor(pct: number): string {
  if (pct > 0.4) return "from-emerald-500 to-emerald-300";
  if (pct > 0.1) return "from-amber-500 to-amber-300";
  return "from-rose-500 to-rose-400";
}

function balanceGlow(pct: number): string {
  if (pct > 0.4) return "shadow-[0_0_10px_rgba(52,211,153,0.45)]";
  if (pct > 0.1) return "shadow-[0_0_8px_rgba(251,191,36,0.35)]";
  return "shadow-[0_0_8px_rgba(251,113,133,0.4)]";
}

export function HUD() {
  const hud = useGameStore(useShallow(selectHUD));
  const actions = useActions();
  const pct = hud.startingBalance > 0 ? hud.balance / hud.startingBalance : 0;
  const barPct = Math.max(0, Math.min(1, pct)) * 100;

  return (
    <div className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-2 flex flex-wrap items-center gap-3 text-xs md:text-sm relative z-20">
      <div className="flex items-center gap-2 min-w-[240px]">
        <span className="text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">BAL</span>
        <div className="flex-1 h-3 bg-slate-900 border border-slate-800 rounded overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${balanceColor(pct)} ${balanceGlow(pct)} transition-all duration-300`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <FlashingValue
          value={Math.round(hud.balance / 1000)}
          className={`font-bold tabular-nums ${hud.balance < 0 ? "text-rose-400" : "text-slate-100"}`}
        >
          {fmtMoney(hud.balance)}
        </FlashingValue>
      </div>

      <Stat label="WK" value={`${hud.week}`} />
      {(() => {
        const net = hud.revenue - hud.burn;
        const sign = net >= 0 ? "+" : "-";
        return (
          <Stat
            label="NET"
            value={`${sign}${fmtMoney(Math.abs(net))}/wk`}
            tone={net >= 0 ? "good" : "bad"}
            flashKey={net}
          />
        );
      })()}
      <Stat label="MORALE" value={`${hud.morale}%`} flashKey={hud.morale} />
      <Stat label="ROUND" value={hud.round} />
      {hud.postSeed && (
        <Stat
          label="BOARD"
          value={`${Math.round(hud.boardConfidence)}%`}
          tone={
            hud.boardConfidence < 20
              ? "bad"
              : hud.boardConfidence < 50
                ? "neutral"
                : "good"
          }
        />
      )}
      <Stat label="VAL" value={fmtMoney(hud.valuation)} />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={actions.togglePause}
          className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 transition"
          aria-label={hud.paused ? "Resume" : "Pause"}
        >
          {hud.paused ? "▶" : "❚❚"}
        </button>
        <div className="flex rounded border border-slate-700 overflow-hidden">
          {[1, 2].map((s) => (
            <button
              key={s}
              onClick={() => actions.setSpeed(s as 1 | 2)}
              className={`px-2 py-1 ${
                hud.speed === s ? "bg-emerald-600 text-slate-950" : "hover:bg-slate-800"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
  flashKey,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
  flashKey?: number | string;
}) {
  const cls =
    tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
        ? "text-rose-300"
        : "text-slate-100";

  const ringTone =
    tone === "good"
      ? "border-emerald-900/60"
      : tone === "bad"
        ? "border-rose-900/60"
        : "border-slate-800";

  return (
    <div
      className={`flex items-baseline gap-1.5 tabular-nums bg-slate-900/50 border ${ringTone} rounded px-2 py-1`}
    >
      <span className="text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">
        {label}
      </span>
      <FlashingValue value={flashKey ?? value} className={`font-bold ${cls}`}>
        {value}
      </FlashingValue>
    </div>
  );
}

function FlashingValue({
  value,
  className,
  children,
}: {
  value: number | string;
  className?: string;
  children: React.ReactNode;
}) {
  const first = useRef(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setTick((t) => t + 1);
  }, [value]);

  return (
    <motion.span
      key={tick}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
