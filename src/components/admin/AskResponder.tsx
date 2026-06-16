"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Lock, Send } from "lucide-react";
import { answerQuestion } from "@/app/(admin)/ask-pastor/actions";
import { cn } from "@/utils/cn";

export function AskResponder({
  id,
  requestedPrivacy,
  initialResponse,
  alreadyPublic,
}: {
  id: string;
  requestedPrivacy: string;
  initialResponse: string | null;
  alreadyPublic: boolean;
}) {
  const router = useRouter();
  const [response, setResponse] = useState(initialResponse ?? "");
  // Default the public/private choice to what the asker requested.
  const [makePublic, setMakePublic] = useState(
    initialResponse ? alreadyPublic : requestedPrivacy === "public"
  );
  const [saving, setSaving] = useState(false);

  async function onSend() {
    if (!response.trim()) {
      toast.error("Write a response before sending.");
      return;
    }
    setSaving(true);
    const result = await answerQuestion({ id, responseBody: response, makePublic });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(makePublic ? "Answered and published." : "Answer sent privately.");
    router.push("/ask-pastor");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <label className="block text-sm font-medium text-ink">Your response</label>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={7}
        placeholder="Answer with warmth and clarity."
        className="mt-1 w-full rounded-lg border border-border bg-parchment px-3 py-2 text-ink outline-none focus:border-copper"
      />

      <div className="mt-4">
        <p className="text-sm font-medium text-ink">Response visibility</p>
        <p className="text-xs text-ink/50">
          Asker requested a {requestedPrivacy} response.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMakePublic(true)}
            className={cn(
              "flex items-start gap-2 rounded-lg border p-3 text-left transition",
              makePublic
                ? "border-copper bg-copper/10"
                : "border-border hover:bg-parchment"
            )}
          >
            <Globe size={16} className="mt-0.5 text-copper" />
            <span>
              <span className="block text-sm font-medium text-ink">
                Public, anonymized
              </span>
              <span className="block text-xs text-ink/60">
                Added to the public Q&amp;A without the asker&apos;s name.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMakePublic(false)}
            className={cn(
              "flex items-start gap-2 rounded-lg border p-3 text-left transition",
              !makePublic
                ? "border-copper bg-copper/10"
                : "border-border hover:bg-parchment"
            )}
          >
            <Lock size={16} className="mt-0.5 text-copper" />
            <span>
              <span className="block text-sm font-medium text-ink">
                Private
              </span>
              <span className="block text-xs text-ink/60">
                Sent to the asker only.
              </span>
            </span>
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={onSend}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90 disabled:opacity-50"
      >
        <Send size={16} /> {initialResponse ? "Update response" : "Send response"}
      </button>
    </div>
  );
}
