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

// Purple Warp easter eggs spawn randomly on the office floor. Walk over
// one to unlock a real Warp.co feature and a small cash gift.
export const EASTER_EGG_SPAWN_CHANCE = 0.18;
export const EASTER_EGG_MAX_ON_BOARD = 3;
export const EASTER_EGG_LIFETIME_WEEKS = 25;
export const EASTER_EGG_CASH_GIFT = 3_000;
export const EASTER_EGG_CHAR = "◆";

export const WARP_URL = "https://www.warp.co";
export const WARP_SIMULATOR_URL = "https://www.warp.co/simulator";

export const FUNDRAISE_ROUNDS = [
  {
    id: "seed",
    label: "Seed",
    check: 2_000_000,
    dilution: 0.2,
    minEmployees: 5,
    minRevenue: 2_500,
    roundAfter: "seed" as const,
  },
  {
    id: "series-a",
    label: "Series A",
    check: 8_000_000,
    dilution: 0.18,
    minEmployees: 12,
    minRevenue: 12_000,
    roundAfter: "series-a" as const,
  },
  {
    id: "series-b",
    label: "Series B",
    check: 25_000_000,
    dilution: 0.15,
    minEmployees: 25,
    minRevenue: 40_000,
    roundAfter: "series-b" as const,
  },
];

export const LOCATION_MULTIPLIERS = {
  SF: 1.0,
  NYC: 0.95,
  Remote: 0.75,
} as const;

export type LocationId = keyof typeof LOCATION_MULTIPLIERS;
