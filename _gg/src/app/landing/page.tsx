'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Shield, Users, ShoppingBag, Trophy, Mic, ChevronDown,
  Volume2, Gamepad2, Zap, Play, ArrowLeft, ArrowRight, Sparkles,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// Landing page — bilingual (AR/EN), responsive, with screenshots and game rules
// Route: /landing
// ════════════════════════════════════════════════════════════════════════════

type Lang = 'ar' | 'en';

interface GameCard {
  slug: string;
  emoji: string;
  img?: string;
  color: string;
  players: string;
  ar: { name: string; tagline: string; rules: string[]; };
  en: { name: string; tagline: string; rules: string[]; };
}

const GAMES: GameCard[] = [
  {
    slug: 'mafia', emoji: '🕵️', img: '/yalla-games/mafia.png', color: 'from-red-600 to-rose-800', players: '4-14',
    ar: { name: 'المافيا', tagline: 'اكتشف من هو المافيا قبل أن يسيطروا على المدينة', rules: [
      'ينقسم اللاعبون إلى فريقين: المافيا والمواطنين الأبرياء.',
      'في الليل، تستيقظ المافيا وتختار ضحية. المحقق والعطار والطبيب لهم أدوار خاصة.',
      'في النهار، يناقش الجميع ويصوتون لإعدام المشتبه به.',
      'تفوز المافيا إذا تساوت مع المواطنين، ويفوز المواطنون بإبادة كل المافيا.',
    ]},
    en: { name: 'Mafia', tagline: 'Find the mafia before they take over the city', rules: [
      'Players split into two teams: mafia and innocent citizens.',
      'At night, the mafia wakes up to choose a victim. Detective, Chemist, and Doctor have special roles.',
      'By day, everyone discusses and votes to lynch a suspect.',
      'Mafia wins when they equal citizens; citizens win by eliminating all mafia.',
    ]},
  },
  {
    slug: 'tobol', emoji: '🥁', img: '/yalla-games/tobol.png', color: 'from-orange-600 to-amber-800', players: '2-8',
    ar: { name: 'طبول الحرب', tagline: 'حرب استراتيجية حقيقية مع 64 سلاح و60 زر هجوم', rules: [
      'كل لاعب يبدأ بمنطقة صغيرة على الخريطة وجيش صغير.',
      'في كل دور، تحصل على ذهب يمكنك إنفاقه على الأسلحة (سيوف، رماح، مدافع).',
      'هاجم مناطق الجوار لتوسيع إمبراطوريتك. كل هجوم يستهلك أسلحة وعدداً من الجنود.',
      'آخر لاعب يبقى على الخريطة هو الفائز.',
    ]},
    en: { name: 'War Drums', tagline: 'Strategic war with 64 weapons and 60 attack buttons', rules: [
      'Each player starts with a small territory and tiny army.',
      'Each turn, you earn gold to spend on weapons (swords, spears, cannons).',
      'Attack neighboring regions to expand. Each attack costs weapons and soldiers.',
      'Last player on the map wins.',
    ]},
  },
  {
    slug: 'tabot', emoji: '🪦', img: '/yalla-games/tabot.png', color: 'from-purple-700 to-fuchsia-900', players: '4-16',
    ar: { name: 'الهروب من التابوت', tagline: 'هل تستطيع الهروب قبل فوات الأوان؟', rules: [
      'يُحبس لاعب واحد في "التابوت" والباقي يلعبون لإنقاذه.',
      'في كل دور، يختار اللاعبون بطاقات للمساعدة أو الإعاقة.',
      'بعض البطاقات تُنقذ المسجون، وبعضها يُطيل فترة الحبس.',
      'إذا استطاع المسجون الخروج قبل 5 أدوار، يفوز فريقه.',
    ]},
    en: { name: 'Coffin Escape', tagline: 'Can you escape before it is too late?', rules: [
      'One player is locked in the "coffin" while others play to rescue them.',
      'Each turn, players draw cards to help or hinder.',
      'Some cards free the prisoner, others extend the lock.',
      'If the prisoner escapes within 5 rounds, their team wins.',
    ]},
  },
  {
    slug: 'prison', emoji: '🔒', img: '/yalla-games/prison.png', color: 'from-amber-700 to-yellow-900', players: '4-16',
    ar: { name: 'السجن', tagline: 'حبس خصومك، حرر أصدقاءك، وتجنب الإعدام', rules: [
      'كل لاعب لديه عدد من "نقاط الحرية" في البداية.',
      'اسحب بطاقة في دورك: قد تحبس لاعباً، تحرر آخر، أو تسحب بطاقة حدث.',
      'بطاقة "الإعدام" تخرج لاعباً من اللعبة نهائياً.',
      'آخر لاعب حر يفوز باللعبة.',
    ]},
    en: { name: 'Prison', tagline: 'Lock up enemies, free allies, avoid execution', rules: [
      'Each player starts with "freedom points".',
      'Draw a card on your turn: imprison someone, free an ally, or trigger an event.',
      'The "Execution" card permanently removes a player.',
      'Last free player wins.',
    ]},
  },
  {
    slug: 'risk', emoji: '💣', img: '/yalla-games/risk.png', color: 'from-violet-600 to-purple-900', players: '2-8',
    ar: { name: 'المجازفة', tagline: 'اسحب البطاقات، اجمع النقاط، واحذر القنابل', rules: [
      'في دورك، اسحب بطاقة من المجموعة. قد تكون نقاطاً (1-10) أو قنبلة.',
      'يمكنك التوقف في أي وقت و"حفظ" نقاطك للجولة، أو المخاطرة بسحب المزيد.',
      'إذا سحبت قنبلة ثانية، تخسر كل نقاطك في الجولة.',
      'أول لاعب يصل إلى 100 نقطة يفوز.',
    ]},
    en: { name: 'Risk', tagline: 'Draw cards, gather points, dodge the bombs', rules: [
      'On your turn, draw a card. It may be points (1-10) or a bomb.',
      'You can stop anytime and "bank" your points, or risk drawing more.',
      'Drawing a second bomb loses all unbanked points.',
      'First to reach 100 points wins.',
    ]},
  },
  {
    slug: 'risk2', emoji: '🎴', img: '/yalla-games/risk2.png', color: 'from-rose-600 to-pink-800', players: '2-8',
    ar: { name: 'المجازفة 2', tagline: 'نسخة مطوّرة بقواعد وأبطال خاصين', rules: [
      'نفس قواعد المجازفة، لكن مع 8 شخصيات لكل منها قدرة فريدة.',
      'الشخصيات: اللص، الطبيب، القناص، المنقذ، إلخ.',
      'كل شخصية لها 3 قدرات قابلة للاستخدام مرة واحدة في اللعبة.',
      'أول لاعب يصل إلى 150 نقطة يفوز.',
    ]},
    en: { name: 'Risk 2', tagline: 'Enhanced version with heroes and special rules', rules: [
      'Same as Risk, but with 8 heroes each having a unique ability.',
      'Heroes: Thief, Doctor, Sniper, Rescuer, etc.',
      'Each hero has 3 one-time abilities per game.',
      'First to 150 points wins.',
    ]},
  },
  {
    slug: 'baharharb', emoji: '⚓', img: '/yalla-games/baharharb.png', color: 'from-blue-700 to-cyan-900', players: '2-8',
    ar: { name: 'بحر و حرب', tagline: 'حرب بحرية استراتيجية بين الأساطيل', rules: [
      'كل لاعب لديه أسطول من السفن على شبكة بحرية مخفية.',
      'بالتناوب، أطلق النار على إحداثيات الخصم.',
      'إذا أصبت، تستمر بدورك. إذا أخطأت، ينتقل الدور للخصم.',
      'أول لاعب يُغرق كل سفن الخصم يفوز.',
    ]},
    en: { name: 'Sea & War', tagline: 'Strategic naval battle between fleets', rules: [
      'Each player has a fleet of ships on a hidden sea grid.',
      'Take turns firing at coordinates on the opponent grid.',
      'A hit means you keep your turn. A miss passes the turn.',
      'First to sink all enemy ships wins.',
    ]},
  },
  {
    slug: 'shifarat', emoji: '🔐', img: '/yalla-games/shifarat.png', color: 'from-emerald-600 to-teal-800', players: '4-14',
    ar: { name: 'الشيفرات', tagline: 'فكّ الشيفرات واكتشف الكلمة المخفية', rules: [
      'يظهر للجميع لغز حسب مستوى الصعوبة (سهل/متوسط/صعب).',
      'كل لاعب يحاول فك الشيفرة في وقت محدد (60 ثانية).',
      'الذي يفك أولاً يحصل على نقاط حسب سرعته.',
      '5 جولات، والفائز هو من جمع أكبر عدد من النقاط.',
    ]},
    en: { name: 'Ciphers', tagline: 'Decode the ciphers and find the hidden word', rules: [
      'A puzzle appears based on difficulty (easy/medium/hard).',
      'Each player tries to decode it within 60 seconds.',
      'First to solve earns points based on speed.',
      '5 rounds; highest total wins.',
    ]},
  },
  {
    slug: 'familyfeud', emoji: '👨\u200d👩\u200d👧\u200d👦', img: '/yalla-games/familyfeud.png', color: 'from-indigo-600 to-blue-800', players: '2-12',
    ar: { name: 'فاميلي فيود', tagline: 'أجوبة من استطلاعات حقيقية — تخمّن الأشهر!', rules: [
      'يُطرح سؤال: "ماذا يفعل الناس قبل النوم؟" مثلاً.',
      'لديك 6 إجابات على اللوحة مرتبة حسب الشعبية.',
      'فريقك يخمن. كل إجابة صحيحة تكشف عن مكانها ونقاطها.',
      '3 جولات، الفريق صاحب أعلى نقاط يفوز بالجولة.',
    ]},
    en: { name: 'Family Feud', tagline: 'Real survey answers — guess the most popular!', rules: [
      'A question is asked: e.g. "What do people do before sleeping?".',
      '6 answers are ranked by popularity on the board.',
      'Your team guesses; correct answers reveal position and points.',
      '3 rounds; highest scoring team wins.',
    ]},
  },
  {
    slug: 'wizardduel', emoji: '🔮', img: '/yalla-games/wizardduel.png', color: 'from-purple-700 to-violet-900', players: '1-4',
    ar: { name: 'مبارزة السحرة', tagline: 'ساحر شاب في صراع سحري ضد أعداء أقوياء', rules: [
      'كل لاعب يبدأ بـ 30 HP ويداً من 5 بطاقات سحرية.',
      'في دورك: اسحب بطاقة أو العب بطاقة (تستهلك 2 حركة).',
      'بطاقات الهجوم تخفض HP الخصم، وبطاقات الدفاع تحميك.',
      'آخر ساحر يبقى واقفاً (HP > 0) يفوز.',
    ]},
    en: { name: 'Wizard Duel', tagline: 'A young wizard in magical combat', rules: [
      'Each player starts with 30 HP and a hand of 5 magic cards.',
      'On your turn: draw a card or play one (2 moves per turn).',
      'Attack cards reduce enemy HP; defense cards protect you.',
      'Last wizard standing (HP > 0) wins.',
    ]},
  },
  {
    slug: 'mustathib', emoji: '🐺', img: '/yalla-games/mustathib.png', color: 'from-rose-700 to-red-900', players: '6-16',
    ar: { name: 'المستذئب', tagline: 'البومة ترى، الغراب يقتل، العرافة تكشف', rules: [
      'تنقسم الأدوار: مستذئبون، بومة، غراب، عرافة، صياد، قرويون.',
      'في الليل، يستيقظ كل دور لأداء مهمته سراً.',
      'في النهار، يناقش الجميع ويُعدم مشتبه به واحد.',
      'القرويون يفوزون بقضاء كل المستذئبين، والمستذئبون بالتساوي العددي.',
    ]},
    en: { name: 'Werewolf', tagline: 'Owl sees, Raven kills, Seer reveals', rules: [
      'Roles split: werewolves, owl, raven, seer, hunter, villagers.',
      'At night, each role wakes to perform their secret task.',
      'By day, players discuss and lynch one suspect.',
      'Villagers win by killing all werewolves; werewolves win by equaling the villagers.',
    ]},
  },
  {
    slug: 'spotdiff', emoji: '🔍', img: '/yalla-games/spotdiff.png', color: 'from-cyan-600 to-sky-800', players: '1-10',
    ar: { name: 'اختلاف الصور', tagline: 'اعثر على الفروقات قبل انتهاء الوقت', rules: [
      'تظهر صورتان متطابقتان ظاهرياً مع 5-10 فروقات.',
      'لديك 60 ثانية لإيجاد أكبر عدد من الفروقات.',
      'كل فرق صحيح = 10 نقاط، كل خطأ = -5 نقاط.',
      '5 جولات بثلاث مستويات صعوبة، الأعلى نقاطاً يفوز.',
    ]},
    en: { name: 'Spot the Difference', tagline: 'Find the diffs before time runs out', rules: [
      'Two seemingly identical images appear with 5-10 differences.',
      'You have 60 seconds to find as many diffs as possible.',
      'Each correct diff = 10 points, each mistake = -5 points.',
      '5 rounds across 3 difficulty levels; highest score wins.',
    ]},
  },
  {
    slug: 'guessimage', emoji: '🧩', img: '/yalla-games/guessimage.png', color: 'from-amber-600 to-orange-800', players: '1-10',
    ar: { name: 'خمن الصورة', tagline: 'صورة مكشوفة تدريجياً — خمّن ما هي', rules: [
      'تبدأ صورة ضبابية تماماً وتظهر تدريجياً.',
      'لديك 4 محاولات تخمين قبل انتهاء الوقت.',
      'كل محاولة خاطئة تستهلك 5 ثوانٍ من وقتك.',
      'الإجابة الصحيحة المبكرة = نقاط أكثر. 5 جولات.',
    ]},
    en: { name: 'Guess the Image', tagline: 'Gradually revealed image — guess what it is', rules: [
      'An image starts fully blurred and gradually clears.',
      'You have 4 guess attempts before time expires.',
      'Each wrong guess costs 5 seconds.',
      'Early correct answers earn more points. 5 rounds.',
    ]},
  },
  {
    slug: 'matchcards', emoji: '🃏', img: undefined, color: 'from-purple-600 to-fuchsia-800', players: '1-4',
    ar: { name: 'مطابقة البطاقات', tagline: 'اقلب البطاقات واعثر على الأزواج المتطابقة', rules: [
      'لديك شبكة من البطاقات المقلوبة. اقلب بطاقتين في كل دور.',
      'إذا تطابقتا، تبقيان مكشوفتين وتأخذ نقطة. إذا لا، تُقلبان مجدداً.',
      'لديك حد وقت لكل جولة (حسب حجم الشبكة).',
      'أكثر أزواج مطابقة = فوز. 6 ثيمات و4 أحجام.',
    ]},
    en: { name: 'Match Cards', tagline: 'Flip cards and find matching pairs', rules: [
      'A grid of face-down cards. Flip two per turn.',
      'If they match, they stay open and you earn a point. If not, they flip back.',
      'Time limit per round (based on grid size).',
      'Most matches wins. 6 themes, 4 sizes.',
    ]},
  },
  {
    slug: 'ships', emoji: '🚢', img: '/yalla-games/ships.png', color: 'from-indigo-700 to-blue-900', players: '1-2',
    ar: { name: 'سفن (Battleship)', tagline: 'ضع أسطولك وقصف سفن الخصم', rules: [
      'كل لاعب يضع 5 سفن (1-5 خلايا) على شبكته المخفية.',
      'بالتناوب، أطلق النار على إحداثيات الخصم.',
      '"ضربة" تستمر بدورك. "خطأ" تنتقل للخصم.',
      'أول من يُغرق كل سفن الخصم (5/5) يفوز.',
    ]},
    en: { name: 'Battleship', tagline: 'Place your fleet and sink the enemy', rules: [
      'Each player places 5 ships (1-5 cells) on their hidden grid.',
      'Take turns firing at coordinates on the opponent grid.',
      '"Hit" lets you continue your turn. "Miss" passes it.',
      'First to sink all 5 enemy ships wins.',
    ]},
  },
  {
    slug: 'foodwar', emoji: '🍕', img: '/yalla-games/foodwar-photo.png', color: 'from-orange-600 to-red-800', players: '2-8',
    ar: { name: 'حرب الاكلات', tagline: 'العجلة تدور! اختر طعاماً واكشف الناجي', rules: [
      'عجلة دوارة بها 8 قطع طعام. خلف كل قطعة لاعب مختبئ.',
      'في دورك، أدر العجلة ثم اختر قطعة طعام.',
      'اللاعب خلف القطعة المختارة يخرج من اللعبة.',
      'آخر ناجٍ (لاعب خلف قطعة) يفوز بالجولة. 3 جولات.',
    ]},
    en: { name: 'Food War', tagline: 'Spin the wheel, pick a food, reveal the survivor', rules: [
      'A spinning wheel has 8 food slices. A player hides behind each slice.',
      'On your turn: spin, then pick a food slice.',
      'The player behind the chosen slice is eliminated.',
      'Last survivor wins the round. 3 rounds per game.',
    ]},
  },
];

