// ═══════════════════════════════════════════════════════════
// بانکى وشەی هەڵبژێردراو — وشەی ناسراو، ڕوون و خۆش بۆ یاری.
// هەر وشەیەک وێنەی AI ـی تایبەتی خۆی هەیە (لە خانەی en).
// ═══════════════════════════════════════════════════════════

const makeWords = (items) => items.map(([ku, ar, en, emoji]) => ({ ku, ar, en, emoji }))

const ALL_CATEGORIES = [
  {
    id: 'iraq_icons', name: 'عێراق و شوێنە ناسراوەکان', name_ar: 'العراق وأماكن مشهورة', icon: '🇮🇶',
    words: makeWords([
      ['بەغدا', 'بغداد', 'Baghdad Iraq city', '🏙️'], ['هەولێر', 'أربيل', 'Erbil citadel Kurdistan', '🏰'],
      ['سلێمانی', 'السليمانية', 'Sulaymaniyah Kurdistan city', '🏙️'], ['دهۆک', 'دهوك', 'Duhok Kurdistan city', '🏞️'],
      ['کەرکووک', 'كركوك', 'Kirkuk citadel Iraq', '🏰'], ['مووسڵ', 'الموصل', 'Mosul Iraq city', '🕌'],
      ['بەسرە', 'البصرة', 'Basra Iraq city', '🌴'], ['نەجەف', 'النجف', 'Najaf Iraq shrine', '🕌'],
      ['کەربەلا', 'كربلاء', 'Karbala Iraq shrine', '🕌'], ['زاخۆ', 'زاخو', 'Zakho Kurdistan Delal bridge', '🌉'],
      ['حەڵەبجە', 'حلبجة', 'Halabja Kurdistan mountains', '⛰️'], ['شەقڵاوە', 'شقلاوة', 'Shaqlawa Kurdistan mountains', '🏔️'],
      ['دەریاچەی دووکان', 'بحيرة دوكان', 'Dukan lake Kurdistan', '🏞️'], ['گالی عەلی بەگ', 'شلال كلي علي بك', 'Gali Ali Beg waterfall Kurdistan', '💦'],
      ['پێشانگەی هەولێر', 'قلعة أربيل', 'Erbil Citadel', '🏰'], ['شارستانی بابل', 'بابل', 'Babylon Iraq ancient ruins', '🏛️'],
      ['دجلە', 'نهر دجلة', 'Tigris river Iraq', '🌊'], ['فورات', 'نهر الفرات', 'Euphrates river Iraq', '🌊'],
      ['نەورۆز', 'نوروز', 'Nowruz Kurdistan celebration', '🌞'], ['ئاڵای کوردستان', 'علم كردستان', 'Kurdistan flag', '☀️'],
    ]),
  },
  {
    id: 'iraqi_food', name: 'خواردنی عێراقی', name_ar: 'أكلات عراقية', icon: '🍛',
    words: makeWords([
      ['دۆڵمە', 'دولمة', 'Iraqi dolma', '🥬'], ['بریانی', 'برياني عراقي', 'Iraqi biryani rice', '🍛'],
      ['کوبە', 'كبة', 'Iraqi kibbeh', '🧆'], ['مەسگوف', 'مسكوف', 'Iraqi masgouf grilled fish', '🐟'],
      ['تەشریب', 'تشريب', 'Iraqi tashreeb bread stew', '🍲'], ['قیمە', 'قيمة', 'Iraqi qeema stew', '🥘'],
      ['باقلا و دەنک', 'باقلاء ودهن حر', 'Iraqi fava beans breakfast', '🫛'], ['پاشا و فەسوولیا', 'باشا وفاصوليا', 'Iraqi bean stew', '🥣'],
      ['کەبابی عێراقی', 'كباب عراقي', 'Iraqi kebab', '🍢'], ['تەمەن', 'تمن عراقي', 'Iraqi rice', '🍚'],
      ['نان تەنوور', 'خبز التنور', 'Iraqi tandoor bread', '🫓'], ['سەمون', 'صمون عراقي', 'Iraqi samoon bread', '🥖'],
      ['کڵێچە', 'كليجة', 'Iraqi kleicha cookies', '🍪'], ['دەبڵە', 'دبل', 'Iraqi date cookies', '🥮'],
      ['باقلوا', 'بقلاوة', 'baklava dessert', '🍯'], ['کونافە', 'كنافة', 'kunafa dessert', '🍰'],
      ['چای عێراقی', 'شاي عراقي', 'Iraqi black tea glass', '🍵'], ['قەیمەر', 'قيمر', 'Iraqi qaymar cream', '🥛'],
      ['تُرشی', 'طرشي', 'Iraqi pickles', '🥒'], ['شەرابە', 'شربت', 'Iraqi rose sherbet drink', '🍹'],
    ]),
  },
  {
    id: 'daily_life', name: 'ژیانی ڕۆژانە', name_ar: 'الحياة اليومية', icon: '✨',
    words: makeWords([
      ['مۆبایل', 'هاتف', 'smartphone', '📱'], ['کلیل', 'مفتاح', 'house key', '🔑'],
      ['پارە', 'نقود', 'cash money', '💵'], ['بەڵگەنامە', 'جواز سفر', 'passport document', '🛂'],
      ['کاتژمێر', 'ساعة', 'wrist watch', '⌚'], ['عەینک', 'نظارات', 'eyeglasses', '👓'],
      ['جانتا', 'حقيبة', 'backpack bag', '🎒'], ['کتێب', 'كتاب', 'book', '📚'],
      ['قەڵەم', 'قلم', 'pen', '🖊️'], ['ئاوێنە', 'مرآة', 'mirror', '🪞'],
      ['دەرگا', 'باب', 'front door', '🚪'], ['پەنجەرە', 'نافذة', 'window', '🪟'],
      ['کورسێ', 'كرسي', 'chair', '🪑'], ['تەلەفزیۆن', 'تلفاز', 'television', '📺'],
      ['ساردکەرەوە', 'ثلاجة', 'refrigerator', '🧊'], ['کۆمپیوتەر', 'حاسوب', 'laptop computer', '💻'],
      ['شامپۆ', 'شامبو', 'shampoo bottle', '🧴'], ['خانوو', 'بيت', 'home house', '🏠'],
      ['ئەوتۆمبێل', 'سيارة', 'car', '🚗'], ['بازاڕ', 'سوق', 'market bazaar', '🛍️'],
    ]),
  },
  {
    id: 'football_sport', name: 'تۆپ و وەرزش', name_ar: 'كرة القدم والرياضة', icon: '⚽',
    words: makeWords([
      ['تۆپی پێ', 'كرة القدم', 'football soccer ball', '⚽'], ['مەسی', 'ميسي', 'Lionel Messi football', '🐐'],
      ['ڕۆناڵدۆ', 'رونالدو', 'Cristiano Ronaldo football', '⚽'], ['نەیمار', 'نيمار', 'Neymar football player', '⚽'],
      ['ڕیاڵ مەدرید', 'ريال مدريد', 'Real Madrid football club', '⚪'], ['بەرشەلۆنە', 'برشلونة', 'Barcelona football club', '🔵'],
      ['مانچستەر سیتی', 'مانشستر سيتي', 'Manchester City football club', '🔷'], ['لیڤەرپوول', 'ليفربول', 'Liverpool football club', '🔴'],
      ['جامی جیهان', 'كأس العالم', 'FIFA World Cup trophy', '🏆'], ['چامپیۆنزلیگ', 'دوري أبطال أوروبا', 'UEFA Champions League trophy', '🏆'],
      ['گەیم', 'مباراة', 'football match', '🎮'], ['یاریگا', 'ملعب', 'football stadium', '🏟️'],
      ['گۆڵ', 'هدف', 'football goal', '🥅'], ['یاریزان', 'لاعب', 'football player', '🏃'],
      ['تەنیس', 'تنس', 'tennis racket ball', '🎾'], ['باسکەتبۆڵ', 'كرة السلة', 'basketball', '🏀'],
      ['بۆکس', 'ملاكمة', 'boxing gloves', '🥊'], ['شەترەنج', 'شطرنج', 'chess board', '♟️'],
      ['گیمینگ', 'ألعاب فيديو', 'video game controller', '🎮'], ['تەنیشت', 'تمرين رياضي', 'gym workout', '🏋️'],
    ]),
  },
  {
    id: 'movies_music', name: 'فیلم و مۆسیقا', name_ar: 'الأفلام والموسيقى', icon: '🎬',
    words: makeWords([
      ['سینەما', 'سينما', 'cinema theater', '🎬'], ['فیلم', 'فيلم', 'movie film reel', '🎞️'],
      ['نێتفلیکس', 'نتفليكس', 'Netflix streaming', '📺'], ['سپایدەرمان', 'سبايدرمان', 'Spider-Man superhero', '🕷️'],
      ['باتمان', 'باتمان', 'Batman superhero', '🦇'], ['سوبرمان', 'سوبرمان', 'Superman superhero', '🦸'],
      ['هاری پۆتەر', 'هاري بوتر', 'Harry Potter wizard', '🪄'], ['تایتانیک', 'تايتانيك', 'Titanic ship movie', '🚢'],
      ['کارتۆن', 'رسوم متحركة', 'cartoon animation', '🎨'], ['سریاڵ', 'مسلسل', 'television series', '📺'],
      ['میکرۆفۆن', 'مايكروفون', 'microphone singer', '🎤'], ['گیتار', 'غيتار', 'acoustic guitar', '🎸'],
      ['پیانۆ', 'بيانو', 'piano', '🎹'], ['دۆهۆل', 'طبلة', 'drum', '🥁'],
      ['گۆرانی', 'أغنية', 'singing song', '🎵'], ['کۆنسێرت', 'حفلة موسيقية', 'music concert crowd', '🎶'],
      ['ساز', 'آلة موسيقية', 'musical instruments', '🎼'], ['هەڵپەڕکێ', 'دبكة كردية', 'Kurdish dance', '💃'],
      ['هونەرمەند', 'فنان', 'music artist singer', '🧑‍🎤'], ['کامێرا', 'كاميرا', 'movie camera', '📹'],
    ]),
  },
  {
    id: 'technology', name: 'تەکنەلۆژیا', name_ar: 'التكنولوجيا', icon: '🤖',
    words: makeWords([
      ['ئایفۆن', 'آيفون', 'iPhone smartphone', '📱'], ['ئاندڕۆید', 'أندرويد', 'Android smartphone', '🤖'],
      ['ئینستاگرام', 'إنستغرام', 'Instagram app', '📸'], ['تیکتۆک', 'تيك توك', 'TikTok app', '🎵'],
      ['یوتیوب', 'يوتيوب', 'YouTube app', '▶️'], ['واتساپ', 'واتساب', 'WhatsApp chat app', '💬'],
      ['سنەپچات', 'سناب شات', 'Snapchat app', '👻'], ['گووگڵ', 'غوغل', 'Google search', '🔎'],
      ['وایفای', 'واي فاي', 'wifi signal', '📶'], ['ئینتەرنێت', 'إنترنت', 'internet network', '🌐'],
      ['کۆمپیوتەر', 'حاسوب', 'desktop computer', '🖥️'], ['کیبۆرد', 'لوحة مفاتيح', 'computer keyboard', '⌨️'],
      ['ماوس', 'فأرة الحاسوب', 'computer mouse', '🖱️'], ['هێدفۆن', 'سماعات', 'headphones', '🎧'],
      ['سماڕت واتچ', 'ساعة ذكية', 'smart watch', '⌚'], ['درۆن', 'طائرة درون', 'camera drone', '🚁'],
      ['ڕۆبۆت', 'روبوت', 'friendly robot', '🤖'], ['AI', 'ذكاء اصطناعي', 'artificial intelligence', '🧠'],
      ['پلەیستەیشن', 'بلايستيشن', 'PlayStation game console', '🎮'], ['شاری زیرەک', 'مدينة ذكية', 'smart city technology', '🏙️'],
    ]),
  },
  {
    id: 'travel_world', name: 'گەشت و جیهان', name_ar: 'السفر والعالم', icon: '✈️',
    words: makeWords([
      ['فڕۆکە', 'طائرة', 'airplane', '✈️'], ['فڕۆکەخانە', 'مطار', 'airport', '🛫'],
      ['پاسپۆرت', 'جواز سفر', 'passport', '🛂'], ['هۆتێل', 'فندق', 'hotel', '🏨'],
      ['ساحل', 'شاطئ', 'beach', '🏖️'], ['دەریا', 'بحر', 'sea ocean', '🌊'],
      ['پاریس', 'باريس', 'Paris Eiffel Tower', '🗼'], ['دوبەی', 'دبي', 'Dubai Burj Khalifa', '🏙️'],
      ['ئیستانبوڵ', 'إسطنبول', 'Istanbul Turkey', '🕌'], ['مەککە', 'مكة', 'Mecca Kaaba', '🕋'],
      ['میسر', 'مصر', 'Egypt pyramids', '🏜️'], ['ژاپۆن', 'اليابان', 'Japan Mount Fuji', '🗻'],
      ['ئیتاڵیا', 'إيطاليا', 'Italy Colosseum Rome', '🏛️'], ['لەنډەن', 'لندن', 'London Big Ben', '🕰️'],
      ['نیویۆرک', 'نيويورك', 'New York city skyline', '🗽'], ['پێکەنی', 'بكين', 'Beijing China', '🏯'],
      ['پەیکەری ئازادی', 'تمثال الحرية', 'Statue of Liberty', '🗽'], ['بورجی ئایفڵ', 'برج إيفل', 'Eiffel Tower', '🗼'],
      ['دەشت', 'صحراء', 'desert dunes', '🏜️'], ['کێو', 'جبل', 'mountain peak', '⛰️'],
    ]),
  },
  {
    id: 'nature_animals', name: 'سروشت و ئاژەڵان', name_ar: 'الطبيعة والحيوانات', icon: '🌿',
    words: makeWords([
      ['شێر', 'أسد', 'lion', '🦁'], ['پشیلە', 'قطة', 'cat', '🐱'],
      ['سەگ', 'كلب', 'dog', '🐶'], ['ئەسپ', 'حصان', 'horse', '🐴'],
      ['فیل', 'فيل', 'elephant', '🐘'], ['بەبر', 'نمر', 'tiger', '🐯'],
      ['گورگ', 'ذئب', 'wolf', '🐺'], ['پاندا', 'باندا', 'panda', '🐼'],
      ['دۆلفین', 'دلفين', 'dolphin', '🐬'], ['نەهەنگ', 'حوت', 'whale', '🐳'],
      ['هەڵۆ', 'نسر', 'eagle', '🦅'], ['پەپوولە', 'فراشة', 'butterfly', '🦋'],
      ['دار', 'شجرة', 'tree', '🌳'], ['گوڵ', 'زهرة', 'flower', '🌸'],
      ['ڕۆژ', 'شمس', 'sun', '☀️'], ['مانگ', 'قمر', 'moon', '🌙'],
      ['ئەستێرە', 'نجمة', 'star', '⭐'], ['باران', 'مطر', 'rain', '🌧️'],
      ['بەفر', 'ثلج', 'snow', '❄️'], ['تاڤگە', 'شلال', 'waterfall', '💦'],
    ]),
  },
]

