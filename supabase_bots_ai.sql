-- ═══════════════════════════════════════════════════════════
--  بۆتە زیرەکەکان — ڕێگەدان بە نووسینی بۆت لە چات
--  (پێویستە دوای supabase_bots.sql جێبەجێ بکرێت)
--
--  ⚠️ بەندی foreign key ـی messages.user_id لادەبات تاکو بۆتەکان
--     (کە لە auth.users نین) بتوانن نامە بنێرن.
--  post_bot_message: تەنها خانەخوێ دەتوانێت بۆ بۆتی ژوورەکەی خۆی نامە بنێرێت.
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ـدا ڕایبکێشە (Run).
-- ═══════════════════════════════════════════════════════════

-- لابردنی بەندی foreign key
alter table public.messages drop constraint if exists messages_user_id_fkey;

-- ناردنی نامەی بۆت (لە لای خانەخوێوە، بە کۆنترۆڵ)
create or replace function public.post_bot_message(
  p_room uuid, p_user uuid, p_name text, p_avatar text, p_content text, p_kind text default 'chat'
)
returns void as $$
begin
  if auth.uid() <> (select host_id from public.rooms where id = p_room) then
    raise exception 'تەنها خانەخوێ دەتوانێت نامەی بۆت بنێرێت';
  end if;
  if not exists (
    select 1 from public.room_players
    where room_id = p_room and user_id = p_user and is_bot = true
  ) then
    raise exception 'یاریزان بۆت نییە';
  end if;
  insert into public.messages (room_id, user_id, display_name, avatar_url, content, kind)
    values (p_room, p_user, p_name, p_avatar, left(p_content, 300), coalesce(p_kind, 'chat'));
end;
$$ language plpgsql security definer;

grant execute on function public.post_bot_message(uuid, uuid, text, text, text, text) to authenticated;
