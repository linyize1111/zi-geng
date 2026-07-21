-- 字耕：只裝「刷新 RPC + 預設 7 詞」（精簡、可重跑）
-- 若先前完整檔中途失敗，請只跑這份

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'zg_user_settings'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%daily_vocab_count%'
  loop
    execute format('alter table public.zg_user_settings drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.zg_user_settings
  alter column daily_vocab_count set default 7;

do $$
begin
  alter table public.zg_user_settings
    add constraint zg_user_settings_daily_vocab_count_check
    check (daily_vocab_count between 1 and 20);
exception
  when duplicate_object then null;
end $$;

update public.zg_user_settings
set daily_vocab_count = 7
where daily_vocab_count = 3;

create or replace function public.zg_replace_daily_slot(
  p_slot text,
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
  v_slot text := lower(trim(p_slot));
  v_count int := 0;
  v_limit int := 1;
  v_mode text := 'standard';
  v_vocab_n int := 7;
  v_new_id uuid;
  v_new_ids uuid[];
  v_nonce text := md5(clock_timestamp()::text || random()::text);
  v_reps jsonb;
begin
  if v_uid is null or not public.is_zg_member() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if v_slot not in ('vocabulary', 'quote', 'craft', 'prompt', 'novel') then
    raise exception 'invalid slot' using errcode = '22023';
  end if;

  v_plan := public.zg_get_or_create_daily_plan(v_tz);
  v_reps := coalesce(v_plan.replacements, '{}'::jsonb);
  v_count := coalesce((v_reps ->> v_slot)::int, 0);

  v_limit := case v_slot
    when 'vocabulary' then 5
    when 'quote' then 2
    when 'craft' then 2
    when 'prompt' then 1
    when 'novel' then 1
  end;

  if v_count >= v_limit then
    raise exception 'replacement limit reached for %', v_slot using errcode = 'P0001';
  end if;

  select coalesce(daily_mode, 'standard'), coalesce(daily_vocab_count, 7)
    into v_mode, v_vocab_n
  from public.zg_user_settings
  where user_id = v_uid;

  if not found then
    v_mode := 'standard';
    v_vocab_n := 7;
  end if;

  if v_mode = 'light' then
    v_vocab_n := least(v_vocab_n, 3);
  elsif v_mode = 'deep' then
    v_vocab_n := greatest(v_vocab_n, 10);
  end if;

  if v_slot = 'vocabulary' then
    select array_agg(x.id) into v_new_ids
    from (
      select c.id
      from public.zg_vocabulary_cards c
      where c.status = 'active'
        and not (c.id = any (coalesce(v_plan.vocabulary_ids, '{}')))
      order by md5(c.id::text || v_uid::text || v_nonce)
      limit v_vocab_n
    ) x;

    if coalesce(array_length(v_new_ids, 1), 0) < v_vocab_n then
      select array_agg(x.id) into v_new_ids
      from (
        select c.id
        from public.zg_vocabulary_cards c
        where c.status = 'active'
        order by md5(c.id::text || v_uid::text || v_nonce)
        limit v_vocab_n
      ) x;
    end if;

    update public.zg_daily_plans
    set vocabulary_ids = coalesce(v_new_ids, '{}'),
        replacements = v_reps || jsonb_build_object(v_slot, v_count + 1),
        updated_at = now()
    where id = v_plan.id
    returning * into v_plan;

  elsif v_slot = 'quote' then
    select q.id into v_new_id
    from public.zg_quotes q
    where q.status = 'active'
      and q.verification_status in ('verified_primary', 'verified_secondary')
      and q.id is distinct from v_plan.quote_id
    order by md5(q.id::text || v_uid::text || v_nonce)
    limit 1;

    if v_new_id is null then
      raise exception 'no alternative content for quote' using errcode = 'P0001';
    end if;

    update public.zg_daily_plans
    set quote_id = v_new_id,
        replacements = v_reps || jsonb_build_object(v_slot, v_count + 1),
        updated_at = now()
    where id = v_plan.id
    returning * into v_plan;

  elsif v_slot = 'craft' then
    select c.id into v_new_id
    from public.zg_craft_cards c
    where c.status = 'active'
      and c.id is distinct from v_plan.craft_id
    order by md5(c.id::text || v_uid::text || v_nonce)
    limit 1;

    if v_new_id is null then
      raise exception 'no alternative content for craft' using errcode = 'P0001';
    end if;

    update public.zg_daily_plans
    set craft_id = v_new_id,
        replacements = v_reps || jsonb_build_object(v_slot, v_count + 1),
        updated_at = now()
    where id = v_plan.id
    returning * into v_plan;

  elsif v_slot = 'prompt' then
    select p.id into v_new_id
    from public.zg_writing_prompts p
    where p.status = 'active'
      and p.id is distinct from v_plan.writing_prompt_id
    order by md5(p.id::text || v_uid::text || v_nonce)
    limit 1;

    if v_new_id is null then
      raise exception 'no alternative content for prompt' using errcode = 'P0001';
    end if;

    update public.zg_daily_plans
    set writing_prompt_id = v_new_id,
        replacements = v_reps || jsonb_build_object(v_slot, v_count + 1),
        updated_at = now()
    where id = v_plan.id
    returning * into v_plan;

  else
    select t.id into v_new_id
    from public.zg_novel_task_templates t
    where t.status = 'active'
      and t.id is distinct from v_plan.novel_task_template_id
    order by md5(t.id::text || v_uid::text || v_nonce)
    limit 1;

    if v_new_id is null then
      raise exception 'no alternative content for novel' using errcode = 'P0001';
    end if;

    update public.zg_daily_plans
    set novel_task_template_id = v_new_id,
        replacements = v_reps || jsonb_build_object(v_slot, v_count + 1),
        updated_at = now()
    where id = v_plan.id
    returning * into v_plan;
  end if;

  return v_plan;
end;
$$;

revoke all on function public.zg_replace_daily_slot(text, text) from public;
grant execute on function public.zg_replace_daily_slot(text, text) to authenticated;

-- 確認函式存在（應回 1 列）
select proname, pg_get_function_identity_arguments(oid) as args
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'zg_replace_daily_slot';
