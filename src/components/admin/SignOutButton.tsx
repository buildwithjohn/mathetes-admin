"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/60 transition hover:bg-parchment hover:text-ink disabled:opacity-50"
    >
      <LogOut size={16} strokeWidth={2} className="text-ink/50" />
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
