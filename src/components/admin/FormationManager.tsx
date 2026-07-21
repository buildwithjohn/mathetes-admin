"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Flag, Loader2, MapPin, Sparkles, Trash2 } from "lucide-react";
import {
  deleteFormationItem,
  saveFellowshipEvent,
  saveFormationCampaign,
} from "@/app/(admin)/formation/actions";
import type { Tables } from "@/lib/db";

type Scope = { id: string; name: string };
type Campaign = Pick<Tables<"formation_campaigns">, "id" | "kind" | "title" | "body" | "scripture_ref" | "starts_on" | "ends_on" | "published" | "house_id" | "campus_id">;
type Event = Pick<Tables<"fellowship_events">, "id" | "title" | "description" | "starts_at" | "ends_at" | "location" | "published" | "house_id" | "campus_id">;

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function localDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function localToIso(value: string) {
  return new Date(value).toISOString();
}
function scopeName(item: { house_id: string | null; campus_id: string | null }, houses: Scope[], campuses: Scope[]) {
  if (item.house_id) return houses.find((h) => h.id === item.house_id)?.name ?? "House";
  if (item.campus_id) return campuses.find((c) => c.id === item.campus_id)?.name ?? "Campus";
  return "Whole parish";
}

export function FormationManager({
  houses,
  campuses,
  campaigns,
  events,
}: {
  houses: Scope[];
  campuses: Scope[];
  campaigns: Campaign[];
  events: Event[];
}) {
  const [campaignKind, setCampaignKind] = useState<"house_quest" | "campus_mission">("house_quest");
  const [campaignScope, setCampaignScope] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [campaignRef, setCampaignRef] = useState("");
  const [campaignStart, setCampaignStart] = useState(today());
  const [campaignEnd, setCampaignEnd] = useState(today());
  const [campaignPublished, setCampaignPublished] = useState(true);
  const [eventScopeKind, setEventScopeKind] = useState<"parish" | "house" | "campus">("parish");
  const [eventScope, setEventScope] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStarts, setEventStarts] = useState(localDateTime());
  const [eventEnds, setEventEnds] = useState("");
  const [eventPublished, setEventPublished] = useState(true);
  const [saving, setSaving] = useState<"campaign" | "event" | null>(null);

  const campaignScopes = campaignKind === "house_quest" ? houses : campuses;
  const eventScopes = eventScopeKind === "house" ? houses : campuses;

  async function createCampaign() {
    if (!campaignScope) return toast.error(`Choose a ${campaignKind === "house_quest" ? "house" : "campus"}.`);
    setSaving("campaign");
    const result = await saveFormationCampaign({
      kind: campaignKind, scopeId: campaignScope, title: campaignTitle, body: campaignBody,
      scriptureRef: campaignRef, startsOn: campaignStart, endsOn: campaignEnd, published: campaignPublished,
    });
    setSaving(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(campaignPublished ? "Shared practice published." : "Practice saved as a draft.");
    setCampaignTitle(""); setCampaignBody(""); setCampaignRef(""); setCampaignScope("");
  }

  async function createEvent() {
    if (eventScopeKind !== "parish" && !eventScope) return toast.error("Choose who should see this event.");
    setSaving("event");
    const result = await saveFellowshipEvent({
      scopeKind: eventScopeKind, scopeId: eventScope || undefined, title: eventTitle,
      description: eventDescription, location: eventLocation, startsAt: localToIso(eventStarts),
      endsAt: eventEnds ? localToIso(eventEnds) : "", published: eventPublished,
    });
    setSaving(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(eventPublished ? "Fellowship event published." : "Event saved as a draft.");
    setEventTitle(""); setEventDescription(""); setEventLocation(""); setEventScope("");
  }

  async function remove(table: "campaign" | "event", id: string) {
    if (!window.confirm("Remove this item? Members will no longer see it.")) return;
    const result = await deleteFormationItem(table, id);
    if (!result.ok) toast.error(result.error);
    else toast.success("Removed.");
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={(e) => { e.preventDefault(); void createCampaign(); }} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3"><span className="rounded-xl bg-copper/10 p-2 text-copper"><Flag size={20} /></span><div><h2 className="font-display text-xl text-ink">Shared practice</h2><p className="mt-0.5 text-sm text-ink/60">A gentle action students can choose to complete. No public scores.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Type"><select value={campaignKind} onChange={(e) => { setCampaignKind(e.target.value as typeof campaignKind); setCampaignScope(""); }} className="input"><option value="house_quest">House Quest</option><option value="campus_mission">Campus Mission</option></select></Field>
            <Field label={campaignKind === "house_quest" ? "House" : "Campus"}><select value={campaignScope} onChange={(e) => setCampaignScope(e.target.value)} className="input"><option value="">Choose…</option>{campaignScopes.map((scope) => <option key={scope.id} value={scope.id}>{scope.name}</option>)}</select></Field>
          </div>
          <Field label="Title" className="mt-4"><input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} placeholder="Pray for one person in our house" className="input" /></Field>
          <Field label="The invitation" className="mt-4"><textarea value={campaignBody} onChange={(e) => setCampaignBody(e.target.value)} rows={3} placeholder="Keep it concrete, encouraging, and easy to start." className="input resize-y" /></Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Scripture (optional)"><input value={campaignRef} onChange={(e) => setCampaignRef(e.target.value)} placeholder="Galatians 6:2" className="input" /></Field><Field label="Starts"><input type="date" value={campaignStart} onChange={(e) => setCampaignStart(e.target.value)} className="input" /></Field><Field label="Ends"><input type="date" value={campaignEnd} onChange={(e) => setCampaignEnd(e.target.value)} className="input" /></Field></div>
          <PublishToggle checked={campaignPublished} onChange={setCampaignPublished} />
          <button disabled={saving === "campaign"} className="primary-button mt-5">{saving === "campaign" && <Loader2 size={16} className="animate-spin" />}{campaignPublished ? "Publish practice" : "Save draft"}</button>
        </form>

        <form onSubmit={(e) => { e.preventDefault(); void createEvent(); }} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3"><span className="rounded-xl bg-sky/10 p-2 text-sky"><CalendarDays size={20} /></span><div><h2 className="font-display text-xl text-ink">Fellowship event</h2><p className="mt-0.5 text-sm text-ink/60">Students receive a simple card and can RSVP privately.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Audience"><select value={eventScopeKind} onChange={(e) => { setEventScopeKind(e.target.value as typeof eventScopeKind); setEventScope(""); }} className="input"><option value="parish">Whole parish</option><option value="house">One house</option><option value="campus">One campus</option></select></Field>{eventScopeKind !== "parish" && <Field label={eventScopeKind === "house" ? "House" : "Campus"}><select value={eventScope} onChange={(e) => setEventScope(e.target.value)} className="input"><option value="">Choose…</option>{eventScopes.map((scope) => <option key={scope.id} value={scope.id}>{scope.name}</option>)}</select></Field>}</div>
          <Field label="Title" className="mt-4"><input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="House fellowship this Friday" className="input" /></Field>
          <Field label="What should students expect?" className="mt-4"><textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={3} placeholder="A short, warm invitation is enough." className="input resize-y" /></Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Starts"><input type="datetime-local" value={eventStarts} onChange={(e) => setEventStarts(e.target.value)} className="input" /></Field><Field label="Ends (optional)"><input type="datetime-local" value={eventEnds} onChange={(e) => setEventEnds(e.target.value)} className="input" /></Field></div>
          <Field label="Location (optional)" className="mt-4"><input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Faculty of Arts lecture theatre" className="input" /></Field>
          <PublishToggle checked={eventPublished} onChange={setEventPublished} />
          <button disabled={saving === "event"} className="primary-button mt-5">{saving === "event" && <Loader2 size={16} className="animate-spin" />}{eventPublished ? "Publish event" : "Save draft"}</button>
        </form>
      </section>

      <section><div className="flex items-center gap-2"><Sparkles className="text-copper" size={18} /><h2 className="font-display text-2xl text-ink">Shared practices</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2">{campaigns.map((item) => <article key={item.id} className="rounded-xl border border-border bg-white p-4"><div className="flex items-start gap-3"><span className="rounded-lg bg-copper/10 p-2 text-copper"><Flag size={16} /></span><div className="min-w-0 flex-1"><div className="flex gap-2"><h3 className="font-medium text-ink">{item.title}</h3><Status published={item.published} /></div><p className="mt-1 text-sm text-ink/60">{item.kind === "house_quest" ? "House Quest" : "Campus Mission"} · {scopeName(item, houses, campuses)} · {item.starts_on}–{item.ends_on}</p>{item.scripture_ref && <p className="mt-2 text-sm font-medium text-copper">{item.scripture_ref}</p>}</div><button onClick={() => void remove("campaign", item.id)} className="rounded-lg p-2 text-ink/35 transition hover:bg-oxblood/10 hover:text-oxblood" aria-label="Remove practice"><Trash2 size={16} /></button></div></article>)}{campaigns.length === 0 && <Empty icon={<Flag size={19} />} text="No shared practices yet." />}</div></section>
      <section><div className="flex items-center gap-2"><CalendarDays className="text-sky" size={18} /><h2 className="font-display text-2xl text-ink">Fellowship events</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2">{events.map((item) => <article key={item.id} className="rounded-xl border border-border bg-white p-4"><div className="flex items-start gap-3"><span className="rounded-lg bg-sky/10 p-2 text-sky"><CalendarDays size={16} /></span><div className="min-w-0 flex-1"><div className="flex gap-2"><h3 className="font-medium text-ink">{item.title}</h3><Status published={item.published} /></div><p className="mt-1 text-sm text-ink/60">{scopeName(item, houses, campuses)} · {new Date(item.starts_at).toLocaleString()}</p>{item.location && <p className="mt-2 inline-flex items-center gap-1 text-sm text-ink/60"><MapPin size={13} />{item.location}</p>}</div><button onClick={() => void remove("event", item.id)} className="rounded-lg p-2 text-ink/35 transition hover:bg-oxblood/10 hover:text-oxblood" aria-label="Remove event"><Trash2 size={16} /></button></div></article>)}{events.length === 0 && <Empty icon={<CalendarDays size={19} />} text="No fellowship events yet." />}</div></section>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block ${className}`}><span className="block text-sm font-medium text-ink">{label}</span><span className="mt-1 block">{children}</span></label>; }
function PublishToggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) { return <label className="mt-5 flex cursor-pointer items-center gap-2 rounded-lg bg-parchment px-3 py-2 text-sm text-ink"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-copper" /><CheckCircle2 size={16} className="text-copper" />Publish now</label>; }
function Status({ published }: { published: boolean }) { return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${published ? "bg-house-bethany/15 text-house-bethany" : "bg-ink/8 text-ink/55"}`}>{published ? "Published" : "Draft"}</span>; }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface-1 px-4 py-8 text-sm text-ink/55">{icon}{text}</div>; }
