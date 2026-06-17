import Link from "next/link";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { requireAdmin } from "@/lib/auth";

export default async function DashboardPage() {
  const { supabase, profile } = await requireAdmin();

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(today), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today), "yyyy-MM-dd");

  // Today's Word of the Day.
  const { data: wotd } = await supabase
    .from("word_of_day")
    .select("verse_ref, status")
    .eq("parish_id", profile.parish_id!)
    .eq("publish_date", todayStr)
    .maybeSingle();

  // This week's devotionals, counted by status.
  const { data: weekDevos } = await supabase
    .from("devotionals")
    .select("status")
    .eq("parish_id", profile.parish_id!)
    .gte("publish_date", weekStart)
    .lte("publish_date", weekEnd);

  const publishedCount =
    weekDevos?.filter((d) => d.status === "published").length ?? 0;
  const scheduledCount =
    weekDevos?.filter((d) => d.status === "scheduled").length ?? 0;

  // Awaiting Ask Pastor questions.
  const { count: awaitingCount } = await supabase
    .from("ask_questions")
    .select("id", { count: "exact", head: true })
    .eq("parish_id", profile.parish_id!)
    .eq("status", "awaiting");

  const wotdBody = wotd
    ? wotd.status === "published"
      ? `Live: ${wotd.verse_ref}`
      : `${wotd.verse_ref} (${wotd.status})`
    : "Not yet scheduled.";

  const cards = [
    {
      title: "Today's Word of the Day",
      body: wotdBody,
      hint: "Schedule in Word of the Day.",
      href: "/word-of-day",
    },
    {
      title: "This week's devotionals",
      body: `${publishedCount} published, ${scheduledCount} scheduled.`,
      hint: "Author in Devotionals.",
      href: "/devotionals",
    },
    {
      title: "Pending Ask Pastor",
      body: `${awaitingCount ?? 0} awaiting response.`,
      hint: "48-hour response window.",
      href: "/ask-pastor",
    },
    {
      title: "Engagement at a glance",
      body: "Connect analytics.",
      hint: "Coming in Phase 8.",
      href: "/analytics",
    },
  ];

  const firstName = profile.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Welcome, {firstName}</h1>
      <p className="mt-1 text-ink/60">Here is the parish at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="rounded-2xl border border-border bg-white p-5 transition hover:border-copper/40 hover:shadow-sm"
          >
            <h2 className="text-sm font-medium text-ink/70">{c.title}</h2>
            <p className="mt-2 font-display text-xl text-ink">{c.body}</p>
            <p className="mt-3 text-xs text-ink/50">{c.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
