-- ═══════════════════════════════════════════════════════════
--  دۆخی «متخفّی» (Undercover) — کۆڵۆمی نوێ بۆ ژوور
--  ئەم فایلە لە Supabase SQL Editor جێبەجێ بکە (یەک جار).
--  دۆخی classic وەک خۆی دەمێنێتەوە؛ undercover وشەیەکی نزیک
--  دەداتە ساختەکار لە جیاتی هیچ.
-- ═══════════════════════════════════════════════════════════

alter table public.rooms
  add column if not exists mode text default 'classic',
  add column if not exists decoy_word_ku text,
  add column if not exists decoy_word_en text;
