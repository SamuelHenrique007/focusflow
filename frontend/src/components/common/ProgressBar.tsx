import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  barClassName,
}: {
  value: number;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ff-surface-soft)]">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          barClassName ?? "bg-[var(--ff-primary)]",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}