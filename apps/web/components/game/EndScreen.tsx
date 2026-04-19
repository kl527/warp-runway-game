"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useActions, useGameStore } from "@/lib/game/store";
import { useShallow } from "zustand/react/shallow";
import { valuation } from "@/lib/game/valuation";
import { teamDistribution } from "@/lib/game/selectors";
import { WARP_URL } from "@/lib/game/constants";
import { itemById } from "@/lib/game/items";
import {
  fetchBoard,
  submitScore,
  type BoardSource,
} from "@/lib/game/leaderboard";
import type { LeaderboardRow } from "@warp/shared";

const HANDLE_RE = /^[A-Za-z0-9_\-@.]+$/;

function fmtVal(n: number): string {
  return n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(1)}B`
    : n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : `$${(n / 1_000).toFixed(0)}k`;
}

function fmtPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function shortName(name: string, max = 16): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1).trimEnd() + "…";
}

type SubmitMode = "input" | "sending" | "submitted" | "error";

export function EndScreen() {
  const actions = useActions();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [boardSource, setBoardSource] = useState<BoardSource>("local");
  const [handle, setHandle] = useState("");
  const [mode, setMode] = useState<SubmitMode>("input");
  const [myRow, setMyRow] = useState<LeaderboardRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const confettiFired = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const state = useGameStore(
    useShallow((s) => {
      const dist = teamDistribution(s);
      return {
        gameOver: s.gameOver,
        week: s.week,
        balance: s.balance,
        peakHeadcount: s.peakHeadcount,
        revenue: s.revenuePerWeek,
        coveredCategories: dist.coveredCategories,
        purchases: s.purchases,
      };
    })
  );

  const val = valuation({ revenuePerWeek: state.revenue });
  const isUnicorn = state.gameOver === "unicorn";
  const isFired = state.gameOver === "fired";

  const refreshBoard = useCallback(async () => {
    const result = await fetchBoard();
    setRows(result.rows);
    setBoardSource(result.source);
  }, []);

  useEffect(() => {
    if (!state.gameOver) return;
    refreshBoard();
  }, [state.gameOver, refreshBoard]);

  // Focus handle input as soon as the death screen appears.
  useEffect(() => {
    if (!state.gameOver) return;
    if (mode !== "input") return;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [state.gameOver, mode]);

  useEffect(() => {
    if (!state.gameOver) return;
    // Death / level_up SFX are played by useSoundEffects on the gameOver
    // transition — this effect owns the confetti-only unicorn payoff.
    if (isUnicorn && !confettiFired.current) {
      confettiFired.current = true;
      import("canvas-confetti")
        .then((m) => {
          const confetti = m.default;
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
          setTimeout(
            () =>
              confetti({ particleCount: 120, spread: 120, origin: { y: 0.4 } }),
            400
          );
        })
        .catch(() => {});
    }
  }, [state.gameOver, isUnicorn]);

  if (!state.gameOver) return null;

  const playUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const balAbs = Math.abs(state.balance);
  const balStr =
    balAbs >= 1_000_000
      ? `$${(balAbs / 1_000_000).toFixed(1)}M`
      : balAbs >= 1_000
        ? `$${(balAbs / 1_000).toFixed(0)}k`
        : `$${balAbs.toFixed(0)}`;

  const valStr = fmtVal(val);

  // Rank = position among submitted rows, using the same sort as the board
  // (peak headcount desc, then valuation desc). Counts rows strictly better.
  const betterThanMe = (rows ?? []).filter((r) =>
    r.peak_headcount > state.peakHeadcount ||
    (r.peak_headcount === state.peakHeadcount && r.final_valuation > val)
  ).length;
  const rank = betterThanMe + 1;
  const rankStr = rows && rows.length > 0 ? `#${rank}` : null;

  const rankLine = isUnicorn
    ? `${rankStr ?? "🦄 UNICORN"} on Warp Runway 🏆`
    : isFired
      ? rankStr
        ? `Ranked ${rankStr} on Warp Runway — fired at week ${state.week}`
        : `Fired by the board at week ${state.week} on Warp Runway`
      : rankStr
        ? `Ranked ${rankStr} on Warp Runway — burned at week ${state.week}`
        : `Burned at week ${state.week} on Warp Runway`;

  const topPurchases = [...state.purchases]
    .sort((a, b) => b.price - a.price)
    .slice(0, 4)
    .map((p) => {
      const item = itemById(p.itemId);
      if (!item) return null;
      return `${item.icon} ${shortName(item.name)}  ${fmtPrice(p.price)}`;
    })
    .filter((s): s is string => s !== null);

  const statsLine = `${state.week} wks · team of ${state.peakHeadcount} · ${valStr}`;

  const shareText = [
    rankLine,
    topPurchases.length > 0 ? "" : null,
    topPurchases.length > 0 ? topPurchases.join("\n") : null,
    "",
    statsLine,
    "",
    "Beat me:",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(playUrl)}`;

  async function trySubmit() {
    const trimmed = handle.trim().slice(0, 24);
    if (!trimmed || !HANDLE_RE.test(trimmed)) {
      setErrorMsg("letters, numbers, _ - @ . only");
      inputRef.current?.focus();
      return;
    }
    setErrorMsg(null);
    setMode("sending");
    try {
      const result = await submitScore({
        handle: trimmed,
        weeksSurvived: state.week,
        peakHeadcount: state.peakHeadcount,
        finalValuation: val,
      });
      setMyRow(result.row);
      setMode("submitted");
      // Refetch to pull in the merged server+local board.
      refreshBoard();
    } catch {
      setErrorMsg("couldn't submit — try again");
      setMode("error");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void trySubmit();
    }
  }

  // Build the rendered list: top 10 saved rows. The user's death row is
  // appended below only if they're not already in the top 10.
  const topRows = (rows ?? []).slice(0, 10);
  const userIsTop =
    myRow &&
    topRows.some(
      (r) =>
        r.handle === myRow.handle &&
        r.created_at === myRow.created_at
    );

  const youMetrics: {
    weeks: number;
    team: number;
    val: number;
  } = {
    weeks: state.week,
    team: state.peakHeadcount,
    val,
  };

  const frameGlow = isUnicorn
    ? "shadow-frame-fuchsia"
    : isFired
      ? "shadow-frame-amber"
      : "shadow-frame-warp";

  const youAccent = isUnicorn
    ? "bg-fuchsia-500/10 text-fuchsia-100 shadow-[inset_0_0_0_1px_rgba(232,121,249,0.4)]"
    : isFired
      ? "bg-warp-amber-9/10 text-warp-amber-9 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.4)]"
      : "bg-warp-orange/10 text-warp-orange shadow-[inset_0_0_0_1px_rgba(255,61,0,0.4)]";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-6 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`max-w-xl w-full space-y-5 ${frameGlow} shadow-modal-w rounded-xl p-7 bg-[#0b0d12]/90 backdrop-blur relative overflow-hidden`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Status banner */}
        {isUnicorn ? (
          <div className="text-center relative">
            <pre className="text-fuchsia-400 text-[10px] sm:text-xs leading-tight drop-shadow-glow-fuchsia">
{String.raw`
  _   _ _   _ ___ ____ ___  ____  _   _ _
 | | | | \ | |_ _/ ___/ _ \|  _ \| \ | | |
 | | | |  \| || | |  | | | | |_) |  \| | |
 | |_| | |\  || | |__| |_| |  _ <| |\  |_|
  \___/|_| \_|___\____\___/|_| \_\_| \_(_)
`}
            </pre>
            <h1 className="font-serif text-3xl sm:text-4xl text-fuchsia-200 mt-2 tracking-tight">
              Unicorn at week {state.week}.
            </h1>
          </div>
        ) : (
          <div className="text-center relative">
            <h1
              className={`font-serif text-3xl sm:text-4xl tracking-tight ${
                isFired
                  ? "text-warp-amber-9 drop-shadow-glow-amber"
                  : "text-warp-orange drop-shadow-[0_0_8px_rgba(255,61,0,0.45)]"
              }`}
            >
              {isFired ? "Fired by the board." : "You burned."}
            </h1>
            <p className="font-mono text-xs text-white/45 mt-2">
              Week {state.week} · {balStr} · team of {state.peakHeadcount}
            </p>
          </div>
        )}

        {/* Combined leaderboard + your run */}
        <div className="shadow-ring-w rounded-lg p-4 space-y-2 relative">
          <div className="flex items-baseline justify-between">
            <h3 className="font-brand text-sm font-medium text-warp-accent-3">Leaderboard</h3>
            <span className="font-brand text-[10px] uppercase tracking-[0.14em] text-white/40">
              {boardSource === "api"
                ? "live · top by hiring ambition"
                : boardSource === "mixed"
                  ? "live + local"
                  : "local only"}
            </span>
          </div>

          <ol className="space-y-1 text-sm font-mono">
            <li className="grid grid-cols-[2.5rem_1fr_2.5rem_3.5rem_2.5rem] gap-2 text-[10px] uppercase tracking-wide text-slate-500 px-2">
              <span>#</span>
              <span>handle</span>
              <span className="text-right">team</span>
              <span className="text-right">val</span>
              <span className="text-right">wks</span>
            </li>

            {topRows.length === 0 && mode !== "submitted" ? (
              <li className="px-2 py-1 text-xs text-slate-500 italic">
                No entries yet. Be first.
              </li>
            ) : null}

            {topRows.map((r, i) => {
              const mine =
                myRow &&
                r.handle === myRow.handle &&
                r.created_at === myRow.created_at;
              return (
                <li
                  key={`${r.handle}-${r.created_at}`}
                  className={`grid grid-cols-[2.5rem_1fr_2.5rem_3.5rem_2.5rem] gap-2 px-2 py-1 rounded ${
                    mine ? youAccent : "text-slate-300"
                  }`}
                >
                  <span className={mine ? "" : "text-slate-500"}>
                    {i + 1}
                  </span>
                  <span className="truncate">{r.handle}</span>
                  <span className="text-right tabular-nums">
                    {r.peak_headcount}
                  </span>
                  <span className="text-right tabular-nums">
                    {fmtVal(r.final_valuation)}
                  </span>
                  <span className="text-right tabular-nums">
                    {r.weeks_survived}
                  </span>
                </li>
              );
            })}

            {/* User's death row — hidden only if they submitted AND made the top list */}
            {!userIsTop ? (
              <li
                className={`grid grid-cols-[2.5rem_1fr_2.5rem_3.5rem_2.5rem] gap-2 px-2 py-1 rounded items-center ${youAccent}`}
              >
                <span className="font-bold tabular-nums">{rank}</span>
                <HandleCell
                  mode={mode}
                  handle={handle}
                  submittedHandle={myRow?.handle ?? null}
                  onChange={(v) => {
                    setHandle(v);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onKeyDown={handleKeyDown}
                  onSubmit={() => void trySubmit()}
                  inputRef={inputRef}
                />
                <span className="text-right tabular-nums">
                  {youMetrics.team}
                </span>
                <span className="text-right tabular-nums">
                  {fmtVal(youMetrics.val)}
                </span>
                <span className="text-right tabular-nums">
                  {youMetrics.weeks}
                </span>
              </li>
            ) : null}
          </ol>

          {errorMsg ? (
            <p className="text-rose-300 text-[11px] px-2">{errorMsg}</p>
          ) : mode === "submitted" && boardSource === "local" ? (
            <p className="text-slate-500 text-[11px] px-2">
              Saved locally — backend offline.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 rounded-lg bg-white/[0.04] text-white/85 font-medium shadow-ring-w hover:bg-white/[0.08] transition"
          >
            Share on X
          </a>
          <button
            onClick={actions.reset}
            className="flex-1 px-4 py-2 rounded-lg shadow-ring-w text-white/85 hover:bg-white/[0.04] transition"
          >
            Play again
          </button>
        </div>

        <div className="pt-5 mt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-center">
          <p className="font-sans text-white/55 text-sm mb-3 mt-3">
            Running a real startup? Warp actually automates all of this.
          </p>
          <a
            href={WARP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-warp-orange text-white font-medium hover:bg-warp-orange-hover transition shadow-[0_8px_20px_-8px_rgba(255,61,0,0.55)]"
          >
            Try Warp <span aria-hidden>→</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

interface HandleCellProps {
  mode: SubmitMode;
  handle: string;
  submittedHandle: string | null;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const HANDLE_HEIGHT = 22;
const MORPH_DURATION = 280;
const MORPH_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

function HandleCell({
  mode,
  handle,
  submittedHandle,
  onChange,
  onKeyDown,
  onSubmit,
  inputRef,
}: HandleCellProps) {
  const canSubmit = handle.trim().length > 0;
  const showInput = mode === "input" || mode === "error";
  const showSpinner = mode === "sending";
  const showSubmitted = mode === "submitted" && submittedHandle;

  return (
    <div
      className="relative flex items-center min-w-0"
      style={{
        height: HANDLE_HEIGHT,
      }}
    >
      {/* Input face */}
      <div
        aria-hidden={!showInput}
        className="absolute inset-0 flex items-center gap-1 min-w-0"
        style={{
          opacity: showInput ? 1 : 0,
          pointerEvents: showInput ? "auto" : "none",
          transition: `opacity ${MORPH_DURATION / 2}ms ease ${
            showInput ? MORPH_DURATION / 2 : 0
          }ms`,
        }}
      >
        <span className="text-slate-500 text-xs select-none">@</span>
        <input
          ref={inputRef}
          value={handle}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={24}
          placeholder="your handle"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          tabIndex={showInput ? 0 : -1}
          className="flex-1 min-w-0 bg-transparent border-b border-slate-600 focus:border-slate-300 outline-none text-xs text-slate-100 placeholder:text-slate-600"
          style={{
            height: HANDLE_HEIGHT - 2,
            transition: `border-color 150ms ease`,
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="Submit handle"
          tabIndex={showInput ? 0 : -1}
          className="flex-shrink-0 inline-flex items-center justify-center text-slate-300 disabled:text-slate-600 hover:text-white disabled:hover:text-slate-600 disabled:cursor-default"
          style={{ width: 18, height: HANDLE_HEIGHT }}
        >
          <EnterArrow />
        </button>
      </div>

      {/* Sending face */}
      <div
        aria-hidden={!showSpinner}
        className="absolute inset-0 flex items-center gap-1 text-xs text-slate-400"
        style={{
          opacity: showSpinner ? 1 : 0,
          pointerEvents: "none",
          transition: `opacity ${MORPH_DURATION / 2}ms ease ${
            showSpinner ? MORPH_DURATION / 2 : 0
          }ms`,
        }}
      >
        <Spinner />
        <span>saving…</span>
      </div>

      {/* Submitted face */}
      <div
        aria-hidden={!showSubmitted}
        className="absolute inset-0 flex items-center gap-1 text-xs text-slate-100"
        style={{
          opacity: showSubmitted ? 1 : 0,
          pointerEvents: "none",
          transition: `opacity ${MORPH_DURATION / 2}ms ease ${
            showSubmitted ? MORPH_DURATION / 2 : 0
          }ms`,
        }}
      >
        <span className="truncate">{submittedHandle}</span>
        <Check />
      </div>

      <style>{`@keyframes runway-spin { to { transform: rotate(360deg); } }
.runway-spin { animation: runway-spin 0.9s linear infinite; transform-origin: center; }`}</style>
    </div>
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
      aria-hidden="true"
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
      className="runway-spin"
      aria-hidden="true"
    >
      <path d="M8 2a6 6 0 1 1-4.24 1.76" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}
