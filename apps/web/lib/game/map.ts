import type { RoundId } from "./state";

export type CellKind =
  | "wall"
  | "floor"
  | "hire"
  | "vc"
  | "dashboard"
  | "coffee"
  | "sign";

export type DoorKind = "hire" | "vc" | "dashboard" | "coffee";

export type RoomKind = DoorKind | "lounge" | "lab" | "allhands";

export interface RoomRect {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: RoomKind;
  label: string;
}

export interface BaseCell {
  x: number;
  y: number;
  char: string;
  kind: CellKind;
}

export interface MapDef {
  round: RoundId;
  width: number;
  height: number;
  rows: string[];
  cells: BaseCell[];
  cellByKey: Map<string, BaseCell>;
  doors: Record<DoorKind, { x: number; y: number }>;
  officeBounds: { x0: number; y0: number; x1: number; y1: number };
  spawn: { x: number; y: number };
}

// ---- builder ----

const WALL_CHARS = new Set([
  "╔",
  "╗",
  "╚",
  "╝",
  "║",
  "═",
  "┌",
  "┐",
  "└",
  "┘",
  "│",
  "─",
]);

interface RoomSpec {
  // top-left corner of the room's outer rectangle
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;          // shown on the top border, e.g. "HIRE"
  fillRows: string[];     // interior rows (without the side walls). Length = h-2
  doorKind: DoorKind;
  doorChar: string;       // e.g. "H"
  doorSide: "top" | "bottom";
  doorOffset: number;     // x offset within the room for the door char
}

interface DecorSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  kind?: "lounge" | "lab" | "allhands";
}

interface MapSpec {
  width: number;
  height: number;
  officeBounds: { x0: number; y0: number; x1: number; y1: number };
  spawn: { x: number; y: number };
  rooms: RoomSpec[];
  // floating decorative letters (e.g. COFFEE marker "C" placed on open floor)
  markers?: Array<{ x: number; y: number; char: string; doorKind?: DoorKind }>;
  // decorative rectangles that are drawn as walls only (no door)
  decor?: DecorSpec[];
}

function blankRow(width: number): string[] {
  return new Array(width).fill(" ");
}

function write(row: string[], x: number, text: string) {
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    row[x + i] = chars[i];
  }
}

