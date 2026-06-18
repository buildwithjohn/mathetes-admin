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

  if (v.status === "open") {
    // Reopen is portal-only (the shared resolve_report RPC accepts only
    // reviewing|resolved|dismissed); clear the resolution via a direct update.
    const { error } = await supabase
      .from("reports")
      .update({ status: "open", resolved_by: null, resolved_at: null })
      .eq("id", v.id)
      .eq("parish_id", profile.parish_id!);
    if (error) return { ok: false, error: error.message };
  } else {
    // Shared with the mobile Oversight tab: resolve_report stamps resolved_by
    // and resolved_at, so both surfaces behave identically.
    const { error } = await supabase.rpc("resolve_report", {
      p_report: v.id,
      p_status: v.status,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/moderation");
  return { ok: true };
}
