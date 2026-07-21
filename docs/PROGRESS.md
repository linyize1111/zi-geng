Current phase: Phase 0
Current milestone: 稽核與保護原站（文件與決策）
Status: completed

Completed:
- 完整閱讀兩份規格
- 發現初始工作區為 acg-portal，已建立 LYZ-workspace 並切換 agent root
- clone 主站 repo（只讀稽核，未改功能）
- 寫入 current-site-audit.md
- 建立 implementation-plan / PROGRESS / USER_ACTIONS_REQUIRED / DECISIONS / ADR-0001
- 建立 AGENTS.md 與 .cursor/rules/project.mdc
- 確認 articles schema、is_admin、RLS、storageKey=lyz-main-auth
- 確認 zi-geng-auth 會被主站 code-verifier 清理邏輯誤刪（需未來最小變更）
- 確認主站 Supabase DNS NXDOMAIN（阻斷遠端 introspection）
- 確認本機無 Node（阻斷 Phase 1 toolchain）

Files changed:
- docs/current-site-audit.md
- docs/implementation-plan.md
- docs/PROGRESS.md
- docs/USER_ACTIONS_REQUIRED.md
- docs/DECISIONS.md
- docs/adr/0001-deployment-and-database-boundary.md
- AGENTS.md
- .cursor/rules/project.mdc
- README.md
- .gitignore

Migrations:
- none

Tests actually run:
- git status / remote / log（主站與工作區）
- gh repo list；gh api pages
- HTTP 200：主站 index、literature；zi-geng 路徑 404
- nslookup／curl：主站 Supabase host NXDOMAIN
- 靜態閱讀 migrations 與 auth／cms JS
- 未執行 npm／supabase CLI（工具未安裝／DNS 失敗）

Manual checks:
- 線上 supabase-config.js 仍指向失效專案 ref
- literature 靜態 note-item 仍存在

Known limitations:
- 無法 live 驗證 DB schema 與 RLS（Supabase DNS 失敗）
- 無 Node，尚未 scaffold Vite app
- GitHub 上尚無 zi-geng remote

User actions required:
- U1 恢復主站 Supabase（最高優先）
- U2 Done（Node v24.18.0 / npm 11.16.0）
- U3 建立 GitHub repo zi-geng
- 其餘見 USER_ACTIONS_REQUIRED.md

Next action:
- Phase 1：Vite＋React＋TS＋HashRouter＋PWA 骨架
- 並行請使用者處理 U1（主站 Supabase DNS NXDOMAIN）
