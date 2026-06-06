// ═══════════════════════════════════════════════════════════
//  کۆمەتیک — کاتالۆگی شتومەکی جوانکاری بۆ دوکان
//  چوار جۆر: چوارچێوەی ئەڤاتار · ڕەنگی ناو · ناونیشان · شێوەی سندووق
//  هەر یەکێک نرخێکی هەیە بە دراو (coins). کڕین + بەرکردن (equip) لە
//  EconomyContext بەڕێوەدەبرێت و لە localStorage پاشەکەوت دەکرێت.
// ═══════════════════════════════════════════════════════════

// جۆرەکان
export const COSMETIC_TYPES = ['avatar', 'frame', 'nameColor', 'title', 'chestSkin', 'background']

// نرخی نموونەیی بەپێی دەگمەنی
// common 60 · rare 120 · epic 220 · legendary 380

// ───── ئەڤاتاری کەسایەتی (avatar characters) ─────
// شوێنی وێنەی پرۆفایل دەگرنەوە: ئیمۆجی لەسەر پاشبنەی تدرّج.
// bg: کلاسی tailwind بۆ تدرّج · emoji: ڕووی کەسایەتییەکە.
export const AVATARS = [
  { id: 'av_phoenix',   type: 'avatar', name: 'سیمورغ',   price: 150, emoji: '🦅', bg: 'from-orange-500 via-red-500 to-amber-600' },
  { id: 'av_void',      type: 'avatar', name: 'تاریکی',   price: 150, emoji: '🌌', bg: 'from-indigo-600 via-purple-700 to-slate-900' },
  { id: 'av_ninja',     type: 'avatar', name: 'نینجا',    price: 150, emoji: '🥷', bg: 'from-slate-700 via-zinc-800 to-black' },
  { id: 'av_alien',     type: 'avatar', name: 'بیانی',    price: 150, emoji: '👽', bg: 'from-lime-400 via-green-500 to-emerald-700' },
  { id: 'av_robot',     type: 'avatar', name: 'ڕۆبۆت',    price: 150, emoji: '🤖', bg: 'from-sky-400 via-cyan-500 to-blue-700' },
  { id: 'av_ghost',     type: 'avatar', name: 'دروو',     price: 150, emoji: '👻', bg: 'from-slate-300 via-indigo-300 to-violet-400' },
  { id: 'av_skull',     type: 'avatar', name: 'کاسەسەر',  price: 220, emoji: '💀', bg: 'from-zinc-400 via-slate-600 to-zinc-900' },
  { id: 'av_dragon',    type: 'avatar', name: 'ئەژدیها',  price: 280, emoji: '🐉', bg: 'from-emerald-500 via-teal-600 to-cyan-700' },
  { id: 'av_crown',     type: 'avatar', name: 'پاشا',     price: 380, emoji: '🤴', bg: 'from-amber-300 via-yellow-500 to-amber-700' },
  { id: 'av_unicorn',   type: 'avatar', name: 'یەکشاخ',   price: 380, emoji: '🦄', bg: 'from-pink-400 via-fuchsia-500 to-violet-600' },
]

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
  // ───── چوارچێوەی نوێ ─────
  { id: 'frame_candy',   type: 'frame', name: 'شیرینی',      price: 80,  ring: 'from-pink-300 via-rose-300 to-red-400',     glow: '',                                         anim: 'cos-shimmer', fx: 'hearts' },
  { id: 'frame_lagoon',  type: 'frame', name: 'لاگوون',      price: 120, ring: 'from-cyan-300 via-teal-400 to-emerald-500', glow: 'shadow-[0_0_14px_rgba(45,212,191,0.5)]',   anim: 'cos-shimmer', fx: 'bubbles' },
  { id: 'frame_lava',    type: 'frame', name: 'لاڤا',        price: 220, ring: 'from-red-500 via-orange-600 to-amber-700',  glow: 'shadow-[0_0_18px_rgba(239,68,68,0.6)]',    anim: 'cos-shimmer cos-pulse', fx: 'fire' },
  { id: 'frame_glacier', type: 'frame', name: 'سەهۆڵ',       price: 220, ring: 'from-cyan-100 via-sky-300 to-indigo-400',  glow: 'shadow-[0_0_18px_rgba(125,211,252,0.6)]',  anim: 'cos-shimmer cos-pulse', fx: 'ice' },
  { id: 'frame_midnight',type: 'frame', name: 'نیوەشەو',     price: 220, ring: 'from-indigo-700 via-blue-900 to-slate-900', glow: 'shadow-[0_0_18px_rgba(67,56,202,0.6)]',    anim: 'cos-shimmer', fx: 'stars' },
  { id: 'frame_sakura',  type: 'frame', name: 'ساکورا',      price: 220, ring: 'from-pink-300 via-fuchsia-400 to-rose-500', glow: 'shadow-[0_0_18px_rgba(244,114,182,0.6)]',  anim: 'cos-spin', fx: 'hearts' },
  { id: 'frame_thunder', type: 'frame', name: 'هەورەترووسکە', price: 380, ring: 'from-yellow-300 via-amber-400 to-indigo-600', glow: 'shadow-[0_0_22px_rgba(250,204,21,0.65)]', anim: 'cos-spin', fx: 'electric' },
  { id: 'frame_cosmos',  type: 'frame', name: 'کۆزمۆس',      price: 380, ring: 'from-violet-600 via-fuchsia-600 to-cyan-500',  glow: 'shadow-[0_0_24px_rgba(168,85,247,0.65)]', anim: 'cos-spin', fx: 'stars' },
  { id: 'frame_diamond', type: 'frame', name: 'ئەڵماس',      price: 380, ring: 'from-sky-200 via-white to-cyan-200',         glow: 'shadow-[0_0_24px_rgba(186,230,253,0.7)]', anim: 'cos-shimmer cos-pulse', fx: 'stars' },
  { id: 'frame_venom',   type: 'frame', name: 'ژەهر',        price: 220, ring: 'from-emerald-400 via-lime-500 to-green-700',  glow: 'shadow-[0_0_18px_rgba(132,204,22,0.6)]',  anim: 'cos-shimmer cos-pulse', fx: 'bubbles' },
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
  // ───── ڕەنگی ناوی نوێ ─────
  { id: 'color_pink',     type: 'nameColor', name: 'پەمەیی',    price: 60,  className: 'text-pink-500' },
  { id: 'color_indigo',   type: 'nameColor', name: 'نیلی',      price: 60,  className: 'text-indigo-500' },
  { id: 'color_orange',   type: 'nameColor', name: 'پرتەقاڵی',  price: 60,  className: 'text-orange-500' },
  { id: 'color_cyan',     type: 'nameColor', name: 'مووسی',     price: 60,  className: 'text-cyan-500' },
  { id: 'color_ocean',    type: 'nameColor', name: 'دەریایی',   price: 200, className: 'cos-shimmer bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent' },
  { id: 'color_aurora',   type: 'nameColor', name: 'شەفەقی',    price: 200, className: 'cos-shimmer bg-gradient-to-r from-teal-300 via-emerald-400 to-violet-500 bg-clip-text text-transparent' },
  { id: 'color_candy',    type: 'nameColor', name: 'شیرینی',    price: 200, className: 'cos-shimmer bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent' },
  { id: 'color_galaxy',   type: 'nameColor', name: 'گەلەکسی',   price: 280, className: 'cos-shimmer bg-gradient-to-r from-indigo-400 via-purple-500 to-fuchsia-600 bg-clip-text text-transparent' },
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
  // ───── ناونیشانی نوێ ─────
  { id: 'title_spy',       type: 'title', name: 'سیخوڕ',    price: 100, text: 'سیخوڕ' },
  { id: 'title_ghost',     type: 'title', name: 'دروو',     price: 100, text: 'دروو' },
  { id: 'title_genius',    type: 'title', name: 'زیرەک',    price: 150, text: 'زیرەک' },
  { id: 'title_wolf',      type: 'title', name: 'گورگ',     price: 150, text: 'گورگ' },
  { id: 'title_warlord',   type: 'title', name: 'سەرکردە',  price: 300, text: 'سەرکردە' },
  { id: 'title_emperor',   type: 'title', name: 'ئیمپراتۆر', price: 380, text: 'ئیمپراتۆر' },
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
  // ───── شێوەی سندووقی نوێ ─────
  { id: 'skin_rose',    type: 'chestSkin', name: 'گوڵی',   price: 120, ring: 'border-pink-400/60 from-pink-400/25 to-fuchsia-600/10', iconColor: 'text-pink-400', glow: 'shadow-[0_0_28px_rgba(244,114,182,0.4)]' },
  { id: 'skin_ocean',   type: 'chestSkin', name: 'دەریا',  price: 120, ring: 'border-cyan-400/60 from-cyan-400/25 to-blue-600/10',   iconColor: 'text-cyan-400', glow: 'shadow-[0_0_28px_rgba(34,211,238,0.4)]' },
  { id: 'skin_toxic',   type: 'chestSkin', name: 'ژەهراوی', price: 220, ring: 'border-lime-400/60 from-lime-400/25 to-green-700/10',  iconColor: 'text-lime-400', glow: 'shadow-[0_0_28px_rgba(163,230,53,0.45)]' },
  { id: 'skin_galaxy',  type: 'chestSkin', name: 'گەلەکسی', price: 380, ring: 'border-violet-400/60 from-indigo-500/25 to-fuchsia-700/10', iconColor: 'text-violet-300', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]' },
  { id: 'skin_diamond', type: 'chestSkin', name: 'ئەڵماس', price: 380, ring: 'border-sky-200/60 from-sky-200/30 to-cyan-300/10',    iconColor: 'text-sky-200', glow: 'shadow-[0_0_30px_rgba(186,230,253,0.55)]' },
]

