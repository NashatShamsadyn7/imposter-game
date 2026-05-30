// ═══════════════════════════════════════════════════════════
//  ئاست/XP و دەستکەوتەکان — هەمووی لە ئامارەکانی پرۆفایل دەردەهێنرێن
//  (total_points, games_played, wins) — بەبێ پێویستی بە گۆڕینی بنکەی دراوە
// ═══════════════════════════════════════════════════════════

import {
  Sparkles,
  Trophy,
  Crown,
  Star,
  Flame,
  Shield,
  Swords,
  Medal,
  Gem,
  Rocket,
  Target,
  Award,
} from 'lucide-react'

// ───── ئاست و XP لە کۆی خاڵەکانەوە ─────
// هەر ئاستێک ٣٥٪ خاڵی زیاتری پێویستە لەوەی پێشوو
export function levelInfo(points = 0) {
  const p = Math.max(0, points || 0)
  let level = 1
  let needed = 100 // خاڵی پێویست بۆ ئاستی دواتر
  let floor = 0 // کۆی خاڵی پێویست بۆ گەیشتن بەم ئاستە
  while (p >= floor + needed) {
    floor += needed
    level += 1
    needed = Math.round(needed * 1.35)
  }
  const intoLevel = p - floor
  return {
    level,
    intoLevel, // خاڵ لەناو ئاستی ئێستادا
    needed, // خاڵی پێویست بۆ تەواوکردنی ئاستی ئێستا
    progress: needed ? Math.min(1, intoLevel / needed) : 1,
  }
}

// ───── ڕێژەی سەرکەوتن ─────
export function winRate(stats) {
  const g = stats?.games_played || 0
  return g ? (stats.wins || 0) / g : 0
}

// ───── چوارچێوەی ئەڤاتار بەپێی ئاست ─────
// تیشکێکی ڕەنگاوڕەنگ کە بەپێی ئاست گەشاوەتر دەبێت — پاداشتی بینراو
// دەگەڕێنێتەوە: { ring, glow } بە پۆلە CSSـەکانی Tailwind، یان null بۆ ئاستە سەرەتاییەکان
export function levelFrame(level = 1) {
  if (level >= 25) return { ring: 'from-fuchsia-500 via-amber-400 to-crew', glow: 'shadow-[0_0_18px_rgba(217,70,239,0.55)]' }
  if (level >= 20) return { ring: 'from-purple-500 to-fuchsia-500', glow: 'shadow-[0_0_16px_rgba(168,85,247,0.5)]' }
  if (level >= 15) return { ring: 'from-emerald-400 to-teal-500', glow: 'shadow-[0_0_14px_rgba(16,185,129,0.5)]' }
  if (level >= 10) return { ring: 'from-amber-400 to-yellow-500', glow: 'shadow-[0_0_14px_rgba(251,191,36,0.5)]' }
  if (level >= 7) return { ring: 'from-slate-300 to-slate-500', glow: '' }
  if (level >= 4) return { ring: 'from-orange-400 to-amber-600', glow: '' }
  return null // ئاستی ١–٣: بێ چوارچێوەی تایبەت
}

// ───── ناونیشانی ئاست ─────
export function levelTitle(level) {
  if (level >= 25) return 'ئەسطوورە'
  if (level >= 20) return 'گەورەپیاو'
  if (level >= 15) return 'ئەفسانە'
  if (level >= 10) return 'پاڵەوان'
  if (level >= 7) return 'شارەزا'
  if (level >= 4) return 'یاریزانی باش'
  if (level >= 2) return 'تازەکار'
  return 'سەرەتا'
}

