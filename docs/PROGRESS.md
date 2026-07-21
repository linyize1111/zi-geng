Current phase: Phase 1
Current milestone: PWA 骨架
Status: completed

Completed:
- Phase 0 全部
- Vite + React + TS strict + Tailwind 4 + HashRouter
- 全路由殼層、手機底欄、桌面側欄、主題、PWA prompt、mock adapter
- GitHub Actions CI + Pages workflow
- format/lint/typecheck/test/build 全過

Files changed:
- 見本 commit（應用程式骨架）

Migrations:
- none yet

Tests actually run:
- npm run ci（format, oxlint, tsc, vitest 6 passed, vite build + PWA）

Manual checks:
- 未跑 Playwright e2e（需先 preview；列為下一小步可選）

Known limitations:
- 業務功能仍為 placeholder
- 主站 Supabase DNS 仍失效（U1）
- 遠端 repo 可能尚未建立（U3）
- shadcn CLI 未跑；以輕量 Button／CVA 代替

User actions required:
- U1 恢復主站 Supabase
- U3 建立／連接 GitHub repo zi-geng（若尚未）
- U4 Pages + Secrets（遠端就緒後）

Next action:
- Phase 2：Supabase client、zg_ migrations、白名單 auth UI（mock 可先測）
