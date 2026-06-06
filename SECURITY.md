# 🔐 ئاسایش — Security

## ناردنی کێشە (Reporting)
ئەگەر کەلێنێکی ئاسایشت دۆزییەوە، **ئاشکرای مەکە بە گشتی**. پەیوەندی بکە بە
خاوەنی پڕۆژە بە ئیمەیڵی پەیوەندی.

---

## ✅ P0#2 — تدوير الأسرار (Secret Rotation) — مُنجَز

> ملاحظة: أُنجز التدوير بتاريخ 2026-06-07. القائمة أدناه مرجع للتدوير الدوري
> أو عند أي اشتباه بتسريب. هذه أفعال على لوحات تحكّم خارجية تُنفَّذ يدويًا.

### قائمة التدوير (Rotation checklist)

- [ ] **Supabase**
  - [ ] `anon` key — Project Settings → API → Reset (ثم حدّث `VITE_SUPABASE_ANON_KEY`).
  - [ ] `service_role` key — Reset (لا يُستخدم في الواجهة أبدًا؛ Edge functions فقط عبر secrets).
  - [ ] كلمة مرور قاعدة البيانات — Database → Reset password.
  - [ ] فعّل **Realtime Authorization** (RLS على القنوات) — مرتبط بـ ROADMAP P1#6.
- [ ] **Groq / BOT_API_KEY**
  - [ ] أنشئ مفتاحًا جديدًا في Groq Console، احذف القديم.
  - [ ] حدّثه في Supabase Edge Function secrets: `supabase secrets set BOT_API_KEY=...`
- [ ] **Vercel**
  - [ ] دوّر أي Deploy Hooks / Access Tokens من Account Settings → Tokens.
  - [ ] راجع Environment Variables واستبدل أي قيمة مسرّبة.
- [ ] **GitHub**
  - [ ] ألغِ أي Personal Access Token مسرّب (Settings → Developer settings → Tokens).
  - [ ] فعّل **Secret Scanning** + **Push Protection**: Repo → Settings → Code security.
- [ ] **GIPHY / VAPID**
  - [ ] دوّر `VITE_GIPHY_KEY` إن لزم.
  - [ ] مفاتيح VAPID تُولّد محليًا — أعد توليدها فقط إن تسرّب الخاص.
- [ ] **`.codex/config.toml`** — يحوي توكنات حيّة؛ مُتجاهَل في `.gitignore`، **تأكّد ألّا يُرحّل أبدًا** ودوّر محتواه.

### بعد التدوير
- [ ] تأكّد أن `git ls-files` لا يُظهر أي `.env` / `.codex` / `settings.json`.
- [ ] دقّق سجلّ git على تسريبات قديمة (`git log -p -S 'eyJ'`)، ونظّفها بـ
      `git filter-repo` إن وُجدت، ثم أعد تدوير كل ما ظهر.

---

## ضوابط دائمة (Standing controls)
- الأسرار الحسّاسة في `.env` (محلّي) و**Supabase/Vercel secrets** (إنتاج) — لا في الكود.
- `service_role` لا يُستخدم في الواجهة الأمامية إطلاقًا.
- الملفات الحسّاسة محجوبة عبر [.gitignore](.gitignore): `.env*`، `.codex`، `.claude/settings*.json`.
- أمان اللعب (إخفاء الأدوار) — انظر ROADMAP P0#1.
