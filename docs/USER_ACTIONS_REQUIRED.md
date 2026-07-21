# 需要使用者手動完成的事項

> 只列 Cursor／自動化**無法**安全完成、且會阻礙實作的項目。  
> 每項為可照做的步驟。完成後請在此將狀態改為 Done。

---

## U1. 確認／恢復主站 Supabase 專案（阻斷 Phase 2＋發布）

**狀態**：Open — **最高優先**

**為何**：本機與 Google DNS 皆無法解析 `*.supabase.co` 上主站 project ref（NXDOMAIN）。線上 config 仍指向該專案；動態 CMS／Google 登入可能已壞。

**步驟**：

1. 開啟 <https://supabase.com/dashboard> 並登入。
2. 尋找主站 CMS 專案（名稱可能類似 `linyize-main-site`；**不要**選 ACG 專案）。
3. 若專案仍在：
   - Project Settings → API：確認 Project URL 與 anon key。
   - 若 URL／ref 已變：告訴 Cursor 新 URL（或自行更新主站 `assets/js/supabase-config.js` 後再通知）。
4. 若專案已刪除：
   - New project → 靠近台灣的 region → 保存 DB 密碼。
   - 依主站 `docs/SUPABASE_SETUP.md` 依序執行：
     - `supabase/migrations/0001_init.sql`（白名單改為你的 Google 信箱）
     - `0002_storage.sql`
     - 可選 `0003_seed_articles.sql`、analytics migration
   - 啟用 Google Auth；Redirect 含 `https://linyize1111.github.io/admin.html` 與 `/`
   - 更新主站 `supabase-config.js` 的 URL／anon key 並 push `main`
5. 驗證：開啟 `https://linyize1111.github.io/admin.html` 能以管理員 Google 登入。

**完成後 Cursor 可**：對該專案套用 `zg_*` migrations、接字耕登入與發布。

---

## U2. 安裝本機 Node.js LTS（阻斷 Phase 1 build／test）

**狀態**：Done — Node.js LTS `v24.18.0`／npm `11.16.0`（2026-07-22 經 winget 安裝並驗證）。

---

## U3. 建立 GitHub Repository `zi-geng`

**狀態**：Open（本機 repo 已 init，遠端尚未建立）

**步驟**：

1. <https://github.com/new>
2. Owner：`linyize1111`；Repository name：`zi-geng`
3. Public 或 Private 皆可（Pages 對 private 需 GitHub Pro／適當方案；個人網站情境建議 Public）。
4. **不要**勾選「Add README」（本機已有內容後再 push）。
5. 建立後把 URL 告知 Cursor，或自行：
   ```bash
   cd zi-geng
   git remote add origin https://github.com/linyize1111/zi-geng.git
   git push -u origin main
   ```

---

## U4. 啟用 GitHub Pages（Actions）

**狀態**：Open（等 Phase 1 workflow 就緒後）

**步驟**：

1. Repo → Settings → Pages。
2. Build and deployment → Source：**GitHub Actions**。
3. Settings → Secrets and variables → Actions → New repository secret：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`（anon only，絕不可放 service_role）
   - `VITE_MAIN_SITE_URL` = `https://linyize1111.github.io/`

---

## U5. Supabase Auth 新增字耕 Redirect URL

**狀態**：Open（等專案恢復後）

**步驟**：

1. Supabase → Authentication → URL Configuration。
2. Redirect URLs 新增：`https://linyize1111.github.io/zi-geng/`
3. 本機開發可再加：`http://localhost:5173/`（或實際 Vite port）對應路徑。

---

## U6. 套用字耕 `zg_*` migrations

**狀態**：Open（等 Phase 2 migration 寫好且 U1 完成）

**步驟**：

1. SQL Editor → 依 `zi-geng/supabase/migrations/` 檔名順序執行（或 CLI `db push`）。
2. 驗證：`select public.is_zg_member();` 未登入應為 false。

---

## U7. 寫入 Owner／Member Email

**狀態**：Open

**步驟**：

1. SQL Editor 執行（替換信箱，勿把信箱貼進公開 issue）：
   ```sql
   insert into public.zg_members (email, role, enabled, note) values
     ('你的Google信箱', 'owner', true, '字耕主人')
   on conflict (email) do update set role = excluded.role, enabled = true;
   ```
2. 朋友：
   ```sql
   insert into public.zg_members (email, role, enabled) values
     ('朋友信箱', 'member', true)
   on conflict (email) do nothing;
   ```

---

## U8. 後續（非 Phase 0 阻斷）

- 匯入正式詞彙／名言（名言須人工查證）
- Edge Function secrets（Phase 8）
- 手機「加入主畫面」與 `.ics` 行事曆匯入
- 主站 redirect／Google Cloud origins 若重建專案需重設

---

## 不需要使用者決定的事項（Cursor 已定）

- 獨立 `zi-geng` repo、HashRouter、npm、共用主站 Supabase（待恢復）、`zg_` 前綴  
- 見 `DECISIONS.md`／`adr/0001-...`
