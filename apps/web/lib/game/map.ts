import { MAP_H, MAP_W } from "./constants";

export type CellKind =
  | "wall"
  | "floor"
  | "hire"
  | "vc"
  | "dashboard"
  | "coffee"
  | "sign";

// Build the 60x20 map row-by-row by writing tokens into a character buffer.
// Widths are enforced by construction so we cannot ship a short row.

function blankRow(): string[] {
  return new Array(MAP_W).fill(" ");
}

function write(row: string[], x: number, text: string) {
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    row[x + i] = chars[i];
  }
}

function borderRow(fill: string, corners: [string, string]): string[] {
  const row = blankRow();
  row[0] = corners[0];
  row[MAP_W - 1] = corners[1];
  for (let i = 1; i < MAP_W - 1; i++) row[i] = fill;
  return row;
}

function interiorRow(): string[] {
  const row = blankRow();
  row[0] = "║";
  row[MAP_W - 1] = "║";
  return row;
}

// Door positions chosen so `kindAt` can resolve each uniquely and the player
// can approach from the floor row below.
export const DOORS = {
  hire: { x: 6, y: 4 },
  vc: { x: 19, y: 4 },
  dashboard: { x: 39, y: 4 },
  coffee: { x: 11, y: 18 },
};

const top = borderRow("═", ["╔", "╗"]);
const bottom = borderRow("═", ["╚", "╝"]);

const row1 = interiorRow();
write(row1, 2, "┌─HIRE──┐");
write(row1, 16, "┌──VC──┐");
write(row1, 33, "┌─DASHBOARD─┐");
write(row1, 50, "╔═════╗");

const row2 = interiorRow();
write(row2, 2, "│ $$$$$ │");
write(row2, 16, "│ VCVC │");
write(row2, 33, "│ ~~~~~~~~~ │");
write(row2, 50, "║ BAR ║");

const row3 = interiorRow();
write(row3, 2, "│ HHHHH │");
write(row3, 16, "│ VVVV │");
write(row3, 33, "│ BBBBBBBBB │");
write(row3, 50, "╚═════╝");

const row4 = interiorRow();
write(row4, 2, "└───H───┘");
write(row4, 16, "└──V───┘");
write(row4, 33, "└─────B─────┘");
// put the actual door chars at the defined DOORS coordinates
row4[DOORS.hire.x] = "H";
row4[DOORS.vc.x] = "V";
row4[DOORS.dashboard.x] = "B";

const row5 = interiorRow();

const OFFICE_X0 = 4;
const OFFICE_X1 = 51;
const OFFICE_Y0 = 6;
const OFFICE_Y1 = 15;

const officeRows: string[][] = [];
for (let y = OFFICE_Y0; y <= OFFICE_Y1; y++) {
  const row = interiorRow();
  for (let x = OFFICE_X0; x <= OFFICE_X1; x++) {
    row[x] = ".";
  }
  officeRows.push(row);
}

const row16 = interiorRow();

const row17 = interiorRow();
write(row17, 2, "┌──────┐");

const row18 = interiorRow();
write(row18, 2, "│ COFF │");
row18[DOORS.coffee.x] = "C";

export const MAP: string[] = [
  top.join(""),
  row1.join(""),
  row2.join(""),
  row3.join(""),
  row4.join(""),
  row5.join(""),
  ...officeRows.map((r) => r.join("")),
  row16.join(""),
  row17.join(""),
  row18.join(""),
  bottom.join(""),
];

if (MAP.length !== MAP_H) {
  throw new Error(`MAP height expected ${MAP_H}, got ${MAP.length}`);
}
for (let i = 0; i < MAP.length; i++) {
  const len = [...MAP[i]].length;
  if (len !== MAP_W) {
    throw new Error(`MAP row ${i} expected width ${MAP_W}, got ${len}`);
  }
}

const WALL_CHARS = new Set([
  "╔",
  "╗",
  "╚",
  "╝",
  "║",
  "═",
  "╧",
  "┌",
  "┐",
  "└",
  "┘",
  "│",
  "─",
]);

export function charAt(x: number, y: number): string {
  const row = MAP[y];
  if (!row) return " ";
  return [...row][x] ?? " ";
}

export function kindAt(x: number, y: number): CellKind {
  if (DOORS.hire.x === x && DOORS.hire.y === y) return "hire";
  if (DOORS.vc.x === x && DOORS.vc.y === y) return "vc";
  if (DOORS.dashboard.x === x && DOORS.dashboard.y === y) return "dashboard";
  if (DOORS.coffee.x === x && DOORS.coffee.y === y) return "coffee";
  const ch = charAt(x, y);
  if (WALL_CHARS.has(ch)) return "wall";
  if (ch === "." || ch === " ") return "floor";
  // Decorative letters inside rooms.
  return "sign";
}

export function isWalkable(x: number, y: number): boolean {
  const k = kindAt(x, y);
  return (
    k === "floor" || k === "hire" || k === "vc" || k === "dashboard" || k === "coffee"
  );
}

export function isBuildingDoor(
  k: CellKind
): k is "hire" | "vc" | "dashboard" | "coffee" {
  return k === "hire" || k === "vc" || k === "dashboard" || k === "coffee";
}

export const OFFICE_BOUNDS = {
  x0: OFFICE_X0,
  y0: OFFICE_Y0,
  x1: OFFICE_X1,
  y1: OFFICE_Y1,
};

export function inOffice(x: number, y: number): boolean {
  return (
    x >= OFFICE_BOUNDS.x0 &&
    x <= OFFICE_BOUNDS.x1 &&
    y >= OFFICE_BOUNDS.y0 &&
    y <= OFFICE_BOUNDS.y1
  );
}

export interface BaseCell {
  x: number;
  y: number;
  char: string;
  kind: CellKind;
}

export const BASE_CELLS: BaseCell[] = (() => {
  const out: BaseCell[] = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const ch = charAt(x, y);
      out.push({ x, y, char: ch, kind: kindAt(x, y) });
    }
  }
  return out;
})();

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

// Default player spawn: center-ish of office floor.
export const SPAWN = { x: 8, y: 10 };
