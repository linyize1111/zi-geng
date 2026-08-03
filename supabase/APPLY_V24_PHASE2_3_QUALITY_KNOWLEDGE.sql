-- =====================================================================
-- 字耕 v2.4 Phase 2–3：quality fields + source registry + knowledge cards
-- =====================================================================

-- quality on existing content
alter table public.zg_vocabulary_cards
  add column if not exists quality_score int not null default 70,
  add column if not exists quality_flags text[] not null default '{}';

alter table public.zg_quotes
  add column if not exists quality_score int not null default 70,
  add column if not exists quality_flags text[] not null default '{}';

alter table public.zg_craft_cards
  add column if not exists quality_score int not null default 70,
  add column if not exists quality_flags text[] not null default '{}',
  add column if not exists module text,
  add column if not exists lesson_order int,
  add column if not exists hook text,
  add column if not exists concept text,
  add column if not exists paragraph_demo text,
  add column if not exists breakdown_steps text[] not null default '{}',
  add column if not exists quick_drill text,
  add column if not exists deeper_drill text,
  add column if not exists related_vocab_tags text[] not null default '{}',
  add column if not exists related_knowledge_topics text[] not null default '{}';

alter table public.zg_writing_prompts
  add column if not exists quality_score int not null default 70,
  add column if not exists quality_flags text[] not null default '{}';

create index if not exists zg_vocab_quality_idx on public.zg_vocabulary_cards (status, quality_score desc);
create index if not exists zg_quotes_quality_idx on public.zg_quotes (status, quality_score desc);
create index if not exists zg_craft_quality_idx on public.zg_craft_cards (status, quality_score desc);

-- source registry
create table if not exists public.zg_source_registry (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active',
  source_key text not null unique,
  title text not null,
  base_url text,
  source_type text not null,
  license_note text,
  crawl_policy text not null default 'manual',
  allowed_content_types text[] not null default '{}',
  reliability_score int not null default 70,
  copyright_risk int not null default 50,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.zg_source_registry enable row level security;

drop policy if exists zg_source_registry_select_member on public.zg_source_registry;
create policy zg_source_registry_select_member
  on public.zg_source_registry for select
  to authenticated
  using (public.is_zg_member());

insert into public.zg_source_registry (
  source_key, title, source_type, allowed_content_types,
  reliability_score, copyright_risk, crawl_policy, license_note
) values
  ('moe_revised_dict', '教育部重編國語辭典修訂本', 'dictionary', array['vocabulary','knowledge'], 95, 30, 'limited', 'CC BY-ND 3.0 TW'),
  ('moe_idiom_dict', '教育部成語典', 'dictionary', array['vocabulary','knowledge'], 95, 30, 'limited', 'CC BY-ND 3.0 TW'),
  ('manual_curated', '字耕人工整理', 'manual', array['vocabulary','knowledge','craft','prompt','quote'], 90, 10, 'manual', 'internal'),
  ('wikidata_or_wikipedia_summary', '維基資料／維基百科摘要', 'wiki', array['knowledge'], 65, 40, 'limited', 'CC BY-SA'),
  ('public_domain_classics', '公版古典文本', 'open_text', array['vocabulary','knowledge','quote'], 80, 20, 'limited', 'public domain')
on conflict (source_key) do nothing;

-- knowledge cards
create table if not exists public.zg_knowledge_cards (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'candidate'
    check (status in ('seed','candidate','active','quarantine','rejected','archived','inactive','draft')),
  series text not null,
  topic_key text not null,
  title text not null,
  subtitle text,
  hook text not null default '',
  story_md text not null default '',
  facts jsonb not null default '[]'::jsonb,
  glossary jsonb not null default '[]'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  why_it_matters text not null default '',
  writing_use text,
  reading_time_sec int not null default 90,
  difficulty int not null default 3,
  quality_score int not null default 50,
  source_refs jsonb not null default '[]'::jsonb,
  quality_flags text[] not null default '{}',
  tags text[] not null default '{}',
  source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series, topic_key)
);

create index if not exists zg_knowledge_status_series_idx
  on public.zg_knowledge_cards (status, series, quality_score desc);

alter table public.zg_knowledge_cards enable row level security;

drop policy if exists zg_knowledge_select_member on public.zg_knowledge_cards;
create policy zg_knowledge_select_member
  on public.zg_knowledge_cards for select
  to authenticated
  using (
    public.is_zg_member()
    and status in ('active','seed')
  );

drop policy if exists zg_knowledge_select_owner_all on public.zg_knowledge_cards;
create policy zg_knowledge_select_owner_all
  on public.zg_knowledge_cards for select
  to authenticated
  using (public.is_zg_owner());

-- daily plan: optional knowledge slot
alter table public.zg_daily_plans
  add column if not exists knowledge_id uuid references public.zg_knowledge_cards(id);

