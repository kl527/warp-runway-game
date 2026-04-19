"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActions, useGameStore } from "@/lib/game/store";
import { ModalShell } from "./ModalShell";

const VERDICT_AMOUNT = 250_000;

export function AiCriticModal() {
  const actions = useActions();
  const modal = useGameStore((s) => s.modal);
  const question = modal?.kind === "ai_critic" ? modal.payload?.critique ?? "" : "";

  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"asking" | "judging" | "settled">("asking");
  const [verdict, setVerdict] = useState<"good" | "bad" | null>(null);
  const [reply, setReply] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || phase !== "asking") return;

    setPhase("judging");
    setError(null);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answer: trimmed }),
        signal: ac.signal,
      });
      if (!res.ok) {
        setError("The Observer's line dropped.");
        setPhase("asking");
        return;
      }
      const data = (await res.json()) as {
        verdict?: "good" | "bad";
        reply?: string;
      };
      if (!data.verdict || !data.reply) {
        setError("Unreadable verdict. Try again.");
        setPhase("asking");
        return;
      }
      setVerdict(data.verdict);
      setReply(data.reply);
      actions.applyCriticVerdict(data.verdict, VERDICT_AMOUNT);
      setPhase("settled");
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        console.error(err);
        setError("Connection lost.");
        setPhase("asking");
      }
    } finally {
      abortRef.current = null;
    }
  }, [input, phase, actions]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <ModalShell title="The Board Observer" onClose={actions.closeModal}>
      <div className="pl-3 text-white/85 shadow-[inset_2px_0_0_rgba(255,61,0,0.7)]">
        <div className="font-brand text-[10px] uppercase tracking-[0.14em] mb-1 text-white/45">
          Observer
        </div>
        <div className="whitespace-pre-wrap font-serif text-base leading-snug text-white/90">
          {question}
        </div>
      </div>

      {phase === "settled" && (
        <div
          className={`mt-4 pl-3 ${
            verdict === "good"
              ? "shadow-[inset_2px_0_0_rgba(52,211,153,0.7)] text-emerald-200"
              : "shadow-[inset_2px_0_0_rgba(255,35,35,0.7)] text-warp-red-9"
          }`}
        >
          <div className="font-brand text-[10px] uppercase tracking-[0.14em] mb-1 opacity-70">
            Verdict — {verdict === "good" ? "approved" : "rejected"}
          </div>
          <div className="whitespace-pre-wrap text-sm">{reply}</div>
          <div className="mt-2 text-xs font-mono">
            Balance {verdict === "good" ? "+" : "−"}$
            {(VERDICT_AMOUNT / 1000).toFixed(0)}k
          </div>
        </div>
      )}

      {phase !== "settled" ? (
        <div className="mt-4 flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Answer in one line. (Enter to send)"
            rows={2}
            disabled={phase === "judging"}
            className="w-full bg-white/[0.02] shadow-ring-w focus:shadow-[inset_0_0_0_1px_rgba(255,61,0,0.5)] rounded-lg p-2 text-sm text-white/90 outline-none disabled:opacity-50 transition"
          />
          {error && <div className="text-xs text-warp-red-9">{error}</div>}
          <div className="flex justify-end">
            <button
              onClick={() => void send()}
              disabled={phase === "judging" || !input.trim()}
              className="px-4 py-1.5 text-sm bg-warp-orange hover:bg-warp-orange-hover disabled:bg-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
            >
              {phase === "judging" ? "..." : "Send"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <button
            onClick={actions.closeModal}
            className="px-4 py-1.5 text-sm shadow-ring-w hover:bg-white/[0.04] rounded-lg text-white/85 transition"
          >
            Back to work
          </button>
        </div>
      )}
    </ModalShell>
  );
}
