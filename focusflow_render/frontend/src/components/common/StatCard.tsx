import React from "react";

import { cn } from "@/lib/cn";

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconTone = "bg-slate-100 text-slate-700",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconTone?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
      {/* efeito glow igual landing */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-600/10 blur-2xl transition group-hover:bg-blue-600/20" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        <div className={cn("rounded-xl p-3", iconTone)}>{icon}</div>
      </div>
    </div>
  );
}
