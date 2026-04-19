"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActions, useGameStore } from "@/lib/game/store";
import { ModalShell } from "./ModalShell";

type ChatMessage = { role: "assistant" | "user"; content: string };

export function AiCriticModal() {
  const actions = useActions();
  const modal = useGameStore((s) => s.modal);
  const critique = modal?.kind === "ai_critic" ? modal.payload?.critique ?? "" : "";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: critique },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    const nextHistory: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextHistory);
    setInput("");
    setStreaming(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextHistory }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "(The Observer's line dropped. Try again later.)",
          },
        ]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <ModalShell title="The Board Observer" onClose={actions.closeModal} wide>
      <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "assistant"
                ? "border-l-2 border-emerald-500 pl-3 text-slate-200"
                : "border-l-2 border-slate-600 pl-3 text-slate-400 italic"
            }
          >
            <div className="text-[10px] uppercase tracking-wider mb-1 text-slate-500">
              {m.role === "assistant" ? "Observer" : "You"}
            </div>
            <div className="whitespace-pre-wrap text-sm">
              {m.content || (streaming && i === messages.length - 1 ? "..." : "")}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Defend yourself. (Enter to send, Shift+Enter for newline)"
          rows={3}
          disabled={streaming}
          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
        />
        <div className="flex justify-between items-center">
          <button
            onClick={actions.closeModal}
            className="text-xs text-slate-500 hover:text-slate-200"
          >
            Dismiss
          </button>
          <button
            onClick={() => void send()}
            disabled={streaming || !input.trim()}
            className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-white"
          >
            {streaming ? "..." : "Send"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
