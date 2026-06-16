"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { setReportStatus } from "@/app/(admin)/moderation/actions";
import type { ReportStatus } from "@/lib/db";

export function ReportActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(next: ReportStatus) {
    setBusy(true);
    const result = await setReportStatus({ id, status: next });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Marked ${next}.`);
    router.refresh();
  }

  if (status === "resolved" || status === "dismissed") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => set("open")}
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink/60 transition hover:bg-parchment disabled:opacity-50"
      >
        Reopen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {status === "open" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => set("reviewing")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-ink/70 transition hover:bg-parchment disabled:opacity-50"
        >
          <Eye size={14} /> Review
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => set("resolved")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-copper/40 bg-copper/10 px-3 py-1.5 text-sm font-medium text-copper transition hover:bg-copper/20 disabled:opacity-50"
      >
        <CheckCircle2 size={14} /> Resolve
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => set("dismissed")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-ink/60 transition hover:bg-parchment disabled:opacity-50"
      >
        <XCircle size={14} /> Dismiss
      </button>
    </div>
  );
}
