"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

/**
 * Header account control: avatar + role that opens a small menu with Sign out.
 * Works on every screen size, so logout is reachable on mobile without opening
 * the nav drawer.
 */
export function AccountMenu({
  name,
  roleLabel,
}: {
  name: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-2 pr-1 transition hover:border-border hover:bg-parchment"
      >
        <span className="hidden max-w-[28vw] truncate text-sm text-ink/60 sm:inline">
          {name}
        </span>
        <span className="shrink-0 rounded-full bg-copper/10 px-2 py-0.5 text-[11px] font-semibold text-copper">
          {roleLabel}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-copper text-xs font-semibold text-white">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <ChevronDown
          size={15}
          className={cn(
            "text-ink/40 transition",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            <p className="text-xs font-medium text-copper">{roleLabel}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={busy}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-ink/70 transition hover:bg-parchment hover:text-ink disabled:opacity-50"
          >
            <LogOut size={16} className="text-ink/50" />
            {busy ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
