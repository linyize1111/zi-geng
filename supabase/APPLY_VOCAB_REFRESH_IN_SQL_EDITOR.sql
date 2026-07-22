-- 字耕：詞彙預設 7 + 刷新 RPC + 擴充 seed（一次貼上 Run）
-- 來源：migrations/202607220004 + seed/dev_content_seed.sql

-- =====================================================================
-- 字耕：提高預設詞彙數 + 今日項目替換 RPC + 擴充 seed
-- 可重跑（idempotent）
-- =====================================================================

-- 預設詞彙：標準 7（原 3）；上限 20
alter table public.zg_user_settings
  drop constraint if exists zg_user_settings_daily_vocab_count_check;

alter table public.zg_user_settings
  alter column daily_vocab_count set default 7;

alter table public.zg_user_settings
  add constraint zg_user_settings_daily_vocab_count_check
  check (daily_vocab_count between 1 and 20);

update public.zg_user_settings
set daily_vocab_count = 7
where daily_vocab_count = 3;

-- 更新 get_or_create：預設 7；light=3；deep≥10
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

  if v_mode = 'light' then
    v_vocab_n := least(v_vocab_n, 3);
  elsif v_mode = 'deep' then
    v_vocab_n := greatest(v_vocab_n, 10);
  end if;

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

-- 今日項目刷新：vocabulary 每天最多 5 次；quote/craft 2 次；prompt/novel 1 次（產品規格）
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

  -- 確保今日計畫存在
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


