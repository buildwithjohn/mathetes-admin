import { requireCapability } from "@/lib/auth";
import { LibraryManager } from "@/components/admin/LibraryManager";

export default async function LibraryPage() {
  const { supabase, profile } = await requireCapability("content");

  const { data: items } = await supabase
    .from("library_items")
    .select(
      "id, kind, title, author, category, description, cover_image_url, file_url, external_url, duration_seconds, published, published_at"
    )
    .eq("parish_id", profile.parish_id!)
    .order("published", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Library</h1>
      <p className="mt-1 text-ink/60">
        Books, devotional manuals, sermons, and messages. Published items appear
        in the mobile Library.
      </p>
      <div className="mt-8">
        <LibraryManager items={items ?? []} />
      </div>
    </div>
  );
}
