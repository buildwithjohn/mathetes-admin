const CARDS = [
  { title: "Today's Word of the Day", body: "Not yet scheduled.", hint: "Schedule in Word of the Day." },
  { title: "This week's devotionals", body: "0 published, 0 scheduled.", hint: "Author in Devotionals." },
  { title: "Pending Ask Pastor", body: "0 awaiting response.", hint: "48-hour response window." },
  { title: "Engagement at a glance", body: "Connect analytics.", hint: "Coming in Phase 4." },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Welcome, Pastor Tunde</h1>
      <p className="mt-1 text-ink/60">Here is the parish at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-border bg-white p-5"
          >
            <h2 className="text-sm font-medium text-ink/70">{c.title}</h2>
            <p className="mt-2 font-display text-xl text-ink">{c.body}</p>
            <p className="mt-3 text-xs text-ink/50">{c.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
