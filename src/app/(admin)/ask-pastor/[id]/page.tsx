import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, AlertTriangle, Lock, Globe } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AskResponder } from "@/components/admin/AskResponder";

export default async function AskPastorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireAdmin();

  const { data: question } = await supabase
    .from("ask_questions")
    .select(
      "id, body, category, privacy, urgent, status, response_body, created_at, asker_id"
    )
    .eq("id", id)
    .eq("parish_id", profile.parish_id!)
    .single();

  if (!question) notFound();

  const { data: asker } = await supabase
    .from("user_profiles")
    .select("name")
    .eq("id", question.asker_id)
    .single();

  return (
    <div className="max-w-3xl">
      <Link
        href="/ask-pastor"
        className="inline-flex items-center gap-1 text-sm text-ink/60 transition hover:text-copper"
      >
        <ArrowLeft size={15} /> Ask Pastor
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center gap-2 text-xs text-ink/50">
          {question.urgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-oxblood/10 px-2 py-0.5 text-oxblood">
              <AlertTriangle size={12} /> Urgent
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            {question.privacy === "private" ? (
              <>
                <Lock size={12} /> Requested private
              </>
            ) : (
              <>
                <Globe size={12} /> Requested public
              </>
            )}
          </span>
          {question.category && <span>· {question.category}</span>}
          <span className="ml-auto">
            {format(parseISO(question.created_at), "MMM d yyyy, h:mm a")}
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-lg text-ink">
          {question.body}
        </p>
        <p className="mt-3 text-sm text-ink/50">
          From {asker?.name ?? "Unknown"}
        </p>
      </div>

      <div className="mt-5">
        <AskResponder
          id={question.id}
          requestedPrivacy={question.privacy}
          initialResponse={question.response_body}
          alreadyPublic={question.privacy === "public"}
        />
      </div>
    </div>
  );
}
