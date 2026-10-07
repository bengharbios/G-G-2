// ─── Shared Game Data ──────────────────────────────────────────────────────────
// This module is shared between the homepage and the game entry hub (/play/[gameId])

export interface GameData {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  description: string;
  href: string | null;
  bgImage: string | null;
  themeColor: string;
  themeBorder: string;
  themeBg: string;
  themeBadge: string;
  features: string[];
  status: 'available' | 'coming_soon';
  players: string;
  category: string;
  /** Join path pattern for room code entry. Use {code} and {name} placeholders. */
  joinPath: string;
}

export const games: GameData[] = [
  {
    id: 'mafia',
    title: 'المافيا',
    titleEn: 'Mafia',
    emoji: '🕵️',
    description:
      'لعبة المافيا الكلاسيكية مع أدوار متعددة! اكتشف من هو المافيا قبل أن يسيطروا على المدينة.',
    href: '/play/mafia',
    bgImage: '/mafia-bg.png',
    themeColor: 'text-red-400',
    themeBorder: 'border-red-500/30 hover:border-red-500/60',
    themeBg: 'from-red-950/80 to-red-900/40',
    themeBadge: 'bg-red-500/20 border-red-500/40 text-red-300',
    features: ['العراب', 'الديوانية', 'أدوار متعددة', 'تصويت ذكي'],
    status: 'available',
    players: '4-14 لاعب',
    category: 'اجتماعية',
    joinPath: '/join/{code}?name={name}',
  },
  {
    id: 'tobol',
    title: 'طبول الحرب',
    titleEn: 'War Drums',
    emoji: '🥁',
    description:
      'حرب استراتيجية حقيقية مع 64 سلاح و60 زر هجوم! خطط واستولِ على أراضي العدو.',
    href: '/play/tobol',
    bgImage: '/img/war/card-bg.png',
    themeColor: 'text-orange-400',
    themeBorder: 'border-orange-500/30 hover:border-orange-500/60',
    themeBg: 'from-orange-950/80 to-red-900/40',
    themeBadge: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    features: ['العراب', '64 سلاح', '60 زر', 'هجوم وفخاخ'],
    status: 'available',
    players: '2-8 لاعب',
    category: 'حربية',
    joinPath: '/join/tobol/{code}?name={name}',
  },
  {
    id: 'tabot',
    title: 'الهروب من التابوت',
    titleEn: 'Escape the Coffin',
    emoji: '🪦',
    description:
      'هل تستطيع الهروب من التابوت قبل فوات الأوان؟ لعبة مليئة بالمفاجآت والرعب!',
    href: '/play/tabot',
    bgImage: '/tabot-bg.png',
    themeColor: 'text-purple-400',
    themeBorder: 'border-purple-500/30 hover:border-purple-500/60',
    themeBg: 'from-purple-950/80 to-purple-900/40',
    themeBadge: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    features: ['العراب', 'الديوانية', 'فرق وقادة', 'أبواب مفاجأة'],
    status: 'available',
    players: '4-16 لاعب',
    category: 'رعب',
    joinPath: '/join/{code}?name={name}',
  },
  {
    id: 'prison',
    title: 'السجن',
    titleEn: 'The Prison',
    emoji: '🔒',
    description:
      'سجن مليء بالمفاجآت! حبس خصومك، حرر أصدقائك، وتجنب الإعدام في لعبة الاستراتيجية والحظ.',
    href: '/play/prison',
    bgImage: null,
    themeColor: 'text-amber-400',
    themeBorder: 'border-amber-500/30 hover:border-amber-500/60',
    themeBg: 'from-amber-950/80 to-orange-900/40',
    themeBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    features: ['العراب', 'الديوانية', 'زنزانات مفاجأة', 'حبس وإعدام'],
    status: 'available',
    players: '4-16 لاعب',
    category: 'استراتيجية',
    joinPath: '/join/prison/{code}?name={name}',
  },
  {
    id: 'risk',
    title: 'المجازفة',
    titleEn: 'Risk',
    emoji: '💣',
    description:
      'ادفع حظك! اسحب البطاقات واجمع النقاط، لكن احذر القنابل! لعبة استراتيجية ومجازفة ممتعة.',
    href: '/play/risk',
    bgImage: '/images/risk/risk_1.webp',
    themeColor: 'text-violet-400',
    themeBorder: 'border-violet-500/30 hover:border-violet-500/60',
    themeBg: 'from-violet-950/80 to-purple-900/40',
    themeBadge: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
    features: ['العراب', 'الديوانية', '2-4 فرق', 'قنابل ومجازفة'],
    status: 'available',
    players: '2-8 لاعب',
    category: 'مجازفة',
    joinPath: '/join/risk/{code}?name={name}',
  },
  {
    id: 'risk2',
    title: 'المجازفة 2',
    titleEn: 'Risk 2',
    emoji: '🎴',
    description:
      'كاشف البطاقات! اختر أرقام مختلفة واحفظ نقاطك. 50 بطاقة و5 بطاقات خاصة ذهبية مضاعفة وقواعد مطابقة الأرقام.',
    href: '/play/risk2',
    bgImage: '/images/risk/risk2_banner.webp',
    themeColor: 'text-orange-400',
    themeBorder: 'border-orange-500/30 hover:border-orange-500/60',
    themeBg: 'from-orange-950/80 to-red-900/40',
    themeBadge: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    features: ['العراب', 'الديوانية', '5 ألوان', 'مطابقة أرقام', 'بطاقات ذهبية مضاعفة'],
    status: 'available',
    players: '2-10 لاعب',
    category: 'مجازفة',
    joinPath: '/join/risk2/{code}?name={name}',
  },
  {
    id: 'baharharb',
    title: 'بحر و حرب',
    titleEn: 'Sea & War',
    emoji: '🌊⚔️',
    description:
      'لعبة ذكاء وكلمات عربية! أجب على الأسئلة واكشف الكلمات المشتركة. فريقين أو أفراد، 600+ سؤال متنوع.',
    href: '/play/baharharb',
    bgImage: null,
    themeColor: 'text-teal-400',
    themeBorder: 'border-teal-500/30 hover:border-teal-500/60',
    themeBg: 'from-teal-950/80 to-cyan-900/40',
    themeBadge: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
    features: ['العراب', 'فرق أو أفراد', '600+ سؤال', 'أدوات سحب عشوائي'],
    status: 'available',
    players: '2-20 لاعب',
    category: 'ذكاء',
    joinPath: '/join/{code}?name={name}',
  },
  {
    id: 'familyfeud',
    title: 'فاميلي فيود',
    titleEn: 'Family Feud',
    emoji: '🏆',
    description:
      'لعبة فاميلي فيود الكلاسيكية! المستضيف يتحكم باللعبة ويرى الإجابات، الفريقين يتنافسون لتخمين الإجابات الأكثر شعبية.',
    href: '/play/familyfeud',
    bgImage: '/images/familyfeud/familyfeud_banner.webp',
    themeColor: 'text-amber-400',
    themeBorder: 'border-amber-500/30 hover:border-amber-500/60',
    themeBg: 'from-amber-950/80 to-rose-900/40',
    themeBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    features: ['العراب كمستضيف', 'الديوانية أونلاين', '95+ سؤال', 'جولة الجائزة المالية'],
    status: 'available',
    players: '2-10 لاعب',
    category: 'اجتماعية',
    joinPath: '/join/{code}?name={name}',
  },
  {
    id: 'shifarat',
    title: 'الشيفرات',
    titleEn: 'Codenames',
    emoji: '🎯',
    description:
      'لمّح بكلمة واحدة فقط! لعبة فريقية مليئة بالتحدي — خمّن الكلمات قبل أن ينفد الوقت. 8 فئات و96+ كلمة.',
    href: '/play/shifarat',
    bgImage: null,
    themeColor: 'text-emerald-400',
    themeBorder: 'border-emerald-500/30 hover:border-emerald-500/60',
    themeBg: 'from-emerald-950/80 to-teal-900/40',
    themeBadge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    features: ['العب مع أصحابك', 'العب أونلاين', '8 فئات متنوعة', '96+ كلمة عربية'],
    status: 'available',
    players: '2-20 لاعب',
    category: 'ذكاء',
    joinPath: '/join/{code}?name={name}',
  },
  {
    id: 'words',
    title: 'لعبة الكلمات',
    titleEn: 'Word Game',
    emoji: '📝',
    description:
      'اختبر ذكاءك ومفرداتك في لعبة الكلمات التنافسية مع مستويات صعوبة متعددة وتصنيف عالمي.',
    href: null,
    bgImage: '/words-bg.png',
    themeColor: 'text-blue-400',
    themeBorder: 'border-blue-500/30 hover:border-blue-500/60',
    themeBg: 'from-blue-950/80 to-blue-900/40',
    themeBadge: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    features: ['جولات متعددة', 'مستويات صعوبة', 'تصنيف عالمي'],
    status: 'coming_soon',
    players: '2-20 لاعب',
    category: 'ذكاء',
    joinPath: '',
  },
  {
    id: 'draw',
    title: 'تخمين الرسم',
    titleEn: 'Draw & Guess',
    emoji: '🎨',
    description:
      'ارسم وتخمّن مع أصحابك! غرف خاصة وتحديات يومية مع نظام رسم بالوقت الحقيقي.',
    href: null,
    bgImage: null,
    themeColor: 'text-pink-400',
    themeBorder: 'border-pink-500/30 hover:border-pink-500/60',
    themeBg: 'from-pink-950/80 to-purple-900/40',
    themeBadge: 'bg-pink-500/20 border-pink-500/40 text-pink-300',
    features: ['رسم بالوقت', 'غرف خاصة', 'تحديات يومية'],
    status: 'coming_soon',
    players: '2-12 لاعب',
    category: 'إبداعية',
    joinPath: '',
  },
  {
    id: 'strategy',
    title: 'حرب الاستراتيجية',
    titleEn: 'Strategy War',
    emoji: '⚔️',
    description:
      'حرب استراتيجية شاملة مع خرائط متنوعة ووحدات عسكرية مختلفة وتحالفات مع لاعبين آخرين.',
    href: null,
    bgImage: null,
    themeColor: 'text-amber-400',
    themeBorder: 'border-amber-500/30 hover:border-amber-500/60',
    themeBg: 'from-amber-950/80 to-orange-900/40',
    themeBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    features: ['خرائط متنوعة', 'وحدات عسكرية', 'تحالفات'],
    status: 'coming_soon',
    players: '2-10 لاعب',
    category: 'استراتيجية',
    joinPath: '',
  },
];

/** Build a join URL from a game's joinPath pattern */
export function buildJoinUrl(gameId: string, code: string, name: string): string {
  const game = games.find(g => g.id === gameId);
  if (!game || !game.joinPath) return '/';
  return game.joinPath.replace('{code}', code).replace('{name}', encodeURIComponent(name));
}

/** Look up a game by its ID */
export function getGameById(gameId: string): GameData | undefined {
  return games.find(g => g.id === gameId);
}
