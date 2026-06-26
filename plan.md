# Routine — Skincare Routine Management App

A mobile-first app that helps users manage complex post-clinic skincare routines with smart scheduling, product mixing rules, and timely reminders via email and push notifications.

## Problem Domain

After visiting beauty clinics, patients often receive complex skincare regimens involving:
- **Multiple products** applied at different times of day (AM vs PM routines)
- **Specific application order** (thinnest-to-thickest rule: cleanser → toner → serum → moisturizer → sunscreen)
- **Mixing rules** — some products must be mixed before application, others must NEVER be combined (e.g., retinol + AHA/BHA = severe irritation)
- **Wait times** between product layers (~60 seconds per layer)
- **Post-procedure restrictions** — after laser/peeling, certain actives must be paused
- **Gradual introduction** — new products added one at a time over 3-4 week intervals

Users forget steps, apply products in the wrong order, or mix incompatible ingredients — potentially causing skin damage.

---

## User Review Required

> [!IMPORTANT]
> **Email Provider**: The plan uses **Resend** for transactional emails (reminders). This requires a Resend API key. Are you okay with Resend, or do you prefer another provider (SendGrid, Postmark)?

> [!IMPORTANT]
> **Database Hosting**: The app needs a PostgreSQL database. For Vercel deployment, options include:
> - **Vercel Postgres** (simplest, built-in)
> - **Supabase** (free tier, generous limits)
> - **Neon** (serverless PostgreSQL)
> Which do you prefer?

> [!WARNING]
> **Push Notifications**: Web Push requires VAPID keys and a Service Worker. This works on Android Chrome and desktop browsers, but **iOS Safari has limited support** (requires the site to be added to home screen as a PWA). Should we prioritize email reminders and make push notifications a secondary feature?

## Open Questions

1. **Multi-language**: Should the UI support both Indonesian and English, or English only?
2. **Clinic integration**: Should there be a "shared routine" feature where a clinic/dermatologist can create a routine template and share it with a patient via link?
3. **Product database**: Should we pre-populate a database of common skincare products/ingredients, or let users enter everything manually?

---

## Proposed Changes

### Tech Stack Overview

| Layer | Technology |
|:---|:---|
| Runtime | Bun |
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js v5 (Credentials provider, email/password) |
| UI | shadcn/ui + Tailwind CSS |
| Email | Resend (transactional emails) |
| Push | Web Push API + `web-push` library |
| Scheduling | Vercel Cron Jobs |
| Deployment | Vercel |

---

### 1. Project Scaffolding

#### [NEW] Project initialization

```bash
# Scaffold Next.js with Bun
bunx create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-bun

# Initialize shadcn
bunx shadcn@latest init

# Add shadcn components (will be run by user)
bunx shadcn@latest add button card dialog input label select tabs toast badge separator avatar dropdown-menu sheet calendar popover command switch scroll-area
```

---

### 2. Database Architecture (Prisma Schema)

#### [NEW] `prisma/schema.prisma`

The database is designed with **scalability, normalization, and extensibility** in mind. Key design principles:
- UUIDs as primary keys (globally unique, safe for distributed systems)
- Soft deletes via `deletedAt` where appropriate
- Compound indexes on hot query paths
- Separation of concerns: products, routines, schedules, and notifications are independent entities linked by foreign keys

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      User        │────▶│    Routine        │────▶│  RoutineStep     │
│                  │     │ (AM/PM/Custom)    │     │ (ordered steps)  │
│  - email         │     │ - name            │     │ - order          │
│  - password      │     │ - timeOfDay       │     │ - action         │
│  - timezone      │     │ - days[]          │     │ - waitTimeSec    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                                                  │
        │                                                  ▼
        │                                          ┌──────────────────┐
        │                                          │    Product       │
        │                                          │ - name           │
        │                                          │ - category       │
        │                                          │ - ingredients[]  │
        │                                          └──────────────────┘
        │
        ▼
