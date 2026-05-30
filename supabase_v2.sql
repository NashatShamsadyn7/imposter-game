-- ═══════════════════════════════════════════════════════════
--  گەشەپێدانی v2 بۆ «ساختەکار»
--  مێژووی یاری + مۆسم + پاداشتی ڕۆژانە + سلسلە + بلۆک + بینەر
--  لە Supabase Dashboard > SQL Editor ئەم کۆدە جێبەجێ بکە (یەک جار).
-- ═══════════════════════════════════════════════════════════

-- ───── ستوونە نوێیەکانی پرۆفایل (سلسلە + پاداشتی ڕۆژانە) ─────
alter table public.profiles add column if not exists login_streak int default 0;
alter table public.profiles add column if not exists longest_streak int default 0;
alter table public.profiles add column if not exists last_daily date;       -- دواین ڕۆژی وەرگرتنی پاداشت
alter table public.profiles add column if not exists quest_day date;         -- دواین ڕۆژی تەواوکردنی مەرجی ڕۆژانە

-- ───── ستوونی بینەر (spectator) بۆ یاریزانانی ناو ژوور ─────
alter table public.room_players add column if not exists is_spectator boolean default false;

-- ═══════════════════════════════════════════════════════════
--  مێژووی یاری (game_results) — بۆ مێژوو + ئامار + مۆسمەکان
-- ═══════════════════════════════════════════════════════════
create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  role text,                 -- crew | impostor
  won boolean default false,
  points int default 0,
  category_id text,
  secret_word text,
  created_at timestamptz default now()
);
create index if not exists game_results_user_idx on public.game_results (user_id, created_at desc);
create index if not exists game_results_time_idx on public.game_results (created_at);

alter table public.game_results enable row level security;
drop policy if exists "gr read" on public.game_results;
create policy "gr read" on public.game_results for select using (auth.role() = 'authenticated');
-- نووسین تەنها لە ڕێگەی فەنکشنی security definer ـەوە دەکرێت (record_result)

-- ═══════════════════════════════════════════════════════════
--  بلۆککردن (blocks)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.blocks (
  blocker_id uuid references auth.users(id) on delete cascade,
  blocked_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.blocks enable row level security;
drop policy if exists "blocks read own" on public.blocks;
create policy "blocks read own" on public.blocks for select using (auth.uid() = blocker_id);
drop policy if exists "blocks insert own" on public.blocks;
create policy "blocks insert own" on public.blocks for insert with check (auth.uid() = blocker_id);
drop policy if exists "blocks delete own" on public.blocks;
create policy "blocks delete own" on public.blocks for delete using (auth.uid() = blocker_id);

-- ═══════════════════════════════════════════════════════════
--  فەنکشنەکان
-- ═══════════════════════════════════════════════════════════

-- تۆمارکردنی ئەنجامی یاری + زیادکردنی خاڵ (جێگرەوەی add_points)
create or replace function public.record_result(
  uid uuid, pts int, won boolean, p_role text, p_category text, p_word text
) returns void as $$
  insert into public.game_results (user_id, role, won, points, category_id, secret_word)
    values (uid, p_role, won, pts, p_category, p_word);
  update public.profiles
    set total_points = total_points + pts,
        games_played = games_played + 1,
        wins = wins + (case when won then 1 else 0 end),
        updated_at = now()
    where id = uid;
$$ language sql security definer;

-- وەرگرتنی پاداشتی چوونەژوورەوەی ڕۆژانە (+ سلسلە)
create or replace function public.claim_daily()
returns json as $$
declare
  prof public.profiles;
  today date := (now() at time zone 'utc')::date;
  new_streak int;
  reward int;
begin
  select * into prof from public.profiles where id = auth.uid();
  if prof.id is null then
    return json_build_object('ok', false, 'reason', 'no_profile');
  end if;
  if prof.last_daily = today then
    return json_build_object('ok', false, 'reason', 'already', 'streak', coalesce(prof.login_streak, 0));
  end if;
  if prof.last_daily = today - 1 then
    new_streak := coalesce(prof.login_streak, 0) + 1;
  else
    new_streak := 1;
  end if;
  reward := least(20 + (new_streak - 1) * 10, 120);  -- ٢٠ بۆ ١٢٠ XP
  update public.profiles
    set total_points = total_points + reward,
        login_streak = new_streak,
        longest_streak = greatest(coalesce(longest_streak, 0), new_streak),
        last_daily = today,
        updated_at = now()
    where id = auth.uid();
  return json_build_object('ok', true, 'streak', new_streak, 'reward', reward);
end;
$$ language plpgsql security definer;

-- وەرگرتنی پاداشتی مەرجی ڕۆژانە (یاریکردنی N یاری لە ئەمڕۆدا)
create or replace function public.claim_daily_quest()
returns json as $$
declare
  prof public.profiles;
  today date := (now() at time zone 'utc')::date;
  games_today int;
  goal int := 3;
  reward int := 50;
begin
  select * into prof from public.profiles where id = auth.uid();
  if prof.quest_day = today then
    return json_build_object('ok', false, 'reason', 'already');
  end if;
  select count(*) into games_today from public.game_results
    where user_id = auth.uid() and created_at >= today;
  if games_today < goal then
    return json_build_object('ok', false, 'reason', 'incomplete', 'progress', games_today, 'goal', goal);
  end if;
  update public.profiles
    set total_points = total_points + reward, quest_day = today, updated_at = now()
    where id = auth.uid();
  return json_build_object('ok', true, 'reward', reward);
end;
$$ language plpgsql security definer;

-- لیدەربۆردی مۆسم — کۆی خاڵ لە ماوەیەکی دیاریکراوەوە
create or replace function public.season_leaderboard(since timestamptz, lim int default 20)
returns table (id uuid, display_name text, avatar_url text, season_points bigint, total_points int) as $$
  select p.id, p.display_name, p.avatar_url,
         coalesce(sum(g.points), 0) as season_points, p.total_points
  from public.profiles p
  join public.game_results g on g.user_id = p.id and g.created_at >= since
  group by p.id
  order by season_points desc
  limit lim;
$$ language sql security definer stable;

-- ═══════════════════════════════════════════════════════════
--  Trigger: ئاگادارکردنەوەی Push کاتێک هاوڕێیەک ژوورێک دروستدەکات
--  (notify_push لە supabase_push.sql پێناسەکراوە — send-push بانگ دەکات)
--  دڵنیابە send-push ـی نوێ deploy کراوەتەوە:
--    supabase functions deploy send-push --no-verify-jwt
-- ═══════════════════════════════════════════════════════════
drop trigger if exists room_push_trigger on public.rooms;
create trigger room_push_trigger after insert on public.rooms
  for each row execute function public.notify_push();
