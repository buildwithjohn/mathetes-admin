import { subDays, formatISO } from "date-fns";
import {
  Users,
  Activity,
  BookOpen,
  Sun,
  Megaphone,
  MessageCircleQuestion,
  Flame,
  TrendingUp,
} from "lucide-react";
import { requireCapability } from "@/lib/auth";

export default async function AnalyticsPage() {
  const { supabase, profile } = await requireCapability("analytics");
  const parish = profile.parish_id!;
  const now = new Date();
  const since7 = formatISO(subDays(now, 7));
  const since30 = formatISO(subDays(now, 30));

  const headCount = (q: { count: number | null }) => q.count ?? 0;

  const [
    membersRes,
    campusesRes,
    devosRes,
    wotdRes,
    annRes,
    askAwaitingRes,
    askAnsweredRes,
    eventsRes,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("role, campus_id")
      .eq("parish_id", parish),
    supabase.from("campuses").select("id, name").eq("parish_id", parish),
    supabase
      .from("devotionals")
      .select("id", { count: "exact", head: true })
      .eq("parish_id", parish)
      .eq("status", "published"),
    supabase
      .from("word_of_day")
      .select("id", { count: "exact", head: true })
      .eq("parish_id", parish)
      .eq("status", "published"),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("parish_id", parish)
      .eq("status", "published"),
    supabase
      .from("ask_questions")
      .select("id", { count: "exact", head: true })
      .eq("parish_id", parish)
      .eq("status", "awaiting"),
    supabase
      .from("ask_questions")
      .select("id", { count: "exact", head: true })
      .eq("parish_id", parish)
      .eq("status", "answered"),
    supabase
      .from("engagement_events")
      .select("event_type, user_id, created_at")
      .gte("created_at", since30),
  ]);

  const members = membersRes.data ?? [];
  const campuses = campusesRes.data ?? [];
  const events = eventsRes.data ?? [];

  const events7 = events.filter((e) => e.created_at >= since7);
  const activeUsers7 = new Set(events7.map((e) => e.user_id)).size;

  const byType = new Map<string, number>();
  for (const e of events7) byType.set(e.event_type, (byType.get(e.event_type) ?? 0) + 1);
  const typeRows = [...byType.entries()].sort((a, b) => b[1] - a[1]);
  const maxType = typeRows[0]?.[1] ?? 1;

  const campusRows = campuses.map((c) => ({
    name: c.name,
    count: members.filter((m) => m.campus_id === c.id).length,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Analytics</h1>
      <p className="mt-1 text-ink/60">
        Engagement and content at a glance for the parish.
      </p>

      {/* Top stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Members" value={members.length} />
        <Stat
          icon={Activity}
          label="Active (7d)"
          value={activeUsers7}
          hint="distinct members with activity"
        />
        <Stat icon={TrendingUp} label="Events (7d)" value={events7.length} />
        <Stat icon={Flame} label="Events (30d)" value={events.length} />
      </div>

      {/* Content + Ask Pastor */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={BookOpen} label="Devotionals published" value={headCount(devosRes)} />
        <Stat icon={Sun} label="Word of the Day published" value={headCount(wotdRes)} />
        <Stat icon={Megaphone} label="Announcements published" value={headCount(annRes)} />
        <Stat
          icon={MessageCircleQuestion}
          label="Ask Pastor"
          value={headCount(askAwaitingRes)}
          hint={`${headCount(askAnsweredRes)} answered`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Engagement by type */}
        <div className="rounded-2xl border border-border bg-surface-1 p-6">
          <h2 className="font-display text-xl text-ink">Engagement by type (7d)</h2>
          <div className="mt-4 space-y-3">
            {typeRows.length === 0 && (
              <p className="text-sm text-ink/50">No activity in the last 7 days.</p>
            )}
            {typeRows.map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/70">{type.replace(/_/g, " ")}</span>
                  <span className="font-medium text-ink">{count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-copper"
                    style={{ width: `${(count / maxType) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Members by campus */}
        <div className="rounded-2xl border border-border bg-surface-1 p-6">
          <h2 className="font-display text-xl text-ink">Members by campus</h2>
          <div className="mt-4 space-y-3">
            {campusRows.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/70">{c.name}</span>
                  <span className="font-medium text-ink">{c.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-oxblood"
                    style={{
                      width: `${
                        members.length ? (c.count / members.length) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {campusRows.length === 0 && (
              <p className="text-sm text-ink/50">No campuses configured.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-5">
      <div className="flex items-center gap-2 text-ink/50">
        <Icon size={16} className="text-copper" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}
    </div>
  );
}
