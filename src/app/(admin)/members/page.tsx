import { requireAdmin } from "@/lib/auth";
import { MembersManager } from "@/components/admin/MembersManager";

export default async function MembersPage() {
  const { supabase, profile } = await requireAdmin();

  const [membersRes, housesRes, campusesRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id, name, role, house_id, campus_id, year, dept, phone, date_of_birth, photo_url")
      .eq("parish_id", profile.parish_id!)
      .order("name"),
    supabase
      .from("houses")
      .select("id, name, color")
      .eq("parish_id", profile.parish_id!)
      .order("name"),
    supabase
      .from("campuses")
      .select("id, name")
      .eq("parish_id", profile.parish_id!)
      .order("name"),
  ]);

  return (
    <div>
      <h1 className="font-display text-4xl">Members</h1>
      <p className="mt-1 text-ink/60">
        Manage roles, house assignments, and campuses across the parish.
      </p>
      <div className="mt-8">
        <MembersManager
          members={membersRes.data ?? []}
          houses={housesRes.data ?? []}
          campuses={campusesRes.data ?? []}
        />
      </div>
    </div>
  );
}
