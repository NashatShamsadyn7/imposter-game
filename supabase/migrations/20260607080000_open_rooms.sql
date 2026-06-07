-- ═══════════════════════════════════════════════════════════
--  لیستی ژوورە کراوەکان (Open Rooms) — بۆ بەشداربوونی ئاسان
--  ژوورانی لۆبیی نا-داخراو پیشان دەدات لەگەڵ ژمارەی یاریزانان.
--  (security definer تاکو ژمارەی یاریزانان بۆ ژووری نا-ئەندامیش بخوێنرێتەوە)
--
--  جێبەجێکردن: supabase db push  یان لە SQL Editor ـدا ڕایبکێشە.
-- ═══════════════════════════════════════════════════════════

create or replace function public.list_open_rooms(p_limit int default 30)
returns table (
  id uuid, code text, host_name text, category_id text,
  mode text, player_count bigint, created_at timestamptz
)
language sql security definer stable
as $$
  select t.id, t.code, t.host_name, t.category_id, t.mode, t.player_count, t.created_at
  from (
    select r.id, r.code,
           coalesce(hp.display_name, '—') as host_name,
           r.category_id, r.mode, r.created_at,
           (select count(*) from public.room_players rp
              where rp.room_id = r.id and coalesce(rp.is_spectator, false) = false) as player_count
    from public.rooms r
    left join public.room_players hp on hp.room_id = r.id and hp.user_id = r.host_id
    where r.status = 'lobby' and coalesce(r.locked, false) = false
  ) t
  where t.player_count between 1 and 9
  order by t.created_at desc
  limit p_limit;
$$;

grant execute on function public.list_open_rooms(int) to authenticated;
