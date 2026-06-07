import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { DevotionalEditor } from "@/components/admin/DevotionalEditor";

export default async function NewDevotionalPage() {
  const { supabase, profile } = await requireAdmin();

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
      <h1 className="mt-2 font-display text-3xl">New devotional</h1>
      <div className="mt-6">
        <DevotionalEditor initial={null} series={series ?? []} />
      </div>
    </div>
  );
}
