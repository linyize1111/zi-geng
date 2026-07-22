import { useState } from "react";
import { Button } from "@/components/common/Button";
import { PageState } from "@/components/common/PageState";
import {
  importQuoteCards,
  importVocabularyCards,
  type ImportResult,
  type QuoteImportCard,
  type VocabImportCard,
} from "@/features/content/import-content-client";
import { env } from "@/lib/env";

type VocabSeed = { cards: VocabImportCard[] };
type QuoteSeed = { cards: QuoteImportCard[] };

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

  async function importMoeVocab() {
    await runImport("載入教育部成語…", async () => {
      const res = await fetch(contentUrl("seed-literary-vocab.json"));
      if (!res.ok) throw new Error(`無法載入詞庫（${res.status}）`);
      const data = (await res.json()) as VocabSeed;
      if (!data.cards?.length) throw new Error("詞庫檔是空的");
      return importVocabularyCards(data.cards, (done, total) => {
        setProgress(`成語匯入 ${done}/${total}`);
      });
    });
  }

  async function importMultiVocab() {
    await runImport("載入多來源詞庫…", async () => {
      const res = await fetch(contentUrl("seed-multi-source-vocab.json"));
      if (!res.ok) {
        throw new Error(
          `尚無多來源詞庫檔（${res.status}）。請先跑 npm run content:crawl 或等週更。`,
        );
      }
      const data = (await res.json()) as VocabSeed;
      if (!data.cards?.length) throw new Error("多來源詞庫是空的");
      return importVocabularyCards(data.cards, (done, total) => {
        setProgress(`多來源詞彙 ${done}/${total}`);
      });
    });
  }

  async function importWikiquote() {
    await runImport("載入多主題名言…", async () => {
      let res = await fetch(contentUrl("seed-themed-quotes.json"));
      if (!res.ok) res = await fetch(contentUrl("seed-wikiquote.json"));
      if (!res.ok) {
        throw new Error(`尚無名言檔（${res.status}）。請先跑 npm run content:quotes 或等部署。`);
      }
      const data = (await res.json()) as QuoteSeed;
      if (!data.cards?.length) throw new Error("名言檔是空的");
      return importQuoteCards(data.cards, (done, total) => {
        setProgress(`名言匯入 ${done}/${total}`);
      });
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">內容管理</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Owner 專用。可匯入教育部成語、維基詞典冷僻詞，以及維基語錄多主題名言（標明來源與授權）。
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-[var(--color-line)] p-5">
        <h2 className="text-lg">匯入內容</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          可重跑；已存在的會跳過。匯入後到「今日」無限換卡，或用「收藏」留下複習。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={busy} onClick={() => void importMoeVocab()}>
            {busy ? progress || "匯入中…" : "匯入教育部成語"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void importMultiVocab()}
          >
            匯入多來源詞彙
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void importWikiquote()}
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
        週更會抓教育部成語＋維基詞典／語錄（合法 API／開放授權），再寫入 Supabase。需設{" "}
        <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>
        。不會去爬商業字典。名人語錄標為次級查證，可疑請下架。
      </section>
    </div>
  );
}
