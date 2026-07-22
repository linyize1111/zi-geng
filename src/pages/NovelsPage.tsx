import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { createNovel, listNovels, softDeleteNovel } from "@/features/novels/project-store";
import { novelDetailPath, routes } from "@/routes/paths";

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

export default function NovelsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = auth.user?.id;

  const listQuery = useQuery({
    queryKey: ["novel-projects", userId],
    enabled: Boolean(userId),
    queryFn: () => listNovels(userId!),
  });

  const createMutation = useMutation({
    mutationFn: () => createNovel({ userId: userId! }),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ["novel-projects", userId] });
      navigate(novelDetailPath(project.id));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteNovel(userId!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["novel-projects", userId] });
    },
  });

  if (auth.status === "loading" || listQuery.isLoading) {
    return <PageLoading label="載入小說專案…" />;
  }

  if (!userId) {
    return <PageState title="請先登入" description="小說專案存在本機，需登入後使用。" />;
  }

  if (listQuery.isError) {
    return (
      <PageState
        tone="error"
        title="無法載入小說"
        description={listQuery.error instanceof Error ? listQuery.error.message : "請稍後重試"}
        actionLabel="重試"
        onAction={() => void listQuery.refetch()}
      />
    );
  }

  const rows = listQuery.data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">小說</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            本機專案骨架（人物／章節稍後）。共 {rows.length} 本
          </p>
        </div>
        <Button
          type="button"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? "建立中…" : "新建專案"}
        </Button>
      </header>

      {rows.length === 0 ? (
        <PageState
          title="尚無小說專案"
          description="建立一本，先寫下前提與筆記。"
          actionLabel="新建專案"
          onAction={() => createMutation.mutate()}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--color-line)] p-4"
            >
              <Link to={novelDetailPath(row.id)} className="min-w-0 flex-1 space-y-1">
                <p className="text-lg">{row.title}</p>
                <p className="line-clamp-2 text-sm text-[var(--color-ink-muted)]">
                  {row.premise || "尚無前提"}
                </p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  更新於 {formatWhen(row.updatedAt)} · 僅本機
                </p>
              </Link>
              <Button
                type="button"
                variant="outline"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm(`刪除「${row.title}」？`)) deleteMutation.mutate(row.id);
                }}
              >
                刪除
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-[var(--color-ink-muted)]">
        也可從「今日」小說任務起步。{" "}
        <Link to={routes.today} className="underline-offset-4 hover:underline">
          回今日
        </Link>
      </p>
    </div>
  );
}
