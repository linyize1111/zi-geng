# 需要使用者手動完成的事項

---

## 現在請做

### 1. 清掉「開發測試」＋取消刷新上限（必做）

在 Supabase → SQL Editor 貼上並 Run：

`zi-geng/supabase/APPLY_UNLIMITED_REFRESH_AND_PURGE_TEST.sql`

會：下架測試名言、寫入「字耕」寫作箴言、擴充技巧／題目、**取消換一批次數上限**。跑完重整「今日」。

### 2. 首次灌詞庫（若還沒）

1. Owner 登入 → **更多 → 內容管理 →「匯入內建文學詞庫」**  
2. 回「今日」按「換一批」

### 3. 週更全自動（一次性）

| Secret | 說明 |
|--------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | **必填**（Project Settings → API → service_role） |
| `SUPABASE_URL` | 可省略；未設則用 `VITE_SUPABASE_URL` |

---

## 已結案

Phase 2/3 SQL、Replace RPC、Pages Secrets（`VITE_*`）等皆 Done。
