import { ROLE_CATEGORIES } from "./constants";
import type { GameState, RoleId } from "./state";

export interface RoleCounts {
  junior_eng: number;
  senior_eng: number;
  designer: number;
  sales: number;
  marketer: number;
  head_of_ops: number;
}

export interface CategoryCounts {
  engineering: number;
  design: number;
  gtm: number;
}

export interface LocationCounts {
  SF: number;
  NYC: number;
  Remote: number;
}

export interface SynergyContext {
  counts: RoleCounts;
  cat: CategoryCounts;
  loc: LocationCounts;
  total: number;
  // Weekly P&L signal so ramen-profit-style synergies can fire.
  revenue: number;
  burn: number;
  balance: number;
  week: number;
}

export interface SynergyDef {
  id: string;
  label: string;
  description: string;
  multiplier: number;
  tier?: "foundational" | "scale" | "specialist" | "situational" | "endgame";
  active: (ctx: SynergyContext) => boolean;
}

export interface SynergyReport {
  active: SynergyDef[];
  revenueMultiplier: number;
  counts: RoleCounts;
  categoryCounts: CategoryCounts;
  locationCounts: LocationCounts;
  total: number;
}

const everyCategory = (cat: CategoryCounts): boolean =>
  ROLE_CATEGORIES.every((k) => cat[k] >= 1);

// Ordered loosely by when a player unlocks them so the dashboard reads
// like a roadmap. Multipliers stack multiplicatively in recomputeRevenue.
export const SYNERGIES: SynergyDef[] = [
  // --- foundational: easy to hit, keep early game interesting ---
  {
    id: "first_hire",
    label: "First Hire",
    description: "1+ employee. Something is better than nothing.",
    multiplier: 1.03,
    tier: "foundational",
    active: (ctx) => ctx.total >= 1,
  },
  {
    id: "hacker_hustler",
    label: "Hacker + Hustler",
    description: "1+ senior eng and 1+ AE. The classic founding duo.",
    multiplier: 1.08,
    tier: "foundational",
    active: (ctx) => ctx.counts.senior_eng >= 1 && ctx.counts.sales >= 1,
  },
  {
    id: "content_machine",
    label: "Content Machine",
    description: "1+ designer and 1+ marketer. Brand compounds.",
    multiplier: 1.07,
    tier: "foundational",
    active: (ctx) => ctx.counts.designer >= 1 && ctx.counts.marketer >= 1,
  },
  {
    id: "balanced_team",
    label: "Balanced Team",
    description: "1+ of every category. Baseline credibility bonus.",
    multiplier: 1.15,
    tier: "foundational",
    active: (ctx) => everyCategory(ctx.cat),
  },
  {
    id: "product_trio",
    label: "Product Trio",
    description: "1+ eng, 1+ designer, 1+ AE. A shippable pod.",
    multiplier: 1.10,
    tier: "foundational",
    active: (ctx) =>
      ctx.cat.engineering >= 1 && ctx.cat.design >= 1 && ctx.counts.sales >= 1,
  },

  // --- scale: the next tier once the team grows ---
  {
    id: "two_pizza",
    label: "Two-Pizza Team",
    description: "5–9 headcount. Still fits around one table.",
    multiplier: 1.05,
    tier: "scale",
    active: (ctx) => ctx.total >= 5 && ctx.total <= 9,
  },
  {
    id: "eng_squad",
    label: "Engineering Squad",
    description: "3+ engineers. Ship velocity compounds.",
    multiplier: 1.12,
    tier: "scale",
    active: (ctx) => ctx.counts.junior_eng + ctx.counts.senior_eng >= 3,
  },
  {
    id: "eng_platoon",
    label: "Engineering Platoon",
    description: "6+ engineers. Parallel workstreams.",
    multiplier: 1.10,
    tier: "scale",
    active: (ctx) => ctx.counts.junior_eng + ctx.counts.senior_eng >= 6,
  },
  {
    id: "senior_bench",
    label: "Senior Bench",
    description: "2+ senior engineers. Leverage on technical bets.",
    multiplier: 1.10,
    tier: "scale",
    active: (ctx) => ctx.counts.senior_eng >= 2,
  },
  {
    id: "platform_team",
    label: "Platform Team",
    description: "3+ senior engineers. Infra stops being the bottleneck.",
    multiplier: 1.12,
    tier: "scale",
    active: (ctx) => ctx.counts.senior_eng >= 3,
  },
  {
    id: "design_studio",
    label: "Design Studio",
    description: "2+ designers. Product polish lifts conversion.",
    multiplier: 1.08,
    tier: "scale",
    active: (ctx) => ctx.counts.designer >= 2,
  },
  {
    id: "sales_org",
    label: "Sales Org",
    description: "3+ AEs. Pipeline coverage across segments.",
    multiplier: 1.15,
    tier: "scale",
    active: (ctx) => ctx.counts.sales >= 3,
  },
  {
    id: "growth_engine",
    label: "Growth Engine",
    description: "2+ AEs and 1+ marketer. Pipeline compounds.",
    multiplier: 1.20,
    tier: "scale",
    active: (ctx) => ctx.counts.sales >= 2 && ctx.counts.marketer >= 1,
  },
  {
    id: "full_funnel",
    label: "Full Funnel",
    description: "2+ AEs and 2+ marketers. Top to bottom.",
    multiplier: 1.12,
    tier: "scale",
    active: (ctx) => ctx.counts.sales >= 2 && ctx.counts.marketer >= 2,
  },
  {
    id: "product_pod",
    label: "Product Pod",
    description: "2+ engineers and 2+ designers. Design-led features.",
    multiplier: 1.10,
    tier: "scale",
    active: (ctx) =>
      ctx.cat.engineering >= 2 && ctx.counts.designer >= 2,
  },
  {
    id: "brand_voice",
    label: "Brand Voice",
    description: "2+ marketers and 1+ designer. Distinctive POV.",
    multiplier: 1.09,
    tier: "scale",
    active: (ctx) => ctx.counts.marketer >= 2 && ctx.counts.designer >= 1,
  },

  // --- specialist: non-obvious composition plays ---
  {
    id: "devtool_energy",
    label: "Devtool Energy",
    description: "3+ senior engineers, 0 designers. Pure dev-first product.",
    multiplier: 1.08,
    tier: "specialist",
    active: (ctx) => ctx.counts.senior_eng >= 3 && ctx.counts.designer === 0,
  },
  {
    id: "design_forward",
    label: "Design-Forward",
    description: "Designers ≥ engineers, and both ≥ 2. Prosumer vibes.",
    multiplier: 1.10,
    tier: "specialist",
    active: (ctx) =>
      ctx.counts.designer >= 2 &&
      ctx.cat.engineering >= 2 &&
      ctx.counts.designer >= ctx.cat.engineering,
  },
  {
    id: "apprenticeship",
    label: "Apprenticeship",
    description: "At least 2 juniors per senior engineer. Cheap velocity.",
    multiplier: 1.06,
    tier: "specialist",
    active: (ctx) =>
      ctx.counts.senior_eng >= 1 &&
      ctx.counts.junior_eng >= ctx.counts.senior_eng * 2,
  },

  // --- situational: react to state, not just roster ---
  {
    id: "ramen_profitable",
    label: "Ramen Profitable",
    description: "Revenue ≥ burn. The investors pay attention.",
    multiplier: 1.15,
    tier: "situational",
    active: (ctx) => ctx.revenue >= ctx.burn && ctx.total > 0,
  },
  {
    id: "remote_first",
    label: "Remote-First",
    description: "All hires are Remote. Lean overhead.",
    multiplier: 1.05,
    tier: "situational",
    active: (ctx) => ctx.total >= 3 && ctx.loc.Remote === ctx.total,
  },
  {
    id: "bay_area_bet",
    label: "Bay Area Bet",
    description: "3+ hires in SF. Talent density pays.",
    multiplier: 1.06,
    tier: "situational",
    active: (ctx) => ctx.loc.SF >= 3,
  },
  {
    id: "coastal_mix",
    label: "Coastal Mix",
    description: "At least 1 in each of SF, NYC, and Remote.",
    multiplier: 1.07,
    tier: "situational",
    active: (ctx) => ctx.loc.SF >= 1 && ctx.loc.NYC >= 1 && ctx.loc.Remote >= 1,
  },
  {
    id: "runway_confidence",
    label: "Runway Confidence",
    description: "Balance above $250k. Execution, not panic.",
    multiplier: 1.04,
    tier: "situational",
    active: (ctx) => ctx.balance >= 250_000,
  },

  // --- endgame: only unlocks when the company looks real ---
  {
    id: "dream_team",
    label: "Dream Team",
    description: "Balanced team with 8+ headcount. Everything clicks.",
    multiplier: 1.15,
    tier: "endgame",
    active: (ctx) => ctx.total >= 8 && everyCategory(ctx.cat),
  },
  {
    id: "unicorn_core",
    label: "Unicorn Core",
    description: "5+ eng, 2+ designers, 3+ GTM. The blueprint.",
    multiplier: 1.20,
    tier: "endgame",
    active: (ctx) =>
      ctx.cat.engineering >= 5 &&
      ctx.counts.designer >= 2 &&
      ctx.cat.gtm >= 3,
  },
  {
    id: "series_c_shape",
    label: "Series-C Shape",
    description: "20+ headcount with every category ≥ 3.",
    multiplier: 1.15,
    tier: "endgame",
    active: (ctx) =>
      ctx.total >= 20 &&
      ctx.cat.engineering >= 3 &&
      ctx.cat.design >= 3 &&
      ctx.cat.gtm >= 3,
  },
];

