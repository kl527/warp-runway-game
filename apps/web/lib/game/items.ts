import type { GameState } from "./state";
import { FUNDRAISE_ROUNDS } from "./constants";

export type ItemRarity = "common" | "rare" | "legendary";

export interface ItemEffect {
  // Recurring: folded into revenue each tick while owned.
  revenueDelta?: number;
  revenueMultBonus?: number;
  // Recurring: folded into weekly burn while owned. Negative = savings.
  burnDelta?: number;
  // One-shot: applied at purchase.
  moraleBoost?: number;
  boardConfidenceBoost?: number;
  cashGrant?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  rarity: ItemRarity;
  basePrice: number;
  // Earliest round index this item can appear in. -1 = pre-seed, 0 = seed,
  // 1 = series-a, 2 = series-b, 3+ = C and beyond.
  minRoundIdx: number;
  effect: ItemEffect;
}

export const SHOP_ITEMS: ShopItem[] = [
  // --- pre-seed / seed era: cheap perks, small buffs ---
  {
    id: "foosball",
    name: "Foosball Table",
    blurb: "Classic. Fights over 'spinning' within the week.",
    icon: "🎮",
    rarity: "common",
    basePrice: 3_000,
    minRoundIdx: -1,
    effect: { moraleBoost: 12 },
  },
  {
    id: "espresso",
    name: "Espresso Machine",
    blurb: "Bean-forward team. Commits per hour: up.",
    icon: "☕",
    rarity: "common",
    basePrice: 6_000,
    minRoundIdx: -1,
    effect: { moraleBoost: 6, revenueMultBonus: 0.02 },
  },
  {
    id: "keyboards",
    name: "Mechanical Keyboards",
    blurb: "Every standup now has a soundtrack.",
    icon: "⌨",
    rarity: "common",
    basePrice: 4_500,
    minRoundIdx: -1,
    effect: { revenueMultBonus: 0.03 },
  },
  {
    id: "standing_desks",
    name: "Standing Desks",
    blurb: "Posture up, cycle time down.",
    icon: "🪑",
    rarity: "common",
    basePrice: 5_500,
    minRoundIdx: -1,
    effect: { revenueMultBonus: 0.02 },
  },
  {
    id: "office_dog",
    name: "Office Dog",
    blurb: "Golden retriever. Vet bills included.",
    icon: "🐕",
    rarity: "common",
    basePrice: 8_000,
    minRoundIdx: 0,
    effect: { moraleBoost: 15, burnDelta: 200 },
  },
  {
    id: "offsite",
    name: "Company Offsite",
    blurb: "Tahoe cabin. Trust falls. Nobody mentions burn.",
    icon: "🏕",
    rarity: "common",
    basePrice: 14_000,
    minRoundIdx: 0,
    effect: { moraleBoost: 20 },
  },
  {
    id: "recruiter_slack",
    name: "Recruiter Slack Channel",
    blurb: "Inbound DMs replace agency fees.",
    icon: "📨",
    rarity: "common",
    basePrice: 12_000,
    minRoundIdx: 0,
    effect: { burnDelta: -400 },
  },
  {
    id: "nft_jpeg",
    name: "NFT Profile Picture",
    blurb: "The pixel monkey as your Twitter avatar. Bold.",
    icon: "🖼",
    rarity: "common",
    basePrice: 9_000,
    minRoundIdx: 0,
    effect: { moraleBoost: 2 },
  },

  // --- seed / series-a: rare drops with real tradeoffs ---
  {
    id: "brand_studio",
    name: "Brand Studio Retainer",
    blurb: "Those pastel gradients cost a lot.",
    icon: "🎨",
    rarity: "rare",
    basePrice: 35_000,
    minRoundIdx: 0,
    effect: { revenueMultBonus: 0.06, burnDelta: 1_500 },
  },
  {
    id: "soc2",
    name: "SOC 2 Type II Audit",
    blurb: "Enterprise procurement unblocked. Finally.",
    icon: "🔒",
    rarity: "rare",
    basePrice: 45_000,
    minRoundIdx: 1,
    effect: { boardConfidenceBoost: 15, revenueDelta: 500 },
  },
  {
    id: "superbowl_ad",
    name: "Superbowl Ad Slot",
    blurb: "30 seconds of awkward startup humor.",
    icon: "📺",
    rarity: "rare",
    basePrice: 60_000,
    minRoundIdx: 1,
    effect: { cashGrant: 120_000, moraleBoost: 8 },
  },
  {
    id: "cybertruck",
    name: "Cybertruck (Company Car)",
    blurb: "Parked outside the office. Investors take photos.",
    icon: "🛻",
    rarity: "rare",
    basePrice: 80_000,
    minRoundIdx: 1,
    effect: { moraleBoost: 5, burnDelta: 800 },
  },
  {
    id: "techcrunch",
    name: "TechCrunch Feature",
    blurb: "'The Startup That's Quietly Eating [Industry].'",
    icon: "📰",
    rarity: "rare",
    basePrice: 25_000,
    minRoundIdx: 0,
    effect: { revenueDelta: 1_000, moraleBoost: 5 },
  },
  {
    id: "celebrity_advisor",
    name: "Celebrity Advisor",
    blurb: "A tweet a quarter. Half a point of equity.",
    icon: "⭐",
    rarity: "rare",
    basePrice: 55_000,
    minRoundIdx: 1,
    effect: { revenueMultBonus: 0.05, burnDelta: 2_000 },
  },

  // --- series-b+: legendary, outsized impact ---
  {
    id: "hbo_doc",
    name: "HBO Documentary Crew",
    blurb: "Cameras in every meeting. Might age poorly.",
    icon: "🎬",
    rarity: "legendary",
    basePrice: 180_000,
    minRoundIdx: 2,
    effect: { revenueMultBonus: 0.1, burnDelta: 3_000 },
  },
  {
    id: "private_jet",
    name: "Private Jet Share",
    blurb: "NetJets card. Very 'back-to-back-board-meetings' energy.",
    icon: "✈",
    rarity: "legendary",
    basePrice: 220_000,
    minRoundIdx: 2,
    effect: { boardConfidenceBoost: 10, burnDelta: 5_000 },
  },
  {
    id: "enterprise_rumor",
    name: "Enterprise Deal Rumor",
    blurb: "Someone 'leaked' the contract. Wire arrived anyway.",
    icon: "💼",
    rarity: "legendary",
    basePrice: 120_000,
    minRoundIdx: 2,
    effect: { cashGrant: 400_000 },
  },
  {
    id: "series_e_rolodex",
    name: "Series-E Rolodex",
    blurb: "The growth funds' personal cell numbers.",
    icon: "📇",
    rarity: "legendary",
    basePrice: 300_000,
    minRoundIdx: 2,
    effect: { revenueDelta: 3_000, boardConfidenceBoost: 5 },
  },
];

