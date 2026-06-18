"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/roles";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Approve a pending member via the backend RPC (0025). It sets status=active,
 * assigns the campus, and routes them to that campus's parish — and enforces
 * is_parish_admin() + that the campus belongs to the admin's parish.
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

  const { error } = await supabase.rpc("approve_member", {
    p_user: v.userId,
    p_campus: v.campusId,
  });
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
  const { error } = await supabase.rpc("reject_member", { p_user: userId });
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
