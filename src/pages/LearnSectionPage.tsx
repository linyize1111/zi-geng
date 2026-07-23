import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { OwnerRemoveCardButton } from "@/features/content/OwnerRemoveCardButton";
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
import { VOCAB_FILTER_ORDER, vocabTopCategory } from "@/features/learn/vocab-categories";
import { VocabStudyPanel } from "@/features/learn/VocabStudyPanel";
import { env } from "@/lib/env";
import { routes } from "@/routes/paths";

function vocabSubCategory(category: string | null | undefined): string {
  if (!category) return "通用";
  const parts = category.split("・");
  return parts[1]?.trim() || "通用";
}

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

function removeKind(kind: keyof typeof titles) {
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
  const [catFilter, setCatFilter] = useState<string>("全部");
  const [subFilter, setSubFilter] = useState<string>("全部");
  const [vocabMode, setVocabMode] = useState<"browse" | "random" | "themes">("browse");
  const [listLimit, setListLimit] = useState(80);

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

  const rows = listQuery.data ?? [];
  const vocabCats = useMemo(() => {
    if (kind !== "vocabulary") return [] as { name: string; count: number }[];
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (!isVocab(row)) continue;
      const top = vocabTopCategory(row.category);
      counts.set(top, (counts.get(top) ?? 0) + 1);
    }
    const ordered = VOCAB_FILTER_ORDER.filter((name) => (counts.get(name) ?? 0) > 0).map(
      (name) => ({
        name,
        count: counts.get(name)!,
      }),
    );
    const rest = [...counts.entries()]
      .filter(([name]) => !VOCAB_FILTER_ORDER.includes(name as (typeof VOCAB_FILTER_ORDER)[number]))
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    return [...ordered, ...rest];
  }, [kind, rows]);

  const vocabSubs = useMemo(() => {
    if (kind !== "vocabulary" || catFilter === "全部")
      return [] as { name: string; count: number }[];
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (!isVocab(row) || vocabTopCategory(row.category) !== catFilter) continue;
      const sub = vocabSubCategory(row.category);
      counts.set(sub, (counts.get(sub) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
      .map(([name, count]) => ({ name, count }));
  }, [kind, rows, catFilter]);

  const visibleRows = useMemo(() => {
    if (kind !== "vocabulary") return rows;
    return rows.filter((row) => {
      if (!isVocab(row)) return false;
      if (catFilter !== "全部" && vocabTopCategory(row.category) !== catFilter) return false;
      if (subFilter !== "全部" && vocabSubCategory(row.category) !== subFilter) return false;
      return true;
    });
  }, [rows, kind, catFilter, subFilter]);

  const pagedRows = useMemo(() => {
    if (kind === "vocabulary" && vocabMode !== "browse") return [] as typeof visibleRows;
    return visibleRows.slice(0, listLimit);
  }, [visibleRows, listLimit, kind, vocabMode]);

  useEffect(() => {
    setListLimit(80);
  }, [catFilter, subFilter, vocabMode, kind]);

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
          <div className="flex flex-wrap items-center gap-2">
            <FavoriteToggle type={favoriteType(kind)} contentId={id} />
            <OwnerRemoveCardButton
              kind={removeKind(kind)}
              contentId={id}
              label="從庫中下架"
              onRemoved={() => navigate(listPath(kind))}
            />
          </div>
        </div>
        {isVocab(item) ? (
          <article className="space-y-4">
            <h1 className="font-[family-name:var(--font-sans)] text-3xl">{item.term}</h1>
            {item.zhuyin ? (
              <p className="text-sm text-[var(--color-ink-muted)]">{item.zhuyin}</p>
            ) : null}
            {item.category || item.part_of_speech ? (
              <p className="text-xs text-[var(--color-ink-muted)]">
                {[
                  item.category,
                  item.part_of_speech,
                  item.difficulty ? `難度 ${item.difficulty}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            <p className="leading-relaxed">{item.short_def}</p>
            {item.long_def && item.long_def !== item.short_def ? (
              <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
                {item.long_def}
              </p>
            ) : null}
            {item.usage_context ? (
              <p className="text-sm">
                <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                  用法　
                </span>
                {item.usage_context}
              </p>
            ) : null}
            {item.daily_example ? (
              <p className="text-sm">
                <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                  日常例　
                </span>
                {item.daily_example}
              </p>
            ) : null}
            {item.literary_example ? (
              <p className="text-sm">
                <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                  書面例　
                </span>
                {item.literary_example}
              </p>
            ) : null}
          </article>
        ) : null}
        {isQuote(item) ? <QuoteDetail item={item} /> : null}
        {isCraft(item) ? (
          <article className="space-y-3">
            <h1 className="font-[family-name:var(--font-sans)] text-3xl">{item.name}</h1>
            <p className="leading-relaxed">{item.one_liner}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{item.purpose}</p>
            {item.bad_example ? (
              <p className="text-sm">
                <span className="text-xs text-[var(--color-ink-muted)]">弱例　</span>
                {item.bad_example}
              </p>
            ) : null}
            {item.good_example ? (
              <p className="text-sm">
                <span className="text-xs text-[var(--color-ink-muted)]">強例　</span>
                {item.good_example}
              </p>
            ) : null}
            {item.breakdown ? (
              <p className="text-sm">
                <span className="text-xs text-[var(--color-ink-muted)]">拆解　</span>
                {item.breakdown}
              </p>
            ) : null}
            {item.exercise ? (
              <p className="text-sm">
                <span className="text-xs text-[var(--color-ink-muted)]">練習　</span>
                {item.exercise}
              </p>
            ) : null}
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

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">
          {titles[kind]}
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {visibleRows.length
            ? pagedRows.length < visibleRows.length
              ? `共 ${visibleRows.length} 筆（已載入 ${pagedRows.length}）`
              : `共 ${visibleRows.length} 筆`
            : "尚無資料"}
          {useMock ? " · 離線示範" : ""}
        </p>
      </header>

      {kind === "vocabulary" ? (
        <VocabStudyPanel
          pool={visibleRows.filter(isVocab)}
          mode={vocabMode}
          onModeChange={setVocabMode}
        />
      ) : null}

      {kind === "vocabulary" && vocabCats.length > 0 && vocabMode !== "themes" ? (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-ink-muted)]">
            大類（括號為筆數）。點進情緒／人物描寫可再篩「面貌」「怒怨」等小類。
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-md border px-2.5 py-1 text-xs ${
                catFilter === "全部"
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-muted)]"
              }`}
              onClick={() => {
                setCatFilter("全部");
                setSubFilter("全部");
              }}
            >
              全部（{rows.length}）
            </button>
            {vocabCats.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  catFilter === c.name
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                    : "border-[var(--color-line)] text-[var(--color-ink-muted)]"
                }`}
                onClick={() => {
                  setCatFilter(c.name);
                  setSubFilter("全部");
                }}
              >
                {c.name}（{c.count}）
              </button>
            ))}
          </div>
          {vocabSubs.length > 1 ? (
            <div className="flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-3">
              <button
                type="button"
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  subFilter === "全部"
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-ink)]"
                    : "border-[var(--color-line)] text-[var(--color-ink-muted)]"
                }`}
                onClick={() => setSubFilter("全部")}
              >
                小類・全部
              </button>
              {vocabSubs.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    subFilter === s.name
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-ink)]"
                      : "border-[var(--color-line)] text-[var(--color-ink-muted)]"
                  }`}
                  onClick={() => setSubFilter(s.name)}
                >
                  {s.name}（{s.count}）
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {vocabMode === "browse" || kind !== "vocabulary" ? (
        visibleRows.length === 0 ? (
          <PageState
            title="列表為空"
            description={
              kind === "vocabulary"
                ? "請到「內容管理」匯入文學詞庫。"
                : "內容尚在補齊，稍後再來看。"
            }
          />
        ) : (
          <div className="space-y-3">
            <ul className="space-y-3">
              {pagedRows.map((row) => {
                const href = `${listPath(kind)}/${row.id}`;
                if (isVocab(row)) {
                  return (
                    <li
                      key={row.id}
                      className="flex items-stretch gap-2 rounded-lg border border-[var(--color-line)]"
                    >
                      <Link
                        to={href}
                        className="min-w-0 flex-1 p-4 hover:bg-[var(--color-paper-2)]"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-lg">{row.term}</p>
                          {row.category ? (
                            <p className="text-[10px] text-[var(--color-ink-muted)]">
                              {row.category}
                            </p>
                          ) : null}
                        </div>
                        {row.zhuyin ? (
                          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                            {row.zhuyin}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                          {row.short_def}
                        </p>
                      </Link>
                      <div className="flex items-start p-2">
                        <OwnerRemoveCardButton
                          kind="vocabulary"
                          contentId={row.id}
                          compact
                          onRemoved={() => void listQuery.refetch()}
                        />
                      </div>
                    </li>
                  );
                }
                if (isQuote(row)) {
                  return (
                    <li
                      key={row.id}
                      className="flex items-stretch gap-2 rounded-lg border border-[var(--color-line)]"
                    >
                      <Link
                        to={href}
                        className="min-w-0 flex-1 p-4 hover:bg-[var(--color-paper-2)]"
                      >
                        <p className="line-clamp-2 text-lg leading-relaxed">{row.display_quote}</p>
                        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                          {row.author_name}
                          {row.themes?.length ? ` · ${row.themes.slice(0, 2).join("、")}` : ""}
                        </p>
                      </Link>
                      <div className="flex items-start p-2">
                        <OwnerRemoveCardButton
                          kind="quote"
                          contentId={row.id}
                          compact
                          onRemoved={() => void listQuery.refetch()}
                        />
                      </div>
                    </li>
                  );
                }
                if (!isCraft(row)) return null;
                return (
                  <li
                    key={row.id}
                    className="flex items-stretch gap-2 rounded-lg border border-[var(--color-line)]"
                  >
                    <Link to={href} className="min-w-0 flex-1 p-4 hover:bg-[var(--color-paper-2)]">
                      <p className="text-lg">{row.name}</p>
                      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{row.one_liner}</p>
                    </Link>
                    <div className="flex items-start p-2">
                      <OwnerRemoveCardButton
                        kind="craft"
                        contentId={row.id}
                        compact
                        onRemoved={() => void listQuery.refetch()}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {pagedRows.length < visibleRows.length ? (
              <button
                type="button"
                className="w-full rounded-md border border-[var(--color-line)] py-2.5 text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-2)]"
                onClick={() => setListLimit((n) => n + 80)}
              >
                再載入 80 筆（尚餘 {visibleRows.length - pagedRows.length}）
              </button>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
