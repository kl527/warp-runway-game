"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActions, useGameStore } from "@/lib/game/store";
import { useShallow } from "zustand/react/shallow";
import { valuation } from "@/lib/game/valuation";
import { teamDistribution } from "@/lib/game/selectors";
import { WARP_URL } from "@/lib/game/constants";
import { useDeathSound, useLevelUpSound } from "@/lib/game/sounds";
import type { LeaderboardRow } from "@warp/shared";

export function EndScreen() {
  const actions = useActions();
  const [handle, setHandle] = useState("");
  const [submitted, setSubmitted] = useState<null | "ok" | "err">(null);
  const [submittedHandle, setSubmittedHandle] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const confettiFired = useRef(false);
  const playDeath = useDeathSound();
  const playLevelUp = useLevelUpSound();

  const fetchBoard = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    try {
      const res = await fetch(`${apiUrl}/leaderboard`);
      if (!res.ok) return;
      const data = (await res.json()) as { rows: LeaderboardRow[] };
      setRows(data.rows);
    } catch {
      // ignore — section just won't render
    }
  }, []);

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
      };
    })
  );

  const val = valuation({ revenuePerWeek: state.revenue });
  const isUnicorn = state.gameOver === "unicorn";
  const isFired = state.gameOver === "fired";

  useEffect(() => {
    if (!state.gameOver) return;
    fetchBoard();
  }, [state.gameOver, fetchBoard]);

  useEffect(() => {
    if (!state.gameOver) return;
    if (isUnicorn) {
      playLevelUp();
      if (!confettiFired.current) {
        confettiFired.current = true;
        import("canvas-confetti")
          .then((m) => {
            const confetti = m.default;
            confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
            setTimeout(
              () => confetti({ particleCount: 120, spread: 120, origin: { y: 0.4 } }),
              400
            );
          })
          .catch(() => {});
      }
    } else {
      playDeath();
    }
  }, [state.gameOver, isUnicorn, playDeath, playLevelUp]);

  if (!state.gameOver) return null;

  const shareUrlOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const playUrl = `${shareUrlOrigin}/play`;

  const valStr =
    val >= 1_000_000_000
      ? `$${(val / 1_000_000_000).toFixed(2)}B`
      : `$${(val / 1_000_000).toFixed(1)}M`;
  const balAbs = Math.abs(state.balance);
  const balStr =
    balAbs >= 1_000_000
      ? `$${(balAbs / 1_000_000).toFixed(1)}M`
      : balAbs >= 1_000
        ? `$${(balAbs / 1_000).toFixed(0)}k`
        : `$${balAbs.toFixed(0)}`;

  const WIDTH = 24;
  const row = (label: string, value: string) => {
    const inner = `  ${label}${value}`;
    return `|${inner}${" ".repeat(Math.max(0, WIDTH - inner.length))}|`;
  };
  const center = (text: string) => {
    const left = Math.max(0, Math.floor((WIDTH - text.length) / 2));
    const right = Math.max(0, WIDTH - text.length - left);
    return `|${" ".repeat(left)}${text}${" ".repeat(right)}|`;
  };
  const border = `+${"-".repeat(WIDTH)}+`;

  const asciiCard = isUnicorn
    ? [
        border,
        center("** UNICORN **"),
        border,
        row("Week:      ", String(state.week)),
        row("Team:      ", String(state.peakHeadcount)),
        row("Valuation: ", valStr),
        border,
      ].join("\n")
    : isFired
      ? [
          border,
          center("FIRED BY BOARD"),
          border,
          row("Week:      ", String(state.week)),
          row("Team:      ", String(state.peakHeadcount)),
          row("Left:      ", balStr),
          border,
        ].join("\n")
      : [
          border,
          center("R.I.P. STARTUP"),
          border,
          row("Week:      ", String(state.week)),
          row("Burned:    ", balStr),
          row("Team:      ", String(state.peakHeadcount)),
          border,
        ].join("\n");

  const tagline = isUnicorn
    ? "I hit Unicorn on Warp Runway. Try it:"
    : "I flamed out on Warp Runway. Beat me:";
  const shareText = `${asciiCard}\n\n${tagline}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(playUrl)}`;

  async function submit() {
    const trimmed = handle.trim().slice(0, 24);
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL not configured");
      const res = await fetch(`${apiUrl}/leaderboard`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle: trimmed,
          weeksSurvived: state.week,
          peakHeadcount: state.peakHeadcount,
          finalValuation: val,
        }),
      });
      if (res.ok) {
        setSubmitted("ok");
        setSubmittedHandle(trimmed);
        fetchBoard();
      } else {
        setSubmitted("err");
      }
    } catch {
      setSubmitted("err");
    } finally {
      setSubmitting(false);
    }
  }

  const fmtVal = (n: number) =>
    n >= 1_000_000_000
      ? `$${(n / 1_000_000_000).toFixed(1)}B`
      : n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(1)}M`
        : `$${(n / 1_000).toFixed(0)}k`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-8 overflow-auto">
      <div className="max-w-2xl w-full space-y-6">
        {isUnicorn ? (
          <div className="text-center">
            <pre className="text-fuchsia-400 text-sm leading-tight">
{String.raw`
  _   _ _   _ ___ ____ ___  ____  _   _ _
 | | | | \ | |_ _/ ___/ _ \|  _ \| \ | | |
 | | | |  \| || | |  | | | | |_) |  \| | |
 | |_| | |\  || | |__| |_| |  _ <| |\  |_|
  \___/|_| \_|___\____\___/|_| \_\_| \_(_)
