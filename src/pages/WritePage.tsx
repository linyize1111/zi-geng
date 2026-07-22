import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageLoading, PageState } from "@/components/common/PageState";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  createDraft,
  downloadDraftMarkdown,
  listDeletedDrafts,
  listDrafts,
  purgeDraft,
  restoreDraft,
  softDeleteDraft,
} from "@/features/writing/draft-store";
import type { WritingDraft } from "@/features/writing/types";
import { writeDetailPath, routes } from "@/routes/paths";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("zh-TW", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function SyncBadge({ draft }: { draft: WritingDraft }) {
  const label =
    draft.syncStatus === "local-only"
      ? "僅本機"
      : draft.syncStatus === "pending"
        ? "待同步"
        : draft.syncStatus === "synced"
          ? "已同步"
          : draft.syncStatus === "conflict"
            ? "衝突"
            : "同步失敗";
  return (
    <span className="rounded bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-xs text-[var(--color-ink-muted)]">
      {label}
    </span>
  );
}

export default function WritePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = auth.user?.id;
  const [showTrash, setShowTrash] = useState(false);

  const listQuery = useQuery({
    queryKey: ["writing-drafts", userId],
    enabled: Boolean(userId),
    queryFn: () => listDrafts(userId!),
  });

  const trashQuery = useQuery({
    queryKey: ["writing-trash", userId],
    enabled: Boolean(userId) && showTrash,
    queryFn: () => listDeletedDrafts(userId!),
  });

  const createMutation = useMutation({
    mutationFn: () => createDraft({ userId: userId! }),
    onSuccess: (draft) => {
      void queryClient.invalidateQueries({ queryKey: ["writing-drafts", userId] });
      navigate(writeDetailPath(draft.id));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteDraft(userId!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["writing-drafts", userId] });
      void queryClient.invalidateQueries({ queryKey: ["writing-trash", userId] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreDraft(userId!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["writing-drafts", userId] });
      void queryClient.invalidateQueries({ queryKey: ["writing-trash", userId] });
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (id: string) => purgeDraft(userId!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["writing-trash", userId] });
    },
  });

  if (auth.status === "loading" || listQuery.isLoading) {
    return <PageLoading label="載入草稿…" />;
  }

  if (!userId) {
    return <PageState title="請先登入" description="寫作草稿存在本機，需登入後使用。" />;
  }

  if (listQuery.isError) {
    return (
      <PageState
        tone="error"
        title="無法載入草稿"
        description={listQuery.error instanceof Error ? listQuery.error.message : "請稍後重試"}
        actionLabel="重試"
        onAction={() => void listQuery.refetch()}
      />
    );
  }

  const drafts = listQuery.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">寫作</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            本機草稿自動儲存；雲端同步稍後接上。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setShowTrash((v) => !v)}>
            {showTrash ? "關閉垃圾桶" : "垃圾桶"}
          </Button>
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "建立中…" : "新建草稿"}
          </Button>
        </div>
      </header>

      {createMutation.isError ? (
        <PageState
          tone="error"
          title="無法建立草稿"
          description={
            createMutation.error instanceof Error ? createMutation.error.message : "請稍後重試"
          }
        />
      ) : null}

      {drafts.length === 0 ? (
        <PageState
          title="尚無草稿"
          description="從今日題目開始，或直接新建一篇自由寫作。"
          actionLabel="新建草稿"
          onAction={() => createMutation.mutate()}
        />
      ) : (
        <ul className="space-y-3">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--color-line)] p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={writeDetailPath(draft.id)}
                    className="truncate text-lg underline-offset-4 hover:underline"
                  >
                    {draft.title}
                  </Link>
                  <SyncBadge draft={draft} />
                </div>
                {draft.promptTitle ? (
                  <p className="text-xs text-[var(--color-ink-muted)]">題目：{draft.promptTitle}</p>
                ) : null}
                <p className="text-sm text-[var(--color-ink-muted)]">
                  {draft.wordCount} 字 · 更新於 {formatWhen(draft.updatedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(writeDetailPath(draft.id))}
                >
                  編輯
                </Button>
                <Button type="button" variant="ghost" onClick={() => downloadDraftMarkdown(draft)}>
                  匯出 MD
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm("移入垃圾桶？（本機軟刪除）")) {
                      deleteMutation.mutate(draft.id);
                    }
                  }}
                >
                  刪除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showTrash ? (
        <section className="space-y-3 rounded-lg border border-dashed border-[var(--color-line)] p-4">
          <h2 className="text-sm font-medium">垃圾桶</h2>
          {trashQuery.isLoading ? (
            <PageLoading label="載入垃圾桶…" />
          ) : (trashQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">垃圾桶是空的。</p>
          ) : (
            <ul className="space-y-3">
              {(trashQuery.data ?? []).map((draft) => (
                <li
                  key={draft.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="text-[var(--color-ink-muted)]">
                    {draft.title} · {draft.wordCount} 字
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => restoreMutation.mutate(draft.id)}
                    >
                      還原
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm("永久刪除？無法復原。")) {
                          purgeMutation.mutate(draft.id);
                        }
                      }}
                    >
                      永久刪除
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <p className="text-xs text-[var(--color-ink-muted)]">
        <Link to={routes.today} className="underline-offset-4 hover:underline">
          回今日
        </Link>
        {" · "}亦可從今日寫作題目一鍵建立草稿。
      </p>
    </div>
  );
}
