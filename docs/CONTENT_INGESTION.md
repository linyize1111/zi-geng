# 內容匯入

## 原則

- **文筆／國學導向**：收錄前經 `vocab-quality` 篩選；排除「半日」級基礎詞與「蒙衝」級冷門專名。
- **多來源**：教育部辭典（成語／重編／簡編／**主題收割**）＋維基詞典／語錄／文庫／百科列表（均為開放授權）。
- **主題收割**：`npm run content:harvest` 從本機教育部 dump 依情緒／面貌／動作等關鍵字收割（不需網路）。
- **一口氣灌庫**：`npm run content:bulk` 或 Actions「Content sync」手動選 `bulk`。
- **持續更新**：週一排程跑 `update`（增量爬取）；可隨時再跑 `bulk`。

## 本機 bulk

```bash
npm run content:bulk
# 或略過網路爬蟲、只重建教育部＋策展種子：
node scripts/content/bulk-enrich.mjs --skip-crawl
```

匯入需 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`（或交由 Actions）。

## Actions

| 觸發 | 模式 |
|------|------|
| 週排程 | `update`（約 100 詞／50 句增量） |
| workflow_dispatch | 可選 `bulk`（預設）或 `update` |
| push 種子變更 | 先匯入 committed seeds，再 `update` 爬取 |

下架低價值詞：`purge-low-value-vocab.mjs`（半日／蒙衝等）。

## 授權

- 教育部辭典：CC BY-ND 3.0 TW（只做格式轉換，標註出處）
- 維基系：CC BY-SA（標註來源 URL）
- 不爬商業字典、付費金句站
