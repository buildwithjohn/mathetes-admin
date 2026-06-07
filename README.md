# Mathetes Admin

Next.js 15 admin dashboard + marketing landing for Mathetes.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill from `supabase start` in ../mathetes-backend
npm run dev                  # http://localhost:3000
```

- `/` marketing landing ("Follow daily.")
- `/signin` admin sign-in (email + password)
- `/dashboard` and the other `(admin)` sections are gated by middleware and a
  role check (`pastor` / `admin`).

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next lint |

## Status

Phase 0 foundation: brand tokens, fonts, Supabase SSR wiring, auth middleware,
landing page, sign-in, and an admin shell with dashboard skeleton. Devotional
editor, Word of the Day composer, announcements, Ask Pastor, and the verse-image
API arrive in later phases (see the build plan).
