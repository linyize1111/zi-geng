import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import {
  deactivateContent,
  deactivateMany,
  searchActiveContent,
  type ContentKind,
} from "@/features/content/deactivate-content";
import {
  importCraftCards,
  importNovelTaskCards,
  importPromptCards,
  importQuoteCards,
  importVocabularyCards,
  type CraftImportCard,
  type ImportResult,
  type NovelTaskImportCard,
  type PromptImportCard,
  type QuoteImportCard,
  type VocabImportCard,
} from "@/features/content/import-content-client";
import { env } from "@/lib/env";

type VocabSeed = { cards: VocabImportCard[] };
type QuoteSeed = { cards: QuoteImportCard[] };
type PromptSeed = { cards: PromptImportCard[] };
type NovelSeed = { cards: NovelTaskImportCard[] };
type CraftSeed = { cards: CraftImportCard[] };

const MANAGE_KINDS: { id: ContentKind; label: string }[] = [
  { id: "vocabulary", label: "詞彙" },
  { id: "quote", label: "名言" },
  { id: "craft", label: "技巧" },
  { id: "prompt", label: "題目" },
  { id: "novel_task", label: "小說任務" },
];

function OwnerContentBrowser() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<ContentKind>("vocabulary");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const listQuery = useQuery({
    queryKey: ["owner-content-search", kind, search],
    queryFn: () => searchActiveContent(kind, search, 50),
  });

  const removeOne = useMutation({
    mutationFn: (id: string) => deactivateContent(kind, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-content-search"] });
      void queryClient.invalidateQueries({ queryKey: ["learn-list"] });
      void queryClient.invalidateQueries({ queryKey: ["daily-plan"] });
      setSelected(new Set());
    },
  });

  const removeMany = useMutation({
    mutationFn: (ids: string[]) => deactivateMany(kind, ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-content-search"] });
      void queryClient.invalidateQueries({ queryKey: ["learn-list"] });
      void queryClient.invalidateQueries({ queryKey: ["daily-plan"] });
      setSelected(new Set());
    },
  });

  const rows = listQuery.data ?? [];
  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selected.has(r.id)),
    [rows, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  return (
    <section className="space-y-4 rounded-lg border border-[var(--color-line)] p-5">
      <div>
        <h2 className="text-lg">下架太基礎／不要的卡片</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          設為 inactive，今日與學習庫不會再抽到。搜尋詞彙或名言關鍵字後可單筆或批次下架。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MANAGE_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`rounded-md border px-3 py-1.5 text-sm ${
              kind === k.id
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border-[var(--color-line)] text-[var(--color-ink-muted)]"
            }`}
            onClick={() => {
              setKind(k.id);
              setSelected(new Set());
            }}
          >
            {k.label}
          </button>
        ))}
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
          setSelected(new Set());
        }}
      >
        <input
          className="min-w-[12rem] flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
          placeholder="搜尋關鍵字（可空＝列出一批）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" variant="outline">
          搜尋
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={selected.size === 0 || removeMany.isPending}
          onClick={() => {
            const ids = [...selected];
            if (window.confirm(`確定批次下架 ${ids.length} 筆？將不再出現於今日／學習。`)) {
              removeMany.mutate(ids);
            }
          }}
        >
          {removeMany.isPending ? "下架中…" : `下架勾選（${selected.size}）`}
        </Button>
      </form>

      {listQuery.isLoading ? <PageLoading label="搜尋中…" /> : null}
      {listQuery.isError ? (
        <p className="text-sm text-[var(--color-danger)]">
          {listQuery.error instanceof Error ? listQuery.error.message : "搜尋失敗"}
        </p>
      ) : null}

      {rows.length ? (
        <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
          <li className="flex items-center gap-3 px-3 py-2 text-xs text-[var(--color-ink-muted)]">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span>全選本頁（{rows.length}）</span>
          </li>
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-start gap-3 px-3 py-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.has(row.id)}
                onChange={() => toggle(row.id)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{row.title}</p>
                {row.subtitle ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-ink-muted)]">
                    {row.subtitle}
                  </p>
                ) : null}
                {row.difficulty != null ? (
                  <p className="mt-0.5 text-[10px] text-[var(--color-ink-muted)]">
                    難度 {row.difficulty}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="min-h-9 min-w-0 px-2 text-xs text-[var(--color-danger)]"
                disabled={removeOne.isPending}
                onClick={() => {
                  if (window.confirm(`下架「${row.title.slice(0, 40)}」？`)) {
                    removeOne.mutate(row.id);
                  }
                }}
              >
                下架
              </Button>
            </li>
          ))}
        </ul>
      ) : listQuery.isFetched ? (
        <p className="text-sm text-[var(--color-ink-muted)]">沒有符合的啟用中卡片。</p>
      ) : null}

      {removeMany.isSuccess ? (
        <p className="text-xs text-[var(--color-ink-muted)]">已批次下架。</p>
      ) : null}
    </section>
  );
}

