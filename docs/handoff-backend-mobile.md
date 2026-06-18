# Note for backend & mobile (current state of the admin portal)

The admin portal is aligned to backend through migration **0027** and to the
ratified **canonical role model** (`docs/role-model.md`). This note is what each
team needs to do/know so all three surfaces behave identically.

---

## FOR BACKEND — action items

1. **Formalize `is_owner`.** It exists on prod (applied via
   `docs/roles-and-owner.sql`) but is not in your migrations/types. Add it:
   `alter table public.user_profiles add column if not exists is_owner boolean not null default false;`
   then regenerate types. Owner = `admin` + `is_owner = true` (no new enum role).

2. **Narrow approve/resolve to admin-only** (decision: pastor = mentor, not a
   parish admin). Change `approve_member`, `reject_member`, `resolve_report`
   from `is_parish_admin()` (pastor + admin) to **`role = 'admin'`** (which
   includes the owner). **Keep `answer_question` at pastor + admin** — the
   mentor still answers questions.

3. **Add a re-answer guard to `answer_question`.** It currently overwrites
   regardless of state. Add `and status = 'awaiting'` (raise if already
   answered) so a stale portal submit can't clobber a mobile answer, and
   vice-versa.

4. **(Optional) owner-only-grants-admin.** The portal enforces "only the owner
   may create admins." If role elevation is ever exposed on mobile, enforce the
   same server-side (check `is_owner`); otherwise role elevation stays
   portal-only.

5. **Keep** the self-escalation guard (members can never change their own
   role/status). Seeding `campuses.allowed_email_domains` (e.g. `fuoye.edu.ng`)
   is John's call from the portal; until seeded, every signup queues for
   approval (intended fallback).

---

## FOR MOBILE — what to know

### Roles
- Enum is canonical: `member | house_leader | discipler | pastor | admin`.
- **Owner** is not a role — it's `is_owner = true` on an admin. Read it only for
  the **"Owner"** badge (and owner-only gating). Labels: **Student** (`member`),
  **House Leader** (`house_leader`), Discipler, Pastor, Admin, Owner.

### Oversight tab — actions per role (must match backend RPCs)
| Action | Who | RPC |
|--------|-----|-----|
| Approve / reject members | owner, admin | `approve_member(p_user,p_campus)` / `reject_member(p_user)` |
| Answer Ask-Pastor | owner, admin, **pastor** | `answer_question(p_id,p_response,p_public)` |
| Resolve / dismiss flags | owner, admin | `resolve_report(p_report,p_status)` (`reviewing|resolved|dismissed`) |
| List pending | owner, admin | `list_pending_members()` (returns id, name, email, created_at) |

- **Pastor = mentor:** surface only **Answer Ask-Pastor** to pastors. Do **not**
  surface approve/resolve to pastors (until backend item 2 ships they can still
  call those RPCs — don't expose them).
- **Discipler / House Leader:** Oversight is **view-only** (disciplees / house +
  group-chat oversight via existing chat RLS) — no approve/answer/resolve.

### Student gating (status)
- `user_profiles.status`: `pending | active | rejected | suspended`. Read it on
  the signed-in user's own profile and **gate the app**: `active` → in;
  `pending/rejected/suspended` → a dedicated screen (no content, chats, or
  directory). See `docs/student-gating-mobile.md`.
- New non-school-email signups start **`pending` with no parish/campus**. School
  emails (matching a campus's `allowed_email_domains`) are auto-approved by the
  backend trigger.
- **Auto-approved members pick their own campus** via `set_my_campus(p_campus)`
  (campus must be in their parish, and only once). Admin-approved members get
  their campus from `approve_member` and do **not** pick one.
- React to approval: when `status` flips `pending → active`, unlock the app
  (realtime on the user's row, or refetch on foreground).

### Never expose
Role and status are changed **only** by admins (portal, or owner/admin on
mobile). Members can never edit their own role/status.
