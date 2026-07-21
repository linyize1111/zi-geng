Current phase: Phase 4
Current milestone: 寫作本機草稿骨架（列表／新建／編輯／autosave）
Status: in_progress

Completed:
- Phase 0–2 骨架、Owner、主站 auth 保護
- Phase 3 SQL（使用者已 Run）
- Today 頁接 zg_get_or_create_daily_plan
- 詞彙／名言／技巧列表＋詳情接真實 API
- GitHub Secrets 已用 gh 寫入（U4 Done）
- 本機 VITE_USE_MOCK_ADAPTER=false
- Phase 4 起步：Dexie 本機 drafts、寫作列表／編輯頁、400ms autosave、syncStatus=local-only
- Today「開始寫作」可依今日題目建立草稿

Tests actually run:
- npm run ci
- anon REST 表存在（[] 為 RLS 正常）

User actions required now:
- 無強制項。可選：之後用 Google 登入煙測一次（M1）

Next action:
- 接 zg_writing_entries 雲端同步／revision；Owner 發布主站 draft 仍未做
