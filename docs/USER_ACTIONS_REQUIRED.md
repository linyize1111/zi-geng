# 需要使用者手動完成的事項

---

## 立刻：把 500 成語灌進資料庫（你現在只看到 3 個詞就是這個原因）

龐大詞庫在網站 JSON 裡，**還沒寫進 Supabase**。請 Run：

**Raw（全選複製）：**  
https://raw.githubusercontent.com/linyize1111/zi-geng/main/supabase/APPLY_BULK_VOCAB_AND_QUOTES.sql  

**SQL Editor：**  
https://supabase.com/dashboard/project/ypyiqysgfwgxcmmsylob/sql/new  

跑完應看到 `vocab_active` 約 500+、`quotes_active` 約 20+。  
然後硬重新整理字耕 → 側欄「詞彙」應有幾百筆 →「今日」換一批才會真的換新詞。

也可 Owner 登入 → 內容管理 →「匯入教育部成語」＋「匯入多主題名言」（較慢）。

---

## （建議）無限刷新 RPC

https://raw.githubusercontent.com/linyize1111/zi-geng/main/supabase/APPLY_REFRESH_UNLIMITED_ONLY.sql  

（前端已有後備換卡；這份是把資料庫函式一併修好。）

---

## 週更 secret（可之後）

`SUPABASE_SERVICE_ROLE_KEY` 設一次即可全自動週更。
