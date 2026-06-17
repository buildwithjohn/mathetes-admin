"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Crown,
  GraduationCap,
  Pencil,
  MapPin,
  ShieldCheck,
  UserPlus,
  Mail,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import {
  updateMember,
  inviteStaff,
  deleteMember,
} from "@/app/(admin)/members/actions";
import type { UserRole, Tables } from "@/lib/db";
import {
  ROLE_LABEL,
  ROLE_HINT,
  effectiveRole,
  assignableRoles,
  canManageStaff,
  canEditTarget,
  type EffectiveRole,
} from "@/lib/roles";
import { cn } from "@/utils/cn";

type Member = Pick<
  Tables<"user_profiles">,
  | "id"
  | "name"
  | "role"
  | "is_owner"
  | "house_id"
  | "campus_id"
  | "year"
  | "dept"
  | "phone"
  | "date_of_birth"
  | "photo_url"
>;
type House = Pick<Tables<"houses">, "id" | "name" | "color">;
type Campus = Pick<Tables<"campuses">, "id" | "name">;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MembersManager({
  members,
  houses,
  campuses,
  actorRole,
  actorId,
}: {
  members: Member[];
  houses: House[];
  campuses: Campus[];
  actorRole: EffectiveRole;
  actorId: string;
}) {
  const router = useRouter();
  const houseById = useMemo(
    () => new Map(houses.map((h) => [h.id, h])),
    [houses]
  );
  const campusById = useMemo(
    () => new Map(campuses.map((c) => [c.id, c])),
    [campuses]
  );

  const grantable = assignableRoles(actorRole);
  const canInvite = canManageStaff(actorRole);

  const [campusFilter, setCampusFilter] = useState<string>("all");
  const visibleMembers = useMemo(() => {
    if (campusFilter === "all") return members;
    if (campusFilter === "none") return members.filter((m) => !m.campus_id);
    return members.filter((m) => m.campus_id === campusFilter);
  }, [members, campusFilter]);

  // Edit existing member
  const [editing, setEditing] = useState<Member | null>(null);
  const [role, setRole] = useState<UserRole>("member");
  const [houseId, setHouseId] = useState<string>("");
  const [campusId, setCampusId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Delete member (retype-name confirmation)
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [removing, setRemoving] = useState(false);

  // Invite new staff
  const [inviteOpen, setInviteOpen] = useState(false);
  const [iName, setIName] = useState("");
  const [iEmail, setIEmail] = useState("");
  const [iRole, setIRole] = useState<UserRole>(grantable[0] ?? "member");
  const [iCampus, setICampus] = useState("");
  const [iHouse, setIHouse] = useState("");
  const [inviting, setInviting] = useState(false);

  function openEdit(m: Member) {
    setEditing(m);
    setRole(m.role as UserRole);
    setHouseId(m.house_id ?? "");
    setCampusId(m.campus_id ?? "");
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const result = await updateMember({
      id: editing.id,
      role,
      houseId: houseId || null,
      campusId: campusId || null,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Member updated.");
    setEditing(null);
    router.refresh();
  }

  function openDelete(m: Member) {
    setDeleting(m);
    setConfirmName("");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    const result = await deleteMember({
      id: deleting.id,
      confirmName,
    });
    setRemoving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${deleting.name} deleted.`);
    setDeleting(null);
    router.refresh();
  }

  function openInvite() {
    setIName("");
    setIEmail("");
    setIRole(grantable[0] ?? "member");
    setICampus("");
    setIHouse("");
    setInviteOpen(true);
  }

  async function sendInvite() {
    setInviting(true);
    const result = await inviteStaff({
      name: iName,
      email: iEmail,
      role: iRole,
      campusId: iCampus || null,
      houseId: iHouse || null,
    });
    setInviting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Invite emailed to ${iEmail}.`);
    setInviteOpen(false);
    router.refresh();
  }

  // Role-grouped directory. Owner sits in leadership with an Owner badge.
  const groups: {
    key: string;
    label: string;
    roles: EffectiveRole[];
    icon: typeof Crown;
  }[] = [
    {
      key: "lead",
      label: "Leadership",
      roles: ["owner", "admin", "pastor", "house_leader"],
      icon: Crown,
    },
    { key: "disc", label: "Disciplers", roles: ["discipler"], icon: GraduationCap },
    { key: "mem", label: "Students", roles: ["member"], icon: Users },
  ];

  const leadershipCount = members.filter((m) =>
    ["admin", "pastor", "house_leader"].includes(m.role)
  ).length;
  const campusCounts = campuses.map((c) => ({
    name: c.name,
    count: members.filter((m) => m.campus_id === c.id).length,
  }));
  const unassignedCampus = members.filter((m) => !m.campus_id).length;

  return (
    <div className="space-y-8">
      {/* Header action */}
      {canInvite && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openInvite}
            className="inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <UserPlus size={16} /> Onboard staff
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total members" value={members.length} />
        <StatCard icon={ShieldCheck} label="Leadership" value={leadershipCount} />
        {campusCounts.map((c) => (
          <StatCard key={c.name} icon={MapPin} label={c.name} value={c.count} />
        ))}
        {unassignedCampus > 0 && (
          <StatCard icon={MapPin} label="No campus" value={unassignedCampus} />
        )}
      </div>

      {/* Campus filter */}
      {campuses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink/50">Campus</span>
          {[
            { id: "all", name: "All" },
            ...campuses,
            ...(unassignedCampus > 0 ? [{ id: "none", name: "No campus" }] : []),
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCampusFilter(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition",
                campusFilter === c.id
                  ? "border-copper bg-copper/10 text-copper"
                  : "border-border text-ink/70 hover:bg-parchment"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Grouped directory */}
      {groups.map((g) => {
        const rows = visibleMembers.filter((m) =>
          g.roles.includes(effectiveRole(m))
        );
        if (rows.length === 0) return null;
        const Icon = g.icon;
        return (
          <section key={g.key}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
              <Icon size={15} className="text-copper" /> {g.label}
              <span className="text-ink/30">({rows.length})</span>
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-1">
              {rows.map((m, i) => {
                const house = m.house_id ? houseById.get(m.house_id) : null;
                const campus = m.campus_id ? campusById.get(m.campus_id) : null;
                const mRole = effectiveRole(m);
                const editable = canEditTarget(actorRole, mRole);
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3",
                      i > 0 && "border-t border-border"
                    )}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: house?.color ?? "#A1A1AA" }}
                    >
                      {initials(m.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-medium text-ink">
                        {m.name}
                        {m.is_owner && (
                          <span className="rounded-full bg-copper/10 px-2 py-0.5 text-[11px] font-semibold text-copper">
                            Owner
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-ink/50">
                        {ROLE_LABEL[mRole]}
                        {house ? ` · ${house.name}` : ""}
                        {campus ? ` · ${campus.name}` : ""}
                        {m.dept ? ` · ${m.dept}` : ""}
                        {m.year ? ` · ${m.year}` : ""}
                        {m.phone ? ` · ${m.phone}` : ""}
                      </p>
                    </div>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-ink/70 transition hover:bg-parchment"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    )}
                    {editable && !m.is_owner && m.id !== actorId && (
                      <button
                        type="button"
                        onClick={() => openDelete(m)}
                        aria-label={`Delete ${m.name}`}
                        title="Delete member"
                        className="rounded-lg border border-border p-2 text-oxblood transition hover:bg-oxblood/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {members.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-1 px-5 py-16 text-center">
          <Users className="text-copper" size={28} />
          <p className="font-display text-lg text-ink">No members yet</p>
          <p className="text-sm text-ink/60">
            Onboard staff above, or members appear here once they join from the
            mobile app.
          </p>
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : "Edit member"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            >
              {grantable.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink/50">{ROLE_HINT[role]}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">House</label>
            <select
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            >
              <option value="">No house</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Campus</label>
            <select
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            >
              <option value="">No campus</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-parchment"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation (retype name) */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete member?"
      >
        {deleting && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-oxblood/25 bg-oxblood/5 px-3 py-3 text-sm text-oxblood">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                This permanently deletes <strong>{deleting.name}</strong> from
                Mathetes: their sign-in, mobile account, and personal data
                (messages, notes, streaks, giving history). Content they authored
                is kept. This cannot be undone.
              </span>
            </div>
            <div>
              <label className="block text-sm text-ink/70">
                Type{" "}
                <span className="font-semibold text-ink">{deleting.name}</span>{" "}
                to confirm.
              </label>
              <input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoFocus
                autoComplete="off"
                placeholder={deleting.name}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-oxblood"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-parchment"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing || confirmName !== deleting.name}
                onClick={confirmDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-oxblood px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={15} />
                {removing ? "Deleting..." : "Delete this member"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Onboard staff"
        side="right"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-copper/30 bg-copper/5 px-3 py-2 text-sm text-copper">
            <Mail size={16} className="mt-0.5 shrink-0" />
            <span>
              They get an email to set their password. That login works on both
              the admin dashboard and the mobile app.
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Name</label>
            <input
              value={iName}
              onChange={(e) => setIName(e.target.value)}
              placeholder="Jane Adewale"
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              value={iEmail}
              onChange={(e) => setIEmail(e.target.value)}
              placeholder="jane@example.com"
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Role</label>
            <select
              value={iRole}
              onChange={(e) => setIRole(e.target.value as UserRole)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            >
              {grantable.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink/50">{ROLE_HINT[iRole]}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink">Campus</label>
              <select
                value={iCampus}
                onChange={(e) => setICampus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
              >
                <option value="">None</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">House</label>
              <select
                value={iHouse}
                onChange={(e) => setIHouse(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
              >
                <option value="">None</option>
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-parchment"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={inviting}
              onClick={sendInvite}
              className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send invite"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-5">
      <div className="flex items-center gap-2 text-ink/50">
        <Icon size={16} className="text-copper" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}
