import type { ContentStatus } from "@/lib/db";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/content";
import { cn } from "@/utils/cn";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  // DB row statuses are typed loosely as string; narrow to the domain enum
  // (the CHECK constraint guarantees the value).
  const s = status as ContentStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLE[s],
        className
      )}
    >
      {STATUS_LABEL[s]}
    </span>
  );
}
