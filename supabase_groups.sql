-- ═══════════════════════════════════════════════════════════
--  گرووپەکان (Groups) — گرووپی چات لەناو ئەپ
--  دوای supabase_social.sql جێبەجێ بکە
-- ═══════════════════════════════════════════════════════════

-- ───── کۆدی بێهاوتای گرووپ ─────
create or replace function public.gen_group_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- ───── خشتەی گرووپەکان ─────
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default public.gen_group_code(),
  name text not null,
  avatar_url text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ───── ئەندامانی گرووپ ─────
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',            -- owner | admin | member
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);
create index if not exists gm_group_idx on public.group_members (group_id);
create index if not exists gm_user_idx on public.group_members (user_id);

-- ───── نامەکانی گرووپ ─────
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  content text not null,
  kind text default 'text',              -- text | gif | system | invite
  created_at timestamptz default now()
);
create index if not exists gmsg_group_idx on public.group_messages (group_id, created_at);

-- ═══════════════════════════════════════════════════════════
--  فەنکشنی یاریدەدەر: ئایا بەکارهێنەر ئەندامی گرووپە؟
--  (بۆ خۆلابوون لە دووبارەبوونەوەی RLS)
-- ═══════════════════════════════════════════════════════════
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = uid
  );
$$ language sql security definer stable;

-- ═══════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;

-- گرووپ: ئەندامەکان دەیبینن؛ هەرکەس دروستی دەکات (دەبێتە owner)
drop policy if exists "groups read" on public.groups;
create policy "groups read" on public.groups for select using (
  public.is_group_member(id, auth.uid()) or owner_id = auth.uid()
);
drop policy if exists "groups insert" on public.groups;
create policy "groups insert" on public.groups for insert with check (auth.uid() = owner_id);
drop policy if exists "groups owner update" on public.groups;
create policy "groups owner update" on public.groups for update using (auth.uid() = owner_id);
drop policy if exists "groups owner delete" on public.groups;
create policy "groups owner delete" on public.groups for delete using (auth.uid() = owner_id);

-- ئەندامەکان: ئەندامانی هەمان گرووپ یەکتر دەبینن؛ هەرکەس خۆی زیاد دەکات
drop policy if exists "gm read" on public.group_members;
create policy "gm read" on public.group_members for select using (
  public.is_group_member(group_id, auth.uid())
);
drop policy if exists "gm insert self" on public.group_members;
create policy "gm insert self" on public.group_members for insert with check (auth.uid() = user_id);
drop policy if exists "gm delete self or owner" on public.group_members;
create policy "gm delete self or owner" on public.group_members for delete using (
  auth.uid() = user_id
  or auth.uid() = (select owner_id from public.groups where id = group_id)
);

-- نامەکان: ئەندامەکان دەیانبینن و دەینێرن
drop policy if exists "gmsg read" on public.group_messages;
create policy "gmsg read" on public.group_messages for select using (
  public.is_group_member(group_id, auth.uid())
);
drop policy if exists "gmsg insert member" on public.group_messages;
create policy "gmsg insert member" on public.group_messages for insert with check (
  auth.uid() = sender_id and public.is_group_member(group_id, auth.uid())
);

-- ═══════════════════════════════════════════════════════════
--  Realtime
-- ═══════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.group_messages;
