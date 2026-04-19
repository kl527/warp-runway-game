import type { GameState } from "@/lib/game/state";
import { teamDistribution } from "@/lib/game/selectors";
import { runwayWeeks, valuation, weeklyBurn } from "@/lib/game/valuation";

export interface BuildDigest {
  text: string;
}

export function buildDigest(state: GameState): BuildDigest {
  const burn = weeklyBurn(state);
  const runway = runwayWeeks(state);
  const val = valuation(state);
  const foundersPct = Math.round(state.capTable.founders * 100);

  const roleCounts = new Map<string, number>();
  for (const e of state.employees) {
    roleCounts.set(e.role.id, (roleCounts.get(e.role.id) ?? 0) + 1);
  }
  const team =
    state.employees.length === 0
      ? "solo founder, no hires yet"
      : Array.from(roleCounts.entries())
          .map(([id, n]) => `${n}x ${id}`)
          .join(", ");

  const locationCounts = new Map<string, number>();
  for (const e of state.employees) {
    locationCounts.set(e.location, (locationCounts.get(e.location) ?? 0) + 1);
  }
  const locations =
    state.employees.length === 0
      ? "n/a"
      : Array.from(locationCounts.entries())
          .map(([loc, n]) => `${n} ${loc}`)
          .join(", ");

  const capTable =
    state.capTable.investors.length === 0
      ? "100% founders"
      : `${foundersPct}% founders, ${state.capTable.investors
          .map((i) => `${Math.round(i.pct * 100)}% ${i.round}`)
          .join(", ")}`;

  const recentLog = state.eventLog
    .slice(-5)
    .map((e) => `  w${e.week} (${e.tone}): ${e.message}`)
    .join("\n");

  const runwayStr = runway === Infinity ? "infinite (profitable)" : `${runway} weeks`;
  const dist = teamDistribution(state);

  const lines = [
    `Week: ${state.week}`,
    `Round: ${state.round}`,
    `Balance: $${state.balance.toLocaleString()}`,
    `Weekly burn: $${burn.toLocaleString()}`,
    `Weekly revenue (MRR/4): $${state.revenuePerWeek.toLocaleString()}`,
    `Runway: ${runwayStr}`,
    `Valuation (rev * 52 * 10): $${val.toLocaleString()}`,
    `Team (${state.employees.length}): ${team}`,
    `Team coverage: engineering=${dist.counts.engineering}, design=${dist.counts.design}, gtm=${dist.counts.gtm} (${dist.coveredCategories}/3 categories)`,
    `Locations: ${locations}`,
    `Morale: ${state.morale}/100`,
    `Cap table: ${capTable}`,
    `Peak headcount: ${state.peakHeadcount}`,
    `Recent events:\n${recentLog || "  (none)"}`,
  ];

  return { text: lines.join("\n") };
}
