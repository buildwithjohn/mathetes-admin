# Mathetes Admin

Next.js 15 admin dashboard for Mathetes. Used by Pastor Tunde Akinwale and his
content team to publish devotionals, schedule Word of the Day, respond to
ask-pastor questions, manage members, and view engagement. This repo also hosts
the marketing landing page at the root domain.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components by default)
- **Language:** TypeScript strict mode
- **Styling:** Tailwind CSS + shadcn/ui
- **Icons:** lucide-react
- **Editor:** TipTap (with custom verse-block extension)
- **Auth:** Supabase Auth (admin role-gated)
- **Database:** Supabase (via @supabase/ssr)
- **Image generation:** @vercel/og (verse images)
- **Forms:** React Hook Form + Zod

## Design System

Same brand as mobile. Tokens live in `tailwind.config.ts` and `globals.css`:
- Ink #1C1B1A, Parchment #F5F1EB, Copper #B87333, Oxblood #722F37
- Surfaces, border, and 7 house accent colors
- Fonts: Fraunces (display), Inter (body), Source Serif 4 (scripture)

Admin uses a denser, more utilitarian register than mobile (closer to Linear),
still on parchment + ink + copper.

## Project Structure

```
src/
  app/
    (public)/        Marketing landing
    (admin)/         Auth-gated dashboard (layout shell + sections)
      dashboard/
      devotionals/   word-of-day/  announcements/  members/  ask-pastor/  analytics/
    (auth)/signin/   Admin sign-in
    api/             verse-image/route.ts, moderate/route.ts
  components/        ui/ (shadcn), admin/, marketing/
  lib/
    supabase/        client.ts, server.ts, middleware.ts
    database.types.ts  (generated from backend)
  utils/
middleware.ts        Root auth middleware
```

## Conventions

- Server Components by default; `'use client'` only for interactivity.
- Server Actions for mutations where possible.
- TypeScript strict. No `any`.
- Tailwind + shadcn/ui; avoid custom CSS.
- lucide-react icons everywhere.
- Never use em-dashes in copy. Colons, commas, or rewrite.
- All DB access via Supabase server client with RLS-enforced policies.
- Roles gated by `user_profiles.role` ('pastor', 'admin', 'house_leader',
  'discipler', 'member'). Only pastor/admin reach `(admin)`.
- Confirmations on destructive actions. Forms validate with Zod client + server.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill from `supabase start`.
3. Regenerate types: `cd ../mathetes-backend && ./scripts/generate-types.sh`.
4. `npm run dev` then open http://localhost:3000.
5. To reach the dashboard, create an auth user and set `user_profiles.role` to
   `pastor` or `admin`.

## Reference

- ../mathetes-backend for schema and types
- ../mathetes-mobile/CLAUDE.md for shared brand tokens
