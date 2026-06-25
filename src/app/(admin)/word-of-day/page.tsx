import { format, addDays } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { WordOfDayCalendar } from "@/components/admin/WordOfDayCalendar";

export default async function WordOfDayPage() {
  const { supabase, profile } = await requireAdmin();

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const endStr = format(addDays(today, 92), "yyyy-MM-dd");

  const { data: existing } = await supabase
    .from("word_of_day")
    .select(
      "id, verse_ref, verse_text, reflection_md, prayer_md, prompt, publish_date, status"
    )
    .eq("parish_id", profile.parish_id!)
    .gte("publish_date", todayStr)
    .lte("publish_date", endStr)
    .order("publish_date");

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Word of the Day</h1>
      <p className="mt-1 text-ink/60">
        Schedule a verse and reflection for each day. Click a day to compose.
      </p>
      <div className="mt-6">
        <WordOfDayCalendar
          existing={existing ?? []}
          todayStr={todayStr}
          monthsToShow={3}
        />
      </div>
    </div>
  );
}
