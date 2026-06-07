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
landing page, sign-in, and an admin shell.

Phase 2 content authoring:

- **Devotionals** (`/devotionals`): list with status/series filters, TipTap
  rich-text editor with a Scripture (verse) block, scripture references,
  auto-calculated reading time, series creation, draft autosave (30s), unsaved
  changes guard, a live mobile preview, and schedule / publish / delete.
- **Word of the Day** (`/word-of-day`): a 3-month calendar with per-day status,
  a side-sheet composer (verse reference, text, reflection, prompt), duplicate
  protection per date, and a mobile preview.
- **Dashboard** reads live Word of the Day and devotional counts.

Announcements, Ask Pastor, members, analytics, and the verse-image API arrive in
later phases (see the build plan). Generated database types live in
`src/lib/database.types.ts`; regenerate from the backend after migrations.