export default function OwnerContentPage() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runImport(label: string, work: () => Promise<ImportResult>) {
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(label);
    try {
      const out = await work();
      setResult(out);
      setProgress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "匯入失敗");
      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  function contentUrl(name: string) {
    return `${env.appBasePath.replace(/\/?$/, "/")}content/${name}`;
  }

  async function fetchSeed<T>(name: string, emptyMsg: string): Promise<T> {
    const res = await fetch(contentUrl(name));
    if (!res.ok) throw new Error(`${emptyMsg}（${res.status}）`);
    return (await res.json()) as T;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">內容管理</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Owner 專用。可搜尋下架太基礎的卡片，或匯入詞庫／名言／題目。
        </p>
      </header>

      <OwnerContentBrowser />

      <section className="space-y-4 rounded-lg border border-[var(--color-line)] p-5">
        <h2 className="text-lg">匯入內容</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          可重跑；已存在的會跳過。平常由 GitHub Actions「Content sync」自動灌庫。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void runImport("載入文學詞庫…", async () => {
                const data = await fetchSeed<VocabSeed>("seed-literary-vocab.json", "無法載入詞庫");
                if (!data.cards?.length) throw new Error("詞庫檔是空的");
                return importVocabularyCards(data.cards, (d, t) =>
                  setProgress(`文學詞庫 ${d}/${t}`),
                );
              })
            }
          >
            {busy ? progress || "匯入中…" : "匯入文學詞庫"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runImport("載入主題收割詞庫…", async () => {
                const data = await fetchSeed<VocabSeed>(
                  "seed-harvested-themes.json",
                  "尚無收割詞庫（請先跑 npm run content:harvest）",
                );
                if (!data.cards?.length) throw new Error("收割詞庫是空的");
                return importVocabularyCards(data.cards, (d, t) =>
                  setProgress(`主題收割 ${d}/${t}`),
                );
              })
            }
          >
            匯入教育部主題收割
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runImport("載入主題詞庫…", async () => {
                const data = await fetchSeed<VocabSeed>("seed-themed-vocab.json", "尚無主題詞庫檔");
                if (!data.cards?.length) throw new Error("主題詞庫是空的");
                return importVocabularyCards(data.cards, (d, t) =>
                  setProgress(`主題詞庫 ${d}/${t}`),
                );
              })
            }
          >
            匯入主題詞庫
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runImport("載入寫作技巧…", async () => {
                const data = await fetchSeed<CraftSeed>("seed-craft-cards.json", "尚無技巧檔");
                if (!data.cards?.length) throw new Error("技巧檔是空的");
                return importCraftCards(data.cards, (d, t) => setProgress(`技巧 ${d}/${t}`));
              })
            }
          >
            匯入寫作技巧
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runImport("載入寫作題目…", async () => {
                const data = await fetchSeed<PromptSeed>("seed-writing-prompts.json", "尚無題目檔");
                if (!data.cards?.length) throw new Error("題目檔是空的");
                return importPromptCards(data.cards, (d, t) => setProgress(`題目 ${d}/${t}`));
              })
            }
          >
            匯入寫作題目
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runImport("載入小說計畫任務…", async () => {
                const data = await fetchSeed<NovelSeed>(
                  "seed-novel-plan-tasks.json",
                  "尚無小說任務檔",
                );
                if (!data.cards?.length) throw new Error("小說任務檔是空的");
                return importNovelTaskCards(data.cards, (d, t) =>
                  setProgress(`小說任務 ${d}/${t}`),
                );
              })
            }
          >
            匯入小說計畫
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runImport("載入名言…", async () => {
                let res = await fetch(contentUrl("seed-themed-quotes.json"));
                if (!res.ok) res = await fetch(contentUrl("seed-wikiquote.json"));
                if (!res.ok) throw new Error(`尚無名言檔（${res.status}）`);
                const data = (await res.json()) as QuoteSeed;
                if (!data.cards?.length) throw new Error("名言檔是空的");
                return importQuoteCards(data.cards, (d, t) => setProgress(`名言 ${d}/${t}`));
              })
            }
          >
            匯入多主題名言
          </Button>
        </div>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        {result ? (
          <PageState
            title="匯入完成"
            description={`新增 ${result.inserted}${
              "updated" in result && typeof result.updated === "number"
                ? `、更新分類 ${result.updated}`
                : ""
            }、略過 ${result.skipped}、失敗 ${result.errors}${
              result.messages.length ? `。${result.messages.join("；")}` : ""
            }`}
          />
        ) : null}
      </section>

      <section className="rounded-lg border border-dashed border-[var(--color-line)] p-5 text-sm text-[var(--color-ink-muted)]">
        Content sync 會自動灌詞庫／名言／題目／小說任務／技巧。此頁供緊急補灌與清理。
      </section>
    </div>
  );
}
