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
