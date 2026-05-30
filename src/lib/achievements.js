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

// ───── ناونیشانی ئاست ─────
export function levelTitle(level) {
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
]

// ───── ژماردنی دەستکەوتە کراوەکان ─────
export function unlockedCount(stats) {
  const s = stats || {}
  return ACHIEVEMENTS.filter((a) => a.check(s)).length
}
