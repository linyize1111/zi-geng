-- 字耕 Phase 2：一次貼上執行（主站專案）
-- 路徑：Supabase Dashboard → SQL Editor → New query → Run
-- 安全：僅新增 zg_*；不改 articles / is_admin

-- =====================================================================
create extension if not exists pgcrypto;

create table if not exists public.zg_members (
  email      text primary key,
  role       text not null check (role in ('owner', 'member')),
  enabled    boolean not null default true,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.zg_members enable row level security;

create or replace function public.is_zg_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.zg_members m
    where m.enabled = true
      and lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_zg_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.zg_members m
    where m.enabled = true
      and m.role = 'owner'
      and lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_zg_member() from public;
revoke all on function public.is_zg_owner() from public;
grant execute on function public.is_zg_member() to anon, authenticated;
grant execute on function public.is_zg_owner() to anon, authenticated;

drop policy if exists zg_members_owner_read on public.zg_members;
create policy zg_members_owner_read on public.zg_members
  for select to authenticated
  using (public.is_zg_owner());

grant select on public.zg_members to authenticated;

create table if not exists public.zg_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null default '',
  timezone   text not null default 'Asia/Taipei',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.zg_profiles enable row level security;

drop policy if exists zg_profiles_select_own on public.zg_profiles;
create policy zg_profiles_select_own on public.zg_profiles
  for select to authenticated
  using (public.is_zg_member() and user_id = auth.uid());

drop policy if exists zg_profiles_insert_own on public.zg_profiles;
create policy zg_profiles_insert_own on public.zg_profiles
  for insert to authenticated
  with check (public.is_zg_member() and user_id = auth.uid());

drop policy if exists zg_profiles_update_own on public.zg_profiles;
create policy zg_profiles_update_own on public.zg_profiles
  for update to authenticated
  using (public.is_zg_member() and user_id = auth.uid())
  with check (public.is_zg_member() and user_id = auth.uid());

grant select, insert, update on public.zg_profiles to authenticated;

create table if not exists public.zg_user_settings (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  daily_mode         text not null default 'standard'
                       check (daily_mode in ('light', 'standard', 'deep')),
  daily_vocab_count  integer not null default 3 check (daily_vocab_count between 1 and 10),
  preferred_topics   jsonb not null default '[]'::jsonb,
  novel_enabled      boolean not null default true,
  japanese_enabled   boolean not null default false,
  reminder_time      time,
  theme              text not null default 'system'
                       check (theme in ('light', 'dark', 'system')),
  ai_enabled         boolean not null default false,
  onboarding_done    boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.zg_user_settings enable row level security;

drop policy if exists zg_settings_select_own on public.zg_user_settings;
create policy zg_settings_select_own on public.zg_user_settings
  for select to authenticated
  using (public.is_zg_member() and user_id = auth.uid());

drop policy if exists zg_settings_insert_own on public.zg_user_settings;
create policy zg_settings_insert_own on public.zg_user_settings
  for insert to authenticated
  with check (public.is_zg_member() and user_id = auth.uid());

drop policy if exists zg_settings_update_own on public.zg_user_settings;
create policy zg_settings_update_own on public.zg_user_settings
  for update to authenticated
  using (public.is_zg_member() and user_id = auth.uid())
  with check (public.is_zg_member() and user_id = auth.uid());

grant select, insert, update on public.zg_user_settings to authenticated;

-- 驗證
select
  to_regclass('public.zg_members') as zg_members,
  to_regclass('public.zg_profiles') as zg_profiles,
  to_regclass('public.zg_user_settings') as zg_user_settings,
  public.is_zg_member() as is_zg_member_anon,
  public.is_zg_owner() as is_zg_owner_anon;
