import { VALUATION_MULTIPLIER } from "./constants";
import type { GameState } from "./state";
import { LOCATION_MULTIPLIERS } from "./constants";

export function valuation(s: Pick<GameState, "revenuePerWeek">): number {
  return Math.max(0, Math.round(s.revenuePerWeek * 52 * VALUATION_MULTIPLIER));
}

export function weeklyBurn(s: Pick<GameState, "employees">): number {
  let total = 0;
  for (const e of s.employees) {
    const mult = LOCATION_MULTIPLIERS[e.location];
    total += (e.role.baseSalary * mult) / 52;
  }
  return Math.round(total);
}

export function runwayWeeks(
  s: Pick<GameState, "balance" | "employees" | "revenuePerWeek">
): number {
  const net = weeklyBurn(s) - s.revenuePerWeek;
  if (net <= 0) return Infinity;
  return Math.max(0, Math.floor(s.balance / net));
}

export function foundersPct(capTable: GameState["capTable"]): number {
  return Math.max(0, Math.min(1, capTable.founders));
}
