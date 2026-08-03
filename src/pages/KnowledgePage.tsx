import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  getKnowledge,
  listKnowledge,
  type KnowledgeListItem,
} from "@/features/learn/knowledge-api";
import { CardFeedback } from "@/features/study/CardFeedback";
import { knowledgeNormalizedKey } from "@/features/study/normalize";
import { routes } from "@/routes/paths";

const SERIES_LABEL: Record<string, string> = {
  literary_history: "文學史",
  age_titles: "年齡稱謂",
  fabric_materials: "布料器物",
  time_calendar: "時間曆法",
  classical_images: "古典意象",
  address_epistolary: "稱謂書信",
  exams_offices: "科舉官職",
  genre_rhetoric: "文體修辭",
};

export default function KnowledgePage() {
  const { id } = useParams();
  const auth = useAuth();
  const [series, setSeries] = useState<string>("全部");

  const listQuery = useQuery({
    queryKey: ["knowledge-list", auth.user?.id],
    enabled: auth.status === "authenticated" && !id,
    queryFn: listKnowledge,
  });

  const detailQuery = useQuery({
    queryKey: ["knowledge-detail", id],
    enabled: auth.status === "authenticated" && Boolean(id),
    queryFn: () => getKnowledge(id!),
  });

  const seriesChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of listQuery.data ?? []) {
      counts.set(row.series, (counts.get(row.series) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [listQuery.data]);

  const visible = useMemo(() => {
    const rows = listQuery.data ?? [];
    if (series === "全部") return rows;
    return rows.filter((r) => r.series === series);
  }, [listQuery.data, series]);

  if (auth.status === "loading" || listQuery.isLoading || detailQuery.isLoading) {
    return <PageLoading label="載入國學小專欄…" />;
  }

  if (id) {
    const item = detailQuery.data;
    if (!item) {
      return (
        <PageState
          title="找不到專欄"
          description="可能尚未匯入，或仍是 candidate。"
          actionLabel="返回列表"
          onAction={() => history.back()}
        />
      );
    }
    const facts = Array.isArray(item.facts) ? item.facts : [];
    const glossary = Array.isArray(item.glossary) ? item.glossary : [];
    const quiz = Array.isArray(item.quiz) ? item.quiz : [];
    const refs = Array.isArray(item.source_refs) ? item.source_refs : [];
    return (
      <article className="space-y-4">
        <Link to={routes.learnKnowledge} className="text-sm text-[var(--color-ink-muted)]">
          ← 國學小專欄
        </Link>
        <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">
          {SERIES_LABEL[item.series] ?? item.series} · 約 {item.reading_time_sec ?? 90} 秒
        </p>
        <h1 className="font-[family-name:var(--font-sans)] text-3xl">{item.title}</h1>
        <p className="text-lg leading-relaxed">{item.hook}</p>
        <section className="whitespace-pre-wrap leading-relaxed text-[var(--color-ink)]">
          {item.story_md}
        </section>
        {facts.length ? (
          <section>
            <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">三件事記住</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {facts.map((f) => (
                <li key={`${f.label}-${f.value}`}>
                  <span className="text-[var(--color-ink-muted)]">{f.label}：</span>
                  {f.value}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {glossary.length ? (
          <section>
            <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">詞彙小表</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {glossary.map((g) => (
                <li key={g.term}>
                  <strong>{g.term}</strong> — {g.explanation}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {item.writing_use ? (
          <section>
            <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">
              對寫作有什麼用
            </h2>
            <p className="mt-1 text-sm leading-relaxed">{item.writing_use}</p>
          </section>
        ) : null}
        {item.why_it_matters ? (
          <p className="text-sm text-[var(--color-ink-muted)]">{item.why_it_matters}</p>
        ) : null}
        {quiz[0] ? (
          <section className="rounded-lg border border-[var(--color-line)] p-4">
            <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">小測驗</h2>
            <p className="mt-2 text-sm">{quiz[0].question}</p>
            <p className="mt-2 text-xs text-[var(--color-ink-muted)]">參考：{quiz[0].answer}</p>
          </section>
        ) : null}
        {refs.length ? (
          <p className="text-xs text-[var(--color-ink-muted)]">
            來源：{refs.map((r) => r.source_key).join("、")}
          </p>
        ) : null}
        <CardFeedback
          contentType="knowledge"
          contentId={item.id}
          normalizedKey={knowledgeNormalizedKey(item.series, item.topic_key)}
        />
      </article>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">國學小專欄</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          短、好記、能用在寫作。不是百科背誦。
          {visible.length ? ` · ${visible.length} 篇` : ""}
        </p>
      </header>

      {seriesChips.length ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-md border px-2.5 py-1 text-xs ${
              series === "全部"
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border-[var(--color-line)]"
            }`}
            onClick={() => setSeries("全部")}
          >
            全部
          </button>
          {seriesChips.map((s) => (
            <button
              key={s.name}
              type="button"
              className={`rounded-md border px-2.5 py-1 text-xs ${
                series === s.name
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "border-[var(--color-line)]"
              }`}
              onClick={() => setSeries(s.name)}
            >
              {SERIES_LABEL[s.name] ?? s.name}（{s.count}）
            </button>
          ))}
        </div>
      ) : null}

      {listQuery.isError ? (
        <PageState
          tone="error"
          title="無法載入專欄"
          description="請先在 Supabase 執行 Phase 2–3 SQL，並匯入 knowledge candidates。"
        />
      ) : visible.length === 0 ? (
        <PageState
          title="尚無已上架專欄"
          description="執行內容管線後，active／seed 卡片會出現在這裡。"
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((row: KnowledgeListItem) => (
            <li key={row.id}>
              <Link
                to={`${routes.learnKnowledge}/${row.id}`}
                className="block rounded-lg border border-[var(--color-line)] p-4 hover:bg-[var(--color-paper-2)]"
              >
                <p className="text-[10px] tracking-widest text-[var(--color-ink-muted)]">
                  {SERIES_LABEL[row.series] ?? row.series}
                  {row.reading_time_sec ? ` · ${row.reading_time_sec}s` : ""}
                  {row.difficulty ? ` · 難度 ${row.difficulty}` : ""}
                </p>
                <p className="mt-1 text-lg">{row.title}</p>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{row.hook}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
