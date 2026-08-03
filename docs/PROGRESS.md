Current phase: **v2.4 Phases 2–7 shipped (code)**
Current milestone: quality weights + knowledge pipeline + craft lessons + JP 5min + review events
Status: awaiting user SQL apply + content import

Completed this pass:
- Phase 2: `quality_score`/`quality_flags` SQL; client quality-weighted cooldown picks; daily plan RPC quality order
- Phase 3: topic graph, discover/build/import knowledge scripts; Learn `/learn/knowledge`; Today knowledge slot
- Phase 4: `content-sync.yml` knowledge discover→build→score→import (+ artifact); weekly caps 20/8
- Phase 5: ≤40 craft lessons with modules; Learn/Today lesson UX; import upserts lesson columns
- Phase 6: Japanese「今日 5 分鐘」+ row drill + wrong-answer priority
- Phase 7: Review study-event stats + JSON export
- Docs: USER_ACTIONS_REQUIRED Phase 1 then Phase 2–3

User actions required now:
1. Supabase: `APPLY_V24_PHASE1_STUDY_EVENTS.sql`（若尚未）
2. Supabase: `APPLY_V24_PHASE2_3_QUALITY_KNOWLEDGE.sql`
3. （可選）跑 Content sync 或本地 `npm run content:knowledge` 後 `content:knowledge-import`

Routes:
- `/learn/knowledge`, `/learn/knowledge/:id`
- `/japanese` → 今日 5 分鐘；`?mode=drill` 分行練習

Deferred:
- 死刑小說創作工作台
- AI enrich for knowledge (templates first)
