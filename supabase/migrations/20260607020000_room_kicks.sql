-- ═══════════════════════════════════════════════════════════
--  دەرکردنی یاریزان (Kick) + قەدەغەی گەڕانەوە بۆ ٢٠ چرکە
--
--  • kick_player (security definer): تەنها خانەخوێ — ڕیزی یاریزان دەسڕێتەوە
--    (دەرکردنی ڕاستەوخۆ بە Realtime) و قەدەغەیەکی ٢٠ چرکەیی تۆمار دەکات.
--  • RLS ـی "rp insert self" نوێدەکرێتەوە: ڕێگە نادات یاریزانی قەدەغەکراو
--    بگەڕێتەوە پێش تەواوبوونی ٢٠ چرکە (جێبەجێکردنی ڕاستەقینە لە سێرڤەر).
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ڕایبکێشە (idempotent).
-- ═══════════════════════════════════════════════════════════

create table if not exists public.room_kicks (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  until timestamptz not null,
  primary key (room_id, user_id)
);

alter table public.room_kicks enable row level security;

drop policy if exists "kicks read" on public.room_kicks;
create policy "kicks read" on public.room_kicks
  for select using (auth.role() = 'authenticated');
-- هیچ کڵاینت ناتوانێت بنووسێت — تەنها kick_player (security definer)

-- ───── دەرکردنی یاریزان ─────
create or replace function public.kick_player(p_room uuid, p_user uuid)
returns void as $$
begin
  if auth.uid() <> (select host_id from public.rooms where id = p_room) then
    raise exception 'تەنها خانەخوێ دەتوانێت یاریزان دەربکات';
  end if;
  delete from public.room_players where room_id = p_room and user_id = p_user;
  -- قەدەغەی ٢٠ چرکە (بۆتەکان زیان ناکەن، بەڵام پێویستیان پێی نییە)
  insert into public.room_kicks (room_id, user_id, until)
    values (p_room, p_user, now() + interval '20 seconds')
    on conflict (room_id, user_id) do update set until = excluded.until;
end;
$$ language plpgsql security definer;

grant execute on function public.kick_player(uuid, uuid) to authenticated;

-- ───── RLS: ڕێگری لە گەڕانەوەی یاریزانی قەدەغەکراو ─────
drop policy if exists "rp insert self" on public.room_players;
create policy "rp insert self" on public.room_players for insert with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.room_kicks k
    where k.room_id = room_players.room_id
      and k.user_id = auth.uid()
      and k.until > now()
  )
);
