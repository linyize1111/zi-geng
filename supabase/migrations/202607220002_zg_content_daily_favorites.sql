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
