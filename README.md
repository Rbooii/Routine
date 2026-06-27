<div align="center">

# 🧴 Routine

**Never miss a step. Never mix the wrong things.**

A smart skincare routine manager for people on complex post-clinic regimens — AM/PM scheduling, automatic application-order enforcement, ingredient conflict detection, and reminders that actually arrive on time.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Bun](https://img.shields.io/badge/Bun-runtime-f9f1e1?logo=bun)](https://bun.sh)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle)](https://orm.drizzle.team)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#license)

</div>

---

## ✨ Why this exists

After a laser, peel, or derm visit, you don't get a skincare routine — you get an *instruction manual*: five products, a strict thinnest-to-thickest order, a 60-second wait between layers, and a strict warning that two of them will chemically fight each other if you layer them together. Then you're expected to remember all of it, every morning and night, for weeks.

**Routine** turns that instruction manual into something that actually reminds you, in order, on time — and stops you before you accidentally mix retinol with your AHA.

## 🪄 Features

- 🕐 **AM / PM / custom routines** — each with its own schedule and active date range
- 🔢 **Enforced application order** — cleanser → toner → serum → moisturizer → sunscreen, no skipping ahead
- ⚠️ **Real-time ingredient conflict warnings** — flags known bad pairings (retinol + AHA/BHA, etc.) the moment you build a routine
- ⏱️ **Built-in wait timers** between layers
- 🌿 **Gradual product introduction** — staggers new actives in over 3–4 week intervals instead of dumping them all in at once
- 🩹 **Post-procedure pause mode** — temporarily benches certain actives after laser/peel visits
- 🔔 **Reminders that land on time** — email always, push when installed as a PWA
- 📊 **Streaks & adherence history** — a calm, ring-based completion view (no confetti, just your actual progress)

## 🧱 Tech Stack

| Layer | Technology | Why |
|:---|:---|:---|
| Runtime | **Bun** | Fast installs, native TS, native Tailwind v4 support |
| Framework | **Next.js 16** (App Router, Turbopack) | Current stable; async-first data APIs |
| Database | **PostgreSQL** ([Neon](https://neon.tech)) | Serverless, scale-to-zero, generous free tier |
| ORM | **Drizzle ORM** | Schema lives in TypeScript, zero codegen step, tiny serverless bundle |
| Auth | **Better Auth** | Email/password with rate limiting and session revocation built in |
| UI | **shadcn/ui** + **Tailwind CSS v4** | CSS-first theming, no config file |
| Email | **Resend** | Transactional reminder emails |
| Push | **Web Push API** | VAPID + service worker, falls back to email on iOS |
| Scheduling | **QStash** | Free, retry-backed cron for serverless — see below |
| Deploy | **Vercel** | |

<details>
<summary><strong>💸 Runs entirely on free tiers</strong> (click to expand)</summary>

<br>

This stack was deliberately chosen so a real, production reminder app costs **$0/month** at hobby scale:

- **Neon** free plan: 100 compute-hours + 0.5 GB storage
- **QStash** free plan: 1,000 scheduled calls/day — a 5-minute reminder check uses ~288/day
- **Resend** free plan: 3,000 emails/month
- **Vercel** Hobby plan covers hosting + the daily-digest fallback cron

The one thing that *doesn't* work for free: Vercel's built-in Hobby cron only fires once a day, which is why reminders are scheduled through QStash instead.

</details>

## 🚀 Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy environment variables
cp .env.example .env.local
# → fill in DATABASE_URL at minimum

# 3. Generate an auth secret and add it to .env.local as BETTER_AUTH_SECRET
openssl rand -base64 32

# 4. Set up the database
bun run db:generate   # create migration files from the schema
bun run db:migrate    # apply them

# 5. Seed ingredient conflict data
bun run db:seed

# 6. Start the dev server
bun dev
```

Open [localhost:3000](http://localhost:3000) — you should land on the sign-up page.

## ☁️ Production Deployment (Vercel)

```bash
# 1. Push to GitHub, then import the repo in Vercel

# 2. Add environment variables in the Vercel dashboard
#    (DATABASE_URL, BETTER_AUTH_SECRET, RESEND_API_KEY, QSTASH_TOKEN, ...)

# 3. Apply migrations against the production database
bun run db:migrate

# 4. Point a QStash schedule at your deployed cron endpoint
curl -X POST https://qstash.upstash.io/v2/schedules/https://your-app.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cron": "*/5 * * * *"}'
```

## 🔑 Environment Variables

| Variable | Required | Description |
|:---|:---|:---|
| `DATABASE_URL` | ✅ | Postgres connection string (Neon/Supabase) |
| `BETTER_AUTH_SECRET` | ✅ | Random 32-byte secret for session signing |
| `RESEND_API_KEY` | ✅ | For sending reminder emails |
| `QSTASH_TOKEN` | ✅ | For scheduling the reminder cron |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Optional | Enables web push notifications |

See `.env.example` for the full list with descriptions.

## 📁 Project Structure

<details>
<summary>Click to expand</summary>

```
src/
├── proxy.ts                 # Route protection
├── db/                      # Drizzle schema, client, seed script
├── lib/
│   ├── auth.ts              # Better Auth config
│   └── notifications/       # Email + push senders
├── app/
│   ├── (landing)/
│   ├── (auth)/               # Login / register
│   ├── (dashboard)/           # Today / Routines / Products / History / Settings
│   └── api/
│       ├── auth/[...all]/
│       └── cron/send-reminders/   # Hit by QStash every 5 minutes
└── components/
```

</details>

## 🤝 Contributing

Issues and PRs welcome — this is an early-stage project, so expect some rough edges.

## 📄 License

MIT