-- ═══════════════════════════════════════════════════════════
--  بۆتەکان (Bots) — پڕکردنەوەی ژوور بە یاریزانی دەستکرد
--  خانەخوێ بۆتەکان بەڕێوەدەبات (دەنگدانیان لە لای خانەخوێوە دەنێردرێت).
--
--  ⚠️ ئەم فایلە چەند بەندێکی foreign key لادەبات تاکو بۆتە دەستکردەکان
--     (کە user_id ـیان لە auth.users نییە) بتوانن ببنە یاریزان و دەنگ بدەن.
--     ئەمە یەکپارچەیی داتا بۆ یاریزانە ڕاستەقینەکان لاواز ناکات لە ڕووی
--     کارکردنەوە، چونکە room_players/votes ڕیزی کاتین (ephemeral) ـن.
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ـدا ڕایبکێشە (Run).
-- ═══════════════════════════════════════════════════════════

-- ١. ستوونی is_bot
alter table public.room_players add column if not exists is_bot boolean default false;

-- ٢. لابردنی بەندەکانی foreign key (تاکو id ـی دەستکرد ڕێگەپێدراو بێت)
alter table public.room_players drop constraint if exists room_players_user_id_fkey;
alter table public.votes drop constraint if exists votes_voter_id_fkey;
alter table public.votes drop constraint if exists votes_target_id_fkey;

-- ٣. دەنگدانی بۆت — تەنها خانەخوێ دەتوانێت بۆ بۆتی ناو ژوورەکەی خۆی دەنگ بنێرێت
--    (security definer → RLS ـی "votes insert self" بازدەداتەوە، بەڵام بە کۆنترۆڵ)
create or replace function public.cast_bot_votes(p_room uuid, p_voter uuid, p_targets uuid[])
returns void as $$
begin
  -- بانگکەر دەبێت خانەخوێی ژوور بێت
  if auth.uid() <> (select host_id from public.rooms where id = p_room) then
    raise exception 'تەنها خانەخوێ دەتوانێت دەنگی بۆت بنێرێت';
  end if;
  -- p_voter دەبێت بۆتێکی هەمان ژوور بێت
  if not exists (
    select 1 from public.room_players
    where room_id = p_room and user_id = p_voter and is_bot = true
  ) then
    raise exception 'یاریزان بۆت نییە';
  end if;
  delete from public.votes where room_id = p_room and voter_id = p_voter;
  insert into public.votes (room_id, voter_id, target_id)
    select p_room, p_voter, unnest(p_targets);
end;
$$ language plpgsql security definer;

grant execute on function public.cast_bot_votes(uuid, uuid, uuid[]) to authenticated;
