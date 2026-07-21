# Mathetes Admin — CONTEXT

The admin portal's source of truth. Cross-repo master lives at
`mathetes-mobile/docs/WORKSPACE.md` — read it first and keep this consistent
with it. Companion docs in this folder: `role-model.md`, `handoff-backend-mobile.md`,
`student-gating-*.md`, plus the `*.sql` contracts.

---

## 1. Overview & stack

- **Next.js 15** (App Router, Server Components by default, Server Actions for
  mutations), TypeScript strict, Tailwind + shadcn/ui, lucide-react. Same repo
  also serves the public marketing landing (`(public)`).
- **Supabase** is the only backend (Postgres + RLS, Auth, Storage, RPCs). Mobile
  talks to the same project — the admin and mobile **share one backend**.
- **Auth to Supabase** via `@supabase/ssr`:
  - `lib/supabase/server.ts` — server client (anon key + the user's cookies) for
    Server Components / Actions; RLS runs as the signed-in admin.
  - `lib/supabase/client.ts` — browser client (sign-in, file uploads).
  - `lib/supabase/middleware.ts` (mounted at `src/middleware.ts`) — refreshes the
    session and gates `(admin)` routes; host-based routing sends `admin.*` root to
    `/dashboard` (or `/signin`).
  - `lib/supabase/admin.ts` — **service-role** client (`createAdminClient()`),
    server-only, bypasses RLS. Used narrowly: invite/delete auth users, resolve
    pending-member emails, and read non-active members.
- **Gating:** `lib/auth.ts` → `requireAdmin()` allows only **owner/admin/pastor**
  into `(admin)`; `requireCapability(cap)` adds per-section gating. Roles/caps live
  in `lib/roles.ts` (see `role-model.md`). The `(admin)/layout.tsx` shell renders a
  capability-filtered sidebar; pages re-fetch on navigation (dynamic, never
  statically cached).
- **Deploy:** **Vercel**, region `dub1`, at `admin.mathetes.live`. `main` =
  production. Pipeline branches `dev` → `staging` → `main` (kept in lockstep).
- **Env vars** (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ADMIN_URL` (invite redirects),
  `SUPABASE_SERVICE_ROLE_KEY` (server-only: onboarding, deletion, pending reads),
  `OPENAI_API_KEY` (verse-image/moderate), `MODERATION_SECRET` (optional).

---

## 2. Sections built

Each lists what it does and what it writes. Capability in brackets gates the nav +
page (`requireCapability`).

| Section | Route | Does | Writes |
|---|---|---|---|
| **Dashboard** | `/dashboard` | At-a-glance: today's WOTD, week's devotionals, pending Ask-Pastor | reads only |
| **Devotionals** [content] | `/devotionals` | TipTap rich-text editor (verse block), series, scripture refs, reading-time, draft autosave, mobile preview, schedule/publish/delete; audio/video URL | `devotionals`, `devotional_series`, `content_assets` |
| **Word of the Day** [content] | `/word-of-day` | 3-month calendar, side-sheet composer (verse ref/text, reflection, **prayer guide**, prompt), 1-per-day, preview | `word_of_day` (incl. `prayer_md`) |
| **Reading Plans** [content] | `/reading-plans` | Plan metadata + per-day editor (scripture, markdown reflection, prompt), KJV fetch, missing-day warnings, reorder, publish | `reading_plans`, `reading_plan_days` |
| **Formation practices** [content] | upcoming | House Quests, Campus Missions, Fellowship Events and their pastoral publishing flow; the RLS-protected backend foundation is live | `formation_campaigns`, `fellowship_events` |
| **Announcements** [content] | `/announcements` | Compose parish announcements w/ banner, photos, event data; publish | `announcements` |
| **Library** [content] | `/library` | Books/manuals (PDF), audio sermons, video messages (URL or mp4); cover upload; publish toggle | `library_items`, `content-media` bucket |
| **Houses** [houses] | `/houses` | CRUD per campus, 7-colour palette, leader assignment, soft-archive | `houses` (insert triggers `house_group` chat) |
| **Members** [members] | `/members` | Directory, role elevation, status (active/suspended/…), house/campus assignment, **Onboard staff** (invite), delete (retype-name) + audit | `user_profiles` (role/status/placement), `member_deletions`; `auth.users` via service role |
| **Approvals** [approvals] | `/approvals` | Pending-member queue (approve w/ campus, reject) + per-campus auto-approval domains | RPCs below; `campuses.allowed_email_domains` |
| **Ask Pastor** [ask_pastor] | `/ask-pastor` | Answer the queue, set public/private | `answer_question` RPC |
| **Moderation** [moderation] | `/moderation` | Reports queue + auto-flag log; resolve/review/dismiss/reopen | `resolve_report` RPC (reopen = direct) |
| **Giving** [giving] | `/giving` | Funds CRUD; aggregate analytics (totals by fund/period, active recurring) | `giving_funds`; reads `donations`, `giving_recurring` |
| **Analytics** [analytics] | `/analytics` | Engagement + content stats | reads only |

Capabilities: owner/admin get everything (owner additionally mints admins);
**pastor = Ask-Pastor only**; disciplers/house-leaders/students have no portal.

---

## 3. How it writes to Supabase

**Dual-surface RPCs (shared with the mobile leader Oversight tab — both surfaces
MUST use the same RPC so state stays consistent):**

| Action | RPC | Surfaced to |
|---|---|---|
| Answer Ask-Pastor | `answer_question(p_id, p_response, p_public)` | owner, admin, pastor |
| Approve member | `approve_member(p_user, p_campus)` | owner, admin |
| Reject member | `reject_member(p_user)` | owner, admin |
| List pending | `list_pending_members()` (returns id, name, email, created_at) | owner, admin |
| Resolve flag | `resolve_report(p_report, p_status)` (`reviewing|resolved|dismissed`) | owner, admin |
| Campus self-pick (mobile only) | `set_my_campus(p_campus)` | auto-approved members |

Because mobile mirrors these, **the portal must reflect mobile changes** — pages
are dynamic and re-read on navigation, so an item handled on mobile drops off here
on refresh. (Live realtime sync is not wired yet; refresh/navigation is the
mechanism. The `answer_question` RPC needs a backend re-answer guard so a stale
submit can't clobber — see backend items.)

**Direct table writes** (parish-scoped, RLS `*_admin_write` / service role):
content (`devotionals`, `word_of_day`, `reading_plans`+`_days`, `announcements`,
`library_items`), `houses`, `giving_funds`, `user_profiles` role/status/placement,
`campuses.allowed_email_domains`, report **reopen** (`open`).

---

## 4. Cross-repo contracts the admin owns / must implement

- **Markdown.** Editors must emit **real markdown** (`**bold**`, `##` headings,
  lists) — never literal asterisks. The mobile renders markdown. (A devotional bug
  was exactly literal `**`; fixed in `RichTextEditor` via `tiptap-markdown`. The
  WOTD reflection + prayer guide and reading-plan reflections are raw-markdown
  textareas, which are inherently real markdown.)
- **Roles & owner.** `user_profiles.role`
  (`member | house_leader | discipler | pastor | admin`) + the `is_owner` flag are
  **admin-controlled only**; never expose role/status editing to members. Owner =
  `admin` + `is_owner` (no enum role). Only the owner mints admins. See
  `role-model.md`.
- **Approvals queue.** `list_pending_members()` → `approve_member(p_user,p_campus)`
  / `reject_member(p_user)`. **Domain config:** edit each campus's
  `allowed_email_domains` (lowercase, no `@`); matching school emails auto-approve.
- **Houses management.** CRUD per campus; **creating a house also creates its
  `house_group` chat** (DB trigger on insert). Soft-archive via `archived_at`.
- **Reading-plan authoring.** Plans + Days editor: markdown `reflection_body`,
  `scripture_reference` (single string), `reflection_prompt`, optional
  `devotional_id`. Admin-authored only.
- **Word prayer guide.** `word_of_day.prayer_md` (markdown) — mobile shows it as a
  "Pray" block under the reflection.
- **Library / media hub.** `library_items` (`kind` book/manual/audio/video; PDFs,
  audio, mp4 → `content-media` bucket, or external video URL; cover image;
  `published`/`published_at`). Mobile reads published items.
- **Giving.** Funds CRUD + aggregate analytics. **Pastor-visibility decision:**
  current rule is **pastor + admin can see individual gifts** (`donations_select_admin`);
  the portal deliberately shows **totals only** (no donor-level report) pending
  final confirmation that pastors should remain able to see individual giving.

---

## 5. Guardrails

- **Never** surface members' private reading-plan **reflections** — there is no
  read path, and the admin must not add one.
- Oversight ≠ surveillance: pastoral oversight is scoped (house leaders see their
  house; disciplers their disciplees) — no blanket reading of private chats.
- Giving is private: no public donor lists; amounts in kobo.
- Pending/suspended/rejected members are walled off (backend RLS); the admin app
  doesn't leak them into the directory beyond management screens.
- **Leader reach (backend 0033, decision ratified by John).** Two student
  guardrails were made role-aware so leaders aren't trapped in student scope:
  (1) the mobile parish **directory** now shows the whole parish to parish admins
  (students still see active members only); (2) `create_dm` lets owner/pastor/admin
  DM any active parish member cross-house and **bypass cross-gender approval** for
  pastoral care, and lets a member DM their own disciples. This is **initiation**
  reach only — it does **not** widen DM oversight/reading (0029 stands; DMs remain
  private to participants). No admin-portal code change; the portal already reads
  the full membership via the service role.

---

## 6. Status & outstanding tasks

**Content reliability (backend 0035):** scheduling for today/past publishes in
the same database transaction; future scheduled content becomes readable on its
date even if the publisher cron is late. No composer workflow change is needed.
The cron remains responsible for morning notification fan-out.

**Built & live** (✅): Approvals queue, Houses CRUD (+ house_group chat), Reading-
plan authoring, Library section, Word prayer-guide field, markdown-emit fix,
Giving funds CRUD + analytics — plus Devotionals, WOTD, Announcements, Ask-Pastor,
Members (onboarding/roles/status/delete+audit), Moderation, Analytics.

**Outstanding — backend coordination** (admin side done; backend must formalize so
all three repos are canonical):
- Formalize `is_owner`, `library_items`, `word_of_day.prayer_md` (+ add `prayer_md`
  to the `todays_word_of_day` view) in migrations.
- Narrow `approve_member`/`reject_member`/`resolve_report` to **admin-only**
  (exclude pastor); keep `answer_question` at pastor+admin and **add a re-answer
  guard** (`status='awaiting'`).

**Outstanding — decisions:**
- Giving: confirm whether pastors stay able to see individual gifts (else go
  finance-blind) before any donor-level report is built.
- Optional: pastors authoring Library content; add the OAU campus; pending→active
  backfill for any pre-existing members flipped to pending.

**Not yet built (nice-to-have):** live realtime sync so mobile-handled items vanish
here without a refresh.

**Formation practices (backend 0038, LIVE foundation):** the public-facing
surfaces are next: authors create scoped House Quests/Campus Missions and
Fellowship Events; students see only published items for their own house/campus,
then record private completion/RSVP state. Private rhythms, collections, and
prayer answers never appear in the admin portal or a leaderboard.
