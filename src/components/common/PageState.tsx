import { Button } from "@/components/common/Button";

type PageStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "default" | "error" | "offline";
};

export function PageState({
  title,
  description,
  actionLabel,
  onAction,
  tone = "default",
}: PageStateProps) {
  const toneClass =
    tone === "error"
      ? "border-[var(--color-danger)]/40"
      : tone === "offline"
        ? "border-[var(--color-accent)]/40"
        : "border-[var(--color-line)]";

  return (
    <div
      className={`rounded-lg border ${toneClass} bg-[var(--color-paper-2)] p-6 text-center`}
      role={tone === "error" ? "alert" : "status"}
    >
      <h2 className="font-[family-name:var(--font-sans)] text-xl tracking-wide">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-4 flex justify-center">
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function PageLoading({ label = "載入中…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-40 items-center justify-center text-[var(--color-ink-muted)]"
      role="status"
    >
      <span className="animate-pulse">{label}</span>
    </div>
  );
}
