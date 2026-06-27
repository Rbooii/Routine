# Routine — Skincare Routine Management App (Updated Plan)

A mobile-first app that helps users manage complex post-clinic skincare routines with smart scheduling, product mixing rules, and timely reminders — now redesigned around a calm, minimalist "Apple Health / calorie-tracker" visual language, with a refreshed, current tech stack and a genuinely free reminder-scheduling setup.

## What changed from the previous plan

| Area | Before | Now | Why |
|:---|:---|:---|:---|
| ORM | Prisma | **Drizzle ORM** (Prisma 7 noted as alt) | Lighter, no codegen step, native fit for Vercel serverless + Neon/Supabase, the 2026 default for new edge-friendly Next.js apps |
| Auth | Auth.js v5 (NextAuth) | **Better Auth** | Auth.js's own maintainers now point new projects to Better Auth; built-in rate limiting, 2FA-ready, no separate adapter wiring |
| Cron | "External pinger / Vercel Cron daily fallback" (vague) | **QStash (Upstash)** as primary, **cron-job.org** as zero-setup fallback | Vercel Hobby cron only fires once a day — not enough for a 5-minute reminder window. QStash's free tier comfortably covers this with retries built in |
| CSS | Tailwind CSS (v3-era assumptions) | **Tailwind CSS v4.3** | CSS-first config, no `tailwind.config.js`, faster builds, native with Bun |
| Framework | Next.js 15 | **Next.js 16** | Turbopack is now the default bundler, async-only request APIs, `proxy.ts` replaces `middleware.ts`, Node 20+ required |
| Design language | "Warm lavender, sage accents, confetti + flame streaks" | **Minimalist, Apple Health-inspired**: rings, big numerals, calm neutral palette, single accent color | Matches the requested vibe — quieter, data-forward, less "gamified," more like a daily vitals dashboard than a confetti party |

---

## User Review Required

> [!IMPORTANT]
> **Email Provider**: Still recommending **Resend** for transactional reminder emails — it remains the simplest DX for Next.js/Vercel and has a workable free tier (100 emails/day, 3,000/month on Free). SendGrid and Postmark are fine alternatives if you already have an account with either. Confirm Resend is okay, or name a preference.

> [!IMPORTANT]
> **Database Hosting**: Choose one —
> - **Neon** (recommended default): pure serverless Postgres, true scale-to-zero, generous free compute (100 CU-hrs/month), instant branching for preview deploys. Best if you just want Postgres + Drizzle.
> - **Supabase**: bundles Postgres + auth + storage + realtime in one dashboard. 500 MB DB free, but the project **pauses after 7 days of inactivity** unless something pings it (our reminder cron will actually keep it warm, so this is less of a problem for us than for a typical side project).
> Which do you prefer?

> [!IMPORTANT]
> **Reminder Scheduling**: Since the reminder logic needs ~5-minute granularity (not once-a-day), and Vercel's Hobby-plan cron only supports daily triggers, the plan now uses **QStash** (Upstash) to call our `/api/cron/send-reminders` endpoint every 5 minutes. QStash's free tier (1,000 messages/day, built-in retries, no card required) comfortably covers 288 calls/day. If you'd rather avoid adding Upstash as a dependency, **cron-job.org** is a zero-code fallback that does the same job with a slightly less polished retry story. See the "Free Scheduling Options" section below for the full comparison.

> [!WARNING]
> **Push Notifications**: Web Push still requires VAPID keys + a Service Worker. Works well on Android Chrome and desktop browsers. **iOS Safari only delivers push to PWAs added to the home screen** — this hasn't changed. Should email stay the primary, guaranteed channel, with push as a "nice to have" for users who install the PWA?

## Open Questions

1. **Multi-language**: Indonesian + English, or English only?
2. **Clinic integration**: A "shared routine" feature where a dermatologist creates a routine template and shares it via link?
3. **Product database**: Pre-populate common skincare products/ingredients, or fully manual entry?

