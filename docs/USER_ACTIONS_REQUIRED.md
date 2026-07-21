# 需要使用者手動完成的事項

> 原則：Cursor 能做的都自動做。這裡只列**目前真的卡帳號／授權**的項目。

---

## 目前狀態：你暫時什麼都不用做

已自動完成：

- GitHub Secrets（U4）：`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_MAIN_SITE_URL`
- Phase 2／3 SQL（你先前已 Run）
- 主站 `zi-geng-auth` 保護
- Today／詞彙／名言／技巧頁接真實 API
- 本機 mock 關閉

---

## 唯一可能需要你動手的情況

### M1. Google 登入煙測（30 秒，可之後再做）

我無法代你完成 Google 帳號選擇。等你有空時：

1. 開已在跑的本機頁（或 `npm run dev`）
2. `http://localhost:5173/zi-geng/#/login` → 用 Owner Google 登入
3. 看「今日」有沒有卡片

成功或失敗跟我說一句即可；失敗我會接手排查。

### M2. 若登入後「今日／詞彙」全空

代表 seed 可能沒寫入。那時我會請你**只做一件事**：在已登入的 Supabase SQL Editor 按一次 Run（SQL 我會放進剪貼簿）。  
（沒有 service_role／Dashboard 登入權時，我無法代替你寫入資料庫。）

### M3. Supabase Redirect（僅登入跳轉失敗時）

若 OAuth 回不來本機，Redirect URLs 需含：

- `https://linyize1111.github.io/zi-geng/`
- `http://localhost:5173/zi-geng/`

---

## 已結案手動項

| ID | 事項 | 狀態 |
|----|------|------|
| U1 | Resume Supabase | Done |
| U2 | 安裝 Node | Done |
| U3 | 建立 repo | Done |
| U4 | GitHub Secrets | Done（gh 自動寫入） |
| U5 | Redirect URLs | 你先前確認；若登入失敗再查 |
| U6–U7 | Phase2／Owner | Done |
| U9 | Phase3 SQL | Done（你確認） |
