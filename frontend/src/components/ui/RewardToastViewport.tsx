import { useEffect } from "react";
import { Award, CheckCircle2, Coins, Sparkles, TrendingUp, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { useToastStore, type ToastItem } from "@/store/useToastStore";

function ToastIcon({ title }: { title: string }) {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("moeda")) {
    return <Coins className="h-5 w-5" />;
  }

  if (lowerTitle.includes("nível") || lowerTitle.includes("level")) {
    return <TrendingUp className="h-5 w-5" />;
  }

  if (lowerTitle.includes("conquista") || lowerTitle.includes("badge")) {
    return <Award className="h-5 w-5" />;
  }

  if (lowerTitle.includes("desafio")) {
    return <CheckCircle2 className="h-5 w-5" />;
  }

  return <Sparkles className="h-5 w-5" />;
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration ?? 4200);

    return () => window.clearTimeout(timer);
  }, [removeToast, toast.duration, toast.id]);

  const styles = {
    success: {
      wrapper: "border-emerald-200 bg-white",
      icon: "bg-emerald-50 text-emerald-600",
      title: "text-slate-900",
      description: "text-slate-600",
      close: "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
      bar: "bg-emerald-500",
    },
    info: {
      wrapper: "border-blue-200 bg-white",
      icon: "bg-blue-50 text-blue-600",
      title: "text-slate-900",
      description: "text-slate-600",
      close: "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
      bar: "bg-blue-500",
    },
    error: {
      wrapper: "border-red-200 bg-white",
      icon: "bg-red-50 text-red-600",
      title: "text-slate-900",
      description: "text-slate-600",
      close: "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
      bar: "bg-red-500",
    },
  }[toast.variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300",
        styles.wrapper,
      )}
    >
      <div className="flex items-start gap-3 p-4 pr-12">
        <div className={cn("mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl", styles.icon)}>
          <ToastIcon title={toast.title} />
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", styles.title)}>{toast.title}</p>
          {toast.description ? (
            <p className={cn("mt-1 text-sm", styles.description)}>{toast.description}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className={cn(
          "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl transition",
          styles.close,
        )}
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>

      <div className={cn("h-1 w-full", styles.bar)} />
    </div>
  );
}

export default function RewardToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastCard toast={toast} />
        </div>
      ))}
    </div>
  );
}
