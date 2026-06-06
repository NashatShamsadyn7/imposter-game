-- ═══════════════════════════════════════════════════════════
--  پلەبەندی (Ranked System)
--  • rank_points — خاڵی پێشبڕکێ (سەرەتا ١٠٠٠)
--  • record_result نوێدەکرێتەوە تاکو خاڵی پلە ڕێک بخات:
--      بردنەوە +٢٥ · دۆڕان −١٥ (کەمترین ٠)
--  • season_rank_leaderboard — لیدەربۆردی پلە
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ـدا ڕایبکێشە (Run).
--  (پێویستە supabase_v2.sql پێشتر جێبەجێکرابێت — record_result لێرە دەگۆڕدرێت)
-- ═══════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists rank_points int default 1000;

-- record_result — هەمان کاری پێشوو + ڕێکخستنی خاڵی پلە
create or replace function public.record_result(
  uid uuid, pts int, won boolean, p_role text, p_category text, p_word text
)
returns void as $$
  insert into public.game_results (user_id, role, won, points, category_id, secret_word)
    values (uid, p_role, won, pts, p_category, p_word);
  update public.profiles
    set total_points = total_points + pts,
        games_played = games_played + 1,
        wins = wins + (case when won then 1 else 0 end),
        rank_points = greatest(0, coalesce(rank_points, 1000) + (case when won then 25 else -15 end)),
        updated_at = now()
    where id = uid;
$$ language sql security definer;

-- لیدەربۆردی پلە — بەپێی خاڵی پلە
create or replace function public.rank_leaderboard(lim int default 50)
returns table (id uuid, display_name text, avatar_url text, rank_points int, total_points int) as $$
  select p.id, p.display_name, p.avatar_url, coalesce(p.rank_points, 1000), p.total_points
  from public.profiles p
  order by coalesce(p.rank_points, 1000) desc
  limit lim;
$$ language sql security definer stable;

grant execute on function public.rank_leaderboard(int) to authenticated;
