import {
  COFFEE_MORALE_BOOST,
  EASTER_EGG_CASH_GIFT,
  EASTER_EGG_LIFETIME_WEEKS,
  EASTER_EGG_MAX_ON_BOARD,
  EASTER_EGG_SPAWN_CHANCE,
  EVENT_PROBABILITY,
  FUNDRAISE_ROUNDS,
  UNICORN_VALUATION,
  LOCATION_MULTIPLIERS,
  MAX_LOG_ENTRIES,
  MORALE_BASELINE,
  QUIT_DEADLINE_TICKS,
  QUIT_MORALE_THRESHOLD,
  QUITTER_MORALE_PENALTY,
  RESCUE_MORALE_RESTORE,
  SHUFFLE_EVERY_TICKS,
  STARTING_BALANCE,
} from "./constants";
import type { LocationId } from "./constants";
import { cellKey, getMap, inOffice, isWalkable, kindAt } from "./map";
import { makeName } from "./names";
import { roleById, ROLES } from "./roles";
import type { ChoiceOption, EasterEgg, Employee, GameState, LogEntry, Role, RoundId } from "./state";
import { pickWarpFeature, WARP_FEATURES } from "./warpFeatures";
import { nextHireCost, runwayWeeks, valuation, weeklyBurn } from "./valuation";
import { teamDistribution } from "./selectors";
import { ROLE_CATEGORIES } from "./constants";
import { EVENTS, rollEvent, type GameEventDef } from "./events";
import { computeSynergies } from "./synergies";

// Deterministic-ish RNG seeded by rngSeed. Mulberry32.
function makeRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function initialState(): GameState {
  const startMap = getMap("pre-seed");
  return {
    week: 0,
    balance: STARTING_BALANCE,
    startingBalance: STARTING_BALANCE,
    employees: [],
    revenuePerWeek: 0,
    morale: 100,
    lastInteractionWeek: 0,
    capTable: { founders: 1.0, investors: [] },
    round: "pre-seed",
    eventLog: [
      {
        week: 0,
        message: "Company founded. $500k in the bank. Good luck.",
        tone: "neutral",
      },
    ],
    paused: false,
    speed: 1,
    gameOver: null,
    position: { ...startMap.spawn },
    modal: null,
    peakHeadcount: 0,
    tickCount: 0,
    history: [
      {
        week: 0,
        balance: STARTING_BALANCE,
        revenue: 0,
        headcount: 0,
      },
    ],
    rngSeed: Math.floor(Math.random() * 2 ** 31),
    easterEggs: [],
  };
}

function pushLog(s: GameState, entry: LogEntry): void {
  s.eventLog.push(entry);
  if (s.eventLog.length > MAX_LOG_ENTRIES) {
    s.eventLog.splice(0, s.eventLog.length - MAX_LOG_ENTRIES);
  }
}

function recomputeRevenue(s: GameState): void {
  let base = 0;
  let mult = 1;
  for (const e of s.employees) {
    // Yellow (quitting) employees have checked out — no output until rescued.
    if (e.quittingSinceTick !== null) continue;
    const eff = e.role.weeklyEffect;
    if (eff.revenue_delta) base += eff.revenue_delta;
    if (eff.revenue_multiplier_bonus) mult += eff.revenue_multiplier_bonus;
  }
  // Morale modifier: 50% morale = 0.8x, 100% = 1.1x.
  const moraleMod = 0.8 + (s.morale / 100) * 0.3;
  const preSynergy = base * mult * moraleMod;
  // Synergies compare the pre-synergy revenue to burn so the ramen-profitable
  // buff doesn't become self-referential once it kicks in.
  const burn = weeklyBurn(s);
  const syn = computeSynergies(s, { revenue: preSynergy, burn });
  s.revenuePerWeek = Math.max(0, Math.round(preSynergy * syn.revenueMultiplier));
}

