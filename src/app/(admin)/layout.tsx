import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Sun,
  Megaphone,
  Users,
  MessageCircleQuestion,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devotionals", label: "Devotionals", icon: BookOpen },
  { href: "/word-of-day", label: "Word of the Day", icon: Sun },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/members", label: "Members", icon: Users },
  { href: "/ask-pastor", label: "Ask Pastor", icon: MessageCircleQuestion },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated users; this is defense in depth.
  if (!user) redirect("/signin");

  // Role gate: only pastor/admin may enter. (Profile may not exist yet in a
  // fresh local DB; treat missing profile as not-authorized.)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("name, role")
    .eq("auth_id", user.id)
    .single();

  const role = (profile as { role?: string } | null)?.role;
  if (role !== "pastor" && role !== "admin") {
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

  return (
    <div className="flex min-h-screen bg-parchment text-ink">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-white">
        <div className="px-6 py-5">
          <span className="font-display text-2xl">Mathetes</span>
          <p className="text-xs uppercase tracking-widest text-copper">Admin</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/80 transition hover:bg-parchment"
            >
              <Icon size={18} className="text-copper" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
          <span className="text-sm font-medium">CCCFSP FUOYE</span>
          <span className="text-sm text-ink/60">
            {(profile as { name?: string } | null)?.name ?? user.email}
          </span>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
