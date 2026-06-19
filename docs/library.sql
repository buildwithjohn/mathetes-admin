-- Library (V?) — content authors post items the mobile Library reads.
-- Run in the Supabase SQL editor. Idempotent.
--
-- SHARED TABLE: mobile reads published library_items. Field names below are the
-- contract; backend should formalize this in a migration to match.

create table if not exists public.library_items (
  id              uuid primary key default gen_random_uuid(),
  parish_id       uuid not null references public.parishes(id) on delete cascade,
  kind            text not null
                    check (kind in ('book', 'manual', 'audio', 'video')),
  title           text not null,
  author          text,            -- author / speaker
  category        text,            -- free text: "September 2026", a topic, etc.
  description     text,
  cover_image_url text,
  file_url        text,            -- PDF / audio / mp4 in the content-media bucket
  external_url    text,            -- YouTube / external video URL
  duration_seconds integer,        -- audio + video
  published       boolean not null default false,
  published_at    timestamptz,
  created_by      uuid references public.user_profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_library_items_parish_pub
  on public.library_items (parish_id, published, kind);

alter table public.library_items enable row level security;

-- Members read PUBLISHED items in their parish; parish admins read all (drafts).
drop policy if exists "library_items_select" on public.library_items;
create policy "library_items_select" on public.library_items for select
  to authenticated
  using (
    parish_id = public.current_parish_id()
    and (published or public.is_parish_admin())
  );

-- Parish admins manage their parish's items.
drop policy if exists "library_items_admin_write" on public.library_items;
create policy "library_items_admin_write" on public.library_items for all
  to authenticated
  using (public.is_parish_admin() and parish_id = public.current_parish_id())
  with check (public.is_parish_admin() and parish_id = public.current_parish_id());

-- The content-media bucket already exists (0019) but its MIME whitelist omits
-- PDFs and images. Widen it so books (PDF) and cover images can be uploaded.
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav',
  'video/mp4', 'video/webm'
]
where id = 'content-media';
