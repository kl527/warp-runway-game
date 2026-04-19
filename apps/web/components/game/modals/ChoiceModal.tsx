"use client";

import { useActions, useGameStore } from "@/lib/game/store";
import { ModalShell } from "./ModalShell";

export function ChoiceModal() {
  const actions = useActions();
  const modal = useGameStore((s) => s.modal);
  if (!modal || modal.kind !== "choice" || !modal.payload) return null;
  const { title, body, options } = modal.payload;

  return (
    <ModalShell title={title ?? "Choose"}>
      <p className="text-slate-300 mb-4">{body}</p>
      <div className="flex flex-col gap-2">
        {options?.map((opt) => (
          <button
            key={opt.key}
            onClick={() => actions.resolveChoice(opt.key)}
            className="text-left border border-slate-700 hover:border-emerald-500 rounded px-3 py-2 transition"
          >
            <div className="font-bold text-slate-100">{opt.label}</div>
            <div className="text-xs text-slate-400">{opt.description}</div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
