import { ROLE_CATEGORIES, type RoleCategory } from "./constants";
import type { GameState } from "./state";
import { runwayWeeks, valuation, weeklyBurn } from "./valuation";

export interface TeamDistribution {
  counts: Record<RoleCategory, number>;
  coveredCategories: number;
  balanceScore: number;
}

export function teamDistribution(s: Pick<GameState, "employees">): TeamDistribution {
  const counts = { engineering: 0, design: 0, gtm: 0 } as Record<RoleCategory, number>;
  for (const e of s.employees) {
    const cat = e.role.category;
    if (cat) counts[cat]++;
  }
  const coveredCategories = ROLE_CATEGORIES.reduce(
    (acc, c) => acc + (counts[c] > 0 ? 1 : 0),
    0
  );
  return {
    counts,
    coveredCategories,
    balanceScore: coveredCategories / ROLE_CATEGORIES.length,
  };
}

export const selectPosition = (s: GameState) => s.position;
export const selectEmployees = (s: GameState) => s.employees;
export const selectEventLog = (s: GameState) => s.eventLog;
export const selectModal = (s: GameState) => s.modal;
export const selectGameOver = (s: GameState) => s.gameOver;
export const selectPaused = (s: GameState) => s.paused;
export const selectSpeed = (s: GameState) => s.speed;

export const selectHUD = (s: GameState) => {
  const dist = teamDistribution(s);
  return {
    week: s.week,
    balance: s.balance,
    startingBalance: s.startingBalance,
    burn: weeklyBurn(s),
    revenue: s.revenuePerWeek,
    runway: runwayWeeks(s),
    morale: s.morale,
    valuation: valuation(s),
    founders: s.capTable.founders,
    round: s.round,
    headcount: s.employees.length,
    paused: s.paused,
    speed: s.speed,
    coveredCategories: dist.coveredCategories,
  };
};

export const hudEqual = (
  a: ReturnType<typeof selectHUD>,
  b: ReturnType<typeof selectHUD>
) =>
  a.week === b.week &&
  a.balance === b.balance &&
  a.burn === b.burn &&
  a.revenue === b.revenue &&
  a.runway === b.runway &&
  a.morale === b.morale &&
  a.valuation === b.valuation &&
  a.founders === b.founders &&
  a.round === b.round &&
  a.headcount === b.headcount &&
  a.paused === b.paused &&
  a.speed === b.speed &&
  a.coveredCategories === b.coveredCategories;
