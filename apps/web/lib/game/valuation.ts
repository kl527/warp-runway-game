import {
  BASE_WEEKLY_BURN,
  LOCATION_MULTIPLIERS,
  MARKET_PREMIUM_PER_COPY,
  VALUATION_MULTIPLIER,
} from "./constants";
import { roleById } from "./roles";
import type { GameState } from "./state";

export function valuation(s: Pick<GameState, "revenuePerWeek">): number {
  return Math.max(0, Math.round(s.revenuePerWeek * 52 * VALUATION_MULTIPLIER));
}

export function weeklyBurn(s: Pick<GameState, "employees">): number {
  let total = BASE_WEEKLY_BURN;
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

function countRole(
  employees: GameState["employees"],
  roleId: string
): number {
  let n = 0;
  for (const e of employees) if (e.role.id === roleId) n++;
  return n;
}

// Cost to hire the (existingCount + 1)th copy of a role.
export function singleHireCost(
  s: Pick<GameState, "employees">,
  roleId: string
): number {
  const role = roleById(roleId);
  if (!role) return 0;
  const existing = countRole(s.employees, roleId);
  return Math.round(
    role.signingBonus * (1 + MARKET_PREMIUM_PER_COPY * existing)
  );
}

// Total signing cost for hiring `qty` more of `roleId`, accounting for
// the premium climbing one step per hire within the batch.
export function nextHireCost(
  s: Pick<GameState, "employees">,
  roleId: string,
  qty: number
): number {
  const role = roleById(roleId);
  if (!role || qty <= 0) return 0;
  const existing = countRole(s.employees, roleId);
  let total = 0;
  for (let i = 0; i < qty; i++) {
    total += role.signingBonus * (1 + MARKET_PREMIUM_PER_COPY * (existing + i));
  }
  return Math.round(total);
}
