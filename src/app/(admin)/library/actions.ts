"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCapability } from "@/lib/auth";
import type { TablesInsert } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

const nullableText = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

const itemSchema = z
  .object({
    id: z.string().uuid().optional(),
    kind: z.enum(["book", "manual", "audio", "video"]),
    title: z.string().trim().min(1, "Title is required").max(200),
    author: z.string().trim().max(120).nullable().optional().transform((v) => v || null),
    category: z.string().trim().max(120).nullable().optional().transform((v) => v || null),
    description: nullableText,
    coverImageUrl: z.string().trim().nullable().optional().transform((v) => v || null),
    fileUrl: z.string().trim().nullable().optional().transform((v) => v || null),
    externalUrl: z.string().trim().nullable().optional().transform((v) => v || null),
    durationSeconds: z
      .number()
      .int()
      .min(0)
      .max(86400)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
  })
  .superRefine((v, ctx) => {
    if ((v.kind === "book" || v.kind === "manual") && !v.fileUrl) {
      ctx.addIssue({ code: "custom", message: "Upload a PDF for a book/manual." });
    }
    if (v.kind === "audio" && !v.fileUrl) {
      ctx.addIssue({ code: "custom", message: "Upload an audio file." });
    }
    if (v.kind === "video" && !v.fileUrl && !v.externalUrl) {
      ctx.addIssue({
        code: "custom",
        message: "Add a video URL or upload an mp4.",
      });
    }
  });

export type LibraryItemInput = z.input<typeof itemSchema>;

export async function saveLibraryItem(
  input: LibraryItemInput
): Promise<ActionResult> {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireCapability("content");

  const row: TablesInsert<"library_items"> = {
    parish_id: profile.parish_id!,
    kind: v.kind,
    title: v.title,
    author: v.author,
    category: v.category,
    description: v.description,
    cover_image_url: v.coverImageUrl,
    file_url: v.fileUrl,
    external_url: v.externalUrl,
    duration_seconds: v.durationSeconds,
    updated_at: new Date().toISOString(),
  };
  if (v.id) {
    row.id = v.id;
  } else {
    row.author_id = profile.id;
  }

  const { error } = await supabase.from("library_items").upsert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/library");
  return { ok: true };
}

export async function setLibraryPublished(
  id: string,
  published: boolean
): Promise<ActionResult> {
  const { supabase, profile } = await requireCapability("content");
  const { error } = await supabase
    .from("library_items")
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/library");
  return { ok: true };
}

export async function deleteLibraryItem(id: string): Promise<ActionResult> {
  const { supabase, profile } = await requireCapability("content");
  const { error } = await supabase
    .from("library_items")
    .delete()
    .eq("id", id)
    .eq("parish_id", profile.parish_id!);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/library");
  return { ok: true };
}
