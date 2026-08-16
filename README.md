# 🌱 GrowIt — habits that grow

A gamified habit tracker (PWA) where your consistency literally grows a plant.
Complete a habit → +XP. Skip days → it droops, wilts, then goes dormant (never dies — so you fix it, not quit).

## What's inside

- **Next.js 14 (App Router) + TypeScript + Tailwind** — fast, static landing + dynamic app.
- **Database (2 backends, auto-detected):**
  - **Supabase (Postgres)** — *production / Vercel*. Persistent hosted data, uses env vars.
  - **SQLite (better-sqlite3)** — *local dev fallback*. Runs with zero setup when Supabase env vars are absent.
- **Gamification engine** (`lib/plant.ts`):
  - 5 growth stages: Seed 🌰 → Sprout 🌱 → Sapling 🌿 → Blooming 🌳 → Golden Fruit 🌟.
  - XP per completion; stage thresholds (0/30/80/180/320).
  - **Loss aversion / wilting**: missed days → Droopy → Wilting → Dormant (recoverable, never dead).
  - Streak + best streak tracking.
- **Virality / share asset** (`/share`): a generated card with your plant + streak; downloadable PNG.
- **Landing page** with hero, live-growth demo, features, pricing.

---

## Quick start (local dev — uses SQLite, no setup)

**Fastest — one command, auto-opens the browser:**

```bash
./start.command        # starts server + opens http://localhost:3000
```

**On macOS, double-click it to launch:**

```bash
chmod +x start.command GrowIt.command   # run once
./GrowIt.command                        # or double-click GrowIt.command
```

**Or the manual way:**

```bash
npm install
npm run dev        # http://localhost:3000
```

The page **auto-reloads** when you save files (Next.js hot reload) — you never need to restart
the server or refresh manually while it's running.

**Skip `npm run dev` entirely with a shell alias** (add to `~/.zshrc`):

```bash
alias grow="cd ~/growit-source && npm run dev"
```

then just type `grow` in any terminal.

Database is created at `.data/growit.db` on first run.

---

## Use Supabase (hosted DB) for real deployment

**1. Create a Supabase project** → https://supabase.com (free tier)

**2. Run the schema** — open **SQL Editor**, paste `supabase/schema.sql`, run it. This creates
`profile`, `habits`, `completions` tables.

**3. Copy env vars** from `.env.example` into `.env.local` (dev) and into **Vercel → Project → Settings → Environment Variables** (prod):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

> **Security note:** the server uses the **service-role key** (bypasses RLS). Never expose it to the
> browser — keep it as a server-only env var. The tables have permissive RLS policies for single-user
> use; for multi-user you'd add Supabase Auth + user-scoped policies instead.

**4. Deploy to Vercel** (free):
- Push to GitHub → [vercel.com](https://vercel.com) → **Add New → Project** → import → **Deploy**.
- (or) `npm i -g vercel && vercel --prod`
- Set the two env vars above in Vercel.

The app automatically uses Supabase when the env vars are present, and falls back to SQLite locally.

## Routes

| Route | What it does |
|---|---|
| `/` | Marketing / landing page |
| `/app` | The garden + habit tracker (PWA `start_url`) |
| `/share` | Generated share card of your plant + streak |
| `GET /api/garden` | Garden state (xp, stage, streak, wilt, stats) |
| `GET/POST/DELETE /api/habits` | Manage habits |
| `POST /api/complete` | Complete / undo a habit (awards XP) |

## Architecture: DB layer

`lib/data.ts` is the single data interface (async). It dispatches to:

- `lib/supabase.ts` — client built from env vars (`isSupabaseConfigured`)
- `lib/db.ts` — SQLite fallback

All API routes + `lib/plant.ts` import only from `lib/data.ts`, so swapping backends never touches
business logic.

## Production notes

- **Notifications**: add a cron job (Vercel Cron or Inngest) that runs daily per user timezone to send
  Web Push (VAPID) + trigger the wilt transition — background JS is unreliable on phones.
- **Vulnerabilities**: `npm audit` flags the Next 14.x line broadly; `--force` jumps to a breaking v16.
  Upgrade when ready.
- **Share cards** are currently HTML→PNG in the browser. For production, generate server-side with
  `@vercel/og` (satori) + cache on Cloudinary, with auto re-crops for IG (1080×1350) / TikTok (1080×1920).