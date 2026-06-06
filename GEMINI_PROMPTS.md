# 🟣 برومبتات Gemini — توليد كلمات الأقسام (كردي + إيموجي + صورة)

كيف تعمل الصور في اللعبة: كل كلمة لها وصف إنجليزي `en`، والتطبيق **يولّد صورة واقعية تلقائيًا** من هذا الوصف عبر Pollinations AI. لذا الأهمّ أن يكون `en` **وصفًا إنجليزيًا دقيقًا وملموسًا** (مثل `red apple fruit`, `kurdish traditional daf drum`). الإيموجي يظهر كبديل أثناء تحميل الصورة.

**الطريقة:**
1. انسخ برومبت القسم الذي تريده من الأسفل.
2. الصقه في Gemini.
3. Gemini يعطيك مصفوفة JSON.
4. أرسلها لي، وألصقها في `src/data/words.js` لذلك القسم.

> ملاحظة: لا تطلب من Gemini روابط صور (`img`) لأنها غالبًا مكسورة/مختلَقة. التطبيق يولّد الصورة من `en` تلقائيًا. إن أردت لاحقًا صورًا حقيقية ثابتة، نضيف حقل `img` بروابط من Wikimedia Commons (موثوقة).

---

## 🧩 القالب العام (مرجع — لا تحتاج نسخه)

```
You are generating word content for a Kurdish (Sorani) "who's the impostor" word game.

Generate exactly 60 items for the category: «<CATEGORY>».

Output ONLY a valid JSON array, no markdown, no comments. Each item:
{ "ku": "<Kurdish Sorani word>", "en": "<specific English description for photo generation>", "emoji": "<one emoji>" }

Rules:
- "ku": a single common Kurdish Sorani word/phrase for this category, in Kurdish script.
- "en": a concrete, specific English noun phrase good for generating a realistic photo
  (e.g. "red ripe apple", "kurdish daf frame drum", "snow leopard"). No abstract terms.
- "emoji": exactly ONE emoji that best represents the word.
- Family-friendly and appropriate for Muslim audiences. No alcohol, gambling,
  pork, idols/statues of worship, magic/sorcery, nudity, or anything haram.
- Concrete, guessable, drawable things only. No duplicates. No numbering.
- Return ONLY the JSON array.
```

---

## 1) کوردەواری (kurdish — الثقافة الكردية)
```
You are generating word content for a Kurdish (Sorani) "who's the impostor" word game.
Generate exactly 60 items for the category: Kurdish culture & heritage (کوردەواری) — traditional clothes, instruments, food, crafts, festivals (Newroz), landscapes (Zagros), tools.
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" must be a specific English description for a realistic photo. One emoji each. Family-friendly, halal, no haram items. Concrete & drawable. No duplicates. JSON only.
```

## 2) ئاژەڵان (animals — الحيوانات)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 80 items for the category: Animals (ئاژەڵان) — include mammals, birds, sea creatures, reptiles, insects.
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English description for a realistic photo (e.g. "snow leopard", "barn owl"). One emoji each. Family-friendly, no haram. Concrete & drawable. No duplicates. JSON only.
```

## 3) خواردن (food — الطعام)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 80 items for the category: Food & dishes & drinks (خواردن و خواردنەوە) — Middle Eastern/Kurdish dishes, breads, sweets, vegetables, non-alcoholic drinks.
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English food description for a realistic photo. One emoji each. HALAL only — no pork, no alcohol. Family-friendly. Concrete & drawable. No duplicates. JSON only.
```

## 4) میوەکان (fruits — الفواكه)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 50 items for the category: Fruits (میوەکان).
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English fruit description for a realistic photo (e.g. "bunch of green grapes"). One emoji each. Family-friendly. Concrete & drawable. No duplicates. JSON only.
```

## 5) شوێنەکان (places — الأماكن)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 60 items for the category: Places & landmarks (شوێنەکان) — buildings, public places, nature places, famous landmark types (mosque, school, market, park, castle).
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English place description for a realistic photo. One emoji each. Family-friendly, halal (no temples/idols of worship; mosque is fine). Concrete & drawable. No duplicates. JSON only.
```

## 6) وەرزش (sports — الرياضة)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 50 items for the category: Sports (وەرزش) — sports, sport equipment, sport actions.
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English sport description for a realistic photo (e.g. "football soccer ball"). One emoji each. Family-friendly. Concrete & drawable. No duplicates. JSON only.
```

## 7) وڵاتان (countries — الدول)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 60 items for the category: Countries (وڵاتان) — well-known countries.
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = "the flag of <country>" or "<country> famous landmark" for a realistic photo. emoji = the country flag emoji. Family-friendly. No duplicates. JSON only.
```

## 8) پیشەکان (professions — المهن)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 55 items for the category: Professions & jobs (پیشەکان).
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = "a <profession> at work" specific English description for a realistic photo (e.g. "a doctor in white coat"). One emoji each. Family-friendly, halal jobs only. Concrete & drawable. No duplicates. JSON only.
```

## 9) هاتووچۆ (transport — وسائل النقل)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 45 items for the category: Transport & vehicles (هاتووچۆ).
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English vehicle description for a realistic photo (e.g. "red double decker bus"). One emoji each. Family-friendly. Concrete & drawable. No duplicates. JSON only.
```

## 10) سروشت (nature — الطبيعة)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 70 items for the category: Nature (سروشت) — landscapes, weather, sky/space, plants, flowers, trees, natural phenomena.
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English nature description for a realistic photo (e.g. "snowy mountain peak", "red tulip flower"). One emoji each. Family-friendly. Concrete & drawable. No duplicates. JSON only.
```

## 11) ئامێر و شتومەک (objects — الأدوات والأشياء)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 90 items for the category: Objects & tools & electronics & household & musical instruments (ئامێر و شتومەک).
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English object description for a realistic photo (e.g. "metal hammer tool", "acoustic guitar"). One emoji each. Family-friendly, no haram items (no idols/statues). Concrete & drawable. No duplicates. JSON only.
```

## 12) جلوبەرگ (clothes — الملابس)
```
You are generating word content for a Kurdish (Sorani) word game.
Generate exactly 50 items for the category: Clothes & accessories (جلوبەرگ) — including Kurdish traditional clothing.
Output ONLY a JSON array, each item: { "ku": "...", "en": "...", "emoji": "..." }.
"en" = specific English clothing description for a realistic photo (e.g. "leather winter jacket", "kurdish traditional dress"). One emoji each. Family-friendly, modest clothing. Concrete & drawable. No duplicates. JSON only.
```

---

## بعد ما يعطيك Gemini الـ JSON
أرسل لي ناتج كل قسم (أو كلها)، وأنا:
1. ألصقها في `src/data/words.js` داخل `ALL_CATEGORIES` للقسم المطابق (بنفس البنية `{ ku, en, emoji }`).
2. التطبيق يولّد الصور تلقائيًا من `en`.

إن رجعت أي كلمة بصورة غير دقيقة، حسّن وصف `en` لها فقط.
