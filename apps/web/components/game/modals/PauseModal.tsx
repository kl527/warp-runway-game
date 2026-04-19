"use client";

import { useRouter } from "next/navigation";
import { useActions } from "@/lib/game/store";
import { WARP_URL } from "@/lib/game/constants";
import { ModalShell } from "./ModalShell";

export function PauseModal() {
  const actions = useActions();
  const router = useRouter();

  return (
    <ModalShell title="Paused" onClose={actions.togglePause}>
      <div className="flex flex-col gap-2">
        <button
          onClick={actions.togglePause}
          className="text-left shadow-ring-w hover:shadow-[inset_0_0_0_1px_rgba(255,61,0,0.45)] hover:bg-warp-orange/[0.04] rounded-lg px-3 py-2 transition"
        >
          <div className="font-medium text-white/90">Resume</div>
          <div className="text-xs text-white/55 mt-0.5">Back to the grind.</div>
        </button>
        <button
          onClick={() => router.push("/")}
          className="text-left shadow-ring-w hover:shadow-[inset_0_0_0_1px_rgba(255,61,0,0.45)] hover:bg-warp-orange/[0.04] rounded-lg px-3 py-2 transition"
        >
          <div className="font-medium text-white/90">Quit</div>
          <div className="text-xs text-white/55 mt-0.5">
            Return to the home page. Your run ends.
          </div>
        </button>
        <a
          href={WARP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-left shadow-ring-w hover:shadow-[inset_0_0_0_1px_rgba(255,61,0,0.45)] hover:bg-warp-orange/[0.04] rounded-lg px-3 py-2 transition"
        >
          <div className="font-medium text-white/90">
            Check out Warp <span aria-hidden>→</span>
          </div>
          <div className="text-xs text-white/55 mt-0.5">
            The real thing automates all of this.
          </div>
        </a>
      </div>
    </ModalShell>
  );
}
