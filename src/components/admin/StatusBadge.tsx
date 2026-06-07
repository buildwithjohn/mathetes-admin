import type { ContentStatus } from "@/lib/database.types";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/content";
import { cn } from "@/utils/cn";

export function StatusBadge({
  status,
  className,
}: {
  status: ContentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLE[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
