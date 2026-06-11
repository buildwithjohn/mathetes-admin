import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { DevotionalEditor } from "@/components/admin/DevotionalEditor";

export default async function EditDevotionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireAdmin();

  const { data: devotional } = await supabase
    .from("devotionals")
    .select(
      "id, title, series_id, day_in_series, body_md, scripture_refs, reading_time_minutes, audio_url, publish_date, status"
    )
    .eq("id", id)
    .eq("parish_id", profile.parish_id!)
    .single();

  if (!devotional) notFound();

  const { data: series } = await supabase
    .from("devotional_series")
    .select("id, title")
    .eq("parish_id", profile.parish_id!)
    .order("title");

  return (
    <div>
      <Link
        href="/devotionals"
        className="inline-flex items-center gap-1 text-sm text-ink/60 transition hover:text-copper"
      >
        <ArrowLeft size={15} /> Devotionals
      </Link>
      <h1 className="mt-2 font-display text-3xl">Edit devotional</h1>
      <div className="mt-6">
        <DevotionalEditor initial={devotional} series={series ?? []} />
      </div>
    </div>
  );
}
