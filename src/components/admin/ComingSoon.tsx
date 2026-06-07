import { Hammer } from "lucide-react";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-1 text-ink/60">{description}</p>
      <div className="mt-8 flex max-w-lg flex-col items-start gap-3 rounded-2xl border border-border bg-white p-6">
        <Hammer className="text-copper" size={24} />
        <p className="font-display text-lg text-ink">Coming in {phase}</p>
        <p className="text-sm text-ink/60">
          This section is part of a later build phase. The navigation and shell
          are in place; the workflow lands when {phase} ships.
        </p>
      </div>
    </div>
  );
}