// ───── پێناسەی دەستکەوتەکان ─────
// هەر یەکێک: id, ناو, ڕوونکردنەوە, ئایکۆن, check(stats) => bool
export const ACHIEVEMENTS = [
  {
    id: 'first_game',
    name: 'یەکەم هەنگاو',
    desc: 'یەکەم یاریت کرد',
    icon: Rocket,
    check: (s) => (s.games_played || 0) >= 1,
  },
  {
    id: 'first_win',
    name: 'یەکەم سەرکەوتن',
    desc: 'یەکەم جار براوە بویت',
    icon: Trophy,
    check: (s) => (s.wins || 0) >= 1,
  },
  {
    id: 'veteran',
    name: 'ئەزموندار',
    desc: '١٠ یاری تەواوکرا',
    icon: Shield,
    check: (s) => (s.games_played || 0) >= 10,
  },
  {
    id: 'hardened',
    name: 'تۆڕەمەی یاری',
    desc: '٥٠ یاری تەواوکرا',
    icon: Swords,
    check: (s) => (s.games_played || 0) >= 50,
  },
  {
    id: 'winner_10',
    name: 'براوەی بەردەوام',
    desc: '١٠ سەرکەوتن',
    icon: Medal,
    check: (s) => (s.wins || 0) >= 10,
  },
  {
    id: 'champion',
    name: 'قارەمان',
    desc: '٢٥ سەرکەوتن',
    icon: Crown,
    check: (s) => (s.wins || 0) >= 25,
  },
  {
    id: 'points_100',
    name: 'کۆکەرەوەی خاڵ',
    desc: '١٠٠ خاڵ کۆکرایەوە',
    icon: Star,
    check: (s) => (s.total_points || 0) >= 100,
  },
  {
    id: 'points_500',
    name: 'گەنجینەدار',
    desc: '٥٠٠ خاڵ کۆکرایەوە',
    icon: Gem,
    check: (s) => (s.total_points || 0) >= 500,
  },
  {
    id: 'points_1000',
    name: 'ئەفسانەی خاڵ',
    desc: '١٠٠٠ خاڵ کۆکرایەوە',
    icon: Sparkles,
    check: (s) => (s.total_points || 0) >= 1000,
  },
  {
    id: 'level_5',
    name: 'بەرزبوونەوە',
    desc: 'گەیشتیت بە ئاستی ٥',
    icon: Flame,
    check: (s) => levelInfo(s.total_points).level >= 5,
  },
  {
    id: 'level_10',
    name: 'پلەی بەرز',
    desc: 'گەیشتیت بە ئاستی ١٠',
    icon: Award,
    check: (s) => levelInfo(s.total_points).level >= 10,
  },
  {
    id: 'sharpshooter',
    name: 'چاوتیژ',
    desc: 'ڕێژەی سەرکەوتن ٧٠٪ (لانیکەم ١٠ یاری)',
    icon: Target,
    check: (s) => (s.games_played || 0) >= 10 && winRate(s) >= 0.7,
  },
  {
    id: 'winner_50',
    name: 'نەبڕاوە',
    desc: '٥٠ سەرکەوتن',
    icon: Crown,
    check: (s) => (s.wins || 0) >= 50,
  },
  {
    id: 'points_2500',
    name: 'سامانداری خاڵ',
    desc: '٢٥٠٠ خاڵ کۆکرایەوە',
    icon: Gem,
    check: (s) => (s.total_points || 0) >= 2500,
  },
  {
    id: 'level_15',
    name: 'گەیشتن بە ئەفسانە',
    desc: 'گەیشتیت بە ئاستی ١٥',
    icon: Sparkles,
    check: (s) => levelInfo(s.total_points).level >= 15,
  },
  {
    id: 'level_25',
    name: 'ئەسطوورەی زیندوو',
    desc: 'گەیشتیت بە ئاستی ٢٥',
    icon: Flame,
    check: (s) => levelInfo(s.total_points).level >= 25,
  },
]

// ───── ژماردنی دەستکەوتە کراوەکان ─────
export function unlockedCount(stats) {
  const s = stats || {}
  return ACHIEVEMENTS.filter((a) => a.check(s)).length
}
