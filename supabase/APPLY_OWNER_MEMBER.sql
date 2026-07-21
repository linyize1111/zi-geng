-- 字耕：加入 Owner（在 SQL Editor 執行）
-- 信箱請與 Google 登入、主站 admins 白名單一致

insert into public.zg_members (email, role, enabled, note) values
  ('jay0975008815@gmail.com', 'owner', true, '字耕主人')
on conflict (email) do update
  set role = excluded.role,
      enabled = true,
      note = excluded.note;

-- 驗證（應回傳 1 列）
select email, role, enabled from public.zg_members;
