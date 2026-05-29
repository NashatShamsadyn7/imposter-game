# 🎮 IMPOSTOR — Full Game Script & Rules (English Master)

> This is the **master English script**. Translate each line into Kurdish Sorani,
> add your notes, and send it back. Anything marked **[NOTE?]** is a question for you.
> Section 9 lists every on-screen text string so you can translate them one by one.

---

## 1. OVERVIEW

**Impostor** is a social-deduction party game. Most players are **Crewmates** who all
share one **secret word**. A few players are secretly **Impostors** who do NOT know the
word. Through discussion and clues, the Crewmates try to expose the Impostors, while the
Impostors try to blend in and survive.

- Players: **3 – 40**
- Language: **Kurdish Sorani** (RTL)
- Two ways to play: **Local Mode** and **Online Mode**

---

## 2. THE TWO MODES

### A) LOCAL MODE (Pass-and-Play, one device, offline)
- Everyone uses **one phone/computer** and passes it around.
- No login or internet needed (images need internet, but the game still works without them).
- Players are added manually by name on the device.
- Roles are revealed by passing the device; voting is done secretly by passing the device.

### B) ONLINE MODE (Realtime, each player on their own device)
- Each player logs in with **Google** and uses **their own device**.
- One player **creates a room** and shares a **5-letter code**; others **join** with it.
- Includes **realtime chat**, synced timer, profile pictures, and a **points leaderboard**.

**[NOTE?]** On the first screen the player chooses: **Play Locally** or **Play Online**.

---

## 3. ROLES & GOAL

| Role | Kurdish | Knows the word? | Goal |
|------|---------|-----------------|------|
| Crewmate | دەستەی کەشتی | ✅ Yes | Find and vote out all Impostors |
| Impostor | ساختەکار | ❌ No | Survive without being voted out |

- The **Impostor does NOT know the word and does NOT know the category.**
- The **Impostor only sees the names/faces of the other Impostors** (their teammates).
  Example: with 3 Impostors, each Impostor sees the other 2 Impostors' names.

---

## 4. SETTINGS (chosen before the game)

| Setting | Range / Options | Default |
|---------|-----------------|---------|
| Number of players | 3 – 40 | — |
| Player names & order | add / edit / delete / reorder (who speaks first) | — |
| Category | 11 categories (see §8) | کوردەواری |
| Number of Impostors | 1 up to (players − 1)/2 | 1 |
| Discussion time | 30s – 5min | 1 min (local) / 2 min (online) |
| Points multiplier | ×1, ×2, ×3 | ×1 |

**[NOTE?]** In **Local Mode**, names are added on the device. In **Online Mode**, names come
from each player's Google account.

---

## 5. GAME FLOW (step by step)

1. **Lobby** — set players, category, number of Impostors, time, multiplier. Start the game.
2. **Role Reveal (the Card)** — each player privately views their card:
   - **Crewmate:** sees the **secret word**, its **picture**, and a short description.
     After **10 seconds the card automatically hides** (so no one else sees it).
   - **Impostor:** sees "**You don't know the word!**" and the **names of fellow Impostors**.
     (The Impostor card does not auto-hide.)
3. **Discussion** — a timer runs (default 2 min online / 1 min local). During this time:
   - Players take turns (in the chosen order, or randomly) to give **one clue**.
   - A clue is a **single word, fewer than 20 letters**, that hints at the secret word
     **without saying it directly**.
   - **Online Mode also has a realtime chat** on the side (right on desktop, full width on mobile).
4. **Voting** — secret voting:
   - Each player selects **N suspects** (N = number of Impostors).
   - **Local Mode:** pass the device; each player votes privately, then passes on.
   - **Online Mode:** everyone votes at the same time on their own device.
5. **Ejection** — the **N players with the most votes are removed** (N = number of Impostors),
   even if one of them turns out to be a Crewmate.
6. **Results** — reveal everyone's role, show the secret word + picture, award points,
   show who won, and update the leaderboard. Then **Play Again**.

---

## 6. DETAILED RULES

### 6.1 The Card (Reveal)
- Tap the card to flip it.
- Crewmate card shows: category + secret word + AI picture + short hint, then **hides after 10s**.
- Impostor card shows: "تۆ وشەکە نازانیت!" + teammate Impostors' names.

### 6.2 Clues (Discussion)
- Going in order, each player says/types **one word (< 20 letters)** describing the secret word.
- Crewmates try to prove they know the word without revealing it.
- Impostors try to guess the word from others' clues and fake a believable clue.

### 6.3 Voting (multi-select)
- Each player picks exactly **N** suspects (N = number of Impostors).
- A player **cannot vote for themselves**.
- **[NOTE?]** Should "skip / no vote" be allowed in addition? (Currently: must pick N.)

### 6.4 Ejection (top-N)
- Count all votes. The **N most-voted players are ejected together** in one round.
- Ties: **[NOTE?]** if there's a tie for the last ejection slot, how to break it?
  (Currently: pick by vote order / earliest.)

### 6.5 Scoring
**Crewmate points** = number of REAL Impostors among their N picks (minimum **1**):
- 3 correct → 3 pts · 2 correct → 2 pts · 1 correct → 1 pt · 0 correct → 1 pt

**Impostor points** (if NOT ejected / survived):
- 0 votes received → **3 pts**
- 1–2 votes received → **2 pts**
- more votes but survived → **1 pt**
- ejected → **0 pts**

All points are multiplied by the **multiplier** (×1 / ×2 / ×3).

### 6.6 Win Condition
- **Crewmates win** if ALL Impostors are ejected.
- **Impostors win** if at least one Impostor survives.
- (Individual points are still awarded to everyone either way.)

