import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  addFavorite,
  isFavorited,
  listFavorites,
  removeFavorite,
  type FavoriteContentType,
} from "@/features/favorites/api";
import {
  getCraft,
  getQuote,
  getVocabulary,
  listCraft,
  listQuotes,
  listVocabulary,
  type CraftListItem,
  type QuoteListItem,
  type VocabListItem,
} from "@/features/learn/api";
import { createMockDailyPlanBundle } from "@/features/daily-plan/api";
import { env } from "@/lib/env";
import { routes } from "@/routes/paths";

const titles = {
  vocabulary: "詞彙",
  quotes: "名言",
  craft: "寫作技巧",
} as const;

function listPath(kind: keyof typeof titles) {
  if (kind === "vocabulary") return routes.learnVocabulary;
  if (kind === "quotes") return routes.learnQuotes;
  return routes.learnCraft;
}

function favoriteType(kind: keyof typeof titles): FavoriteContentType {
  if (kind === "vocabulary") return "vocabulary";
  if (kind === "quotes") return "quote";
  return "craft";
}

function isVocab(item: VocabListItem | QuoteListItem | CraftListItem): item is VocabListItem {
  return "term" in item;
}

function isQuote(item: VocabListItem | QuoteListItem | CraftListItem): item is QuoteListItem {
  return "display_quote" in item;
}

function isCraft(item: VocabListItem | QuoteListItem | CraftListItem): item is CraftListItem {
  return "one_liner" in item && "name" in item;
}

function FavoriteToggle({ kind, contentId }: { kind: keyof typeof titles; contentId: string }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const useMock = env.useMockAdapter || auth.usingMock;
  const type = favoriteType(kind);

  const favQuery = useQuery({
    queryKey: ["favorite-one", auth.user?.id, type, contentId],
    enabled: Boolean(auth.user) && !useMock,
    queryFn: () => isFavorited(auth.user!.id, type, contentId),
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!auth.user) throw new Error("未登入");
      if (favQuery.data) {
        const all = await listFavorites(auth.user.id);
        const hit = all.find((f) => f.content_type === type && f.content_id === contentId);
        if (hit) await removeFavorite(hit.id);
      } else {
        await addFavorite(auth.user.id, type, contentId);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["favorite-one", auth.user?.id, type, contentId],
      });
      await queryClient.invalidateQueries({ queryKey: ["favorites", auth.user?.id] });
    },
  });

  if (useMock || !auth.user) return null;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={favQuery.isLoading || toggle.isPending}
      onClick={() => toggle.mutate()}
    >
      {favQuery.data ? "取消收藏" : "加入收藏"}
    </Button>
  );
}

