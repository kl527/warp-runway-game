# /play: Warp Runway, the Game

Part B of the Warp headcount takehome. A keyboard-driven ASCII startup simulator that is meant to be shared on Twitter when you either flame out or IPO.

## Design notes

### Architecture

- **Pure game logic in `lib/game/`**. The Zustand store in `lib/game/store.ts` is intentionally thin: every action delegates to a pure function in `logic.ts` that takes the old `GameState` and returns the new one. That makes the rules unit-testable and keeps the UI dumb.
- **Rendering does not touch game state**. Components subscribe to narrow selectors (`selectors.ts`) and use `useShallow` so only the relevant slice triggers a rerender.
- **The grid never fully rerenders**. `GameCanvas` produces a flat array of 1,200 `<Cell />`s keyed by coordinate. `Cell` is wrapped in `React.memo` keyed on `(char, kind)`. On a tick, only cells whose character or kind actually changed (player cell, a few employees) rerender. The container rerenders but the per-cell work is O(changed).
- **One tick loop, one key listener**. `GameShell` owns both. Tick interval is paused when any modal is open, `paused` is true, or the game is over.

### State (`lib/game/state.ts`)

Matches the spec shape: balance, employees, revenuePerWeek, morale, lastInteractionWeek, capTable, round, eventLog, paused, speed, gameOver, position, plus internal `modal`, `peakHeadcount`, `tickCount`, `history`, `rngSeed`.

### The tick (`logic.ts` → `tick`)

Each tick:

1. `week++`
2. Apply `balance -= weeklyBurn; balance += revenuePerWeek`
3. Every 2 ticks: `shuffleEmployees` picks a random adjacent walkable tile per employee, just for vibes.
4. Morale drifts toward 70 (baseline). Decays if no coffee visit in 5+ weeks.
5. 20% chance of `rollEvent` (weighted by `weight`, filtered by `minWeek` + optional `condition`).
6. Push a history point.
7. Check end states: `balance < 0` → burned, `valuation() >= $50M` → ipo.

All randomness goes through a seeded mulberry32 RNG for determinism (helpful for testing).

### Map (`map.ts`)

60-wide by 20-tall box-drawn grid. Four building door tiles are unique single-letter chars:

- `H` at (6, 4) - Hire Shop
- `V` at (19, 4) - VC Office
- `B` at (39, 4) - Dashboard
- `C` at (11, 18) - Coffee Machine

`kindAt(x, y)` resolves each tile to a `CellKind`. `isWalkable` allows floor and door tiles. Interaction looks at the player's position plus its 4 neighbors.

### Events (`events.ts`)

25 events. Each is `{ id, weight, minWeek, condition?, effect, message, tone? }`. Some (like `eng_poached`) open a `ChoiceModal` via `choice: { title, options, resolve }`.

The fourth-wall event `warp_fourth_wall` fires after week 5 and blames a missing Warp for your corrupted HR spreadsheet.

### Roles (`roles.ts`)

Six roles. `head_of_ops` is deliberately disabled with the tooltip "Or just use Warp. Seriously." linking to warp.co. The hire modal renders this with amber styling and no hire button.

### Fundraise (`canFundraise`, `fundraise`)

Three rounds, each gated on headcount + weekly revenue. Success dilutes founders multiplicatively and appends an investor to the cap table.

### End screen

On game over:

- **Burned**: ASCII tombstone, stats, Twitter intent URL (points at `/api/og?...` for card preview), leaderboard form that POSTs to `${NEXT_PUBLIC_API_URL}/leaderboard` (the Hono worker), and a Warp CTA.
- **IPO**: canvas-confetti burst (dynamic import to keep it out of the main bundle), same share + leaderboard + CTA.

### Sounds

`lib/game/sounds.ts` exposes a preloaded `sfx` singleton (Howl per id) with a `play(id)` method. Missing `.wav` files produce a Howler warning at runtime but do not throw, so the build is safe.

Two trigger paths:

1. **Click-driven** (component call site): `sfx.play("hire")` in `HireModal`, `sfx.play("cash")` in `FundraiseModal`, and `sfx.play("footstep")` in the `GameShell` movement keybinds.
2. **State-driven** (subscriber): `lib/game/useSoundEffects.ts` is mounted once in `GameShell`, diffs the Zustand store, and plays the right SFX on transitions — employee quits, yellow-flag alerts, easter-egg pickups, fundraise success/fail, modal open/close, terminal states (death/level_up), coffee interaction, and a log-tone fallback (`event_good`/`event_bad`) for events that don't map to a more specific sound.

Mute state is persisted in `localStorage` under `warp-runway:sfx-muted`. The HUD toggle (`SFX ON` / `SFX OFF`) uses `useSfxMuted()`.

Expected files in `public/sounds/`: `hire.wav`, `cash.wav`, `death.wav`, `level_up.wav`, `footstep.wav`, `coffee.wav`, `egg_pickup.wav`, `quit_alert.wav`, `quit_leave.wav`, `fundraise_success.wav`, `fundraise_fail.wav`, `event_good.wav`, `event_bad.wav`, `modal_open.wav`, `modal_close.wav`.

### Mobile

`GameShell` checks `window.innerWidth < 900` and renders `MobileBlock` instead. The game never mounts on narrow viewports.

### API

The backend is split across two Cloudflare Workers in a bun workspace monorepo:

**This app (`@warp/web`)**
- `GET /api/og?...` renders a 1200x630 PNG via Satori + Resvg WASM. Stateless, no DB.

**Leaderboard worker (`@warp/api`, in `apps/api/`)**
- `GET ${NEXT_PUBLIC_API_URL}/leaderboard` returns top 20 scores by weeks survived.
- `POST ${NEXT_PUBLIC_API_URL}/leaderboard` inserts `{handle, weeksSurvived, peakHeadcount, finalValuation}` into D1.
- Built with Hono, owns the D1 binding, enforces CORS via the `ALLOWED_ORIGIN` var.

Shared types (`LeaderboardRow`, `LeaderboardSubmission`) live in `packages/shared/`.

### Constraints honored

- No em dashes anywhere in code, comments, or copy.
- Game logic is pure and testable.
- Grid cells are individually memoized.
- Narrow viewports see a desktop-only screen.
