"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { TablesInsert } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

const fundSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().max(280).nullable().optional(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export type FundInput = z.input<typeof fundSchema>;

export async function saveFund(input: FundInput): Promise<ActionResult> {
  const parsed = fundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();

  const row: TablesInsert<"giving_funds"> = {
    parish_id: profile.parish_id!,
    name: v.name,
    slug: v.slug,
    description: v.description || null,
    active: v.active,
    sort_order: v.sortOrder,
  };
  if (v.id) row.id = v.id;

  const { error } = await supabase.from("giving_funds").upsert(row);
  if (error) {
    const msg =
      error.code === "23505"
        ? "A fund with that slug already exists in this parish."
        : error.message;
    return { ok: false, error: msg };
  }
  revalidatePath("/giving");
  return { ok: true };
}

export async function setFundActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const { supabase, profile } = await requireAdmin();
  const { error } = await supabase
    .from("giving_funds")
    .update({ active })
    .eq("id", id)
    .eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/giving");
  return { ok: true };
}