function recomputeMorale(s: GameState): void {
  if (s.employees.length === 0) {
    s.morale = 100;
    return;
  }
  const avg =
    s.employees.reduce((acc, e) => acc + e.morale, 0) / s.employees.length;
  s.morale = Math.round(Math.max(0, Math.min(100, avg)));
}

// ---- movement ----

export function move(s: GameState, dx: number, dy: number): GameState {
  if (s.gameOver || s.modal) return s;
  const map = getMap(s.round);
  const nx = s.position.x + dx;
  const ny = s.position.y + dy;
  if (!isWalkable(map, nx, ny)) return s;
  let next: GameState = { ...s, position: { x: nx, y: ny } };
  next = rescueAt(next, nx, ny);
  return collectEggAt(next, nx, ny);
}

function rescueAt(s: GameState, x: number, y: number): GameState {
  const idx = s.employees.findIndex(
    (e) => e.x === x && e.y === y && e.quittingSinceTick !== null,
  );
  if (idx < 0) return s;
  const target = s.employees[idx];
  const employees = s.employees.slice();
  employees[idx] = {
    ...target,
    morale: Math.max(target.morale, RESCUE_MORALE_RESTORE),
    quittingSinceTick: null,
  };
  const next: GameState = {
    ...s,
    employees,
    eventLog: s.eventLog.slice(),
  };
  recomputeMorale(next);
  recomputeRevenue(next);
  pushLog(next, {
    week: next.week,
    message: `Talked ${target.name} off the ledge. Morale restored.`,
    tone: "good",
  });
  return next;
}

function collectEggAt(s: GameState, x: number, y: number): GameState {
  const idx = s.easterEggs.findIndex((e) => e.x === x && e.y === y);
  if (idx < 0) return s;
  const egg = s.easterEggs[idx];
  const feature =
    WARP_FEATURES.find((f) => f.id === egg.featureId) ?? WARP_FEATURES[0];
  const next: GameState = {
    ...s,
    balance: s.balance + EASTER_EGG_CASH_GIFT,
    easterEggs: s.easterEggs.filter((_, i) => i !== idx),
    eventLog: s.eventLog.slice(),
  };
  pushLog(next, {
    week: next.week,
    message: `◆ WARP PRESENT: ${feature.name}. ${feature.blurb} +$${EASTER_EGG_CASH_GIFT.toLocaleString()}.`,
    tone: "warp",
  });
  return next;
}

// ---- interaction ----

type InteractResult =
  | { kind: "none" }
  | { kind: "modal"; modal: GameState["modal"] }
  | { kind: "coffee" };

function adjacentBuilding(s: GameState): InteractResult {
  const map = getMap(s.round);
  const { x, y } = s.position;
  const candidates = [
    [x, y],
    [x, y - 1],
    [x, y + 1],
    [x - 1, y],
    [x + 1, y],
  ];
  for (const [cx, cy] of candidates) {
    const k = kindAt(map, cx, cy);
    if (k === "hire") return { kind: "modal", modal: { kind: "hire" } };
    if (k === "vc") return { kind: "modal", modal: { kind: "fundraise" } };
    if (k === "dashboard") return { kind: "modal", modal: { kind: "dashboard" } };
    if (k === "coffee") return { kind: "coffee" };
  }
  return { kind: "none" };
}

export function interact(s: GameState): GameState {
  if (s.gameOver || s.modal) return s;
  const result = adjacentBuilding(s);
  if (result.kind === "none") return s;
  if (result.kind === "modal") {
    return { ...s, modal: result.modal, paused: true };
  }
  // coffee: bump morale across the team; does not pause.
  const next: GameState = {
    ...s,
    employees: s.employees.map((e) => ({
      ...e,
      morale: Math.min(100, e.morale + COFFEE_MORALE_BOOST),
    })),
    lastInteractionWeek: s.week,
  };
  recomputeMorale(next);
  pushLog(next, {
    week: s.week,
    message: `Coffee run. Team morale +${COFFEE_MORALE_BOOST}.`,
    tone: "good",
  });
  return next;
}

