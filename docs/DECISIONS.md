# Decisions log

小型決策記於此；重大架構見 `docs/adr/`。

---

## 2026-07-21 — 工作區從 acg-portal 遷至 LYZ-workspace

- **發現（初判有誤，已更正）**：規格出現在「推薦系統」時，誤以為主站不在本機。實際上兩站都在此工作站開發：
  - ACG：`推薦系統/frontend/`（remote `acg-portal`）
  - 主站：`推薦系統/temp-pages/`（獨立 git，remote `linyize1111.github.io`；被 acg `.gitignore`）
  - 對照文件：`推薦系統/docs/TWO-PROJECTS-AUTH-GUIDE.md`
- **採用**：另建 `LYZ-workspace/` 放規格與 `zi-geng/`；主站**權威本機複本仍以 `temp-pages` 為準**。`LYZ-workspace/linyize1111.github.io` 僅為同 commit 的對照 clone，避免與 `temp-pages` 雙寫。
- **未採用**：在 acg-portal tracked 樹內建 PWA；把字耕塞進 `temp-pages/`。
- **影響**：後續主站最小變更應改 `推薦系統/temp-pages` 再 push Pages；字耕在 `LYZ-workspace/zi-geng`。
- **回復**：刪除 `LYZ-workspace` 不影響既有兩站；勿刪 `temp-pages`。
- **證據**：`temp-pages` 有 `.git` → `linyize1111.github.io`；與 LYZ clone 同為 `6c2f857`；`TWO-PROJECTS-AUTH-GUIDE.md` 原始碼位置表。

---

## 2026-07-21 — 字耕使用獨立 GitHub Repository

- **發現**：計畫要求不把 PWA 寫進主站；Pages 無 Actions；project site URL 即 `/zi-geng/`。
- **採用**：獨立 repo `zi-geng`，未來以 GitHub Actions → Pages 部署。
- **未採用**：把 dist 提交進主站 `zi-geng/` 目錄（耦合、易誤改主站）。
- **影響**：需另建 GitHub remote 與 Pages；主站只加連結。
- **回復**：刪除 `zi-geng` repo／目錄。
- **證據**：Pages API `custom_404=false`；線上 `/zi-geng/` 404。

---

## 2026-07-21 — 路由採 HashRouter；Vite base `/zi-geng/`

- **發現**：主站 Pages legacy、無 custom 404／rewrite。
- **採用**：HashRouter；`start_url` `/zi-geng/#/today`。
- **未採用**：BrowserRouter（deep-link refresh 會 404，除非另做 404.html hack 且經 E2E 證明）。
- **證據**：`gh api .../pages` → `custom_404: false`。

---

## 2026-07-21 — 共用主站 Supabase（條件式），不用 ACG 專案

- **發現**：主站與 ACG 為不同專案；發布需寫入主站 `articles` 並呼叫 `is_admin()`。
- **採用**：字耕 `zg_*` 表放在**主站** Supabase；私人資料 RLS 隔離。
- **未採用**：放進 ACG DB（錯誤邊界／內容風險）；或新專案（發布需跨專案，複雜度高）。
- **阻礙**：主站專案 DNS 目前不存在 → 必須先由使用者恢復／重建（見 USER_ACTIONS）。
- **回復**：未套用任何遠端 migration；僅文件決策。
- **證據**：主站 migrations 註明與 ACG 隔離；ACG `.env` 為不同 ref。

---

## 2026-07-21 — Package manager 選定 npm（待安裝 Node）

- **發現**：本機 PATH 無 Node／npm／pnpm／yarn；主站有 `package-lock.json`。
- **採用**：字耕使用 **npm** + lockfile；Phase 1 前安裝 Node.js LTS（winget）。
- **未採用**：pnpm／yarn（無既有慣例，且需額外工具）。
- **證據**：`where node` 失敗；winget 可裝 `OpenJS.NodeJS.LTS`。

---

## 2026-07-22 — 標準每日詞彙改為 7；允許刷新

- **發現**：使用者回饋每日 3 詞偏少，並需要刷新。
- **採用**：`daily_vocab_count` 預設 7（light≤3、deep≥10）；`zg_replace_daily_slot`：詞彙每天最多 5 次，名言／技巧 2，題目／小說 1（題目／小說依產品規格）。
- **未採用**：完全自由無限刷新（破壞「當日固定」與複習節奏）。
- **影響**：需在 Supabase Run `APPLY_VOCAB_REFRESH_IN_SQL_EDITOR.sql`；既有今日計畫需按「換一批」才會變成 7 詞。

---

## 2026-07-22 — Lint 採用 oxlint（Vite 官方 scaffold），非 ESLint

- **發現**：`create-vite` React-TS 模板預設 oxlint；已安裝於專案。
- **採用**：`npm run lint` = oxlint；另以 Prettier 做 format:check。
- **未採用**：再裝一層 ESLint（重複、增加維護成本）。
- **證據**：scaffold `.oxlintrc.json`；CI 跑 oxlint。

---

## 2026-07-21 — Phase 0 不修改主站；auth 白名單列為後續最小變更

- **發現**：主站 `clearConflictingAuthStorage` 會刪除 `*-code-verifier`，未保護 `zi-geng-auth`。
- **採用**：Phase 0 只記錄；在 Phase 2／4 登入整合前以最小 diff 修主站。
- **回復**：主站尚未改動，無需回復。
