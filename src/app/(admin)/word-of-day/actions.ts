"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { TablesInsert } from "@/lib/db";

const wotdSchema = z.object({
  id: z.string().uuid().optional(),
  verseRef: z.string().trim().min(1, "Verse reference is required").max(120),
  verseText: z.string().trim().min(1, "Verse text is required"),
  reflectionMd: z.string().trim().nullable().optional(),
  prompt: z.string().trim().nullable().optional(),
  publishDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "A publish date is required"),
  status: z.enum(["draft", "scheduled", "published"]),
});

export type WordOfDayInput = z.input<typeof wotdSchema>;
export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveWordOfDay(
  input: WordOfDayInput
): Promise<ActionResult> {
  const parsed = wotdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();

  const row: TablesInsert<"word_of_day"> = {
    parish_id: profile.parish_id!,
    author_id: profile.id,
    verse_ref: v.verseRef,
    verse_text: v.verseText,
    reflection_md: v.reflectionMd ?? null,
    prompt: v.prompt ?? null,
    publish_date: v.publishDate,
    status: v.status,
  };
  if (v.id) row.id = v.id;

  const { data, error } = await supabase
    .from("word_of_day")
    .upsert(row)
    .select("id")
    .single();

  if (error) {
    const message =
      error.code === "23505"
        ? "A Word of the Day already exists for that date."
        : error.message;
    return { ok: false, error: message };
  }

  revalidatePath("/word-of-day");
  return { ok: true, id: data.id };
}

export async function deleteWordOfDay(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("word_of_day").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/word-of-day");
  return { ok: true, id };
}
