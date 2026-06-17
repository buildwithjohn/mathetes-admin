"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { TablesInsert } from "@/lib/db";

const devotionalSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "Title is required").max(200),
    seriesId: z.string().uuid().nullable().optional(),
    dayInSeries: z.number().int().positive().nullable().optional(),
    bodyMd: z.string().default(""),
    scriptureRefs: z.array(z.string().trim().min(1)).default([]),
    readingTimeMinutes: z.number().int().positive().nullable().optional(),
    audioUrl: z
      .string()
      .trim()
      .url("Audio must be a URL")
      .nullable()
      .optional()
      .or(z.literal("")),
    videoUrl: z
      .string()
      .trim()
      .url("Video must be a URL")
      .nullable()
      .optional()
      .or(z.literal("")),
    publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    status: z.enum(["draft", "scheduled", "published"]),
  })
  .refine((v) => v.status === "draft" || !!v.publishDate, {
    path: ["publishDate"],
    message: "A publish date is required to schedule or publish.",
  });

export type DevotionalInput = z.input<typeof devotionalSchema>;
export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveDevotional(
  input: DevotionalInput
): Promise<ActionResult> {
  const parsed = devotionalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();

  const row: TablesInsert<"devotionals"> = {
    parish_id: profile.parish_id!,
    author_id: profile.id,
    title: v.title,
    series_id: v.seriesId ?? null,
    day_in_series: v.dayInSeries ?? null,
    body_md: v.bodyMd,
    scripture_refs: v.scriptureRefs,
    reading_time_minutes: v.readingTimeMinutes ?? null,
    audio_url: v.audioUrl ? v.audioUrl : null,
    video_url: v.videoUrl ? v.videoUrl : null,
    publish_date: v.publishDate ?? null,
    status: v.status,
  };
  if (v.id) row.id = v.id;

  const { data, error } = await supabase
    .from("devotionals")
    .upsert(row)
    .select("id")
    .single();

  if (error) {
    const message =
      error.code === "23505"
        ? "Another devotional is already set for that date."
        : error.message;
    return { ok: false, error: message };
  }

  revalidatePath("/devotionals");
  if (v.id) revalidatePath(`/devotionals/${v.id}`);
  return { ok: true, id: data.id };
}

export async function deleteDevotional(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("devotionals").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/devotionals");
  return { ok: true, id };
}

export async function createSeries(title: string): Promise<ActionResult> {
  const clean = title.trim();
  if (!clean) return { ok: false, error: "Series title is required." };
  const { supabase, profile } = await requireAdmin();
  const { data, error } = await supabase
    .from("devotional_series")
    .insert({
      parish_id: profile.parish_id!,
      title: clean,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/devotionals");
  return { ok: true, id: data.id };
}
