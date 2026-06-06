-- ═══════════════════════════════════════════════════════════
--  ڕاپۆرتکردن (Reports) — دژی یاریزانە تێکدەرەکان
--  یاریزان دەتوانێت یاریزانێکی تر ڕاپۆرت بکات بە هۆکارێکەوە.
--  ڕاپۆرتەکان بۆ پێداچوونەوەی بەڕێوەبەر هەڵدەگیرێن (نووسین تەنها).
--
--  جێبەجێکردن: لە SQL Editor ـی Supabase ـدا ڕایبکێشە (Run).
-- ═══════════════════════════════════════════════════════════

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade,
  reported_id uuid references auth.users(id) on delete cascade,
  room_id uuid,
  reason text,
  created_at timestamptz default now()
);

create index if not exists reports_reported_idx on public.reports (reported_id, created_at desc);
-- ڕێگری لە دووبارە ڕاپۆرتکردنی هەمان کەس لە کاتێکی نزیکدا (یەک ڕاپۆرت بۆ هەر ژوور)
create unique index if not exists reports_unique_room_idx
  on public.reports (reporter_id, reported_id, room_id)
  where room_id is not null;

alter table public.reports enable row level security;

-- ڕاپۆرتکردن تەنها بۆ خود (reporter = خۆم) و نەک خۆم ڕاپۆرت بکەم
drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own" on public.reports
  for insert with check (auth.uid() = reporter_id and reporter_id <> reported_id);

-- بەکارهێنەر تەنها ڕاپۆرتەکانی خۆی دەبینێت
drop policy if exists "reports read own" on public.reports;
create policy "reports read own" on public.reports
  for select using (auth.uid() = reporter_id);

-- ژمارەی ڕاپۆرتەکانی یاریزانێک (بۆ بەڕێوەبردنی داهاتوو / ئۆتۆ-بان)
create or replace function public.report_count(p_user uuid)
returns int as $$
  select count(*)::int from public.reports where reported_id = p_user;
$$ language sql security definer stable;

grant execute on function public.report_count(uuid) to authenticated;