// ---- hire ----

export function hire(s: GameState, roleId: string, location: LocationId): GameState {
  return hireMany(s, roleId, location, 1);
}

export function hireMany(
  s: GameState,
  roleId: string,
  location: LocationId,
  qty: number
): GameState {
  if (s.gameOver || qty <= 0) return s;
  const role = roleById(roleId);
  if (!role || role.disabled) return s;
  const totalCost = nextHireCost(s, roleId, qty, location);
  if (s.balance < totalCost) return s;

  const map = getMap(s.round);
  let next: GameState = {
    ...s,
    balance: s.balance - totalCost,
    employees: s.employees.slice(),
    eventLog: s.eventLog.slice(),
    history: s.history.slice(),
    modal: null,
    paused: false,
  };

  for (let i = 0; i < qty; i++) {
    const rng = makeRng(next.rngSeed + next.employees.length * 7919);
    const id = `${roleId}-${next.week}-${next.employees.length}-${Math.floor(rng() * 1e9)}`;
    const spot = findOfficeSpot(map, next, rng);
    next.employees.push({
      id,
      role,
      name: makeName(rng),
      location,
      hiredWeek: next.week,
      morale: 90,
      x: spot.x,
      y: spot.y,
      quittingSinceTick: null,
    });
    next.rngSeed = (next.rngSeed + 1) >>> 0;
  }

  next.peakHeadcount = Math.max(next.peakHeadcount, next.employees.length);
  recomputeRevenue(next);
  recomputeMorale(next);
  const qtyLabel = qty > 1 ? `${qty}× ` : "";
  pushLog(next, {
    week: s.week,
    message: `Hired ${qtyLabel}${role.name} (${location}). All-in hiring cost: $${totalCost.toLocaleString()} (signing + recruiter + setup).`,
    tone: "good",
  });
  return next;
}

function findOfficeSpot(
  map: ReturnType<typeof getMap>,
  s: GameState,
  rng: () => number
): { x: number; y: number } {
  const occupied = new Set(s.employees.map((e) => cellKey(e.x, e.y)));
  const b = map.officeBounds;
  for (let tries = 0; tries < 200; tries++) {
    const x = b.x0 + Math.floor(rng() * (b.x1 - b.x0 + 1));
    const y = b.y0 + Math.floor(rng() * (b.y1 - b.y0 + 1));
    if (!isWalkable(map, x, y)) continue;
    if (occupied.has(cellKey(x, y))) continue;
    return { x, y };
  }
  return { x: b.x0, y: b.y0 };
}

// ---- easter eggs ----

function tickEasterEggs(s: GameState, rng: () => number): GameState {
  // Despawn stale eggs.
  const eggs = s.easterEggs.filter(
    (e) => s.week - e.spawnedWeek <= EASTER_EGG_LIFETIME_WEEKS
  );
  let changed = eggs.length !== s.easterEggs.length;

  // Maybe spawn a new one.
  if (eggs.length < EASTER_EGG_MAX_ON_BOARD && rng() < EASTER_EGG_SPAWN_CHANCE) {
    const map = getMap(s.round);
    const occupied = new Set<string>([
      cellKey(s.position.x, s.position.y),
      ...s.employees.map((e) => cellKey(e.x, e.y)),
      ...eggs.map((e) => cellKey(e.x, e.y)),
    ]);
    const b = map.officeBounds;
    for (let tries = 0; tries < 80; tries++) {
      const x = b.x0 + Math.floor(rng() * (b.x1 - b.x0 + 1));
      const y = b.y0 + Math.floor(rng() * (b.y1 - b.y0 + 1));
      if (!isWalkable(map, x, y)) continue;
      if (occupied.has(cellKey(x, y))) continue;
      const feature = pickWarpFeature(rng);
      const egg: EasterEgg = {
        id: `egg-${s.week}-${x}-${y}`,
        x,
        y,
        spawnedWeek: s.week,
        featureId: feature.id,
      };
      eggs.push(egg);
      changed = true;
      break;
    }
  }
  return changed ? { ...s, easterEggs: eggs } : s;
}

