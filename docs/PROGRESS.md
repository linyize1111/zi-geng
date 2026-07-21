Current phase: Phase 2
Current milestone: Auth + zg_members migrations（本機完成；遠端 DB 待 U1）
Status: in_progress

Completed:
- Phase 0–1
- GitHub repo https://github.com/linyize1111/zi-geng 已建立並 push
- Phase 2：supabase-js client（storageKey=zi-geng-auth）、logout 隔離、AuthProvider、RequireMember/Owner
- migration 202607220001_zg_members_profiles_settings.sql
- auth storage unit tests

Tests actually run:
- npm run ci（8 tests passed, build ok）

Known limitations / blockers:
- U1 主站 Supabase DNS NXDOMAIN → 無法套用 migration／真 Google 登入
- U4 GitHub Pages source + Secrets 尚未設
- 內容表／每日計畫尚未做（Phase 3）
- 主站 auth.js 白名單尚未改（同 origin OAuth 前必須）

User actions required:
- U1 恢復／重建主站 Supabase（最高優先）
- U4 Pages Actions + Secrets
- U5 Redirect URL /zi-geng/
- U6 套用 migration 後寫入 Owner email（U7）

Next action:
- 使用者完成 U1 後：套用 migration、接真登入
- 同時可繼續 Phase 3 內容表 SQL 與 UI（mock）
