import {
  COFFEE_MORALE_BOOST,
  EVENT_PROBABILITY,
  FUNDRAISE_ROUNDS,
  IPO_VALUATION,
  LOCATION_MULTIPLIERS,
  MAX_LOG_ENTRIES,
  MORALE_BASELINE,
  SHUFFLE_EVERY_TICKS,
  STARTING_BALANCE,
} from "./constants";
import type { LocationId } from "./constants";
import { BASE_CELLS, cellKey, inOffice, isWalkable, kindAt, OFFICE_BOUNDS, SPAWN } from "./map";
import { makeName } from "./names";
import { roleById, ROLES } from "./roles";
import type { ChoiceOption, Employee, GameState, LogEntry, Role, RoundId } from "./state";
import { runwayWeeks, valuation, weeklyBurn } from "./valuation";
import { EVENTS, rollEvent, type GameEventDef } from "./events";

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
    position: { ...SPAWN },
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
    const eff = e.role.weeklyEffect;
    if (eff.revenue_delta) base += eff.revenue_delta;
    if (eff.revenue_multiplier_bonus) mult += eff.revenue_multiplier_bonus;
  }
  // Morale modifier: 50% morale = 0.8x, 100% = 1.1x.
  const moraleMod = 0.8 + (s.morale / 100) * 0.3;
  s.revenuePerWeek = Math.max(0, Math.round(base * mult * moraleMod));
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
  const nx = s.position.x + dx;
  const ny = s.position.y + dy;
  if (!isWalkable(nx, ny)) return s;
  return { ...s, position: { x: nx, y: ny } };
}

// ---- interaction ----

type InteractResult =
  | { kind: "none" }
  | { kind: "modal"; modal: GameState["modal"] }
  | { kind: "coffee" };

function adjacentBuilding(s: GameState): InteractResult {
  const { x, y } = s.position;
  const candidates = [
    [x, y],
    [x, y - 1],
    [x, y + 1],
    [x - 1, y],
    [x + 1, y],
  ];
  for (const [cx, cy] of candidates) {
    const k = kindAt(cx, cy);
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
  if (s.gameOver) return s;
  const role = roleById(roleId);
  if (!role || role.disabled) return s;
  const rng = makeRng(s.rngSeed + s.employees.length * 7919);
  const id = `${roleId}-${s.week}-${s.employees.length}-${Math.floor(rng() * 1e9)}`;
  const spot = findOfficeSpot(s, rng);
  const next: GameState = {
    ...s,
    balance: s.balance - role.signingBonus,
    employees: [
      ...s.employees,
      {
        id,
        role,
        name: makeName(rng),
        location,
        hiredWeek: s.week,
        morale: 90,
        x: spot.x,
        y: spot.y,
      },
    ],
    rngSeed: (s.rngSeed + 1) >>> 0,
    modal: null,
    paused: false,
  };
  next.peakHeadcount = Math.max(next.peakHeadcount, next.employees.length);
  recomputeRevenue(next);
  recomputeMorale(next);
  pushLog(next, {
    week: s.week,
    message: `Hired ${role.name} (${location}). Signing bonus: $${role.signingBonus.toLocaleString()}.`,
    tone: "good",
  });
  return next;
}

function findOfficeSpot(s: GameState, rng: () => number): { x: number; y: number } {
  const occupied = new Set(s.employees.map((e) => cellKey(e.x, e.y)));
  for (let tries = 0; tries < 200; tries++) {
    const x =
      OFFICE_BOUNDS.x0 +
      Math.floor(rng() * (OFFICE_BOUNDS.x1 - OFFICE_BOUNDS.x0 + 1));
    const y =
      OFFICE_BOUNDS.y0 +
      Math.floor(rng() * (OFFICE_BOUNDS.y1 - OFFICE_BOUNDS.y0 + 1));
    if (!isWalkable(x, y)) continue;
    if (occupied.has(cellKey(x, y))) continue;
    return { x, y };
  }
  return { x: OFFICE_BOUNDS.x0, y: OFFICE_BOUNDS.y0 };
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
    round: def.roundAfter,
    modal: null,
    paused: false,
  };
  pushLog(next, {
    week: s.week,
    message: `Closed ${def.label}: $${(def.check / 1_000_000).toFixed(0)}M at ${Math.round(def.dilution * 100)}% dilution.`,
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
  };

  // Morale drift toward baseline 70; gentle decay if no coffee in 5 weeks.
  const sinceCoffee = next.week - next.lastInteractionWeek;
  next.employees = next.employees.map((e) => {
    let m = e.morale;
    const toward = MORALE_BASELINE;
    m += (toward - m) * 0.08;
    if (sinceCoffee > 5) m -= 1.5;
    return { ...e, morale: Math.max(0, Math.min(100, m)) };
  });
  recomputeMorale(next);
  recomputeRevenue(next);

  // Employee shuffle.
  if (next.tickCount % SHUFFLE_EVERY_TICKS === 0) {
    const rng = makeRng(next.rngSeed + next.tickCount);
    next.employees = shuffleEmployees(next.employees, rng);
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
  } else if (valuation(next) >= IPO_VALUATION) {
    next.gameOver = "ipo";
    pushLog(next, {
      week: next.week,
      message: "IPO! You hit a $50M valuation. Ring the bell.",
      tone: "good",
    });
  }

  return next;
}

export function shuffleEmployees(
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
      if (!inOffice(nx, ny)) continue;
      if (!isWalkable(nx, ny)) continue;
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

export function togglePause(s: GameState): GameState {
  if (s.modal) return s;
  return { ...s, paused: !s.paused };
}

export function setSpeed(s: GameState, speed: 1 | 2 | 4): GameState {
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
