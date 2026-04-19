import type { LocationId, RoleCategory } from "./constants";

export type RoundId = "pre-seed" | "seed" | `series-${string}`;

export type RoleId =
  | "junior_eng"
  | "senior_eng"
  | "designer"
  | "sales"
  | "marketer"
  | "head_of_ops";

export interface RoleWeeklyEffect {
  revenue_delta?: number;
  revenue_multiplier_bonus?: number;
  morale_bonus?: number;
  unlocks?: string[];
}

export interface Role {
  id: RoleId;
  name: string;
  char: string;
  baseSalary: number;
  signingBonus: number;
  weeklyEffect: RoleWeeklyEffect;
  category?: RoleCategory;
  disabled?: boolean;
  disabledTooltip?: string;
  disabledUrl?: string;
}

export interface Employee {
  id: string;
  role: Role;
  name: string;
  location: LocationId;
  hiredWeek: number;
  morale: number;
  x: number;
  y: number;
  // Set when morale cratered and the employee started threatening to quit.
  // Cleared when the player steps on their tile in time.
  quittingSinceTick: number | null;
}

export interface LogEntry {
  week: number;
  message: string;
  tone: "good" | "bad" | "neutral" | "warp";
}

export interface EasterEgg {
  id: string;
  x: number;
  y: number;
  spawnedWeek: number;
  featureId: string;
}

export interface CapTable {
  founders: number;
  investors: { round: string; pct: number }[];
}

export type ModalKind =
  | "hire"
  | "fundraise"
  | "dashboard"
  | "choice"
  | "ai_critic"
  | "ai_pitch"
  | "building_egg";

export interface ChoiceOption {
  key: string;
  label: string;
  description: string;
}

export interface ModalState {
  kind: ModalKind;
  payload?: {
    eventId?: string;
    options?: ChoiceOption[];
    title?: string;
    body?: string;
    critique?: string;
    roundIdx?: number;
    roundLabel?: string;
  };
}

export interface HistoryPoint {
  week: number;
  balance: number;
  revenue: number;
  headcount: number;
}

export interface GameState {
  week: number;
  balance: number;
  startingBalance: number;
  employees: Employee[];
  revenuePerWeek: number;
  // Fraction of gross MRR lost each week to customer attrition.
  // 0-1; shaped by eng/design coverage, morale, and revenue scale.
  churnRate: number;
  morale: number;
  lastInteractionWeek: number;
  capTable: CapTable;
  round: RoundId;
  eventLog: LogEntry[];
  paused: boolean;
  speed: 1 | 2;
  gameOver: "burned" | "unicorn" | "fired" | null;
  position: { x: number; y: number };
  modal: ModalState | null;
  peakHeadcount: number;
  tickCount: number;
  history: HistoryPoint[];
  rngSeed: number;
  easterEggs: EasterEgg[];
  // Board confidence 0-100. Decays when runway is thin or growth stalls
  // after a round closes. Game ends in "fired" if it hits 0.
  boardConfidence: number;
  // Revenue at the last successful round close — growth baseline.
  revenueAtLastRound: number;
  weekOfLastRound: number;
  // Fundraising locked out until this week (exclusive) after a failed raise.
  fundraiseLockoutUntilWeek: number;
  // Hiring locked out until this week (exclusive) after the last successful hire.
  hireCooldownUntilWeek: number;
  // Items purchased from the HIRE shop. Effects fold into revenue/burn
  // recomputes each tick, and one-shot bonuses apply at purchase time.
  ownedItems: string[];
  // Every shop purchase made this run, including consumables. Price is the
  // round-scaled amount actually paid — powers the end-of-run share receipt.
  purchases: { itemId: string; price: number; week: number }[];
  // Current shop offer, rolled at the start of the run and refreshed each
  // time a round closes. Null between the purchase-all moment and the next
  // round close (rare).
  shopOffer: {
    roundIdx: number;
    itemIds: string[];
    prices: number[];
  } | null;
  // One-shot hidden egg: fires when the player steps up to a newer decor
  // building (lab/lounge/all-hands) once they've reached Series A or beyond.
  buildingEggSeen: boolean;
}
