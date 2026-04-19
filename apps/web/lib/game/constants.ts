export const MAP_W = 60;
export const MAP_H = 20;
export const TICK_MS = 3000;
export const STARTING_BALANCE = 500_000;
export const EVENT_PROBABILITY = 0.2;
export const SHUFFLE_EVERY_TICKS = 2;
export const MAX_LOG_ENTRIES = 40;
export const VISIBLE_LOG_ENTRIES = 4;
export const IPO_VALUATION = 50_000_000;
export const VALUATION_MULTIPLIER = 10;
export const COFFEE_MORALE_BOOST = 10;
export const MORALE_BASELINE = 70;

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