function buildMap(round: RoundId, spec: MapSpec): MapDef {
  const { width, height } = spec;
  const grid: string[][] = [];

  // Outer border.
  for (let y = 0; y < height; y++) {
    const row = blankRow(width);
    if (y === 0) {
      row[0] = "╔";
      row[width - 1] = "╗";
      for (let x = 1; x < width - 1; x++) row[x] = "═";
    } else if (y === height - 1) {
      row[0] = "╚";
      row[width - 1] = "╝";
      for (let x = 1; x < width - 1; x++) row[x] = "═";
    } else {
      row[0] = "║";
      row[width - 1] = "║";
    }
    grid.push(row);
  }

  // Paint rooms.
  const doors: Partial<Record<DoorKind, { x: number; y: number }>> = {};
  for (const room of spec.rooms) {
    // Top border with centered label. e.g. "┌─HIRE──┐" across w cols.
    const innerW = room.w - 2;
    const label = room.label;
    const pad = Math.max(0, innerW - label.length);
    const left = Math.floor(pad / 2);
    const right = pad - left;
    const topInner = "─".repeat(left) + label + "─".repeat(right);
    const topLine = "┌" + topInner + "┐";
    write(grid[room.y], room.x, topLine);

    // Side walls + interior fill.
    for (let i = 0; i < room.h - 2; i++) {
      const rowY = room.y + 1 + i;
      grid[rowY][room.x] = "│";
      grid[rowY][room.x + room.w - 1] = "│";
      const fill = room.fillRows[i] ?? "";
      // Write fill into the interior. Pad to innerW.
      const interior = (fill + " ".repeat(Math.max(0, innerW - fill.length))).slice(
        0,
        innerW
      );
      write(grid[rowY], room.x + 1, interior);
    }

    // Bottom border (plain).
    const bottomInner = "─".repeat(innerW);
    const bottomLine = "└" + bottomInner + "┘";
    write(grid[room.y + room.h - 1], room.x, bottomLine);

    // Stamp the door char on the chosen side.
    const doorY = room.doorSide === "top" ? room.y : room.y + room.h - 1;
    const doorX = room.x + room.doorOffset;
    grid[doorY][doorX] = room.doorChar;
    doors[room.doorKind] = { x: doorX, y: doorY };
  }

  // Decorative rectangles (walls only, no door).
  for (const d of spec.decor ?? []) {
    const innerW = d.w - 2;
    const label = d.label ?? "";
    const pad = Math.max(0, innerW - label.length);
    const left = Math.floor(pad / 2);
    const right = pad - left;
    const topInner = "─".repeat(left) + label + "─".repeat(right);
    write(grid[d.y], d.x, "┌" + topInner + "┐");
    for (let i = 0; i < d.h - 2; i++) {
      const rowY = d.y + 1 + i;
      grid[rowY][d.x] = "│";
      grid[rowY][d.x + d.w - 1] = "│";
    }
    write(grid[d.y + d.h - 1], d.x, "└" + "─".repeat(innerW) + "┘");
  }

  // Paint dots on every walkable tile inside the outer walls — everywhere
  // except room interiors — so players can see the full walkable area.
  const allRoomRects = [...spec.rooms, ...(spec.decor ?? [])];
  const insideAnyRoom = (x: number, y: number) => {
    for (const r of allRoomRects) {
      if (x > r.x && x < r.x + r.w - 1 && y > r.y && y < r.y + r.h - 1) {
        return true;
      }
    }
    return false;
  };
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === " " && !insideAnyRoom(x, y)) grid[y][x] = ".";
    }
  }

  // Floating markers (e.g. coffee cue on open floor).
  for (const m of spec.markers ?? []) {
    grid[m.y][m.x] = m.char;
    if (m.doorKind) doors[m.doorKind] = { x: m.x, y: m.y };
  }

  // Validate all doors set.
  const kinds: DoorKind[] = ["hire", "vc", "dashboard", "coffee"];
  for (const k of kinds) {
    if (!doors[k]) throw new Error(`map ${round}: door "${k}" was never placed`);
  }

  const rows = grid.map((r) => r.join(""));

  // Sanity checks.
  if (rows.length !== height) {
    throw new Error(`map ${round}: height ${rows.length}, expected ${height}`);
  }
  for (let i = 0; i < rows.length; i++) {
    const len = [...rows[i]].length;
    if (len !== width) {
      throw new Error(
        `map ${round}: row ${i} width ${len}, expected ${width}`
      );
    }
  }

  // Build cells + index.
  const cells: BaseCell[] = [];
  const cellByKey = new Map<string, BaseCell>();
  const resolvedDoors = doors as Record<DoorKind, { x: number; y: number }>;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = grid[y][x];
      let kind: CellKind;
      if (resolvedDoors.hire.x === x && resolvedDoors.hire.y === y) kind = "hire";
      else if (resolvedDoors.vc.x === x && resolvedDoors.vc.y === y) kind = "vc";
      else if (
        resolvedDoors.dashboard.x === x &&
        resolvedDoors.dashboard.y === y
      )
        kind = "dashboard";
      else if (resolvedDoors.coffee.x === x && resolvedDoors.coffee.y === y)
        kind = "coffee";
      else if (WALL_CHARS.has(ch)) kind = "wall";
      else if (ch === "." || ch === " ") kind = "floor";
      else kind = "sign";
      const cell: BaseCell = { x, y, char: ch, kind };
      cells.push(cell);
      cellByKey.set(`${x},${y}`, cell);
    }
  }

  return {
    round,
    width,
    height,
    rows,
    cells,
    cellByKey,
    doors: resolvedDoors,
    officeBounds: spec.officeBounds,
    spawn: spec.spawn,
  };
}

// ---- per-round specs ----
//
// Each round expands the office and adds new decorative rooms. The four
// interactive rooms (HIRE, VC, DASHBOARD, COFFEE) are present at every stage
// because the core game loop needs them.

