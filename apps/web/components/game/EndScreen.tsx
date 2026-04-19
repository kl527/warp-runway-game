"use client";

import { useEffect, useRef, useState } from "react";
import { useActions, useGameStore } from "@/lib/game/store";
import { useShallow } from "zustand/react/shallow";
import { valuation } from "@/lib/game/valuation";
import { teamDistribution } from "@/lib/game/selectors";
import { WARP_URL } from "@/lib/game/constants";
import { useDeathSound, useLevelUpSound } from "@/lib/game/sounds";

function epitaph(weeks: number, headcount: number, balance: number): string {
  const b = Math.abs(balance);
  const pretty =
    b >= 1_000_000
      ? `$${(b / 1_000_000).toFixed(1)}M`
      : b >= 1_000
        ? `$${(b / 1_000).toFixed(0)}k`
        : `$${b.toFixed(0)}`;
  return `Burned ${pretty} hiring ${headcount} people in ${weeks} weeks.`;
}

export function EndScreen() {
  const actions = useActions();
  const [handle, setHandle] = useState("");
  const [submitted, setSubmitted] = useState<null | "ok" | "err">(null);
  const [submitting, setSubmitting] = useState(false);
  const confettiFired = useRef(false);
  const playDeath = useDeathSound();
  const playLevelUp = useLevelUpSound();

  const state = useGameStore(
    useShallow((s) => {
      const dist = teamDistribution(s);
      return {
        gameOver: s.gameOver,
        week: s.week,
        balance: s.balance,
        peakHeadcount: s.peakHeadcount,
        headcount: s.employees.length,
        revenue: s.revenuePerWeek,
        coveredCategories: dist.coveredCategories,
        eng: dist.counts.engineering,
        design: dist.counts.design,
        gtm: dist.counts.gtm,
      };
    })
  );

  const val = valuation({ revenuePerWeek: state.revenue });
  const isUnicorn = state.gameOver === "unicorn";
  const teamBreakdown = `${state.eng}/${state.design}/${state.gtm} (eng/design/gtm)`;
  const epi =
    epitaph(state.week, state.peakHeadcount, state.balance) +
    (state.headcount > 0 ? ` Team: ${teamBreakdown}.` : "");

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

  const shareText = isUnicorn
    ? `I became a Unicorn on Warp Runway at week ${state.week}. ${state.peakHeadcount} people. Try it:`
    : `${epi} Try surviving yourself:`;
  const shareUrlOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const ogParams = new URLSearchParams({
    mode: isUnicorn ? "unicorn" : "burned",
    w: String(state.week),
    h: String(state.peakHeadcount),
    b: String(state.balance),
    v: String(val),
    e: epi,
  });
  const ogUrl = `${shareUrlOrigin}/api/og?${ogParams.toString()}`;
  const playUrl = `${shareUrlOrigin}/play`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(playUrl)}`;

  async function submit() {
    const trimmed = handle.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL not configured");
      const res = await fetch(`${apiUrl}/leaderboard`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle: trimmed.slice(0, 24),
          weeksSurvived: state.week,
          peakHeadcount: state.peakHeadcount,
          finalValuation: val,
        }),
      });
      setSubmitted(res.ok ? "ok" : "err");
    } catch {
      setSubmitted("err");
    } finally {
      setSubmitting(false);
    }
  }

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
            <h1 className="text-3xl font-bold text-fuchsia-300 mt-4">
              You became a Unicorn at week {state.week}.
            </h1>
            <p className="text-slate-400 mt-2">
              Valuation: ${(val / 1_000_000_000).toFixed(2)}B. Mythical status unlocked.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <pre className="text-rose-400 text-xs leading-tight">
{String.raw`
        ______________
       /              \
      /    R. I. P.    \
     |                  |
     |  YOUR STARTUP    |
     |   died at        |
     |   week ${String(state.week).padEnd(3)}       |
     |                  |
  ___|________________|___
`}
            </pre>
            <h1 className="text-2xl font-bold text-rose-300 mt-2">
              You burned. {epi}
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
            Share on Twitter
          </a>
          <a
            href={ogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 rounded border border-slate-700 hover:bg-slate-800"
          >
            Preview card
          </a>
          <button
            onClick={actions.reset}
            className="flex-1 px-4 py-2 rounded border border-slate-700 hover:bg-slate-800"
          >
            Play again
          </button>
        </div>

        <div className="border border-slate-800 rounded p-4">
          <h3 className="font-bold text-slate-200 mb-2">Leaderboard</h3>
          {submitted === "ok" ? (
            <p className="text-emerald-300 text-sm">
              Submitted. Glory achieved.
            </p>
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
            <p className="text-rose-300 text-xs mt-2">
              Submission failed. D1 may not be configured locally.
            </p>
          )}
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
