"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/roles";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Approve a pending member: mark active and route them to a campus. Done as a
 * direct status update under the existing user_profiles_admin_write policy. If
 * the backend later ships an approve_member RPC (with side effects), switch
 * this to call it; a status-change trigger is the cleaner backend option.
 */
const approveSchema = z.object({
  userId: z.string().uuid(),
  campusId: z.string().uuid("Pick a campus"),
});

export async function approveMember(
  input: z.input<typeof approveSchema>
): Promise<ActionResult> {
  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();
  if (!can(profile, "approvals")) {
    return { ok: false, error: "You do not have permission to approve members." };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ status: "active", campus_id: v.campusId })
    .eq("id", v.userId)
    .eq("parish_id", profile.parish_id!)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/approvals");
  revalidatePath("/members");
  return { ok: true };
}

export async function rejectMember(userId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(userId).success) {
    return { ok: false, error: "Invalid member." };
  }
  const { supabase, profile } = await requireAdmin();
  if (!can(profile, "approvals")) {
    return { ok: false, error: "You do not have permission to reject members." };
  }
  const { error } = await supabase
    .from("user_profiles")
    .update({ status: "rejected" })
    .eq("id", userId)
    .eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/approvals");
  revalidatePath("/members");
  return { ok: true };
}

// Lowercase, no '@', no spaces, looks like a domain.
function cleanDomain(raw: string): string | null {
  const d = raw.trim().toLowerCase().replace(/^@+/, "");
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d)) {
    return null;
  }
  if (!d.includes(".")) return null;
  return d;
}

const domainsSchema = z.object({
  campusId: z.string().uuid(),
  domains: z.array(z.string()).max(30),
});

export async function updateCampusDomains(
  input: z.input<typeof domainsSchema>
): Promise<ActionResult> {
  const parsed = domainsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();
  if (!can(profile, "approvals")) {
    return { ok: false, error: "You do not have permission to edit domains." };
  }

  const cleaned: string[] = [];
  for (const raw of v.domains) {
    const c = cleanDomain(raw);
    if (!c) return { ok: false, error: `"${raw}" is not a valid domain.` };
    if (!cleaned.includes(c)) cleaned.push(c);
  }

  const { error } = await supabase
    .from("campuses")
    .update({ allowed_email_domains: cleaned })
    .eq("id", v.campusId)
    .eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/approvals");
  return { ok: true };
}