---

## Proposed Changes

### Tech Stack Overview

| Layer | Technology | Notes |
|:---|:---|:---|
| Runtime | **Bun** | Native Tailwind v4 + TS support, fast installs |
| Framework | **Next.js 16** (App Router, Turbopack default) | Node 20+ required; `proxy.ts` replaces `middleware.ts`; async-only `cookies()`/`headers()` |
| Database | **PostgreSQL** | Hosted on Neon (recommended) or Supabase |
| ORM | **Drizzle ORM** + Drizzle Kit | Schema-as-TypeScript, no generation step, tiny bundle (good for Vercel serverless cold starts) |
| Auth | **Better Auth** | Email/password out of the box, built-in rate limiting, easy to bolt on passkeys/2FA later if needed |
| UI | **shadcn/ui** + **Tailwind CSS v4.3** | CSS-first `@theme` config instead of `tailwind.config.js` |
| Email | **Resend** | Transactional reminder emails, custom domain support |
| Push | **Web Push API** + `web-push` | VAPID keys, Service Worker — email remains the reliable fallback channel |
| Scheduling | **QStash** (primary) or **cron-job.org** (zero-setup fallback) | See dedicated section below |
| Deployment | **Vercel** | |

---

### Free Scheduling Options — Why QStash

The original plan said "external cron pinger, daily fallback" without really solving the 5-minute-granularity problem. Here's the actual comparison:

