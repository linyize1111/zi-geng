# 待你手動完成

## v2.4 SQL（依序執行）

在 Supabase SQL Editor **依序**執行：

1. `zi-geng/supabase/APPLY_V24_PHASE1_STUDY_EVENTS.sql`  
   → `zg_study_events`、冷卻 RPC、今日抽卡階梯冷卻

2. `zi-geng/supabase/APPLY_V24_PHASE2_3_QUALITY_KNOWLEDGE.sql`  
   → `quality_score`／flags、`zg_source_registry`、`zg_knowledge_cards`、每日計畫 `knowledge_id`、品質加權抽卡

未執行前：

- 學習事件／回饋會靜默略過
- 國學頁可能空白（表尚未建立）
- 技法課新欄位（module／hook 等）會自動 fallback 舊欄位

---

# 自動化內容（只需設一次密鑰）

## 金鑰在哪（Supabase 改版後）

直接開這個頁（先登入 Supabase）：  
https://supabase.com/dashboard/project/ypyiqysgfwgxcmmsylob/settings/api-keys

你會看到兩種，**任選一種**即可：

### 方式 A（新版，較好找）

1. 分頁 **Publishable and secret API keys**（或「API Keys」）  
2. 找 **Secret key**（`sb_secret_...` 開頭）  
3. 若還沒有：按 **Create new secret key** → 建立後複製  
4. 貼到 GitHub Secret，名稱用：`SUPABASE_SECRET_KEY`

### 方式 B（舊版名稱 service_role）

1. 同一頁找分頁 **Legacy anon, service_role API keys**  
2. 找到 **`service_role`**（會標 secret）  
3. 按 **Reveal** 顯示（一長串 `eyJ...`）  
4. 貼到 GitHub Secret，名稱用：`SUPABASE_SERVICE_ROLE_KEY`

### 貼到哪裡

https://github.com/linyize1111/zi-geng/settings/secrets/actions  
→ New repository secret → 名稱如上 → 貼上金鑰 → Add  

設好跟我說一聲，我會立刻跑「Content sync」自動灌庫。

---

不要找「anon / publishable」——那是給前端用的，灌庫不夠權限。
