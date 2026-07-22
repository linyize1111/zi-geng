# 內容匯入（詞庫）

## 為何「換一批」以前沒用

只是在資料庫裡重抽。以前庫裡只有開發用幾個測試詞。

## 現在有什麼

- **500+ 筆**教育部《成語典》成語（CC BY-ND 3.0 TW；標明出處；週更可拉到 `SEED_LIMIT=800`）
- Owner 頁「匯入內建文學詞庫」：首次灌庫用
- **週更全自動**（GitHub Actions `Content sync`）：
  1. 下載 kemdict 鏡像的教育部成語 JSON  
  2. 重建 `seed-literary-vocab.json`  
  3. 以 `SUPABASE_SERVICE_ROLE_KEY` upsert／插入（已存在詞跳過）  
  4. 種子有變則 commit + push（觸發 Pages 部署）  
- 腳本：`content:download-idioms` → `content:generate` → `content:import`

## 本機更新種子

```bash
npm run content:download-idioms
SEED_LIMIT=800 npm run content:generate
# 匯入需本機環境變數：
# SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm run content:import
```

## 授權注意

教育部辭典資料不得改作原文釋義；我們只做格式轉換與欄位對應，並在 `source` 標註出處。
