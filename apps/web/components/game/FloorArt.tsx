"use client";

import { memo } from "react";
import { getMap, getRoomRects, type RoomKind } from "@/lib/game/map";
import type { RoundId } from "@/lib/game/state";

interface FloorArtProps {
  round: RoundId;
}

const ROOM_FILL: Record<RoomKind, string> = {
  hire: "#2a1d08",
  vc: "#0c2418",
  dashboard: "#0c1b2e",
  coffee: "#1f140b",
  lounge: "#1b1424",
  lab: "#0f1d22",
  allhands: "#211018",
};

const ROOM_ACCENT: Record<RoomKind, string> = {
  hire: "#5b3f0e",
  vc: "#1c5a3c",
  dashboard: "#1c3e66",
  coffee: "#553a1e",
  lounge: "#4a3566",
  lab: "#2a5566",
  allhands: "#5a2846",
};

const ROOM_GLOW: Record<RoomKind, string> = {
  hire: "rgba(251, 191, 36, 0.22)",
  vc: "rgba(52, 211, 153, 0.22)",
  dashboard: "rgba(56, 189, 248, 0.22)",
  coffee: "rgba(217, 119, 6, 0.22)",
  lounge: "rgba(168, 85, 247, 0.14)",
  lab: "rgba(45, 212, 191, 0.14)",
  allhands: "rgba(244, 114, 182, 0.14)",
};

function Furniture({
  room,
}: {
  room: { x: number; y: number; w: number; h: number; kind: RoomKind };
}) {
  const { x, y, w, h, kind } = room;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const accent = ROOM_ACCENT[kind];

  switch (kind) {
    case "hire":
      // two stacks of coins
      return (
        <g opacity="0.55" fill={accent}>
          <rect x={x + 1.2} y={cy - 0.15} width={w - 2.4} height={0.18} rx={0.08} />
          <circle cx={x + 1.5} cy={cy + 0.35} r={0.22} />
          <circle cx={x + w - 1.5} cy={cy + 0.35} r={0.22} />
        </g>
      );
    case "vc":
      // dollar sign silhouette
      return (
        <g opacity="0.5" fill={accent}>
          <rect x={cx - 0.1} y={y + 0.6} width={0.2} height={h - 1.2} rx={0.08} />
          <rect x={cx - 1} y={y + 0.9} width={2} height={0.22} rx={0.08} />
          <rect x={cx - 1} y={cy + 0.2} width={2} height={0.22} rx={0.08} />
        </g>
      );
    case "dashboard":
      // tiny sparkline
      return (
        <g opacity="0.55" stroke={accent} strokeWidth="0.12" fill="none">
          <polyline
            points={`${x + 1},${y + h - 1} ${cx - 1},${cy + 0.2} ${cx},${cy - 0.1} ${cx + 1.2},${y + 1} ${x + w - 1},${cy - 0.2}`}
          />
          <line x1={x + 0.8} y1={y + h - 0.4} x2={x + w - 0.8} y2={y + h - 0.4} opacity="0.6" />
        </g>
      );
    case "coffee":
      // cup + steam
      return (
        <g opacity="0.55" fill={accent}>
          <rect x={cx - 0.4} y={cy - 0.1} width={0.8} height={0.5} rx={0.12} />
          <path
            d={`M${cx - 0.15},${cy - 0.35} q0.1,-0.15 0,-0.3 q-0.1,-0.15 0,-0.3`}
            fill="none"
            stroke={accent}
            strokeWidth="0.08"
          />
        </g>
      );
    case "lounge":
      // couch
      return (
        <g opacity="0.5" fill={accent}>
          <rect x={x + 1} y={cy - 0.1} width={w - 2} height={0.35} rx={0.12} />
          <rect x={x + 1} y={cy - 0.3} width={0.3} height={0.4} rx={0.1} />
          <rect x={x + w - 1.3} y={cy - 0.3} width={0.3} height={0.4} rx={0.1} />
        </g>
      );
    case "lab":
      // flask
      return (
        <g opacity="0.55" fill={accent}>
          <path d={`M${cx - 0.3},${cy - 0.4} L${cx - 0.3},${cy} L${cx - 0.6},${cy + 0.4} L${cx + 0.6},${cy + 0.4} L${cx + 0.3},${cy} L${cx + 0.3},${cy - 0.4} Z`} />
        </g>
      );
    case "allhands":
      // row of tiny heads
      return (
        <g opacity="0.55" fill={accent}>
          {Array.from({ length: Math.min(5, Math.floor(w - 2)) }).map((_, i) => (
            <circle key={i} cx={x + 1.5 + i * 1.1} cy={cy + 0.1} r={0.22} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function FloorArtImpl({ round }: FloorArtProps) {
  const map = getMap(round);
  const rooms = getRoomRects(round);
  // Floor wash covers the whole interior (inside the outer walls) so the
  // walkable area is visually clear — not just the original officeBounds.
  const floorX = 1;
  const floorY = 1;
  const floorW = map.width - 2;
  const floorH = map.height - 2;

  return (
    <svg
      className="floor-art"
      viewBox={`0 0 ${map.width} ${map.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="floorDots"
          patternUnits="userSpaceOnUse"
          width="1"
          height="1"
          patternTransform="translate(0.5 0.5)"
        >
          <circle cx="0" cy="0" r="0.06" fill="#1e293b" opacity="0.6" />
        </pattern>
        {rooms.map((r) => (
          <radialGradient
            key={`rg-${r.kind}-${r.x}-${r.y}`}
            id={`glow-${r.kind}-${r.x}-${r.y}`}
            cx="50%"
            cy="50%"
            r="60%"
          >
            <stop offset="0%" stopColor={ROOM_GLOW[r.kind]} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        ))}
      </defs>

      {/* Office floor wash + dot pattern */}
      <rect x={floorX} y={floorY} width={floorW} height={floorH} fill="#0a1322" />
      <rect
        x={floorX}
        y={floorY}
        width={floorW}
        height={floorH}
        fill="url(#floorDots)"
      />

      {/* Per-room fills + accents + furniture */}
      {rooms.map((r) => (
        <g key={`room-${r.kind}-${r.x}-${r.y}`}>
          {/* Inner fill (inset by 1 so it doesn't paint over the ASCII walls) */}
          <rect
            x={r.x + 0.5}
            y={r.y + 0.5}
            width={r.w - 1}
            height={r.h - 1}
            fill={ROOM_FILL[r.kind]}
            rx={0.25}
          />
          {/* Accent stripe along top inside edge */}
          <rect
            x={r.x + 1}
            y={r.y + 1}
            width={r.w - 2}
            height={0.08}
            fill={ROOM_ACCENT[r.kind]}
            opacity={0.6}
          />
          {/* Door halo */}
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={`url(#glow-${r.kind}-${r.x}-${r.y})`}
          />
          <Furniture room={r} />
        </g>
      ))}
    </svg>
  );
}

export const FloorArt = memo(FloorArtImpl);
