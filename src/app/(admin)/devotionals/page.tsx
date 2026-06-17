import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Plus, BookOpen } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ContentStatus } from "@/lib/db";

const STATUS_FILTERS: { value: ContentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

export default async function DevotionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; series?: string }>;
}) {
  const { status, series } = await searchParams;
  const { supabase, profile } = await requireAdmin();

  const seriesRes = await supabase
    .from("devotional_series")
    .select("id, title")
    .eq("parish_id", profile.parish_id!)
    .order("title");
  const seriesList = seriesRes.data ?? [];
  const seriesTitle = new Map(seriesList.map((s) => [s.id, s.title]));

  let query = supabase
    .from("devotionals")
    .select(
      "id, title, publish_date, status, day_in_series, series_id, reading_time_minutes"
    )
    .eq("parish_id", profile.parish_id!)
    .order("publish_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const activeStatus =
    status === "draft" || status === "scheduled" || status === "published"
      ? status
      : "all";
  if (activeStatus !== "all") query = query.eq("status", activeStatus);
  if (series) query = query.eq("series_id", series);

  const { data: devotionals } = await query;

  function filterHref(next: { status?: string; series?: string }) {
    const params = new URLSearchParams();
    const s = next.status ?? activeStatus;
    const ser = "series" in next ? next.series : series;
    if (s && s !== "all") params.set("status", s);
    if (ser) params.set("series", ser);
    const qs = params.toString();
    return qs ? `/devotionals?${qs}` : "/devotionals";
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Devotionals</h1>
          <p className="mt-1 text-ink/60">
            Author, schedule, and publish daily devotionals.
          </p>
        </div>
        <Link
          href="/devotionals/new"
          className="inline-flex shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90"
        >
          <Plus size={16} /> New devotional
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={filterHref({ status: f.value })}
            className={
              "rounded-full border px-3 py-1 text-sm transition " +
              (activeStatus === f.value
                ? "border-copper bg-copper/10 text-copper"
                : "border-border text-ink/70 hover:bg-parchment")
            }
          >
            {f.label}
          </Link>
        ))}
        {seriesList.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-ink/50">Series</span>
            <Link
              href={filterHref({ series: undefined })}
              className={
                "rounded-full border px-3 py-1 text-sm transition " +
                (!series
                  ? "border-copper bg-copper/10 text-copper"
                  : "border-border text-ink/70 hover:bg-parchment")
              }
            >
              All
            </Link>
            {seriesList.map((s) => (
              <Link
                key={s.id}
                href={filterHref({ series: s.id })}
                className={
                  "rounded-full border px-3 py-1 text-sm transition " +
                  (series === s.id
                    ? "border-copper bg-copper/10 text-copper"
                    : "border-border text-ink/70 hover:bg-parchment")
                }
              >
                {s.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        {/* Mobile: stacked cards */}
        <div className="divide-y divide-border/60 sm:hidden">
          {(devotionals ?? []).map((d) => (
            <Link
              key={d.id}
              href={`/devotionals/${d.id}`}
              className="block px-4 py-3 transition hover:bg-parchment/60"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink">
                  {d.title}
                  {d.reading_time_minutes ? (
                    <span className="ml-2 text-xs font-normal text-ink/40">
                      {d.reading_time_minutes} min
                    </span>
                  ) : null}
                </p>
                <span className="shrink-0">
                  <StatusBadge status={d.status} />
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/60">
                {d.series_id ? seriesTitle.get(d.series_id) ?? "—" : "No series"}
                {d.day_in_series ? ` · Day ${d.day_in_series}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-ink/45">
                {d.publish_date
                  ? format(parseISO(d.publish_date), "EEE, MMM d yyyy")
                  : "No date"}
              </p>
            </Link>
          ))}
        </div>

        {/* Desktop: table */}
        <table className="hidden w-full text-left text-sm sm:table">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Series</th>
              <th className="px-5 py-3 font-medium">Publish date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(devotionals ?? []).map((d) => (
              <tr
                key={d.id}
                className="border-b border-border/60 last:border-0 hover:bg-parchment/60"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/devotionals/${d.id}`}
                    className="font-medium text-ink hover:text-copper"
                  >
                    {d.title}
                  </Link>
                  {d.reading_time_minutes ? (
                    <span className="ml-2 text-xs text-ink/40">
                      {d.reading_time_minutes} min
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-ink/70">
                  {d.series_id ? seriesTitle.get(d.series_id) ?? "—" : "—"}
                  {d.day_in_series ? (
                    <span className="text-ink/40"> · Day {d.day_in_series}</span>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-ink/70">
                  {d.publish_date
                    ? format(parseISO(d.publish_date), "EEE, MMM d yyyy")
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!devotionals || devotionals.length === 0) && (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
            <BookOpen className="text-copper" size={28} />
            <p className="font-display text-lg text-ink">No devotionals yet</p>
            <p className="text-sm text-ink/60">
              Start with your first devotional for the parish.
            </p>
            <Link
              href="/devotionals/new"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90"
            >
              <Plus size={16} /> New devotional
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
