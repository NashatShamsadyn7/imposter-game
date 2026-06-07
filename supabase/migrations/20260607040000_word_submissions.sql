-- ═══════════════════════════════════════════════════════════
--  پێشنیاری قسم لەلایەن یاریزانانەوە + پەسەندکردنی بەڕێوەبەر
--  یاریزان قسمێک (ناو + ئیمۆجی + وشە) دەنێرێت → دەچێتە دۆخی 'pending'.
--  بەڕێوەبەر پەسەندی دەکات → دەبێتە قسمی سەرەکی بۆ هەمووان (enabled=true).
--  یان ڕەتی دەکاتەوە → دەسڕێتەوە.
--
--  جێبەجێکردن: supabase db push  یان لە SQL Editor ـدا ڕایبکێشە.
-- ═══════════════════════════════════════════════════════════

-- ───── ستوونی نوێ: دۆخ + ناردەر ─────
alter table public.word_categories add column if not exists status text not null default 'approved';
alter table public.word_categories add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.word_items      add column if not exists status text not null default 'approved';
alter table public.word_items      add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists word_categories_status_idx on public.word_categories (status);

-- ───── RLS: خوێندنەوە ─────
-- چالاک بۆ هەمووان، بەڕێوەبەر هەمووی دەبینێت، ناردەریش پێشنیارەکانی خۆی دەبینێت
drop policy if exists "wc read" on public.word_categories;
create policy "wc read" on public.word_categories
  for select using (enabled or public.am_i_admin() or created_by = auth.uid());

drop policy if exists "wi read" on public.word_items;
create policy "wi read" on public.word_items
  for select using (enabled or public.am_i_admin() or created_by = auth.uid());

-- ───── ناردنی پێشنیار (security definer — بێ پێویستی بە RLS ـی insert) ─────
-- p_words: jsonb array لە { ku, emoji, ar, en }
create or replace function public.submit_section(p_name text, p_icon text, p_words jsonb)
returns text as $$
declare
  uid uuid := auth.uid();
  new_id text;
  pending_count int;
  word_count int;
  w jsonb;
  ord int := 0;
begin
  if uid is null then raise exception 'پێویستە بچیتە ژوورەوە'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'ناوی قسم پێویستە'; end if;

  word_count := jsonb_array_length(coalesce(p_words, '[]'::jsonb));
  if word_count < 5 then raise exception 'لانیکەم ٥ وشە پێویستە'; end if;
  if word_count > 80 then raise exception 'زۆرترین ٨٠ وشە'; end if;

  -- سنووری ناردن: زۆرترین ٣ پێشنیاری چاوەڕوان بۆ هەر یاریزان
  select count(*) into pending_count
  from public.word_categories
  where created_by = uid and status = 'pending';
  if pending_count >= 3 then raise exception 'زۆر پێشنیارت هەیە چاوەڕێی پەسەندکردنە'; end if;

  new_id := 'u_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);

  insert into public.word_categories (id, name_ku, name_ar, icon, sort, enabled, status, created_by)
  values (new_id, trim(p_name), null, coalesce(nullif(trim(p_icon), ''), '🗂️'), 999, false, 'pending', uid);

  for w in select * from jsonb_array_elements(p_words)
  loop
    if coalesce(trim(w->>'ku'), '') <> '' then
      insert into public.word_items (category_id, ku, ar, en, emoji, image_url, enabled, sort, status, created_by)
      values (
        new_id,
        trim(w->>'ku'),
        nullif(trim(coalesce(w->>'ar', '')), ''),
        nullif(trim(coalesce(w->>'en', '')), ''),
        nullif(trim(coalesce(w->>'emoji', '')), ''),
        null, false, ord, 'pending', uid
      );
      ord := ord + 1;
    end if;
  end loop;

  return new_id;
end;
$$ language plpgsql security definer;

grant execute on function public.submit_section(text, text, jsonb) to authenticated;

-- ───── لیستی پێشنیارە چاوەڕوانەکان (تەنها بەڕێوەبەر) ─────
create or replace function public.admin_pending_sections()
returns table (
  id text, name_ku text, icon text, created_by uuid,
  submitter text, word_count bigint, created_at timestamptz
) as $$
  select c.id, c.name_ku, c.icon, c.created_by,
         coalesce(p.display_name, '—') as submitter,
         (select count(*) from public.word_items wi where wi.category_id = c.id) as word_count,
         c.created_at
  from public.word_categories c
  left join public.profiles p on p.id = c.created_by
  where c.status = 'pending' and public.am_i_admin()
  order by c.created_at desc;
$$ language sql security definer stable;

grant execute on function public.admin_pending_sections() to authenticated;

-- ───── پەسەندکردن (تەنها بەڕێوەبەر) ─────
create or replace function public.approve_section(p_id text)
returns void as $$
begin
  if not public.am_i_admin() then raise exception 'تەنها بەڕێوەبەر'; end if;
  update public.word_categories set enabled = true, status = 'approved' where id = p_id;
  update public.word_items set enabled = true, status = 'approved' where category_id = p_id;
end;
$$ language plpgsql security definer;

grant execute on function public.approve_section(text) to authenticated;

-- ───── ڕەتکردنەوە/سڕینەوە (تەنها بەڕێوەبەر) ─────
create or replace function public.reject_section(p_id text)
returns void as $$
begin
  if not public.am_i_admin() then raise exception 'تەنها بەڕێوەبەر'; end if;
  delete from public.word_categories where id = p_id;  -- وشەکان بە cascade دەسڕێنەوە
end;
$$ language plpgsql security definer;

grant execute on function public.reject_section(text) to authenticated;
