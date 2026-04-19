import type { LeaderboardRow, LeaderboardSubmission } from "@warp/shared";

const LOCAL_KEY = "warp-runway-leaderboard";
const LOCAL_MAX = 50;

function readLocal(): LeaderboardRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is LeaderboardRow =>
        r &&
        typeof r.handle === "string" &&
        typeof r.weeks_survived === "number" &&
        typeof r.peak_headcount === "number" &&
        typeof r.final_valuation === "number" &&
        typeof r.created_at === "number"
    );
  } catch {
    return [];
  }
}

function writeLocal(row: LeaderboardRow) {
  if (typeof window === "undefined") return;
  try {
    const existing = readLocal();
    const next = [row, ...existing].slice(0, LOCAL_MAX);
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / serialization errors
  }
}

function sortRows(rows: LeaderboardRow[]): LeaderboardRow[] {
  return [...rows].sort((a, b) => {
    if (b.peak_headcount !== a.peak_headcount)
      return b.peak_headcount - a.peak_headcount;
    return b.final_valuation - a.final_valuation;
  });
}

function dedupe(rows: LeaderboardRow[]): LeaderboardRow[] {
  const seen = new Set<string>();
  const out: LeaderboardRow[] = [];
  for (const r of rows) {
    const key = `${r.handle}|${r.created_at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export type BoardSource = "api" | "local" | "mixed";

export interface BoardFetchResult {
  rows: LeaderboardRow[];
  source: BoardSource;
}

export async function fetchBoard(): Promise<BoardFetchResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const local = readLocal();
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/leaderboard`);
      if (res.ok) {
        const data = (await res.json()) as { rows: LeaderboardRow[] };
        const merged = sortRows(dedupe([...(data.rows ?? []), ...local]));
        return {
          rows: merged,
          source: local.length > 0 ? "mixed" : "api",
        };
      }
    } catch {
      // fall through to local
    }
  }
  return { rows: sortRows(local), source: "local" };
}

export interface SubmitResult {
  ok: boolean;
  row: LeaderboardRow;
  source: "api" | "local";
}

export async function submitScore(
  submission: LeaderboardSubmission
): Promise<SubmitResult> {
  const row: LeaderboardRow = {
    handle: submission.handle,
    weeks_survived: Math.max(0, Math.floor(submission.weeksSurvived)),
    peak_headcount: Math.max(0, Math.floor(submission.peakHeadcount)),
    final_valuation: Math.max(0, Math.floor(submission.finalValuation)),
    created_at: Math.floor(Date.now() / 1000),
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/leaderboard`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission),
      });
      if (res.ok) {
        writeLocal(row);
        return { ok: true, row, source: "api" };
      }
    } catch {
      // fall through to local
    }
  }

  writeLocal(row);
  return { ok: true, row, source: "local" };
}
