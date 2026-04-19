import type { GameState } from "./state";
import { runwayWeeks, valuation, weeklyBurn } from "./valuation";

export const selectPosition = (s: GameState) => s.position;
export const selectEmployees = (s: GameState) => s.employees;
export const selectEventLog = (s: GameState) => s.eventLog;
export const selectModal = (s: GameState) => s.modal;
export const selectGameOver = (s: GameState) => s.gameOver;
export const selectPaused = (s: GameState) => s.paused;
export const selectSpeed = (s: GameState) => s.speed;

export const selectHUD = (s: GameState) => ({
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
});

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
  a.speed === b.speed;
