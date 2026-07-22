-- Unlimited daily slot replace + exclude internal_test quotes
-- Applied via APPLY_UNLIMITED_REFRESH_AND_PURGE_TEST.sql for live DB

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

  if not found then
    v_mode := 'standard';
    v_vocab_n := 7;
  end if;

  if v_mode = 'light' then
    v_vocab_n := least(v_vocab_n, 3);
  elsif v_mode = 'deep' then
    v_vocab_n := greatest(v_vocab_n, 10);
  end if;

  select q.id into v_quote
  from public.zg_quotes q
  where q.status = 'active'
    and q.verification_status in ('verified_primary', 'verified_secondary')
    and coalesce(q.copyright_status, '') is distinct from 'internal_test'
    and q.author_name is distinct from '開發測試內容'
    and q.display_quote not like '%開發測試%'
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
      and coalesce(q.copyright_status, '') is distinct from 'internal_test'
      and q.author_name is distinct from '開發測試內容'
      and q.display_quote not like '%開發測試%'
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
      order by md5(c.id::text || v_uid::text || v_date::text || random()::text)
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
  v_plan public.zg_daily_plans;
  v_slot text := lower(trim(p_slot));
  v_count int := 0;
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
      and coalesce(q.copyright_status, '') is distinct from 'internal_test'
      and q.author_name is distinct from '開發測試內容'
      and q.display_quote not like '%開發測試%'
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
