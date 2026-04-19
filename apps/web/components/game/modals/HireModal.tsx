"use client";

import { useMemo, useState } from "react";
import { ROLES } from "@/lib/game/roles";
import {
  LOCATION_MULTIPLIERS,
  MARKET_PREMIUM_PER_COPY,
  type LocationId,
} from "@/lib/game/constants";
import { useActions, useGameStore } from "@/lib/game/store";
import { calcHireCost, headcountByRole } from "@/lib/game/valuation";
import { ModalShell } from "./ModalShell";
import { useHireSound } from "@/lib/game/sounds";

const LOCATIONS: LocationId[] = ["SF", "NYC", "Remote"];
const MAX_QTY = 20;

export function HireModal() {
  const actions = useActions();
  const balance = useGameStore((s) => s.balance);
  const employees = useGameStore((s) => s.employees);
  const [location, setLocation] = useState<LocationId>("SF");
  const [qtyByRole, setQtyByRole] = useState<Record<string, number>>({});
  const playHire = useHireSound();

  const counts = useMemo(() => headcountByRole(employees), [employees]);

  const setQty = (roleId: string, q: number) =>
    setQtyByRole((prev) => ({
      ...prev,
      [roleId]: Math.max(1, Math.min(MAX_QTY, q)),
    }));

  return (
    <ModalShell title="HIRE SHOP" wide onClose={actions.closeModal}>
      <div className="flex gap-2 mb-4">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocation(loc)}
            className={`px-3 py-1 rounded border text-xs ${
              location === loc
                ? "bg-emerald-600 border-emerald-400 text-slate-950"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {loc} x{LOCATION_MULTIPLIERS[loc]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ROLES.map((role) => {
          const mult = LOCATION_MULTIPLIERS[location];
          const weeklySalary = Math.round((role.baseSalary * mult) / 52);
          const qty = qtyByRole[role.id] ?? 1;
          const existing = counts.get(role.id) ?? 0;
          const nextBreakdown = role.disabled
            ? null
            : calcHireCost(role, existing, 1, location);
          const breakdown = role.disabled
            ? null
            : calcHireCost(role, existing, qty, location);
          const nextCost = nextBreakdown?.total ?? 0;
          const totalCost = breakdown?.total ?? 0;
          const unaffordable = balance < totalCost;
          const disabled = role.disabled || unaffordable;
          const hasPremium = existing > 0 || qty > 1;
          return (
            <div
              key={role.id}
              className={`border rounded p-3 ${
                role.disabled
                  ? "border-amber-700/50 bg-amber-950/20"
                  : "border-slate-700 bg-slate-950/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-cyan-300">{role.char}</span>
                <span className="font-bold text-slate-100">{role.name}</span>
                {!role.disabled && existing > 0 && (
                  <span className="ml-auto text-[10px] text-slate-500 uppercase tracking-wider">
                    On team: {existing}
                  </span>
                )}
              </div>
              {role.disabled ? (
                <div>
                  <p className="text-xs text-amber-300 mb-2">
                    {role.disabledTooltip}
                  </p>
                  {role.disabledUrl && (
                    <a
                      href={role.disabledUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs underline text-amber-200 hover:text-amber-100"
                    >
                      Visit warp.co
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div>
                      Weekly: <span className="text-slate-200">${weeklySalary.toLocaleString()}</span>
                    </div>
                    <div>
                      Next all-in:{" "}
                      <span className="text-slate-200">
                        ${nextCost.toLocaleString()}
                      </span>
                      {nextBreakdown && (
                        <span className="text-slate-500">
                          {" "}
                          (sign ${nextBreakdown.signing.toLocaleString()} +
                          recruiter ${nextBreakdown.recruiter.toLocaleString()} +
                          setup ${nextBreakdown.setup.toLocaleString()})
                        </span>
                      )}
                    </div>
                    <div className="text-emerald-300">
                      {formatEffect(role.weeklyEffect)}
                    </div>
                    {hasPremium && (
                      <div className="text-[10px] text-amber-400/80">
                        Market premium: +
                        {Math.round(MARKET_PREMIUM_PER_COPY * 100)}% per existing {role.name.toLowerCase()}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded border border-slate-700 overflow-hidden">
                      <button
                        onClick={() => setQty(role.id, qty - 1)}
                        disabled={qty <= 1}
                        aria-label="Decrease quantity"
                        className="px-2 py-1 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={MAX_QTY}
                        value={qty}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          if (!isNaN(parsed)) setQty(role.id, parsed);
                        }}
                        className="w-10 bg-slate-950 text-center text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQty(role.id, qty + 1)}
                        disabled={qty >= MAX_QTY}
                        aria-label="Increase quantity"
                        className="px-2 py-1 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        playHire();
                        actions.hireMany(role.id, location, qty);
                      }}
                      disabled={disabled}
                      className="flex-1 py-1 rounded bg-emerald-600 text-slate-950 text-sm font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {unaffordable
                        ? "CAN'T AFFORD"
                        : `HIRE ×${qty} · $${totalCost.toLocaleString()}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-600 mt-4">
        Esc to close. Weekly salary is charged automatically each tick.
      </p>
    </ModalShell>
  );
}

function formatEffect(eff: {
  revenue_delta?: number;
  revenue_multiplier_bonus?: number;
  morale_bonus?: number;
}): string {
  const parts: string[] = [];
  if (eff.revenue_delta) parts.push(`+$${eff.revenue_delta}/wk MRR`);
  if (eff.revenue_multiplier_bonus)
    parts.push(`+${Math.round(eff.revenue_multiplier_bonus * 100)}% rev mult`);
  if (eff.morale_bonus) parts.push(`+${eff.morale_bonus} morale`);
  return parts.join(", ") || "team vibes";
}
