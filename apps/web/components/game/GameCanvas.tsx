"use client";

import { useMemo } from "react";
import { useGameStore } from "@/lib/game/store";
import { cellKey, getMap } from "@/lib/game/map";
import { selectEmployees, selectPosition } from "@/lib/game/selectors";
import { Cell, type DisplayKind } from "./Cell";
import { useShallow } from "zustand/react/shallow";
import { EASTER_EGG_CHAR } from "@/lib/game/constants";

export function GameCanvas() {
  const position = useGameStore(selectPosition);
  const round = useGameStore((s) => s.round);
  const employees = useGameStore(useShallow(selectEmployees));
  const easterEggs = useGameStore(useShallow((s) => s.easterEggs));

  const map = useMemo(() => getMap(round), [round]);

  const employeeMap = useMemo(() => {
    const m = new Map<string, { char: string; quitting: boolean }>();
    for (const e of employees) {
      m.set(cellKey(e.x, e.y), {
        char: e.role.char,
        quitting: e.quittingSinceTick !== null,
      });
    }
    return m;
  }, [employees]);

  const eggSet = useMemo(() => {
    const s = new Set<string>();
    for (const e of easterEggs) s.add(cellKey(e.x, e.y));
    return s;
  }, [easterEggs]);

  const playerKey = cellKey(position.x, position.y);

  const gridStyle = {
    gridTemplateColumns: `repeat(${map.width}, 1ch)`,
    gridTemplateRows: `repeat(${map.height}, 1em)`,
  };

  return (
    <div
      className="game-grid text-sm md:text-base"
      style={gridStyle}
      aria-label="Office map"
    >
      {map.cells.map((base) => {
        const key = cellKey(base.x, base.y);
        let char = base.char;
        let kind: DisplayKind = base.kind;
        if (key === playerKey) {
          char = "@";
          kind = "player";
        } else if (employeeMap.has(key)) {
          const emp = employeeMap.get(key)!;
          char = emp.char;
          kind = emp.quitting ? "employee_quitting" : "employee";
        } else if (eggSet.has(key)) {
          char = EASTER_EGG_CHAR;
          kind = "easter_egg";
        }
        return <Cell key={key} char={char} kind={kind} />;
      })}
    </div>
  );
}
