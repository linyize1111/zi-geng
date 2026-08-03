Current phase: **v2.4 Phase 1** — 狀態與事件系統
Current milestone: content status lifecycle + zg_study_events + Today cooldown/feedback
Status: in_progress

Completed this pass:
- SQL: `supabase/migrations/202608040001_v24_phase1_study_events.sql`（及 APPLY 副本）
  - 內容 status 擴充 seed/candidate/active/quarantine/rejected/archived（保留 inactive/draft）
  - `zg_study_events` + RLS
  - `zg_cooldown_content_ids` / `zg_blocked_too_easy_ids`
  - `zg_get_or_create_daily_plan` 改為階梯冷卻抽卡
- Client: `normalizeTerm`／cooldown pick、今日 `shown` 記錄、回饋按鈕（太簡單／不實用／想多看／很好）
- AGENTS.md 指向 v2.4 總控

User actions required now:
- 在 Supabase SQL Editor 執行 `supabase/APPLY_V24_PHASE1_STUDY_EVENTS.sql`
  （未執行前：前端會軟失敗略過事件寫入；抽卡仍可用舊 RPC／client fallback）

Next (v2.4 Phase 2):
- quality_score fields + quality-score.mjs
- Today 依品質權重抽卡

Deferred:
- 死刑小說工作台
- Phase 3+ 國學 topic graph／Content sync 升級
