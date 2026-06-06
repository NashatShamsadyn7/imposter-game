-- ═══════════════════════════════════════════════════════════
--  خشتەکانی Supabase بۆ یاری ئۆنلاینی ڕاستەوخۆی «ساختەکار»
--  لە Supabase Dashboard > SQL Editor ئەم کۆدە جێبەجێ بکە.
-- ═══════════════════════════════════════════════════════════

-- ───── پرۆفایلی بەکارهێنەر ─────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  total_points int default 0,
  games_played int default 0,
  wins int default 0,
  updated_at timestamptz default now()
);

-- ───── ژوورەکان ─────
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid references auth.users(id) on delete cascade,
  status text default 'lobby',           -- lobby | reveal | discussion | voting | results
  category_id text default 'kurdish',
  impostor_count int default 1,
  discussion_seconds int default 120,
  multiplier int default 1,
  mode text default 'classic',            -- classic | undercover (دۆخی یاری)
  secret_word_ku text,
  secret_word_en text,
  decoy_word_ku text,                     -- وشەی نزیک بۆ ساختەکار (تەنها دۆخی undercover)
  decoy_word_en text,
  winner_side text,                       -- crew | impostor (لە کۆتایی یاری)
  turn_player_id uuid,                    -- ئەو یاریزانەی ئێستا نۆرەی وەسفکردنیەتی
  phase_ends_at timestamptz,              -- بۆ هاوکاتکردنی تایمەر
  created_at timestamptz default now()
);

-- ───── یاریزانانی ناو ژوور ─────
create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text,                              -- crew | impostor | null
  is_host boolean default false,
  order_index int default 0,
  points_this_game int default 0,
  ejected boolean default false,
  joined_at timestamptz default now(),
  unique (room_id, user_id)
);

-- ───── نامەکانی چات ─────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  content text not null,
  kind text default 'chat',               -- chat | system | clue
  created_at timestamptz default now()
);

-- ───── دەنگەکان ─────
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  voter_id uuid references auth.users(id) on delete cascade,
  target_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
--  Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.messages enable row level security;
alter table public.votes enable row level security;

-- پرۆفایل: هەمووان دەیبینن، تەنها خاوەنەکەی دەیگۆڕێت
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles upsert own" on public.profiles;
create policy "profiles upsert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- ژوور: هەر بەکارهێنەرێکی چووەژوورەوە دەیبینێت و دروستی دەکات؛ تەنها خانەخوێ دەیگۆڕێت
drop policy if exists "rooms read" on public.rooms;
create policy "rooms read" on public.rooms for select using (auth.role() = 'authenticated');
drop policy if exists "rooms insert" on public.rooms;
create policy "rooms insert" on public.rooms for insert with check (auth.uid() = host_id);
drop policy if exists "rooms host update" on public.rooms;
create policy "rooms host update" on public.rooms for update using (auth.uid() = host_id);
drop policy if exists "rooms host delete" on public.rooms;
create policy "rooms host delete" on public.rooms for delete using (auth.uid() = host_id);

-- یاریزانان: هەمووان دەیانبینن؛ هەرکەس خۆی زیاد/دەردەکات
drop policy if exists "rp read" on public.room_players;
create policy "rp read" on public.room_players for select using (auth.role() = 'authenticated');
drop policy if exists "rp insert self" on public.room_players;
create policy "rp insert self" on public.room_players for insert with check (auth.uid() = user_id);
drop policy if exists "rp update self or host" on public.room_players;
create policy "rp update self or host" on public.room_players for update using (
  auth.uid() = user_id
  or auth.uid() = (select host_id from public.rooms where id = room_id)
);
drop policy if exists "rp delete self or host" on public.room_players;
create policy "rp delete self or host" on public.room_players for delete using (
  auth.uid() = user_id
  or auth.uid() = (select host_id from public.rooms where id = room_id)
);

-- نامەکان: هەمووان دەیانبینن؛ هەرکەس بە ناوی خۆی دەنێرێت
drop policy if exists "msg read" on public.messages;
create policy "msg read" on public.messages for select using (auth.role() = 'authenticated');
drop policy if exists "msg insert self" on public.messages;
create policy "msg insert self" on public.messages for insert with check (auth.uid() = user_id);

-- دەنگەکان: هەمووان دەیانبینن؛ هەرکەس بە ناوی خۆی دەنگ دەدات
drop policy if exists "votes read" on public.votes;
create policy "votes read" on public.votes for select using (auth.role() = 'authenticated');
drop policy if exists "votes insert self" on public.votes;
create policy "votes insert self" on public.votes for insert with check (auth.uid() = voter_id);
drop policy if exists "votes delete self or host" on public.votes;
create policy "votes delete self or host" on public.votes for delete using (
  auth.uid() = voter_id
  or auth.uid() = (select host_id from public.rooms where id = room_id)
);

-- ═══════════════════════════════════════════════════════════
--  چالاککردنی Realtime بۆ خشتەکان
-- ═══════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.votes;

-- ───── فەنکشنی زیادکردنی خاڵ بە شێوەی ئاتۆمیک ─────
create or replace function public.add_points(uid uuid, pts int, won boolean)
returns void as $$
  update public.profiles
  set total_points = total_points + pts,
      games_played = games_played + 1,
      wins = wins + (case when won then 1 else 0 end),
      updated_at = now()
  where id = uid;
$$ language sql security definer;
