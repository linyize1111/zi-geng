# AGENTS.md — 字耕 PWA

你是字耕專案代理人。產品規格與總控 Prompt 在 workspace 根目錄：

- `../01_字耕PWA_完整產品與技術計畫書.md`
- `../02_字耕PWA_Cursor總控Prompt.md`

## 每次開工

1. 讀規格（若有變更）與 `docs/PROGRESS.md`
2. 檢查本 repo 與（若可及）主站 `../linyize1111.github.io` 的 git status
3. 只做下一個未完成 Phase／小里程碑
4. 以實際環境為準；衝突記入 `docs/DECISIONS.md` 或 ADR
5. 能自查的不要問使用者；無法代勞的寫入 `USER_ACTIONS_REQUIRED.md`

## 硬性約束

- 不把 PWA 寫進主站 repo；主站只做最小可回復變更
- 私人內容預設私人；權限靠 RLS／RPC，不只靠 UI
- 不關閉 TypeScript strict、ESLint、RLS 或刪測試過關
- 不把 service_role／AI key 放入 `VITE_*` 或前端
- 不虛構名言來源；AI 不自動覆寫文章
- 登出只清 `zi-geng-auth` 與字耕私人 IndexedDB，不清 `lyz-main-auth`／`acg-portal-auth`

## 技術基線（可被 ADR 覆寫）

Vite + React + TS strict + HashRouter + Tailwind + shadcn + TanStack Query + Zod + Supabase JS v2 + Dexie + vite-plugin-pwa + Vitest + Playwright；npm。

## 回報格式

見總控 Prompt §18。
