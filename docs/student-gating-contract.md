# Student gating — admin ↔ backend contract

What the admin app now relies on. Names below are what the admin code calls;
please match them (or tell us what to change).

## Columns (admin reads/writes these)

- `user_profiles.status text` — one of `pending | active | rejected | suspended`.
  Default `active`. Admin reads it on the Members and Approvals screens and
  writes it (approve/reject/suspend/reactivate).
- `campuses.allowed_email_domains text[]` — lowercase domains, no `@`. Admin
  edits these on the Approvals screen (uses the existing `campuses_admin_write`
  policy).

`docs/student-gating.sql` adds both, additively and safely (existing members
become `active`). Apply it before the admin build reaches that environment.

## Backend-owned (admin does NOT implement these)

1. **Signup auto-approval trigger.** On new auth user, if the email domain
   matches a campus's `allowed_email_domains`, set `status = active` and
   `campus_id` to that campus. Otherwise `status = pending`. (Matching members
   never appear in the approvals queue.)
2. **Status enforcement (RLS).** A `pending | rejected | suspended` user must
   have no access to parish content and must not appear in the member directory
   or any chat.
3. **Self-escalation locks.** Members can never change their own `role` or
   `status`. Only the admin app (parish admins) may.

## Approve / reject behavior

The admin currently performs approve/reject/suspend as **direct status updates**
(under `user_profiles_admin_write`):

- Approve → `status = 'active'`, `campus_id = <chosen>`
- Reject → `status = 'rejected'`
- Suspend / reactivate → `status` change from Members

If approval needs side effects (chat joins, notifications), please put them in a
**trigger on `user_profiles` status/campus change** so they fire regardless of
how the change is made. If you instead prefer RPCs
`approve_member(p_user, p_campus)` / `reject_member(p_user)`, tell us and we'll
switch the two admin actions to call them.

## Access (admin app)

Approvals + domain config are gated to the **owner + admin** capability
(`approvals`). The brief said "pastor/admin"; we kept it administrative to match
the agreed role model (pastor = mentor). Say the word to add pastor and/or
house leaders as approvers.
