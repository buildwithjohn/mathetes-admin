"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminOrigin } from "@/lib/site";
import {
  effectiveRole,
  canManageStaff,
  canEditTarget,
  assignableRoles,
  ROLE_LABEL,
} from "@/lib/roles";

const roleEnum = z.enum([
  "member",
  "house_leader",
  "discipler",
  "pastor",
  "admin",
]);

const memberSchema = z.object({
  id: z.string().uuid(),
  role: roleEnum,
  houseId: z.string().uuid().nullable(),
  campusId: z.string().uuid().nullable(),
});

export type MemberInput = z.input<typeof memberSchema>;
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateMember(input: MemberInput): Promise<ActionResult> {
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();
  const actor = effectiveRole(profile);

  if (!canManageStaff(actor)) {
    return { ok: false, error: "You do not have permission to manage members." };
  }

  // Inspect the target so we can enforce who-may-edit-whom and who-may-grant.
  const { data: target } = await supabase
    .from("user_profiles")
    .select("role, is_owner")
    .eq("id", v.id)
    .eq("parish_id", profile.parish_id!)
    .single();
  if (!target) return { ok: false, error: "Member not found." };

  const targetRole = effectiveRole(target);
  if (!canEditTarget(actor, targetRole)) {
    return { ok: false, error: "You cannot modify this account." };
  }
  if (!assignableRoles(actor).includes(v.role)) {
    return {
      ok: false,
      error: `Only the owner can grant the ${ROLE_LABEL[v.role]} role.`,
    };
  }

  // is_owner is intentionally never changed here; owner transfer is a separate,
  // deliberate operation.
  const { error } = await supabase
    .from("user_profiles")
    .update({ role: v.role, house_id: v.houseId, campus_id: v.campusId })
    .eq("id", v.id)
    .eq("parish_id", profile.parish_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/members");
  return { ok: true };
}

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: roleEnum,
  houseId: z.string().uuid().nullable().optional(),
  campusId: z.string().uuid().nullable().optional(),
});

export type InviteInput = z.input<typeof inviteSchema>;

/**
 * Onboard a new staff member. Creates the auth user via the Supabase admin API
 * and emails them an invite link to set their own password; that single
 * credential then works on BOTH the admin app and the mobile app (one account
 * per email). The role is applied to the profile the signup trigger created.
 */
export async function inviteStaff(input: InviteInput): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { profile } = await requireAdmin();
  const actor = effectiveRole(profile);

  if (!canManageStaff(actor)) {
    return { ok: false, error: "You do not have permission to onboard staff." };
  }
  if (!assignableRoles(actor).includes(v.role)) {
    return {
      ok: false,
      error: `Only the owner can grant the ${ROLE_LABEL[v.role]} role.`,
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Onboarding is not configured: the server is missing SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const redirectTo = `${await adminOrigin()}/auth/callback?next=/welcome`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(v.email, {
    data: { name: v.name },
    redirectTo,
  });

  if (error) {
    if (/already|exist|registered/i.test(error.message)) {
      return {
        ok: false,
        error:
          "That email already has an account. Find them under Members and change their role instead.",
      };
    }
    return { ok: false, error: error.message };
  }

  const authId = data.user?.id;
  if (!authId) return { ok: false, error: "Invite sent but no user was returned." };

  // The handle_new_user trigger already created the profile (role 'member',
  // pilot parish). Elevate it to the chosen role + placement.
  const { error: upErr } = await admin
    .from("user_profiles")
    .update({
      role: v.role,
      name: v.name,
      house_id: v.houseId ?? null,
      campus_id: v.campusId ?? null,
    })
    .eq("auth_id", authId);
  if (upErr) {
    return {
      ok: false,
      error: `Invite sent, but setting the role failed: ${upErr.message}`,
    };
  }

  revalidatePath("/members");
  return { ok: true };
}
