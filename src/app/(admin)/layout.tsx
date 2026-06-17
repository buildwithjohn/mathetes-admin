import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { SignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shared (cached) per-request lookup; pages reuse this same result.
  const { user, profile } = await getAdminContext();

  // Middleware already redirects unauthenticated users; defense in depth.
  if (!user) redirect("/signin");

  // Role gate: only pastor/admin may enter.
  if (profile?.role !== "pastor" && profile?.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-parchment px-6 text-center">
        <div>
          <h1 className="font-display text-3xl text-ink">Not authorized</h1>
          <p className="mt-2 text-ink/60">
            This area is for the pastor and content team only.
          </p>
        </div>
      </main>
    );
  }

  const name = profile?.name ?? user.email;

  return (
    <div className="flex h-screen overflow-hidden bg-parchment text-ink">
      <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface-1">
        <div className="px-6 py-5">
          <span className="font-display text-2xl tracking-tight">Mathetes</span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
            Admin
          </p>
        </div>
        <SidebarNav />
        <div className="border-t border-border p-3">
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface-1 px-8 py-3">
          <span className="text-sm font-medium text-ink">CCCFSP FUOYE</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink/60">{name}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-copper text-xs font-semibold text-white">
              {(name ?? "?").slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
