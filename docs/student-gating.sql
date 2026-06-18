-- Student gating: member status + per-campus allowed email domains.
-- Run in the Supabase SQL editor. Idempotent and additive.
--
-- SAFE: existing members default to 'active', so nothing loses access. New
-- self-registrations that DON'T match a campus domain should be created
-- 'pending' by the backend signup trigger (backend-owned).
--
-- SCOPE: this script adds only the COLUMNS the admin app reads/writes. The
-- following remain BACKEND-owned (coordinate, do not duplicate here):
--   - the signup trigger that auto-approves + routes matching school emails
--   - RLS/status enforcement (pending users see no parish content, are hidden
--     from the directory and chats)
--   - self-escalation locks (members can never change their own role/status)
--   - optional approve_member(p_user, p_campus) / reject_member(p_user) RPCs
--
-- The admin app currently performs approve/reject/suspend as direct status
-- updates (allowed by the existing user_profiles_admin_write policy). If the
-- backend wants side effects on approval (chat joins, notifications), prefer a
-- trigger on user_profiles status/campus change so it fires no matter how the
-- change is made; or expose the RPCs and we will switch the admin actions to them.

-- 1. Member status.
alter table public.user_profiles
  add column if not exists status text not null default 'active'
    check (status in ('pending', 'active', 'rejected', 'suspended'));

create index if not exists idx_user_profiles_parish_status
  on public.user_profiles (parish_id, status);

-- 2. Per-campus auto-approval domains (lowercase, no '@').
alter table public.campuses
  add column if not exists allowed_email_domains text[] not null default '{}';
