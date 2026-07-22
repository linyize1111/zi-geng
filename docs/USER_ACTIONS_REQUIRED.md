# 自動化內容（只需設一次密鑰）

詞庫／名言的爬取與匯入由 GitHub Actions「Content sync」負責，**不要再手動貼大包 SQL**。

## 唯一需要你做的一次設定

在 https://github.com/linyize1111/zi-geng/settings/secrets/actions 新增：

| Secret | 哪裡拿 |
|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role`（secret） |

可選：

| Secret | 用途 |
|--------|------|
| `SUPABASE_ACCESS_TOKEN` | [Account tokens](https://supabase.com/dashboard/account/tokens) — 用來自動套用 RPC SQL |
| `SUPABASE_URL` | 可省略，會用既有 `VITE_SUPABASE_URL` |

設好後到 Actions → **Content sync** → **Run workflow**，或等週一排程／推送 `scripts/content/**` 自動跑。

跑完「今日」會顯示詞庫數百筆；側欄「詞彙」可見完整列表。

## 流程（全自動）

1. 下載教育部成語／重建種子  
2. **service role 寫入 Supabase**（成語 + 多主題名言）  
3. 盡力爬維基詞典／語錄並追加匯入  
4. 種子有變則 commit 並部署 Pages  

前端「換一批」已不依賴舊的每日上限 RPC。
