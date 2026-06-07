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

Phase 4 verse images:

- **`POST /api/verse-image`** generates a verse image with `next/og`. Body:
  `verseText`, `verseRef`, `theme` (`minimal` | `organic` | `bold`),
  `aspectRatio` (`square` 1080×1080 | `story` 1080×1920), `watermark`. A `GET`
  with the same query params is available for quick previews. Fraunces/Inter are
  loaded from Google Fonts at render time, with a graceful fallback. When
  `SUPABASE_SERVICE_ROLE_KEY` is set the PNG is cached to the public
  `verse-images` Storage bucket and a JSON `{ url }` is returned; otherwise the
  PNG bytes stream back directly. (The `verse_images` gallery insert lands once
  that backend table is migrated.)

Announcements, Ask Pastor, members, and analytics arrive in later phases (see
the build plan). Generated database types live in `src/lib/database.types.ts`;
regenerate from the backend after migrations.
