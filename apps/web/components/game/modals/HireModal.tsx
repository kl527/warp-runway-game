"use client";

import { useMemo, useState } from "react";
import { ROLES } from "@/lib/game/roles";
import { LOCATION_MULTIPLIERS, type LocationId } from "@/lib/game/constants";
import { useActions, useGameStore } from "@/lib/game/store";
import { calcHireCost, headcountByRole } from "@/lib/game/valuation";
import { getMap, officeCapacity } from "@/lib/game/map";
import { ModalShell } from "./ModalShell";
import { useHireSound } from "@/lib/game/sounds";

const LOCATIONS: LocationId[] = ["SF", "NYC", "Remote"];
const MAX_QTY = 20;

export function HireModal() {
  const actions = useActions();
  const balance = useGameStore((s) => s.balance);
  const employees = useGameStore((s) => s.employees);
  const round = useGameStore((s) => s.round);
  const [location, setLocation] = useState<LocationId>("SF");
  const [qtyByRole, setQtyByRole] = useState<Record<string, number>>({});
  const playHire = useHireSound();

  const counts = useMemo(() => headcountByRole(employees), [employees]);
  const capacity = useMemo(() => officeCapacity(getMap(round)), [round]);
  const freeSeats = Math.max(0, capacity - employees.length);
  const officeFull = freeSeats <= 0;

  const setQty = (roleId: string, q: number) =>
    setQtyByRole((prev) => ({
      ...prev,
      [roleId]: Math.max(1, Math.min(MAX_QTY, q)),
    }));

  return (
    <ModalShell title="HIRE SHOP" wide onClose={actions.closeModal}>
      <div
        className={`mb-3 text-xs flex items-center justify-between rounded-lg px-3 py-1.5 ${
          officeFull
            ? "shadow-[inset_0_0_0_1px_rgba(255,35,35,0.3)] bg-warp-red-12/30 text-warp-red-9"
            : "shadow-ring-w bg-white/[0.02] text-white/75"
        }`}
      >
        <span className="tabular-nums">
          Desks {employees.length}/{capacity}
        </span>
        <span className="font-brand text-[10px] uppercase tracking-[0.14em]">
          {officeFull ? "Full — raise to expand" : `${freeSeats} free`}
        </span>
      </div>
      <div className="flex gap-2 mb-4">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocation(loc)}
            className={`px-3 py-1 rounded-lg text-xs transition ${
              location === loc
                ? "bg-warp-orange text-white shadow-[0_4px_12px_-4px_rgba(255,61,0,0.5)]"
                : "shadow-ring-w text-white/75 hover:bg-white/[0.04]"
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
          const nextCost = role.disabled
            ? 0
            : calcHireCost(role, existing, 1, location).total;
          const totalCost = role.disabled
            ? 0
            : calcHireCost(role, existing, qty, location).total;
          const unaffordable = balance < totalCost;
          const overCapacity = !role.disabled && qty > freeSeats;
          const disabled = role.disabled || unaffordable || overCapacity;
          return (
            <div
              key={role.id}
              className={`rounded-lg p-3 ${
                role.disabled
                  ? "shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)] bg-warp-amber-9/[0.05]"
                  : "shadow-ring-w bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-cyan-300">{role.char}</span>
                <span className="font-bold text-slate-100">{role.name}</span>
                {!role.disabled && existing > 0 && (
                  <span className="ml-auto font-brand text-[10px] text-white/40 uppercase tracking-[0.14em]">
                    ×{existing}
                  </span>
                )}
              </div>
              {role.disabled ? (
                <div>
                  <p className="text-xs text-warp-amber-9 mb-2">
                    {role.disabledTooltip}
                  </p>
                  {role.disabledUrl && (
                    <a
                      href={role.disabledUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs underline text-warp-amber-8 hover:text-warp-amber-9"
                    >
                      Visit warp.co
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-xs text-white/65 space-y-0.5">
                    <div className="flex gap-3">
                      <span>
                        <span className="text-white/40">Salary</span>{" "}
                        <span className="text-white/85">
                          ${weeklySalary.toLocaleString()}/wk
                        </span>
                      </span>
                      <span>
                        <span className="text-white/40">Hire</span>{" "}
                        <span className="text-white/85">
                          ${nextCost.toLocaleString()}
                        </span>
                      </span>
                    </div>
                    <div className="text-emerald-300">
                      {formatEffect(role.weeklyEffect)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded-lg shadow-ring-w overflow-hidden">
                      <button
                        onClick={() => setQty(role.id, qty - 1)}
                        disabled={qty <= 1}
                        aria-label="Decrease quantity"
                        className="px-2 py-1 text-white/85 hover:bg-white/[0.05] disabled:opacity-40 transition"
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
                        className="w-10 bg-transparent text-center text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQty(role.id, qty + 1)}
                        disabled={qty >= MAX_QTY}
                        aria-label="Increase quantity"
                        className="px-2 py-1 text-white/85 hover:bg-white/[0.05] disabled:opacity-40 transition"
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
                      className="flex-1 py-1 rounded-lg bg-warp-orange text-white text-sm font-medium hover:bg-warp-orange-hover transition disabled:bg-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed"
                    >
                      {officeFull
                        ? "FULL"
                        : overCapacity
                        ? `${freeSeats} LEFT`
                        : unaffordable
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
      <p className="font-mono text-[10px] text-white/35 mt-4">
        Salary auto-deducted weekly. Esc to close.
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
