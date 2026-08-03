-- =====================================================================
-- 字耕 v2.4 Phase 1：內容狀態擴充 + zg_study_events + 抽卡冷卻
-- 可在 Supabase SQL Editor 執行，或作 migration。
-- =====================================================================

-- 1) 內容狀態：保留 inactive（軟下架），並加入 lifecycle 狀態
do $$
declare
  t text;
  cons text;
begin
  foreach t in array array[
    'zg_vocabulary_cards',
    'zg_quotes',
    'zg_craft_cards',
    'zg_writing_prompts',
    'zg_novel_task_templates'
  ]
  loop
    select c.conname into cons
    from pg_constraint c
    join pg_class r on r.oid = c.conrelid
    join pg_namespace n on n.oid = r.relnamespace
    where n.nspname = 'public'
      and r.relname = t
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%';
    if cons is not null then
      execute format('alter table public.%I drop constraint %I', t, cons);
    end if;
    execute format(
      'alter table public.%I add constraint %I check (status in (
        ''seed'',''candidate'',''active'',''quarantine'',''rejected'',''archived'',''inactive'',''draft''
      ))',
      t,
      t || '_status_check'
    );
  end loop;
end $$;

-- 2) 學習事件
create table if not exists public.zg_study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_type text not null
    check (content_type in (
      'vocabulary','quote','craft','prompt','novel','knowledge','japanese'
    )),
  content_id uuid not null,
  normalized_key text,
  event_type text not null
    check (event_type in (
      'shown','refreshed','favorited','dismissed','completed',
      'too_easy','not_useful','want_more','good'
    )),
  local_date date,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists zg_study_events_user_created_idx
  on public.zg_study_events (user_id, created_at desc);

create index if not exists zg_study_events_user_type_key_idx
  on public.zg_study_events (user_id, content_type, normalized_key, created_at desc);

create index if not exists zg_study_events_user_content_idx
  on public.zg_study_events (user_id, content_type, content_id, created_at desc);

alter table public.zg_study_events enable row level security;

drop policy if exists zg_study_events_select_own on public.zg_study_events;
create policy zg_study_events_select_own
  on public.zg_study_events for select
  to authenticated
  using (user_id = auth.uid() and public.is_zg_member());

drop policy if exists zg_study_events_insert_own on public.zg_study_events;
create policy zg_study_events_insert_own
  on public.zg_study_events for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_zg_member());

-- 成員不可任意改／刪事件（保留稽核）；Owner 可用 service role

-- 3) 冷卻：回傳近期出現過的 content_id
create or replace function public.zg_cooldown_content_ids(
  p_content_type text,
  p_days int,
  p_timezone text default 'Asia/Taipei'
)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct e.content_id), '{}'::uuid[])
  from public.zg_study_events e
  where e.user_id = auth.uid()
    and e.content_type = p_content_type
    and e.event_type in (
      'shown','refreshed','completed','too_easy','not_useful','want_more','good','dismissed'
    )
    and e.created_at >= (timezone(coalesce(nullif(trim(p_timezone), ''), 'Asia/Taipei'), now()) - make_interval(days => greatest(p_days, 0)));
$$;

revoke all on function public.zg_cooldown_content_ids(text, int, text) from public;
grant execute on function public.zg_cooldown_content_ids(text, int, text) to authenticated;

-- 太簡單：30 天內不該再出
create or replace function public.zg_blocked_too_easy_ids(
  p_content_type text,
  p_timezone text default 'Asia/Taipei'
)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct e.content_id), '{}'::uuid[])
  from public.zg_study_events e
  where e.user_id = auth.uid()
    and e.content_type = p_content_type
    and e.event_type = 'too_easy'
    and e.created_at >= (timezone(coalesce(nullif(trim(p_timezone), ''), 'Asia/Taipei'), now()) - interval '30 days');
$$;

revoke all on function public.zg_blocked_too_easy_ids(text, text) from public;
grant execute on function public.zg_blocked_too_easy_ids(text, text) to authenticated;

-- 4) 更新每日計劃抽卡：依 study_events 冷卻，階梯放寬；同日不重複靠 unique local_date
create or replace function public.zg_get_or_create_daily_plan(
  p_timezone text default 'Asia/Taipei'
)
returns public.zg_daily_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tz text := coalesce(nullif(trim(p_timezone), ''), 'Asia/Taipei');
  v_date date := (timezone(v_tz, now()))::date;
  v_plan public.zg_daily_plans;
  v_mode text := 'standard';
  v_vocab_n int := 7;
  v_quote uuid;
  v_craft uuid;
  v_prompt uuid;
  v_novel uuid;
  v_vocabs uuid[] := '{}';
  v_cool_v uuid[];
  v_cool_q uuid[];
  v_cool_c uuid[];
  v_cool_p uuid[];
  v_block_v uuid[];
  v_block_q uuid[];
  v_block_c uuid[];
  v_block_p uuid[];
  v_days int;
