# 內容匯入（詞庫）

## 為何「換一批」以前沒用

只是在資料庫裡重抽。以前庫裡只有開發用幾個測試詞。

## 現在有什麼

- **500 筆**教育部《成語典》成語（CC BY-ND 3.0 TW；標明出處）
- Owner 頁「匯入內建文學詞庫」一鍵寫入 Supabase
- GitHub Actions 每週可重建／匯入（需 `SUPABASE_SERVICE_ROLE_KEY`）
- 腳本：`content:download-idioms` → `content:generate` → `content:import`

## 本機更新種子

```bash
npm run content:download-idioms
SEED_LIMIT=800 npm run content:generate
```

## 授權注意

教育部辭典資料不得改作原文釋義；我們只做格式轉換與欄位對應，並在 `source` 標註出處。
