"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Sun,
  BookMarked,
  Library,
  Megaphone,
  Home,
  Users,
  UserCheck,
  MessageCircleQuestion,
  ShieldAlert,
  BarChart3,
  HandCoins,
  Compass,
  type LucideIcon,
} from "lucide-react";
import type { Capability } from "@/lib/roles";
import { cn } from "@/utils/cn";

// `cap` undefined means everyone who reaches the dashboard sees it.
const NAV: { href: string; label: string; icon: LucideIcon; cap?: Capability }[] =
  [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/devotionals", label: "Devotionals", icon: BookOpen, cap: "content" },
    { href: "/word-of-day", label: "Word of the Day", icon: Sun, cap: "content" },
    {
      href: "/reading-plans",
      label: "Reading Plans",
      icon: BookMarked,
      cap: "content",
    },
    { href: "/formation", label: "Formation", icon: Compass, cap: "content" },
    {
      href: "/announcements",
      label: "Announcements",
      icon: Megaphone,
      cap: "content",
    },
    { href: "/library", label: "Library", icon: Library, cap: "content" },
    { href: "/houses", label: "Houses", icon: Home, cap: "houses" },
    { href: "/members", label: "Members", icon: Users, cap: "members" },
    {
      href: "/approvals",
      label: "Approvals",
      icon: UserCheck,
      cap: "approvals",
    },
    { href: "/giving", label: "Giving", icon: HandCoins, cap: "giving" },
    {
      href: "/ask-pastor",
      label: "Ask Pastor",
      icon: MessageCircleQuestion,
      cap: "ask_pastor",
    },
    {
      href: "/moderation",
      label: "Moderation",
      icon: ShieldAlert,
      cap: "moderation",
    },
    { href: "/analytics", label: "Analytics", icon: BarChart3, cap: "analytics" },
  ];

export function SidebarNav({
  caps,
  pendingCount = 0,
}: {
  caps: Capability[];
  pendingCount?: number;
}) {
  const pathname = usePathname();
  const items = NAV.filter((n) => !n.cap || caps.includes(n.cap));
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        const badge = href === "/approvals" && pendingCount > 0 ? pendingCount : 0;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-copper/10 text-copper"
                : "text-ink/70 hover:bg-parchment hover:text-ink"
            )}
          >
            <Icon
              size={18}
              strokeWidth={2}
              className={active ? "text-copper" : "text-ink/50"}
            />
            {label}
            {badge > 0 && (
              <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-copper/15 px-1.5 py-0.5 text-xs font-semibold text-copper">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
