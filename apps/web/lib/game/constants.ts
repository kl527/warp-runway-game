import type { RoundId } from "./state";

export const TICK_MS = 1000;
export const STARTING_BALANCE = 500_000;
// Baseline weekly overhead independent of headcount: rent, ad spend,
// software & tools, legal/accounting, etc. ~$130k/yr.
export const BASE_WEEKLY_BURN = 2_500;
// Signing-bonus market premium per existing hire of the same role.
// Scaling one function 10-deep gets dramatically more expensive than the first.
export const MARKET_PREMIUM_PER_COPY = 0.15;
// One-time per-hire setup: laptop, monitor, software seats, onboarding.
// Flat across roles — even a cheap junior still needs gear.
export const HIRE_SETUP_COST = 4_000;
// Recruiter fee as a fraction of first-year salary (external sourcing).
// Real market is 20–25%; tuned down so game stays playable.
export const RECRUITER_FEE_PCT = 0.15;

export type RoleCategory = "engineering" | "design" | "gtm";
export const ROLE_CATEGORIES: RoleCategory[] = ["engineering", "design", "gtm"];
export const EVENT_PROBABILITY = 0.2;
export const SHUFFLE_EVERY_TICKS = 2;
export const MAX_LOG_ENTRIES = 40;
export const VISIBLE_LOG_ENTRIES = 4;
export const UNICORN_VALUATION = 1_000_000_000;
export const VALUATION_MULTIPLIER = 10;
export const COFFEE_MORALE_BOOST = 10;
export const MORALE_BASELINE = 70;
export const CRITIC_INTERVAL_WEEKS = 8;
// Individual morale at which an employee starts threatening to quit (turns yellow).
export const QUIT_MORALE_THRESHOLD = 35;
// Ticks the player has to reach a yellow employee before they walk out.
// TICK_MS is 1000ms, so 5 ticks = 5s of real time at speed 1.
export const QUIT_DEADLINE_TICKS = 5;
// Morale an employee is restored to when the player steps on their tile.
export const RESCUE_MORALE_RESTORE = 80;
// Morale hit on every remaining teammate when someone quits — attrition spreads.
export const QUITTER_MORALE_PENALTY = 6;

// Team-composition morale drag: when one category dominates the team,
// the rest feel out of balance and morale slowly erodes each tick.
export const TEAM_IMBALANCE_MIN_HEADCOUNT = 5;
export const TEAM_IMBALANCE_DOMINANCE_THRESHOLD = 0.55;
// Base per-tick morale hit at threshold. Scales with how lopsided it is.
export const TEAM_IMBALANCE_MORALE_PENALTY = 1.2;
// Weeks between nagging log entries while the team stays imbalanced.
export const TEAM_IMBALANCE_LOG_INTERVAL = 12;

// Purple Warp easter eggs spawn randomly on the office floor. Walk over
// one to unlock a real Warp.co feature and a small cash gift.
export const EASTER_EGG_SPAWN_CHANCE = 0.18;
export const EASTER_EGG_MAX_ON_BOARD = 3;
export const EASTER_EGG_LIFETIME_WEEKS = 25;
// Gift scales with funding stage so eggs stay meaningful at later rounds —
// kept roughly proportional to fundraise check sizes.
const EASTER_EGG_CASH_GIFT_TABLE: Record<string, number> = {
  "pre-seed": 3_000,
  seed: 10_000,
  "series-a": 35_000,
  "series-b": 100_000,
};
export function easterEggGiftForRound(round: RoundId): number {
  const named = EASTER_EGG_CASH_GIFT_TABLE[round];
  if (named !== undefined) return named;
  // Series-C and beyond: derive steps-past-Series-B from the letter so the
  // scaling works for any round id, even past the generated FUNDRAISE_ROUNDS
  // list. 'c' → 1 step → $250k, 'd' → 2 → $625k, …
  const match = /^series-([a-z])$/.exec(round);
  if (match) {
    const stepsPastB = match[1].charCodeAt(0) - "b".charCodeAt(0);
    if (stepsPastB >= 1) return Math.round(100_000 * Math.pow(2.5, stepsPastB));
  }
  // Unknown round shape — fall back to the Series-B gift.
  return 100_000;
}
export const EASTER_EGG_CHAR = "◆";

export const WARP_URL = "https://www.warp.co";
export const WARP_SIMULATOR_URL = "https://www.warp.co/simulator";

export interface FundraiseRound {
  id: RoundId;
  label: string;
  check: number;
  dilution: number;
  minEmployees: number;
  minRevenue: number;
  roundAfter: RoundId;
}

// Named base rounds. Anything beyond Series B follows the alphabet (C, D, …)
// and scales its check/headcount/revenue gates geometrically.
const BASE_ROUNDS: FundraiseRound[] = [
  {
    id: "seed",
    label: "Seed",
    check: 2_000_000,
    dilution: 0.2,
    minEmployees: 5,
    minRevenue: 2_500,
    roundAfter: "seed",
  },
  {
    id: "series-a",
    label: "Series A",
    check: 8_000_000,
    dilution: 0.18,
    minEmployees: 12,
    minRevenue: 12_000,
    roundAfter: "series-a",
  },
  {
    id: "series-b",
    label: "Series B",
    check: 25_000_000,
    dilution: 0.15,
    minEmployees: 25,
    minRevenue: 40_000,
    roundAfter: "series-b",
  },
];

function generateRound(idx: number): FundraiseRound {
  if (idx < BASE_ROUNDS.length) return BASE_ROUNDS[idx];
  const letter = String.fromCharCode(67 + (idx - 3)); // idx 3 → 'C'
  const id = `series-${letter.toLowerCase()}` as RoundId;
  const steps = idx - 2; // how far past Series B
  const check = Math.round(25_000_000 * Math.pow(2.5, steps));
  const minEmployees = Math.round(25 * Math.pow(1.8, steps));
  const minRevenue = Math.round(40_000 * Math.pow(2.5, steps));
  const dilution = Math.max(0.05, 0.15 - steps * 0.015);
  return {
    id,
    label: `Series ${letter}`,
    check,
    dilution: Number(dilution.toFixed(3)),
    minEmployees,
    minRevenue,
    roundAfter: id,
  };
}

export const FUNDRAISE_ROUNDS: FundraiseRound[] = Array.from(
  { length: 25 },
  (_, i) => generateRound(i),
);

export const LOCATION_MULTIPLIERS = {
  SF: 1.0,
  NYC: 0.95,
  Remote: 0.75,
} as const;

export type LocationId = keyof typeof LOCATION_MULTIPLIERS;
