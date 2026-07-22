import { useState } from "react";
import { Button } from "@/components/common/Button";
import { PageState } from "@/components/common/PageState";
import {
  importVocabularyCards,
  type ImportResult,
  type VocabImportCard,
} from "@/features/content/import-vocab-client";
import { env } from "@/lib/env";

type SeedFile = {
  version: number;
  count: number;
  cards: VocabImportCard[];
};

export default function OwnerContentPage() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importBundled() {
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress("載入詞庫檔…");
    try {
      const url = `${env.appBasePath.replace(/\/?$/, "/")}content/seed-literary-vocab.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`無法載入詞庫檔（${res.status}）`);
      const data = (await res.json()) as SeedFile;
      if (!data.cards?.length) throw new Error("詞庫檔是空的");
      setProgress(`匯入中 0/${data.cards.length}`);
      const out = await importVocabularyCards(data.cards, (done, total) => {
        setProgress(`匯入中 ${done}/${total}`);
      });
      setResult(out);
      setProgress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "匯入失敗");
      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">內容管理</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Owner 專用。先把內建文學詞庫灌進資料庫，「今日／換一批」才有足夠內容可抽。
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-[var(--color-line)] p-5">
        <h2 className="text-lg">文學詞庫一鍵匯入</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          約 300+
          筆書面語／成語／寫作向詞彙（可重跑，已存在的詞會跳過）。匯入後請到「今日」按「換一批」。
        </p>
        <Button type="button" disabled={busy} onClick={() => void importBundled()}>
          {busy ? progress || "匯入中…" : "匯入內建文學詞庫"}
        </Button>
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
        週更：GitHub Actions「Content sync」會從中文維基詞典補詞（需設定
        SUPABASE_SERVICE_ROLE_KEY）。名言仍須人工查證後再匯入，不會自動冒充名人。
      </section>
    </div>
  );
}
