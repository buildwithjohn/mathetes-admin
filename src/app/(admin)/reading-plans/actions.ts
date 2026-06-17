"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { TablesInsert } from "@/lib/db";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

const planSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().min(1, "Description is required"),
  lengthDays: z.number().int().min(1).max(365),
  difficulty: z.enum(["starter", "intermediate", "deep"]).nullable().optional(),
  sequenceLocked: z.boolean().default(true),
  coverImageUrl: z
    .string()
    .trim()
    .url("Cover must be a URL")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export type PlanInput = z.input<typeof planSchema>;

export async function savePlan(
  input: PlanInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();

  const row: TablesInsert<"reading_plans"> = {
    parish_id: profile.parish_id!,
    author_id: profile.id,
    title: v.title,
    slug: v.slug,
    description: v.description,
    length_days: v.lengthDays,
    difficulty: v.difficulty ?? null,
    sequence_locked: v.sequenceLocked,
    cover_image_url: v.coverImageUrl ? v.coverImageUrl : null,
  };
  if (v.id) row.id = v.id;

  const { data, error } = await supabase
    .from("reading_plans")
    .upsert(row)
    .select("id")
    .single();

  if (error) {
    const msg =
      error.code === "23505"
        ? "A plan with that slug already exists."
        : error.message;
    return { ok: false, error: msg };
  }
  revalidatePath("/reading-plans");
  if (v.id) revalidatePath(`/reading-plans/${v.id}/edit`);
  return { ok: true, data: { id: data.id } };
}

export async function setPlanPublished(
  id: string,
  published: boolean
): Promise<ActionResult> {
  const { supabase, profile } = await requireAdmin();
  const { error } = await supabase
    .from("reading_plans")
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/reading-plans");
  revalidatePath(`/reading-plans/${id}/edit`);
  return { ok: true };
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const { supabase, profile } = await requireAdmin();
  // reading_plan_days cascade-delete with the plan (FK on delete cascade).
  const { error } = await supabase
    .from("reading_plans")
    .delete()
    .eq("id", id)
    .eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/reading-plans");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

const daySchema = z.object({
  id: z.string().uuid().optional(),
  planId: z.string().uuid(),
  dayNumber: z.number().int().min(1),
  title: z.string().trim().max(200).default(""),
  scriptureReference: z.string().trim().max(200).default(""),
  scriptureText: z.string().nullable().optional(),
  reflectionBody: z.string().default(""),
  reflectionPrompt: z.string().trim().default(""),
  audioUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  devotionalId: z.string().uuid().nullable().optional(),
});

export type DayInput = z.input<typeof daySchema>;

export async function saveDay(
  input: DayInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = daySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase } = await requireAdmin();

  const row: TablesInsert<"reading_plan_days"> = {
    plan_id: v.planId,
    day_number: v.dayNumber,
    title: v.title,
    scripture_reference: v.scriptureReference,
    scripture_text: v.scriptureText ?? null,
    reflection_body: v.reflectionBody,
    reflection_prompt: v.reflectionPrompt,
    audio_url: v.audioUrl ? v.audioUrl : null,
    devotional_id: v.devotionalId ?? null,
  };
  if (v.id) row.id = v.id;

  // Upsert on the natural key (plan_id, day_number) so re-saving a day works.
  const { data, error } = await supabase
    .from("reading_plan_days")
    .upsert(row, { onConflict: "plan_id,day_number" })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/reading-plans/${v.planId}/edit`);
  revalidatePath(`/reading-plans/${v.planId}/days/${v.dayNumber}`);
  return { ok: true, data: { id: data.id } };
}

/** Create the next empty day for a plan; returns its day_number. */
export async function addDay(
  planId: string
): Promise<ActionResult<{ dayNumber: number }>> {
  const { supabase } = await requireAdmin();
  const { data: last } = await supabase
    .from("reading_plan_days")
    .select("day_number")
    .eq("plan_id", planId)
    .order("day_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const dayNumber = (last?.day_number ?? 0) + 1;

  const { error } = await supabase.from("reading_plan_days").insert({
    plan_id: planId,
    day_number: dayNumber,
    title: `Day ${dayNumber}`,
    scripture_reference: "",
    reflection_body: "",
    reflection_prompt: "",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/reading-plans/${planId}/edit`);
  return { ok: true, data: { dayNumber } };
}

export async function deleteDay(
  id: string,
  planId: string
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("reading_plan_days")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/reading-plans/${planId}/edit`);
  return { ok: true };
}

/** Persist a new day ordering. `orderedIds` is the desired sequence. */
export async function reorderDays(
  planId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  // Two-phase to dodge the unique(plan_id, day_number) constraint: park into a
  // high temporary range, then assign the final 1..N.
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("reading_plan_days")
      .update({ day_number: 1000 + i })
      .eq("id", orderedIds[i])
      .eq("plan_id", planId);
    if (error) return { ok: false, error: error.message };
  }
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("reading_plan_days")
      .update({ day_number: i + 1 })
      .eq("id", orderedIds[i])
      .eq("plan_id", planId);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/reading-plans/${planId}/edit`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// KJV lookup for the day editor's "Fetch from KJV"
// ---------------------------------------------------------------------------

export async function fetchScripture(
  reference: string
): Promise<ActionResult<{ text: string }>> {
  const ref = reference.trim();
  if (!ref) return { ok: false, error: "Enter a reference first." };
  const { supabase } = await requireAdmin();

  const { data: parsed, error } = await supabase.rpc("parse_reference", {
    ref,
  });
  if (error) return { ok: false, error: error.message };
  const r = parsed?.[0];
  if (!r) return { ok: false, error: `Couldn't read "${ref}".` };

  const { data: chapter } = await supabase
    .from("bible_chapters")
    .select("id")
    .eq("book_id", r.book_id)
    .eq("number", r.chapter)
    .single();
  if (!chapter) return { ok: false, error: "Chapter not found." };

  const { data: verse } = await supabase
    .from("bible_verses")
    .select("text")
    .eq("chapter_id", chapter.id)
    .eq("number", r.verse)
    .single();
  if (!verse) return { ok: false, error: "Verse not found." };

  return { ok: true, data: { text: verse.text } };
}
