"use client";

import { useMemo } from "react";
import { useGameStore } from "@/lib/game/store";
import { cellKey, getMap } from "@/lib/game/map";
import { selectEmployees, selectPosition } from "@/lib/game/selectors";
import { Cell, type DisplayKind } from "./Cell";
import { useShallow } from "zustand/react/shallow";

export function GameCanvas() {
  const position = useGameStore(selectPosition);
  const round = useGameStore((s) => s.round);
  const employees = useGameStore(useShallow(selectEmployees));

  const map = useMemo(() => getMap(round), [round]);

  const employeeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of employees) m.set(cellKey(e.x, e.y), e.role.char);
    return m;
  }, [employees]);

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
          char = employeeMap.get(key)!;
          kind = "employee";
        }
        return <Cell key={key} char={char} kind={kind} />;
      })}
    </div>
  );
}
