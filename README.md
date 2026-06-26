# 🧴 Routine — Smart Skincare Routine Manager

Never miss a step in your skincare routine. Manage complex post-clinic regimens with smart scheduling, ingredient conflict detection, and timely reminders.

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy environment variables
cp .env.example .env.local
# → Fill in DATABASE_URL and AUTH_SECRET at minimum

# 3. Generate AUTH_SECRET
bunx auth secret

# 4. Set up database (requires running PostgreSQL)
bun run db:migrate:dev

# 5. Seed ingredient conflict data
bun run db:seed

# 6. Start development server
bun dev
```

## Production Deployment (Vercel)

```bash
# 1. Push code to GitHub

# 2. Connect to Vercel
# 3. Set environment variables in Vercel dashboard
# 4. Run migration on production database:
bun run db:migrate:prod
```

## Tech Stack

| Layer | Technology |
|:---|:---|
| Runtime | Bun |
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL + Prisma |
| Auth | Auth.js v5 (email/password) |
| UI | shadcn/ui + Tailwind CSS |
| Email | Resend |
| Push | Web Push API |
| Deploy | Vercel |
