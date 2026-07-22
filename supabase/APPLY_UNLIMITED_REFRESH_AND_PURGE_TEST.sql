-- 字耕：取消刷新次數上限 + 下架開發測試名言 + 寫入正式寫作箴言
-- 在 Supabase SQL Editor 一次貼上 Run（可重跑）

-- ---------------------------------------------------------------------
-- 1) 下架測試名言
-- ---------------------------------------------------------------------
update public.zg_quotes
set status = 'inactive',
    updated_at = now()
where status = 'active'
  and (
    copyright_status = 'internal_test'
    or author_name = '開發測試內容'
    or display_quote like '%開發測試%'
  );

-- ---------------------------------------------------------------------
-- 2) 寫作箴言（原創課務提示，非名人語錄）
-- ---------------------------------------------------------------------
insert into public.zg_quotes (
  status, display_quote, author_name, work_title, verification_status,
  copyright_status, difficulty, short_analysis, deep_analysis, tags
)
select * from (values
  ('active'::text,
   '把句子寫短，把意思寫深。',
   '字耕', '寫作箴言',
   'verified_secondary', 'original', 2,
   '長度不是密度；刪去空話，留下可承擔意義的字。',
   '字耕原創寫作提示，非名人引用。',
   array['寫作','密度']::text[]),
  ('active',
   '細節比形容詞更靠近真實。',
   '字耕', '寫作箴言',
   'verified_secondary', 'original', 2,
   '可觀察的物件、聲音、動作，往往比「很美／很傷心」更有說服力。',
   '字耕原創寫作提示，非名人引用。',
   array['寫作','細節']::text[]),
  ('active',
   '先寫清楚，再寫漂亮。',
   '字耕', '寫作箴言',
   'verified_secondary', 'original', 1,
   '文采建立在可讀之上；讀者先懂，才談得上被打動。',
   '字耕原創寫作提示，非名人引用。',
   array['寫作','清楚']::text[]),
  ('active',
   '信任讀者，少把潛台詞講破。',
   '字耕', '寫作箴言',
   'verified_secondary', 'original', 3,
   '留下行為與空隙，讓讀者自己完成理解。',
   '字耕原創寫作提示，非名人引用。',
   array['寫作','潛台詞']::text[]),
  ('active',
   '場面比說明更有力量。',
   '字耕', '寫作箴言',
   'verified_secondary', 'original', 2,
   '能演給讀者看的，就少用作者旁白解釋。',
   '字耕原創寫作提示，非名人引用。',
   array['寫作','場面']::text[]),
  ('active',
   '一個好結尾，常是最後一個未說出口的字。',
   '字耕', '寫作箴言',
   'verified_secondary', 'original', 3,
   '收束時保留餘韻，比把道理說盡更耐讀。',
   '字耕原創寫作提示，非名人引用。',
   array['寫作','結尾']::text[])
) as q(status, display_quote, author_name, work_title, verification_status,
       copyright_status, difficulty, short_analysis, deep_analysis, tags)
where not exists (
  select 1 from public.zg_quotes x where x.display_quote = q.display_quote and x.author_name = '字耕'
);

-- 擴充技巧／題目／小說任務（略過已存在者）
insert into public.zg_craft_cards (
  status, name, one_liner, purpose, bad_example, good_example, breakdown, exercise, difficulty, tags
)
select * from (values
  ('active'::text, '以感官定錨場景',
   '先給讀者一個可感的錨：光、聲、氣味或觸感。',
   '避免空泛開場。',
   '那是一個普通的下午。',
   '窗框的影子爬過課桌，粉筆灰還掛在空氣裡。',
   '選一種感官寫兩句，再開敘事。',
   '用氣味寫出「剛下過雨的巷子」。',
   2, array['場景','感官']::text[]),
  ('active', '對話只留必要資訊',
   '每句對話至少推進關係、衝突或資訊之一。',
   '刪掉寒暄與重複。',
   '「你好嗎？」「我很好，你呢？」',
   '「你又遲到了。」「地鐵停過，我知道你不信。」',
   '檢查每句是否可刪；能刪就刪。',
   '改寫一段只剩寒暄的對話。',
   3, array['對話','節奏']::text[]),
  ('active', '時間壓縮與拉長',
   '緊張處寫慢，過渡處寫快。',
   '用節奏控制情緒。',
   '他走過去，坐下，開始說話。',
   '他的手在門把上停了三秒；坐下之後，一句話也沒先說。',
   '把「重要三秒」寫滿，把「無關十分鐘」收成半句。',
   '選一個轉折，用慢鏡重寫。',
   3, array['節奏','時間']::text[])
) as c(status, name, one_liner, purpose, bad_example, good_example, breakdown, exercise, difficulty, tags)
where not exists (
  select 1 from public.zg_craft_cards x where x.name = c.name
);

