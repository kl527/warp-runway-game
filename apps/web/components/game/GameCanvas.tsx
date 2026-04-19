"use client";

import { useMemo } from "react";
import { useGameStore } from "@/lib/game/store";
import { BASE_CELLS, cellKey } from "@/lib/game/map";
import { selectEmployees, selectPosition } from "@/lib/game/selectors";
import { Cell, type DisplayKind } from "./Cell";
import { useShallow } from "zustand/react/shallow";

export function GameCanvas() {
  const position = useGameStore(selectPosition);
  const employees = useGameStore(useShallow(selectEmployees));

  const employeeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of employees) m.set(cellKey(e.x, e.y), e.role.char);
    return m;
  }, [employees]);

  const playerKey = cellKey(position.x, position.y);

  return (
    <div className="game-grid text-sm md:text-base" aria-label="Office map">
      {BASE_CELLS.map((base) => {
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
