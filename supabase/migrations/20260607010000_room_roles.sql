-- ═══════════════════════════════════════════════════════════
--  P0#1 — شاردنەوەی ڕۆڵەکان لە لای سێرڤەرەوە (Server-authoritative)
--
--  کێشە: room_players.role بۆ هەموو کڵاینتەکان هاوکاتدەکرا (Realtime + RLS
--  "rp read"). هەر یاریزانێک Network/Console بکاتەوە → دەزانێت کێ ساختەکارە.
--
--  چارەسەر:
--   • ڕۆڵەکان لە خشتەیەکی جیا (room_roles) بە RLS ـی "تەنها ڕۆڵی خۆم".
--   • room_players.role لە کاتی یاری بەتاڵ دەمێنێتەوە (هیچ کڵاینت نایبینێت).
--   • assign_roles: سێرڤەر بە هەرەمەکی ڕۆڵ دابەش دەکات (تەنانەت خانەخوێش
--     ناتوانێت هەڵبژێرێت/بزانێت — تەنها ڕۆڵی خۆی).
--   • get_my_role / get_my_allies / get_detective_target: کڵاینت تەنها
--     زانیاری خۆی وەردەگرێت بە RPC.
--   • get_bot_roles: تەنها خانەخوێ، بۆ بەڕێوەبردنی بۆتەکان.
--   • reveal_roles: لە کۆتایی یاری، خانەخوێ هەموو ڕۆڵەکان وەردەگرێت بۆ
--     لێکدانەوەی ئەنجام (scoring.js ـی تاقیکراوە) و دەیانخاتە سەر
--     room_players (ئاشکراکردن لە دوای یاری ئاساییە).
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ڕایبکێشە (idempotent).
--  ⚠️ پێش بەکارهێنان لە production لە staging تاقی بکەرەوە (ROADMAP P1#17).
-- ═══════════════════════════════════════════════════════════

-- ── خشتەی ڕۆڵە نهێنییەکان ──
create table if not exists public.room_roles (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  role text,
  primary key (room_id, user_id)
);

alter table public.room_roles enable row level security;

-- تەنها ڕۆڵی خۆم دەبینم (نە ڕۆڵی کەسانی تر)
drop policy if exists "roles read own" on public.room_roles;
create policy "roles read own" on public.room_roles
  for select using (auth.uid() = user_id);

-- هیچ کڵاینت ناتوانێت ڕاستەوخۆ بنووسێت — تەنها فەنکشنی security definer
-- (هیچ insert/update/delete policy دانانرێت → بە RLS بلۆکدەکرێت)

-- ⚠️ room_roles ناخرێتە ناو publication ـی realtime (هاوکات ناکرێت)

-- ───────────────────────────────────────────────────────────
--  assign_roles — دابەشکردنی ڕۆڵ لە لای سێرڤەرەوە (تەنها خانەخوێ)
--  دۆخەکان: 'classic' | 'undercover' | 'detective'
-- ───────────────────────────────────────────────────────────
create or replace function public.assign_roles(
  p_room uuid, p_impostor_count int, p_mode text
)
returns void as $$
declare
  v_ids uuid[];
  v_imps uuid[];
  v_detective uuid;
begin
  if auth.uid() <> (select host_id from public.rooms where id = p_room) then
    raise exception 'تەنها خانەخوێ دەتوانێت ڕۆڵ دابەش بکات';
  end if;

  -- یاریزانە چالاکەکان (نە بینەر) بە ڕیزبەندی هەرەمەکی
  select array_agg(user_id order by random())
    into v_ids
    from public.room_players
    where room_id = p_room and coalesce(is_spectator, false) = false;

  if v_ids is null or array_length(v_ids, 1) is null then
    raise exception 'یاریزانی چالاک نییە';
  end if;

  -- ساختەکارەکان = یەکەم N لە لیستی تێکەڵکراو
  v_imps := v_ids[1:greatest(1, p_impostor_count)];

  -- لێکۆڵەر (detective mode): یەکەم کەسی نا-ساختەکار
  v_detective := null;
  if p_mode = 'detective' then
    select id into v_detective from (
      select unnest(v_ids) as id
    ) q
    where id <> all(v_imps)
    limit 1;
  end if;

  -- سڕینەوەی ڕۆڵە کۆنەکان و دانانی نوێ
  delete from public.room_roles where room_id = p_room;
  insert into public.room_roles (room_id, user_id, role)
  select p_room, uid,
    case
      when uid = any(v_imps) then 'impostor'
      when uid = v_detective then 'detective'
      else 'crew'
    end
  from unnest(v_ids) as uid;

  -- room_players.role بەتاڵ دەکرێتەوە (کڵاینت نایبینێت لە کاتی یاری)
  update public.room_players
    set role = null, ejected = false, points_this_game = 0
    where room_id = p_room;
end;
$$ language plpgsql security definer;

grant execute on function public.assign_roles(uuid, int, text) to authenticated;

-- ───────────────────────────────────────────────────────────
--  get_my_role — ڕۆڵی بانگکەر
-- ───────────────────────────────────────────────────────────
create or replace function public.get_my_role(p_room uuid)
returns text as $$
  select role from public.room_roles
  where room_id = p_room and user_id = auth.uid();
$$ language sql security definer stable;

grant execute on function public.get_my_role(uuid) to authenticated;

-- ───────────────────────────────────────────────────────────
--  get_my_allies — ساختەکارانی تر (تەنها ئەگەر بانگکەر ساختەکار بێت)
-- ───────────────────────────────────────────────────────────
create or replace function public.get_my_allies(p_room uuid)
returns table (user_id uuid, display_name text, avatar_url text) as $$
  select rp.user_id, rp.display_name, rp.avatar_url
  from public.room_roles rr
  join public.room_players rp
    on rp.room_id = rr.room_id and rp.user_id = rr.user_id
  where rr.room_id = p_room
    and rr.role = 'impostor'
    and rr.user_id <> auth.uid()
    -- تەنها ئەگەر بانگکەر خۆی ساختەکار بێت
    and exists (
      select 1 from public.room_roles me
      where me.room_id = p_room and me.user_id = auth.uid() and me.role = 'impostor'
    );
$$ language sql security definer stable;

grant execute on function public.get_my_allies(uuid) to authenticated;

-- ───────────────────────────────────────────────────────────
--  get_detective_target — یەک ساختەکار (تەنها بۆ لێکۆڵەر)
-- ───────────────────────────────────────────────────────────
create or replace function public.get_detective_target(p_room uuid)
returns table (user_id uuid, display_name text, avatar_url text) as $$
  select rp.user_id, rp.display_name, rp.avatar_url
  from public.room_roles rr
  join public.room_players rp
    on rp.room_id = rr.room_id and rp.user_id = rr.user_id
  where rr.room_id = p_room
    and rr.role = 'impostor'
    and exists (
      select 1 from public.room_roles me
      where me.room_id = p_room and me.user_id = auth.uid() and me.role = 'detective'
    )
  order by rp.order_index
  limit 1;
$$ language sql security definer stable;

grant execute on function public.get_detective_target(uuid) to authenticated;

-- ───────────────────────────────────────────────────────────
--  get_bot_roles — ڕۆڵی بۆتەکان (تەنها خانەخوێ، بۆ بەڕێوەبردن)
-- ───────────────────────────────────────────────────────────
create or replace function public.get_bot_roles(p_room uuid)
returns table (user_id uuid, role text) as $$
  select rr.user_id, rr.role
  from public.room_roles rr
  join public.room_players rp
    on rp.room_id = rr.room_id and rp.user_id = rr.user_id
  where rr.room_id = p_room
    and rp.is_bot = true
    and auth.uid() = (select host_id from public.rooms where id = p_room);
$$ language sql security definer stable;

grant execute on function public.get_bot_roles(uuid) to authenticated;

-- ───────────────────────────────────────────────────────────
--  reveal_roles — کۆتایی یاری: خانەخوێ هەموو ڕۆڵەکان وەردەگرێت و
--  دەیانخاتە سەر room_players بۆ پیشاندان (ئاشکراکردنی دوای یاری).
--  دەگەڕێنێتەوە: [{user_id, role}]
-- ───────────────────────────────────────────────────────────
create or replace function public.reveal_roles(p_room uuid)
returns table (user_id uuid, role text) as $$
begin
  if auth.uid() <> (select host_id from public.rooms where id = p_room) then
    raise exception 'تەنها خانەخوێ دەتوانێت ڕۆڵەکان ئاشکرا بکات';
  end if;
  -- ڕۆڵەکان بخەرە سەر room_players (ئێستا یاری تەواوبووە، ئاشکراکردن ئاساییە)
  update public.room_players rp
    set role = rr.role
    from public.room_roles rr
    where rr.room_id = p_room
      and rp.room_id = rr.room_id
      and rp.user_id = rr.user_id;
  return query
    select rr.user_id, rr.role from public.room_roles rr where rr.room_id = p_room;
end;
$$ language plpgsql security definer;

grant execute on function public.reveal_roles(uuid) to authenticated;
