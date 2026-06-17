import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Plus, BookMarked, Users, Layers, CircleDot } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/utils/cn";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
] as const;

const DIFFICULTY_STYLE: Record<string, string> = {
  starter: "bg-house-bethany/15 text-house-bethany",
  intermediate: "bg-copper/10 text-copper",
  deep: "bg-oxblood/10 text-oxblood",
};

export default async function ReadingPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active = FILTERS.some((f) => f.value === filter)
    ? (filter as (typeof FILTERS)[number]["value"])
    : "all";

  const { supabase, profile } = await requireAdmin();

  let query = supabase
    .from("reading_plans")
    .select(
      "id, title, slug, description, length_days, difficulty, published, published_at, cover_image_url, updated_at"
    )
    .eq("parish_id", profile.parish_id!)
    .order("updated_at", { ascending: false });
  if (active === "published") query = query.eq("published", true);
  if (active === "draft") query = query.eq("published", false);

  const { data: plans } = await query;

  // Day + subscriber counts (admins may read subscriptions, never progress).
  const [daysRes, subsRes] = await Promise.all([
    supabase.from("reading_plan_days").select("plan_id"),
    supabase.from("reading_plan_subscriptions").select("plan_id"),
  ]);
  const dayCount = new Map<string, number>();
  for (const d of daysRes.data ?? [])
    dayCount.set(d.plan_id, (dayCount.get(d.plan_id) ?? 0) + 1);
  const subCount = new Map<string, number>();
  for (const s of subsRes.data ?? [])
    subCount.set(s.plan_id, (subCount.get(s.plan_id) ?? 0) + 1);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Reading Plans</h1>
          <p className="mt-1 text-ink/60">
            Author guided, multi-day scripture and reflection journeys.
          </p>
        </div>
        <Link
          href="/reading-plans/new"
          className="inline-flex shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus size={16} /> New Plan
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/reading-plans?filter=${f.value}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition",
              active === f.value
                ? "border-copper bg-copper/10 text-copper"
                : "border-border text-ink/70 hover:bg-parchment"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(plans ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/reading-plans/${p.id}/edit`}
            className="group overflow-hidden rounded-2xl border border-border bg-surface-1 transition hover:border-copper/40 hover:shadow-sm"
          >
            <div className="relative h-32 w-full overflow-hidden bg-surface-2">
              {p.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover_image_url}
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-oxblood/15 to-copper/15">
                  <BookMarked className="text-copper/60" size={28} />
                </div>
              )}
              <span
                className={cn(
                  "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  p.published
                    ? "bg-house-bethany/90 text-white"
                    : "bg-ink/70 text-white"
                )}
              >
                <CircleDot size={11} /> {p.published ? "Published" : "Draft"}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <h2 className="flex-1 truncate font-display text-lg text-ink">
                  {p.title}
                </h2>
                {p.difficulty && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                      DIFFICULTY_STYLE[p.difficulty] ?? "bg-surface-2 text-ink/60"
                    )}
                  >
                    {p.difficulty}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-ink/60">
                {p.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-ink/50">
                <span className="inline-flex items-center gap-1">
                  <Layers size={13} /> {dayCount.get(p.id) ?? 0}/{p.length_days} days
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={13} /> {subCount.get(p.id) ?? 0}
                </span>
                <span className="ml-auto">
                  {format(parseISO(p.updated_at), "MMM d")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {(!plans || plans.length === 0) && (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-1 px-5 py-16 text-center">
          <BookMarked className="text-copper" size={28} />
          <p className="font-display text-lg text-ink">No reading plans yet</p>
          <p className="text-sm text-ink/60">
            Create a guided journey: a sequence of days, each with scripture and
            a reflection.
          </p>
          <Link
            href="/reading-plans/new"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus size={16} /> New Plan
          </Link>
        </div>
      )}
    </div>
  );
}
