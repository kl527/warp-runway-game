"use client";

import { useGameStore, useActions } from "@/lib/game/store";
import { hudEqual, selectHUD } from "@/lib/game/selectors";
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
  if (pct > 0.4) return "bg-emerald-500";
  if (pct > 0.1) return "bg-amber-500";
  return "bg-rose-500";
}

export function HUD() {
  const hud = useGameStore(useShallow(selectHUD));
  const actions = useActions();
  const pct = hud.startingBalance > 0 ? hud.balance / hud.startingBalance : 0;
  const barPct = Math.max(0, Math.min(1, pct)) * 100;

  return (
    <div className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-2 flex flex-wrap items-center gap-4 text-xs md:text-sm">
      <div className="flex items-center gap-2 min-w-[240px]">
        <span className="text-slate-500">BAL</span>
        <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden">
          <div
            className={`h-full ${balanceColor(pct)} transition-all`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <span className={`font-bold tabular-nums ${hud.balance < 0 ? "text-rose-400" : "text-slate-100"}`}>
          {fmtMoney(hud.balance)}
        </span>
      </div>

      <Stat label="WK" value={`${hud.week}`} />
      <Stat label="BURN" value={`-${fmtMoney(hud.burn)}/wk`} tone="bad" />
      <Stat label="REV" value={`+${fmtMoney(hud.revenue)}/wk`} tone="good" />
      <Stat
        label="☠ RUNWAY"
        value={hud.runway === Infinity ? "∞" : `${hud.runway}w`}
        tone={hud.runway < 8 ? "bad" : "neutral"}
      />
      <Stat label="MORALE" value={`${hud.morale}%`} />
      <Stat
        label="CHURN"
        value={`${(hud.churnRate * 100).toFixed(1)}%/wk`}
        tone={
          hud.churnRate >= 0.06
            ? "bad"
            : hud.churnRate >= 0.03
              ? "neutral"
              : "good"
        }
      />
      <Stat
        label="TEAM ⚖"
        value={`${hud.coveredCategories}/3`}
        tone={
          hud.coveredCategories === 3
            ? "good"
            : hud.coveredCategories < 2
              ? "bad"
              : "neutral"
        }
      />
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
      <Stat label="OWN" value={`${Math.round(hud.founders * 100)}%`} />
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
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const cls =
    tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
        ? "text-rose-300"
        : "text-slate-100";
  return (
    <div className="flex items-baseline gap-1 tabular-nums">
      <span className="text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">
        {label}
      </span>
      <span className={`font-bold ${cls}`}>{value}</span>
    </div>
  );
}
