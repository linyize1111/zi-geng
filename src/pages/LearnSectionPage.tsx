import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { FavoriteToggle } from "@/features/favorites/FavoriteToggle";
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

function favoriteType(kind: keyof typeof titles) {
  if (kind === "vocabulary") return "vocabulary" as const;
  if (kind === "quotes") return "quote" as const;
  return "craft" as const;
}

function isVocab(item: object): item is VocabListItem {
  return "term" in item;
}

function isQuote(item: object): item is QuoteListItem {
  return "display_quote" in item;
}

function isCraft(item: object): item is CraftListItem {
  return "one_liner" in item && "name" in item;
}

function QuoteDetail({ item }: { item: QuoteListItem | Record<string, unknown> }) {
  const q = item as QuoteListItem;
  const questions = Array.isArray(q.reflection_questions)
    ? (q.reflection_questions as unknown[]).map(String)
    : [];
  return (
    <article className="space-y-4">
      <blockquote className="font-[family-name:var(--font-sans)] text-2xl leading-relaxed">
        {q.display_quote}
      </blockquote>
      {q.original_quote ? (
        <p className="text-sm text-[var(--color-ink-muted)]">原文：{q.original_quote}</p>
      ) : null}
      <p className="text-sm text-[var(--color-ink-muted)]">
        {q.author_name}
        {q.work_title ? ` · ${q.work_title}` : ""}
        {q.section_title ? ` · ${q.section_title}` : ""}
        {q.publication_year ? ` · ${q.publication_year}` : ""}
      </p>
      {q.translator_name ? (
        <p className="text-xs text-[var(--color-ink-muted)]">譯者：{q.translator_name}</p>
      ) : null}
      {q.author_bio ? <p className="leading-relaxed">{q.author_bio}</p> : null}
      {q.themes?.length ? (
        <p className="text-xs text-[var(--color-ink-muted)]">主題：{q.themes.join("、")}</p>
      ) : null}
      {q.context ? (
        <section>
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">脈絡</h2>
          <p className="mt-1 leading-relaxed">{q.context}</p>
        </section>
      ) : null}
      {q.short_analysis ? (
        <section>
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">簡析</h2>
          <p className="mt-1 leading-relaxed">{q.short_analysis}</p>
        </section>
      ) : null}
      {q.deep_analysis ? (
        <section>
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">深析</h2>
          <p className="mt-1 leading-relaxed whitespace-pre-wrap">{q.deep_analysis}</p>
        </section>
      ) : null}
      {q.rhetorical_analysis ? (
        <section>
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">修辭</h2>
          <p className="mt-1 leading-relaxed">{q.rhetorical_analysis}</p>
        </section>
      ) : null}
      {q.writing_insight ? (
        <section>
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">寫作啟發</h2>
          <p className="mt-1 leading-relaxed">{q.writing_insight}</p>
        </section>
      ) : null}
      {q.counterpoint ? (
        <section>
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">限制／可反駁</h2>
          <p className="mt-1 leading-relaxed">{q.counterpoint}</p>
        </section>
      ) : null}
      {questions.length ? (
        <section>
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">延伸問題</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {q.imitation_exercise ? (
        <section>
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">仿寫</h2>
          <p className="mt-1 leading-relaxed">{q.imitation_exercise}</p>
        </section>
      ) : null}
      <p className="text-xs text-[var(--color-ink-muted)]">
        查證：{q.verification_status}
        {q.copyright_status ? ` · 授權：${q.copyright_status}` : ""}
        {q.difficulty != null ? ` · 難度 ${q.difficulty}` : ""}
      </p>
      {q.bibliography_url ? (
        <a
          href={q.bibliography_url}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm underline-offset-4 hover:underline"
        >
          來源／書目連結
        </a>
      ) : null}
    </article>
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
          <FavoriteToggle type={favoriteType(kind)} contentId={id} />
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
        {isQuote(item) ? <QuoteDetail item={item} /> : null}
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
            kind === "vocabulary" ? "請到「內容管理」匯入文學詞庫。" : "內容尚在補齊，稍後再來看。"
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
                    <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                      {row.author_name}
                      {row.themes?.length ? ` · ${row.themes.slice(0, 2).join("、")}` : ""}
                    </p>
                  </Link>
                </li>
              );
            }
            if (!isCraft(row)) return null;
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
