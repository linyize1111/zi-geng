import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { listFavorites, removeFavorite } from "@/features/favorites/api";
import { env } from "@/lib/env";
import { routes } from "@/routes/paths";

const TYPE_LABEL: Record<string, string> = {
  vocabulary: "詞彙",
  quote: "名言",
  craft: "技巧",
  prompt: "題目",
};

const TYPE_HREF: Record<string, (id: string) => string> = {
  vocabulary: (id) => `/learn/vocabulary/${id}`,
  quote: (id) => `/learn/quotes/${id}`,
  craft: (id) => `/learn/craft/${id}`,
  prompt: () => routes.write,
};

export default function FavoritesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const useMock = env.useMockAdapter || auth.usingMock;

  const query = useQuery({
    queryKey: ["favorites", auth.user?.id],
    enabled: auth.status === "authenticated" && Boolean(auth.user) && !useMock,
    queryFn: () => listFavorites(auth.user!.id),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFavorite(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites", auth.user?.id] });
    },
  });

  if (useMock) {
    return (
      <PageState title="收藏" description="Mock 模式不連線收藏表。關閉 mock 並登入後即可使用。" />
    );
  }

  if (auth.status === "loading" || query.isLoading) {
    return <PageLoading label="載入收藏…" />;
  }

  if (query.isError) {
    return (
      <PageState
        tone="error"
        title="無法載入收藏"
        description={query.error instanceof Error ? query.error.message : "請稍後重試"}
        actionLabel="重試"
        onAction={() => void query.refetch()}
      />
    );
  }

  const rows = query.data ?? [];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">收藏</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {rows.length ? `共 ${rows.length} 筆` : "尚無收藏；可在學習詳情頁加入。"}
        </p>
      </header>

      {rows.length === 0 ? (
        <PageState
          title="還沒有收藏"
          description="到詞彙／名言／技巧詳情頁可加入收藏。"
          actionLabel="去學習"
          onAction={() => navigate(routes.learn)}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--color-line)] p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                  {TYPE_LABEL[row.content_type] ?? row.content_type}
                </p>
                <Link
                  to={TYPE_HREF[row.content_type]?.(row.content_id) ?? routes.learn}
                  className="block text-lg underline-offset-4 hover:underline"
                >
                  <span className="line-clamp-2">{row.title}</span>
                </Link>
                {row.subtitle ? (
                  <p className="line-clamp-2 text-sm text-[var(--color-ink-muted)]">
                    {row.subtitle}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(row.id)}
              >
                取消收藏
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
