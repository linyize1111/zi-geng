# 主站現況稽核（Phase 0）

> 稽核時間：2026-07-21  
> 稽核來源：本機 clone `linyize1111/linyize1111.github.io`（`main` @ `6c2f857`）、GitHub Pages API、公開網站 HTTP、主站 migrations／JS、官方 auth-js 原始碼。  
> **不包含** anon key、JWT、真實 Email、私人文章全文。

---

## 1. 工作區事實（與計畫書預期的差異）

| 項目 | 計畫書預期 | 實際發現 |
|------|------------|----------|
| Cursor 初始工作區 | `LYZ-workspace` | 原先開啟的是桌面「推薦系統」（git remote = `acg-portal`） |
| 本機兩站開發位置 | 並列兩個資料夾 | **同一工作站、同一「推薦系統」目錄內**（見下） |
| 主站 repo | `linyize1111.github.io/` | 本機權威工作複本：`推薦系統/temp-pages/`（獨立 git，remote = `linyize1111.github.io`；被 acg-portal 的 `.gitignore` 排除） |
| ACG 原始碼 | 另 repo | `推薦系統/frontend/` → 部署進 `temp-pages/acg-portal/` |
| PWA repo | `zi-geng/` | GitHub 上尚不存在；本機已建於 `LYZ-workspace/zi-geng/` |
| 規格文件 | workspace 根 | 先出現在「推薦系統」根目錄，後複製至 `LYZ-workspace/` |

本機既有雙站佈局（使用者確認；文件 `docs/TWO-PROJECTS-AUTH-GUIDE.md` 亦記載）：

```text
桌面/推薦系統/                    # git: acg-portal（忽略 temp-pages/）
├─ frontend/                      # ACG 開發源
├─ docs/TWO-PROJECTS-AUTH-GUIDE.md
├─ temp-pages/                    # git: linyize1111.github.io  ← 主站權威本機複本
│  ├─ admin.html, assets/, …      # 主站 CMS
│  └─ acg-portal/                 # ACG 部署產物（子路徑）
└─ …（後端、bot、supabase migrations for ACG）
```

Phase 0 期間另建的工作區（方便字耕與規格並列；**主站修改應以 `temp-pages` 為準，避免雙複本漂移**）：

```text
LYZ-workspace/
├─ 01_字耕PWA_完整產品與技術計畫書.md
├─ 02_字耕PWA_Cursor總控Prompt.md
├─ linyize1111.github.io/   # shallow clone（與 temp-pages 同 commit；僅供對照）
└─ zi-geng/                 # 新 PWA
```

---

## 2. 主站技術組成

- **類型**：靜態個人網站（HTML5 UP Massively 版型）+ 輕量 CMS。
- **前端**：純 HTML／CSS／Vanilla JS；CDN 載入 `@supabase/supabase-js`、`marked`、`DOMPurify`。
- **後端**：無常駐 Node server。`package.json` 僅有可選的 express／cors（非 Pages 部署路徑）。
- **CMS 公開端**：`assets/js/cms-public.js` 從 `articles` 讀 `published`；未設定時退回靜態 HTML。
- **後台**：`admin.html` + `assets/js/admin.js`。
- **同 origin 子站**：repo 內嵌 `acg-portal/`（另一產品；獨立 auth key）。
- **內容**：`literature/`、`notes/` 既有 Markdown；seed migration 可匯入 DB。

---

## 3. GitHub Pages 部署方式

以 `gh api repos/linyize1111/linyize1111.github.io/pages` 驗證：

| 項目 | 值 |
|------|-----|
| status | `built` |
| build_type | `legacy` |
| source | branch `main`，path `/` |
| custom_404 | **false** |
| https_enforced | true |
| CNAME | null |
| `.github/workflows` | **不存在**（非 Actions Pages） |

**含義**：

- 主站以 push 到 `main` 直接發布靜態檔。
- **沒有** SPA rewrite／404 fallback → 字耕 PWA 應使用 **HashRouter**（或等價 deep-link 安全方案）。
- 字耕不應寫進主站 repo；獨立 repo `zi-geng` 的 GitHub Pages 自然對應 `https://linyize1111.github.io/zi-geng/`。
- 線上 `https://linyize1111.github.io/zi-geng/` 目前 **404**（尚未部署）。

---

## 4. Supabase client 設定

檔案：`assets/js/supabase-config.js`、`assets/js/supabase-client.js`。

