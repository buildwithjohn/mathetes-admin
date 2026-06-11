"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

const memberSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["member", "house_leader", "discipler", "pastor", "admin"]),
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

  // RLS (user_profiles_admin_write) already restricts updates to the admin's
  // parish; scope the query to be safe and explicit.
  const { error } = await supabase
    .from("user_profiles")
    .update({ role: v.role, house_id: v.houseId, campus_id: v.campusId })
    .eq("id", v.id)
    .eq("parish_id", profile.parish_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/members");
  return { ok: true };
}
