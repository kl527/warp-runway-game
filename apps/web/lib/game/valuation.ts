import {
  BASE_WEEKLY_BURN,
  HIRE_SETUP_COST,
  LOCATION_MULTIPLIERS,
  MARKET_PREMIUM_PER_COPY,
  RECRUITER_FEE_PCT,
  VALUATION_MULTIPLIER,
  type LocationId,
} from "./constants";
import { roleById } from "./roles";
import type { GameState, Role } from "./state";

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

// Accepts an optional precomputed burn so callers that already know it
// (HUD selectors, tick loop) don't iterate employees twice.
export function runwayWeeks(
  s: Pick<GameState, "balance" | "employees" | "revenuePerWeek">,
  burn?: number
): number {
  const b = burn ?? weeklyBurn(s);
  const net = b - s.revenuePerWeek;
  if (net <= 0) return Infinity;
  return Math.max(0, Math.floor(s.balance / net));
}

export function foundersPct(capTable: GameState["capTable"]): number {
  return Math.max(0, Math.min(1, capTable.founders));
}

function headcountByRole(employees: GameState["employees"]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of employees) m.set(e.role.id, (m.get(e.role.id) ?? 0) + 1);
  return m;
}

function countRole(employees: GameState["employees"], roleId: string): number {
  let n = 0;
  for (const e of employees) if (e.role.id === roleId) n++;
  return n;
}

export interface HireCostBreakdown {
  signing: number;
  recruiter: number;
  setup: number;
  total: number;
}

// Pure cost math. Caller supplies counts so N roles × M renders doesn't
// re-scan the employee list.
export function calcHireCost(
  role: Role,
  existingCount: number,
  qty: number,
  location: LocationId
): HireCostBreakdown {
  if (qty <= 0 || role.disabled) {
    return { signing: 0, recruiter: 0, setup: 0, total: 0 };
  }
  const locMult = LOCATION_MULTIPLIERS[location];
  let signing = 0;
  for (let i = 0; i < qty; i++) {
    const premium = 1 + MARKET_PREMIUM_PER_COPY * (existingCount + i);
    signing += role.signingBonus * locMult * premium;
  }
  // Recruiter fee scales with first-year comp (location-adjusted).
  const recruiter = role.baseSalary * locMult * RECRUITER_FEE_PCT * qty;
  const setup = HIRE_SETUP_COST * qty;
  const total = Math.round(signing + recruiter + setup);
  return {
    signing: Math.round(signing),
    recruiter: Math.round(recruiter),
    setup: Math.round(setup),
    total,
  };
}

// Cost to hire the (existingCount + 1)th copy of a role at a given location.
export function singleHireCost(
  s: Pick<GameState, "employees">,
  roleId: string,
  location: LocationId
): number {
  const role = roleById(roleId);
  if (!role) return 0;
  return calcHireCost(role, countRole(s.employees, roleId), 1, location).total;
}

// Total signing cost for hiring `qty` more of `roleId`, accounting for
// the premium climbing one step per hire within the batch.
export function nextHireCost(
  s: Pick<GameState, "employees">,
  roleId: string,
  qty: number,
  location: LocationId
): number {
  const role = roleById(roleId);
  if (!role) return 0;
  return calcHireCost(role, countRole(s.employees, roleId), qty, location).total;
}

export { headcountByRole };