-- weighted pick helper: prefer higher quality_score among cool-eligible
create or replace function public.zg_pick_weighted_id(
  p_table text,
  p_blocked uuid[],
  v_uid uuid,
  v_date date
)
returns uuid
language plpgsql
stable
as $$
declare
  v_id uuid;
begin
  -- simplified: order by quality_score desc then md5
  if p_table = 'zg_quotes' then
    select q.id into v_id
    from public.zg_quotes q
    where q.status = 'active'
      and q.verification_status in ('verified_primary', 'verified_secondary')
      and coalesce(q.copyright_status, '') is distinct from 'internal_test'
      and not (q.id = any (p_blocked))
    order by coalesce(q.quality_score, 70) desc, md5(q.id::text || v_uid::text || v_date::text)
    limit 1;
  elsif p_table = 'zg_craft_cards' then
    select c.id into v_id
    from public.zg_craft_cards c
    where c.status = 'active'
      and not (c.id = any (p_blocked))
    order by coalesce(c.quality_score, 70) desc, md5(c.id::text || v_uid::text || v_date::text)
    limit 1;
  elsif p_table = 'zg_knowledge_cards' then
    select k.id into v_id
    from public.zg_knowledge_cards k
    where k.status in ('active','seed')
      and not (k.id = any (p_blocked))
    order by coalesce(k.quality_score, 70) desc, md5(k.id::text || v_uid::text || v_date::text)
    limit 1;
  end if;
  return v_id;
end;
$$;

-- Daily plan: quality-weighted picks + knowledge slot
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
  v_knowledge uuid;
  v_vocabs uuid[] := '{}';
  v_cool_v uuid[];
  v_cool_q uuid[];
  v_cool_c uuid[];
  v_cool_p uuid[];
  v_cool_k uuid[];
  v_block_v uuid[];
  v_block_q uuid[];
  v_block_c uuid[];
  v_block_p uuid[];
  v_block_k uuid[];
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
  v_block_k := public.zg_blocked_too_easy_ids('knowledge', v_tz);

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
    order by coalesce(q.quality_score, 70) desc, md5(q.id::text || v_uid::text || v_date::text)
    limit 1;
    exit when v_quote is not null;
  end loop;

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
      order by coalesce(c.quality_score, 70) desc, md5(c.id::text || v_uid::text || v_date::text)
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
      order by coalesce(c.quality_score, 70) desc, md5(c.id::text || v_uid::text || v_date::text)
      limit v_vocab_n
    ) x;
  end if;

  v_craft := null;
  foreach v_days in array array[14, 7, 3, 0]
  loop
    v_cool_c := case when v_days = 0 then '{}'::uuid[] else public.zg_cooldown_content_ids('craft', v_days, v_tz) end;
    select c.id into v_craft
    from public.zg_craft_cards c
    where c.status = 'active'
      and not (c.id = any (v_block_c))
      and not (c.id = any (v_cool_c))
    order by coalesce(c.quality_score, 70) desc, md5(c.id::text || v_uid::text || v_date::text)
    limit 1;
    exit when v_craft is not null;
  end loop;

  v_prompt := null;
  foreach v_days in array array[14, 7, 3, 0]
  loop
    v_cool_p := case when v_days = 0 then '{}'::uuid[] else public.zg_cooldown_content_ids('prompt', v_days, v_tz) end;
    select p.id into v_prompt
    from public.zg_writing_prompts p
    where p.status = 'active'
      and not (p.id = any (v_block_p))
      and not (p.id = any (v_cool_p))
    order by coalesce(p.quality_score, 70) desc, md5(p.id::text || v_uid::text || v_date::text)
    limit 1;
    exit when v_prompt is not null;
  end loop;

  select t.id into v_novel
  from public.zg_novel_task_templates t
  where t.status = 'active'
  order by md5(t.id::text || v_uid::text || v_date::text)
  limit 1;

  v_knowledge := null;
  foreach v_days in array array[21, 14, 7, 3, 0]
  loop
    v_cool_k := case when v_days = 0 then '{}'::uuid[] else public.zg_cooldown_content_ids('knowledge', v_days, v_tz) end;
    select k.id into v_knowledge
    from public.zg_knowledge_cards k
    where k.status in ('active', 'seed')
      and not (k.id = any (v_block_k))
      and not (k.id = any (v_cool_k))
    order by coalesce(k.quality_score, 50) desc, md5(k.id::text || v_uid::text || v_date::text)
    limit 1;
    exit when v_knowledge is not null;
  end loop;

  begin
    insert into public.zg_daily_plans (
      user_id, local_date, timezone, quote_id, vocabulary_ids,
      craft_id, writing_prompt_id, novel_task_template_id, knowledge_id
    ) values (
      v_uid, v_date, v_tz, v_quote, coalesce(v_vocabs, '{}'),
      v_craft, v_prompt, v_novel, v_knowledge
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
