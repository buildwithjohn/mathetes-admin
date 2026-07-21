"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCapability } from "@/lib/auth";
import type { TablesInsert, TablesUpdate } from "@/lib/db";

export type FormationActionResult = { ok: true } | { ok: false; error: string };

const uuid = z.string().uuid();
const date = z.string().date("Choose a valid date");

const campaignSchema = z
  .object({
    id: uuid.optional(),
    kind: z.enum(["house_quest", "campus_mission"]),
    scopeId: uuid,
    title: z.string().trim().min(1, "A title is required").max(160),
    body: z.string().trim().max(4000),
    scriptureRef: z.string().trim().max(200).optional(),
    coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
    startsOn: date,
    endsOn: date,
    published: z.boolean(),
  })
  .refine((v) => v.endsOn >= v.startsOn, {
    path: ["endsOn"],
    message: "The end date must be on or after the start date.",
  });

export type CampaignInput = z.input<typeof campaignSchema>;

export async function saveFormationCampaign(
  input: CampaignInput
): Promise<FormationActionResult> {
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireCapability("content");

  const common = {
    kind: v.kind,
    title: v.title,
    body: v.body,
    scripture_ref: v.scriptureRef || null,
    cover_image_url: v.coverImageUrl || null,
    starts_on: v.startsOn,
    ends_on: v.endsOn,
    published: v.published,
    published_at: v.published ? new Date().toISOString() : null,
    house_id: v.kind === "house_quest" ? v.scopeId : null,
    campus_id: v.kind === "campus_mission" ? v.scopeId : null,
  };

  const error = v.id
    ? (
        await supabase
          .from("formation_campaigns")
          .update(common satisfies TablesUpdate<"formation_campaigns">)
          .eq("id", v.id)
          .eq("parish_id", profile.parish_id!)
      ).error
    : (
        await supabase.from("formation_campaigns").insert({
          ...common,
          parish_id: profile.parish_id!,
          author_id: profile.id,
        } satisfies TablesInsert<"formation_campaigns">)
      ).error;

  if (error) return { ok: false, error: error.message };
  revalidatePath("/formation");
  return { ok: true };
}

const eventSchema = z
  .object({
    id: uuid.optional(),
    scopeKind: z.enum(["parish", "house", "campus"]),
    scopeId: uuid.optional(),
    title: z.string().trim().min(1, "A title is required").max(160),
    description: z.string().trim().max(4000),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
    location: z.string().trim().max(200).optional(),
    coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
    published: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.scopeKind !== "parish" && !v.scopeId) {
      ctx.addIssue({ code: "custom", path: ["scopeId"], message: "Choose who should see this event." });
    }
    if (v.endsAt && v.endsAt < v.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "The end time must be after the start time." });
    }
  });

export type EventInput = z.input<typeof eventSchema>;

export async function saveFellowshipEvent(
  input: EventInput
): Promise<FormationActionResult> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireCapability("content");
  const common = {
    title: v.title,
    description: v.description,
    starts_at: v.startsAt,
    ends_at: v.endsAt || null,
    location: v.location || null,
    cover_image_url: v.coverImageUrl || null,
    published: v.published,
    published_at: v.published ? new Date().toISOString() : null,
    house_id: v.scopeKind === "house" ? v.scopeId! : null,
    campus_id: v.scopeKind === "campus" ? v.scopeId! : null,
  };
  const error = v.id
    ? (
        await supabase
          .from("fellowship_events")
          .update(common satisfies TablesUpdate<"fellowship_events">)
          .eq("id", v.id)
          .eq("parish_id", profile.parish_id!)
      ).error
    : (
        await supabase.from("fellowship_events").insert({
          ...common,
          parish_id: profile.parish_id!,
          author_id: profile.id,
        } satisfies TablesInsert<"fellowship_events">)
      ).error;

  if (error) return { ok: false, error: error.message };
  revalidatePath("/formation");
  return { ok: true };
}

export async function deleteFormationItem(
  table: "campaign" | "event",
  id: string
): Promise<FormationActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid item" };
  const { supabase, profile } = await requireCapability("content");
  const query = table === "campaign" ? supabase.from("formation_campaigns") : supabase.from("fellowship_events");
  const { error } = await query.delete().eq("id", id).eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/formation");
  return { ok: true };
}