**[NOTE?]** Is the game **one single vote** (then end), or **multiple rounds** until one side wins?
Current build = one vote then results. Tell me which you prefer.

---

## 7. POINTS, PROFILE & LEADERBOARD (Online only)
- Each player has a profile (Google name + picture) and a **total points** score.
- After every game, points are added to the profile.
- The **Home screen shows a leaderboard** (top players by total points).

---

## 8. WORD CATEGORIES (11)
1. کوردەواری (Kurdish Culture)
2. شوێنەکان (Places)
3. جلوبەرگ (Clothes)
4. وەرزش (Sports)
5. خواردن (Food)
6. وڵاتان (Countries)
7. ئاژەڵان (Animals)
8. پیشەکان (Professions)
9. میوەکان (Fruits)
10. بیرۆکەکان (Abstract)
11. ئامێر و شتومەک (Objects)

Each word has an English translation used to generate a clean, no-text AI picture.
**[NOTE?]** Do you want to add more categories or more words per category? (Currently ~10 each.)

---

## 9. ALL ON-SCREEN TEXT (translate these)

> Format: `EN` → `KU (current)`. Fix/improve the Kurdish where needed.

### Login
- `Impostor` → `ساختەکار`
- `Online party game with your friends` → `یاری گرووپیی فەزایی — ئۆنلاین لەگەڵ هاوڕێکانت`
- `Sign in with Google` → `چوونەژوورەوە بە Google`
- `Login is required to save your profile and points.` → `بۆ یاریکردن پێویستە بچیتە ژوورەوە…`

### Mode select **[NEW — needs Kurdish]**
- `Play Online` → **[?]**
- `Play Locally (one device)` → **[?]**

### Home
- `Create new room` → `دروستکردنی ژووری نوێ`
- `Join with code` → `بەشداربوون بە کۆد`
- `Room code` → `کۆدی ژوور`
- `Join` → `بەشداری`
- `Champions / Leaderboard` → `پاڵەوانان`
- `points` → `خاڵ`

### Room Lobby
- `Players` → `یاریزانان`
- `Code` → `کۆد`
- `Leave` → `دەرچوون`
- `Word category` → `هاوپۆلی وشە`
- `Number of impostors` → `ژمارەی ساختەکار`
- `Discussion time` → `کاتی گفتوگۆ`
- `Points multiplier` → `قەبارەی خاڵ`
- `Start game` → `دەستپێکردنی یاری`
- `Waiting for the host to start…` → `چاوەڕێی خانەخوێ بکە بۆ دەستپێکردن…`
- `At least 3 players are required` → `پێویستە بەلایەنی کەم ٣ یاریزان هەبن`

### Role Reveal
- `Your card is ready` → `کارتەکەت ئامادەیە`
- `Tap to see your role` → `کلیک بکە بۆ بینینی ڕۆڵەکەت`
- `See role` → `بینینی ڕۆڵ`
- `Impostor` → `ساختەکار`
- `You don't know the word!` → `تۆ وشەکە نازانیت!`
- `Your fellow impostors` → `هاوەڵە ساختەکارەکانت`
- `You are the only impostor. Good luck!` → `تۆ تاکە ساختەکاریت. بەختت یارت بێت!`
- `Crewmate` → `دەستەی کەشتی`
- `Category` → `هاوپۆل`
- `Hides in {n} seconds` → `دەشاردرێتەوە لە {n} چرکە`
- `Start discussion` → `دەستپێکردنی گفتوگۆ`

### Discussion
- `Discussion time` → `کاتی گفتوگۆ`
- `It's your turn! Describe in one word (under 20 letters) — without saying it directly.`
  → `نۆرەی تۆیە! بە یەک وشە (کەمتر لە ٢٠ پیت) وەسفی بکە — بەبێ ئەوەی ڕاستەوخۆ بیڵێیت.`
- `Speaking order` → `ڕیزی وەسفکردن`
- `Next turn` → `نۆرەی دواتر`
- `Go to voting` → `چوون بەرەو قۆناغی دەنگدان`
- `Your role` → `ڕۆڵی تۆ`
- `Type a message…` → `نامەیەک بنووسە…`

### Voting
- `Secret voting` → `دەنگدانی نهێنی`
- `Pick {n} players you suspect` → `{n} کەس هەڵبژێرە کە گومانیان لێ دەکەیت`
- `Confirm vote` → `پشتڕاستکردنەوەی دەنگ`
- `Your vote is recorded` → `دەنگەکەت تۆمارکرا`
- `Waiting for other players…` → `چاوەڕێی یاریزانانی تر بکە…`
- `{x} / {y} have voted` → `{x} / {y} دەنگیان دا`
- `End voting now` → `کۆتاییهێنان بە دەنگدان ئێستا`

### Results
- `Impostors win!` → `ساختەکارەکان سەرکەوتن!`
- `Crewmates win!` → `دەستەی کەشتی سەرکەوتن!`
- `The secret word was` → `وشەی نهێنی بوو`
- `Results & points` → `ئەنجام و خاڵەکان`
- `ejected` → `دەرکرا`
- `Play again` → `یاری دووبارە`
- `Leave room` → `دەرچوون لە ژوور`

### Rules popup
- `How to play` → `چۆنیەتی یاری کردن`
- (5 rule cards — translate the text in §5/§6)

---

## 10. OPEN QUESTIONS FOR YOU (please answer)
1. One single vote, or multiple rounds until a side wins?
2. Allow "skip / no vote" during voting?
3. How to break ties on the last ejection slot?
4. Add more categories / more words per category?
5. Local Mode: should it also have points/leaderboard, or only Online?
6. Anything in the Kurdish text you want reworded?

---
*Send this back with your Kurdish translation and notes, and I'll apply everything + build Local Mode.*
