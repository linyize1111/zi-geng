import { useState } from "react";
import { Button } from "@/components/common/Button";
import { PageState } from "@/components/common/PageState";
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
          Owner 專用。主題詞庫（情緒／動詞／感官等）＋文學詞＋技巧／題目／小說計畫任務；名言以經典與標明來源為主。
        </p>
      </header>

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
                const data = await fetchSeed<VocabSeed>(
                  "seed-literary-vocab.json",
                  "無法載入詞庫",
                );
                if (!data.cards?.length) throw new Error("詞庫檔是空的");
                return importVocabularyCards(data.cards, (d, t) => setProgress(`文學詞庫 ${d}/${t}`));
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
              void runImport("載入主題詞庫…", async () => {
                const data = await fetchSeed<VocabSeed>(
                  "seed-themed-vocab.json",
                  "尚無主題詞庫檔",
                );
                if (!data.cards?.length) throw new Error("主題詞庫是空的");
                return importVocabularyCards(data.cards, (d, t) => setProgress(`主題詞庫 ${d}/${t}`));
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
                const data = await fetchSeed<PromptSeed>(
                  "seed-writing-prompts.json",
                  "尚無題目檔",
                );
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
                return importNovelTaskCards(data.cards, (d, t) => setProgress(`小說任務 ${d}/${t}`));
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
            description={`新增 ${result.inserted}、略過 ${result.skipped}、失敗 ${result.errors}${
              result.messages.length ? `。${result.messages.join("；")}` : ""
            }`}
          />
        ) : null}
      </section>

      <section className="rounded-lg border border-dashed border-[var(--color-line)] p-5 text-sm text-[var(--color-ink-muted)]">
        Content sync 會自動灌詞庫／名言／題目／小說任務／技巧。此頁供緊急補灌。
      </section>
    </div>
  );
}
