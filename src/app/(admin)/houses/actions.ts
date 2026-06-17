"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { TablesInsert } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

const houseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pick a colour"),
  verse: z.string().trim().nullable().optional(),
  verseRef: z.string().trim().nullable().optional(),
  campusId: z.string().uuid("Campus is required"),
  leaderId: z.string().uuid().nullable().optional(),
});

export type HouseInput = z.input<typeof houseSchema>;

export async function saveHouse(input: HouseInput): Promise<ActionResult> {
  const parsed = houseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();

  const row: TablesInsert<"houses"> = {
    parish_id: profile.parish_id!,
    campus_id: v.campusId,
    name: v.name,
    slug: v.slug,
    color: v.color,
    verse: v.verse || null,
    verse_ref: v.verseRef || null,
    leader_id: v.leaderId || null,
  };
  if (v.id) row.id = v.id;

  // On INSERT, a DB trigger creates the house_group broadcast chat.
  const { error } = await supabase.from("houses").upsert(row);
  if (error) {
    const msg =
      error.code === "23505"
        ? "A house with that slug already exists in this campus."
        : error.message;
    return { ok: false, error: msg };
  }
  revalidatePath("/houses");
  return { ok: true };
}

export async function setHouseArchived(
  id: string,
  archived: boolean
): Promise<ActionResult> {
  const { supabase, profile } = await requireAdmin();
  // A DB trigger keeps the house's chat archived in lockstep.
  const { error } = await supabase
    .from("houses")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/houses");
  return { ok: true };
}
