"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCapability } from "@/lib/auth";

const resolveSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setReportStatus(
  input: z.input<typeof resolveSchema>
): Promise<ActionResult> {
  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireCapability("moderation");

  const resolving = v.status === "resolved" || v.status === "dismissed";
  const { error } = await supabase
    .from("reports")
    .update({
      status: v.status,
      resolved_by: resolving ? profile.id : null,
      resolved_at: resolving ? new Date().toISOString() : null,
    })
    .eq("id", v.id)
    .eq("parish_id", profile.parish_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/moderation");
  return { ok: true };
}
