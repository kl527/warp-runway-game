"use client";

import { useActions, useGameStore } from "@/lib/game/store";
import { ModalShell } from "./ModalShell";
import { useShallow } from "zustand/react/shallow";
import { SYNERGIES, computeSynergies } from "@/lib/game/synergies";

export function DashboardOverlay() {
  const actions = useActions();
  const history = useGameStore(useShallow((s) => s.history));
  const employees = useGameStore((s) => s.employees);
  const synergies = computeSynergies({ employees });
  const activeIds = new Set(synergies.active.map((s) => s.id));

  const W = 600;
  const H = 200;
  const maxBalance = Math.max(1, ...history.map((p) => p.balance));
  const minBalance = Math.min(0, ...history.map((p) => p.balance));
  const span = Math.max(1, maxBalance - minBalance);
  const maxRev = Math.max(1, ...history.map((p) => p.revenue));

  const balancePoints = history
    .map((p, i) => {
      const x = (i / Math.max(1, history.length - 1)) * W;
      const y = H - ((p.balance - minBalance) / span) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const revenuePoints = history
    .map((p, i) => {
      const x = (i / Math.max(1, history.length - 1)) * W;
      const y = H - (p.revenue / maxRev) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <ModalShell title="DASHBOARD" wide onClose={actions.closeModal}>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="text-emerald-300">Balance</span>
            <span className="text-cyan-300">Revenue</span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-40 bg-slate-950 border border-slate-800 rounded"
          >
            <polyline
              points={balancePoints}
              fill="none"
              stroke="#34d399"
              strokeWidth={1.5}
            />
            <polyline
              points={revenuePoints}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={1.5}
              opacity={0.8}
            />
          </svg>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <Stat label="Weeks" value={`${history.length - 1}`} />
          <Stat
            label="Peak balance"
            value={`$${Math.round(maxBalance).toLocaleString()}`}
          />
          <Stat
            label="Peak MRR"
            value={`$${Math.round(maxRev).toLocaleString()}`}
          />
          <Stat
            label="Peak headcount"
            value={`${Math.max(0, ...history.map((p) => p.headcount))}`}
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Team Synergies
            </span>
            <span className="text-xs text-emerald-300 tabular-nums">
              {synergies.revenueMultiplier > 1
                ? `×${synergies.revenueMultiplier.toFixed(2)} revenue`
                : "no combos yet"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {SYNERGIES.map((syn) => {
              const on = activeIds.has(syn.id);
              return (
                <div
                  key={syn.id}
                  className={`border rounded px-2 py-1.5 text-[11px] flex items-baseline justify-between gap-3 ${
                    on
                      ? "border-emerald-600 bg-emerald-950/30 text-emerald-200"
                      : "border-slate-800 bg-slate-950/40 text-slate-500"
                  }`}
                >
                  <div>
                    <div className="font-bold">{syn.label}</div>
                    <div className="text-[10px] opacity-80">{syn.description}</div>
                  </div>
                  <div className="tabular-nums font-bold">
                    ×{syn.multiplier.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-800 rounded p-2">
      <div className="text-slate-500">{label}</div>
      <div className="text-slate-100 font-bold tabular-nums">{value}</div>
    </div>
  );
}
