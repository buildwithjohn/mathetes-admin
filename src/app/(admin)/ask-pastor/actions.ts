"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

const answerSchema = z.object({
  id: z.string().uuid(),
  responseBody: z.string().trim().min(1, "Write a response before sending."),
  makePublic: z.boolean(),
});

export type AnswerInput = z.input<typeof answerSchema>;
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function answerQuestion(
  input: AnswerInput
): Promise<ActionResult> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const { supabase, profile } = await requireAdmin();

  const { error } = await supabase
    .from("ask_questions")
    .update({
      response_body: v.responseBody,
      status: "answered",
      answered_at: new Date().toISOString(),
      answered_by: profile.id,
      public_anonymized: v.makePublic,
    })
    .eq("id", v.id)
    .eq("parish_id", profile.parish_id!);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/ask-pastor");
  revalidatePath(`/ask-pastor/${v.id}`);
  return { ok: true };
}
