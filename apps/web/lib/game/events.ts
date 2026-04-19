import type { ChoiceOption, GameState, LogEntry, RoleId } from "./state";

export interface GameEventDef {
  id: string;
  weight: number;
  minWeek: number;
  condition?: (s: GameState) => boolean;
  // Optional multiplier on the base weight. Used to bias the event roll toward
  // archetypes the player has actually hired — marketers make viral hits more
  // likely, engineers make ship events more likely, etc.
  weightScale?: (s: GameState) => number;
  effect?: (s: GameState) => void;
  message: string;
  tone?: LogEntry["tone"];
  choice?: {
    title: string;
    options: ChoiceOption[];
    resolve: Record<string, (s: GameState) => void>;
  };
}

function countRole(s: GameState, id: RoleId): number {
  let n = 0;
  for (const e of s.employees) if (e.role.id === id) n++;
  return n;
}

function countCategory(s: GameState, cat: "engineering" | "design" | "gtm"): number {
  let n = 0;
  for (const e of s.employees) if (e.role.category === cat) n++;
  return n;
}

export const EVENTS: GameEventDef[] = [
  {
    id: "viral_tweet",
    weight: 4,
    minWeek: 2,
    weightScale: (s) => 1 + countRole(s, "marketer") * 0.6,
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
    weightScale: (s) =>
      1 + countRole(s, "marketer") * 0.4 + countCategory(s, "engineering") * 0.2,
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
    weightScale: (s) => 1 + countRole(s, "sales") * 0.8,
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
    weightScale: (s) => 1 + countCategory(s, "engineering") * 0.25,
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
    weightScale: (s) =>
      1 + countRole(s, "marketer") * 0.4 + countRole(s, "sales") * 0.3,
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
    weightScale: (s) => 1 + countRole(s, "marketer") * 0.5,
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
  // ---- archetype surge events ----
  // These only fire once the player has committed to a specific build.
  // Weights scale with role count so a bigger eng team makes ship events
  // more likely, a bigger sales team makes pipeline events more likely, etc.
  {
    id: "feature_ship",
    weight: 2,
    minWeek: 3,
    condition: (s) => countCategory(s, "engineering") >= 2,
    weightScale: (s) => 1 + countCategory(s, "engineering") * 0.5,
    message: "Engineering shipped a new feature. Users noticed. +$900 MRR.",
    tone: "good",
    effect: (s) => {
      s.revenuePerWeek += 900;
    },
  },
  {
    id: "tenx_week",
    weight: 1,
    minWeek: 6,
    condition: (s) => countRole(s, "senior_eng") >= 2,
    weightScale: (s) => 1 + countRole(s, "senior_eng") * 0.6,
    message: "Senior eng pair rewrote the core path. +$2.5k MRR, +6 morale.",
    tone: "good",
    effect: (s) => {
      s.revenuePerWeek += 2_500;
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.min(100, e.morale + 6),
      }));
    },
  },
  {
    id: "enterprise_flurry",
    weight: 1,
    minWeek: 6,
    condition: (s) => countRole(s, "sales") >= 2,
    weightScale: (s) => 1 + countRole(s, "sales") * 0.7,
    message: "AEs chain-closed three mid-market deals. +$25k cash, +$1.5k MRR.",
    tone: "good",
    effect: (s) => {
      s.balance += 25_000;
      s.revenuePerWeek += 1_500;
    },
  },
  {
    id: "viral_hit",
    weight: 1,
    minWeek: 4,
    condition: (s) => countRole(s, "marketer") >= 2,
    weightScale: (s) => 1 + countRole(s, "marketer") * 0.9,
    message: "A marketer's TikTok detonated. +$6k cash, +$1.8k MRR.",
    tone: "good",
    effect: (s) => {
      s.balance += 6_000;
      s.revenuePerWeek += 1_800;
    },
  },
  {
    id: "design_polish",
    weight: 2,
    minWeek: 4,
    condition: (s) => countRole(s, "designer") >= 1,
    weightScale: (s) => 1 + countRole(s, "designer") * 0.6,
    message: "Design polish shipped. Onboarding conversion lifted. +$1.2k MRR.",
    tone: "good",
    effect: (s) => {
      s.revenuePerWeek += 1_200;
    },
  },
  {
    id: "balanced_launch",
    weight: 1,
    minWeek: 6,
    // Requires a real team — at least one of every category, 5+ headcount.
    condition: (s) =>
      s.employees.length >= 5 &&
      countCategory(s, "engineering") >= 1 &&
      countCategory(s, "design") >= 1 &&
      countCategory(s, "gtm") >= 1,
    weightScale: (s) => 1 + Math.min(s.employees.length - 5, 10) * 0.2,
    message:
      "You launched something people actually love. +$5k MRR, +10 morale across the board.",
    tone: "good",
    effect: (s) => {
      s.revenuePerWeek += 5_000;
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.min(100, e.morale + 10),
      }));
    },
  },
  // ---- Big Tech raids ----
  // FAANG-style poaching events. Unlike eng_poached (1 person), these scale
  // with how deep you are in a given role and can wipe out a chunk of the team
  // if you don't counter. Gated to later weeks so they only land once the
  // player has a real team to lose.
  {
    id: "amazon_senior_raid",
    weight: 3,
    minWeek: 14,
    condition: (s) => countRole(s, "senior_eng") >= 5,
    weightScale: (s) => 1 + countRole(s, "senior_eng") * 0.15,
    message: "Amazon opened a recruiting blitz against your senior engineers.",
    tone: "bad",
    choice: {
      title: "Amazon is buying out your senior engineers",
      options: [
        {
          key: "counter",
          label: "Counter with retention packages",
          description:
            "Match the offers. Costs ~$60k per senior engineer. Keeps the team intact and bumps eng morale.",
        },
        {
          key: "let_go",
          label: "Let them walk",
          description:
            "Lose half your senior engineers. Team-wide morale crater.",
        },
      ],
      resolve: {
        counter: (s) => {
          const n = countRole(s, "senior_eng");
          s.balance -= n * 60_000;
          s.employees = s.employees.map((e) =>
            e.role.category === "engineering"
              ? { ...e, morale: Math.min(100, e.morale + 5) }
              : e,
          );
        },
        let_go: (s) => {
          const total = countRole(s, "senior_eng");
          const toLose = Math.max(1, Math.ceil(total / 2));
          let removed = 0;
          s.employees = s.employees.filter((e) => {
            if (removed < toLose && e.role.id === "senior_eng") {
              removed++;
              return false;
            }
            return true;
          });
          s.employees = s.employees.map((e) => ({
            ...e,
            morale: Math.max(0, e.morale - 15),
          }));
        },
      },
    },
  },
  {
    id: "google_designer_raid",
    weight: 2,
    minWeek: 12,
    condition: (s) => countRole(s, "designer") >= 3,
    weightScale: (s) => 1 + countRole(s, "designer") * 0.2,
    message: "Google Design is cold-emailing every designer on your team.",
    tone: "bad",
    choice: {
      title: "Google is poaching your designers",
      options: [
        {
          key: "counter",
          label: "Equity refresh ($45k each)",
          description: "Keep them all. Design morale gets a lift.",
        },
        {
          key: "let_go",
          label: "Let them walk",
          description: "Lose a third of your designers. Morale hit.",
        },
      ],
      resolve: {
        counter: (s) => {
          const n = countRole(s, "designer");
          s.balance -= n * 45_000;
          s.employees = s.employees.map((e) =>
            e.role.id === "designer"
              ? { ...e, morale: Math.min(100, e.morale + 6) }
              : e,
          );
        },
        let_go: (s) => {
          const total = countRole(s, "designer");
          const toLose = Math.max(1, Math.ceil(total / 3));
          let removed = 0;
          s.employees = s.employees.filter((e) => {
            if (removed < toLose && e.role.id === "designer") {
              removed++;
              return false;
            }
            return true;
          });
          s.employees = s.employees.map((e) => ({
            ...e,
            morale: Math.max(0, e.morale - 10),
          }));
        },
      },
    },
  },
  {
    id: "stripe_sales_raid",
    weight: 2,
    minWeek: 14,
    condition: (s) => countRole(s, "sales") >= 4,
    weightScale: (s) => 1 + countRole(s, "sales") * 0.2,
    message: "Stripe's recruiters are dangling big OTE at your AEs.",
    tone: "bad",
    choice: {
      title: "Stripe is raiding your sales floor",
      options: [
        {
          key: "counter",
          label: "Boost commissions ($30k each)",
          description: "Keep your AEs. Sales morale up.",
        },
        {
          key: "let_go",
          label: "Let them walk",
          description:
            "Lose a third of your AEs. MRR takes a hit next tick. Morale drops.",
        },
      ],
      resolve: {
        counter: (s) => {
          const n = countRole(s, "sales");
          s.balance -= n * 30_000;
          s.employees = s.employees.map((e) =>
            e.role.id === "sales"
              ? { ...e, morale: Math.min(100, e.morale + 5) }
              : e,
          );
        },
        let_go: (s) => {
          const total = countRole(s, "sales");
          const toLose = Math.max(1, Math.ceil(total / 3));
          let removed = 0;
          s.employees = s.employees.filter((e) => {
            if (removed < toLose && e.role.id === "sales") {
              removed++;
              return false;
            }
            return true;
          });
          s.employees = s.employees.map((e) => ({
            ...e,
            morale: Math.max(0, e.morale - 10),
          }));
        },
      },
    },
  },
  {
    id: "meta_marketer_raid",
    weight: 2,
    minWeek: 12,
    condition: (s) => countRole(s, "marketer") >= 3,
    weightScale: (s) => 1 + countRole(s, "marketer") * 0.2,
    message: "Meta's growth team is spamming LinkedIn InMails at your marketers.",
    tone: "bad",
    choice: {
      title: "Meta is poaching your marketing team",
      options: [
        {
          key: "counter",
          label: "Grant RSUs ($25k each)",
          description: "Keep them. Marketing morale up.",
        },
        {
          key: "let_go",
          label: "Let them walk",
          description: "Lose a third of your marketers. Morale drops.",
        },
      ],
      resolve: {
        counter: (s) => {
          const n = countRole(s, "marketer");
          s.balance -= n * 25_000;
          s.employees = s.employees.map((e) =>
            e.role.id === "marketer"
              ? { ...e, morale: Math.min(100, e.morale + 5) }
              : e,
          );
        },
        let_go: (s) => {
          const total = countRole(s, "marketer");
          const toLose = Math.max(1, Math.ceil(total / 3));
          let removed = 0;
          s.employees = s.employees.filter((e) => {
            if (removed < toLose && e.role.id === "marketer") {
              removed++;
              return false;
            }
            return true;
          });
          s.employees = s.employees.map((e) => ({
            ...e,
            morale: Math.max(0, e.morale - 8),
          }));
        },
      },
    },
  },
  // Uncontested mass exodus — no choice, hurts. Rare and late-game only.
  {
    id: "openai_engineering_exodus",
    weight: 1,
    minWeek: 24,
    condition: (s) => countCategory(s, "engineering") >= 10,
    message:
      "OpenAI signed 20% of your engineering org before you even heard about it. No counter.",
    tone: "bad",
    effect: (s) => {
      const engs = s.employees.filter((e) => e.role.category === "engineering");
      const toLose = Math.max(1, Math.round(engs.length * 0.2));
      let removed = 0;
      s.employees = s.employees.filter((e) => {
        if (removed < toLose && e.role.category === "engineering") {
          removed++;
          return false;
        }
        return true;
      });
      s.employees = s.employees.map((e) => ({
        ...e,
        morale: Math.max(0, e.morale - 12),
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

function effectiveWeight(ev: GameEventDef, s: GameState): number {
  const scale = ev.weightScale ? ev.weightScale(s) : 1;
  return Math.max(0, ev.weight * scale);
}

export function rollEvent(s: GameState, rng: () => number): GameEventDef | null {
  const eligible: { ev: GameEventDef; w: number }[] = [];
  let totalWeight = 0;
  for (const ev of EVENTS) {
    if (s.week < ev.minWeek) continue;
    if (ev.condition && !ev.condition(s)) continue;
    const w = effectiveWeight(ev, s);
    if (w <= 0) continue;
    eligible.push({ ev, w });
    totalWeight += w;
  }
  if (totalWeight <= 0) return null;
  let r = rng() * totalWeight;
  for (const { ev, w } of eligible) {
    r -= w;
    if (r <= 0) return ev;
  }
  return eligible[eligible.length - 1].ev;
}