// ---- fundraise ----

export function canFundraise(s: GameState, idx: number): { ok: boolean; reason?: string } {
  const def = FUNDRAISE_ROUNDS[idx];
  if (!def) return { ok: false, reason: "No round" };
  const roundOrder: RoundId[] = ["pre-seed", "seed", "series-a", "series-b"];
  if (roundOrder.indexOf(s.round) > roundOrder.indexOf(def.roundAfter)) {
    return { ok: false, reason: "Already raised" };
  }
  if (roundOrder.indexOf(s.round) >= roundOrder.indexOf(def.roundAfter)) {
    return { ok: false, reason: "Already closed this round" };
  }
  if (s.employees.length < def.minEmployees) {
    return { ok: false, reason: `Need ${def.minEmployees} employees` };
  }
  if (s.revenuePerWeek < def.minRevenue) {
    return { ok: false, reason: `Need $${def.minRevenue.toLocaleString()}/wk revenue` };
  }
  return { ok: true };
}

export function fundraise(s: GameState, idx: number): GameState {
  const def = FUNDRAISE_ROUNDS[idx];
  if (!def) return s;
  const gate = canFundraise(s, idx);
  if (!gate.ok) return s;
  const nextRound: RoundId = def.roundAfter;
  const newMap = getMap(nextRound);

  // Rehome anyone landing on a now-invalid tile (room walls shift between maps).
  const rng = makeRng(s.rngSeed + s.week * 2111);
  const relocatedEmployees = s.employees.map((e) => {
    if (isWalkable(newMap, e.x, e.y) && inOffice(newMap, e.x, e.y)) return e;
    const spot = findOfficeSpot(newMap, { ...s, employees: [] }, rng);
    return { ...e, x: spot.x, y: spot.y };
  });
  const playerPos = isWalkable(newMap, s.position.x, s.position.y)
    ? s.position
    : { ...newMap.spawn };

  const next: GameState = {
    ...s,
    balance: s.balance + def.check,
    capTable: {
      founders: s.capTable.founders * (1 - def.dilution),
      investors: [
        ...s.capTable.investors,
        { round: def.label, pct: def.dilution },
      ],
    },
    round: nextRound,
    employees: relocatedEmployees,
    position: playerPos,
    modal: null,
    paused: false,
    easterEggs: [],
  };
  pushLog(next, {
    week: s.week,
    message: `Closed ${def.label}: $${(def.check / 1_000_000).toFixed(0)}M at ${Math.round(def.dilution * 100)}% dilution. Office expanded.`,
    tone: "good",
  });
  return next;
}

// ---- tick ----

