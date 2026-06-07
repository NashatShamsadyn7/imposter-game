-- ═══════════════════════════════════════════════════════════
--  بەرگەگرتن لە پچڕانی پەیوەندی — حزووری ناو ژوور + گواستنەوەی
--  خانەخوێ بە خۆکار + پاککردنەوەی یاریزانە بێدەنگەکان
--
--  کێشە: خانەخوێ تاکە خاڵی شکستە — کڵاینتی ئەو تایمەر، بۆتەکان و
--  کۆتاییهێنانی یاری بەڕێوەدەبات. ئەگەر پەیوەندییەکەی بپچڕێت، یاری
--  بە تەواوی دەوەستێت. هەروەها هیچ ئاسەوارێکی حزووری ناو-ژوور نییە،
--  بۆیە ئەوەی تابەکە دادەخات وەک «دڕک» (ghost) دەمێنێتەوە.
--
--  چارەسەر:
--   • room_players.last_seen — نبضی حزوور (هەر ~١٢ چرکە نوێ دەکرێتەوە).
--   • touch_room_presence — یاریزان حزووری خۆی تۆمار دەکات.
--   • claim_host — ئەگەر خانەخوێ ئۆفلاین بوو، کۆنترین یاریزانی ئۆنلاین
--     بە خۆکار دەبێتە خانەخوێ (سێرڤەر بە دەترمینی هەڵدەبژێرێت → پێشبڕکێ
--     سەلامەتە، تەنانەت ئەگەر چەند کڵاینت هاوکات بانگی بکەن).
--   • prune_stale_players — خانەخوێ یاریزانە دیرپچڕاوەکان دەسڕێتەوە.
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ڕایبکێشە (idempotent).
-- ═══════════════════════════════════════════════════════════

-- ── ستوونی حزوور ──
alter table public.room_players
  add column if not exists last_seen timestamptz default now();

create index if not exists room_players_presence_idx
  on public.room_players (room_id, last_seen);

-- ───────────────────────────────────────────────────────────
--  touch_room_presence — یاریزان حزووری خۆی تۆمار دەکات
-- ───────────────────────────────────────────────────────────
create or replace function public.touch_room_presence(p_room uuid)
returns void as $$
  update public.room_players
    set last_seen = now()
    where room_id = p_room and user_id = auth.uid();
$$ language sql security definer;

grant execute on function public.touch_room_presence(uuid) to authenticated;

-- ───────────────────────────────────────────────────────────
--  claim_host — گواستنەوەی خانەخوێ بە خۆکار
--
--  ئەگەر خانەخوێی ئێستا زیاتر لە ٣٠ چرکە ئۆفلاین بوو، کۆنترین
--  یاریزانی ئۆنلاینی نا-بۆت دەبێتە خانەخوێ. هەر کڵاینتێکی ئەندام
--  دەتوانێت بانگی بکات؛ سێرڤەر بە قوفڵی ڕیز (for update) و هەڵبژاردنی
--  دەترمینی، ئەنجامەکە یەکدەخات (idempotent).
-- ───────────────────────────────────────────────────────────
create or replace function public.claim_host(p_room uuid)
returns uuid as $$
declare
  v_host uuid;
  v_host_seen timestamptz;
  v_new uuid;
  v_grace interval := interval '30 seconds';
begin
  -- بانگکەر دەبێت ئەندامی ژوور بێت
  if not exists (
    select 1 from public.room_players
    where room_id = p_room and user_id = auth.uid()
  ) then
    return null;
  end if;

  -- ژوور قوفڵ بکە تاکو پێشبڕکێ سیریاڵ بکرێت
  select host_id into v_host from public.rooms where id = p_room for update;
  if v_host is null then
    return null;
  end if;

  -- کاتی دواین بینینی خانەخوێی ئێستا
  select last_seen into v_host_seen
    from public.room_players
    where room_id = p_room and user_id = v_host;

  -- خانەخوێ هێشتا ئۆنلاینە → هیچ مەگۆڕە
  if v_host_seen is not null and v_host_seen > now() - v_grace then
    return v_host;
  end if;

  -- کۆنترین یاریزانی ئۆنلاینی نا-بۆت/نا-بینەر هەڵبژێرە
  select user_id into v_new
    from public.room_players
    where room_id = p_room
      and coalesce(is_bot, false) = false
      and coalesce(is_spectator, false) = false
      and last_seen is not null
      and last_seen > now() - v_grace
    order by joined_at asc
    limit 1;

  if v_new is null or v_new = v_host then
    return v_host;
  end if;

  -- گواستنەوەی خانەخوێ
  update public.rooms set host_id = v_new where id = p_room;
  update public.room_players
    set is_host = (user_id = v_new),
        can_speak = case when user_id = v_new then true else can_speak end
    where room_id = p_room;

  return v_new;
end;
$$ language plpgsql security definer;

grant execute on function public.claim_host(uuid) to authenticated;

-- ───────────────────────────────────────────────────────────
--  prune_stale_players — سڕینەوەی یاریزانە دیرپچڕاوەکان (تەنها خانەخوێ)
--  مۆڵەتی گەڕانەوە: ٩٠ چرکە (تاکو پەیوەندیی کاتی ناتەواو نەسڕێتەوە).
-- ───────────────────────────────────────────────────────────
create or replace function public.prune_stale_players(p_room uuid)
returns void as $$
begin
  if auth.uid() <> (select host_id from public.rooms where id = p_room) then
    return;
  end if;
  delete from public.room_players
    where room_id = p_room
      and coalesce(is_bot, false) = false
      and is_host = false
      and last_seen is not null
      and last_seen < now() - interval '90 seconds';
end;
$$ language plpgsql security definer;

grant execute on function public.prune_stale_players(uuid) to authenticated;
