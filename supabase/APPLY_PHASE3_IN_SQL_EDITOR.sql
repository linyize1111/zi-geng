-- 字耕 Phase 3 一次執行：內容表 + 每日計畫 RPC + 開發 seed
-- SQL Editor → 貼上 → Run

-- =====================================================================
-- 字耕 Phase 3：內容表、每日計畫、詞彙進度、收藏
-- 前置：202607220001（zg_members / profiles / settings）
-- =====================================================================

-- 共用 updated_at（主站可能已有 set_updated_at；若無則建立）
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 內容：詞彙
-- ---------------------------------------------------------------------
create table if not exists public.zg_vocabulary_cards (
  id              uuid primary key default gen_random_uuid(),
  status          text not null default 'draft' check (status in ('draft','active','inactive')),
  term            text not null,
  zhuyin          text,
  pinyin          text,
  part_of_speech  text,
  difficulty      integer not null default 3 check (difficulty between 1 and 5),
  short_def       text not null default '',
  long_def        text not null default '',
  usage_context   text not null default '',
  register        text check (register in ('daily','written','literary','academic','classical')),
  emotion         text,
  synonyms        jsonb not null default '[]'::jsonb,
  antonyms        text[] not null default '{}',
  collocations    text[] not null default '{}',
  common_mistakes text not null default '',
  daily_example   text not null default '',
  literary_example text not null default '',
  exercise        text not null default '',
  category        text,
  tags            text[] not null default '{}',
  source          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists zg_vocab_status_idx on public.zg_vocabulary_cards (status, difficulty);
create index if not exists zg_vocab_term_idx on public.zg_vocabulary_cards (term);

drop trigger if exists trg_zg_vocab_updated_at on public.zg_vocabulary_cards;
create trigger trg_zg_vocab_updated_at
  before update on public.zg_vocabulary_cards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 內容：名言
-- ---------------------------------------------------------------------
create table if not exists public.zg_quotes (
  id                   uuid primary key default gen_random_uuid(),
  status               text not null default 'draft' check (status in ('draft','active','inactive')),
  display_quote        text not null,
  original_quote       text,
  original_language    text,
  author_name          text not null,
  author_bio           text not null default '',
  work_title           text not null default '',
  section_title        text,
  publication_year     integer,
  translator_name      text,
  bibliography_url     text,
  verification_status  text not null default 'unverified'
    check (verification_status in ('verified_primary','verified_secondary','disputed','unverified')),
  copyright_status     text not null default 'unknown',
  difficulty           integer not null default 3 check (difficulty between 1 and 5),
  themes               text[] not null default '{}',
  short_analysis       text not null default '',
  deep_analysis        text not null default '',
  context              text not null default '',
  rhetorical_analysis  text not null default '',
  counterpoint         text not null default '',
  writing_insight      text not null default '',
  reflection_questions jsonb not null default '[]'::jsonb,
  imitation_exercise   text not null default '',
  tags                 text[] not null default '{}',
  source               jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists zg_quotes_daily_idx
  on public.zg_quotes (status, verification_status, difficulty);

drop trigger if exists trg_zg_quotes_updated_at on public.zg_quotes;
create trigger trg_zg_quotes_updated_at
  before update on public.zg_quotes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 內容：寫作技巧
-- ---------------------------------------------------------------------
create table if not exists public.zg_craft_cards (
  id              uuid primary key default gen_random_uuid(),
  status          text not null default 'draft' check (status in ('draft','active','inactive')),
  name            text not null,
  one_liner       text not null default '',
  purpose         text not null default '',
  bad_example     text not null default '',
  good_example    text not null default '',
  breakdown       text not null default '',
  common_abuse    text not null default '',
  exercise        text not null default '',
  difficulty      integer not null default 3 check (difficulty between 1 and 5),
  tags            text[] not null default '{}',
  related_vocab   uuid[] not null default '{}',
  related_prompts uuid[] not null default '{}',
  source          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_zg_craft_updated_at on public.zg_craft_cards;
create trigger trg_zg_craft_updated_at
  before update on public.zg_craft_cards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 內容：寫作題目
-- ---------------------------------------------------------------------
create table if not exists public.zg_writing_prompts (
  id                 uuid primary key default gen_random_uuid(),
  status             text not null default 'draft' check (status in ('draft','active','inactive')),
  title              text not null,
  body               text not null,
  category           text,
  difficulty         integer not null default 3 check (difficulty between 1 and 5),
  suggested_words    integer,
  suggested_minutes  integer,
  constraints        text not null default '',
  hints              text not null default '',
  reflection_questions jsonb not null default '[]'::jsonb,
  tags               text[] not null default '{}',
  related_vocab      uuid[] not null default '{}',
  related_quotes     uuid[] not null default '{}',
  related_craft      uuid[] not null default '{}',
  source             jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_zg_prompts_updated_at on public.zg_writing_prompts;
create trigger trg_zg_prompts_updated_at
  before update on public.zg_writing_prompts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 內容：小說任務模板
-- ---------------------------------------------------------------------
create table if not exists public.zg_novel_task_templates (
  id           uuid primary key default gen_random_uuid(),
  status       text not null default 'draft' check (status in ('draft','active','inactive')),
  title        text not null,
  body         text not null,
  minutes_min  integer not null default 5,
  minutes_max  integer not null default 20,
  difficulty   integer not null default 3 check (difficulty between 1 and 5),
  tags         text[] not null default '{}',
  source       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_zg_novel_task_updated_at on public.zg_novel_task_templates;
create trigger trg_zg_novel_task_updated_at
  before update on public.zg_novel_task_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 每日計畫
-- ---------------------------------------------------------------------
create table if not exists public.zg_daily_plans (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users (id) on delete cascade,
  local_date              date not null,
  timezone                text not null default 'Asia/Taipei',
  quote_id                uuid references public.zg_quotes (id),
  vocabulary_ids          uuid[] not null default '{}',
  craft_id                uuid references public.zg_craft_cards (id),
  writing_prompt_id       uuid references public.zg_writing_prompts (id),
  novel_task_template_id  uuid references public.zg_novel_task_templates (id),
  japanese_payload        jsonb not null default '{}'::jsonb,
  completion              jsonb not null default '{}'::jsonb,
  replacements            jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (user_id, local_date)
);

create index if not exists zg_daily_plans_user_date_idx
  on public.zg_daily_plans (user_id, local_date desc);

drop trigger if exists trg_zg_daily_plans_updated_at on public.zg_daily_plans;
create trigger trg_zg_daily_plans_updated_at
  before update on public.zg_daily_plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 詞彙進度／收藏
-- ---------------------------------------------------------------------
create table if not exists public.zg_vocabulary_progress (
  user_id         uuid not null references auth.users (id) on delete cascade,
  vocabulary_id   uuid not null references public.zg_vocabulary_cards (id) on delete cascade,
  familiarity     text not null default 'unfamiliar'
    check (familiarity in ('unfamiliar','recognizing','familiar')),
  times_seen      integer not null default 0,
  times_practiced integer not null default 0,
  last_seen_at    timestamptz,
  notes           text not null default '',
  primary key (user_id, vocabulary_id)
);

create table if not exists public.zg_favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  content_type text not null,
  content_id   uuid not null,
  folder       text,
  created_at   timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.zg_vocabulary_cards enable row level security;
alter table public.zg_quotes enable row level security;
alter table public.zg_craft_cards enable row level security;
alter table public.zg_writing_prompts enable row level security;
alter table public.zg_novel_task_templates enable row level security;
alter table public.zg_daily_plans enable row level security;
alter table public.zg_vocabulary_progress enable row level security;
alter table public.zg_favorites enable row level security;

-- 內容表：member 讀 active；owner 全權
do $$
declare
  t text;
begin
  foreach t in array array[
    'zg_vocabulary_cards','zg_quotes','zg_craft_cards',
    'zg_writing_prompts','zg_novel_task_templates'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_member_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_zg_member() and (status = %L or public.is_zg_owner()))',
      t || '_member_read', t, 'active'
    );
    execute format('drop policy if exists %I on public.%I', t || '_owner_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_zg_owner()) with check (public.is_zg_owner())',
      t || '_owner_write', t
    );
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- 名言：member 僅 verified_primary / verified_secondary 且 active
drop policy if exists zg_quotes_member_read on public.zg_quotes;
create policy zg_quotes_member_read on public.zg_quotes
  for select to authenticated
  using (
    public.is_zg_member()
    and (
      public.is_zg_owner()
      or (
        status = 'active'
        and verification_status in ('verified_primary', 'verified_secondary')
      )
    )
  );

-- 私人表：own rows only
drop policy if exists zg_daily_plans_own on public.zg_daily_plans;
create policy zg_daily_plans_own on public.zg_daily_plans
  for all to authenticated
  using (public.is_zg_member() and user_id = auth.uid())
  with check (public.is_zg_member() and user_id = auth.uid());

drop policy if exists zg_vocab_progress_own on public.zg_vocabulary_progress;
create policy zg_vocab_progress_own on public.zg_vocabulary_progress
  for all to authenticated
  using (public.is_zg_member() and user_id = auth.uid())
  with check (public.is_zg_member() and user_id = auth.uid());

drop policy if exists zg_favorites_own on public.zg_favorites;
create policy zg_favorites_own on public.zg_favorites
  for all to authenticated
  using (public.is_zg_member() and user_id = auth.uid())
  with check (public.is_zg_member() and user_id = auth.uid());

grant select, insert, update, delete on public.zg_daily_plans to authenticated;
grant select, insert, update, delete on public.zg_vocabulary_progress to authenticated;
grant select, insert, update, delete on public.zg_favorites to authenticated;


-- =====================================================================
-- 字耕：get_or_create_daily_plan（deterministic、併發安全）
-- =====================================================================

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
  v_vocab_n int := 3;
  v_quote uuid;
  v_craft uuid;
  v_prompt uuid;
  v_novel uuid;
  v_vocabs uuid[] := '{}';
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

  select coalesce(daily_mode, 'standard'), coalesce(daily_vocab_count, 3)
    into v_mode, v_vocab_n
  from public.zg_user_settings
  where user_id = v_uid;

  if v_mode = 'light' then
    v_vocab_n := 1;
  elsif v_mode = 'deep' then
    v_vocab_n := greatest(v_vocab_n, 5);
  end if;

  -- 名言：僅 verified + active；避開近 14 天
  select q.id into v_quote
  from public.zg_quotes q
  where q.status = 'active'
    and q.verification_status in ('verified_primary', 'verified_secondary')
    and not exists (
      select 1 from public.zg_daily_plans dp
      where dp.user_id = v_uid
        and dp.local_date >= v_date - 14
        and dp.quote_id = q.id
    )
  order by md5(q.id::text || v_uid::text || v_date::text)
  limit 1;

  if v_quote is null then
    select q.id into v_quote
    from public.zg_quotes q
    where q.status = 'active'
      and q.verification_status in ('verified_primary', 'verified_secondary')
    order by md5(q.id::text || v_uid::text || v_date::text)
    limit 1;
  end if;

  select array_agg(x.id) into v_vocabs
  from (
    select c.id
    from public.zg_vocabulary_cards c
    where c.status = 'active'
      and not exists (
        select 1 from public.zg_daily_plans dp
        where dp.user_id = v_uid
          and dp.local_date >= v_date - 14
          and c.id = any (dp.vocabulary_ids)
      )
    order by md5(c.id::text || v_uid::text || v_date::text)
    limit v_vocab_n
  ) x;

  if coalesce(array_length(v_vocabs, 1), 0) < v_vocab_n then
    select array_agg(x.id) into v_vocabs
    from (
      select c.id
      from public.zg_vocabulary_cards c
      where c.status = 'active'
      order by md5(c.id::text || v_uid::text || v_date::text)
      limit v_vocab_n
    ) x;
  end if;

  select c.id into v_craft
  from public.zg_craft_cards c
  where c.status = 'active'
  order by md5(c.id::text || v_uid::text || v_date::text)
  limit 1;

  select p.id into v_prompt
  from public.zg_writing_prompts p
  where p.status = 'active'
  order by md5(p.id::text || v_uid::text || v_date::text)
  limit 1;

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


-- 開發用少量 seed（可重跑：先依 term/title 略過已存在者）
-- 名言作者必須是「開發測試內容」

insert into public.zg_vocabulary_cards (
  status, term, zhuyin, part_of_speech, difficulty, short_def, long_def,
  usage_context, register, category, tags, daily_example, literary_example
)
select * from (values
  ('active'::text, '澄澈', 'ㄔㄥˊ ㄔㄜˋ', '形容詞', 3,
   '清澈透明；心境清明。', '形容液體、光線或心境沒有混濁與遮蔽。',
   '可用於自然景物，也可轉喻情緒與思辨。', 'literary', '文學詞彙',
   array['文學','景物']::text[],
   '湖面澄澈，連對岸的樹影都清楚。',
   '她把昨夜的怒意沉澱後，語氣忽然澄澈起來。'),
  ('active', '齟齬', 'ㄐㄩˇ ㄩˇ', '名詞', 4,
   '意見不合、彼此抵牾。', '原指牙齒參差不齊，引申為人際或觀點之間的衝突。',
   '書面語；不宜過度用於口語對話。', 'written', '艱澀詞彙',
   array['書面','衝突']::text[],
   '兩人對計畫時程出現齟齬。',
   '那不是激烈的爭吵，而是長時間累積的齟齬。'),
  ('active', '逡巡', 'ㄑㄩㄣ ㄒㄩㄣˊ', '動詞', 4,
   '有所顧忌而徘徊不前。', '形容想前進卻因猶豫、恐懼或顧慮而停滯。',
   '文學與書面語常見。', 'literary', '動作描寫',
   array['猶豫','動作']::text[],
   '他在門口逡巡片刻，才按下門鈴。',
   '筆尖在紙上逡巡，始終找不到第一句。')
) as v(status, term, zhuyin, part_of_speech, difficulty, short_def, long_def,
       usage_context, register, category, tags, daily_example, literary_example)
where not exists (
  select 1 from public.zg_vocabulary_cards c where c.term = v.term
);

insert into public.zg_quotes (
  status, display_quote, author_name, work_title, verification_status,
  copyright_status, difficulty, short_analysis, deep_analysis, tags
)
select
  'active',
  '【開發測試內容】把句子寫短，把意思寫深。',
  '開發測試內容',
  '字耕開發種子（非正式引用）',
  'verified_secondary',
  'internal_test',
  2,
  '測試用名言：提醒寫作時以密度換長度。',
  '此筆資料僅供開發，不得當作真實名人語錄發布。',
  array['開發','測試']
where not exists (
  select 1 from public.zg_quotes q where q.author_name = '開發測試內容'
);

insert into public.zg_craft_cards (
  status, name, one_liner, purpose, bad_example, good_example, breakdown, exercise, difficulty, tags
)
select
  'active',
  '以動作寫情緒',
  '少寫「很傷心」，多寫身體與行為。',
  '讓情緒可被看見，而非被宣告。',
  '她很傷心。',
  '她把杯子轉了兩圈，終於沒喝下去。',
  '選擇一個可觀察的小動作，承載未說出的情緒。',
  '用兩個動作寫出「猶豫」。',
  2,
  array['描寫','情緒']
where not exists (
  select 1 from public.zg_craft_cards c where c.name = '以動作寫情緒'
);

insert into public.zg_writing_prompts (
  status, title, body, category, difficulty, suggested_words, suggested_minutes, hints
)
select
  'active',
  '無人的教室',
  '描寫放學後的教室。不要直接寫「安靜」，用細節讓安靜自己出現。',
  '場景描寫',
  2,
  150,
  15,
  '可從光線、氣味、桌椅痕跡下手。'
where not exists (
  select 1 from public.zg_writing_prompts p where p.title = '無人的教室'
);

insert into public.zg_novel_task_templates (
  status, title, body, minutes_min, minutes_max, difficulty, tags
)
select
  'active',
  '區分「想要」與「需要」',
  '為主角各寫一句：外在想要的事物，以及真正缺乏、真正需要的東西。兩者必須不同。',
  5, 15, 2, array['角色','動機']
where not exists (
  select 1 from public.zg_novel_task_templates t where t.title = '區分「想要」與「需要」'
);


select
  (select count(*) from public.zg_vocabulary_cards) as vocab,
  (select count(*) from public.zg_quotes) as quotes,
  (select count(*) from public.zg_craft_cards) as craft,
  (select count(*) from public.zg_writing_prompts) as prompts,
  (select count(*) from public.zg_novel_task_templates) as novel_tasks;
