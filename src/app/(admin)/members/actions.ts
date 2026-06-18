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
  status: z.enum(["pending", "active", "rejected", "suspended"]),
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
    .update({
      role: v.role,
      status: v.status,
      house_id: v.houseId,
      campus_id: v.campusId,
    })
    .eq("id", v.id)
    .eq("parish_id", profile.parish_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/members");
  return { ok: true };
}

const deleteSchema = z.object({
  id: z.string().uuid(),
  // The admin must retype the member's exact name to confirm (GitHub/Vercel
  // style). Verified again here server-side, never trusting the client alone.
  confirmName: z.string().trim().min(1),
});

export type DeleteInput = z.input<typeof deleteSchema>;

/**
 * Permanently delete a member from the platform. Removes the Supabase auth user
 * via the admin API, which cascades the profile and all owned data (messages,
 * notes, streaks, donations, etc.). Authored content (devotionals, word of the
 * day, reading plans, series) is preserved with its author cleared, so deleting
 * a person never deletes parish content.
 */
export async function deleteMember(input: DeleteInput): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();
  const actor = effectiveRole(profile);

  if (!canManageStaff(actor)) {
    return { ok: false, error: "You do not have permission to delete members." };
  }
  if (v.id === profile.id) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  const { data: target } = await supabase
    .from("user_profiles")
    .select("name, auth_id, role, is_owner")
    .eq("id", v.id)
    .eq("parish_id", profile.parish_id!)
    .single();
  if (!target) return { ok: false, error: "Member not found." };

  if (target.is_owner) {
    return { ok: false, error: "The platform owner cannot be deleted." };
  }
  if (!canEditTarget(actor, effectiveRole(target))) {
    return { ok: false, error: "You cannot delete this account." };
  }
  if (v.confirmName !== target.name) {
    return {
      ok: false,
      error: "The name you typed does not match. Deletion cancelled.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Deletion is not configured: the server is missing SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const parish = profile.parish_id!;
  // Snapshot the email for the audit log before the account is gone.
  const { data: authUser } = await admin.auth.admin.getUserById(target.auth_id);
  const targetEmail = authUser?.user?.email ?? null;

  // Clear the restrict-default author/creator references so the cascade can
  // proceed. Content itself stays; it just loses the (now deleted) author.
  await Promise.all([
    admin
      .from("devotionals")
      .update({ author_id: null })
      .eq("author_id", v.id)
      .eq("parish_id", parish),
    admin
      .from("word_of_day")
      .update({ author_id: null })
      .eq("author_id", v.id)
      .eq("parish_id", parish),
    admin
      .from("reading_plans")
      .update({ author_id: null })
      .eq("author_id", v.id)
      .eq("parish_id", parish),
    admin
      .from("devotional_series")
      .update({ created_by: null })
      .eq("created_by", v.id)
      .eq("parish_id", parish),
  ]);

  // Deleting the auth user cascades the profile and all on-delete-cascade data.
  const { error } = await admin.auth.admin.deleteUser(target.auth_id);
  if (error) return { ok: false, error: error.message };

  // Durable audit row (snapshots, so it survives the deletion). Best effort:
  // the member is already gone, so a logging hiccup must not surface as failure.
  await admin.from("member_deletions").insert({
    parish_id: parish,
    actor_profile_id: profile.id,
    actor_name: profile.name ?? "Unknown",
    target_name: target.name,
    target_email: targetEmail,
    target_role: target.role,
  });

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

  const redirectTo = `${await adminOrigin()}/auth/confirm?next=/welcome`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(v.email, {
    data: { name: v.name, role: v.role },
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
