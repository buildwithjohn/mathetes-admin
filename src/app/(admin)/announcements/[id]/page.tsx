import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireAdmin();

  const { data: announcement } = await supabase
    .from("announcements")
    .select(
      "id, title, body_md, banner, event_data, photos, publish_date, status"
    )
    .eq("id", id)
    .eq("parish_id", profile.parish_id!)
    .single();

  if (!announcement) notFound();

  return (
    <div>
      <Link
        href="/announcements"
        className="inline-flex items-center gap-1 text-sm text-ink/60 transition hover:text-copper"
      >
        <ArrowLeft size={15} /> Announcements
      </Link>
      <h1 className="mt-2 font-display text-3xl">Edit announcement</h1>
      <div className="mt-6">
        <AnnouncementEditor initial={announcement} />
      </div>
    </div>
  );
}
