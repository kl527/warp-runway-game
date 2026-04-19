import { NextRequest } from "next/server";
import satori from "satori";

// Fontsource mirror is stable and serves woff directly (no User-Agent gating
// like fonts.gstatic.com). We use Inter rather than JetBrains Mono here
// because OG cards read better in a proportional face.
const FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff";

let cachedFont: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  cachedFont = await res.arrayBuffer();
  return cachedFont;
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${Math.round(abs)}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "burned") as
    | "burned"
    | "unicorn"
    | "fired";
  const week = Number(url.searchParams.get("w") ?? 0);
  const headcount = Number(url.searchParams.get("h") ?? 0);
  const balance = Number(url.searchParams.get("b") ?? 0);
  const val = Number(url.searchParams.get("v") ?? 0);
  const epi =
    url.searchParams.get("e") ??
    `Burned ${fmt(balance)} hiring ${headcount} people in ${week} weeks.`;

  const font = await getFont();
  const accent =
    mode === "unicorn" ? "#e879f9" : mode === "fired" ? "#fbbf24" : "#f43f5e";
  const headline =
    mode === "unicorn" ? "UNICORN" : mode === "fired" ? "FIRED" : "R.I.P.";
  const bigNumber =
    mode === "unicorn" ? `$${(val / 1_000_000_000).toFixed(2)}B` : fmt(balance);
  const bigLabel = mode === "unicorn" ? "valuation" : "final balance";

  const svg = await satori(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#020617",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        padding: 56,
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 24, color: "#64748b", letterSpacing: 4 }}>
          WARP RUNWAY: THE GAME
        </div>
        <div style={{ fontSize: 28, color: "#fbbf24", fontWeight: 700 }}>
          WARP
        </div>
      </div>
      <div
        style={{
          marginTop: 32,
          fontSize: 88,
          fontWeight: 800,
          color: accent,
          letterSpacing: -2,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 36,
          color: "#f1f5f9",
          display: "flex",
        }}
      >
        {epi}
      </div>
      <div style={{ marginTop: "auto", display: "flex", gap: 40 }}>
        <StatBlock label="WEEKS" value={String(week)} />
        <StatBlock label="PEAK TEAM" value={String(headcount)} />
        <StatBlock label={bigLabel.toUpperCase()} value={bigNumber} />
      </div>
      <div
        style={{
          marginTop: 32,
          fontSize: 22,
          color: "#64748b",
          display: "flex",
        }}
      >
        warp.co/simulator
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: font,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  // Returning SVG. Upgrading to PNG requires wiring @resvg/resvg-wasm via a
  // wrangler wasm binding, which is out of scope for the initial build.
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=300",
    },
  });
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 20, color: "#64748b", letterSpacing: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 56, fontWeight: 700, color: "#f1f5f9" }}>
        {value}
      </div>
    </div>
  );
}