// ───── پاشبنەکان (backgrounds) — جوانکاری بە دراو ─────
// هەر پاشبنەیەک سێ بلۆبی ڕەنگاوڕەنگ دەگرێتەوە (asset نییە، هەمیشە کاردەکات).
// image (ئارەزوومەندانە): URL ـی وێنە — ئەگەر دانرا، لەسەر بلۆبەکان دادەنرێت.
// rarity: legendary/iconic بۆ توهجی تایبەت.
export const BACKGROUNDS = [
  { id: 'bg_aurora',  type: 'background', name: 'شەفەق',     price: 0,   free: true, blobs: ['#0e9c8e', '#be64f5', '#608cfa'] },
  { id: 'bg_sunset',  type: 'background', name: 'ئاوابوون',  price: 200, blobs: ['#f97316', '#ec4899', '#f43f5e'] },
  { id: 'bg_ocean',   type: 'background', name: 'دەریا',     price: 200, blobs: ['#0ea5e9', '#06b6d4', '#3b82f6'] },
  { id: 'bg_forest',  type: 'background', name: 'دارستان',   price: 200, blobs: ['#22c55e', '#10b981', '#84cc16'] },
  { id: 'bg_candy',   type: 'background', name: 'شیرینی',    price: 200, blobs: ['#ec4899', '#d946ef', '#a855f7'] },
  { id: 'bg_galaxy',  type: 'background', name: 'گەلەکسی',   price: 380, blobs: ['#6366f1', '#a855f7', '#d946ef'] },
  { id: 'bg_inferno', type: 'background', name: 'دۆزەخ',     price: 380, blobs: ['#ef4444', '#f97316', '#facc15'] },
  // ───── ئاستی iconic (بەرزترین) ─────
  { id: 'bg_diamond', type: 'background', name: 'ئەڵماس',    price: 500, blobs: ['#bae6fd', '#22d3ee', '#818cf8'] },
  { id: 'bg_royal',   type: 'background', name: 'شاهانە',    price: 500, blobs: ['#fbbf24', '#a855f7', '#f43f5e'] },
]

