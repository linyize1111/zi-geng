import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import { deactivateContent, type ContentKind } from "@/features/content/deactivate-content";
import { env } from "@/lib/env";

const KIND_LABEL: Record<ContentKind, string> = {
  vocabulary: "詞彙",
  quote: "名言",
  craft: "技巧",
  prompt: "題目",
  novel_task: "小說任務",
};

type Props = {
  kind: ContentKind;
  contentId: string;
  label?: string;
  compact?: boolean;
  /** Called after successful deactivate (e.g. refresh Today slot). */
  onRemoved?: () => void;
};

/** Owner-only: soft-delete card from active pool (`status = inactive`). */
export function OwnerRemoveCardButton({
  kind,
  contentId,
  label = "下架",
  compact,
  onRemoved,
}: Props) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const useMock = env.useMockAdapter || auth.usingMock;

  const mutation = useMutation({
    mutationFn: () => deactivateContent(kind, contentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learn-list"] });
      void queryClient.invalidateQueries({ queryKey: ["learn-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["daily-plan"] });
      void queryClient.invalidateQueries({ queryKey: ["content-pool-counts"] });
      void queryClient.invalidateQueries({ queryKey: ["owner-content-search"] });
      onRemoved?.();
    },
  });

  if (useMock || !auth.membership?.isOwner) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      className={compact ? "min-h-9 min-w-0 px-2 text-xs text-[var(--color-danger)]" : undefined}
      disabled={mutation.isPending}
      title={`從資料庫下架此${KIND_LABEL[kind]}（不再出現於今日／學習）`}
      onClick={() => {
        const ok = window.confirm(
          `確定下架這筆${KIND_LABEL[kind]}？\n會從今日與學習庫移除（status → inactive），之後不會再抽到。`,
        );
        if (ok) mutation.mutate();
      }}
    >
      {mutation.isPending ? "下架中…" : label}
    </Button>
  );
}