begin
  if v_uid is null or not public.is_zg_member() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_plan
  from public.zg_daily_plans
  where user_id = v_uid and local_date = v_date;

  if found then
    return v_plan;
  end if;

  select coalesce(daily_mode, 'standard'), coalesce(daily_vocab_count, 7)
    into v_mode, v_vocab_n
  from public.zg_user_settings
  where user_id = v_uid;

  if v_mode = 'light' then
    v_vocab_n := least(v_vocab_n, 3);
  elsif v_mode = 'deep' then
    v_vocab_n := greatest(v_vocab_n, 10);
  end if;

  v_block_v := public.zg_blocked_too_easy_ids('vocabulary', v_tz);
  v_block_q := public.zg_blocked_too_easy_ids('quote', v_tz);
  v_block_c := public.zg_blocked_too_easy_ids('craft', v_tz);
  v_block_p := public.zg_blocked_too_easy_ids('prompt', v_tz);

  -- Quote: try 14 → 7 → 3 → 0
  v_quote := null;
  foreach v_days in array array[14, 7, 3, 0]
  loop
    v_cool_q := case when v_days = 0 then '{}'::uuid[] else public.zg_cooldown_content_ids('quote', v_days, v_tz) end;
    select q.id into v_quote
    from public.zg_quotes q
    where q.status = 'active'
      and q.verification_status in ('verified_primary', 'verified_secondary')
      and coalesce(q.copyright_status, '') is distinct from 'internal_test'
      and not (q.id = any (v_block_q))
      and not (q.id = any (v_cool_q))
      and not exists (
        select 1 from public.zg_daily_plans dp
        where dp.user_id = v_uid and dp.local_date = v_date and dp.quote_id = q.id
      )
    order by md5(q.id::text || v_uid::text || v_date::text)
    limit 1;
    exit when v_quote is not null;
  end loop;

  -- Vocabulary: try 7 → 3 → 0
  foreach v_days in array array[7, 3, 0]
  loop
    v_cool_v := case when v_days = 0 then '{}'::uuid[] else public.zg_cooldown_content_ids('vocabulary', v_days, v_tz) end;
    select array_agg(x.id) into v_vocabs
    from (
      select c.id
      from public.zg_vocabulary_cards c
      where c.status = 'active'
        and not (c.id = any (v_block_v))
        and not (c.id = any (v_cool_v))
      order by md5(c.id::text || v_uid::text || v_date::text)
      limit v_vocab_n
    ) x;
    exit when coalesce(array_length(v_vocabs, 1), 0) >= v_vocab_n;
  end loop;

  if coalesce(array_length(v_vocabs, 1), 0) < v_vocab_n then
    select array_agg(x.id) into v_vocabs
    from (
      select c.id
      from public.zg_vocabulary_cards c
      where c.status = 'active'
        and not (c.id = any (v_block_v))
      order by md5(c.id::text || v_uid::text || v_date::text)
      limit v_vocab_n
    ) x;
  end if;

  -- Craft: 14 → 7 → 3 → 0
  v_craft := null;
  foreach v_days in array array[14, 7, 3, 0]
  loop
    v_cool_c := case when v_days = 0 then '{}'::uuid[] else public.zg_cooldown_content_ids('craft', v_days, v_tz) end;
    select c.id into v_craft
    from public.zg_craft_cards c
    where c.status = 'active'
      and not (c.id = any (v_block_c))
      and not (c.id = any (v_cool_c))
    order by md5(c.id::text || v_uid::text || v_date::text)
    limit 1;
    exit when v_craft is not null;
  end loop;

  -- Prompt: 14 → 7 → 3 → 0
  v_prompt := null;
  foreach v_days in array array[14, 7, 3, 0]
  loop
    v_cool_p := case when v_days = 0 then '{}'::uuid[] else public.zg_cooldown_content_ids('prompt', v_days, v_tz) end;
    select p.id into v_prompt
    from public.zg_writing_prompts p
    where p.status = 'active'
      and not (p.id = any (v_block_p))
      and not (p.id = any (v_cool_p))
    order by md5(p.id::text || v_uid::text || v_date::text)
    limit 1;
    exit when v_prompt is not null;
  end loop;

  select t.id into v_novel
  from public.zg_novel_task_templates t
  where t.status = 'active'
  order by md5(t.id::text || v_uid::text || v_date::text)
  limit 1;

  begin
    insert into public.zg_daily_plans (
      user_id, local_date, timezone, quote_id, vocabulary_ids,
      craft_id, writing_prompt_id, novel_task_template_id
    ) values (
      v_uid, v_date, v_tz, v_quote, coalesce(v_vocabs, '{}'),
      v_craft, v_prompt, v_novel
    )
    returning * into v_plan;
  exception when unique_violation then
    select * into v_plan
    from public.zg_daily_plans
    where user_id = v_uid and local_date = v_date;
  end;

  return v_plan;
end;
$$;

revoke all on function public.zg_get_or_create_daily_plan(text) from public;
grant execute on function public.zg_get_or_create_daily_plan(text) to authenticated;
