import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OpenAI's current multimodal moderation model.
const MODEL = "omni-moderation-latest";

const schema = z.object({
  input: z
    .union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
    .describe("Text (or array of texts) to moderate"),
});

type ModerationResult = {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
};

/**
 * POST /api/moderate
 * Body: { input: string | string[] }
 *
 * Proxies the OpenAI Moderation API and returns normalized results. Used by the
 * backend moderate-message hook and any admin-side checks. When OPENAI_API_KEY
 * is not configured the endpoint reports moderation as disabled (503) rather
 * than failing hard, so local development without a key still works.
 *
 * If MODERATION_SECRET is set, requests must send `Authorization: Bearer <it>`
 * to avoid exposing an open OpenAI proxy.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.MODERATION_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Moderation is not configured", disabled: true },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MODEL, input: parsed.data.input }),
    });
  } catch {
    return Response.json(
      { error: "Could not reach the moderation service" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const detail = await res.text();
    return Response.json(
      { error: "Moderation request failed", detail },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { results?: ModerationResult[] };
  const results = data.results ?? [];
  const flagged = results.some((r) => r.flagged);

  return Response.json({
    model: MODEL,
    flagged,
    results: results.map((r) => ({
      flagged: r.flagged,
      categories: r.categories,
      category_scores: r.category_scores,
    })),
  });
}
