# 字耕 PWA — 實作計畫

本計畫依總控 Prompt 分期。技術細節以 `current-site-audit.md` 與後續 ADR 為準；產品需求以計畫書為準。

---

## Phase 0：稽核與保護原站

| 項目 | 內容 |
|------|------|
| 目標 | 取得主站／Supabase／部署／auth 真實現況；建立控制文件；不改主站功能 |
| 範圍 | 工作區重整、clone 主站、稽核報告、決策與使用者待辦 |
| 不做 | 主站功能修改、PWA 業務 UI、套用正式 DB migration |
| 預計檔案 | `docs/current-site-audit.md`、`implementation-plan.md`、`PROGRESS.md`、`USER_ACTIONS_REQUIRED.md`、`DECISIONS.md`、`adr/*`、`AGENTS.md`、`.cursor/rules/project.mdc` |
| Migration | 無 |
| 測試 | 文件驗收清單（見 Phase 0 完成條件） |
| 風險 | 主站 Supabase DNS 失效；本機無 Node |
| 完成條件 | 稽核完成；articles／is_admin／storageKey 已定位；zi-geng-auth 清除風險已記錄；控制文件齊備 |

---

## Phase 1：PWA 骨架

| 項目 | 內容 |
|------|------|
| 目標 | 可部署的 Vite＋React＋TS 骨架、HashRouter、版面、PWA manifest、CI、mock |
| 範圍 | 見總控 §7；`base=/zi-geng/` |
| 不做 | 真實 Supabase 登入、內容業務、改主站 |
| 預計檔案 | `src/app`、`components/layout`、`routes`、`vite.config.ts`、`.github/workflows`、測試 |
| Migration | 無 |
| 測試 | format／lint／typecheck／unit／build；layout／route／theme／manifest |
| 風險 | 需先安裝 Node；Pages project site 設定 |
| 完成條件 | 本機可跑；CI green；mock 下可瀏覽所有路由殼 |

---

## Phase 2：Supabase、Google 登入與白名單

| 項目 | 內容 |
|------|------|
| 目標 | `zi-geng-auth`、會員白名單、`zg_` 核心表與 RLS、onboarding |
| 範圍 | client factory、migrations、login／unauthorized／settings |
| 不做 | 發布主站、AI、完整內容庫 |
| Migration | `zg_members`／`profiles`／`settings`＋內容與私人表（可拆多檔）；`is_zg_member`／`is_zg_owner` |
| 測試 | 權限隔離、storage key、登出不刪主站 key、bundle 無 service role |
| 風險 | 主站 Supabase 需先恢復；Redirect URL 需手動加；主站 auth 白名單尚未改時 OAuth 競態 |
| 完成條件 | 白名單可登入；非成員拒絕；RLS 測試通過或 mock＋migration 完備 |

---

## Phase 3：每日中文學習閉環

| 項目 | 內容 |
|------|------|
| 目標 | 今日頁＋詞彙／名言／技巧／題目；每日計畫 deterministic |
| 範圍 | 內容表、seed、getOrCreateDailyPlan、進度／收藏 |
| 不做 | 複雜 SRS、小說全文、日文完整 |
| 測試 | 同日固定、跨日、timezone、unverified 名言排除 |
| 完成條件 | 手機可完成每日中文學習 |

---

## Phase 4：寫作、離線、自動儲存與主站發布

| 項目 | 內容 |
|------|------|
| 目標 | 私人寫作、Dexie、revision 衝突、Owner 發主站 draft、主站最小入口 |
| 範圍 | 總控 §10；含主站 auth 白名單與導覽連結 |
| 不做 | 自動 published、全面重構主站 |
| Migration | writing entries／revisions；發布 RPC 或等效 |
| 測試 | autosave／offline／conflict／slug／member deny／主站 smoke |
| 風險 | 改主站 auth.js 需可回復；共用 DB 寫入 articles |
| 完成條件 | 離線不丟文；Owner 可建 draft；Member 不能發；主站公開列表正常 |

---

## Phase 5：小說工作台

專案／人物／章節／場景／每日任務；重用 Phase 4 autosave。

## Phase 6：日文初學區

五十音圖、辨音練習、初級詞彙／文法（靜態種子）；本機進度。音訊與濁音／拗音表後續。

## Phase 7：內容管理、提醒、回顧與 PWA 完善

Owner 種子匯入已上；完整 CRUD CMS 後續。ICS 提醒下載、每週回顧（本機摘要）、安裝說明文案已上；離線 runtime caching 後續。

## Phase 8：AI 寫作教練骨架

Edge Function；opt-in；無 key 時核心功能不受影響。

---

## 跨 Phase 品質門檻

每 Phase 結束實際執行（有 toolchain 後）：

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

禁止關閉 strict／RLS／刪測試過關。
