"use client";

import { useActions } from "@/lib/game/store";
import {
  WARP_NEWSLETTER_EMBED_URL,
  WARP_NEWSLETTER_URL,
} from "@/lib/game/constants";
import { ModalShell } from "./ModalShell";

export function NewsletterModal() {
  const actions = useActions();

  return (
    <ModalShell title="✉ WARP NEWSLETTER" onClose={actions.closeModal}>
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="font-brand text-warp-orange text-xs uppercase tracking-[0.18em]">
            Signal from the lounge
          </div>
          <p className="text-white/85 text-sm leading-relaxed">
            Weekly on how startups actually burn their runway — and the tools
            Warp is building for them.
          </p>
        </div>

        <div className="shadow-ring-w rounded-lg overflow-hidden bg-white">
          <iframe
            src={WARP_NEWSLETTER_EMBED_URL}
            title="Warp newsletter signup"
            width="100%"
            height={150}
            frameBorder={0}
            scrolling="no"
            style={{ display: "block", border: "none" }}
          />
        </div>

        <p className="text-white/45 text-[11px] text-center">
          Can&apos;t see the form?{" "}
          <a
            href={WARP_NEWSLETTER_URL}
            target="_blank"
            rel="noreferrer"
            className="text-warp-orange hover:underline"
          >
            Open in a new tab →
          </a>
        </p>

        <button
          onClick={actions.closeModal}
          className="w-full px-4 py-2 rounded-lg bg-warp-orange text-white text-sm font-medium hover:bg-warp-orange-hover transition"
        >
          Back to the grind
        </button>
      </div>
    </ModalShell>
  );
}
