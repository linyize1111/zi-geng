import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLoading, PageState } from "@/components/common/PageState";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  createDraft,
  downloadDraftMarkdown,
  getDraft,
  softDeleteDraft,
  updateDraft,
} from "@/features/writing/draft-store";
import { useAutosave } from "@/features/writing/use-autosave";
import type { WritingDraft } from "@/features/writing/types";
import { countWords, toPlainText } from "@/features/writing/word-count";
import { routes, writeDetailPath } from "@/routes/paths";

type EditorSnapshot = { title: string; contentMd: string };

function statusLabel(
  status: "idle" | "dirty" | "saving" | "saved" | "error",
  online: boolean,
): string {
  if (status === "saving") return "儲存中…";
  if (status === "error") return "儲存失敗";
  if (status === "dirty") return "尚未儲存";
  if (status === "saved" || status === "idle") {
    return online ? "已存於本機（尚未雲端同步）" : "離線 · 已存於本機";
  }
  return "已存於本機";
}

function WriteEditorForm({
  draft,
  userId,
  online,
}: {
  draft: WritingDraft;
  userId: string;
  online: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(draft.title);
  const [contentMd, setContentMd] = useState(draft.contentMd);

  const snapshot = useMemo<EditorSnapshot>(() => ({ title, contentMd }), [title, contentMd]);
  const liveWordCount = useMemo(() => countWords(toPlainText(contentMd)), [contentMd]);

  const autosave = useAutosave({
    value: snapshot,
    enabled: true,
    delayMs: 400,
    save: async (next) => {
      await updateDraft(userId, draft.id, next);
      void queryClient.invalidateQueries({ queryKey: ["writing-drafts", userId] });
      void queryClient.invalidateQueries({ queryKey: ["writing-draft", userId, draft.id] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-ink-muted)]">
        <Link to={routes.write} className="underline-offset-4 hover:underline">
          ← 寫作列表
        </Link>
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          <span>{liveWordCount} 字</span>
          <span>{statusLabel(autosave.status, online)}</span>
          {autosave.error ? (
            <span className="text-[var(--color-danger)]">{autosave.error}</span>
          ) : null}
        </div>
      </div>

      {draft.promptTitle ? (
        <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-4 py-3 text-sm text-[var(--color-ink-muted)]">
          今日題目：{draft.promptTitle}
        </p>
      ) : null}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => void autosave.flush()}
        placeholder="標題"
        className="w-full border-0 border-b border-[var(--color-line)] bg-transparent py-2 font-[family-name:var(--font-sans)] text-2xl outline-none placeholder:text-[var(--color-ink-muted)]"
        aria-label="標題"
      />

      <textarea
        value={contentMd}
        onChange={(e) => setContentMd(e.target.value)}
        onBlur={() => void autosave.flush()}
        placeholder="開始寫作…（支援 Markdown）"
        rows={18}
        className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] p-4 font-mono text-sm leading-relaxed outline-none focus:border-[var(--color-accent)]"
        aria-label="內文"
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void autosave.flush()}>
          立即儲存
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadDraftMarkdown({
              ...draft,
              title,
              contentMd,
            })
          }
        >
          匯出 Markdown
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate(routes.write)}>
          完成
        </Button>
      </div>
    </div>
  );
}

export default function WriteEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = auth.user?.id;
  const [createError, setCreateError] = useState<string | null>(null);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!isNew || !userId) return;
    let cancelled = false;
    setCreateError(null);
    void createDraft({ userId })
      .then(async (draft) => {
        if (cancelled) {
          await softDeleteDraft(userId, draft.id);
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ["writing-drafts", userId] });
        navigate(writeDetailPath(draft.id), { replace: true });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCreateError(err instanceof Error ? err.message : "無法建立草稿");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, userId, navigate, queryClient]);

  const draftQuery = useQuery({
    queryKey: ["writing-draft", userId, id],
    enabled: Boolean(userId && id && !isNew),
    queryFn: () => getDraft(userId!, id!),
  });

  if (auth.status === "loading") {
    return <PageLoading label="載入中…" />;
  }

  if (!userId) {
    return <PageState title="請先登入" description="寫作草稿存在本機，需登入後使用。" />;
  }

  if (isNew) {
    if (createError) {
      return (
        <PageState
          tone="error"
          title="無法建立草稿"
          description={createError}
          actionLabel="回列表"
          onAction={() => navigate(routes.write)}
        />
      );
    }
    return <PageLoading label="建立草稿…" />;
  }

  if (draftQuery.isLoading) {
    return <PageLoading label="載入草稿…" />;
  }

  if (draftQuery.isError) {
    return (
      <PageState
        tone="error"
        title="無法載入草稿"
        description={draftQuery.error instanceof Error ? draftQuery.error.message : "請稍後重試"}
        actionLabel="回列表"
        onAction={() => navigate(routes.write)}
      />
    );
  }

  if (!draftQuery.data) {
    return (
      <PageState
        title="找不到草稿"
        description="可能已刪除，或屬於其他帳號。"
        actionLabel="回列表"
        onAction={() => navigate(routes.write)}
      />
    );
  }

  return (
    <WriteEditorForm
      key={draftQuery.data.id}
      draft={draftQuery.data}
      userId={userId}
      online={online}
    />
  );
}
