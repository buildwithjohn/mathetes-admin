# Student gating — what the mobile app needs to know

The admin app now gates membership. The mobile app must respect a member's
**status** so unapproved people don't get into parish content. Enforcement is
backend RLS; mobile adds the human-friendly gate so users see a clear screen
instead of empty data.

## The new field

`user_profiles.status` — one of:

| status     | meaning                                  | mobile behavior                          |
|------------|------------------------------------------|-------------------------------------------|
| `active`   | approved member                          | normal app                                |
| `pending`  | signed up, awaiting a leader's approval   | "Pending approval" screen, nothing else   |
| `rejected` | not approved                             | "Not approved" screen                     |
| `suspended`| access revoked                          | "Account suspended" screen                |

Read `status` on the signed-in user's own profile (RLS lets a user read their
own row). **Add it to your profile fetch** — if you don't select it, you won't
know to gate.

## Gate the app on status

After auth, branch on the profile's `status`:

- `active` → into the app as today.
- `pending` / `rejected` / `suspended` → a dedicated screen, no tabs, no
  content, no chats, no directory. Copy suggestions:
  - pending: "You're in the queue. A campus leader will approve you shortly."
  - rejected: "Your access wasn't approved. Reach out to a campus leader."
  - suspended: "Your account is suspended. Contact a campus leader."

Don't rely only on RLS returning empty lists — show the gate screen.

## Signup UX (this is the main lever)

Auto-approval is by **school email domain**. At signup, tell users:

> Use your school email (e.g. `you@students.fuoye.edu.ng`) to get in instantly.
> Any other email will wait for a leader's approval.

Backend decides this (a signup trigger matches the email domain against each
campus's allowed domains → `active` + campus assigned; otherwise `pending`).
Mobile does **not** compute domains — it only reads `status`.

Reality check: if most students don't use a school email, **pending will be the
norm**, so the pending screen needs to feel calm and reassuring, not like an
error.

## React to approval (pending → active)

When a leader approves someone, their `status` flips to `active` (and a
`campus_id` is set). The pending screen should detect this and unlock:

- Subscribe to realtime on the user's own `user_profiles` row, **or**
- refetch the profile on app foreground / pull-to-refresh / a short poll while
  on the pending screen.

## Don't expose role or status editing

Roles and status change **only** in the admin app. The backend locks
self-escalation (a member can never change their own `role` or `status`).
Mobile must not offer any UI to change them.

## Edge cases

- `campus_id` may be **null** until approval for non-school-email signups —
  tolerate a null campus before `active`.
- Roles are independent of status. A leader signs up with a normal email →
  starts `pending` → an admin approves them **and** sets their role
  (pastor/discipler/house leader). So a user can become `active` with an
  elevated role in one step; key your leader UI off `role`, your access gate off
  `status`.
- `is_owner` exists on profiles but mobile can ignore it (the owner is just an
  `admin` to mobile).
