// Role + capability model for the admin app.
//
// The database stores a single `role` (member | discipler | house_leader |
// pastor | admin) plus an additive `is_owner` flag. The platform owner is an
// `admin` with `is_owner = true`; we surface that as the synthetic "owner"
// tier here. Mobile only ever reads `role`, so it keeps working unchanged.
//
// RLS (is_parish_admin) still treats pastor + admin as parish admins at the
// database level. These capabilities are the FINER, app-layer privilege tiers
// that gate the dashboard nav and the staff/role server actions.

import type { UserRole } from "@/lib/db";

export type EffectiveRole = "owner" | UserRole;

export type ActorProfile = { role: string; is_owner?: boolean | null };

export const ROLE_LABEL: Record<EffectiveRole, string> = {
  owner: "Owner",
  admin: "Admin",
  pastor: "Pastor",
  house_leader: "Leader",
  discipler: "Discipler",
  member: "Student",
};

export const ROLE_HINT: Record<EffectiveRole, string> = {
  owner: "Platform owner. Full control, including managing admins.",
  admin: "Runs the dashboard: content, members, houses, giving, moderation.",
  pastor: "Mentor. Answers Ask Pastor and shepherds members.",
  house_leader: "Leads a campus or house fellowship.",
  discipler: "Walks one to one with a few members.",
  member: "A student in the fellowship.",
};

export type Capability =
  | "content" // devotionals, word of the day, reading plans, announcements
  | "houses"
  | "members" // view + manage member placement and roles
  | "staff" // onboard new staff, change elevated roles
  | "giving"
  | "moderation"
  | "analytics"
  | "ask_pastor";

const CAPABILITIES: Record<EffectiveRole, Capability[]> = {
  owner: [
    "content",
    "houses",
    "members",
    "staff",
    "giving",
    "moderation",
    "analytics",
    "ask_pastor",
  ],
  // Administrative lane. NOT pastoral: a plain admin runs the platform but does
  // not answer Ask Pastor. Only the owner spans both lanes.
  admin: [
    "content",
    "houses",
    "members",
    "staff",
    "giving",
    "moderation",
    "analytics",
  ],
  // Pastoral lane only. A pastor is a mentor, distinct from an admin.
  pastor: ["ask_pastor"],
  house_leader: [],
  discipler: [],
  member: [],
};

export function effectiveRole(p: ActorProfile): EffectiveRole {
  if (p.is_owner) return "owner";
  return p.role as UserRole;
}

export function can(p: ActorProfile, cap: Capability): boolean {
  return CAPABILITIES[effectiveRole(p)]?.includes(cap) ?? false;
}

export function capabilitiesFor(role: EffectiveRole): Capability[] {
  return CAPABILITIES[role] ?? [];
}

/** Roles that may reach the admin dashboard at all. */
export function canAccessAdmin(p: ActorProfile): boolean {
  const r = effectiveRole(p);
  return r === "owner" || r === "admin" || r === "pastor";
}

/** Which roles an actor is allowed to GRANT. Only the owner can mint admins. */
export function assignableRoles(actor: EffectiveRole): UserRole[] {
  if (actor === "owner")
    return ["member", "discipler", "house_leader", "pastor", "admin"];
  if (actor === "admin")
    return ["member", "discipler", "house_leader", "pastor"];
  return [];
}

export function canManageStaff(actor: EffectiveRole): boolean {
  return actor === "owner" || actor === "admin";
}

/**
 * Whether `actor` may edit the account whose effective role is `target`.
 * Owners may edit anyone; admins may edit everyone below admin (never another
 * admin or the owner).
 */
export function canEditTarget(
  actor: EffectiveRole,
  target: EffectiveRole
): boolean {
  if (actor === "owner") return true;
  if (actor === "admin") return target !== "owner" && target !== "admin";
  return false;
}