export const FEATURED_CATEGORY_IDS = ALL_CATEGORIES.map((category) => category.id)
export const CATEGORIES = ALL_CATEGORIES.filter((category) => FEATURED_CATEGORY_IDS.includes(category.id))
export const RANDOM_CATEGORY = { id: 'random', name: 'هەڕەمەکی', icon: '🎲' }

export function getCategoryById(id) {
  return CATEGORIES.find((category) => category.id === id) || CATEGORIES[0]
}

export function resolveCategory(id) {
  if (id === 'random') return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
  return getCategoryById(id)
}

export function pickRandomWord(category, avoidKu = null) {
  const pool = category.words.filter((word) => word.ku !== avoidKu)
  const list = pool.length ? pool : category.words
  return list[Math.floor(Math.random() * list.length)]
}

const DECOY_STOPWORDS = new Set(['a', 'an', 'the', 'of', 'and', 'or', 'with', 'in', 'on', 'for'])
const meaningfulTokens = (en = '') => en.toLowerCase().split(/\s+/).filter((token) => token.length > 2 && !DECOY_STOPWORDS.has(token))

export function pickDecoyWord(category, secretKu) {
  const pool = category.words.filter((word) => word.ku !== secretKu)
  if (!pool.length) return null
  const secret = category.words.find((word) => word.ku === secretKu)
  const tokens = meaningfulTokens(secret?.en)
  const related = tokens.length
    ? pool.filter((word) => tokens.some((token) => meaningfulTokens(word.en).includes(token)))
    : []
  const list = related.length ? related : pool
  return list[Math.floor(Math.random() * list.length)]
}

export function findWord(ku) {
  return CATEGORIES.flatMap((category) => category.words).find((word) => word.ku === ku) || null
}
