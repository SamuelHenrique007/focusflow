import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

type FeedbackVariant = "success" | "error" | "info";

type FeedbackMessageProps = {
  message: string;
  variant?: FeedbackVariant;
  className?: string;
  duration?: number;
  onClose?: () => void;
  title?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function FeedbackIcon({ variant }: { variant: FeedbackVariant }) {
  if (variant === "success") {
    return <CheckCircle2 className="h-5 w-5" />;
  }

  if (variant === "error") {
    return <AlertCircle className="h-5 w-5" />;
  }

  return <Info className="h-5 w-5" />;
}

export default function FeedbackMessage({
  message,
  variant = "info",
  className,
  duration = 4200,
  onClose,
  title,
}: FeedbackMessageProps) {
  useEffect(() => {
    if (!message || !onClose) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      wrapper:
        "border-[var(--ff-border)] bg-[var(--ff-surface)]",
      icon:
        "bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]",
      title: "text-[var(--ff-text)]",
      description: "text-[var(--ff-text-soft)]",
      close:
        "text-[var(--ff-text-muted)] hover:bg-[var(--ff-surface-soft)] hover:text-[var(--ff-text)]",
      bar: "bg-[var(--ff-primary)]",
    },
    error: {
      wrapper:
        "border-[var(--ff-border)] bg-[var(--ff-surface)]",
      icon:
        "bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]",
      title: "text-[var(--ff-text)]",
      description: "text-[var(--ff-text-soft)]",
      close:
        "text-[var(--ff-text-muted)] hover:bg-[var(--ff-surface-soft)] hover:text-[var(--ff-text)]",
      bar: "bg-[var(--ff-primary)]",
    },
    info: {
      wrapper:
        "border-[var(--ff-border)] bg-[var(--ff-surface)]",
      icon:
        "bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]",
      title: "text-[var(--ff-text)]",
      description: "text-[var(--ff-text-soft)]",
      close:
        "text-[var(--ff-text-muted)] hover:bg-[var(--ff-surface-soft)] hover:text-[var(--ff-text)]",
      bar: "bg-[var(--ff-primary)]",
    },
  }[variant];

  const resolvedTitle =
    title ??
    (variant === "success"
      ? "Sucesso"
      : variant === "error"
        ? "Erro"
        : "Aviso");

  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.div
          key={`${variant}-${message}`}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={cx(
            "relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur-sm transition-colors",
            styles.wrapper,
            className,
          )}
        >
          <div className="flex items-start gap-3 p-4 pr-12">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.08 }}
              className={cx(
                "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
                styles.icon,
              )}
            >
              <FeedbackIcon variant={variant} />
            </motion.div>

            <div className="min-w-0 flex-1">
              <p className={cx("text-sm font-semibold", styles.title)}>
                {resolvedTitle}
              </p>

              <p className={cx("mt-1 text-sm", styles.description)}>
                {message}
              </p>
            </div>
          </div>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className={cx(
                "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl transition-all hover:scale-105 active:scale-95",
                styles.close,
              )}
              aria-label="Fechar mensagem"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          {onClose ? (
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={cx("absolute bottom-0 left-0 h-1", styles.bar)}
            />
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}