┌──────────────────┐     ┌──────────────────┐
│ NotificationPref │     │ ReminderLog      │
│ - emailEnabled   │     │ - sentAt         │
│ - pushEnabled    │     │ - channel        │
│ - pushSubJson    │     │ - status         │
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ RoutineLog       │     │ IngredientConflict│
│ - completedAt    │     │ - ingredientA     │
│ - skipped?       │     │ - ingredientB     │
│ - notes          │     │ - severity        │
└──────────────────┘     └──────────────────┘
```

**Models:**

| Model | Purpose |
|:---|:---|
| `User` | Auth, profile, timezone, skin type |
| `Product` | Skincare products with category & ingredient list |
| `Routine` | Named routine container (e.g. "Morning Routine", "Post-Laser Recovery") |
| `RoutineStep` | Ordered step within a routine — links to product(s), has mixing instructions, wait time |
| `RoutineStepProduct` | Many-to-many join between step and products (for mixing multiple products in one step) |
| `Schedule` | When a routine runs — days of week, time, active date range |
| `RoutineLog` | Tracks completion/skipping of each step per day |
| `NotificationPreference` | User's notification settings (email on/off, push subscription JSON) |
| `ReminderLog` | Audit trail of sent reminders (for debugging & analytics) |
| `IngredientConflict` | Seed data: known ingredient incompatibilities (retinol + AHA, etc.) |

---

### 3. Authentication

#### [NEW] `src/auth.ts` — Auth.js configuration
#### [NEW] `src/app/api/auth/[...nextauth]/route.ts` — Route handler
#### [NEW] `src/app/(auth)/login/page.tsx` — Login page
#### [NEW] `src/app/(auth)/register/page.tsx` — Registration page
#### [NEW] `src/lib/auth-actions.ts` — Server actions for register/login

- **Credentials provider** with email + password
- **bcryptjs** for password hashing
- **JWT session strategy** (required for Credentials provider)
- **Zod** validation on both client and server
- Registration creates user in Prisma + default notification preferences
- Middleware protects `/dashboard/*` routes

---

### 4. Core Features & Pages

#### [NEW] `src/app/(dashboard)/dashboard/page.tsx` — Main Dashboard
- **Today's View**: Shows today's routines with a timeline view
- **Progress ring**: Visual completion percentage for the day
- **Quick actions**: Mark steps as done, skip, or snooze
- **Next up card**: Shows the next upcoming routine with countdown

#### [NEW] `src/app/(dashboard)/routines/page.tsx` — Routine Management
- List all routines with cards showing AM/PM/Custom tags
- Create new routine with step-by-step wizard
- Edit/delete routines
- Drag-and-drop step reordering

#### [NEW] `src/app/(dashboard)/routines/[id]/page.tsx` — Routine Detail
- Full step list with product details
- Mixing instructions highlighted
- Wait time indicators between steps
- Ingredient conflict warnings (real-time check)

#### [NEW] `src/app/(dashboard)/products/page.tsx` — Product Library
- Searchable product list
- Add products with category, brand, ingredients
- Ingredient conflict detection when adding to routines

#### [NEW] `src/app/(dashboard)/history/page.tsx` — History & Insights
- Calendar heatmap showing completion streaks
- Weekly/monthly adherence stats
- Missed routine patterns

#### [NEW] `src/app/(dashboard)/settings/page.tsx` — Settings
- Notification preferences (email/push toggle)
- Timezone selection
- Profile management
- Account deletion

#### [NEW] `src/app/(landing)/page.tsx` — Landing Page
- Beautiful, animated landing page explaining the app
- CTA to register/login

---

### 5. Notification System

#### [NEW] `src/app/api/cron/send-reminders/route.ts` — Cron endpoint
- Triggered by Vercel Cron every 5 minutes
- Queries users with routines due in the next 5-minute window
- Sends email via Resend and/or push via `web-push`
- Logs all attempts to `ReminderLog`

#### [NEW] `src/lib/notifications/email.ts` — Email service
- Beautiful HTML email template with routine steps
- Uses Resend API

#### [NEW] `src/lib/notifications/push.ts` — Push service
- VAPID key management
- Service worker registration on client
- Push subscription storage in DB

#### [NEW] `public/sw.js` — Service Worker
- Handles incoming push events
- Shows native notification with routine details

#### [NEW] `vercel.json` — Cron configuration
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

### 6. UI/UX Design System

**Design Language**: shadcn minimalist with a warm, calming skincare aesthetic

- **Color Palette**: Soft lavender/purple primary, warm neutrals, sage green accents
- **Typography**: Inter (clean, modern) via `next/font`
- **Dark Mode**: Full dark mode support via `next-themes`
- **Animations**: Framer Motion for page transitions, step completion celebrations
- **Mobile-first**: Bottom navigation bar, swipeable cards, large touch targets
- **Fun elements**: 
  - Confetti animation on completing a full routine
  - Streak counter with flame emoji 🔥
  - Gentle progress rings with gradient fills
  - Step completion checkmarks with satisfying micro-animations

---

### 7. Production Database Migration Pipeline

#### [NEW] `prisma/migrations/` — Auto-generated by Prisma

#### [MODIFY] `package.json` — Add scripts
```json
{
  "scripts": {
    "db:generate": "bunx prisma generate",
    "db:migrate:dev": "bunx prisma migrate dev",
    "db:migrate:prod": "bunx prisma migrate deploy",
    "db:push": "bunx prisma db push",
    "db:seed": "bunx prisma db seed",
    "db:studio": "bunx prisma studio",
    "postinstall": "bunx prisma generate"
  }
}
```

**Production workflow:**
1. Developer runs `bun run db:migrate:dev` locally to create migration files
2. Migration files are committed to git
3. On Vercel deploy, `postinstall` runs `prisma generate`
4. Production migration: `bun run db:migrate:prod` (runs `prisma migrate deploy` — applies pending migrations without interactivity)

#### [NEW] `prisma/seed.ts` — Seed data
- Pre-populate `IngredientConflict` table with known incompatibilities
- Sample product categories

---

### 8. File Structure Overview

```
Routines/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── sw.js                          # Service worker for push
├── src/
│   ├── auth.ts                        # Auth.js config
│   ├── middleware.ts                   # Route protection
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with providers
│   │   ├── (landing)/
│   │   │   └── page.tsx               # Landing page
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Dashboard layout + nav
│   │   │   ├── dashboard/page.tsx     # Today's view
│   │   │   ├── routines/
│   │   │   │   ├── page.tsx           # All routines
│   │   │   │   ├── new/page.tsx       # Create routine wizard
│   │   │   │   └── [id]/page.tsx      # Routine detail
│   │   │   ├── products/page.tsx      # Product library
│   │   │   ├── history/page.tsx       # Streaks & history
│   │   │   └── settings/page.tsx      # Preferences
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── cron/
│   │           └── send-reminders/route.ts
│   ├── components/
│   │   ├── ui/                        # shadcn components
│   │   ├── dashboard/                 # Dashboard-specific
│   │   ├── routines/                  # Routine-specific
│   │   └── shared/                    # Shared components
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── auth-actions.ts            # Auth server actions
│   │   ├── utils.ts                   # Utility functions
│   │   ├── validations.ts            # Zod schemas
│   │   └── notifications/
│   │       ├── email.ts
│   │       └── push.ts
│   └── types/
│       └── index.ts                   # TypeScript types
├── vercel.json
├── .env.example
├── .env.local                         # Local env (gitignored)
└── package.json
```

---

## Verification Plan

### Automated Tests
```bash
# Type checking
bun run build

# Prisma schema validation  
bunx prisma validate

# Database migration dry-run
bunx prisma migrate dev --create-only
```

### Manual Verification
1. **Auth flow**: Register → Login → Protected dashboard access
2. **Routine CRUD**: Create routine with steps → Edit → Delete
3. **Product conflict detection**: Add conflicting ingredients → See warning
4. **Notification**: Trigger cron endpoint manually → Verify email/push delivery
5. **Mobile responsiveness**: Test on mobile viewport sizes
6. **Dark mode**: Toggle and verify all components
7. **Vercel deployment**: Deploy to staging, run `prisma migrate deploy`

---

## Dependencies to Install

```bash
# Core (will be set up by create-next-app)
# next, react, react-dom, typescript, tailwindcss, eslint

# Auth
bun add next-auth@beta bcryptjs
bun add -d @types/bcryptjs

# Database
bun add @prisma/client
bun add -d prisma

# UI (shadcn handles most, but we need these extras)
bun add framer-motion next-themes lucide-react
bun add zod

# Notifications
bun add resend web-push
bun add -d @types/web-push

# Date/time handling
bun add date-fns
```

> [!TIP]
> All dependencies will be listed in `package.json` — you just need to run `bun install` once after the project is scaffolded.
