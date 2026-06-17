"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Sun,
  BookMarked,
  Megaphone,
  Home,
  Users,
  MessageCircleQuestion,
  ShieldAlert,
  BarChart3,
  HandCoins,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devotionals", label: "Devotionals", icon: BookOpen },
  { href: "/word-of-day", label: "Word of the Day", icon: Sun },
  { href: "/reading-plans", label: "Reading Plans", icon: BookMarked },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/houses", label: "Houses", icon: Home },
  { href: "/members", label: "Members", icon: Users },
  { href: "/giving", label: "Giving", icon: HandCoins },
  { href: "/ask-pastor", label: "Ask Pastor", icon: MessageCircleQuestion },
  { href: "/moderation", label: "Moderation", icon: ShieldAlert },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
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
          </Link>
        );
      })}
    </nav>
  );
}