`}
            </pre>
            <h1 className="text-2xl font-bold text-fuchsia-300 mt-2">
              Unicorn at week {state.week}.
            </h1>
          </div>
        ) : (
          <div className="text-center">
            <h1
              className={`text-2xl font-bold ${isFired ? "text-amber-300" : "text-rose-300"}`}
            >
              {isFired ? "Fired by the board." : "You burned."}
            </h1>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <Stat label="Weeks" value={String(state.week)} />
          <Stat label="Peak team" value={String(state.peakHeadcount)} />
          <Stat
            label="Final val"
            value={`$${(val / 1_000_000).toFixed(1)}M`}
          />
          <Stat
            label="Coverage"
            value={`${state.coveredCategories}/3`}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 rounded bg-sky-500 text-slate-950 font-bold hover:bg-sky-400"
          >
            Share on X
          </a>
          <button
            onClick={actions.reset}
            className="flex-1 px-4 py-2 rounded border border-slate-700 hover:bg-slate-800"
          >
            Play again
          </button>
        </div>

        <div className="border border-slate-800 rounded p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-bold text-slate-200">Leaderboard</h3>
            <span className="text-xs text-slate-500">top by weeks survived</span>
          </div>

          {submitted === "ok" ? (
            <p className="text-emerald-300 text-xs">Submitted as {submittedHandle}.</p>
          ) : (
            <div className="flex gap-2">
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                maxLength={24}
                placeholder="@handle"
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
              />
              <button
                onClick={submit}
                disabled={submitting || !handle.trim()}
                className="px-3 py-1 rounded bg-emerald-600 text-slate-950 font-bold disabled:opacity-40"
              >
                {submitting ? "..." : "Submit"}
              </button>
            </div>
          )}
          {submitted === "err" && (
            <p className="text-rose-300 text-xs">
              Submission failed. D1 may not be configured locally.
            </p>
          )}

          {rows && rows.length > 0 ? (
            <ol className="space-y-1 text-sm font-mono">
              <li className="grid grid-cols-[1.5rem_1fr_3rem_3rem_4rem] gap-2 text-[10px] uppercase tracking-wide text-slate-500 px-2">
                <span>#</span>
                <span>handle</span>
                <span className="text-right">wks</span>
                <span className="text-right">team</span>
                <span className="text-right">val</span>
              </li>
              {rows.slice(0, 10).map((r, i) => {
                const mine = submittedHandle && r.handle === submittedHandle;
                return (
                  <li
                    key={`${r.handle}-${r.created_at}`}
                    className={`grid grid-cols-[1.5rem_1fr_3rem_3rem_4rem] gap-2 px-2 py-1 rounded ${
                      mine
                        ? "bg-emerald-500/10 text-emerald-200"
                        : "text-slate-300"
                    }`}
                  >
                    <span className="text-slate-500">{i + 1}</span>
                    <span className="truncate">{r.handle}</span>
                    <span className="text-right tabular-nums">{r.weeks_survived}</span>
                    <span className="text-right tabular-nums">{r.peak_headcount}</span>
                    <span className="text-right tabular-nums">
                      {fmtVal(r.final_valuation)}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : rows && rows.length === 0 ? (
            <p className="text-slate-500 text-xs">No entries yet. Be first.</p>
          ) : null}
        </div>

        <div className="border-t border-slate-800 pt-4 text-center">
          <p className="text-slate-400 text-sm mb-2">
            Running a real startup? Warp actually automates all of this.
          </p>
          <a
            href={WARP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded bg-amber-400 text-slate-950 font-bold hover:bg-amber-300"
          >
            Try Warp &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-800 rounded p-3">
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-lg font-bold tabular-nums text-slate-100">{value}</div>
    </div>
  );
}
