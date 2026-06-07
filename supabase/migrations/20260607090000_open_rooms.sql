-- ═══════════════════════════════════════════════════════════
--  لیستی ژوورە کراوەکان (Open Rooms) — بۆ بەشداربوونی ئاسان
--  • تەنها ژووری ڕاستەقینە (لانیکەم یەک یاریزانی مرۆیی چالاک)
--  • تەنها ژووری لۆبیی نا-داخراو
--  • ژوور دەخرێت ئەگەر هیچ یاریزانێک ٥ خولەک پەیوەست نەبووبێت (last_seen)
--  ژمارەی پیشاندراو = یاریزانە ڕاستەقینەکان (بۆتەکان ناژمێردرێن).
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
           -- تەنها یاریزانی ڕاستەقینە (نەک بۆت، نەک بینەر)
           (select count(*) from public.room_players rp
              where rp.room_id = r.id
                and coalesce(rp.is_spectator, false) = false
                and coalesce(rp.is_bot, false) = false) as player_count
    from public.rooms r
    left join public.room_players hp on hp.room_id = r.id and hp.user_id = r.host_id
    where r.status = 'lobby'
      and coalesce(r.locked, false) = false
      -- لانیکەم یەک یاریزانی ڕاستەقینەی چالاک لە ٥ خولەکی ڕابردوو
      and exists (
        select 1 from public.room_players rp
        where rp.room_id = r.id
          and coalesce(rp.is_bot, false) = false
          and rp.last_seen > now() - interval '5 minutes'
      )
  ) t
  where t.player_count between 1 and 9
  order by t.created_at desc
  limit p_limit;
$$;

grant execute on function public.list_open_rooms(int) to authenticated;

-- ───── داخستنی ژوورە بێچالاکەکان ─────
-- ژووری لۆبی دەسڕێتەوە ئەگەر کۆنتر لە ٥ خولەک بێت و هیچ یاریزانێکی
-- ڕاستەقینەی چالاکی لە ٥ خولەکی ڕابردوودا نەبووبێت (room_players/messages
-- /votes بە cascade دەسڕێنەوە). ژووری نوێ (< ٥ خولەک) پارێزراوە.
create or replace function public.close_stale_rooms()
returns void
language sql security definer
as $$
  delete from public.rooms r
  where r.status = 'lobby'
    and r.created_at < now() - interval '5 minutes'
    and not exists (
      select 1 from public.room_players rp
      where rp.room_id = r.id
        and coalesce(rp.is_bot, false) = false
        and rp.last_seen > now() - interval '5 minutes'
    );
$$;

grant execute on function public.close_stale_rooms() to authenticated;
