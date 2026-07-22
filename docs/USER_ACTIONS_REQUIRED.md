# 需要使用者手動完成的事項

---

## 1. 立刻：拿掉刷新上限（必做）

前次完整 SQL 可能因 `archived` 失敗而沒裝上。請只跑這份：

**Raw：** https://raw.githubusercontent.com/linyize1111/zi-geng/main/supabase/APPLY_REFRESH_UNLIMITED_ONLY.sql  

**SQL Editor：** https://supabase.com/dashboard/project/ypyiqysgfwgxcmmsylob/sql/new  

跑完最後一列應顯示 `still_has_limit = false`。然後硬重新整理字耕。

---

## 2. 匯入多來源內容（Owner）

1. 登入 → 內容管理  
2. 「匯入教育部成語」  
3. 「匯入多來源詞彙」「匯入多主題名言」（需網站已部署含這些 JSON）

或等週更（需 `SUPABASE_SERVICE_ROLE_KEY`）。

---

## 3. 週更 secret（一次性）

| Secret | 說明 |
|--------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | 必填 |
| `SUPABASE_URL` | 可省略，沿用 `VITE_SUPABASE_URL` |
