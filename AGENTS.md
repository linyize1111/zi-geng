# AGENTS.md — 字耕 PWA

你是字耕專案代理人。產品規格與總控 Prompt：

- **現行總控：** `../../推薦系統/字耕_v2.4_Cursor總控Prompt_動態內容管線版.md`（動態內容管線）
- 舊版參考：`../02_字耕PWA_Cursor總控Prompt.md`、`../01_字耕PWA_完整產品與技術計畫書.md`

## 每次開工

1. 讀 v2.4 總控與 `docs/PROGRESS.md`
2. **嚴格按 v2.4 §17 Phase 順序**，不要一次大爆改
3. 暫緩「死刑小說創作工作台」；不大改 Novels 專項
4. 自動內容先進 `candidate`，禁止 Wikiquote 自動當名言池
5. 能自查的不要問使用者；無法代勞的寫入 `USER_ACTIONS_REQUIRED.md`

## 硬性約束

- 不把 PWA 寫進主站 repo；主站只做最小可回復變更
- 私人內容預設私人；權限靠 RLS／RPC，不只靠 UI
- 不關閉 TypeScript strict、ESLint、RLS 或刪測試過關
- 不把 service_role／AI key 放入 `VITE_*` 或前端
- 不虛構名言來源；AI 不自動覆寫文章
- 登出只清 `zi-geng-auth` 與字耕私人 IndexedDB，不清 `lyz-main-auth`／`acg-portal-auth`

## 技術基線（可被 ADR 覆寫）

Vite + React + TS strict + HashRouter + Tailwind + TanStack Query + Zod + Supabase JS v2 + Dexie + vite-plugin-pwa + Vitest + Playwright；npm。

## 回報格式

見 v2.4 §18–§19。
