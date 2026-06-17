import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Plus, Megaphone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function AnnouncementsPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, banner, status, publish_date, posted_at")
    .eq("parish_id", profile.parish_id!)
    .order("publish_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Announcements</h1>
          <p className="mt-1 text-ink/60">
            Post parish-wide announcements with events and photos.
          </p>
        </div>
        <Link
          href="/announcements/new"
          className="inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90"
        >
          <Plus size={16} /> New announcement
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Banner</th>
              <th className="px-5 py-3 font-medium">Publish date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(announcements ?? []).map((a) => (
              <tr
                key={a.id}
                className="border-b border-border/60 last:border-0 hover:bg-parchment/60"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/announcements/${a.id}`}
                    className="font-medium text-ink hover:text-copper"
                  >
                    {a.title}
                  </Link>
                </td>
                <td className="px-5 py-3 capitalize text-ink/70">
                  {a.banner ?? "—"}
                </td>
                <td className="px-5 py-3 text-ink/70">
                  {a.publish_date
                    ? format(parseISO(a.publish_date), "EEE, MMM d yyyy")
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!announcements || announcements.length === 0) && (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
            <Megaphone className="text-copper" size={28} />
            <p className="font-display text-lg text-ink">No announcements yet</p>
            <p className="text-sm text-ink/60">
              Share parish news, events, and updates.
            </p>
            <Link
              href="/announcements/new"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90"
            >
              <Plus size={16} /> New announcement
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
