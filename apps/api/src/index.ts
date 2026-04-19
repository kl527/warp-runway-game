import { Hono } from "hono";
import { cors } from "hono/cors";
import type {
  LeaderboardListResponse,
  LeaderboardSubmission,
} from "@warp/shared";

type Bindings = {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  const origin = c.env.ALLOWED_ORIGIN ?? "*";
  return cors({
    origin,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type"],
  })(c, next);
});

function sanitizeHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().slice(0, 24);
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9_\-@.]+$/.test(trimmed)) return null;
  return trimmed;
}

app.get("/leaderboard", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT handle, weeks_survived, peak_headcount, final_valuation, created_at FROM leaderboard ORDER BY weeks_survived DESC, final_valuation DESC LIMIT 20"
  ).all();
  const body: LeaderboardListResponse = {
    rows: (rows.results ?? []) as LeaderboardListResponse["rows"],
  };
  return c.json(body);
});

app.post("/leaderboard", async (c) => {
  const body = (await c.req
    .json()
    .catch(() => null)) as Partial<LeaderboardSubmission> | null;
  if (!body) return c.json({ error: "Invalid JSON" }, 400);

  const handle = sanitizeHandle(body.handle);
  if (!handle) return c.json({ error: "Invalid handle" }, 400);

  const weeks = Number(body.weeksSurvived);
  const head = Number(body.peakHeadcount);
  const val = Number(body.finalValuation);
  if (!Number.isFinite(weeks) || !Number.isFinite(head) || !Number.isFinite(val)) {
    return c.json({ error: "Invalid numbers" }, 400);
  }

  await c.env.DB.prepare(
    "INSERT INTO leaderboard (handle, weeks_survived, peak_headcount, final_valuation) VALUES (?, ?, ?, ?)"
  )
    .bind(
      handle,
      Math.max(0, Math.floor(weeks)),
      Math.max(0, Math.floor(head)),
      Math.max(0, Math.floor(val))
    )
    .run();

  return c.json({ ok: true });
});

export default app;
