import { WARP_URL } from "./constants";
import type { Role } from "./state";

export const ROLES: Role[] = [
  {
    id: "junior_eng",
    name: "Junior Engineer",
    char: "e",
    baseSalary: 120_000,
    signingBonus: 5_000,
    weeklyEffect: { revenue_delta: 200 },
  },
  {
    id: "senior_eng",
    name: "Senior Engineer",
    char: "E",
    baseSalary: 220_000,
    signingBonus: 15_000,
    weeklyEffect: { revenue_delta: 600 },
  },
  {
    id: "designer",
    name: "Designer",
    char: "D",
    baseSalary: 150_000,
    signingBonus: 8_000,
    weeklyEffect: { revenue_multiplier_bonus: 0.05 },
  },
  {
    id: "sales",
    name: "Account Executive",
    char: "S",
    baseSalary: 130_000,
    signingBonus: 10_000,
    weeklyEffect: { revenue_delta: 1_000 },
  },
  {
    id: "marketer",
    name: "Marketer",
    char: "M",
    baseSalary: 140_000,
    signingBonus: 7_000,
    weeklyEffect: { revenue_delta: 400, morale_bonus: 1 },
  },
  {
    id: "head_of_ops",
    name: "Head of Operations",
    char: "P",
    baseSalary: 0,
    signingBonus: 0,
    weeklyEffect: {},
    disabled: true,
    disabledTooltip: "Or just use Warp. Seriously.",
    disabledUrl: WARP_URL,
  },
];

export function roleById(id: string): Role | undefined {
  return ROLES.find((r) => r.id === id);
}
