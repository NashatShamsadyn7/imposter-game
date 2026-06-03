-- ═══════════════════════════════════════════════════════════
--  Username + Referral + Share reward + Daily coins
--  ئەمە یوزەرنەیم (ناوی بەکارهێنەر)، سیستەمی بانگهێشت (referral)،
--  پاداشتی هاوبەشکردن، و پاداشتی دراوی ڕۆژانە دروست دەکات.
--  بێ مەترسی (additive + idempotent) — دەکرێت دووبارە ڕان بکرێت.
--  جێبەجێکردن: Supabase → SQL Editor → ئەم فایلە بلکێنە و Run بکە.
--  پێشمەرج: supabase_cosmetics.sql پێشتر ڕان کرابێت (ستوونی coins).
-- ═══════════════════════════════════════════════════════════

-- citext بۆ بێهاوتایی ناو بەبێ گرنگیدان بە پیتی گەورە/بچووک
create extension if not exists citext;

-- ───── ستوونە نوێیەکان لەسەر profiles ─────
alter table public.profiles add column if not exists username citext;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);
alter table public.profiles add column if not exists referral_count integer not null default 0;
alter table public.profiles add column if not exists last_share date;
alter table public.profiles add column if not exists last_daily_coins date;

-- بێهاوتایی یوزەرنەیم (case-insensitive بەهۆی citext)
create unique index if not exists profiles_username_key on public.profiles (username);
-- پێشگەڕانی خێرا بۆ گەڕان بەپێی سەرەتای ناو
create index if not exists profiles_username_prefix on public.profiles (username text_pattern_ops);

-- ───── ١) دانانی یوزەرنەیم ─────
-- فۆرمات: ٣–٢٠ پیت، تەنها a-z 0-9 و _ . هەموو بچووک دەکرێت.
create or replace function public.set_username(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean text;
  taken int;
begin
  clean := lower(trim(coalesce(p_username, '')));
  if clean !~ '^[a-z0-9_]{3,20}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  -- ناوە پارێزراوەکان
  if clean in ('admin','root','system','moderator','support','imposter','saxtakar') then
    return jsonb_build_object('ok', false, 'reason', 'reserved');
  end if;
  select count(*) into taken
    from profiles
   where username = clean::citext and id <> auth.uid();
  if taken > 0 then
    return jsonb_build_object('ok', false, 'reason', 'taken');
  end if;
  update profiles set username = clean::citext where id = auth.uid();
  return jsonb_build_object('ok', true, 'username', clean);
end;
$$;

-- ───── ٢) گەڕان بەپێی یوزەرنەیم (security definer — تێپەڕاندنی RLS) ─────
-- گەڕانی سەرەتا (prefix) — زۆرترین ١٥ ئەنجام.
create or replace function public.search_profiles(p_q text)
returns table (
  id uuid,
  username citext,
  display_name text,
  avatar_url text,
  total_points integer,
  last_seen timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, username, display_name, avatar_url, total_points, last_seen
    from profiles
   where username is not null
     and length(trim(coalesce(p_q,''))) >= 2
     and username like lower(trim(p_q)) || '%'
     and id <> auth.uid()
   order by total_points desc
   limit 15;
$$;

-- دۆزینەوەی یەک پرۆفایل بە یوزەرنەیمی تەواو (بۆ لینکی بانگهێشت/زیادکردن)
create or replace function public.profile_by_username(p_username text)
returns table (
  id uuid,
  username citext,
  display_name text,
  avatar_url text,
  total_points integer,
  last_seen timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, username, display_name, avatar_url, total_points, last_seen
    from profiles
   where username = lower(trim(coalesce(p_username,'')))::citext
   limit 1;
$$;

-- ───── ٣) پاداشتی بانگهێشت (referral) ─────
-- بەکارهێنەری نوێ یوزەرنەیمی بانگهێشتکەر دەنێرێت. تەنها یەک جار.
-- بانگهێشتکەر: +150 دراو · بەکارهێنەری نوێ: +100 دراو.
-- هەر ٥ بانگهێشت → پاداشتی ئاوەڵ +500 دراو بۆ بانگهێشتکەر.
create or replace function public.claim_referral(p_ref_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  ref_id uuid;
  my_ref uuid;
  new_count integer;
  bonus integer := 0;
  my_coins integer;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'no_auth');
  end if;
  -- پێشتر بانگهێشتم وەرگرتووە؟
  select referred_by into my_ref from profiles where id = me;
  if my_ref is not null then
    return jsonb_build_object('ok', false, 'reason', 'already');
  end if;
  -- بانگهێشتکەر بدۆزەرەوە
  select id into ref_id from profiles
   where username = lower(trim(coalesce(p_ref_username,'')))::citext;
  if ref_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if ref_id = me then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;

  -- تۆمارکردنی پەیوەندی + پاداشتی بەکارهێنەری نوێ
  update profiles
     set referred_by = ref_id,
         coins = coins + 100
   where id = me
   returning coins into my_coins;

  -- پاداشتی بانگهێشتکەر + ژمارە
  update profiles
     set referral_count = referral_count + 1,
         coins = coins + 150
   where id = ref_id
   returning referral_count into new_count;

  -- پاداشتی ئاوەڵ هەر ٥ بانگهێشت
  if new_count % 5 = 0 then
    bonus := 500;
    update profiles set coins = coins + bonus where id = ref_id;
  end if;

  return jsonb_build_object('ok', true, 'reward', 100, 'coins', my_coins,
    'ref_count', new_count, 'milestone_bonus', bonus);
end;
$$;

-- ───── ٤) پاداشتی هاوبەشکردنی ئەپ (ڕۆژانە) ─────
-- جارێک لە ڕۆژێکدا +25 دراو.
create or replace function public.claim_share_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  last date;
  bal integer;
  reward integer := 25;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'no_auth');
  end if;
  select last_share into last from profiles where id = me;
  if last = current_date then
    return jsonb_build_object('ok', false, 'reason', 'claimed');
  end if;
  update profiles
     set last_share = current_date,
         coins = coins + reward
   where id = me
   returning coins into bal;
  return jsonb_build_object('ok', true, 'reward', reward, 'coins', bal);
end;
$$;

-- ───── ٥) پاداشتی دراوی ڕۆژانە (سەربەخۆ لە XP ـی ڕۆژانە) ─────
-- بنەڕەت ٥٠ + بەپێی سلسلەی چوونەژوورەوە (login_streak) زیاد دەبێت.
create or replace function public.claim_daily_coins()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  last date;
  streak integer;
  reward integer;
  bal integer;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'no_auth');
  end if;
  select last_daily_coins, coalesce(login_streak, 0)
    into last, streak
    from profiles where id = me;
  if last = current_date then
    return jsonb_build_object('ok', false, 'reason', 'claimed');
  end if;
  reward := 50 + least(coalesce(streak, 0), 7) * 10; -- ٥٠ تا ١٢٠
  update profiles
     set last_daily_coins = current_date,
         coins = coins + reward
   where id = me
   returning coins into bal;
  return jsonb_build_object('ok', true, 'reward', reward, 'coins', bal);
end;
$$;

-- ───── ڕێگەپێدان ─────
grant execute on function public.set_username(text) to authenticated;
grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.profile_by_username(text) to authenticated;
grant execute on function public.claim_referral(text) to authenticated;
grant execute on function public.claim_share_reward() to authenticated;
grant execute on function public.claim_daily_coins() to authenticated;
