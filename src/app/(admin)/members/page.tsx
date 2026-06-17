import { requireCapability } from "@/lib/auth";
import { effectiveRole } from "@/lib/roles";
import { MembersManager } from "@/components/admin/MembersManager";

export default async function MembersPage() {
  const { supabase, profile } = await requireCapability("members");

  const [membersRes, housesRes, campusesRes, deletionsRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select(
        "id, name, role, is_owner, house_id, campus_id, year, dept, phone, date_of_birth, photo_url"
      )
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
    supabase
      .from("member_deletions")
      .select("id, actor_name, target_name, target_email, target_role, created_at")
      .eq("parish_id", profile.parish_id!)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Members</h1>
      <p className="mt-1 text-ink/60">
        Onboard staff, set roles, and manage house and campus assignments.
      </p>
      <div className="mt-8">
        <MembersManager
          members={membersRes.data ?? []}
          houses={housesRes.data ?? []}
          campuses={campusesRes.data ?? []}
          actorRole={effectiveRole(profile)}
          actorId={profile.id}
          deletions={deletionsRes.data ?? []}
        />
      </div>
    </div>
  );
}
