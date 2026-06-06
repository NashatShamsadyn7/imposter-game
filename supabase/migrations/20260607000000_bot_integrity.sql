-- ═══════════════════════════════════════════════════════════
--  P0#3 — گەڕاندنەوەی یەکپارچەیی داتا دوای لابردنی FK بۆ بۆتەکان
--
--  کێشە: بۆ ڕێگەدان بە بۆتە دەستکردەکان (user_id ـیان لە auth.users نییە)
--  ئەم FK ـانە لابران:
--    • room_players.user_id  → auth.users
--    • votes.voter_id        → auth.users
--    • votes.target_id       → auth.users
--    • messages.user_id      → auth.users
--  ئەنجام: هیچ ضمانەیەک نەما کە دەنگ/نامەکان بۆ یاریزانی ڕاستەقینە بن.
--
--  چارەسەر (بێ گۆڕانی frontend):
--   ١. یەکپارچەیی ناو-ژوور: votes پەیوەست بکە بە room_players(room_id,user_id)
--      — کاردەکات بۆ بۆت و یاریزانی ڕاستەقینە بەیەکسان، چونکە بۆتیش
--      ڕیزی room_players ـە. ئەمە بەهێزترە لە FK ـی کۆن (auth.users).
--   ٢. یاریزانی ڕاستەقینە (is_bot=false): trigger دڵنیادەبێتەوە user_id
--      لە auth.users هەیە — هەمان ضمانەی کۆن، بەڵام بۆت ڕێگەپێدراوە.
--   ٣. messages: هەمان trigger بۆ یاریزانی ڕاستەقینە (ڕەفتاری چات ناگۆڕێت).
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ڕایبکێشە (idempotent ـە).
-- ═══════════════════════════════════════════════════════════

-- ── ٠. پاککردنەوەی ڕیزە هەتیوەکان (orphans) پێش زیادکردنی بەند ──
--    (دەنگ/نامەی یارییە کۆتاییهاتووەکان کە یاریزانەکەیان نەماوە)
delete from public.votes v
  where not exists (
    select 1 from public.room_players rp
    where rp.room_id = v.room_id and rp.user_id = v.voter_id
  );
delete from public.votes v
  where not exists (
    select 1 from public.room_players rp
    where rp.room_id = v.room_id and rp.user_id = v.target_id
  );

-- ── ١. یەکپارچەیی ناو-ژوور بۆ دەنگەکان (composite FK → room_players) ──
alter table public.votes drop constraint if exists votes_voter_room_fkey;
alter table public.votes
  add constraint votes_voter_room_fkey
  foreign key (room_id, voter_id)
  references public.room_players (room_id, user_id)
  on delete cascade;

alter table public.votes drop constraint if exists votes_target_room_fkey;
alter table public.votes
  add constraint votes_target_room_fkey
  foreign key (room_id, target_id)
  references public.room_players (room_id, user_id)
  on delete cascade;

-- ── ٢. یاریزانی ڕاستەقینە دەبێت لە auth.users هەبێت (نەک بۆت) ──
create or replace function public.enforce_real_user()
returns trigger as $$
begin
  if coalesce(new.is_bot, false) = false then
    if not exists (select 1 from auth.users u where u.id = new.user_id) then
      raise exception 'user_id % لە auth.users نییە (یاریزانی ناڕاستەقینە)', new.user_id
        using errcode = '23503';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_room_players_real_user on public.room_players;
create trigger trg_room_players_real_user
  before insert or update of user_id, is_bot on public.room_players
  for each row execute function public.enforce_real_user();

-- ── ٣. نامەکان: یاریزانی ڕاستەقینە دەبێت لە auth.users هەبێت ──
--    (بۆتەکان لە ڕێگەی post_bot_message ـەوە دێن — ئەوانە تێناپەڕن)
create or replace function public.enforce_real_message_user()
returns trigger as $$
begin
  -- ئەگەر user_id ڕیزێکی بۆتی room_players بوو، ڕێگەی پێبدە
  if exists (
    select 1 from public.room_players rp
    where rp.room_id = new.room_id and rp.user_id = new.user_id and rp.is_bot = true
  ) then
    return new;
  end if;
  if not exists (select 1 from auth.users u where u.id = new.user_id) then
    raise exception 'نامە بۆ user_id %ـی ناڕاستەقینە', new.user_id
      using errcode = '23503';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_messages_real_user on public.messages;
create trigger trg_messages_real_user
  before insert on public.messages
  for each row execute function public.enforce_real_message_user();