// ───── ثیمەکانی ڕووکار (purchasable themes) ─────
// id = بەهای data-theme . dark/light بەخۆڕایین (price 0).
// swatch: ڕەنگەکانی پێشبینین (tailwind classes).
export const THEMES = [
  { id: 'dark',   type: 'theme', name: 'تاریک',    price: 0,   swatch: ['bg-slate-900', 'bg-teal-400', 'bg-rose-400'], free: true },
  { id: 'light',  type: 'theme', name: 'ڕووناک',   price: 0,   swatch: ['bg-slate-100', 'bg-teal-500', 'bg-rose-500'], free: true },
  { id: 'galaxy', type: 'theme', name: 'گەلەکسی',  price: 300, swatch: ['bg-violet-900', 'bg-cyan-300', 'bg-pink-400'] },
  { id: 'sunset', type: 'theme', name: 'ئاوابوون', price: 300, swatch: ['bg-rose-900', 'bg-orange-400', 'bg-rose-500'] },
  { id: 'cyber',  type: 'theme', name: 'سایبەر',   price: 380, swatch: ['bg-slate-900', 'bg-cyan-300', 'bg-pink-500'] },
  { id: 'forest', type: 'theme', name: 'دارستان',  price: 300, swatch: ['bg-emerald-950', 'bg-emerald-400', 'bg-lime-400'] },
]

export const CATALOG = [
  ...AVATARS, ...FRAMES, ...NAME_COLORS, ...TITLES, ...CHEST_SKINS,
  ...BACKGROUNDS.filter((b) => !b.free),
  ...THEMES.filter((th) => !th.free),
]

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

// ئەڤاتاری کەسایەتی بەرکراو → کۆمەتیک یان null
export function equippedAvatar(equipped) {
  return getCosmetic(equipped?.avatar) || null
}

// پاشبنەی بەرکراو → کۆمەتیک (بنەڕەت ئەگەر هیچ نەبوو)
const DEFAULT_BG = BACKGROUNDS[0]
export function getBackground(id) {
  return BACKGROUNDS.find((b) => b.id === id) || DEFAULT_BG
}
export function equippedBackground(equipped) {
  return getBackground(equipped?.background)
}
