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
      <p className="font-sans text-white/75 mb-4 leading-relaxed">{body}</p>
      <div className="flex flex-col gap-2">
        {options?.map((opt) => (
          <button
            key={opt.key}
            onClick={() => actions.resolveChoice(opt.key)}
            className="text-left shadow-ring-w hover:shadow-[inset_0_0_0_1px_rgba(255,61,0,0.45)] hover:bg-warp-orange/[0.04] rounded-lg px-3 py-2 transition"
          >
            <div className="font-medium text-white/90">{opt.label}</div>
            <div className="text-xs text-white/55 mt-0.5">{opt.description}</div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