const PRE_SEED: MapSpec = {
  width: 36,
  height: 16,
  officeBounds: { x0: 3, y0: 6, x1: 32, y1: 10 },
  spawn: { x: 6, y: 8 },
  rooms: [
    {
      x: 2,
      y: 1,
      w: 9,
      h: 4,
      label: "HIRE",
      fillRows: [],
      doorKind: "hire",
      doorChar: "H",
      doorSide: "bottom",
      doorOffset: 4,
    },
    {
      x: 13,
      y: 1,
      w: 8,
      h: 4,
      label: "VC",
      fillRows: [],
      doorKind: "vc",
      doorChar: "V",
      doorSide: "bottom",
      doorOffset: 3,
    },
    {
      x: 23,
      y: 1,
      w: 11,
      h: 4,
      label: "DASHBOARD",
      fillRows: [],
      doorKind: "dashboard",
      doorChar: "B",
      doorSide: "bottom",
      doorOffset: 5,
    },
    {
      x: 2,
      y: 11,
      w: 10,
      h: 4,
      label: "COFFEE",
      fillRows: [],
      doorKind: "coffee",
      doorChar: "C",
      doorSide: "top",
      doorOffset: 5,
    },
  ],
};

const SEED: MapSpec = {
  width: 46,
  height: 18,
  officeBounds: { x0: 3, y0: 6, x1: 42, y1: 12 },
  spawn: { x: 6, y: 9 },
  rooms: [
    {
      x: 2,
      y: 1,
      w: 10,
      h: 4,
      label: "HIRE",
      fillRows: [],
      doorKind: "hire",
      doorChar: "H",
      doorSide: "bottom",
      doorOffset: 4,
    },
    {
      x: 14,
      y: 1,
      w: 10,
      h: 4,
      label: "VC",
      fillRows: [],
      doorKind: "vc",
      doorChar: "V",
      doorSide: "bottom",
      doorOffset: 4,
    },
    {
      x: 26,
      y: 1,
      w: 14,
      h: 4,
      label: "DASHBOARD",
      fillRows: [],
      doorKind: "dashboard",
      doorChar: "B",
      doorSide: "bottom",
      doorOffset: 6,
    },
    {
      x: 2,
      y: 13,
      w: 10,
      h: 4,
      label: "COFFEE",
      fillRows: [],
      doorKind: "coffee",
      doorChar: "C",
      doorSide: "top",
      doorOffset: 5,
    },
  ],
  decor: [{ x: 36, y: 13, w: 8, h: 4, label: "LOUNGE", kind: "lounge" }],
};

const SERIES_A: MapSpec = {
  width: 54,
  height: 20,
  officeBounds: { x0: 3, y0: 6, x1: 50, y1: 14 },
  spawn: { x: 7, y: 10 },
  rooms: [
    {
      x: 2,
      y: 1,
      w: 11,
      h: 4,
      label: "HIRE",
      fillRows: [],
      doorKind: "hire",
      doorChar: "H",
      doorSide: "bottom",
      doorOffset: 5,
    },
    {
      x: 15,
      y: 1,
      w: 10,
      h: 4,
      label: "VC",
      fillRows: [],
      doorKind: "vc",
      doorChar: "V",
      doorSide: "bottom",
      doorOffset: 4,
    },
    {
      x: 27,
      y: 1,
      w: 15,
      h: 4,
      label: "DASHBOARD",
      fillRows: [],
      doorKind: "dashboard",
      doorChar: "B",
      doorSide: "bottom",
      doorOffset: 7,
    },
    {
      x: 2,
      y: 15,
      w: 10,
      h: 4,
      label: "COFFEE",
      fillRows: [],
      doorKind: "coffee",
      doorChar: "C",
      doorSide: "top",
      doorOffset: 5,
    },
  ],
  decor: [
    { x: 44, y: 1, w: 8, h: 4, label: "LAB", kind: "lab" },
    { x: 40, y: 15, w: 10, h: 4, label: "LOUNGE", kind: "lounge" },
  ],
};

