import React from "react";

import { cn } from "@/lib/cn";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  className?: string;
}) {
  const map: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
    danger: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        map[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
