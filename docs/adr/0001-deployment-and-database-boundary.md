# ADR-0001：字耕部署與資料庫邊界

## Status

Accepted（Phase 0）

## Context

需要在既有 `linyize1111.github.io` 旁提供可安裝 PWA「字耕」，且：

- 不破壞主站與已發布內容
- 私人寫作預設不公開
- Owner 可主動將文章送入主站 `articles` 為 `draft`
- 同 origin 已有主站與 `acg-portal` 兩套 auth storage

## Decision

1. **獨立 Repository** `zi-geng`，以 GitHub Actions 部署 GitHub Pages project site（`/zi-geng/`）。
2. **HashRouter** + Vite `base: '/zi-geng/'`（主站無 SPA fallback）。
3. **共用主站 Supabase 專案**存放 `zg_*` 表與 Auth；**不**使用 ACG 專案。
4. Auth `storageKey: 'zi-geng-auth'`；登出只清字耕資料。
5. 主站僅允許最小變更：auth 清理白名單、導覽連結、必要 CSP／Redirect（Dashboard）。

## Alternatives considered

| 方案 | 為何未採 |
|------|----------|
| PWA 目錄提交進主站 repo | 違反「不寫入主站 repo」；易誤傷主站 |
| BrowserRouter | 無 custom 404 時 deep-link 404 |
| 全新獨立 Supabase | 發布 `articles`／`is_admin` 需跨專案，複雜且易權限漏洞 |
| 使用 ACG Supabase | 與成人向產品耦合；主站 docs 要求隔離 |

## Consequences

- 必須先確認主站 Supabase 專案可用（目前 DNS NXDOMAIN）。
- 主站 `auth.js` 必須在同 origin OAuth 前保護 `zi-geng-auth*`。
- CI／Secrets 設在 `zi-geng` repo，不進主站。

## Rollback

- 未部署前：刪除 `zi-geng` 目錄／遠端即可。
- 若已加主站連結：還原該次主站 commit。
- DB：僅 additive `zg_*`；可 disable RLS policies 後 drop（需備份後執行）。

## Evidence

- Pages：`build_type=legacy`，`custom_404=false`
- 主站 migrations：獨立專案註記；`articles`／`is_admin` schema
- ACG：不同 project ref
- auth-js：verifier key = `` `${storageKey}-code-verifier` ``
