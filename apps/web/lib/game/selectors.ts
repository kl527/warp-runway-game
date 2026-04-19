import { ROLE_CATEGORIES, type RoleCategory } from "./constants";
import { getMap, kindAt, type DoorKind } from "./map";
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

const DOOR_LABELS: Record<DoorKind, string> = {
  hire: "HIRE",
  vc: "VC",
  dashboard: "DASHBOARD",
  coffee: "COFFEE RUN",
};

const DOOR_ACTIONS: Record<DoorKind, string> = {
  hire: "recruit",
  vc: "pitch VCs",
  dashboard: "review metrics",
  coffee: "boost morale",
};

export interface NearbyDoor {
  kind: DoorKind;
  x: number;
  y: number;
  label: string;
  action: string;
  locked?: boolean;
  lockedReason?: string;
}

export const selectNearbyDoor = (s: GameState): NearbyDoor | null => {
  if (s.modal || s.gameOver) return null;
  const map = getMap(s.round);
  const { x, y } = s.position;
  const neighbors: Array<[number, number]> = [
    [x, y],
    [x, y - 1],
    [x, y + 1],
    [x - 1, y],
    [x + 1, y],
  ];
  for (const [cx, cy] of neighbors) {
    const k = kindAt(map, cx, cy);
    if (k === "hire" || k === "vc" || k === "dashboard" || k === "coffee") {
      const door: NearbyDoor = {
        kind: k,
        x: cx,
        y: cy,
        label: DOOR_LABELS[k],
        action: DOOR_ACTIONS[k],
      };
      if (k === "hire" && s.week < s.hireCooldownUntilWeek) {
        door.locked = true;
        door.lockedReason = `${s.hireCooldownUntilWeek - s.week}w cooldown`;
      }
      return door;
    }
  }
  return null;
};

export const selectPosition = (s: GameState) => s.position;
export const selectEmployees = (s: GameState) => s.employees;
export const selectEventLog = (s: GameState) => s.eventLog;
export const selectModal = (s: GameState) => s.modal;
export const selectGameOver = (s: GameState) => s.gameOver;
export const selectPaused = (s: GameState) => s.paused;
export const selectSpeed = (s: GameState) => s.speed;

export const selectHUD = (s: GameState) => {
  const dist = teamDistribution(s);
  const burn = weeklyBurn(s);
  return {
    week: s.week,
    balance: s.balance,
    startingBalance: s.startingBalance,
    burn,
    revenue: s.revenuePerWeek,
    runway: runwayWeeks(s, burn),
    morale: s.morale,
    valuation: valuation(s),
    founders: s.capTable.founders,
    round: s.round,
    headcount: s.employees.length,
    paused: s.paused,
    speed: s.speed,
    coveredCategories: dist.coveredCategories,
    churnRate: s.churnRate,
    boardConfidence: s.boardConfidence,
    postSeed: s.round !== "pre-seed",
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
  a.coveredCategories === b.coveredCategories &&
  a.churnRate === b.churnRate &&
  a.boardConfidence === b.boardConfidence &&
  a.postSeed === b.postSeed;
