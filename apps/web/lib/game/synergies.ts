import { ROLE_CATEGORIES } from "./constants";
import type { GameState, RoleId } from "./state";

export interface SynergyDef {
  id: string;
  label: string;
  description: string;
  multiplier: number;
  active: (counts: RoleCounts, catCounts: CategoryCounts, total: number) => boolean;
}

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

export interface SynergyReport {
  active: SynergyDef[];
  revenueMultiplier: number;
  counts: RoleCounts;
  categoryCounts: CategoryCounts;
  total: number;
}

export const SYNERGIES: SynergyDef[] = [
  {
    id: "balanced_team",
    label: "Balanced Team",
    description: "1+ of every category. Baseline credibility bonus.",
    multiplier: 1.15,
    active: (_c, cat) => ROLE_CATEGORIES.every((k) => cat[k] >= 1),
  },
  {
    id: "eng_squad",
    label: "Engineering Squad",
    description: "3+ engineers. Ship velocity compounds.",
    multiplier: 1.12,
    active: (c) => c.junior_eng + c.senior_eng >= 3,
  },
  {
    id: "senior_bench",
    label: "Senior Bench",
    description: "2+ senior engineers. Leverage on technical bets.",
    multiplier: 1.10,
    active: (c) => c.senior_eng >= 2,
  },
  {
    id: "design_studio",
    label: "Design Studio",
    description: "2+ designers. Product polish lifts conversion.",
    multiplier: 1.08,
    active: (c) => c.designer >= 2,
  },
  {
    id: "growth_engine",
    label: "Growth Engine",
    description: "2+ AEs and 1+ marketer. Pipeline compounds.",
    multiplier: 1.20,
    active: (c) => c.sales >= 2 && c.marketer >= 1,
  },
  {
    id: "dream_team",
    label: "Dream Team",
    description: "Balanced team with 8+ headcount. Everything clicks.",
    multiplier: 1.15,
    active: (_c, cat, total) =>
      total >= 8 && ROLE_CATEGORIES.every((k) => cat[k] >= 1),
  },
];

export function computeSynergies(s: Pick<GameState, "employees">): SynergyReport {
  const counts: RoleCounts = {
    junior_eng: 0,
    senior_eng: 0,
    designer: 0,
    sales: 0,
    marketer: 0,
    head_of_ops: 0,
  };
  const cat: CategoryCounts = { engineering: 0, design: 0, gtm: 0 };
  for (const e of s.employees) {
    const id = e.role.id as RoleId;
    counts[id]++;
    if (e.role.category) cat[e.role.category]++;
  }
  const total = s.employees.length;
  const active = SYNERGIES.filter((syn) => syn.active(counts, cat, total));
  const revenueMultiplier = active.reduce((acc, s) => acc * s.multiplier, 1);
  return { active, revenueMultiplier, counts, categoryCounts: cat, total };
}
