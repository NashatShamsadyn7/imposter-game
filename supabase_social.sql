-- ═══════════════════════════════════════════════════════════
--  سیستەمی کۆمەڵایەتی: هاوڕێیان + نامەی تایبەت + پرۆفایل + حزووری ئۆنلاین
--  لە Supabase Dashboard > SQL Editor ئەم کۆدە جێبەجێ بکە (دوای supabase_schema.sql)
-- ═══════════════════════════════════════════════════════════

-- ───── زیادکردن بۆ خشتەی پرۆفایل ─────
alter table public.profiles add column if not exists friend_code text;
alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists custom_profile boolean default false;

-- کۆدی هاوڕێیەتی بێهاوتا
create unique index if not exists profiles_friend_code_idx on public.profiles (friend_code);

-- فەنکشنی دروستکردنی کۆدی هاوڕێیەتی (٦ پیت/ژمارە)
create or replace function public.gen_friend_code()
returns text as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    (floor(random()*32)+1)::int, 1), '')
  from generate_series(1, 6);
$$ language sql volatile;

-- کۆد بدە بەو پرۆفایلانەی هێشتا کۆدیان نییە
update public.profiles set friend_code = public.gen_friend_code() where friend_code is null;

-- بۆ پرۆفایلی نوێ: کۆد بە شێوەی خۆکار
alter table public.profiles alter column friend_code set default public.gen_friend_code();

-- ───── خشتەی هاوڕێیەتی ─────
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete cascade,
  addressee_id uuid references auth.users(id) on delete cascade,
  status text default 'pending',          -- pending | accepted
  created_at timestamptz default now(),
  unique (requester_id, addressee_id)
);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);
create index if not exists friendships_requester_idx on public.friendships (requester_id);

-- ───── نامەی تایبەت (DM) + بانگهێشتی ژوور ─────
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  content text not null,
  kind text default 'text',               -- text | invite (لە invite دا content = کۆدی ژوور)
  created_at timestamptz default now(),
  read_at timestamptz
);
create index if not exists dm_pair_idx on public.direct_messages (sender_id, recipient_id, created_at);

-- ═══════════════════════════════════════════════════════════
--  RLS
-- ═══════════════════════════════════════════════════════════
alter table public.friendships enable row level security;
alter table public.direct_messages enable row level security;

-- هاوڕێیەتی: تەنها لایەنەکانی پەیوەندیدار دەیبینن
drop policy if exists "friendships read" on public.friendships;
create policy "friendships read" on public.friendships for select using (
  auth.uid() = requester_id or auth.uid() = addressee_id
);
drop policy if exists "friendships insert" on public.friendships;
create policy "friendships insert" on public.friendships for insert with check (auth.uid() = requester_id);
-- تەنها وەرگر دەتوانێت داواکاری قبووڵ بکات (update)
drop policy if exists "friendships update" on public.friendships;
create policy "friendships update" on public.friendships for update using (
  auth.uid() = addressee_id or auth.uid() = requester_id
);
-- هەردوولا دەتوانن بیسڕنەوە (ڕەتکردنەوە/سڕینەوەی هاوڕێ)
drop policy if exists "friendships delete" on public.friendships;
create policy "friendships delete" on public.friendships for delete using (
  auth.uid() = requester_id or auth.uid() = addressee_id
);

-- نامەی تایبەت: تەنها نێرەر و وەرگر
drop policy if exists "dm read" on public.direct_messages;
create policy "dm read" on public.direct_messages for select using (
  auth.uid() = sender_id or auth.uid() = recipient_id
);
drop policy if exists "dm insert" on public.direct_messages;
create policy "dm insert" on public.direct_messages for insert with check (auth.uid() = sender_id);
drop policy if exists "dm update read" on public.direct_messages;
create policy "dm update read" on public.direct_messages for update using (auth.uid() = recipient_id);

-- ═══════════════════════════════════════════════════════════
--  Realtime
-- ═══════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.direct_messages;

-- ═══════════════════════════════════════════════════════════
--  حزووری ئۆنلاین — نوێکردنەوەی last_seen
-- ═══════════════════════════════════════════════════════════
create or replace function public.touch_last_seen()
returns void as $$
  update public.profiles set last_seen = now() where id = auth.uid();
$$ language sql security definer;

-- ═══════════════════════════════════════════════════════════
--  Storage — بەرامبەری وێنەی پرۆفایل (avatars)
-- ═══════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- خوێندنەوەی گشتی (بەکەتە گشتییە بەهەرحاڵ)
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');

-- هەر بەکارهێنەرێک تەنها لە فۆڵدەری خۆیدا (uid/...) دەتوانێت بار/سڕ بکات
drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
