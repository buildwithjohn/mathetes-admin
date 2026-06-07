-- PROPOSED migration for ../mathetes-backend (not applied from this repo).
--
-- The admin Announcements and Ask Pastor features in mathetes-admin are built
-- against this schema. Copy this into mathetes-backend as the next migration,
-- apply it, then regenerate types:
--   cd ../mathetes-backend && ./scripts/generate-types.sh
-- and the hand-written entries in src/lib/database.types.ts will be replaced by
-- the generated ones.
--
-- Depends on 0001 (parishes, user_profiles, helpers current_parish_id() and
-- is_parish_admin()).

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------

create table if not exists public.announcements (
  id            uuid primary key default gen_random_uuid(),
  parish_id     uuid not null references public.parishes(id) on delete cascade,
  title         text not null,
  body_md       text not null default '',
  -- { "date": "YYYY-MM-DD", "time": "HH:MM", "location": "..." } or null
  event_data    jsonb,
  banner        text check (banner in ('event', 'urgent')),
  photos        text[] not null default '{}',
  status        text not null default 'draft'
                  check (status in ('draft', 'scheduled', 'published')),
  publish_date  date,
  posted_at     timestamptz,
  posted_by     uuid references public.user_profiles(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_announcements_parish_status
  on public.announcements (parish_id, status, publish_date);

alter table public.announcements enable row level security;

create policy "announcements_select_published"
  on public.announcements for select
  to authenticated
  using (
    parish_id = public.current_parish_id()
    and (
      (status = 'published' and (publish_date is null or publish_date <= current_date))
      or public.is_parish_admin()
    )
  );

create policy "announcements_admin_write"
  on public.announcements for all
  to authenticated
  using (public.is_parish_admin() and parish_id = public.current_parish_id())
  with check (public.is_parish_admin() and parish_id = public.current_parish_id());

-- ---------------------------------------------------------------------------
-- Ask Pastor
-- ---------------------------------------------------------------------------

create table if not exists public.ask_questions (
  id                uuid primary key default gen_random_uuid(),
  parish_id         uuid not null references public.parishes(id) on delete cascade,
  asker_id          uuid not null references public.user_profiles(id) on delete cascade,
  body              text not null,
  category          text,
  -- Response privacy the asker requested.
  privacy           text not null default 'public'
                      check (privacy in ('public', 'private')),
  urgent            boolean not null default false,
  status            text not null default 'awaiting'
                      check (status in ('awaiting', 'answered')),
  response_body     text,
  answered_at       timestamptz,
  answered_by       uuid references public.user_profiles(id),
  -- When true, the answered Q&A is shown in the public feed without the asker.
  public_anonymized boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_ask_questions_parish_status
  on public.ask_questions (parish_id, status, created_at);

alter table public.ask_questions enable row level security;

-- Asker manages their own questions.
create policy "ask_questions_insert_own"
  on public.ask_questions for insert
  to authenticated
  with check (asker_id = public.current_profile_id());

create policy "ask_questions_select_own"
  on public.ask_questions for select
  to authenticated
  using (asker_id = public.current_profile_id());

-- Parish members see answered, public, anonymized Q&A.
create policy "ask_questions_select_public"
  on public.ask_questions for select
  to authenticated
  using (
    parish_id = public.current_parish_id()
    and status = 'answered'
    and public_anonymized = true
  );

-- Pastor/admin see and answer everything in their parish.
create policy "ask_questions_admin_read"
  on public.ask_questions for select
  to authenticated
  using (public.is_parish_admin() and parish_id = public.current_parish_id());

create policy "ask_questions_admin_update"
  on public.ask_questions for update
  to authenticated
  using (public.is_parish_admin() and parish_id = public.current_parish_id())
  with check (public.is_parish_admin() and parish_id = public.current_parish_id());
