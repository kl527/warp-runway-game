"use client";

import { useRef, useState } from "react";
import { useActions } from "@/lib/game/store";
import { ModalShell } from "./ModalShell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DISCOUNT_CODE = "RUNWAY20";

type Mode = "input" | "sending" | "submitted" | "error";

export function BuildingEggModal() {
  const actions = useActions();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<Mode>("input");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function trySubmit() {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setErrorMsg("enter a valid email");
      inputRef.current?.focus();
      setMode("error");
      return;
    }
    setErrorMsg(null);
    setMode("sending");
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("warp-runway-egg-email", trimmed);
      }
      await new Promise((r) => setTimeout(r, 450));
      setMode("submitted");
    } catch {
      setErrorMsg("couldn't submit — try again");
      setMode("error");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void trySubmit();
    }
  }

  const canSubmit = email.trim().length > 0 && mode !== "sending";
  const inputDisabled = mode === "sending" || mode === "submitted";

  return (
    <ModalShell title="◆ SECRET — WARP EASTER EGG" onClose={actions.closeModal}>
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="font-brand text-warp-orange text-xs uppercase tracking-[0.18em]">
            Congratulations
          </div>
          <p className="text-white/85 text-sm leading-relaxed">
            You found Warp.co&apos;s hidden easter egg.
          </p>
          <p className="text-white/55 text-xs leading-relaxed">
            Drop your email and we&apos;ll send you a{" "}
            <span className="text-warp-orange font-medium">20% off</span> code for a
            Warp subscription.
          </p>
        </div>

        <div className="flex items-center gap-2 shadow-ring-w rounded-lg px-3 py-2">
          <span className="text-slate-500 text-xs select-none">✉</span>
          <input
            ref={inputRef}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMsg) {
                setErrorMsg(null);
                setMode("input");
              }
            }}
            onKeyDown={onKeyDown}
            disabled={inputDisabled}
            placeholder="you@startup.com"
            type="email"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
            className="flex-1 min-w-0 bg-transparent border-b border-slate-600 focus:border-slate-300 outline-none text-xs text-slate-100 placeholder:text-slate-600 disabled:opacity-60"
            style={{ height: 20, transition: "border-color 150ms ease" }}
          />
          <button
            type="button"
            onClick={() => void trySubmit()}
            disabled={!canSubmit || inputDisabled}
            aria-label="Submit email"
            className="flex-shrink-0 inline-flex items-center justify-center text-slate-300 disabled:text-slate-600 hover:text-white disabled:hover:text-slate-600 disabled:cursor-default"
            style={{ width: 18, height: 20 }}
          >
            {mode === "sending" ? <Spinner /> : <EnterArrow />}
          </button>
        </div>

        {errorMsg ? (
          <p className="text-rose-300 text-[11px] px-1">{errorMsg}</p>
        ) : null}

        {mode === "submitted" ? (
          <div className="space-y-3">
            <div className="shadow-ring-w rounded-lg px-3 py-3 text-center space-y-1">
              <div className="font-brand text-[10px] uppercase tracking-[0.14em] text-white/45">
                your code
              </div>
              <div className="font-brand text-warp-orange text-lg tracking-[0.18em]">
                {DISCOUNT_CODE}
              </div>
            </div>
            <p className="text-white/55 text-[11px] text-center">
              Check your inbox — details on the way.
            </p>
            <button
              onClick={actions.closeModal}
              className="w-full px-4 py-2 rounded-lg bg-warp-orange text-white text-sm font-medium hover:bg-warp-orange-hover transition"
            >
              Back to the grind
            </button>
          </div>
        ) : null}
      </div>

      <style>{`@keyframes egg-spin { to { transform: rotate(360deg); } }
.egg-spin { animation: egg-spin 0.9s linear infinite; transform-origin: center; }`}</style>
    </ModalShell>
  );
}

function EnterArrow() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M13 3v4a3 3 0 0 1-3 3H3" />
      <path d="M6 7l-3 3 3 3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="egg-spin"
      aria-hidden
    >
      <path d="M8 2a6 6 0 1 1-4.24 1.76" />
    </svg>
  );
}
