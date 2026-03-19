type FeedbackVariant = "success" | "error" | "info";

type FeedbackMessageProps = {
  message: string;
  variant?: FeedbackVariant;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function FeedbackMessage({
  message,
  variant = "info",
  className,
}: FeedbackMessageProps) {
  if (!message) return null;

  const styles = {
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div
      className={cx(
        "rounded-xl border px-4 py-3 text-sm font-medium",
        styles[variant],
        className,
      )}
    >
      {message}
    </div>
  );
}