| 設定 | 實際值／行為 |
|------|----------------|
| Project | 獨立主站專案（docs 明確與 ACG **完全隔離**） |
| Project ref（公開） | `ypyiqysgfwgxcmmsylob` |
| bucket | `article-images` |
| storageKey | `lyz-main-auth` |
| flowType | `pkce` |
| persistSession | true |
| autoRefreshToken | true |
| detectSessionInUrl | **false**（由 `auth.js` 單一處 `exchangeCodeForSession`） |
| legacy migration | 舊 `sb-<ref>-auth-token` → `lyz-main-auth` |

ACG 專案（對照，不同專案）：`xpztpetskjohuxrpgmcm`，storageKey `acg-portal-auth`。

### 4.1 即時連線稽核（重要）

本機對 `ypyiqysgfwgxcmmsylob.supabase.co`：

- 家用 DNS 與 Google Public DNS（8.8.8.8）皆回報 **Non-existent domain**。
- `curl` 無法解析主機（http_code=000）。

線上 `supabase-config.js` 仍指向同一 URL。`literature.html` 仍有大量靜態 `note-item`（約 34），故站面可開，但 **動態 CMS／登入很可能已失效**。

→ 見 `USER_ACTIONS_REQUIRED.md`：必須先確認主站 Supabase 專案是否仍存在／需重建。

---

## 5. OAuth／PKCE callback 流程

`assets/js/auth.js`：

1. `signInWithGoogle(redirectTo)` → `prepareForSignIn()` 清衝突 storage → `signInWithOAuth`（Google、PKCE）。
2. `safeRedirectTo` 限制 **同 origin**（防 open redirect）。
3. Callback：讀 `?code=` → `exchangeCodeForSession` → `history.replaceState` 清 code／error。
4. 管理員：`rpc('is_admin')`，前端無法偽造。

文件記載的 Redirect URLs（`docs/SUPABASE_SETUP.md`）：

- Site URL：`https://linyize1111.github.io/`
- Redirect：`/admin.html`、`/`（字耕 `/zi-geng/` **尚未**列入）

---

## 6. 主站 auth storage key 與同 origin 衝突

| App | storageKey |
|-----|------------|
| 主站 | `lyz-main-auth` |
| ACG | `acg-portal-auth` |
| 字耕（計畫） | `zi-geng-auth` |

同 origin（`linyize1111.github.io`）共享 `localStorage`。

### 6.1 主站清理函式風險（已證實）

`clearConflictingAuthStorage`：

- **有保護**：`acg-portal-auth`、`acg_*`
- **未保護**：`zi-geng-auth`
- 會刪除任何 key 名稱含 `code-verifier` 者

官方 auth-js：PKCE verifier 存於 `` `${storageKey}-code-verifier` ``  
→ 字耕會使用 `zi-geng-auth-code-verifier`  
→ 主站登入／自救清理時 **會刪掉字耕 PKCE verifier**，導致並發 OAuth 失敗。

`zi-geng-auth` session 本體因不匹配 `CONFLICT_KEY_RE` 通常會保留，但 verifier 不安全。

ACG `clearAuthStorage` 只清 `sb-*`／`acg-portal`／`acg_`，**不會**清 `zi-geng-auth`。

### 6.2 結論

Phase 0 **確認：現況尚未保證 `zi-geng-auth` 不被主站清除**。  
未來主站最小變更必須把字耕 key 加入白名單（與 ACG 同等）。此變更屬 Phase 4 前／登入整合時執行，Phase 0 不改主站。

---

## 7. `articles` 真實 schema（來自 `0001_init.sql`）

```text
id           uuid PK default gen_random_uuid()
section      text NOT NULL check ('literature','notes')
slug         text NOT NULL
title        text NOT NULL
summary      text NOT NULL default ''
body         text NOT NULL default ''          -- Markdown
cover        text nullable
images       jsonb NOT NULL default []         -- [{src,caption}]
category     text nullable
tags         text[] NOT NULL default {}
pdf_url      text nullable
status       text NOT NULL default 'draft' check ('draft','published')
sort_index   int NOT NULL default 0
published_at timestamptz nullable
created_at   timestamptz NOT NULL
updated_at   timestamptz NOT NULL
UNIQUE (section, slug)
```

Indexes：

- `(section, status, published_at desc)`
- `(category)`

Triggers：`set_updated_at`；published 時自動補 `published_at`。

> 因遠端專案 DNS 失效，未能做 live SQL introspection；以上以 repo migration 為準。專案恢復後應再跑一次確認無漂移。

---

## 8. `articles` RLS

