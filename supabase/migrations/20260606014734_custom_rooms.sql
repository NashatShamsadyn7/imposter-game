-- ═══════════════════════════════════════════════════════════
--  ژوورە تایبەتکراوەکان (Custom Rooms)
--  ٣ ڕێکخستنی نوێ بۆ خانەخوێ:
--   • reveal_seconds  — ماوەی شاردنەوەی کارتی دەستەی کەشتی (٥–٣٠ چرکە)
--   • locked          — ژوور داخراوە: کەس ناتوانێت بەشدار بێت
--   • allow_late_join — ڕێگەدان بە بەشداربوون دوای دەستپێکردنی یاری
--                       (وەک بینەر دەچنە ژوور و لە جۆلی داهاتوو یاریزان دەبن)
--
--  جێبەجێکردن: ئەم فایلە لە SQL Editor ـی Supabase ـدا ڕابکێشە (Run).
-- ═══════════════════════════════════════════════════════════

alter table public.rooms
  add column if not exists reveal_seconds int default 10,
  add column if not exists locked boolean default false,
  add column if not exists allow_late_join boolean default true;
