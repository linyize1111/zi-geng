# 需要使用者手動完成的事項

> 只列 Cursor／自動化**無法**安全完成、且會阻礙實作的項目。  
> 每項為可照做的步驟。完成後請在此將狀態改為 Done。

---

## U1. 確認／恢復主站 Supabase 專案（阻斷 Phase 2＋發布）

**狀態**：Done — 專案已 Resume；DNS／articles REST 已驗證（2026-07-22）。

---

## U6. 套用字耕 `zg_*` migrations（現在可做）

**狀態**：Open — **請花約 1 分鐘手動 Run**（Dashboard SQL Editor 在 iframe 內，自動化無法貼上）

**步驟**：

1. 開啟（你已登入的話會直接進編輯器）：  
   https://supabase.com/dashboard/project/ypyiqysgfwgxcmmsylob/sql/new
2. 用編輯器打開本機檔並全選複製：  
   `LYZ-workspace/zi-geng/supabase/APPLY_PHASE2_IN_SQL_EDITOR.sql`  
   （或 GitHub：`supabase/migrations/202607220001_zg_members_profiles_settings.sql`）
3. 貼進 SQL Editor → 按 **Run**
4. 結果應看到 `zg_members`／`zg_profiles`／`zg_user_settings` 欄位有表名，且 `is_zg_member_anon` / `is_zg_owner_anon` 為 `false`
5. 再執行（把信箱換成你的 Google 登入信箱）：

```sql
insert into public.zg_members (email, role, enabled, note) values
  ('你的Google信箱@gmail.com', 'owner', true, '字耕主人')
on conflict (email) do update set role = 'owner', enabled = true;
```

6. 完成後回訊息「migration 好了」，我會驗證並繼續。

---

## U2. 安裝本機 Node.js LTS（阻斷 Phase 1 build／test）

**狀態**：Done — Node.js LTS `v24.18.0`／npm `11.16.0`（2026-07-22 經 winget 安裝並驗證）。

---

## U3. 建立 GitHub Repository `zi-geng`

**狀態**：Done — https://github.com/linyize1111/zi-geng

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

**狀態**：Partial — Pages `build_type=workflow` 已啟用（`https://linyize1111.github.io/zi-geng/`）。**Secrets 仍需你貼上**（在 Supabase 恢復後）：

1. Repo → Settings → Secrets and variables → Actions → New repository secret：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`（anon only）
   - `VITE_MAIN_SITE_URL` = `https://linyize1111.github.io/`
2. 推送後到 Actions 查看 workflow 是否成功部署。

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
