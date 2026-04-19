"use client";

import { useMemo, useState } from "react";
import { ROLES } from "@/lib/game/roles";
import { LOCATION_MULTIPLIERS, type LocationId } from "@/lib/game/constants";
import { useActions, useGameStore } from "@/lib/game/store";
import { calcHireCost, headcountByRole } from "@/lib/game/valuation";
import { getMap, officeCapacity } from "@/lib/game/map";
import {
  itemById,
  type ItemEffect,
  type ItemRarity,
  type ShopItem,
} from "@/lib/game/items";
import { ModalShell } from "./ModalShell";
import { sfx } from "@/lib/game/sounds";

const LOCATIONS: LocationId[] = ["SF", "NYC", "Remote"];
const MAX_QTY = 20;

export function HireModal() {
  const actions = useActions();
  const balance = useGameStore((s) => s.balance);
  const employees = useGameStore((s) => s.employees);
  const round = useGameStore((s) => s.round);
  const shopOffer = useGameStore((s) => s.shopOffer);
  const ownedItems = useGameStore((s) => s.ownedItems);
  const [location, setLocation] = useState<LocationId>("SF");
  const [qtyByRole, setQtyByRole] = useState<Record<string, number>>({});

  const counts = useMemo(() => headcountByRole(employees), [employees]);
  const capacity = useMemo(() => officeCapacity(getMap(round)), [round]);
  const freeSeats = Math.max(0, capacity - employees.length);
  const officeFull = freeSeats <= 0;

  const setQty = (roleId: string, q: number) =>
    setQtyByRole((prev) => ({
      ...prev,
      [roleId]: Math.max(1, Math.min(MAX_QTY, q)),
    }));

  return (
    <ModalShell title="HIRE SHOP" wide onClose={actions.closeModal}>
      <div
        className={`mb-3 text-xs flex items-center justify-between rounded-lg px-3 py-1.5 ${
          officeFull
            ? "shadow-[inset_0_0_0_1px_rgba(255,35,35,0.3)] bg-warp-red-12/30 text-warp-red-9"
            : "shadow-ring-w bg-white/[0.02] text-white/75"
        }`}
      >
        <span className="tabular-nums">
          Desks {employees.length}/{capacity}
        </span>
        <span className="font-brand text-[10px] uppercase tracking-[0.14em]">
          {officeFull ? "Full — raise to expand" : `${freeSeats} free`}
        </span>
      </div>
      <div className="flex gap-2 mb-3">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocation(loc)}
            className={`px-3 py-1 rounded-lg text-xs transition ${
              location === loc
                ? "bg-warp-orange text-white shadow-[0_4px_12px_-4px_rgba(255,61,0,0.5)]"
                : "shadow-ring-w text-white/75 hover:bg-white/[0.04]"
            }`}
          >
            {loc} x{LOCATION_MULTIPLIERS[loc]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {ROLES.map((role) => {
          const mult = LOCATION_MULTIPLIERS[location];
          const weeklySalary = Math.round((role.baseSalary * mult) / 52);
          const qty = qtyByRole[role.id] ?? 1;
          const existing = counts.get(role.id) ?? 0;
          const nextCost = role.disabled
            ? 0
            : calcHireCost(role, existing, 1, location).total;
          const totalCost = role.disabled
            ? 0
            : calcHireCost(role, existing, qty, location).total;
          const unaffordable = balance < totalCost;
          const overCapacity = !role.disabled && qty > freeSeats;
          const disabled = role.disabled || unaffordable || overCapacity;
          return (
            <div
              key={role.id}
              className={`rounded-lg px-2.5 py-1.5 min-w-0 ${
                role.disabled
                  ? "shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)] bg-warp-amber-9/[0.05]"
                  : "shadow-ring-w bg-white/[0.02]"
              }`}
            >
              {role.disabled ? (
                <div className="flex items-center gap-2 text-[11px] min-h-[44px]">
                  <span className="font-bold text-cyan-300">{role.char}</span>
                  <span className="font-bold text-slate-100">{role.name}</span>
                  <span className="text-warp-amber-9 truncate">
                    {role.disabledTooltip}
                  </span>
                  {role.disabledUrl && (
                    <a
                      href={role.disabledUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto underline text-warp-amber-8 hover:text-warp-amber-9 shrink-0"
                    >
                      warp.co
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[11px] leading-tight mb-1 min-w-0">
                    <span className="font-bold text-cyan-300 shrink-0">
                      {role.char}
                    </span>
                    <span className="font-bold text-slate-100 shrink-0">
                      {role.name}
                    </span>
                    {existing > 0 && (
                      <span className="font-brand text-[10px] text-white/40 uppercase tracking-[0.14em] shrink-0">
                        ×{existing}
                      </span>
                    )}
                    <span className="ml-auto text-emerald-300 truncate min-w-0">
                      {formatEffect(role.weeklyEffect)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] min-w-0">
                    <span className="text-white/55 tabular-nums truncate min-w-0">
                      ${weeklySalary.toLocaleString()}/wk
                    </span>
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center rounded shadow-ring-w overflow-hidden">
                        <button
                          onClick={() => setQty(role.id, qty - 1)}
                          disabled={qty <= 1}
                          aria-label="Decrease quantity"
                          className="px-1.5 text-white/85 hover:bg-white/[0.05] disabled:opacity-40 transition"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={MAX_QTY}
                          value={qty}
                          onChange={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            if (!isNaN(parsed)) setQty(role.id, parsed);
                          }}
                          className="w-8 bg-transparent text-center text-xs tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => setQty(role.id, qty + 1)}
                          disabled={qty >= MAX_QTY}
                          aria-label="Increase quantity"
                          className="px-1.5 text-white/85 hover:bg-white/[0.05] disabled:opacity-40 transition"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          sfx.play("hire");
                          actions.hireMany(role.id, location, qty);
                        }}
                        disabled={disabled}
                        className="px-2.5 py-1 rounded bg-warp-orange text-white text-[11px] font-medium hover:bg-warp-orange-hover transition disabled:bg-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {officeFull
                          ? "FULL"
                          : overCapacity
                            ? `${freeSeats} LEFT`
                            : unaffordable
                              ? "CAN'T AFFORD"
                              : `HIRE · $${totalCost.toLocaleString()}`}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <ShopSection
        shopOffer={shopOffer}
        ownedItems={ownedItems}
        balance={balance}
        onBuy={(id) => {
          sfx.play("hire");
          actions.buyShopItem(id);
        }}
      />

      <p className="font-mono text-[10px] text-white/35 mt-3">
        Salary auto-deducted weekly. Shop refreshes each round. Esc to close.
      </p>
    </ModalShell>
  );
}

function ShopSection({
  shopOffer,
  ownedItems,
  balance,
  onBuy,
}: {
  shopOffer: ReturnType<typeof useGameStore.getState>["shopOffer"];
  ownedItems: string[];
  balance: number;
  onBuy: (id: string) => void;
}) {
  const ownedCount = ownedItems.length;
  const offerItems = shopOffer
    ? shopOffer.itemIds
        .map((id, i) => {
          const item = itemById(id);
          if (!item) return null;
          return { item, price: shopOffer.prices[i] };
        })
        .filter((x): x is { item: ShopItem; price: number } => x !== null)
    : [];

  return (
    <div className="mt-4 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-brand text-xs uppercase tracking-[0.14em] text-warp-accent-3">
          Shop · Fresh Drops
        </h3>
        <span className="font-mono text-[10px] text-white/40">
          {ownedCount > 0 ? `${ownedCount} owned · ` : ""}rerolls at next round
        </span>
      </div>
      {offerItems.length === 0 ? (
        <div className="text-[11px] text-white/40 italic px-1 py-2">
          All drops claimed. Close a round to reroll.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {offerItems.map(({ item, price }) => {
            const unaffordable = balance < price;
            return (
              <div
                key={item.id}
                className="rounded-lg px-2.5 py-1.5 shadow-ring-w bg-white/[0.02] min-w-0"
              >
                <div className="flex items-center gap-2 text-[11px] leading-tight mb-1 min-w-0">
                  <span className="text-base leading-none shrink-0">
                    {item.icon}
                  </span>
                  <span className="font-bold text-slate-100 truncate min-w-0">
                    {item.name}
                  </span>
                  <RarityChip rarity={item.rarity} />
                  <span className="ml-auto text-emerald-300 truncate min-w-0 shrink-0 max-w-[55%] text-right">
                    {formatItemEffect(item.effect)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] min-w-0">
                  <span className="text-white/50 truncate min-w-0">
                    {item.blurb}
                  </span>
                  <button
                    onClick={() => onBuy(item.id)}
                    disabled={unaffordable}
                    className="ml-auto shrink-0 px-2.5 py-1 rounded bg-warp-orange text-white text-[11px] font-medium hover:bg-warp-orange-hover transition disabled:bg-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {unaffordable
                      ? "CAN'T AFFORD"
                      : `BUY · $${price.toLocaleString()}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RarityChip({ rarity }: { rarity: ItemRarity }) {
  const styles: Record<ItemRarity, string> = {
    common: "text-white/45 shadow-ring-w",
    rare: "text-sky-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.3)]",
    legendary:
      "text-amber-300 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]",
  };
  return (
    <span
      className={`font-brand text-[9px] uppercase tracking-[0.14em] px-1 py-[1px] rounded ${styles[rarity]}`}
    >
      {rarity}
    </span>
  );
}

function formatItemEffect(eff: ItemEffect): string {
  const parts: string[] = [];
  if (eff.revenueDelta) parts.push(`+$${eff.revenueDelta.toLocaleString()}/wk`);
  if (eff.revenueMultBonus)
    parts.push(`+${Math.round(eff.revenueMultBonus * 100)}% rev`);
  if (eff.burnDelta) {
    const sign = eff.burnDelta > 0 ? "+" : "−";
    parts.push(`${sign}$${Math.abs(eff.burnDelta).toLocaleString()}/wk burn`);
  }
  if (eff.moraleBoost) parts.push(`+${eff.moraleBoost} morale`);
  if (eff.boardConfidenceBoost) parts.push(`+${eff.boardConfidenceBoost} board`);
  if (eff.cashGrant) parts.push(`+$${eff.cashGrant.toLocaleString()} cash`);
  return parts.join(" · ") || "vibes";
}

function formatEffect(eff: {
  revenue_delta?: number;
  revenue_multiplier_bonus?: number;
  morale_bonus?: number;
}): string {
  const parts: string[] = [];
  if (eff.revenue_delta) parts.push(`+$${eff.revenue_delta}/wk MRR`);
  if (eff.revenue_multiplier_bonus)
    parts.push(`+${Math.round(eff.revenue_multiplier_bonus * 100)}% rev mult`);
  if (eff.morale_bonus) parts.push(`+${eff.morale_bonus} morale`);
  return parts.join(", ") || "team vibes";
}