export function tick(s: GameState): GameState {
  if (s.gameOver || s.paused || s.modal) return s;

  const weeklyBurnAmt = weeklyBurn(s);
  let next: GameState = {
    ...s,
    week: s.week + 1,
    tickCount: s.tickCount + 1,
    balance: s.balance - weeklyBurnAmt + s.revenuePerWeek,
    employees: s.employees.slice(),
    eventLog: s.eventLog.slice(),
    history: s.history.slice(),
    capTable: { ...s.capTable, investors: s.capTable.investors.slice() },
    easterEggs: s.easterEggs.slice(),
  };

  // Morale drift toward baseline 70; gentle decay if no coffee in 5 weeks.
  // Already-quitting employees do NOT drift back up — only rescue clears the flag.
  const sinceCoffee = next.week - next.lastInteractionWeek;
  next.employees = next.employees.map((e) => {
    let m = e.morale;
    if (e.quittingSinceTick === null) {
      const toward = MORALE_BASELINE;
      m += (toward - m) * 0.08;
      if (sinceCoffee > 5) m -= 1.5;
    } else {
      // Yellow employees slide further toward the exit each tick.
      m -= 2;
    }
    const clamped = Math.max(0, Math.min(100, m));
    let quittingSinceTick = e.quittingSinceTick;
    if (quittingSinceTick === null && clamped < QUIT_MORALE_THRESHOLD) {
      quittingSinceTick = next.tickCount;
    }
    return { ...e, morale: clamped, quittingSinceTick };
  });

  // Process quitters: anyone who has been yellow past the deadline walks.
  const quitters: Employee[] = [];
  next.employees = next.employees.filter((e) => {
    if (
      e.quittingSinceTick !== null &&
      next.tickCount - e.quittingSinceTick >= QUIT_DEADLINE_TICKS
    ) {
      quitters.push(e);
      return false;
    }
    return true;
  });
  if (quitters.length > 0) {
    // Attrition contagion: every remaining teammate takes a morale hit.
    const penalty = QUITTER_MORALE_PENALTY * quitters.length;
    next.employees = next.employees.map((e) => ({
      ...e,
      morale: Math.max(0, e.morale - penalty),
    }));
    for (const q of quitters) {
      pushLog(next, {
        week: next.week,
        message: `${q.name} (${q.role.name}) quit. Team morale −${penalty}.`,
        tone: "bad",
      });
    }
  }

  // Fresh yellow-flag notifications — log once when they start threatening.
  next.employees.forEach((e) => {
    if (e.quittingSinceTick === next.tickCount) {
      pushLog(next, {
        week: next.week,
        message: `${e.name} (${e.role.name}) is about to quit. Step on them to save them.`,
        tone: "bad",
      });
    }
  });

  recomputeMorale(next);
  recomputeRevenue(next);

  // Employee shuffle.
  if (next.tickCount % SHUFFLE_EVERY_TICKS === 0) {
    const rng = makeRng(next.rngSeed + next.tickCount);
    next.employees = shuffleEmployees(getMap(next.round), next.employees, rng);
    next.rngSeed = (next.rngSeed + 17) >>> 0;
  }

  // Event roll.
  const rng = makeRng(next.rngSeed + next.week * 131);
  if (rng() < EVENT_PROBABILITY) {
    const ev = rollEvent(next, rng);
    if (ev) {
      next = applyEvent(next, ev);
    }
  }

  // Easter egg spawn + despawn (Warp presents).
  next = tickEasterEggs(next, rng);

  next.peakHeadcount = Math.max(next.peakHeadcount, next.employees.length);

  next.history.push({
    week: next.week,
    balance: next.balance,
    revenue: next.revenuePerWeek,
    headcount: next.employees.length,
  });
  if (next.history.length > 400) next.history.shift();

  // End states.
  if (next.balance < 0) {
    next.gameOver = "burned";
    pushLog(next, {
      week: next.week,
      message: "Ran out of money. Game over.",
      tone: "bad",
    });
  } else if (valuation(next) >= UNICORN_VALUATION) {
    const dist = teamDistribution(next);
    if (dist.coveredCategories === ROLE_CATEGORIES.length) {
      next.gameOver = "unicorn";
      pushLog(next, {
        week: next.week,
        message: "Unicorn! You hit a $1B valuation with a well-distributed team.",
        tone: "good",
      });
    } else if (next.week % 10 === 0) {
      const missing = ROLE_CATEGORIES.filter((c) => dist.counts[c] === 0).join(", ");
      pushLog(next, {
        week: next.week,
        message: `$1B valuation, but not a real team yet. Missing: ${missing}.`,
        tone: "neutral",
      });
    }
  }

  return next;
}

