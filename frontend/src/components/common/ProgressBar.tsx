import React from "react";

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
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          barClassName ?? "bg-blue-600",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
