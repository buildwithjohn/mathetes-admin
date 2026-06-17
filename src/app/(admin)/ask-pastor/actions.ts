"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCapability } from "@/lib/auth";

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
  const { supabase } = await requireCapability("ask_pastor");

  // Use the backend RPC: it sets privacy (which the public_qa feed keys off),
  // status, answered_by/at atomically and enforces the parish-admin guard.
  const { error } = await supabase.rpc("answer_question", {
    p_id: v.id,
    p_response: v.responseBody,
    p_public: v.makePublic,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/ask-pastor");
  revalidatePath(`/ask-pastor/${v.id}`);
  return { ok: true };
}
