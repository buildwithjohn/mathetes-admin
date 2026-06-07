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
  PNG bytes stream back directly. (The `verse_images` gallery table exists in
  the backend as migration 0011; the gallery insert is wired once the request
  carries the requesting user's id.)

Phase 6 admin (Announcements + Ask Pastor):

- **Announcements** (`/announcements`): list, plus a composer with rich-text
  body, an Event/Urgent banner, optional event details (date, time, location),
  photo URLs, a mobile preview, and draft / schedule / post-now / delete.
- **Ask Pastor** (`/ask-pastor`): question queue with awaiting / answered /
  public / private filters, urgency ordering, and a detail view to respond
  either publicly (anonymized to the public Q&A) or privately to the asker.
- **Dashboard** now also shows the awaiting Ask Pastor count.

> These features map to backend tables that now exist in `../mathetes-backend`:
> `ask_questions` (migration 0008, with the `answer_question()` RPC and
> `public_qa` view) and `announcements` (migration 0013). The hand-written
> entries in `src/lib/database.types.ts` match those schemas; regenerate from
> the backend (`./scripts/generate-types.sh`) to replace them with the
> authoritative generated types.

Phase 7 moderation:

- **`POST /api/moderate`** proxies the OpenAI Moderation API
  (`omni-moderation-latest`). Body: `{ input: string | string[] }`; returns
  `{ flagged, results[] }`. Used by the backend moderate-message hook. Reports
  503 (disabled) when `OPENAI_API_KEY` is unset, and requires
  `Authorization: Bearer <MODERATION_SECRET>` when that secret is configured.

Members and analytics arrive in later phases (see the build plan). Generated
database types live in `src/lib/database.types.ts`; regenerate from the backend
after migrations.