const FEATURES = [
  {
    icon: <ShoppingBag className="w-6 h-6" />,
    ar: { title: 'متجر يللا لودو', desc: 'متجر كامل بـ 75 إطار (45 متحرك SVGA) + 30 غلاف لودو/جاكارو + 4 معلقات جدارية + 10 مواضيع + 7 بطاقات ملف. ارفع صورك الخاصة من لوحة الأدمن.' },
    en: { title: 'Yalla Ludo Style Shop', desc: '75 frames (45 animated SVGA), 30 ludo/jackaroo skins, 4 wall hangings, 10 themes, 7 profile cards. Upload your own images from the admin panel.' },
  },
  {
    icon: <Mic className="w-6 h-6" />,
    ar: { title: 'غرف صوتية مباشرة', desc: '8 مقاعد مايك مع تأثيرات بصرية، ردود فعل عائمة، وحماية كاملة. استضافة صديقك أو فتح غرفة عامة للجميع.' },
    en: { title: 'Live Voice Rooms', desc: '8 mic seats with visual effects, floating reactions, full moderation. Host a friend or open a public room to everyone.' },
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    ar: { title: 'نظام مكافآت ذكي', desc: 'XP + ذهب على كل لعبة. مستويات لاعبين، إنجازات قابلة للفتح، شارات، ومضاعفات أدوار (ضيف/مشترك/مشرف).' },
    en: { title: 'Smart Rewards System', desc: 'XP + gold per game. Player levels, unlockable achievements, badges, and role multipliers (guest/subscriber/moderator).' },
  },
  {
    icon: <Shield className="w-6 h-6" />,
    ar: { title: 'اشتراكات آمنة', desc: 'اشتراكات شهرية/سنوية مع رموز فريدة. تجربة مجانية، خطط مدفوعة، أدوات حظر وتقييد كاملة.' },
    en: { title: 'Secure Subscriptions', desc: 'Monthly/yearly subscriptions with unique codes. Free trial, paid plans, full ban and restrict tools.' },
  },
  {
    icon: <Globe className="w-6 h-6" />,
    ar: { title: 'بدون تطبيق، بدون تسجيل', desc: 'العب مباشرة من المتصفح. لا حاجة لتثبيت تطبيق. ادخل كضيف أو سجّل بسرعة برقم الهاتف أو يللا شات.' },
    en: { title: 'No App, No Sign-up', desc: 'Play directly from the browser. No app install required. Join as guest or sign up quickly with phone or Yalla Chat.' },
  },
  {
    icon: <Users className="w-6 h-6" />,
    ar: { title: 'متعدد اللاعبين حقيقي', desc: 'كل لعبة تدعم 1-16 لاعب في نفس الوقت. دعوة أصدقاء عبر رابط غرفة، دخول بقسم، أو مباراة عشوائية.' },
    en: { title: 'True Multiplayer', desc: 'Each game supports 1-16 players in real-time. Invite friends via room link, enter by code, or match randomly.' },
  },
];

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState(0);

  // Persist language preference
  useEffect(() => {
    const saved = localStorage.getItem('landing-lang') as Lang | null;
    if (saved === 'ar' || saved === 'en') setLang(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('landing-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const isRtl = lang === 'ar';

  const screenshots = [
    { src: '/landing/screenshots/room.png', ar: 'غرف صوتية بتصميم يللا لودو', en: 'Voice rooms with Yalla Ludo style' },
    { src: '/landing/screenshots/game-preview.png', ar: 'معاينة اللعبة', en: 'Game preview' },
    { src: '/landing/screenshots/game-setup.png', ar: 'إعداد اللعبة', en: 'Game setup' },
    { src: '/landing/screenshots/aiwerewolf.png', ar: 'لعبة المستذئب', en: 'Werewolf game' },
    { src: '/landing/screenshots/mobile.png', ar: 'متجاوب مع الجوال', en: 'Mobile responsive' },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'var(--font-cairo), system-ui, sans-serif' }}
    >
      {/* ════════ Top bar ════════ */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight">{t('ألعاب الغريب', 'Gharib Games')}</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">{t('منصة ألعاب جماعية عربية', 'Arabic social games platform')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {t('ابدأ اللعب', 'Play Now')}
            </a>
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-200 text-xs font-bold"
              title="Switch language"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </header>

      {/* ════════ Hero ════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.15),_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-start"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {t('16 لعبة جماعية', '16 social games')}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
              {t('العب مع أصحابك في نفس الوقت', 'Play with friends in real time')}
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {t('من أي مكان، بدون تطبيق', 'from anywhere, no app')}
              </span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed max-w-xl">
              {t(
                'منصة عربية متكاملة للألعاب الجماعية: المافيا، المجازفة، فاميلي فيود، مبارزة السحرة و12 لعبة أخرى. غرف صوتية مباشرة، متجر يللا لودو، اشتراكات آمنة — كل ذلك بدون تثبيت تطبيق.',
                'Complete Arabic platform for social games: Mafia, Risk, Family Feud, Wizard Duel and 12 more. Live voice rooms, Yalla Ludo shop, secure subscriptions — all without installing anything.'
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 transition-all"
              >
                <Play className="w-4 h-4" />
                {t('ابدأ مجاناً', 'Start free')}
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>
              <a
                href="#games"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-200 font-bold transition-all"
              >
                <Gamepad2 className="w-4 h-4" />
                {t('تصفّح الألعاب', 'Browse games')}
              </a>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-md">
              {[
                { num: '16+', label: t('ألعاب', 'Games') },
                { num: '75', label: t('إطارات', 'Frames') },
                { num: '∞', label: t('لاعب', 'Players') },
              ].map((s, i) => (
                <div key={i} className="text-center bg-slate-900/60 rounded-xl border border-slate-800/50 py-3 px-2">
                  <div className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-emerald-400 to-teal-300 bg-clip-text text-transparent">{s.num}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero screenshot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl shadow-emerald-500/10 rotate-1">
              <img src={screenshots[0].src} alt={t(screenshots[0].ar, screenshots[0].en)} className="w-full h-full object-cover" />
            </div>
            {/* Floating chips */}
            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 rotate-6">
              <Volume2 className="w-3 h-3" /> {t('صوت مباشر', 'Live audio')}
            </div>
            <div className="absolute -bottom-3 -left-3 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 -rotate-6">
              <Users className="w-3 h-3" /> {t('8 لاعبين', '8 players')}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ About ════════ */}
      <section className="py-12 sm:py-16 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">{t('ما هو المشروع؟', 'What is this project?')}</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              {t(
                'منصة ويب عربية متكاملة تجمع 16 لعبة جماعية تحت سقف واحد. مستوحاة من تطبيق يللا لودو في التصميم (المتجر، الإطارات، الغرف الصوتية) لكنها مستقلة تماماً ومدعومة بـ Next.js 16 + TypeScript + Tailwind.',
                'A complete Arabic web platform gathering 16 social games under one roof. Inspired by Yalla Ludo in design (shop, frames, voice rooms) but completely independent, built on Next.js 16 + TypeScript + Tailwind.'
              )}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 hover:border-emerald-500/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 mb-3">
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2">{t(f.ar.title, f.en.title)}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t(f.ar.desc, f.en.desc)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ Games showcase ════════ */}
      <section id="games" className="py-12 sm:py-16 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              {t('تصفّح 16 لعبة', 'Browse 16 games')}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              {t(
                'اضغط على أي لعبة لرؤية قواعدها المصوّرة خطوة بخطوة.',
                'Click any game to see its illustrated step-by-step rules.'
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {GAMES.map((g, idx) => {
              const isOpen = expandedGame === g.slug;
              return (
                <motion.div
                  key={g.slug}
                  id={`game-${g.slug}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.3, delay: (idx % 4) * 0.05 }}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isOpen ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-800/50 hover:border-slate-700'
                  }`}
                  onClick={() => setExpandedGame(isOpen ? null : g.slug)}
                >
                  {/* Gradient banner */}
                  <div className={`relative aspect-[5/4] bg-gradient-to-br ${g.color} flex items-center justify-center overflow-hidden`}>
                    {g.img ? (
                      <img
                        src={g.img}
                        alt={t(g.ar.name, g.en.name)}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative text-center px-3">
                      <div className="text-5xl sm:text-6xl mb-2 drop-shadow-lg">{g.emoji}</div>
                      <div className="text-sm sm:text-base font-bold text-white drop-shadow-md">{t(g.ar.name, g.en.name)}</div>
                      <div className="text-[10px] sm:text-xs text-white/80 mt-1 flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" />
                        {g.players}
                      </div>
                    </div>
                    {/* Expand indicator */}
                    <div className="absolute top-2 end-2 bg-black/40 backdrop-blur rounded-full p-1">
                      <ChevronDown className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {/* Tagline */}
                  <div className="p-3 bg-slate-900/80">
                    <p className="text-xs text-slate-300 leading-snug">{t(g.ar.tagline, g.en.tagline)}</p>
                  </div>

                  {/* Expanded rules (illustrated) */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-slate-950 border-t border-slate-800/50 overflow-hidden"
                      >
                        <ol className="p-4 space-y-2.5">
                          {(lang === 'ar' ? g.ar.rules : g.en.rules).map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[11px] font-bold text-emerald-300">
                                {i + 1}
                              </div>
                              <span className="text-xs text-slate-300 leading-relaxed">{step}</span>
                            </li>
                          ))}
                          <li className="mt-3 pt-3 border-t border-slate-800/50">
                            <a
                              href={`/${g.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                            >
                              <Play className="w-3 h-3" />
                              {t('العب الآن', 'Play now')}
                            </a>
                          </li>
                        </ol>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════ Screenshots carousel ════════ */}
      <section className="py-12 sm:py-16 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">{t('لقطات من المشروع', 'Screenshots')}</h2>
            <p className="text-slate-400 text-sm">{t('انظر كيف يبدو المشروع على مختلف الأجهزة', 'See how the project looks across devices')}</p>
          </div>

          <div className="relative">
            {/* Main preview */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl bg-slate-900">
              <img
                src={screenshots[activeScreenshot].src}
                alt={t(screenshots[activeScreenshot].ar, screenshots[activeScreenshot].en)}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 to-transparent p-4 sm:p-6">
                <p className="text-sm sm:text-base font-bold text-white drop-shadow-md">
                  {t(screenshots[activeScreenshot].ar, screenshots[activeScreenshot].en)}
                </p>
              </div>
            </div>
            {/* Thumbnails */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {screenshots.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScreenshot(i)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    activeScreenshot === i ? 'border-emerald-500 scale-105' : 'border-slate-800/50 hover:border-slate-600 opacity-60'
                  }`}
                >
                  <img src={s.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="py-16 sm:py-24 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
            <Zap className="w-3.5 h-3.5" />
            {t('ابدأ خلال 5 ثوانٍ', 'Start in 5 seconds')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            {t('جاهز للعب؟', 'Ready to play?')}
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto text-sm sm:text-base">
            {t(
              'ادخل كضيف أو سجّل بسرعة، اختر لعبتك، ادعُ أصدقاءك عبر رابط الغرفة، والعب الآن — بدون تثبيت أي شيء.',
              'Join as guest or sign up quickly, pick your game, invite friends via room link, and play now — without installing anything.'
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Play className="w-5 h-5" />
              {t('ابدأ اللعب الآن', 'Play now')}
            </a>
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-200 font-bold transition-all"
            >
              <Shield className="w-5 h-5" />
              {t('لوحة الأدمن', 'Admin panel')}
            </a>
          </div>
          <p className="text-[11px] text-slate-500 mt-6">
            {t(
              '© 2025 ألعاب الغريب — منصة عربية للألعاب الجماعية. جميع الحقوق محفوظة.',
              '© 2025 Gharib Games — Arabic platform for social games. All rights reserved.'
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
