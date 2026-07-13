// ═══════════════════════════════════════════════════════════
// مزادی ئەستێرەکان — کاتالۆگی یاریزانان
// ١٥٠٠+ یاریزانی خەیاڵی، بەسەر ٥ لیگ و ١٠٨ یانە دابەشکراون.
// ناوی یانەکان بۆ ناسینەوەی لیگن؛ یاریزانەکان ڕۆستەری فەرمی نیین.
// ═══════════════════════════════════════════════════════════

export const LEAGUES = [
  {
    id: 'iraq', name_ku: 'لیگی عێراق', name_ar: 'الدوري العراقي', icon: '🇮🇶', playerCount: 15,
    first: ['هەڵمەت', 'آرام', 'سوران', 'دڵشاد', 'زانا', 'هەورام', 'کاروان', 'شێرزاد', 'ڕێباز', 'هێمن'],
    last: ['عەلی', 'کەریم', 'ڕەشید', 'مەحمود', 'جەبار', 'حەمە', 'نوری', 'قادر', 'سەعید', 'فەتاح'],
    teams: ['الزوراء', 'الشرطة', 'القوة الجوية', 'الطلبة', 'دهوك', 'أربيل', 'زاخو', 'الميناء', 'النجف', 'الكرخ', 'الكهرباء', 'النفط', 'نفط البصرة', 'نفط ميسان', 'القاسم', 'الحدود', 'ديالى', 'الكرمة', 'كربلاء', 'الموصل'],
  },
  {
    id: 'saudi', name_ku: 'لیگی عەرەبستان', name_ar: 'الدوري السعودي', icon: '🇸🇦', playerCount: 17,
    first: ['فهد', 'سالم', 'تركي', 'راكان', 'ناصر', 'بندر', 'وليد', 'ماجد', 'زياد', 'ياسر'],
    last: ['العتيبي', 'القحطاني', 'الغامدي', 'الدوسري', 'الشمري', 'الحربي', 'الزهراني', 'التميمي', 'المالكي', 'السلمي'],
    teams: ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'الشباب', 'الاتفاق', 'التعاون', 'الفتح', 'الرائد', 'الخليج', 'الفيحاء', 'الرياض', 'ضمك', 'الأخدود', 'القادسية', 'الخُلود', 'الوحدة', 'الحزم'],
  },
  {
    id: 'usa', name_ku: 'لیگی ئەمریکا', name_ar: 'الدوري الأمريكي', icon: '🇺🇸', playerCount: 10,
    first: ['Ethan', 'Mateo', 'Jayden', 'Noah', 'Liam', 'Carlos', 'Tyler', 'Jordan', 'Mason', 'Diego'],
    last: ['Miller', 'Garcia', 'Johnson', 'Brown', 'Martinez', 'Wilson', 'Taylor', 'Anderson', 'Lopez', 'Harris'],
    teams: ['Inter Miami', 'LA Galaxy', 'Los Angeles FC', 'Seattle Sounders', 'Atlanta United', 'New York City FC', 'New York Red Bulls', 'Chicago Fire', 'DC United', 'Columbus Crew', 'FC Cincinnati', 'Orlando City', 'Philadelphia Union', 'Toronto FC', 'CF Montréal', 'Austin FC', 'Dallas FC', 'Houston Dynamo', 'Sporting KC', 'Minnesota United', 'Nashville SC', 'Charlotte FC', 'St. Louis City', 'Colorado Rapids', 'Real Salt Lake', 'Portland Timbers', 'Vancouver Whitecaps', 'San Jose Earthquakes', 'New England Revolution', 'Tampa Bay FC'],
  },
  {
    id: 'england', name_ku: 'لیگی ئینگلتەرا', name_ar: 'الدوري الإنجليزي', icon: '🏴', playerCount: 15,
    first: ['Oliver', 'Jack', 'Harry', 'Alfie', 'Leo', 'George', 'Theo', 'Mason', 'James', 'Elliot'],
    last: ['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Wilson', 'Walker', 'Hughes', 'Bennett'],
    teams: ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham', 'Newcastle', 'Aston Villa', 'West Ham', 'Everton', 'Brighton', 'Brentford', 'Crystal Palace', 'Fulham', 'Wolves', 'Nottingham Forest', 'Leeds United', 'Burnley', 'Bournemouth', 'Sunderland'],
  },
  {
    id: 'spain', name_ku: 'لیگی ئیسپانیا', name_ar: 'الدوري الإسباني', icon: '🇪🇸', playerCount: 15,
    first: ['Alejandro', 'Pablo', 'Daniel', 'Javier', 'Sergio', 'Mateo', 'Adrián', 'Hugo', 'Iker', 'Álvaro'],
    last: ['García', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Torres', 'Díaz', 'Moreno'],
    teams: ['Real Madrid', 'Barcelona', 'Atlético Madrid', 'Sevilla', 'Valencia', 'Villarreal', 'Real Sociedad', 'Athletic Club', 'Real Betis', 'Celta Vigo', 'Getafe', 'Osasuna', 'Mallorca', 'Rayo Vallecano', 'Girona', 'Espanyol', 'Alavés', 'Las Palmas', 'Granada', 'Leganés'],
  },
  {
    id: 'italy', name_ku: 'لیگی ئیتاڵیا', name_ar: 'الدوري الإيطالي', icon: '🇮🇹', playerCount: 15,
    first: ['Luca', 'Marco', 'Matteo', 'Lorenzo', 'Davide', 'Andrea', 'Federico', 'Riccardo', 'Simone', 'Giovanni'],
    last: ['Rossi', 'Romano', 'Esposito', 'Bianchi', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti'],
    teams: ['Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino', 'Genoa', 'Udinese', 'Sassuolo', 'Parma', 'Verona', 'Lecce', 'Cagliari', 'Empoli', 'Monza', 'Como'],
  },
  {
    id: 'germany', name_ku: 'لیگی ئەڵمانیا', name_ar: 'الدوري الألماني', icon: '🇩🇪', playerCount: 17,
    first: ['Leon', 'Finn', 'Jonas', 'Lukas', 'Maximilian', 'Felix', 'Moritz', 'Tim', 'Nico', 'Julian'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Koch'],
    teams: ['Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen', 'RB Leipzig', 'Eintracht Frankfurt', 'Stuttgart', 'Wolfsburg', 'Werder Bremen', 'Freiburg', 'Mainz', 'Augsburg', 'Hoffenheim', 'Union Berlin', 'Borussia Mönchengladbach', 'Cologne', 'Hamburg', 'St. Pauli', 'Heidenheim'],
  },
  {
    id: 'france', name_ku: 'لیگی فەرەنسا', name_ar: 'الدوري الفرنسي', icon: '🇫🇷', playerCount: 17,
    first: ['Lucas', 'Enzo', 'Théo', 'Maxime', 'Antoine', 'Nathan', 'Mathis', 'Yanis', 'Rayan', 'Kylian'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'],
    teams: ['Paris Saint-Germain', 'Marseille', 'Lyon', 'Monaco', 'Lille', 'Nice', 'Rennes', 'Lens', 'Strasbourg', 'Nantes', 'Montpellier', 'Toulouse', 'Brest', 'Reims', 'Auxerre', 'Le Havre', 'Angers', 'Saint-Étienne'],
  },
]

const POSITION_PLAN = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD', 'DEF', 'MID', 'FWD', 'MID', 'DEF']
const TRAITS = {
  GK: ['پێکهاتەی دەست', 'دەربازکردنی پێنالتی', 'سەرکردەی هێڵی دواوە'],
  DEF: ['بەرگریی بەهێز', 'خێرایی بۆ گەڕانەوە', 'سەربازی ئاسمان'],
  MID: ['پاسی درێژ', 'بینینی یاری', 'کۆنترۆڵی ناوەڕاست'],
  FWD: ['کۆتایی‌هێنانی کوشندە', 'خێرایی بێ‌تۆپ', 'شوتی دوور'],
}

function score(seed, min, span) {
  return min + ((seed * 37 + 19) % span)
}

function portraitUrl(name, club, position, seed) {
  const prompt = encodeURIComponent(`fictional ${position} football player portrait, ${name}, ${club} kit, stadium lights, realistic sports photography, no text`)
  return `https://image.pollinations.ai/prompt/${prompt}?width=400&height=400&nologo=true&seed=${seed % 100000}`
}

export const FOOTBALL_PLAYERS = LEAGUES.flatMap((league, leagueIndex) =>
  league.teams.flatMap((team, teamIndex) =>
    Array.from({ length: league.playerCount }, (_, rosterIndex) => {
      const seed = leagueIndex * 10000 + teamIndex * 100 + rosterIndex
      const position = POSITION_PLAN[rosterIndex % POSITION_PLAN.length]
      const rating = score(seed, 66, 27)
      const pace = score(seed + 3, 58, 39)
      const skill = score(seed + 7, 60, 36)
      const power = score(seed + 11, 58, 38)
      const name = `${league.first[(teamIndex + rosterIndex) % league.first.length]} ${league.last[(teamIndex * 3 + rosterIndex) % league.last.length]}`
      return {
        id: `${league.id}-${teamIndex}-${rosterIndex}`,
        name,
        position,
        rating,
        pace,
        skill,
        power,
        heightCm: 168 + (seed % 27),
        weightKg: 62 + ((seed * 3) % 29),
        jump: score(seed + 17, 64, 33),
        trait: TRAITS[position][seed % TRAITS[position].length],
        leagueId: league.id,
        leagueName: league.name_ku,
        club: team,
        price: Math.max(3, Math.round((rating - 55) * 1.55 + (seed % 7))),
        image_url: portraitUrl(name, team, position, seed),
      }
    })
  )
)

export const PLAYER_COUNT = FOOTBALL_PLAYERS.length

export function formatMoney(value) {
  return `${value}M`
}

export function shuffle(list) {
  const items = [...list]
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export function buildDraftPool(managerCount, slotCount) {
  const positions = slotCount === 5
    ? ['GK', 'DEF', 'MID', 'FWD', 'MID']
    : ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD']
  const byPosition = Object.fromEntries(['GK', 'DEF', 'MID', 'FWD'].map((position) => [position, shuffle(FOOTBALL_PLAYERS.filter((player) => player.position === position))]))
  const indexes = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
  return positions.flatMap((position) => Array.from({ length: managerCount }, () => byPosition[position][indexes[position]++]))
}
