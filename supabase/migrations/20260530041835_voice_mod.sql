-- ═══════════════════════════════════════════════════════════
--  کۆنترۆڵی مایک — خانەخوێ ڕێگە دەدات/دەسەنێتەوە
--  دوای supabase_schema.sql جێبەجێ بکە
-- ═══════════════════════════════════════════════════════════

alter table public.room_players
  add column if not exists can_speak boolean default false,
  add column if not exists mic_requested boolean default false;

-- خانەخوێکانی ئێستا ڕێگەیان پێبدە
update public.room_players p
set can_speak = true
from public.rooms r
where p.room_id = r.id and p.user_id = r.host_id and p.can_speak = false;
