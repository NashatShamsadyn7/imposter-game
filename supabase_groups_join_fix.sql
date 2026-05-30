-- ═══════════════════════════════════════════════════════════
--  چاکسازی: بەشداربوون لە گرووپ بە کۆد (RLS bypass)
--  کێشە: RLS ـی "groups read" ڕێگە نادات کەسێکی نا-ئەندام
--        گرووپ بە کۆد بدۆزێتەوە، بۆیە "گرووپ نەدۆزرایەوە" دەردەکەوێت.
--  چارە: فەنکشنێکی security definer کە کۆد دەدۆزێتەوە و ئەندام دەکات.
--  لە Supabase Dashboard > SQL Editor ئەم کۆدە جێبەجێ بکە (یەک جار).
-- ═══════════════════════════════════════════════════════════

create or replace function public.join_group_by_code(p_code text)
returns public.groups as $$
declare
  g public.groups;
begin
  select * into g
  from public.groups
  where code = upper(trim(p_code))
  limit 1;

  -- گرووپ نییە → null دەگەڕێنێتەوە (ئەپ پەیامی هەڵە پیشان دەدات)
  if g.id is null then
    return null;
  end if;

  -- ئەندامکردنی بەکارهێنەری ئێستا (ئەگەر پێشتر ئەندام بێت، هیچ ناکات)
  insert into public.group_members (group_id, user_id, role)
    values (g.id, auth.uid(), 'member')
    on conflict (group_id, user_id) do nothing;

  return g;
end;
$$ language plpgsql security definer;

-- ڕێگەدان بە بەکارهێنەرە چوونەژوورەوەکان بۆ بانگکردنی فەنکشن
grant execute on function public.join_group_by_code(text) to authenticated;
