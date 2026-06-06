# 🚀 ساختەکار — یاری ئۆنلاینی گرووپی (Impostor Online)

یاریەکی گرووپیی «ساختەکار» (Social Deduction) بە کوردی سۆرانی، **ئۆنلاینی ڕاستەوخۆ**،
هەر یاریزانێک لە ئامێری خۆیەوە. دیزاینی فەزایی نوار، RTL.
دروستکراوە بە **React + Vite + Tailwind + Supabase Realtime**.

## ✨ تایبەتمەندییەکان

- 🔐 چوونەژوورەوەی Google (مەرج) + پرۆفایل بە وێنە + کۆکردنەوەی خاڵ
- 🏠 دروستکردنی ژوور بە کۆد + بەشداربوون + لیدەربۆردی پاڵەوانان
- 🎭 ڕۆڵ: **دەستەی کەشتی** دژی **ساختەکار** (٣ تا ٤٠ یاریزان)
- 🃏 کارتی نهێنی: دەستەی کەشتی وشە + وێنە دەبینێت (دوای ١٠ چرکە دەشاردرێتەوە)؛ ساختەکار تەنها هاوەڵە ساختەکارەکانی دەناسێت
- 💬 **چاتی ڕاستەوخۆ** لە کاتی گفتوگۆ (ڕێسپۆنسیڤ بۆ مۆبایل و دیسکتۆپ)
- ⏱️ تایمەری هاوکاتکراوی گفتوگۆ + ڕیزی وەسفکردن بەنۆرە
- 🗳️ دەنگدانی فرە-هەڵبژاردە — ئەو **N** کەسەی زۆرترین دەنگ دەردەکرێن (N = ژمارەی ساختەکار)
- 🏆 سیستەمی خاڵ + Multiplier + لیدەربۆردی گشتی

## 🎲 ڕێسای خاڵ

- **دەستەی کەشتی:** خاڵ = ژمارەی ساختەکارە ڕاستەکان لە دەنگەکانیدا (لانیکەم ١)
- **ساختەکار (ڕزگاربوو):** ٠ دەنگ → ٣ خاڵ · ١–٢ دەنگ → ٢ خاڵ · زیاتر → ١ خاڵ · دەرکراو → ٠
- هەموو خاڵەکان **× Multiplier** (١x/٢x/٣x)
- **براوە:** دەستەی کەشتی ئەگەر هەموو ساختەکارەکان دەربکرێن، ئەگەرنا ساختەکارەکان

## 🛠️ دامەزراندن

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # وەشانی کۆتایی
```

## ☁️ ڕێکخستنی Supabase (مەرجە بۆ یاری ئۆنلاین)

### ١. دروستکردنی پڕۆژە
1. بڕۆ بۆ [supabase.com](https://supabase.com) و پڕۆژەیەکی نوێ دروست بکە.
2. لە `Project Settings > API`، ئەمانە کۆپی بکە:
   - `Project URL`
   - `anon public key`

### ٢. دانانی کلیلەکان
فایلێکی `.env` دروست بکە (لە `.env.example`ـەوە) و دایبنێ:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### ٣. دروستکردنی خشتەکان
هەموو فایلەکانی SQL ئێستا لە **`supabase/migrations/`** ـدان، ناودراون بە ڕیزبەندی
کاتی (`<timestamp>_name.sql`). بە دوو ڕێگە جێبەجێیان بکە:

- **CLI (پێشنیارکراو):** `supabase db push` (هەموویان بە ڕیزبەندی جێبەجێ دەکات).
- **بە دەستی:** لە `SQL Editor`، فایلەکان بە ڕیزی ناوەکانیان (کۆنترین → نوێترین)
  کۆپی بکە و **RUN** بکە، دەستپێبکە بە `..._schema.sql`.

(ئەمە خشتەکان + RLS + Realtime + فەنکشنی خاڵ دروست دەکات.)

### ٤. چالاککردنی Google Sign-In
1. لە `Authentication > Providers > Google`، چالاکی بکە.
2. لە [Google Cloud Console](https://console.cloud.google.com):
   - `OAuth consent screen` ڕێکبخە
   - `Credentials > Create OAuth Client ID > Web application`
   - لە `Authorized redirect URIs` ئەمە زیاد بکە:
     `https://xxxx.supabase.co/auth/v1/callback`
   - `Client ID` و `Client Secret` بگەڕێنەوە بۆ Supabase و دایبنێ.
3. لە Supabase، `Authentication > URL Configuration`، `Site URL` بکە بە
   `http://localhost:5173` (یان ناونیشانی وێبسایتەکەت).

### ٥. کارپێکردن
```bash
npm run dev
```

## 🌐 بڵاوکردنەوە بۆ وێب (بەخۆڕایی)

لەسەر **Vercel** یان **Netlify**:
1. کۆدەکە بەرز بکەرەوە (GitHub).
2. `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` وەک Environment Variables زیاد بکە.
3. لە Supabase `Site URL` و Google `redirect URIs` بگۆڕە بۆ دۆمەینی نوێ.

## 📂 پێکهاتە

```
src/
├── data/words.js          # ١١ هاوپۆلی وشە + نەخشەی ئینگلیزی
├── lib/
│   ├── supabase.js        # چوونەژوورەوە + ژوور + چات + دەنگ + ڕاستەوخۆ
│   ├── scoring.js         # لۆجیکی دەنگ و خاڵ
│   ├── images.js          # وێنەی Pollinations
│   └── sound.js           # دەنگ و مۆسیقا
├── state/
│   ├── AuthContext.jsx    # چوونەژوورەوە + پرۆفایل
│   └── RoomContext.jsx    # دۆخی ژووری ڕاستەوخۆ + لۆجیکی یاری
├── components/            # Avatar, Chat, WordImage, ...
└── screens/               # Login, Home, RoomLobby, Reveal, Discussion, Voting, Results
```

---
دروستکراوە بە 💙 بۆ کۆبوونەوە و خۆشی.