export default function LearnSectionPage({ kind }: { kind: keyof typeof titles }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const useMock = env.useMockAdapter || auth.usingMock;

  const listQuery = useQuery({
    queryKey: ["learn-list", kind, auth.user?.id, useMock],
    enabled: auth.status === "authenticated" && !id,
    queryFn: async () => {
      if (useMock) {
        const mock = createMockDailyPlanBundle();
        if (kind === "vocabulary") return mock.vocabulary;
        if (kind === "quotes") return mock.quote ? [mock.quote] : [];
        return mock.craft ? [mock.craft] : [];
      }
      if (kind === "vocabulary") return listVocabulary();
      if (kind === "quotes") return listQuotes();
      return listCraft();
    },
  });

  const detailQuery = useQuery({
    queryKey: ["learn-detail", kind, id, useMock],
    enabled: auth.status === "authenticated" && Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      if (useMock) {
        const mock = createMockDailyPlanBundle();
        if (kind === "vocabulary") return mock.vocabulary.find((v) => v.id === id) ?? null;
        if (kind === "quotes") return mock.quote?.id === id ? mock.quote : null;
        return mock.craft?.id === id ? mock.craft : null;
      }
      if (kind === "vocabulary") return getVocabulary(id);
      if (kind === "quotes") return getQuote(id);
      return getCraft(id);
    },
  });

  if (auth.status === "loading" || listQuery.isLoading || detailQuery.isLoading) {
    return <PageLoading label={`載入${titles[kind]}…`} />;
  }

  if (id) {
    if (detailQuery.isError) {
      return (
        <PageState
          tone="error"
          title="無法載入詳情"
          description={
            detailQuery.error instanceof Error ? detailQuery.error.message : "請稍後重試"
          }
        />
      );
    }
    const item = detailQuery.data;
    if (!item) {
      return (
        <PageState
          title="找不到內容"
          description="此筆資料不存在，或你沒有權限閱讀。"
          actionLabel="返回列表"
          onAction={() => navigate(listPath(kind))}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={listPath(kind)}
            className="text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline"
          >
            ← {titles[kind]}
          </Link>
          <FavoriteToggle kind={kind} contentId={id} />
        </div>
        {isVocab(item) ? (
          <article className="space-y-3">
            <h1 className="font-[family-name:var(--font-sans)] text-3xl">{item.term}</h1>
            {item.zhuyin ? (
              <p className="text-sm text-[var(--color-ink-muted)]">{item.zhuyin}</p>
            ) : null}
            <p className="leading-relaxed">{item.short_def}</p>
            {item.category ? (
              <p className="text-xs text-[var(--color-ink-muted)]">{item.category}</p>
            ) : null}
          </article>
        ) : null}
        {isQuote(item) ? (
          <article className="space-y-3">
            <blockquote className="font-[family-name:var(--font-sans)] text-2xl leading-relaxed">
              {item.display_quote}
            </blockquote>
            <p className="text-sm text-[var(--color-ink-muted)]">
              {item.author_name}
              {item.work_title ? ` · ${item.work_title}` : ""}
            </p>
            {item.short_analysis ? <p className="leading-relaxed">{item.short_analysis}</p> : null}
          </article>
        ) : null}
        {isCraft(item) ? (
          <article className="space-y-3">
            <h1 className="font-[family-name:var(--font-sans)] text-3xl">{item.name}</h1>
            <p className="leading-relaxed">{item.one_liner}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{item.purpose}</p>
          </article>
        ) : null}
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <PageState
        tone="error"
        title={`無法載入${titles[kind]}`}
        description={listQuery.error instanceof Error ? listQuery.error.message : "請稍後重試"}
        actionLabel="重試"
        onAction={() => void listQuery.refetch()}
      />
    );
  }

  const rows = listQuery.data ?? [];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">
          {titles[kind]}
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {rows.length ? `共 ${rows.length} 筆` : "尚無資料"}
          {useMock ? " · 離線示範" : ""}
        </p>
      </header>

      {rows.length === 0 ? (
        <PageState
          title="列表為空"
          description={
            kind === "vocabulary"
              ? "請到「內容管理」匯入文學詞庫。"
              : "內容尚在補齊，稍後再來看。"
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const href = `${listPath(kind)}/${row.id}`;
            if (isVocab(row)) {
              return (
                <li key={row.id}>
                  <Link
                    to={href}
                    className="block rounded-lg border border-[var(--color-line)] p-4 hover:bg-[var(--color-paper-2)]"
                  >
                    <p className="text-lg">{row.term}</p>
                    <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{row.short_def}</p>
                  </Link>
                </li>
              );
            }
            if (isQuote(row)) {
              return (
                <li key={row.id}>
                  <Link
                    to={href}
                    className="block rounded-lg border border-[var(--color-line)] p-4 hover:bg-[var(--color-paper-2)]"
                  >
                    <p className="line-clamp-2 text-lg leading-relaxed">{row.display_quote}</p>
                    <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{row.author_name}</p>
                  </Link>
                </li>
              );
            }
            return (
              <li key={row.id}>
                <Link
                  to={href}
                  className="block rounded-lg border border-[var(--color-line)] p-4 hover:bg-[var(--color-paper-2)]"
                >
                  <p className="text-lg">{row.name}</p>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{row.one_liner}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
