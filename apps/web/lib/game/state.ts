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

export type ModalKind = "hire" | "fundraise" | "dashboard" | "choice" | "ai_critic";

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
  morale: number;
  lastInteractionWeek: number;
  capTable: CapTable;
  round: RoundId;
  eventLog: LogEntry[];
  paused: boolean;
  speed: 1 | 2;
  gameOver: "burned" | "unicorn" | null;
  position: { x: number; y: number };
  modal: ModalState | null;
  peakHeadcount: number;
  tickCount: number;
  history: HistoryPoint[];
  rngSeed: number;
  easterEggs: EasterEgg[];
}
