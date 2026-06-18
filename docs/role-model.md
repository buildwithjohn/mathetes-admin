# Canonical role model — backend · admin portal · mobile

Single source of truth for roles across all three codebases. Ratified by John
(platform owner). The **DB enum is canonical**; admin and mobile mirror it.

## 1. Roles (DB enum — do not add values)

`user_profiles.role`: **`member | house_leader | discipler | pastor | admin`**

Neither the admin portal nor mobile may invent new DB role values. The portal
adds only **display labels** (below) over this enum.

## 2. Owner = `is_owner` flag (NOT a new role)

- `user_profiles.is_owner boolean not null default false` — `true` only for the
  platform owner (John). Owner = `admin` + `is_owner = true`.
- Chosen over a distinct enum role so there's **no breaking enum change**; mobile
  keeps reading `role` and only reads `is_owner` to show the badge / gate
  owner-only powers.
- ⚠️ **Backend action:** `is_owner` already exists on prod (applied via
  `docs/roles-and-owner.sql`) but is **not in the backend migrations/types**.
  Please formalize it:
  ```sql
  alter table public.user_profiles
    add column if not exists is_owner boolean not null default false;
  ```
  and regenerate types so it's canonical everywhere.

## 3. Display labels (agree across all surfaces)

| role / flag        | Label         |
|--------------------|---------------|
| `is_owner = true`  | Owner         |
| `admin`            | Admin         |
| `pastor`           | Pastor        |
| `house_leader`     | House Leader  |
| `discipler`        | Discipler     |
| `member`           | Student       |

`member` is shown as **Student** (this is a student fellowship app);
`house_leader` as **House Leader**. These are labels only — the stored enum
value is unchanged.

## 4. Hierarchy & who may elevate whom

```
owner  >  admin  >  { pastor, discipler, house_leader }  >  member
```

- Only the **owner** may grant/revoke `admin` (and the `is_owner` flag).
- A regular **admin** may set roles up to `pastor`
  (`member | discipler | house_leader | pastor`) but **cannot** create another
  admin or modify the owner.
- Enforced today in the admin portal app-layer. If role elevation is ever
  exposed on **mobile**, the backend must enforce the same (owner-only for
  `admin` grants — check `is_owner`); otherwise keep role elevation
  portal-only.

## 5. Permission matrix

Parish-admin tier (can approve / resolve) = **owner + admin only** — NOT pastor.

| Capability                         | Owner | Admin | Pastor | Discipler | House Leader | Student |
|------------------------------------|:-----:|:-----:|:------:|:---------:|:------------:|:-------:|
| Reach the **admin portal**         |  ✓    |  ✓    | ✓ (Ask-Pastor only) | ✗ | ✗ | ✗ |
| Approve / reject members           |  ✓    |  ✓    |  ✗     |   ✗       |   ✗          |   ✗     |
| Answer Ask-Pastor                  |  ✓    |  ✓    |  ✓     |   ✗       |   ✗          |   ✗     |
| Resolve / dismiss flags            |  ✓    |  ✓    |  ✗     |   ✗       |   ✗          |   ✗     |
| Assign / elevate roles             |  ✓ (incl. admin) | ✓ (up to pastor) | ✗ | ✗ | ✗ | ✗ |
| Content / houses / giving / analytics / domains | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Mobile Oversight tab**           | full  | full  | answer Ask-Pastor only | view scope only | view scope only | none |

"View scope only" = disciplers see their disciplees; house leaders see their
house + group-chat oversight (existing chat RLS). They have **no**
approve/answer/resolve actions.

## 6. Required backend changes to make this canonical

1. **Formalize `is_owner`** in a migration + types (currently prod-only).
2. **Narrow** `approve_member`, `reject_member`, `resolve_report` from
   `is_parish_admin()` (pastor + admin) to **admin only** (`role = 'admin'`,
   which includes the owner). This removes pastor's approve/resolve powers per
   the decision. **Keep `answer_question` at pastor + admin** (the mentor
   answers questions).
3. Keep the self-escalation guard (members can never change their own
   role/status). Optionally add the owner-only-grants-admin check server-side if
   mobile ever elevates roles.

## 7. Admin portal status

Already conforms: enum unchanged; owner via `is_owner`; pastor = Ask-Pastor only;
approvals + moderation gated to owner/admin; owner-only admin-mint enforced.
No portal logic change from these decisions (only the "House Leader" label).