-- 開發用擴充 seed（可重跑）
-- 詞彙約 20+；名言／技巧／題目／小說任務各多幾筆，供刷新使用

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
   '筆尖在紙上逡巡，始終找不到第一句。'),
  ('active', '氤氳', 'ㄧㄣ ㄩㄣ', '形容詞', 4,
   '煙氣或水氣瀰漫的樣子。', '也可形容氣氛朦朧、難以分明。',
   '景物與氣氛描寫。', 'literary', '文學詞彙',
   array['景物','氣氛']::text[],
   '雨後山谷氤氳，遠峰忽隱忽現。',
   '茶煙氤氳裡，她終於說出那句話。'),
  ('active', '侘傺', 'ㄔㄚˋ ㄔˋ', '形容詞', 5,
   '失意而精神恍惚。', '古典書面語，指失意落魄。',
   '文言／文學語境。', 'literary', '艱澀詞彙',
   array['文言','情緒']::text[],
   '他侘傺良久，說不出一句完整的話。',
   '那夜他走在空街上，神色侘傺。'),
  ('active', '紆餘', 'ㄩ ㄩˊ', '形容詞', 5,
   '曲折從容；文氣舒緩。', '多形容文章筆勢委婉有餘韻。',
   '評論與寫作技巧語境。', 'written', '文學詞彙',
   array['文氣','評論']::text[],
   '這段敘事紆餘有致，並不急於揭曉。',
   '他故意把節奏寫得紆餘，讓讀者慢慢靠近。'),
  ('active', '謐靜', 'ㄇㄧˋ ㄐㄧㄥˋ', '形容詞', 3,
   '安靜、寧靜。', '比「安靜」更帶書面與氛圍感。',
   '場景氣氛。', 'literary', '文學詞彙',
   array['氣氛','場景']::text[],
   '午後的圖書館謐靜得幾乎能聽見紙頁翻動。',
   '他們在謐靜裡對坐，誰也不先開口。'),
  ('active', '踟躕', 'ㄔˊ ㄔㄨˊ', '動詞', 4,
   '猶豫不前。', '與逡巡相近，偏重腳步與抉擇。',
   '動作與心理。', 'literary', '動作描寫',
   array['猶豫','動作']::text[],
   '她在岔路口踟躕，最後還是往左走。',
   '信封在手裡轉了三圈，他仍踟躕著。'),
  ('active', '凜冽', 'ㄌㄧㄣˇ ㄌㄧㄝˋ', '形容詞', 3,
   '寒冷刺骨；也可形容神色嚴峻。', '天氣與態度皆可用。',
   '感官與人物描寫。', 'common', '文學詞彙',
   array['天氣','神態']::text[],
   '北風凜冽，手套也擋不住。',
   '她回望的眼神凜冽，像要把話說死。'),
  ('active', '斑駁', 'ㄅㄢ ㄅㄛˊ', '形容詞', 3,
   '顏色深淺不一、痕跡錯落。', '常寫光影、牆面、記憶。',
   '景物細節。', 'common', '文學詞彙',
   array['景物','光影']::text[],
   '老牆斑駁，露出底下另一層油漆。',
   '陽光穿過樹葉，在地上投下斑駁的影。'),
  ('active', '囁嚅', 'ㄋㄧㄝˋ ㄖㄨˊ', '動詞', 4,
   '想說又不敢大聲說。', '描寫含糊、怯懦的發聲。',
   '對話與心理。', 'literary', '動作描寫',
   array['對話','情緒']::text[],
   '他囁嚅了半天，才把名字說出來。',
   '答案在喉嚨裡囁嚅，始終沒成形。'),
  ('active', '惻隱', 'ㄘㄜˋ ㄧㄣˇ', '名詞', 3,
   '對他人苦難的同情之心。', '「惻隱之心」為常見搭配。',
   '倫理與人物動機。', 'written', '文學詞彙',
   array['情感','倫理']::text[],
   '那一瞬惻隱讓他停下腳步。',
   '她並非軟弱，只是惻隱來得太快。'),
  ('active', '倥傯', 'ㄎㄨㄥˇ ㄗㄨㄥˇ', '形容詞', 5,
   '事務匆忙急迫。', '書面語，多寫日子過得緊。',
   '時間節奏。', 'written', '艱澀詞彙',
   array['時間','書面']::text[],
   '這一年倥傯，幾乎沒有停下來看風景。',
   '倥傯的行程裡，他仍留下半頁日記。'),
  ('active', '蕭索', 'ㄒㄧㄠ ㄙㄨㄛˇ', '形容詞', 3,
   '冷落、淒清。', '景物與心境皆可。',
   '氣氛描寫。', 'literary', '文學詞彙',
   array['氣氛','景物']::text[],
   '秋末的街口顯得蕭索。',
   '家裡的燈還亮著，空氣卻蕭索。'),
  ('active', '熨帖', 'ㄩˋ ㄊㄧㄝ', '形容詞', 4,
   '妥貼安穩；使人舒服。', '可指話語、安排或衣著。',
   '人物互動。', 'literary', '文學詞彙',
   array['感受','互動']::text[],
   '這句安慰來得很熨帖。',
   '他把椅墊挪近，動作熨帖得不像臨時起意。'),
  ('active', '顢頇', 'ㄇㄢ ㄏㄢ', '形容詞', 5,
   '糊塗不明事理。', '多含批評意味。',
   '人物評價。', 'written', '艱澀詞彙',
   array['人物','批評']::text[],
   '如此顢頇的回覆，幾乎像沒聽見問題。',
   '他不是惡意，只是顢頇得可怕。'),
  ('active', '奼紫嫣紅', 'ㄔㄚˋ ㄗˇ ㄧㄢ ㄏㄨㄥˊ', '成語', 3,
   '形容花色鮮豔繁多。', '也可泛寫繽紛景象。',
   '景物。', 'literary', '成語',
   array['景物','成語']::text[],
   '園裡奼紫嫣紅，遊人放慢了腳步。',
   '回憶裡那片奼紫嫣紅，比照片更真。'),
  ('active', '跌宕', 'ㄉㄧㄝˊ ㄉㄤˋ', '形容詞', 4,
   '起伏變化大；文勢抑揚。', '情節與文氣皆可用。',
   '敘事節奏。', 'written', '文學詞彙',
   array['節奏','敘事']::text[],
   '故事後半跌宕起來，讀者才真正坐下。',
   '他刻意把節奏寫得跌宕，避免平鋪。'),
  ('active', '隱晦', 'ㄧㄣˇ ㄏㄨㄟˋ', '形容詞', 3,
   '不明說、不易懂。', '可指表達方式或含義。',
   '修辭與對話。', 'common', '文學詞彙',
   array['修辭','表達']::text[],
   '她的拒絕寫得很隱晦。',
   '結局留得隱晦，比說破更有餘味。'),
  ('active', '綿密', 'ㄇㄧㄢˊ ㄇㄧˋ', '形容詞', 3,
   '細緻緊密。', '可指針腳、觀察或文筆。',
   '風格評價。', 'common', '文學詞彙',
   array['風格','細節']::text[],
   '這段心理描寫非常綿密。',
   '她把日常寫得綿密，小事也有重量。'),
  ('active', '疏離', 'ㄕㄨ ㄌㄧˊ', '形容詞', 3,
   '有距離、不親密。', '人際與自我感受皆可。',
   '人物關係。', 'common', '文學詞彙',
   array['關係','情緒']::text[],
   '同桌三年，彼此仍舊疏離。',
   '城市越大，人越容易感到疏離。'),
  ('active', '凝滯', 'ㄋㄧㄥˊ ㄓˋ', '形容詞', 4,
   '停住不動；時間或情緒卡住。', '動態相反的狀態。',
   '節奏與心理。', 'literary', '文學詞彙',
   array['節奏','心理']::text[],
   '對話凝滯了幾秒，誰也不願先讓。',
   '雨絲讓整條巷子顯得凝滯。')
) as v(status, term, zhuyin, part_of_speech, difficulty, short_def, long_def,
       usage_context, register, category, tags, daily_example, literary_example)
