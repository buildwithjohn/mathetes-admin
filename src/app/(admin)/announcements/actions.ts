"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { Json, TablesInsert } from "@/lib/database.types";

const eventSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
    time: z.string().optional(),
    location: z.string().optional(),
  })
  .nullable()
  .optional();

const announcementSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "Title is required").max(200),
    bodyMd: z.string().default(""),
    banner: z.enum(["event", "urgent"]).nullable().optional(),
    event: eventSchema,
    photos: z.array(z.string().trim().url("Photo must be a URL")).default([]),
    publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    status: z.enum(["draft", "scheduled", "published"]),
  })
  .refine((v) => v.status === "draft" || !!v.publishDate, {
    path: ["publishDate"],
    message: "A publish date is required to schedule or publish.",
  });

export type AnnouncementInput = z.input<typeof announcementSchema>;
export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function buildEventData(
  event: z.infer<typeof eventSchema>
): Json | null {
  if (!event) return null;
  const date = event.date?.trim() || undefined;
  const time = event.time?.trim() || undefined;
  const location = event.location?.trim() || undefined;
  if (!date && !time && !location) return null;
  return { date, time, location } as Json;
}

export async function saveAnnouncement(
  input: AnnouncementInput
): Promise<ActionResult> {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();

  const row: TablesInsert<"announcements"> = {
    parish_id: profile.parish_id!,
    title: v.title,
    body_md: v.bodyMd,
    banner: v.banner ?? null,
    event_data: buildEventData(v.event),
    photos: v.photos,
    status: v.status,
    publish_date: v.publishDate ?? null,
    posted_by: profile.id,
    posted_at: v.status === "published" ? new Date().toISOString() : null,
  };
  if (v.id) row.id = v.id;

  const { data, error } = await supabase
    .from("announcements")
    .upsert(row)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/announcements");
  return { ok: true, id: data.id };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/announcements");
  return { ok: true, id };
}
