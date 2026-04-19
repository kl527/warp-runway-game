export const TICK_MS = 750;
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
