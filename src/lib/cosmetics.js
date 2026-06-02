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
// anim: کلاسی ئەنیمەیشن چوارچێوە (cos-shimmer | cos-pulse | cos-spin)
// fx: کاریگەری بزواوی دەوری ئەڤاتار (fire|ice|electric|stars|bubbles|hearts|leaves)
export const FRAMES = [
  { id: 'frame_ocean',   type: 'frame', name: 'دەریا',      price: 80,  ring: 'from-cyan-400 to-blue-600',          glow: '',                                          anim: 'cos-shimmer' },
  { id: 'frame_sunset',  type: 'frame', name: 'ئاوابوون',    price: 80,  ring: 'from-orange-400 to-pink-600',        glow: '',                                          anim: 'cos-shimmer' },
  { id: 'frame_emerald', type: 'frame', name: 'زمروود',      price: 120, ring: 'from-emerald-400 to-teal-600',       glow: 'shadow-[0_0_14px_rgba(16,185,129,0.5)]',    anim: 'cos-shimmer' },
  { id: 'frame_royal',   type: 'frame', name: 'شاهانە',      price: 220, ring: 'from-purple-500 to-fuchsia-600',     glow: 'shadow-[0_0_16px_rgba(168,85,247,0.55)]',   anim: 'cos-shimmer cos-pulse' },
  { id: 'frame_gold',    type: 'frame', name: 'زێڕین',       price: 220, ring: 'from-amber-300 to-yellow-600',       glow: 'shadow-[0_0_16px_rgba(251,191,36,0.55)]',   anim: 'cos-shimmer cos-pulse' },
  { id: 'frame_neon',    type: 'frame', name: 'نیۆن',        price: 120, ring: 'from-lime-400 to-green-500',         glow: 'shadow-[0_0_14px_rgba(132,204,22,0.5)]',    anim: 'cos-shimmer' },
  { id: 'frame_rainbow', type: 'frame', name: 'پەلکەزێڕینە', price: 380, ring: 'from-fuchsia-500 via-amber-400 to-crew', glow: 'shadow-[0_0_20px_rgba(217,70,239,0.6)]', anim: 'cos-spin', fx: 'stars' },
  { id: 'frame_blossom', type: 'frame', name: 'گوڵ',         price: 80,  ring: 'from-pink-400 to-rose-500',           glow: '',                                         anim: 'cos-shimmer', fx: 'hearts' },
  { id: 'frame_fire',    type: 'frame', name: 'ئاگر',        price: 120, ring: 'from-amber-400 via-orange-500 to-red-600', glow: 'shadow-[0_0_16px_rgba(249,115,22,0.55)]', anim: 'cos-shimmer cos-pulse', fx: 'fire' },
  { id: 'frame_ice',     type: 'frame', name: 'بەستەڵەک',    price: 120, ring: 'from-sky-200 via-cyan-300 to-blue-400', glow: 'shadow-[0_0_14px_rgba(125,211,252,0.55)]', anim: 'cos-shimmer', fx: 'ice' },
  { id: 'frame_toxic',   type: 'frame', name: 'ژەهراوی',     price: 120, ring: 'from-lime-300 to-green-600',          glow: 'shadow-[0_0_16px_rgba(163,230,53,0.55)]', anim: 'cos-shimmer cos-pulse', fx: 'bubbles' },
  { id: 'frame_galaxy',  type: 'frame', name: 'گەلەکسی',     price: 220, ring: 'from-indigo-500 via-purple-600 to-fuchsia-700', glow: 'shadow-[0_0_18px_rgba(129,140,248,0.6)]', anim: 'cos-shimmer cos-pulse', fx: 'stars' },
  { id: 'frame_obsidian',type: 'frame', name: 'ئۆبسیدیان',   price: 380, ring: 'from-slate-700 via-zinc-800 to-black', glow: 'shadow-[0_0_20px_rgba(100,116,139,0.6)]', anim: 'cos-spin' },
  { id: 'frame_aurora',  type: 'frame', name: 'شەفەق',       price: 380, ring: 'from-teal-300 via-emerald-400 to-violet-500', glow: 'shadow-[0_0_22px_rgba(45,212,191,0.6)]', anim: 'cos-spin', fx: 'stars' },
  // ───── چوارچێوەی کاریگەری تایبەت (effect frames) ─────
  { id: 'frame_storm',   type: 'frame', name: 'بروسکە',      price: 220, ring: 'from-sky-300 via-indigo-400 to-violet-600', glow: 'shadow-[0_0_18px_rgba(99,102,241,0.6)]', anim: 'cos-shimmer cos-pulse', fx: 'electric' },
  { id: 'frame_phoenix', type: 'frame', name: 'سیمورغ',      price: 380, ring: 'from-yellow-300 via-orange-500 to-red-600', glow: 'shadow-[0_0_22px_rgba(249,115,22,0.65)]', anim: 'cos-shimmer cos-pulse', fx: 'fire' },
  { id: 'frame_forest',  type: 'frame', name: 'دارستان',     price: 120, ring: 'from-green-400 to-emerald-700',      glow: 'shadow-[0_0_14px_rgba(34,197,94,0.5)]',    anim: 'cos-shimmer', fx: 'leaves' },
]

