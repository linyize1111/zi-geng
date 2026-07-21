# 需要使用者手動完成的事項

> 原則：Cursor 能做的都自動做。

---

## 現在請再跑一次（精簡 SQL）

遠端檢查：`zg_replace_daily_slot` **尚未建立**（先前完整檔可能中途失敗）。

1. https://supabase.com/dashboard/project/ypyiqysgfwgxcmmsylob/sql/new  
2. 清空 → **Ctrl+V**（已放精簡檔 `APPLY_REPLACE_RPC_ONLY.sql`）→ Run  
3. 結果應出現一列：`zg_replace_daily_slot | p_slot text, p_timezone text`  
4. 跟我說「好了」

跑完後到「今日」按「換一批」即可變成 7 詞並啟用刷新。

---

## 已結案

U1–U7 / U9 / Secrets 等皆 Done。
