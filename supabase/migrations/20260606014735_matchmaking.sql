-- ═══════════════════════════════════════════════════════════
--  یاری خێرا (Quick Match / Matchmaking)
--  زیادکردنی ستوونی is_public + فەنکشنی quick_match کە:
--   ١. بەدوای ژوورێکی گشتیی کراوەدا دەگەڕێت (لۆبی، نەقفڵکراو، پڕ نەبووە)
--   ٢. ئەگەر نەیدۆزییەوە، ژوورێکی نوێی گشتی دروستدەکات
--  ئەمە پێشبڕکێی خێرا بۆ یاریزانانی هەرەمەکی ئاسان دەکات.
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ـدا ڕایبکێشە (Run).
-- ═══════════════════════════════════════════════════════════

alter table public.rooms
  add column if not exists is_public boolean default false;

create index if not exists rooms_public_idx
  on public.rooms (is_public, status, created_at desc);

create or replace function public.quick_match()
returns public.rooms as $$
declare
  r public.rooms;
  v_code text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  -- ١. ژوورێکی گشتیی کراوە بدۆزەرەوە (نوێترین، نزیک لە پڕبوون بۆ خێرا دەستپێکردن)
  select rm.* into r
  from public.rooms rm
  where rm.is_public = true
    and rm.status = 'lobby'
    and coalesce(rm.locked, false) = false
    and rm.created_at > now() - interval '30 minutes'
    and (select count(*) from public.room_players p where p.room_id = rm.id) < 10
    and rm.host_id <> auth.uid()
    -- پێشتر لەو ژوورەدا نەبووبم
    and not exists (
      select 1 from public.room_players p
      where p.room_id = rm.id and p.user_id = auth.uid()
    )
  order by (select count(*) from public.room_players p where p.room_id = rm.id) desc
  limit 1;

  if found then
    return r;
  end if;

  -- ٢. هیچ نەدۆزرایەوە — ژوورێکی نوێی گشتی دروست بکە (کۆدی بێهاوتا)
  loop
    v_code := '';
    for i in 1..5 loop
      v_code := v_code || substr(v_chars, floor(random() * 32)::int + 1, 1);
    end loop;
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  insert into public.rooms (code, host_id, status, category_id, impostor_count,
                            discussion_seconds, multiplier, mode, is_public)
    values (v_code, auth.uid(), 'lobby', 'kurdish', 1, 120, 1, 'classic', true)
    returning * into r;

  return r;
end;
$$ language plpgsql security definer;

grant execute on function public.quick_match() to authenticated;