| Option | Free tier | Granularity | Retries | Setup effort |
|:---|:---|:---|:---|:---|
| **Vercel Cron (Hobby)** | Included | **Once/day max**, can run up to 59 min late | None — failures just disappear from logs after 1 hr | Lowest (just `vercel.json`) |
| **Vercel Cron (Pro)** | $20/mo plan | Once/minute | None | Lowest |
| **QStash (Upstash)** ✅ recommended | 1,000 messages/day free, no card required | Any interval via cron expression (we'll use every 5 min ≈ 288 calls/day) | ✅ Automatic, free, with dead-letter queue | Low — one schedule, one signing-secret env var |
| **cron-job.org** | Free, unlimited basic jobs | Down to 1 minute | Email alert on failure only | Lowest — just paste a URL |
| **GitHub Actions (scheduled workflow)** | 2,000 free min/month on *private* repos, unlimited on *public* repos | Any interval, but GitHub queues/delays cron jobs under load (can drift 5–15 min) | None built-in | Medium — needs a workflow YAML + repo secret |

**Recommendation:** QStash as the primary scheduler — it's purpose-built for exactly this ("hit my serverless endpoint on a schedule, retry on failure, don't lose messages"), and a 5-minute interval keeps us well inside the free 1,000 messages/day quota. `cron-job.org` is kept as a one-line fallback if you'd rather not add another account/dependency.

Because external schedulers can drift by a few minutes, the cron endpoint itself queries a small window (e.g. "routines due in the last 2 minutes through the next 6 minutes") rather than matching an exact timestamp, so a late trigger still finds and sends the right reminders.

#### [NEW] QStash schedule (set up once via Upstash console or CLI)
```bash
curl -X POST https://qstash.upstash.io/v2/schedules/https://yourapp.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cron": "*/5 * * * *"}'
```

#### [NEW] `src/app/api/cron/send-reminders/route.ts`
- Verifies the `Upstash-Signature` header using `@upstash/qstash`'s `verifySignature` helper (rejects unsigned requests)
- Queries routines due in the current ±window
- Sends email via Resend and/or push via `web-push`
- Logs every attempt to `ReminderLog`

#### [FALLBACK] `vercel.json` — kept as a once-daily safety net (e.g. a digest email) in case QStash has an outage
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-digest",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

### 1. Project Scaffolding

```bash
# Scaffold Next.js 16 with Bun
bunx create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-bun

# Initialize shadcn (Tailwind v4-aware)
bunx shadcn@latest init

# Add shadcn components
bunx shadcn@latest add button card dialog input label select tabs toast badge separator avatar dropdown-menu sheet calendar popover command switch scroll-area progress
```

---

### 2. Database Architecture (Drizzle Schema)

#### [NEW] `src/db/schema.ts`

Design principles carried over from the original plan: UUID primary keys, soft deletes via `deletedAt`, compound indexes on hot query paths, and clear separation between products, routines, schedules, and notifications.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      users        │────▶│    routines       │────▶│  routine_steps   │
│                  │     │ (AM/PM/Custom)    │     │ (ordered steps)  │
│  - email         │     │ - name            │     │ - order          │
│  - passwordHash  │     │ - timeOfDay       │     │ - action         │
│  - timezone      │     │ - days[]          │     │ - waitTimeSec    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                                                  │
        │                                                  ▼
        │                                          ┌──────────────────┐
        │                                          │    products      │
        │                                          │ - name           │
        │                                          │ - category       │
        │                                          │ - ingredients[]  │
        │                                          └──────────────────┘
        │
        ▼
┌──────────────────┐     ┌──────────────────┐
│ notification_prefs│     │ reminder_logs    │
│ - emailEnabled   │     │ - sentAt         │
│ - pushEnabled    │     │ - channel        │
│ - pushSubJson    │     │ - status         │
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ routine_logs     │     │ ingredient_conflicts│
│ - completedAt    │     │ - ingredientA     │
│ - skipped?       │     │ - ingredientB     │
│ - notes          │     │ - severity        │
└──────────────────┘     └──────────────────┘
```

**Tables:**

| Table | Purpose |
|:---|:---|
| `users` | Auth, profile, timezone, skin type |
| `products` | Skincare products with category & ingredient list |
| `routines` | Named routine container (e.g. "Morning Routine", "Post-Laser Recovery") |
| `routine_steps` | Ordered step within a routine — mixing instructions, wait time |
| `routine_step_products` | Many-to-many join between step and products (for mixing multiple products in one step) |
| `schedules` | When a routine runs — days of week, time, active date range |
| `routine_logs` | Tracks completion/skipping of each step per day |
| `notification_prefs` | User's notification settings (email on/off, push subscription JSON) |
| `reminder_logs` | Audit trail of sent reminders (debugging & analytics) |
| `ingredient_conflicts` | Seed data: known ingredient incompatibilities (retinol + AHA, etc.) |

#### [NEW] `drizzle.config.ts`
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

#### [NEW] `src/db/index.ts` — Drizzle client singleton (Neon serverless driver)
```ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });
```

---

### 3. Authentication (Better Auth)

#### [NEW] `src/lib/auth.ts` — Better Auth server config
#### [NEW] `src/app/api/auth/[...all]/route.ts` — Route handler
#### [NEW] `src/lib/auth-client.ts` — Client-side hooks (`useSession`, `signIn`, `signOut`)
#### [NEW] `src/app/(auth)/login/page.tsx`
#### [NEW] `src/app/(auth)/register/page.tsx`

- Email + password via Better Auth's built-in credential provider (password hashing, rate limiting, and session management handled internally — no separate `bcryptjs` wiring needed)
- Database sessions (stored in Postgres via the Drizzle adapter) rather than JWT-only, so sessions can be revoked immediately
- Zod validation on both client and server
- Registration creates user + default `notification_prefs` row
- `src/proxy.ts` (replaces the old `middleware.ts` naming in Next.js 16) protects `/dashboard/*` routes

---

### 4. Core Features & Pages

*(Unchanged in scope from the original plan — see design system below for the visual rework.)*

#### [NEW] `src/app/(dashboard)/dashboard/page.tsx` — Today
- Today's routines as a vertical timeline
- A single large **completion ring** (Apple Health–style) showing % of today's steps done
- "Next up" card with countdown to the next scheduled step
- Tap to mark done / skip / snooze

#### [NEW] `src/app/(dashboard)/routines/page.tsx` — Routines
- Routine list with AM/PM/Custom tags
- Create/edit via step-by-step wizard
- Drag-and-drop step reordering

#### [NEW] `src/app/(dashboard)/routines/[id]/page.tsx` — Routine Detail
- Full step list with product details
- Mixing instructions and wait-time indicators
- Real-time ingredient conflict warnings

#### [NEW] `src/app/(dashboard)/products/page.tsx` — Product Library
- Searchable product list, add with category/brand/ingredients
- Conflict detection when adding to a routine

#### [NEW] `src/app/(dashboard)/history/page.tsx` — History
- Calendar heatmap of completion streaks
- Weekly/monthly adherence stats as simple bar charts
- Missed-routine patterns

#### [NEW] `src/app/(dashboard)/settings/page.tsx`
- Notification preferences, timezone, profile, account deletion

#### [NEW] `src/app/(landing)/page.tsx`
- Calm, minimal landing page; CTA to register/login

---

### 5. Notification System

#### [NEW] `src/app/api/cron/send-reminders/route.ts` — called by QStash every 5 minutes
- Verifies QStash signature
- Queries users with routines due in the current window
- Sends email via Resend and/or push via `web-push`
- Logs all attempts to `reminder_logs`

#### [NEW] `src/lib/notifications/email.ts` — Resend service, plain/minimal HTML template matching the in-app design
#### [NEW] `src/lib/notifications/push.ts` — VAPID key management, subscription storage
#### [NEW] `public/sw.js` — Service worker handling incoming push events

---

### 6. UI/UX Design System — Minimalist, Apple Health–Inspired

This is the biggest change from the original plan. Instead of a "warm skincare" aesthetic with confetti and flame-emoji streaks, the app should feel like a **calm daily vitals dashboard** — closer to Apple Health, Apple Fitness, or a clean calorie tracker (think Cronometer's cleaner screens, or Simple) than a beauty-brand app.

**Core principles:**
- **Whitespace-first.** Generous padding, few borders, separation by spacing rather than dividers.
- **One accent color, used sparingly.** A single calm accent (e.g. a muted teal or soft indigo) reserved for progress indicators and primary actions; everything else is near-black text on off-white (light mode) / near-white text on near-black (dark mode).
- **Numbers are the hero.** Large, tabular numerals for streaks, completion %, and step counts — the way Apple Health leads with "8,492 steps" or a calorie tracker leads with "1,840 kcal remaining."
- **Rings over bars.** The daily completion indicator is a circular progress ring (AM ring + PM ring, like Apple Health's activity rings), not a linear progress bar or a confetti burst. Completing a ring gives a single, quiet animation (a gentle fill + soft haptic-style pulse) — not a screen-covering celebration.
- **Cards, not lists with dividers.** Each routine/step is a rounded card with a soft, low-opacity shadow (elevation, not borders) — same pattern as a calorie tracker's "today's meals" cards.
- **Quiet streaks.** Replace the flame emoji + big confetti with a simple numeral + small ring segment, consistent with the rest of the UI (a streak is just another number, not a different visual language).

**Typography:** Inter or a similar geometric sans, via `next/font`, with large tabular-number weights for stats.

**Color:** Neutral grayscale base (`gray-50` → `gray-900`) + one accent scale (e.g. teal). Dark mode via `next-themes`, with the same restraint — no accent color changes between modes, just inverted neutrals.

**Navigation:** Bottom tab bar (Today / Routines / Products / History / Settings) — large tap targets, icon + label, active tab indicated by the accent color only (no background pill).

**Animation:** Framer Motion, used minimally — ring fill on completion, gentle page-transition fades. No bouncing, no screen-wide confetti. The one moment of delight is reserved for completing *all* of today's steps: a brief, soft ring-glow rather than a particle effect.

**Component examples:**
- "Today" screen ≈ Apple Health's "Summary" tab: one big ring at the top, stat cards below
- Routine step card ≈ a calorie tracker's "meal" row: icon, name, secondary detail, checkmark on the right
- History ≈ Apple Health's trends charts: simple bar/line charts, no heavy gridlines

---

### 7. Production Database Migration Pipeline (Drizzle)

#### [MODIFY] `package.json` — scripts
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run src/db/seed.ts"
  }
}
```

**Production workflow:**
1. Developer runs `bun run db:generate` locally after editing `src/db/schema.ts` — produces a SQL migration file
2. Migration files are committed to git
3. On Vercel deploy, a build-step (or manual `bun run db:migrate`) applies pending migrations
4. No codegen step needed for the client itself — types update as soon as the schema file is saved

#### [NEW] `src/db/seed.ts`
- Pre-populates `ingredient_conflicts` with known incompatibilities (retinol + AHA/BHA, vitamin C + niacinamide caveats, etc.)
- Sample product categories

---

### 8. File Structure Overview

```
Routines/
├── drizzle/
│   └── migrations/
├── public/
│   └── sw.js
├── src/
│   ├── proxy.ts                       # Route protection (Next.js 16 naming)
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts                   # Drizzle client singleton
│   │   └── seed.ts
│   ├── lib/
│   │   ├── auth.ts                    # Better Auth server config
│   │   ├── auth-client.ts             # Better Auth client hooks
│   │   ├── utils.ts
│   │   ├── validations.ts             # Zod schemas
│   │   └── notifications/
│   │       ├── email.ts
│   │       └── push.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (landing)/page.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Bottom tab nav
│   │   │   ├── dashboard/page.tsx     # Today
│   │   │   ├── routines/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...all]/route.ts
│   │       └── cron/
│   │           ├── send-reminders/route.ts   # called by QStash every 5 min
│   │           └── daily-digest/route.ts     # called by Vercel Cron (fallback)
│   ├── components/
│   │   ├── ui/                        # shadcn components
│   │   ├── dashboard/
│   │   ├── routines/
│   │   └── shared/
│   └── types/
│       └── index.ts
├── drizzle.config.ts
├── vercel.json
├── .env.example
├── .env.local
└── package.json
```

---

## Verification Plan

### Automated Tests
```bash
# Type checking + build
bun run build

# Drizzle schema check
bunx drizzle-kit check

# Migration dry-run
bunx drizzle-kit generate --dry-run
```

### Manual Verification
1. **Auth flow**: Register → Login → Protected dashboard access
2. **Routine CRUD**: Create routine with steps → Edit → Delete
3. **Product conflict detection**: Add conflicting ingredients → See warning
4. **Reminder delivery**: Trigger QStash schedule manually (or call the endpoint directly with a valid signature) → verify email/push delivery and a `reminder_logs` row
5. **Mobile responsiveness**: Test on mobile viewport sizes
6. **Dark mode**: Toggle and verify the neutral-+-single-accent palette holds up
7. **Vercel deployment**: Deploy to staging, run `bun run db:migrate`, confirm the QStash schedule hits the deployed URL

---

## Dependencies to Install

```bash
# Core (set up by create-next-app)
# next@16, react@19, react-dom@19, typescript, tailwindcss@4, eslint

# Auth
bun add better-auth

# Database
bun add drizzle-orm @neondatabase/serverless
bun add -d drizzle-kit

# UI
bun add framer-motion next-themes lucide-react recharts
bun add zod

# Notifications & scheduling
bun add resend web-push @upstash/qstash
bun add -d @types/web-push

# Date/time handling
bun add date-fns
```

> [!TIP]
> Drizzle needs no `generate`/`postinstall` codegen step for the client itself — only `drizzle-kit generate` when the schema changes, which produces a SQL migration file you commit to git.