const SERIES_B: MapSpec = {
  width: 60,
  height: 22,
  officeBounds: { x0: 4, y0: 6, x1: 55, y1: 15 },
  spawn: { x: 8, y: 10 },
  rooms: [
    {
      x: 2,
      y: 1,
      w: 11,
      h: 4,
      label: "HIRE",
      fillRows: [],
      doorKind: "hire",
      doorChar: "H",
      doorSide: "bottom",
      doorOffset: 5,
    },
    {
      x: 16,
      y: 1,
      w: 10,
      h: 4,
      label: "VC",
      fillRows: [],
      doorKind: "vc",
      doorChar: "V",
      doorSide: "bottom",
      doorOffset: 4,
    },
    {
      x: 29,
      y: 1,
      w: 15,
      h: 4,
      label: "DASHBOARD",
      fillRows: [],
      doorKind: "dashboard",
      doorChar: "B",
      doorSide: "bottom",
      doorOffset: 7,
    },
    {
      x: 2,
      y: 17,
      w: 10,
      h: 4,
      label: "COFFEE",
      fillRows: [],
      doorKind: "coffee",
      doorChar: "C",
      doorSide: "top",
      doorOffset: 5,
    },
  ],
  decor: [
    { x: 47, y: 1, w: 11, h: 4, label: "LAB", kind: "lab" },
    { x: 14, y: 17, w: 12, h: 4, label: "LOUNGE", kind: "lounge" },
    { x: 40, y: 17, w: 15, h: 4, label: "ALL-HANDS", kind: "allhands" },
  ],
};

const SPECS: Record<string, MapSpec> = {
  "pre-seed": PRE_SEED,
  seed: SEED,
  "series-a": SERIES_A,
  "series-b": SERIES_B,
};

export const MAPS: Record<string, MapDef> = {
  "pre-seed": buildMap("pre-seed", PRE_SEED),
  seed: buildMap("seed", SEED),
  "series-a": buildMap("series-a", SERIES_A),
  "series-b": buildMap("series-b", SERIES_B),
};

export function getRoomRects(round: RoundId): RoomRect[] {
  const spec = SPECS[round] ?? SPECS["series-b"];
  const rects: RoomRect[] = [];
  for (const r of spec.rooms) {
    rects.push({ x: r.x, y: r.y, w: r.w, h: r.h, kind: r.doorKind, label: r.label });
  }
  for (const d of spec.decor ?? []) {
    if (!d.kind) continue;
    rects.push({ x: d.x, y: d.y, w: d.w, h: d.h, kind: d.kind, label: d.label ?? "" });
  }
  return rects;
}

// Largest map dimensions (used for CSS container sizing so the layout doesn't
// reflow as the company scales up).
export const MAX_MAP_W = Math.max(...Object.values(MAPS).map((m) => m.width));
export const MAX_MAP_H = Math.max(...Object.values(MAPS).map((m) => m.height));

export function getMap(round: RoundId): MapDef {
  return MAPS[round] ?? MAPS["series-b"];
}

export function charAt(map: MapDef, x: number, y: number): string {
  if (y < 0 || y >= map.height || x < 0 || x >= map.width) return " ";
  const cell = map.cellByKey.get(`${x},${y}`);
  return cell?.char ?? " ";
}

export function kindAt(map: MapDef, x: number, y: number): CellKind {
  if (y < 0 || y >= map.height || x < 0 || x >= map.width) return "wall";
  return map.cellByKey.get(`${x},${y}`)?.kind ?? "wall";
}

export function isWalkable(map: MapDef, x: number, y: number): boolean {
  const k = kindAt(map, x, y);
  return (
    k === "floor" || k === "hire" || k === "vc" || k === "dashboard" || k === "coffee"
  );
}

export function isBuildingDoor(
  k: CellKind
): k is "hire" | "vc" | "dashboard" | "coffee" {
  return k === "hire" || k === "vc" || k === "dashboard" || k === "coffee";
}

export function inOffice(map: MapDef, x: number, y: number): boolean {
  const b = map.officeBounds;
  return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
}

// Number of walkable tiles inside the office bounds. This is the hard cap on
// how many employees the current map can house — a new hire needs a free
// tile to land on.
export function officeCapacity(map: MapDef): number {
  const b = map.officeBounds;
  let count = 0;
  for (let y = b.y0; y <= b.y1; y++) {
    for (let x = b.x0; x <= b.x1; x++) {
      if (isWalkable(map, x, y)) count++;
    }
  }
  return count;
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}
