-- ═══════════════════════════════════════════════════════════
--  وێنەی وشە — Storage bucket بۆ بارکردنی وێنە لە مۆبایلەوە
--  هەروەها submit_section نوێ دەکرێتەوە تاکو image_url پاشەکەوت بکات.
--
--  جێبەجێکردن: supabase db push  یان لە SQL Editor ـدا ڕایبکێشە.
-- ═══════════════════════════════════════════════════════════

-- ───── Bucket ـی گشتی بۆ وێنەی وشە ─────
insert into storage.buckets (id, name, public)
values ('word-images', 'word-images', true)
on conflict (id) do nothing;

-- خوێندنەوەی گشتی
drop policy if exists "word-images public read" on storage.objects;
create policy "word-images public read" on storage.objects for select
  using (bucket_id = 'word-images');

-- بارکردن/گۆڕین/سڕینەوە: تەنها خاوەنی فۆڵدەر (uid)
drop policy if exists "word-images insert own" on storage.objects;
create policy "word-images insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'word-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "word-images update own" on storage.objects;
create policy "word-images update own" on storage.objects for update to authenticated
  using (bucket_id = 'word-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "word-images delete own" on storage.objects;
create policy "word-images delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'word-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───── نوێکردنەوەی submit_section: پاشەکەوتی image_url ─────
-- p_words: jsonb array لە { ku, image_url, ar, en, emoji }
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
        nullif(trim(coalesce(w->>'image_url', '')), ''),
        false, ord, 'pending', uid
      );
      ord := ord + 1;
    end if;
  end loop;

  return new_id;
end;
$$ language plpgsql security definer;

grant execute on function public.submit_section(text, text, jsonb) to authenticated;
