"use client";

import { FUNDRAISE_ROUNDS } from "@/lib/game/constants";
import { useActions, useGameStore } from "@/lib/game/store";
import { canFundraise, completedRoundIdx, fundraiseOdds } from "@/lib/game/logic";
import { ModalShell } from "./ModalShell";
import { useShallow } from "zustand/react/shallow";
import { useCashSound } from "@/lib/game/sounds";

export function FundraiseModal() {
  const actions = useActions();
  const state = useGameStore(
    useShallow((s) => ({
      employees: s.employees.length,
      revenue: s.revenuePerWeek,
      round: s.round,
      capTable: s.capTable,
    }))
  );
  const fullState = useGameStore.getState();
  const playCash = useCashSound();

  const completed = completedRoundIdx(fullState);
  const startIdx = completed + 1;
  const visibleRounds = FUNDRAISE_ROUNDS.slice(startIdx, startIdx + 3).map(
    (round, offset) => ({ round, idx: startIdx + offset }),
  );

  return (
    <ModalShell title="VC OFFICE" wide onClose={actions.closeModal}>
      <div className="space-y-3">
        {visibleRounds.map(({ round, idx }) => {
          const gate = canFundraise(fullState, idx);
          const odds = gate.ok ? fundraiseOdds(fullState, idx) : 0;
          const oddsPct = Math.round(odds * 100);
          const oddsTone =
            odds >= 0.6
              ? "text-emerald-300"
              : odds >= 0.35
                ? "text-warp-amber-9"
                : "text-warp-red-9";
          return (
            <div
              key={round.id}
              className={`rounded-lg p-4 bg-white/[0.02] ${
                gate.ok
                  ? "shadow-[inset_0_0_0_1px_rgba(52,211,153,0.3)]"
                  : "shadow-ring-w"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-white/90">{round.label}</h3>
                  <p className="text-xs text-white/55 mt-0.5">
                    ${(round.check / 1_000_000).toFixed(0)}M check /{" "}
                    {Math.round(round.dilution * 100)}% dilution
                  </p>
                </div>
                <div className="text-right text-xs text-white/55">
                  <div>Needs {round.minEmployees} employees</div>
                  <div>Needs ${round.minRevenue.toLocaleString()}/wk MRR</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/45">
                  {state.employees}/{round.minEmployees} employees, $
                  {state.revenue.toLocaleString()}/wk MRR
                  {gate.ok && (
                    <span className="ml-2">
                      · close odds:{" "}
                      <span className={`font-bold ${oddsTone}`}>{oddsPct}%</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    playCash();
                    actions.fundraise(idx);
                  }}
                  disabled={!gate.ok}
                  className="px-3 py-1 rounded-lg bg-warp-orange text-white text-sm font-medium hover:bg-warp-orange-hover transition disabled:bg-white/[0.05] disabled:text-white/30"
                >
                  {gate.ok ? `PITCH (${oddsPct}%)` : (gate.reason ?? "LOCKED")}
                </button>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-white/45 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          VCs close based on growth since the last round, runway cushion, and
          headroom past the gate. A failed pitch locks you out for 4 weeks and
          tanks morale.
        </p>

        <div className="pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-xs text-white/55">
          <div className="font-brand text-[10px] uppercase tracking-[0.14em] text-warp-accent-3 mb-1">
            Cap Table
          </div>
          <div>
            Founders: {(state.capTable.founders * 100).toFixed(1)}%
          </div>
          {state.capTable.investors.map((inv, i) => (
            <div key={i}>
              {inv.round}: {(inv.pct * 100).toFixed(1)}%
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}