export function shuffleEmployees(
  map: ReturnType<typeof getMap>,
  employees: Employee[],
  rng: () => number
): Employee[] {
  const occupied = new Set(employees.map((e) => cellKey(e.x, e.y)));
  return employees.map((e) => {
    const moves: [number, number][] = [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    // Shuffle moves.
    for (let i = moves.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    for (const [dx, dy] of moves) {
      const nx = e.x + dx;
      const ny = e.y + dy;
      if (!inOffice(map, nx, ny)) continue;
      if (!isWalkable(map, nx, ny)) continue;
      const key = cellKey(nx, ny);
      if (key !== cellKey(e.x, e.y) && occupied.has(key)) continue;
      occupied.delete(cellKey(e.x, e.y));
      occupied.add(key);
      return { ...e, x: nx, y: ny };
    }
    return e;
  });
}

// ---- events ----

function applyEvent(s: GameState, ev: GameEventDef): GameState {
  if (ev.choice) {
    return {
      ...s,
      modal: {
        kind: "choice",
        payload: {
          eventId: ev.id,
          title: ev.choice.title,
          body: ev.message,
          options: ev.choice.options,
        },
      },
      paused: true,
    };
  }
  const next = { ...s, employees: s.employees.slice() };
  ev.effect?.(next);
  recomputeRevenue(next);
  recomputeMorale(next);
  pushLog(next, {
    week: next.week,
    message: ev.message,
    tone: ev.tone ?? "neutral",
  });
  return next;
}

export function resolveChoice(s: GameState, choiceKey: string): GameState {
  const modal = s.modal;
  if (!modal || modal.kind !== "choice" || !modal.payload?.eventId) return s;
  const ev = EVENTS.find((e) => e.id === modal.payload!.eventId);
  if (!ev || !ev.choice) return s;
  const resolver = ev.choice.resolve[choiceKey];
  const next = { ...s, employees: s.employees.slice(), modal: null, paused: false };
  if (resolver) resolver(next);
  recomputeRevenue(next);
  recomputeMorale(next);
  pushLog(next, {
    week: next.week,
    message: `${ev.message} You chose: ${ev.choice.options.find((o) => o.key === choiceKey)?.label ?? "unknown"}.`,
    tone: "neutral",
  });
  return next;
}

// ---- modal + pause ----

export function closeModal(s: GameState): GameState {
  if (!s.modal) return s;
  if (s.modal.kind === "choice") return s; // choice must be resolved
  return { ...s, modal: null, paused: false };
}

export function openAiCritic(s: GameState, critique: string): GameState {
  if (s.gameOver || s.modal) return s;
  return {
    ...s,
    modal: { kind: "ai_critic", payload: { critique } },
    paused: true,
  };
}

export function applyCriticVerdict(
  s: GameState,
  verdict: "good" | "bad",
  amount: number,
): GameState {
  const delta = verdict === "good" ? amount : -amount;
  const next: GameState = { ...s, balance: s.balance + delta };
  pushLog(next, {
    week: next.week,
    message:
      verdict === "good"
        ? `The Observer approved. Investor wires +$${Math.round(amount / 1000)}k.`
        : `The Observer was unimpressed. Burned $${Math.round(amount / 1000)}k cleaning up.`,
    tone: verdict === "good" ? "good" : "bad",
  });
  if (next.balance <= 0 && !next.gameOver) {
    next.balance = 0;
    next.gameOver = "burned";
    next.paused = true;
  }
  return next;
}

export function togglePause(s: GameState): GameState {
  if (s.modal) return s;
  return { ...s, paused: !s.paused };
}

export function setSpeed(s: GameState, speed: 1 | 2): GameState {
  return { ...s, speed };
}

// Convenience for tests / HUD.
export function snapshot(s: GameState) {
  return {
    week: s.week,
    balance: s.balance,
    burn: weeklyBurn(s),
    revenue: s.revenuePerWeek,
    runway: runwayWeeks(s),
    morale: s.morale,
    valuation: valuation(s),
    foundersPct: s.capTable.founders,
  };
}

export function _testing() {
  return { recomputeRevenue, recomputeMorale };
}
