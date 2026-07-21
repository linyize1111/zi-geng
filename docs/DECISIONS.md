# Decisions log

小型決策記於此；重大架構見 `docs/adr/`。

---

## 2026-07-21 — 工作區從 acg-portal 遷至 LYZ-workspace

- **發現**：規格被放在 `acg-portal`（推薦系統）repo；主站與 `zi-geng` 皆不在該 repo。
- **採用**：於桌面建立 `LYZ-workspace/`，含規格、主站 clone、`zi-geng/`；Cursor agent root 切換至此。
- **未採用**：在 acg-portal 內建 PWA（會污染無關產品）。
- **影響**：acg-portal 僅留下未追蹤的規格副本；字耕工作不依賴它。
- **回復**：刪除 `LYZ-workspace` 即可；主站 clone 為 shallow、未改功能。
- **證據**：`git remote` 顯示 acg-portal；`gh repo list` 有主站、無 zi-geng。

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

## 2026-07-21 — Phase 0 不修改主站；auth 白名單列為後續最小變更

- **發現**：主站 `clearConflictingAuthStorage` 會刪除 `*-code-verifier`，未保護 `zi-geng-auth`。
- **採用**：Phase 0 只記錄；在 Phase 2／4 登入整合前以最小 diff 修主站。
- **回復**：主站尚未改動，無需回復。