// ───── ڕەنگی ناو ─────
// className بۆ سپانی ناو دادەنرێت. gradient → bg-clip-text
export const NAME_COLORS = [
  { id: 'color_amber',    type: 'nameColor', name: 'کارەبایی',  price: 60,  className: 'text-amber-500' },
  { id: 'color_sky',      type: 'nameColor', name: 'ئاسمانی',   price: 60,  className: 'text-sky-500' },
  { id: 'color_rose',     type: 'nameColor', name: 'گوڵی',      price: 60,  className: 'text-rose-500' },
  { id: 'color_violet',   type: 'nameColor', name: 'مۆر',       price: 60,  className: 'text-violet-500' },
  { id: 'color_emerald',  type: 'nameColor', name: 'سەوز',      price: 60,  className: 'text-emerald-500' },
  { id: 'color_crimson',  type: 'nameColor', name: 'سووری تۆخ', price: 60,  className: 'text-red-600' },
  { id: 'color_teal',     type: 'nameColor', name: 'شینەسەوز', price: 60,  className: 'text-teal-500' },
  { id: 'color_lime',     type: 'nameColor', name: 'لیمۆیی',   price: 60,  className: 'text-lime-500' },
  { id: 'color_gradient', type: 'nameColor', name: 'ڕەنگاوڕەنگ', price: 200, className: 'cos-shimmer bg-gradient-to-r from-fuchsia-500 via-amber-400 to-crew bg-clip-text text-transparent' },
  { id: 'color_fire',     type: 'nameColor', name: 'گڕی ئاگر', price: 200, className: 'cos-shimmer bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent' },
  { id: 'color_gold2',    type: 'nameColor', name: 'زێڕی شاهانە', price: 200, className: 'cos-shimmer bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent' },
]

// ───── ناونیشانەکان (لەژێر ناو پیشان دەدرێن) ─────
export const TITLES = [
  { id: 'title_detective', type: 'title', name: 'لێکۆڵەر',  price: 100, text: 'لێکۆڵەر' },
  { id: 'title_trickster', type: 'title', name: 'فێڵباز',   price: 100, text: 'فێڵباز' },
  { id: 'title_shadow',    type: 'title', name: 'سێبەر',    price: 150, text: 'سێبەر' },
  { id: 'title_master',    type: 'title', name: 'مامۆستا',  price: 150, text: 'مامۆستا' },
  { id: 'title_king',      type: 'title', name: 'پاشا',     price: 300, text: 'پاشا' },
  { id: 'title_legend',    type: 'title', name: 'ئەفسانە',  price: 380, text: 'ئەفسانە' },
  { id: 'title_rookie',    type: 'title', name: 'تازەکار',  price: 100, text: 'تازەکار' },
  { id: 'title_phantom',   type: 'title', name: 'تارمایی',  price: 150, text: 'تارمایی' },
  { id: 'title_hunter',    type: 'title', name: 'ڕاوچی',    price: 150, text: 'ڕاوچی' },
  { id: 'title_mastermind',type: 'title', name: 'مێشکی پیلان', price: 300, text: 'مێشکی پیلان' },
  { id: 'title_champion',  type: 'title', name: 'پاڵەوان',  price: 300, text: 'پاڵەوان' },
  { id: 'title_immortal',  type: 'title', name: 'نەمر',     price: 380, text: 'نەمر' },
]

// ───── شێوەی سندووقی خەڵات ─────
// ring + iconColor بۆ ڕووکاری سندووقەکە لە MysteryReward
export const CHEST_SKINS = [
  { id: 'skin_ruby',    type: 'chestSkin', name: 'یاقووت', price: 120, ring: 'border-rose-400/60 from-rose-400/25 to-rose-600/10',   iconColor: 'text-rose-400',  glow: 'shadow-[0_0_28px_rgba(251,113,133,0.4)]' },
  { id: 'skin_emerald', type: 'chestSkin', name: 'زمروود', price: 120, ring: 'border-emerald-400/60 from-emerald-400/25 to-emerald-600/10', iconColor: 'text-emerald-400', glow: 'shadow-[0_0_28px_rgba(16,185,129,0.4)]' },
  { id: 'skin_void',    type: 'chestSkin', name: 'تاریکی', price: 220, ring: 'border-violet-400/60 from-violet-500/25 to-fuchsia-700/10', iconColor: 'text-violet-300', glow: 'shadow-[0_0_28px_rgba(167,139,250,0.45)]' },
  { id: 'skin_crystal', type: 'chestSkin', name: 'بلور',   price: 120, ring: 'border-sky-300/60 from-sky-300/25 to-cyan-500/10',     iconColor: 'text-sky-300',   glow: 'shadow-[0_0_28px_rgba(125,211,252,0.4)]' },
  { id: 'skin_inferno', type: 'chestSkin', name: 'دۆزەخ',  price: 220, ring: 'border-orange-400/60 from-orange-400/25 to-red-600/10', iconColor: 'text-orange-400', glow: 'shadow-[0_0_28px_rgba(249,115,22,0.45)]' },
  { id: 'skin_gold',    type: 'chestSkin', name: 'زێڕین',  price: 380, ring: 'border-amber-300/60 from-amber-300/30 to-yellow-600/10', iconColor: 'text-amber-300', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.5)]' },
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
