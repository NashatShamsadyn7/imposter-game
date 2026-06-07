-- ═══════════════════════════════════════════════════════════
--  بانکی وشە (Word Bank) — هاوپۆڵ + وشە لە بنکەی داتا
--  مەبەست: بەڕێوەبەر (admin) دەتوانێت لە مۆبایلیشەوە وشە/وێنە/ئیمۆجی
--  چاکبکات، زیاد بکات، بسڕێتەوە — و یەکسەر بۆ هەموو یاریزانان دەردەکەوێت.
--
--  خوێندنەوە: بۆ هەمووان (تەنها ئەوانەی enabled).
--  نووسین/گۆڕین/سڕینەوە: تەنها بەڕێوەبەر (am_i_admin()).
--
--  جێبەجێکردن: supabase db push  یان لە SQL Editor ـدا ڕایبکێشە.
-- ═══════════════════════════════════════════════════════════

-- ───── بەڕێوەبەر: ئاڵای is_admin لەسەر پرۆفایل ─────
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- خاوەنی ئەپ بکە بە بەڕێوەبەر (بەپێی ئیمەیڵی Google)
update public.profiles set is_admin = true
where id in (select id from auth.users where lower(email) = 'nashatgameryt7@gmail.com');

-- ئایا بەکارهێنەری ئێستا بەڕێوەبەرە؟
create or replace function public.am_i_admin()
returns boolean as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$ language sql security definer stable;

grant execute on function public.am_i_admin() to authenticated, anon;

-- ───── هاوپۆڵەکان ─────
create table if not exists public.word_categories (
  id          text primary key,            -- وەک 'kurdish', 'animals'
  name_ku     text not null,
  name_ar     text,
  name_en     text,
  icon        text,                          -- ئیمۆجیی هاوپۆڵ
  sort        int  not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───── وشەکان ─────
create table if not exists public.word_items (
  id          uuid primary key default gen_random_uuid(),
  category_id text not null references public.word_categories(id) on delete cascade,
  ku          text not null,                 -- ناوی کوردی (لە یاریدا دەردەکەوێت)
  ar          text,                          -- ناوی عەرەبی
  en          text,                          -- پڕۆمپتی ئینگلیزی بۆ وێنەی AI
  emoji       text,                          -- ئیمۆجیی یەدەگ
  image_url   text,                          -- بەستەری وێنەی ڕاستەوخۆ (پێشینەی AI)
  enabled     boolean not null default true,
  sort        int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists word_items_category_idx on public.word_items (category_id, sort);

-- ───── RLS ─────
alter table public.word_categories enable row level security;
alter table public.word_items      enable row level security;

-- خوێندنەوە: هاوپۆڵ/وشەی چالاک بۆ هەمووان، بەڕێوەبەر هەمووی دەبینێت
drop policy if exists "wc read" on public.word_categories;
create policy "wc read" on public.word_categories
  for select using (enabled or public.am_i_admin());

drop policy if exists "wi read" on public.word_items;
create policy "wi read" on public.word_items
  for select using (enabled or public.am_i_admin());

-- نووسین: تەنها بەڕێوەبەر
drop policy if exists "wc admin write" on public.word_categories;
create policy "wc admin write" on public.word_categories
  for all using (public.am_i_admin()) with check (public.am_i_admin());

drop policy if exists "wi admin write" on public.word_items;
create policy "wi admin write" on public.word_items
  for all using (public.am_i_admin()) with check (public.am_i_admin());

-- نوێکردنەوەی updated_at بە خۆکار
create or replace function public.touch_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists wc_touch on public.word_categories;
create trigger wc_touch before update on public.word_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists wi_touch on public.word_items;
create trigger wi_touch before update on public.word_items
  for each row execute function public.touch_updated_at();
