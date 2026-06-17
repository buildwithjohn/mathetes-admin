-- Roles + platform owner (run in the Supabase SQL editor). Idempotent.
--
-- Adds an additive `is_owner` flag to user_profiles and bootstraps the platform
-- owner. `is_owner` is NON-breaking: mobile only reads `role`, which is
-- unchanged, so nothing on mobile needs to know about this column.
--
-- Role taxonomy used by the admin app (existing `role` check constraint is
-- unchanged: member | discipler | house_leader | pastor | admin):
--   Owner   = admin + is_owner=true   (you)  -> full control, can mint admins
--   Admin   = admin                          -> runs the dashboard
--   Pastor  = pastor                          -> mentor (Ask Pastor, oversight)
--   Leader  = house_leader                    -> campus / fellowship leader
--   Discipler = discipler                     -> 1:1 mentor
--   Student = member

-- 1. Additive owner flag.
alter table public.user_profiles
  add column if not exists is_owner boolean not null default false;

-- 2. Bootstrap the platform owner by email. Sets role=admin + is_owner=true so
--    you can reach the admin dashboard AND show as top-tier (not "student") on
--    mobile. Change the email if needed.
update public.user_profiles up
set role = 'admin', is_owner = true
from auth.users au
where au.id = up.auth_id
  and au.email = 'akinolajohnayomide@gmail.com';

-- 3. (Optional, recommended) ensure only ONE owner exists.
--    Run this to see who currently holds the flag:
--    select up.name, au.email, up.role, up.is_owner
--    from public.user_profiles up join auth.users au on au.id = up.auth_id
--    where up.is_owner;

-- ---------------------------------------------------------------------------
-- AFTER running this, in the Supabase dashboard:
--   Auth -> URL Configuration -> Redirect URLs: add
--     https://admin.mathetes.live/auth/callback
--   (and your local/dev origin, e.g. http://localhost:3000/auth/callback)
--   so the staff invite link can complete. The "Invite user" email template
--   under Auth -> Email Templates is what new staff receive.
-- ---------------------------------------------------------------------------
