-- ═══════════════════════════════════════════════════════════
--  خشتەکانی Supabase بۆ یاری IQ ـی ئۆنلاین (خێرایی — خێراترین وەڵامی ڕاست)
--  لە Supabase Dashboard > SQL Editor ئەم کۆدە جێبەجێ بکە.
-- ═══════════════════════════════════════════════════════════

-- ───── ژوورەکانی IQ ─────
create table if not exists public.iq_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid references auth.users(id) on delete cascade,
  status text default 'lobby',            -- lobby | playing | reveal | results
  category_id text default 'mix',
  question_count int default 10,
  seconds_per_q int default 15,
  current_index int default 0,            -- پرسیاری ئێستا
  questions jsonb,                         -- لیستی پرسیارەکان (هاوبەش بۆ هەمووان)
  question_started_at timestamptz,         -- بۆ هاوکاتکردنی تایمەر
  created_at timestamptz default now()
);

-- ───── یاریزانانی ژووری IQ ─────
create table if not exists public.iq_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.iq_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  is_host boolean default false,
  lives int default 1,            -- دۆخی بۆمب: ژیان (٠ = دەرچوو)
  joined_at timestamptz default now(),
  unique (room_id, user_id)
);

-- ───── ستوونە نوێیەکانی دۆخی بۆمب (ئەگەر خشتەکان پێشتر دروستکرابوون) ─────
alter table public.iq_rooms   add column if not exists game_mode text default 'speed'; -- speed | bomb
alter table public.iq_rooms   add column if not exists holder_id uuid;                 -- بۆمب: نۆرەی ئێستا
alter table public.iq_rooms   add column if not exists bomb_ends_at timestamptz;       -- بۆمب: کاتی تەقینەوەی شاراوە
alter table public.iq_players add column if not exists lives int default 1;

-- ───── وەڵامەکان (هەر پرسیار، هەر یاریزان جارێک) ─────
create table if not exists public.iq_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.iq_rooms(id) on delete cascade,
  q_index int not null,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  choice int,                              -- فهرستی هەڵبژاردراو (-1 = کات تەواو بوو)
  is_correct boolean default false,
  ms int default 0,                        -- کاتی وەڵامدانەوە بە میلیچرکە
  points int default 0,
  created_at timestamptz default now(),
  unique (room_id, q_index, user_id)
);

-- ═══════════════════════════════════════════════════════════
--  Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════
alter table public.iq_rooms enable row level security;
alter table public.iq_players enable row level security;
alter table public.iq_answers enable row level security;

-- ژوور: هەر بەکارهێنەرێکی چووەژوورەوە دەیبینێت و دروستی دەکات؛ تەنها خانەخوێ دەیگۆڕێت
drop policy if exists "iq_rooms read" on public.iq_rooms;
create policy "iq_rooms read" on public.iq_rooms for select using (auth.role() = 'authenticated');
drop policy if exists "iq_rooms insert" on public.iq_rooms;
create policy "iq_rooms insert" on public.iq_rooms for insert with check (auth.uid() = host_id);
drop policy if exists "iq_rooms host update" on public.iq_rooms;
create policy "iq_rooms host update" on public.iq_rooms for update using (auth.uid() = host_id);
drop policy if exists "iq_rooms host delete" on public.iq_rooms;
create policy "iq_rooms host delete" on public.iq_rooms for delete using (auth.uid() = host_id);

-- یاریزانان: هەمووان دەیانبینن؛ هەرکەس خۆی زیاد/دەردەکات
drop policy if exists "iq_players read" on public.iq_players;
create policy "iq_players read" on public.iq_players for select using (auth.role() = 'authenticated');
drop policy if exists "iq_players insert self" on public.iq_players;
create policy "iq_players insert self" on public.iq_players for insert with check (auth.uid() = user_id);
drop policy if exists "iq_players delete self or host" on public.iq_players;
create policy "iq_players delete self or host" on public.iq_players for delete using (
  auth.uid() = user_id
  or auth.uid() = (select host_id from public.iq_rooms where id = room_id)
);

-- وەڵامەکان: هەمووان دەیانبینن؛ هەرکەس بە ناوی خۆی وەڵام دەداتەوە
drop policy if exists "iq_answers read" on public.iq_answers;
create policy "iq_answers read" on public.iq_answers for select using (auth.role() = 'authenticated');
drop policy if exists "iq_answers insert self" on public.iq_answers;
create policy "iq_answers insert self" on public.iq_answers for insert with check (auth.uid() = user_id);
drop policy if exists "iq_answers delete host" on public.iq_answers;
create policy "iq_answers delete host" on public.iq_answers for delete using (
  auth.uid() = (select host_id from public.iq_rooms where id = room_id)
);

-- ═══════════════════════════════════════════════════════════
--  چالاککردنی Realtime
-- ═══════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.iq_rooms;
alter publication supabase_realtime add table public.iq_players;
alter publication supabase_realtime add table public.iq_answers;
