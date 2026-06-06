# Supabase Migrations

هاوکێشەکانی بنکەی داتا، بە ڕیزبەندی کاتی. ناوی فایل: `<YYYYMMDDHHMMSS>_name.sql`.

## جێبەجێکردن

```bash
# پێشنیارکراو — Supabase CLI
supabase db push
```

یان بە دەستی لە **SQL Editor**: فایلەکان بە ڕیزی ناوەکانیان (کۆنترین → نوێترین)
ڕابکێشە. هەموویان **idempotent** ـن (`if not exists` / `or replace`) بۆیە دووبارە
کردنەوەیان بێ مەترسییە.

## ڕیزبەندی

| # | فایل | ناوەڕۆک |
|---|---|---|
| 1 | `..._schema.sql` | خشتە بنەڕەتییەکان + RLS + Realtime + خاڵدان |
| 2 | `..._social.sql` | هاوڕێیان + پەیامی ڕاستەوخۆ |
| 3 | `..._push.sql` | Web Push subscriptions |
| 4 | `..._voice_mod.sql` | کۆنترۆڵی مایک/دەنگ |
| 5 | `..._groups.sql` | گرووپەکان |
| 6 | `..._v2.sql` | زیادکراوەکانی وەشانی ٢ |
| 7 | `..._groups_join_fix.sql` | چاکسازی بەشداربوون لە گرووپ |
| 8 | `..._undercover.sql` | دۆخی Undercover |
| 9 | `..._cosmetics.sql` | جوانکاری/ئابووری |
| 10 | `..._username_referral.sql` | ناوی بەکارهێنەر + ڕیفێرال |
| 11 | `..._bots.sql` | بۆتەکان (add_bot, cast_bot_votes) |
| 12 | `..._custom_rooms.sql` | ژووری دڵخواز |
| 13 | `..._matchmaking.sql` | یاری خێرا |
| 14 | `..._ranked.sql` | پلەبەندی |
| 15 | `..._reports.sql` | ڕاپۆرتەکان |
| 16 | `..._bots_ai.sql` | پەیامی بۆتی زیرەک (post_bot_message) |
| 17 | `..._bot_integrity.sql` | **P0#3** گەڕاندنەوەی یەکپارچەیی داتا |

## تێبینی

پێش ئەم ڕێکخستنە، فایلەکان لە ڕیشەی پڕۆژە بەسەریەکدا بوون (`supabase_*.sql`).
ئێستا هەموویان لێرەن و بە CLI بەڕێوەدەبردرێن (ROADMAP P1#17).