| Policy | 對象 | 規則 |
|--------|------|------|
| `articles_public_read` | anon, authenticated | `status = 'published' OR is_admin()` |
| `articles_admin_insert` | authenticated | `is_admin()` |
| `articles_admin_update` | authenticated | `is_admin()` |
| `articles_admin_delete` | authenticated | `is_admin()` |

---

## 9. `admins` 與 `is_admin()`

```sql
-- SECURITY DEFINER, set search_path = public
-- lower(admins.email) = lower(auth.jwt()->>'email')
-- 回傳 boolean；admins 表僅 admin 可 SELECT；無 API 寫入政策
```

字耕發布至主站必須同時滿足：`is_zg_owner()`（字耕）+ 既有 `is_admin()`（主站）。

---

## 10. Markdown rendering 與 sanitization

`SB.renderMarkdown`：

1. 去掉開頭 frontmatter  
2. `marked`（gfm + breaks）  
3. `DOMPurify.sanitize`（禁止 script／iframe／svg 等；限制 URI）  
4. 無 DOMPurify 時純文字轉義 fallback  

字耕顯示 Markdown 應採同等或更嚴策略。

---

## 11. Storage buckets

| Bucket | 公開讀 | 寫入 | 限制 |
|--------|--------|------|------|
| `article-images` | 是 | 僅 `is_admin()` | 5MB；jpeg/png/webp/gif/avif |

其他 migrations：`site_sections`、`site_analytics`／`visit_events`（分析 RPC）。**不要**為字耕私人文章重用 `articles` 或此 bucket 當預設私人儲存。

---

## 12. 發布串接欄位映射（真實）

| 字耕（計畫） | 主站 `articles` |
|--------------|-----------------|
| title | title |
| content_md | body |
| 表單 summary | summary |
| 表單 category | category |
| 表單 tags | tags |
| 表單 slug | slug |
| 固定 `literature` | section |
| 固定 `draft` | status |
| cover／images／pdf_url | 同名欄位 |
| （回寫）article id | → `published_article_id`（字耕側） |

唯一約束：`(section, slug)` → slug 衝突需明確錯誤，不可覆蓋陌生文章。  
admin.js 已有 duplicate／RLS 錯誤訊息模式可對齊。

---

## 13. 未來主站最小變更清單

Phase 0 **禁止**修改主站功能。之後僅允許：

1. **`assets/js/auth.js`**：`clearConflictingAuthStorage` 白名單加入 `zi-geng-auth` 及其前綴（含 `-code-verifier`），與 ACG 同等。
2. **導覽／文學頁**：增加「字耕」／「進入寫作工作台」連結 → `https://linyize1111.github.io/zi-geng/`（建議 `index.html`、`literature.html`；必要時 footer）。
3. **CSP**：若字耕為獨立 Pages 子路徑，主站 CSP 通常不需改；僅當主站頁內嵌字耕資源時才調整。
4. **Supabase Auth Redirect URLs**：新增 `https://linyize1111.github.io/zi-geng/`（Dashboard，非 repo）。
5. **不得**：重構 HTML5 UP、改 articles RLS 語意、刪 migration、動 ACG 業務邏輯。

---

## 14. 不應碰觸或重構的範圍

- HTML5 UP 版型與全站視覺大翻修  
- `acg-portal/` 子樹與 ACG Supabase  
- 既有 `articles`／`admins`／`is_admin` 語意變更  
- 刪除或改寫已套用的主站 migrations  
- 已發布文章內容  
- 將字耕私人草稿寫入 `articles`  
- 把 service_role 或 AI key 放進任何前端  

---

## 15. 本機開發環境稽核

| 工具 | 狀態 |
|------|------|
| git / gh | 可用 |
| Node.js / npm | **PATH 中未安裝**（可用 winget `OpenJS.NodeJS.LTS`） |
| Supabase CLI | 未安裝 |
| 主站 Supabase DNS | **失敗**（專案可能已刪除） |
| Cursor 內建 node | 存在於 helpers，但無完整 npm toolchain |

---

## 16. 稽核結論（給後續 Phase）

1. 主站是靜態 GitHub Pages + 獨立 Supabase CMS；與 ACG 分離。  
2. 字耕應為**獨立 repo**，Pages 部署到 `/zi-geng/`，**HashRouter**。  
3. 資料庫應優先**共用主站 Supabase**（`zg_` 前綴 + 既有 `is_admin`／`articles`），但**必須先恢復／確認該專案**。  
4. Auth 隔離：`zi-geng-auth`；主站清理函式需補白名單後才能安全同 origin OAuth。  
5. Phase 0 未改主站程式；風險與回復方式見 `DECISIONS.md`／ADR。