insert into public.zg_writing_prompts (
  status, title, body, category, difficulty, suggested_words, suggested_minutes, hints
)
select * from (values
  ('active'::text, '雨停之後的走廊',
   '寫一段雨剛停的室內走廊。禁止出現「安靜」「淒涼」二字，改用細節讓氣氛出現。',
   '場景描寫', 2, 160, 15, '注意水聲、鞋印、燈管與距離感。'),
  ('active', '一封沒寄出的訊息',
   '寫一則打了又刪、終於沒送出的訊息。呈現游標、刪改與最後關掉手機的瞬間。',
   '心理與物件', 3, 180, 18, '不要直接寫「他很猶豫」。'),
  ('active', '餐桌上的第三個位子',
   '三人飯局少了一人。寫剩下兩人如何避開那個空位，又如何一再撞上它。',
   '關係與潛台詞', 3, 220, 20, '可用餐具、話題、眼神。')
) as p(status, title, body, category, difficulty, suggested_words, suggested_minutes, hints)
where not exists (
  select 1 from public.zg_writing_prompts x where x.title = p.title
);

insert into public.zg_novel_task_templates (
  status, title, body, minutes_min, minutes_max, difficulty, tags
)
select * from (values
  ('active'::text, '秘密的保管者',
   '寫出誰知道主角的秘密、誰不該知道，以及若洩漏會失去什麼。三句即可。',
   5, 12, 2, array['角色','秘密']::text[]),
  ('active', '場景的利害',
   '為下一個場景寫：角色想得到什麼、最怕失去什麼、現場有什麼障礙。',
   8, 15, 3, array['場景','衝突']::text[]),
  ('active', '結局的代價',
   '假設故事收在「成功」。寫出角色為此付出、且無法挽回的代價。',
   8, 18, 3, array['結局','主題']::text[])
) as t(status, title, body, minutes_min, minutes_max, difficulty, tags)
where not exists (
  select 1 from public.zg_novel_task_templates x where x.title = t.title
);

-- 今日計畫若仍指向已下架名言，改綁有效箴言（沒有則清空）
update public.zg_daily_plans dp
set quote_id = sub.new_id,
    updated_at = now()
from (
  select
    dp2.id as plan_id,
    (
      select q.id
      from public.zg_quotes q
      where q.status = 'active'
        and q.verification_status in ('verified_primary', 'verified_secondary')
        and coalesce(q.copyright_status, '') is distinct from 'internal_test'
        and q.author_name is distinct from '開發測試內容'
      order by md5(q.id::text || dp2.user_id::text || dp2.local_date::text)
      limit 1
    ) as new_id
  from public.zg_daily_plans dp2
  left join public.zg_quotes oldq on oldq.id = dp2.quote_id
  where dp2.quote_id is not null
    and (oldq.id is null or oldq.status <> 'active' or coalesce(oldq.copyright_status, '') = 'internal_test'
         or oldq.author_name = '開發測試內容' or oldq.display_quote like '%開發測試%')
) sub
where dp.id = sub.plan_id;

-- ---------------------------------------------------------------------
-- 3) 重建 get_or_create：排除 internal_test
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 4) 刷新：不限次數（仍計數供統計）
-- ---------------------------------------------------------------------
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

select
  (select count(*) from public.zg_quotes where status = 'active' and author_name = '字耕') as active_zhigeng_quotes,
  (select count(*) from public.zg_quotes where status = 'active' and (author_name = '開發測試內容' or copyright_status = 'internal_test')) as leftover_test_quotes,
  (select count(*) from public.zg_craft_cards where status = 'active') as craft,
  (select count(*) from public.zg_writing_prompts where status = 'active') as prompts,
  (select count(*) from public.zg_novel_task_templates where status = 'active') as novels;
