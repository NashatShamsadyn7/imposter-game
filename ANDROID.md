# ساختەکار — ئەپی ئەندرۆید (ئۆفلاین)

وەشانێکی ئەندرۆیدی **بەتەواوی ئۆفلاین** لە مۆدی «یەک ئامێر» (Pass and Play).
بێ چوونەژوورەوە، بێ Supabase، بێ ژووری ئۆنلاین — و **بێ ئیزنی ئینتەرنێت**.

| | |
|---|---|
| پاکێج | `com.nashat.imposter` |
| کەمترین وەشان | Android 6 (API 23) |
| قەبارە | ≈ ٤٧ MB |
| ئیزنەکان | `INTERNET` (تەنها پشکنینی وەشان) · `VIBRATE` · `WAKE_LOCK` |

---

## پشکنینی وەشان

تاکە شوێنێکە کە ئەپەکە تۆڕ بەکاردەهێنێت. یارییەکە خۆی — وشە، وێنە،
فۆنت — تەواو لەناو APK ـەکەدایە.

```
app-version.json  ← سەرچاوەی تاکە (Gradle + Vite هەردووکیان لێرەوە)
   ↓
PortfolioWebsite/imposter-version.json  ← لەسەر iosbb0.web.app
   { latestVersionCode, minVersionCode, url, notes }
```

| دۆخ | ئەنجام |
|---|---|
| `versionCode < minVersionCode` | شاشەی ڕێگر — ناتوانرێت یاری بکرێت |
| `versionCode < latestVersionCode` | شریتی بچووک، دەتوانرێت لابدرێت |
| هاوتا | هیچ |
| **شکستی پشکنین / بێ ئینتەرنێت** | **یاری بە ئاسایی — هەرگیز ڕێگری ناکرێت** |

> ⚠️ ئەو دوایینە یاسایەکی سەرەکییە. ئەپێکی ئۆفلاین کە بەبێ تۆڕ
> ناکرێتەوە، هیچ مانایەکی نییە. تاقیکردنەوە بۆ هەر شەش دۆخەکە
> هەیە (تۆڕ نییە، وەڵامی خراپ، ٥٠٠، …).

### بڵاوکردنەوەی وەشانێکی نوێ

1. `app-version.json` → `versionCode` یەک زیاد بکە
2. `npm run build:offline && npx cap sync android && ./gradlew assembleRelease`
3. APK بۆ GitHub Releases
4. `PortfolioWebsite/imposter-version.json` نوێ بکەرەوە و `firebase deploy`
   — `minVersionCode` تەنها کاتێک بەرز بکەرەوە کە نوێکردنەوەکە
   بەڕاستی گرنگ بێت (هەموو ئەوانەی خوارتر ٤٧MB دادەبەزێنن)

---

## چۆن کاردەکات

یەک سەرچاوە، دوو دەرچوون:

```
npm run build          → dist/          وێبسایت (پێشتر وەک خۆی)
npm run build:offline  → dist-offline/  ئەپی ئەندرۆید
```

شاشەکانی یاری (`src/screens/local/*`) لە هەردووکیاندا **بەبێ گۆڕانکاری**
بەکاردێن. جیاوازی بەستەکان لە `vite.config.js` ـەوە دێت، نەک لە کۆدی هاوبەش:

| مۆدیوول | لە دۆخی ئۆفلایندا دەگۆڕدرێت بۆ |
|---|---|
| `state/WordsContext` | `offline/OfflineWordsContext` — بانک لە پەڕگەی هاوپێچکراو، نەک Supabase |
| `components/SuggestSection` | جێگرەوەی بەتاڵ (پێویستی بە Supabase هەیە) |
| `components/MysteryReward` | جێگرەوەی بەتاڵ (ئابووری لە ئەپدا نییە) |

> ⚠️ **تێبینییەکی گرنگ بۆ داهاتوو:** ڕێڕەوی گەڕاوە لە `resolveId` دەبێت بە
> `/` نۆرماڵ بکرێت (`modId()` لە `vite.config.js`). ئەگەر `\` ـی ویندۆز
> بگەڕێتەوە، Vite ئەو پەڕگەیە **دوو جار** سوار دەکات → دوو `createContext`
> → `Provider` لە یەکێکیان دەنووسێت و `useContext` لەوی تر دەخوێنێتەوە
> → شاشەی ڕەش لەگەڵ «useWords دەبێت لەناو WordsProvider بێت».

---

## ئەسڵە هاوپێچکراوەکان (٤٤٫٩ MB)

بە هەڵبژاردن کۆپی دەکرێن — نەک هەموو `public/`:

- `w/` — ٢٬٢٤٨ وێنەی وشە + `lqip.json` (داپۆشینی **٩٩٫٩١٪**ی بانکەکە)
- `word-bank-kurdish-2250.json` — ٢٬٢٥٠ وشە، ١٥ هاوپۆل
- `fonts/` — Vazirmatn (SIL OFL)، ١٢٤ KB
- `game-start/start.mp3`

**مۆسیقا هاوپێچ ناکرێت** (٢٨٫٨ MB + کێشەی مافی لەبەرگرتنەوە).
دەنگە کاریگەرییەکان بە Web Audio دروست دەکرێن — سفر پەڕگە.

**فۆنت دەبێت ناوخۆیی بێت.** `index.html` ـی وێب فۆنت لە CDN دەهێنێت؛
بەبێ ئینتەرنێت ئەوە شکست دەهێنێت و دەق دەکەوێتە سەر فۆنتی سیستەم.
`index.offline.html` هیچ سەرچاوەیەکی دەرەکی نییە.

---

## بنیاتنان

پێویست: **JDK 21** (نەک ٢٣ — AGP 8.7 پشتگیری ناکات)، Android SDK 35.

```bash
npm run build:offline
npx cap sync android
cd android && ./gradlew assembleRelease
```

> **ویندۆز:** لە `android/local.properties` ـدا `/` بەکاربهێنە:
> `sdk.dir=C:/Users/…/Android/Sdk`
> بە `\`، جاڤا `\n` ـی ناو ڕێڕەوەکە وەک دێڕی نوێ لێکدەداتەوە و
> بنیاتنان بە `IOException: filename … syntax is incorrect` دەشکێت.

### واژوو

`android/keystore.properties` (لە Git ـدا نییە):

```properties
storeFile=imposter-release.keystore
storePassword=…
keyAlias=imposter
keyPassword=…
```

بەبێ ئەم پەڕگەیە، `assembleDebug` هێشتا کاردەکات.
**کلیلەکە ون مەکە** — بەبێ ئەو ناتوانرێت ئەپەکە نوێ بکرێتەوە.