where not exists (
  select 1 from public.zg_vocabulary_cards c where c.term = v.term
);

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
   '可觀察的物件、聲音、動作，往往比空泛情緒詞更有說服力。',
   '字耕原創寫作提示，非名人引用。',
   array['寫作','細節']::text[]),
  ('active',
   '先寫清楚，再寫漂亮。',
   '字耕', '寫作箴言',
   'verified_secondary', 'original', 1,
   '文采建立在可讀之上。',
   '字耕原創寫作提示，非名人引用。',
   array['寫作','清楚']::text[])
) as q(status, display_quote, author_name, work_title, verification_status,
       copyright_status, difficulty, short_analysis, deep_analysis, tags)
where not exists (
  select 1 from public.zg_quotes x where x.display_quote = q.display_quote and x.author_name = '字耕'
);

insert into public.zg_craft_cards (
  status, name, one_liner, purpose, bad_example, good_example, breakdown, exercise, difficulty, tags
)
select * from (values
  ('active'::text, '以動作寫情緒',
   '少寫「很傷心」，多寫身體與行為。',
   '讓情緒可被看見，而非被宣告。',
   '她很傷心。',
   '她把杯子轉了兩圈，終於沒喝下去。',
   '選擇一個可觀察的小動作，承載未說出的情緒。',
   '用兩個動作寫出「猶豫」。',
   2, array['描寫','情緒']::text[]),
  ('active', '刪除解釋句',
   '信任讀者，少寫「這表示他……」。',
   '避免把潛台詞講破。',
   '他沒回話，這表示他很生氣。',
   '他沒回話，只把窗戶又關緊了一點。',
   '留下行為，拿掉作者旁白。',
   '改寫一句帶解釋的句子。',
   3, array['節制','潛台詞']::text[]),
  ('active', '對比製造張力',
   '把兩個相反細節放在同一段落。',
   '用反差讓場景有能量。',
   '房間很亂，他心情不好。',
   '桌上擺著剛熨好的襯衫，地板卻堆著三天的碗。',
   '對比比直接說明更有畫面。',
   '寫一組「整潔／崩壞」對比。',
   2, array['張力','細節']::text[])
) as c(status, name, one_liner, purpose, bad_example, good_example, breakdown, exercise, difficulty, tags)
where not exists (
  select 1 from public.zg_craft_cards x where x.name = c.name
);

insert into public.zg_writing_prompts (
  status, title, body, category, difficulty, suggested_words, suggested_minutes, hints
)
select * from (values
  ('active'::text, '無人的教室',
   '描寫放學後的教室。不要直接寫「安靜」，用細節讓安靜自己出現。',
   '場景描寫', 2, 150, 15, '可從光線、氣味、桌椅痕跡下手。'),
  ('active', '晚歸的鑰匙',
   '寫一個人回家開門的三十秒。重點不在事件，而在手部動作與聲音。',
   '動作描寫', 2, 120, 12, '聽得到金屬、呼吸、樓道的回音。'),
  ('active', '說不出口的道歉',
   '兩人共處一室，其中一人想道歉卻始終沒說。禁止寫出「對不起」三字。',
   '對話與潛台詞', 3, 200, 20, '用話題轉移與身體距離表現。')
) as p(status, title, body, category, difficulty, suggested_words, suggested_minutes, hints)
where not exists (
  select 1 from public.zg_writing_prompts x where x.title = p.title
);

insert into public.zg_novel_task_templates (
  status, title, body, minutes_min, minutes_max, difficulty, tags
)
select * from (values
  ('active'::text, '區分「想要」與「需要」',
   '為主角各寫一句：外在想要的事物，以及真正缺乏、真正需要的東西。兩者必須不同。',
   5, 15, 2, array['角色','動機']::text[]),
  ('active', '不可逆的小事件',
   '設計一個無法撤回的小事件（不是災難），並寫出它如何改變角色關係。',
   10, 20, 3, array['情節','轉折']::text[]),
  ('active', '對手的合理理由',
   '為衝突對立的一方寫一段自認為正確的獨白。讀者要能暫時站到對方那邊。',
   8, 18, 3, array['角色','衝突']::text[])
) as t(status, title, body, minutes_min, minutes_max, difficulty, tags)
where not exists (
  select 1 from public.zg_novel_task_templates x where x.title = t.title
);

select
  (select count(*) from public.zg_vocabulary_cards) as vocab,
  (select count(*) from public.zg_quotes) as quotes,
  (select count(*) from public.zg_craft_cards) as craft,
  (select count(*) from public.zg_writing_prompts) as prompts,
  (select count(*) from public.zg_novel_task_templates) as novel_tasks;

