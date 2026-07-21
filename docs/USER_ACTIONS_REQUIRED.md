# 需要使用者手動完成的事項

> 只列 Cursor／自動化**無法**安全完成、且會阻礙實作的項目。

---

## U1. 恢復主站 Supabase

**狀態**：Done

---

## U2. 安裝 Node.js LTS

**狀態**：Done — v24.18.0 / npm 11.16.0

---

## U3. 建立 GitHub Repository `zi-geng`

**狀態**：Done — https://github.com/linyize1111/zi-geng

---

## U4. GitHub Pages Secrets

**狀態**：Partial — Pages workflow 已啟用。請在 repo Settings → Secrets 新增：

- `VITE_SUPABASE_URL` = `https://ypyiqysgfwgxcmmsylob.supabase.co`
- `VITE_SUPABASE_ANON_KEY` =（主站 anon key，與 `supabase-config.js` 相同）
- `VITE_MAIN_SITE_URL` = `https://linyize1111.github.io/`

---

## U5. Supabase Auth Redirect URL（現在請做）

**狀態**：Open

1. 開啟 https://supabase.com/dashboard/project/ypyiqysgfwgxcmmsylob/auth/url-configuration  
2. Redirect URLs 新增：
   - `https://linyize1111.github.io/zi-geng/`
   - `http://localhost:5173/`（本機 Vite；若 port 不同再改）
3. Save

---

## U6. Phase 2 `zg_*` 成員／設定表

**狀態**：Done

---

## U7. Owner Email

**狀態**：Done（使用者已確認成功）

---

## U9. Phase 3 內容表＋每日計畫＋開發 seed（現在請做）

**狀態**：Open — 剪貼簿已放入完整 SQL

1. SQL Editor → New query → **清空**  
2. **Ctrl+V**（內容來自 `supabase/APPLY_PHASE3_IN_SQL_EDITOR.sql`）  
3. Run  
4. 結果應看到 vocab/quotes/craft/prompts/novel_tasks 計數（開發 seed 約各 ≥1）

---

## U8. 後續

- 正式名言人工查證後匯入  
- Edge Function secrets（Phase 8）  
- 手機加入主畫面／`.ics`

---

## 已由 Cursor 完成、無需你操作

- 主站 `auth.js` 已保護 `zi-geng-auth`（已 push 至 `linyize1111.github.io`）
