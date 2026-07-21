Current phase: Phase 3
Current milestone: 內容表／每日計畫 migration（待使用者 Run SQL）
Status: in_progress

Completed:
- Phase 0–2 本機與遠端骨架
- Owner 白名單已由使用者寫入
- 主站 auth.js 保護 zi-geng-auth（commit 1c991dc，已 push Pages）
- Phase 3 SQL：內容表、每日計畫、進度／收藏、get_or_create_daily_plan、dev seed

Tests actually run:
- anon RPC is_zg_member/owner = false
- anon zg_members 回 []（RLS）
- 稍早 npm run ci（Phase 2）

User actions required now:
- U5 Redirect URLs
- U9 貼上並 Run APPLY_PHASE3_IN_SQL_EDITOR.sql（已在剪貼簿）
- U4 GitHub Secrets（部署用）

Next action:
- 使用者完成 U9 後：接 Today 頁真實 daily plan、關 mock 做登入煙測
