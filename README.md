# Warp Runway: The Game

A keyboard-driven ASCII startup simulator. Survive the burn, hit the IPO, or die trying.

**Play it:** https://warp-runway-game-web.leed4219.workers.dev

## Tech stack

### Frontend (`apps/web/`)

- **Next.js 15** (App Router) with the React Compiler toggled off for now
- **React 19** + **TypeScript 5**
- **Tailwind CSS** for styling
- **Zustand** for game state
- **Framer Motion** for modal transitions
- **canvas-confetti** for the IPO celebration
- **use-sound** (Howler) for game audio
- **Satori** for rendered OG share cards
- Deployed on **Cloudflare Workers** via **OpenNext**

### Backend (`apps/api/`)

- **Cloudflare Workers** with the **Hono** framework
- **D1** (SQLite) for the leaderboard
- CORS-gated by `ALLOWED_ORIGIN` var
- Deployed via **Wrangler**

### Shared (`packages/shared/`)

- TypeScript types (`LeaderboardRow`, `LeaderboardSubmission`) imported by both workers via `@warp/shared`

### Monorepo

- **Bun workspaces** hoist a single `node_modules`; `packages/shared` is consumed via `workspace:*` links
- Two independently deployable Cloudflare Workers: `warp-runway-game-web` and `warp-runway-game-api`

## Development

```bash
# Install everything
bun install

# One-time: seed the local D1 database
cd apps/api && bun run d1:init

# Two terminals:
cd apps/api && bun run dev   # Hono worker on :8787
cd apps/web && bun run dev   # Next.js on :3000
```

The web app reads `NEXT_PUBLIC_API_URL` from `apps/web/.env.local` (copy from `.env.local.example`).

## Deployment

```bash
# API worker (fill in database_id + ALLOWED_ORIGIN in apps/api/wrangler.jsonc first)
cd apps/api && bun run deploy

# Web worker (set NEXT_PUBLIC_API_URL for prod first)
cd apps/web && bun run cf:deploy
```
