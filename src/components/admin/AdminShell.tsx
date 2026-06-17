"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import type { Capability } from "@/lib/roles";
import { cn } from "@/utils/cn";

/**
 * App shell with a responsive sidebar: a static rail on desktop (lg+) and a
 * slide-in drawer on mobile, toggled from the header. Keeps the page content
 * full width on small screens so nothing overflows.
 */
export function AdminShell({
  name,
  roleLabel,
  caps,
  children,
}: {
  name: string;
  roleLabel: string;
  caps: Capability[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (mobile nav tap).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden bg-parchment text-ink">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: drawer on mobile, static rail on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 max-w-[82%] flex-col border-r border-border bg-surface-1 transition-transform duration-200 ease-out",
          "lg:static lg:z-auto lg:w-60 lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <span className="font-display text-2xl tracking-tight">Mathetes</span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
              Admin
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-ink/50 transition hover:bg-parchment hover:text-ink lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarNav caps={caps} />
        <div className="border-t border-border p-3">
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface-1 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="-ml-1 rounded-md p-1.5 text-ink/70 transition hover:bg-parchment lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="hidden text-sm font-medium text-ink sm:inline">
            CCCFSP FUOYE
          </span>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span className="max-w-[40vw] truncate text-sm text-ink/60 sm:max-w-none">
              {name}
            </span>
            <span className="shrink-0 rounded-full bg-copper/10 px-2 py-0.5 text-[11px] font-semibold text-copper">
              {roleLabel}
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-copper text-xs font-semibold text-white">
              {name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
