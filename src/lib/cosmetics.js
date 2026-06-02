// ═══════════════════════════════════════════════════════════
//  کۆمەتیک — کاتالۆگی شتومەکی جوانکاری بۆ دوکان
//  چوار جۆر: چوارچێوەی ئەڤاتار · ڕەنگی ناو · ناونیشان · شێوەی سندووق
//  هەر یەکێک نرخێکی هەیە بە دراو (coins). کڕین + بەرکردن (equip) لە
//  EconomyContext بەڕێوەدەبرێت و لە localStorage پاشەکەوت دەکرێت.
// ═══════════════════════════════════════════════════════════

// جۆرەکان
export const COSMETIC_TYPES = ['frame', 'nameColor', 'title', 'chestSkin']

// نرخی نموونەیی بەپێی دەگمەنی
// common 60 · rare 120 · epic 220 · legendary 380

// ───── چوارچێوەکانی ئەڤاتار ─────
// هاوشێوەی levelFrame: { ring: 'from-… to-…', glow: 'shadow-[…]' }
export const FRAMES = [
  { id: 'frame_ocean',   type: 'frame', name: 'دەریا',      price: 80,  ring: 'from-cyan-400 to-blue-600',          glow: '' },
  { id: 'frame_sunset',  type: 'frame', name: 'ئاوابوون',    price: 80,  ring: 'from-orange-400 to-pink-600',        glow: '' },
  { id: 'frame_emerald', type: 'frame', name: 'زمروود',      price: 120, ring: 'from-emerald-400 to-teal-600',       glow: 'shadow-[0_0_14px_rgba(16,185,129,0.5)]' },
  { id: 'frame_royal',   type: 'frame', name: 'شاهانە',      price: 220, ring: 'from-purple-500 to-fuchsia-600',     glow: 'shadow-[0_0_16px_rgba(168,85,247,0.55)]' },
  { id: 'frame_gold',    type: 'frame', name: 'زێڕین',       price: 220, ring: 'from-amber-300 to-yellow-600',       glow: 'shadow-[0_0_16px_rgba(251,191,36,0.55)]' },
  { id: 'frame_neon',    type: 'frame', name: 'نیۆن',        price: 120, ring: 'from-lime-400 to-green-500',         glow: 'shadow-[0_0_14px_rgba(132,204,22,0.5)]' },
  { id: 'frame_rainbow', type: 'frame', name: 'پەلکەزێڕینە', price: 380, ring: 'from-fuchsia-500 via-amber-400 to-crew', glow: 'shadow-[0_0_20px_rgba(217,70,239,0.6)]' },
]

// ───── ڕەنگی ناو ─────
// className بۆ سپانی ناو دادەنرێت. gradient → bg-clip-text
export const NAME_COLORS = [
  { id: 'color_amber',    type: 'nameColor', name: 'کارەبایی',  price: 60,  className: 'text-amber-500' },
  { id: 'color_sky',      type: 'nameColor', name: 'ئاسمانی',   price: 60,  className: 'text-sky-500' },
  { id: 'color_rose',     type: 'nameColor', name: 'گوڵی',      price: 60,  className: 'text-rose-500' },
  { id: 'color_violet',   type: 'nameColor', name: 'مۆر',       price: 60,  className: 'text-violet-500' },
  { id: 'color_emerald',  type: 'nameColor', name: 'سەوز',      price: 60,  className: 'text-emerald-500' },
  { id: 'color_gradient', type: 'nameColor', name: 'ڕەنگاوڕەنگ', price: 200, className: 'bg-gradient-to-r from-fuchsia-500 via-amber-400 to-crew bg-clip-text text-transparent' },
]

// ───── ناونیشانەکان (لەژێر ناو پیشان دەدرێن) ─────
export const TITLES = [
  { id: 'title_detective', type: 'title', name: 'لێکۆڵەر',  price: 100, text: 'لێکۆڵەر' },
  { id: 'title_trickster', type: 'title', name: 'فێڵباز',   price: 100, text: 'فێڵباز' },
  { id: 'title_shadow',    type: 'title', name: 'سێبەر',    price: 150, text: 'سێبەر' },
  { id: 'title_master',    type: 'title', name: 'مامۆستا',  price: 150, text: 'مامۆستا' },
  { id: 'title_king',      type: 'title', name: 'پاشا',     price: 300, text: 'پاشا' },
  { id: 'title_legend',    type: 'title', name: 'ئەفسانە',  price: 380, text: 'ئەفسانە' },
]

// ───── شێوەی سندووقی خەڵات ─────
// ring + iconColor بۆ ڕووکاری سندووقەکە لە MysteryReward
export const CHEST_SKINS = [
  { id: 'skin_ruby',    type: 'chestSkin', name: 'یاقووت', price: 120, ring: 'border-rose-400/60 from-rose-400/25 to-rose-600/10',   iconColor: 'text-rose-400',  glow: 'shadow-[0_0_28px_rgba(251,113,133,0.4)]' },
  { id: 'skin_emerald', type: 'chestSkin', name: 'زمروود', price: 120, ring: 'border-emerald-400/60 from-emerald-400/25 to-emerald-600/10', iconColor: 'text-emerald-400', glow: 'shadow-[0_0_28px_rgba(16,185,129,0.4)]' },
  { id: 'skin_void',    type: 'chestSkin', name: 'تاریکی', price: 220, ring: 'border-violet-400/60 from-violet-500/25 to-fuchsia-700/10', iconColor: 'text-violet-300', glow: 'shadow-[0_0_28px_rgba(167,139,250,0.45)]' },
]

export const CATALOG = [...FRAMES, ...NAME_COLORS, ...TITLES, ...CHEST_SKINS]

const BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]))
export function getCosmetic(id) {
  return id ? BY_ID[id] || null : null
}

// چوارچێوەی بەرکراو → { ring, glow } یان null
export function equippedFrameStyle(equipped) {
  return getCosmetic(equipped?.frame) || null
}

// className ـی ڕەنگی ناو → string یان null
export function equippedNameColor(equipped) {
  const c = getCosmetic(equipped?.nameColor)
  return c?.className || null
}

// دەقی ناونیشان → string یان null
export function equippedTitle(equipped) {
  const c = getCosmetic(equipped?.title)
  return c?.text || null
}

// شێوەی سندووق → کۆمەتیک یان null
export function equippedChestSkin(equipped) {
  return getCosmetic(equipped?.chestSkin) || null
}
