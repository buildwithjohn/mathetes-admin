import { requireCapability } from "@/lib/auth";
import { HousesManager } from "@/components/admin/HousesManager";

export default async function HousesPage() {
  const { supabase, profile } = await requireCapability("houses");
  const parish = profile.parish_id!;

  const [housesRes, campusesRes, membersRes] = await Promise.all([
    supabase
      .from("houses")
      .select(
        "id, name, slug, color, verse, verse_ref, leader_id, campus_id, archived_at"
      )
      .eq("parish_id", parish)
      .order("name"),
    supabase
      .from("campuses")
      .select("id, name, slug, is_primary")
      .eq("parish_id", parish)
      .order("is_primary", { ascending: false })
      .order("name"),
    supabase
      .from("user_profiles")
      .select("id, name, house_id")
      .eq("parish_id", parish)
      .order("name"),
  ]);

  const houses = housesRes.data ?? [];
  const campuses = campusesRes.data ?? [];
  const members = (membersRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
  }));

  // Leader names + member counts per house.
  const leaderName: Record<string, string> = {};
  const memberCount: Record<string, number> = {};
  for (const m of membersRes.data ?? []) {
    leaderName[m.id] = m.name;
    if (m.house_id)
      memberCount[m.house_id] = (memberCount[m.house_id] ?? 0) + 1;
  }

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Houses</h1>
      <p className="mt-1 text-ink/60">
        Manage house fellowships per campus. Creating a house also creates its
        group chat.
      </p>
      <div className="mt-6">
        <HousesManager
          houses={houses}
          campuses={campuses}
          members={members}
          leaderName={leaderName}
          memberCount={memberCount}
        />
      </div>
    </div>
  );
}
