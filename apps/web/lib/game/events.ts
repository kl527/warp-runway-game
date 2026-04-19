import type { ChoiceOption, GameState, LogEntry } from "./state";

export interface GameEventDef {
  id: string;
  weight: number;
  minWeek: number;
  condition?: (s: GameState) => boolean;
  effect?: (s: GameState) => void;
  message: string;
  tone?: LogEntry["tone"];
  choice?: {
    title: string;
    options: ChoiceOption[];
    resolve: Record<string, (s: GameState) => void>;
  };
}

export const EVENTS: GameEventDef[] = [
  {
    id: "viral_tweet",
    weight: 4,
    minWeek: 2,
    message: "Your tweet went viral. +$5k cash, +$500 MRR.",
    tone: "good",
    effect: (s) => {
      s.balance += 5_000;
      s.revenuePerWeek += 500;
    },
  },
  {
    id: "aws_bill_shock",
    weight: 3,
    minWeek: 4,
    message: "AWS bill anomaly: an intern left EC2 running. -$8k.",
    tone: "bad",
    effect: (s) => {
      s.balance -= 8_000;
    },
  },
  {
    id: "yc_demo_day",
    weight: 2,
    minWeek: 3,
    condition: (s) => s.revenuePerWeek >= 500,
    message: "YC demo day bump: +$10k cash.",
    tone: "good",
    effect: (s) => {
      s.balance += 10_000;
    },
  },
  {
    id: "hacker_news_front_page",
    weight: 2,
    minWeek: 3,
    message: "Hacker News front page. +$3k MRR, team morale up.",
    tone: "good",
    effect: (s) => {
      s.revenuePerWeek += 3_000;
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.min(100, e.morale + 8),
      }));
    },
  },
  {
    id: "office_lease_hike",
    weight: 2,
    minWeek: 6,
    message: "Landlord raised rent. -$6k cash.",
    tone: "bad",
    effect: (s) => {
      s.balance -= 6_000;
    },
  },
  {
    id: "designer_burnout",
    weight: 2,
    minWeek: 5,
    condition: (s) => s.employees.some((e) => e.role.id === "designer"),
    message: "Your designer is burning out. Team morale, -6.",
    tone: "bad",
    effect: (s) => {
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.max(0, e.morale - 6),
      }));
    },
  },
  {
    id: "sales_mega_deal",
    weight: 2,
    minWeek: 6,
    condition: (s) => s.employees.some((e) => e.role.id === "sales"),
    message: "Your AE closed a whale. +$15k cash.",
    tone: "good",
    effect: (s) => {
      s.balance += 15_000;
    },
  },
  {
    id: "lawsuit_scare",
    weight: 1,
    minWeek: 10,
    message: "Patent troll letter. Legal fees, -$12k.",
    tone: "bad",
    effect: (s) => {
      s.balance -= 12_000;
    },
  },
  {
    id: "open_source_contributor",
    weight: 2,
    minWeek: 4,
    message: "A stranger on GitHub fixed a bug. Morale +4.",
    tone: "good",
    effect: (s) => {
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.min(100, e.morale + 4),
      }));
    },
  },
  {
    id: "chatgpt_replaces_marketer",
    weight: 1,
    minWeek: 8,
    condition: (s) => s.employees.some((e) => e.role.id === "marketer"),
    message: "The AI wrote better copy than your marketer this week. Awkward.",
    tone: "neutral",
    effect: (s) => {
      s.employees = s.employees.map((e) =>
        e.role.id === "marketer" ? { ...e, morale: Math.max(0, e.morale - 15) } : e
      );
    },
  },
  {
    id: "spurious_refund",
    weight: 2,
    minWeek: 5,
    message: "Big customer bounced on renewal. -$2k MRR.",
    tone: "bad",
    effect: (s) => {
      s.revenuePerWeek = Math.max(0, s.revenuePerWeek - 2_000);
    },
  },
  {
    id: "intern_caffeine",
    weight: 3,
    minWeek: 2,
    message: "Intern ordered La Marzocco espresso machine. -$4k.",
    tone: "bad",
    effect: (s) => {
      s.balance -= 4_000;
    },
  },
  {
    id: "conference_booth_win",
    weight: 2,
    minWeek: 7,
    message: "Conference booth generated leads. +$2k MRR.",
    tone: "good",
    effect: (s) => {
      s.revenuePerWeek += 2_000;
    },
  },
  {
    id: "ad_blocker_wave",
    weight: 1,
    minWeek: 8,
    message: "Ad-blocker wave tanked signups. -$1k MRR.",
    tone: "bad",
    effect: (s) => {
      s.revenuePerWeek = Math.max(0, s.revenuePerWeek - 1_000);
    },
  },
  {
    id: "pivot_rumor",
    weight: 1,
    minWeek: 8,
    message: "TechCrunch rumor about your pivot. Press is press.",
    tone: "neutral",
    effect: (s) => {
      s.balance += 1_000;
    },
  },
  {
    id: "team_lunch",
    weight: 3,
    minWeek: 2,
    condition: (s) => s.employees.length > 0,
    message: "Team lunch. -$600 cash, +5 morale.",
    tone: "good",
    effect: (s) => {
      s.balance -= 600;
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.min(100, e.morale + 5),
      }));
    },
  },
  {
    id: "cofounder_tantrum",
    weight: 1,
    minWeek: 10,
    message: "Your cofounder had a tantrum on Slack. -4 morale.",
    tone: "bad",
    effect: (s) => {
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.max(0, e.morale - 4),
      }));
    },
  },
  {
    id: "downround_whispers",
    weight: 1,
    minWeek: 20,
    condition: (s) => s.round !== "pre-seed",
    message: "Whispers of a down round. Morale -3.",
    tone: "bad",
    effect: (s) => {
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.max(0, e.morale - 3),
      }));
    },
  },
  {
    id: "compliance_audit",
    weight: 1,
    minWeek: 12,
    message: "SOC 2 audit. -$9k cash.",
    tone: "bad",
    effect: (s) => {
      s.balance -= 9_000;
    },
  },
  {
    id: "laptop_theft",
    weight: 1,
    minWeek: 6,
    condition: (s) => s.employees.length >= 3,
    message: "Laptop stolen at a coffee shop. -$3k.",
    tone: "bad",
    effect: (s) => {
      s.balance -= 3_000;
    },
  },
  {
    id: "stripe_holds_payout",
    weight: 1,
    minWeek: 8,
    condition: (s) => s.revenuePerWeek > 2_000,
    message: "Stripe held your payout for review. -$7k this week.",
    tone: "bad",
    effect: (s) => {
      s.balance -= 7_000;
    },
  },
  {
    id: "employee_birthday",
    weight: 2,
    minWeek: 3,
    condition: (s) => s.employees.length > 0,
    message: "Someone turned 30. Cake, balloons, +3 morale, -$300.",
    tone: "good",
    effect: (s) => {
      s.balance -= 300;
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.min(100, e.morale + 3),
      }));
    },
  },
  {
    id: "seo_win",
    weight: 2,
    minWeek: 5,
    message: "Ranked #1 for your main keyword. +$1.2k MRR.",
    tone: "good",
    effect: (s) => {
      s.revenuePerWeek += 1_200;
    },
  },
  {
    id: "press_hit_bad",
    weight: 1,
    minWeek: 10,
    message: "A snarky Verge piece went live. MRR dipped.",
    tone: "bad",
    effect: (s) => {
      s.revenuePerWeek = Math.max(0, s.revenuePerWeek - 800);
    },
  },
  {
    id: "warp_fourth_wall",
    weight: 2,
    minWeek: 5,
    message: "Your HR spreadsheet corrupted. If only you had Warp...",
    tone: "bad",
    effect: (s) => {
      s.balance -= 2_000;
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.max(0, e.morale - 5),
      }));
    },
  },
  {
    id: "eng_poached",
    weight: 3,
    minWeek: 6,
    condition: (s) => s.employees.some((e) => e.role.id === "senior_eng"),
    message: "Your lead engineer got a Stripe offer.",
    tone: "neutral",
    choice: {
      title: "Counter the offer?",
      options: [
        {
          key: "retain",
          label: "Pay $40k retention",
          description: "Keep your senior engineer. Costs $40k.",
        },
        {
          key: "let_go",
          label: "Let them walk",
          description: "Lose a senior engineer and some morale.",
        },
      ],
      resolve: {
        retain: (s) => {
          s.balance -= 40_000;
          s.employees = s.employees.map((e) =>
            e.role.id === "senior_eng" ? { ...e, morale: Math.min(100, e.morale + 5) } : e
          );
        },
        let_go: (s) => {
          // remove first senior_eng found
          const idx = s.employees.findIndex((e) => e.role.id === "senior_eng");
          if (idx >= 0) s.employees.splice(idx, 1);
          s.employees = s.employees.map((e) => ({
            ...e,
            morale: Math.max(0, e.morale - 8),
          }));
        },
      },
    },
  },
];

export function rollEvent(s: GameState, rng: () => number): GameEventDef | null {
  const eligible = EVENTS.filter(
    (ev) => s.week >= ev.minWeek && (!ev.condition || ev.condition(s))
  );
  if (eligible.length === 0) return null;
  const totalWeight = eligible.reduce((acc, ev) => acc + ev.weight, 0);
  let r = rng() * totalWeight;
  for (const ev of eligible) {
    r -= ev.weight;
    if (r <= 0) return ev;
  }
  return eligible[eligible.length - 1];
}