// Pure given a game state; no iteration required beyond one pass over employees.
// Revenue/burn are accepted as args so callers that already computed them
// (recomputeRevenue, the HUD) don't re-derive.
export function computeSynergies(
  s: Pick<GameState, "employees" | "balance" | "week"> & {
    revenuePerWeek?: number;
  },
  opts: { revenue?: number; burn?: number } = {}
): SynergyReport {
  const counts: RoleCounts = {
    junior_eng: 0,
    senior_eng: 0,
    designer: 0,
    sales: 0,
    marketer: 0,
    head_of_ops: 0,
  };
  const cat: CategoryCounts = { engineering: 0, design: 0, gtm: 0 };
  const loc: LocationCounts = { SF: 0, NYC: 0, Remote: 0 };
  for (const e of s.employees) {
    const id = e.role.id as RoleId;
    counts[id]++;
    if (e.role.category) cat[e.role.category]++;
    loc[e.location]++;
  }
  const total = s.employees.length;
  const ctx: SynergyContext = {
    counts,
    cat,
    loc,
    total,
    revenue: opts.revenue ?? s.revenuePerWeek ?? 0,
    burn: opts.burn ?? 0,
    balance: s.balance,
    week: s.week,
  };
  const active = SYNERGIES.filter((syn) => syn.active(ctx));
  const revenueMultiplier = active.reduce((acc, s) => acc * s.multiplier, 1);
  return {
    active,
    revenueMultiplier,
    counts,
    categoryCounts: cat,
    locationCounts: loc,
    total,
  };
}
