-- Member deletion audit log (run in the Supabase SQL editor). Idempotent.
--
-- A durable record of who deleted whom and when. It survives the deletion
-- itself: the deleted member's name/email/role are stored as text snapshots
-- (no foreign key to the row being removed), and the actor is kept as a
-- set-null reference plus a name snapshot.

create table if not exists public.member_deletions (
  id               uuid primary key default gen_random_uuid(),
  parish_id        uuid not null references public.parishes(id) on delete cascade,
  actor_profile_id uuid references public.user_profiles(id) on delete set null,
  actor_name       text not null,
  target_name      text not null,
  target_email     text,
  target_role      text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_member_deletions_parish_time
  on public.member_deletions (parish_id, created_at desc);

alter table public.member_deletions enable row level security;

-- Parish admins read their parish's log. Rows are written by the admin app's
-- service-role client (which bypasses RLS), so there is no INSERT policy.
drop policy if exists member_deletions_select_admin on public.member_deletions;
create policy member_deletions_select_admin
  on public.member_deletions for select
  to authenticated
  using (public.is_parish_admin() and parish_id = public.current_parish_id());