export function itemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

// A consumable has only one-shot effects (morale, board, cash). Nothing
// recurring to track on ownedItems, so it can be re-bought freely.
export function isConsumable(item: ShopItem): boolean {
  const eff = item.effect;
  const hasRecurring =
    !!eff.revenueDelta || !!eff.revenueMultBonus || !!eff.burnDelta;
  const hasOneShot =
    !!eff.moraleBoost || !!eff.boardConfidenceBoost || !!eff.cashGrant;
  return !hasRecurring && hasOneShot;
}

// Price scales with round — later rounds get more expensive drops, since the
// player has bigger checks to spend.
export function priceForRound(item: ShopItem, roundIdx: number): number {
  const tier = Math.max(0, roundIdx + 1); // pre-seed = 0, seed = 1, A = 2, B = 3, …
  const mult = 1 + tier * 0.35;
  return Math.round(item.basePrice * mult);
}

const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 60,
  rare: 30,
  legendary: 10,
};

// Roll a fresh offer for the given round index. Deterministic given rng.
export function rollShopOffer(
  rng: () => number,
  roundIdx: number,
  count = 4,
): { itemIds: string[]; prices: number[]; roundIdx: number } {
  const pool = SHOP_ITEMS.filter((i) => i.minRoundIdx <= roundIdx);
  const picked: ShopItem[] = [];
  const remaining = pool.slice();
  const actualCount = Math.min(count, remaining.length);

  for (let i = 0; i < actualCount; i++) {
    const totalWeight = remaining.reduce(
      (acc, item) => acc + RARITY_WEIGHTS[item.rarity],
      0,
    );
    let roll = rng() * totalWeight;
    let pickedIdx = 0;
    for (let j = 0; j < remaining.length; j++) {
      roll -= RARITY_WEIGHTS[remaining[j].rarity];
      if (roll <= 0) {
        pickedIdx = j;
        break;
      }
    }
    picked.push(remaining[pickedIdx]);
    remaining.splice(pickedIdx, 1);
  }

  return {
    roundIdx,
    itemIds: picked.map((i) => i.id),
    prices: picked.map((i) => priceForRound(i, roundIdx)),
  };
}

// Completed-round index for rolling purposes: -1 pre-seed, 0 seed, 1 series-a, …
export function roundIdxOf(round: GameState["round"]): number {
  if (round === "pre-seed") return -1;
  return FUNDRAISE_ROUNDS.findIndex((r) => r.id === round);
}

// Sum recurring effects across owned items for the revenue recompute.
export function aggregateRevenueEffects(ownedItems: string[]): {
  revenueDelta: number;
  revenueMultBonus: number;
} {
  let revenueDelta = 0;
  let revenueMultBonus = 0;
  for (const id of ownedItems) {
    const item = itemById(id);
    if (!item) continue;
    revenueDelta += item.effect.revenueDelta ?? 0;
    revenueMultBonus += item.effect.revenueMultBonus ?? 0;
  }
  return { revenueDelta, revenueMultBonus };
}

export function aggregateBurnDelta(ownedItems: string[]): number {
  let delta = 0;
  for (const id of ownedItems) {
    const item = itemById(id);
    if (!item) continue;
    delta += item.effect.burnDelta ?? 0;
  }
  return delta;
}
