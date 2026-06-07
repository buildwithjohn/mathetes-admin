import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor";

export default async function NewAnnouncementPage() {
  await requireAdmin();
  return (
    <div>
      <Link
        href="/announcements"
        className="inline-flex items-center gap-1 text-sm text-ink/60 transition hover:text-copper"
      >
        <ArrowLeft size={15} /> Announcements
      </Link>
      <h1 className="mt-2 font-display text-3xl">New announcement</h1>
      <div className="mt-6">
        <AnnouncementEditor initial={null} />
      </div>
    </div>
  );
}
