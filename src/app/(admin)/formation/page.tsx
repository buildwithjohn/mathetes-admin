import { Compass } from "lucide-react";
import { requireCapability } from "@/lib/auth";
import { FormationManager } from "@/components/admin/FormationManager";

export default async function FormationPage() {
  const { supabase, profile } = await requireCapability("content");
  const parishId = profile.parish_id!;
  const [housesResult, campusesResult, campaignsResult, eventsResult] = await Promise.all([
    supabase.from("houses").select("id, name").eq("parish_id", parishId).is("archived_at", null).order("name"),
    supabase.from("campuses").select("id, name").eq("parish_id", parishId).order("name"),
    supabase.from("formation_campaigns").select("id, kind, title, body, scripture_ref, starts_on, ends_on, published, house_id, campus_id").eq("parish_id", parishId).order("starts_on", { ascending: false }),
    supabase.from("fellowship_events").select("id, title, description, starts_at, ends_at, location, published, house_id, campus_id").eq("parish_id", parishId).order("starts_at", { ascending: false }),
  ]);
  return <div><div className="flex items-start gap-4"><span className="rounded-2xl bg-copper/10 p-3 text-copper"><Compass size={24} /></span><div><h1 className="font-display text-3xl sm:text-4xl">Formation</h1><p className="mt-1 max-w-2xl text-ink/60">Give students warm, practical ways to grow together. Completion and RSVP are private: no pressure, rankings, or attendance scoreboard.</p></div></div><div className="mt-8"><FormationManager houses={housesResult.data ?? []} campuses={campusesResult.data ?? []} campaigns={campaignsResult.data ?? []} events={eventsResult.data ?? []} /></div></div>;
}
