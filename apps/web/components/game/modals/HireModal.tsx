"use client";

import { useState } from "react";
import { ROLES } from "@/lib/game/roles";
import { LOCATION_MULTIPLIERS, type LocationId } from "@/lib/game/constants";
import { useActions, useGameStore } from "@/lib/game/store";
import { ModalShell } from "./ModalShell";
import { useHireSound } from "@/lib/game/sounds";

const LOCATIONS: LocationId[] = ["SF", "NYC", "Remote"];

export function HireModal() {
  const actions = useActions();
  const balance = useGameStore((s) => s.balance);
  const [location, setLocation] = useState<LocationId>("SF");
  const playHire = useHireSound();

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
          const cost = role.signingBonus;
          const unaffordable = balance < cost;
          const disabled = role.disabled || unaffordable;
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
                      Signing: <span className="text-slate-200">${role.signingBonus.toLocaleString()}</span>
                    </div>
                    <div className="text-emerald-300">
                      {formatEffect(role.weeklyEffect)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playHire();
                      actions.hire(role.id, location);
                    }}
                    disabled={disabled}
                    className="mt-2 w-full py-1 rounded bg-emerald-600 text-slate-950 text-sm font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {unaffordable ? "CAN'T AFFORD" : `HIRE in ${location}`}
                  </button>
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
