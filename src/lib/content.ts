import type { ContentStatus } from "@/lib/db";

// Average adult reading speed; used to auto-suggest reading time.
const WORDS_PER_MINUTE = 200;

/** Strip light markdown syntax to a rough plain-text word count. */
export function wordCount(markdown: string): number {
  const text = markdown
    .replace(/`{1,3}[^`]*`{1,3}/g, " ") // code
    .replace(/[#>*_~\-]+/g, " ") // markdown punctuation
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links -> label
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(" ").length;
}

/** Reading time in whole minutes (minimum 1 when there is any content). */
export function readingTimeMinutes(markdown: string): number {
  const words = wordCount(markdown);
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

// Tailwind classes for status pills, on the parchment surface.
export const STATUS_STYLE: Record<ContentStatus, string> = {
  draft: "bg-parchment text-ink/60 border-border",
  scheduled: "bg-copper/10 text-copper border-copper/30",
  published: "bg-house-bethany/15 text-house-bethany border-house-bethany/40",
};

/** Parse one scripture reference per line / comma into a clean list. */
export function parseScriptureRefs(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((r) => r.trim())
    .filter(Boolean);
}
