"use client";

import { FUNDRAISE_ROUNDS } from "@/lib/game/constants";
import { useActions, useGameStore } from "@/lib/game/store";
import { canFundraise, completedRoundIdx } from "@/lib/game/logic";
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
          return (
            <div
              key={round.id}
              className={`border rounded p-4 ${
                gate.ok ? "border-emerald-700/70" : "border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-100">{round.label}</h3>
                  <p className="text-xs text-slate-400">
                    ${(round.check / 1_000_000).toFixed(0)}M check /{" "}
                    {Math.round(round.dilution * 100)}% dilution
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Needs {round.minEmployees} employees</div>
                  <div>Needs ${round.minRevenue.toLocaleString()}/wk MRR</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {state.employees}/{round.minEmployees} employees, $
                  {state.revenue.toLocaleString()}/wk MRR
                </div>
                <button
                  onClick={() => {
                    playCash();
                    actions.fundraise(idx);
                  }}
                  disabled={!gate.ok}
                  className="px-3 py-1 rounded bg-emerald-600 text-slate-950 text-sm font-bold hover:bg-emerald-500 disabled:opacity-40"
                >
                  {gate.ok ? "RAISE" : (gate.reason ?? "LOCKED")}
                </button>
              </div>
            </div>
          );
        })}

        <div className="border-t border-slate-800 pt-3 text-xs text-slate-400">
          <div className="font-bold text-slate-300 mb-1">Cap Table</div>
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
