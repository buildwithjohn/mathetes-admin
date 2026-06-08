import { createHash } from "node:crypto";
import { ImageResponse } from "next/og";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadFonts,
  VerseImage,
  SIZES,
  type Theme,
  type AspectRatio,
} from "@/lib/verse-image/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "verse-images";

const schema = z.object({
  verseText: z.string().trim().min(1).max(600),
  verseRef: z.string().trim().min(1).max(120),
  theme: z.enum(["minimal", "organic", "bold"]).default("minimal"),
  aspectRatio: z.enum(["square", "story"]).default("square"),
  watermark: z.boolean().default(true),
  // Optional: the requesting user's profile id. When present (and Storage is
  // configured) the generated image is recorded in their verse_images gallery.
  userId: z.string().uuid().optional(),
});

type Params = z.infer<typeof schema>;

async function generate(p: Params): Promise<ImageResponse> {
  const ratio = p.aspectRatio as AspectRatio;
  const { width, height } = SIZES[ratio];
  const { fonts, display } = await loadFonts(`${p.verseText} ${p.verseRef}`);

  return new ImageResponse(
    (
      <VerseImage
        verseText={p.verseText}
        verseRef={p.verseRef}
        theme={p.theme as Theme}
        ratio={ratio}
        watermark={p.watermark}
        display={display}
      />
    ),
    { width, height, fonts }
  );
}

function cacheKey(p: Params): string {
  const raw = [
    p.verseRef,
    p.verseText,
    p.theme,
    p.aspectRatio,
    p.watermark ? "wm" : "nowm",
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

async function respond(p: Params): Promise<Response> {
  const image = await generate(p);

  // Cache to public Storage when a service role key is configured; otherwise
  // stream the PNG back directly so the endpoint still works locally.
  const admin = createAdminClient();
  if (!admin) {
    return new Response(image.body, {
      headers: { "Content-Type": "image/png", "X-Cache": "disabled" },
    });
  }

  const hash = cacheKey(p);
  const path = `${hash}.png`;
  const bytes = Buffer.from(await image.arrayBuffer());

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/png", upsert: true });

  if (error) {
    // Storage misconfigured (e.g. bucket missing): fall back to inline bytes.
    return new Response(bytes, {
      headers: { "Content-Type": "image/png", "X-Cache": "error" },
    });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  // Record the image in the user's gallery when a profile id was supplied.
  // Best-effort: a gallery failure should not fail image delivery.
  let gallery = false;
  if (p.userId) {
    const { error: insertError } = await admin.from("verse_images").insert({
      user_id: p.userId,
      verse_ref: p.verseRef,
      verse_text: p.verseText,
      theme: p.theme,
      aspect_ratio: p.aspectRatio,
      watermark: p.watermark,
      url: publicUrl,
    });
    gallery = !insertError;
  }

  return Response.json({ url: publicUrl, hash, cached: true, gallery });
}

export async function POST(request: Request): Promise<Response> {
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
  return respond(parsed.data);
}

// Convenience GET for previews/testing: /api/verse-image?verseRef=...&verseText=...
export async function GET(request: Request): Promise<Response> {
  const sp = new URL(request.url).searchParams;
  const parsed = schema.safeParse({
    verseText: sp.get("verseText") ?? undefined,
    verseRef: sp.get("verseRef") ?? undefined,
    theme: sp.get("theme") ?? undefined,
    aspectRatio: sp.get("aspectRatio") ?? undefined,
    watermark: sp.get("watermark") ? sp.get("watermark") === "true" : undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 }
    );
  }
  return respond(parsed.data);
}
