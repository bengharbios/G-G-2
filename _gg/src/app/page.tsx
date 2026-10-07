'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import EventsModal from '@/components/shared/EventsModal';
import YallaProfileDialog from '@/components/shared/YallaProfileDialog';
import SiteHeader from '@/components/shared/SiteHeader';
import SiteBottomNav from '@/components/shared/SiteBottomNav';
import { LoginModal, RegisterModal } from '@/components/AuthModals';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Gamepad2,
  Users,
  Bell,
  Home,
  Calendar,
  ShoppingBag,
  Radio,
  User,
  Play,
  Trophy,
  Gift,
  Sparkles,
  Flame,
  Star,
  ChevronLeft,
  Clock,
  Zap,
  Crown,
  Heart,
  Gem,
  RotateCcw,
  ArrowRight,
  Settings,
} from 'lucide-react';

// ─── Admin game config hook ───────────────────────────────────────────────────

interface AdminGameConfig {
  slug: string;
  name: string;
  icon: string;
  color: string;
  isComingSoon: boolean;
  isFree: boolean;
  playerRange: string;
  description: string;
  order: number;
  isEnabled: boolean;
}

function useAdminGameConfigs() {
  const [configs, setConfigs] = useState<AdminGameConfig[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/games-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.games && Array.isArray(data.games)) {
          setConfigs(data.games);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return { configs, loaded };
}

// ─── Game Data ────────────────────────────────────────────────────────────────

interface GameData {
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
  isFree: boolean;
}

const games: GameData[] = [
  {
    id: 'mafia',
    title: 'المافيا',
    titleEn: 'Mafia',
    emoji: '🕵️',
    description:
      'لعبة المافيا الكلاسيكية مع أدوار متعددة! اكتشف من هو المافيا قبل أن يسيطروا على المدينة.',
    href: '/mafia',
    bgImage: '/yalla-games/mafia.png',
    themeColor: 'text-red-400',
    themeBorder: 'border-red-500/30 hover:border-red-500/60',
    themeBg: 'from-red-950/80 to-red-900/40',
    themeBadge: 'bg-red-500/20 border-red-500/40 text-red-300',
    features: ['العراب', 'الديوانية', 'أدوار متعددة', 'تصويت ذكي'],
    status: 'available',
    players: '4-14 لاعب',
    category: 'اجتماعية',
    isFree: true,
  },
  {
    id: 'tobol',
    title: 'طبول الحرب',
    titleEn: 'War Drums',
    emoji: '🥁',
    description:
      'حرب استراتيجية حقيقية مع 64 سلاح و60 زر هجوم! خطط واستولِ على أراضي العدو.',
    href: '/tobol',
    bgImage: '/yalla-games/tobol.png',
    themeColor: 'text-orange-400',
    themeBorder: 'border-orange-500/30 hover:border-orange-500/60',
    themeBg: 'from-orange-950/80 to-red-900/40',
    themeBadge: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    features: ['العراب', '64 سلاح', '60 زر', 'هجوم وفخاخ'],
    status: 'available',
    players: '2-8 لاعب',
    category: 'حربية',
    isFree: true,
  },
  {
    id: 'tabot',
    title: 'الهروب من التابوت',
    titleEn: 'Escape the Coffin',
    emoji: '🪦',
    description:
      'هل تستطيع الهروب من التابوت قبل فوات الأوان؟ لعبة مليئة بالمفاجآت والرعب!',
    href: '/tabot',
    bgImage: '/yalla-games/tabot.png',
    themeColor: 'text-purple-400',
    themeBorder: 'border-purple-500/30 hover:border-purple-500/60',
    themeBg: 'from-purple-950/80 to-purple-900/40',
    themeBadge: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    features: ['العراب', 'الديوانية', 'فرق وقادة', 'أبواب مفاجأة'],
    status: 'available',
    players: '4-16 لاعب',
    category: 'رعب',
    isFree: true,
  },
  {
    id: 'prison',
    title: 'السجن',
    titleEn: 'The Prison',
    emoji: '🔒',
    description:
      'سجن مليء بالمفاجآت! حبس خصومك، حرر أصدقائك، وتجنب الإعدام في لعبة الاستراتيجية والحظ.',
    href: '/prison',
    bgImage: '/yalla-games/prison.png',
    themeColor: 'text-amber-400',
    themeBorder: 'border-amber-500/30 hover:border-amber-500/60',
    themeBg: 'from-amber-950/80 to-orange-900/40',
    themeBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    features: ['العراب', 'الديوانية', 'زنزانات مفاجأة', 'حبس وإعدام'],
    status: 'available',
    players: '4-16 لاعب',
    category: 'استراتيجية',
    isFree: true,
  },
  {
    id: 'risk',
    title: 'المجازفة',
    titleEn: 'Risk',
    emoji: '💣',
    description:
      'ادفع حظك! اسحب البطاقات واجمع النقاط، لكن احذر القنابل! لعبة استراتيجية ومجازفة ممتعة.',
    href: '/risk',
    bgImage: '/yalla-games/risk.png',
    themeColor: 'text-violet-400',
    themeBorder: 'border-violet-500/30 hover:border-violet-500/60',
    themeBg: 'from-violet-950/80 to-purple-900/40',
    themeBadge: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
    features: ['العراب', 'الديوانية', '2-4 فرق', 'قنابل ومجازفة'],
    status: 'available',
    players: '2-8 لاعب',
    category: 'مجازفة',
    isFree: true,
  },
  {
    id: 'risk2',
    title: 'المجازفة 2',
    titleEn: 'Risk 2',
    emoji: '🎴',
    description:
      'كاشف البطاقات! اختر أرقام مختلفة واحفظ نقاطك. 50 بطاقة و5 بطاقات خاصة ذهبية مضاعفة وقواعد مطابقة الأرقام.',
    href: '/risk2',
    bgImage: '/yalla-games/risk2.png',
    themeColor: 'text-orange-400',
    themeBorder: 'border-orange-500/30 hover:border-orange-500/60',
    themeBg: 'from-orange-950/80 to-red-900/40',
    themeBadge: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    features: ['العراب', 'الديوانية', '5 ألوان', 'مطابقة أرقام', 'بطاقات ذهبية مضاعفة'],
    status: 'available',
    players: '2-10 لاعب',
    category: 'مجازفة',
    isFree: true,
  },
  {
    id: 'baharharb',
    title: 'بحر و حرب',
    titleEn: 'Sea & War',
    emoji: '🌊⚔️',
    description:
      'لعبة ذكاء وكلمات عربية! أجب على الأسئلة واكشف الكلمات المشتركة. فريقين أو أفراد، 600+ سؤال متنوع.',
    href: '/baharharb',
    bgImage: '/yalla-games/baharharb.png',
    themeColor: 'text-teal-400',
    themeBorder: 'border-teal-500/30 hover:border-teal-500/60',
    themeBg: 'from-teal-950/80 to-cyan-900/40',
    themeBadge: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
    features: ['العراب', 'فرق أو أفراد', '600+ سؤال', 'أدوات سحب عشوائي'],
    status: 'available',
    players: '2-20 لاعب',
    category: 'ذكاء',
    isFree: true,
  },
  {
    id: 'shifarat',
    title: 'الشيفرات',
    titleEn: 'Shifarat',
    emoji: '🎯',
    description:
      'لعبة الشيفرات الحصرية! فكّر الشفرات وتوصّل لكلمات فريقك قبل نفاد الوقت. فريقين مع تصنيفات متنوعة.',
    href: '/shifarat',
    bgImage: '/yalla-games/shifarat.png',
    themeColor: 'text-emerald-400',
    themeBorder: 'border-emerald-500/30 hover:border-emerald-500/60',
    themeBg: 'from-emerald-950/80 to-teal-900/40',
    themeBadge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    features: ['العراب', 'الديوانية', 'فريقين', 'تصنيفات متنوعة'],
    status: 'available',
    players: '4-20 لاعب',
    category: 'ذكاء',
    isFree: true,
  },
  {
    id: 'familyfeud',
    title: 'فاميلي فيود',
    titleEn: 'Family Feud',
    emoji: '🏆',
    description:
      'لعبة فاميلي فيود الكلاسيكية! المستضيف يتحكم باللعبة ويرى الإجابات، الفريقين يتنافسون لتخمين الإجابات الأكثر شعبية.',
    href: '/familyfeud',
    bgImage: '/yalla-games/familyfeud.png',
    themeColor: 'text-amber-400',
    themeBorder: 'border-amber-500/30 hover:border-amber-500/60',
    themeBg: 'from-amber-950/80 to-rose-900/40',
    themeBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    features: ['العراب كمستضيف', 'الديوانية أونلاين', '95+ سؤال', 'جولة الجائزة المالية'],
    status: 'available',
    players: '2-10 لاعب',
    category: 'اجتماعية',
    isFree: true,
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
    isFree: true,
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
    isFree: true,
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
    isFree: true,
  },
];

// ─── Testimonials Data ──────────────────────────────────────────────────────

const testimonials = [
  {
    name: 'أحمد',
    location: 'الرياض 🇸🇦',
    text: 'لعبة فاميلي فيود مذهلة! سهرنا ونلعبها كل يوم مع العيلة 👨‍👩‍👧‍👦',
    rating: 5,
    avatar: '👨‍💻',
  },
  {
    name: 'سارة',
    location: 'جدة 🇸🇦',
    text: 'أحلى منصة ألعاب عربية، نلعب مع صحباتي من أي مكان 🎮',
    rating: 5,
    avatar: '👩‍🎓',
  },
  {
    name: 'خالد',
    location: 'الدمام 🇸🇦',
    text: 'لعبة المافيا تجنن! نسبة الفوز عندنا ٥٠/٥٠ كل مرة 😂',
    rating: 5,
    avatar: '👨‍🔧',
  },
];

// ─── Smooth Scroll Helper ───────────────────────────────────────────────────

function smoothScrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  const el = document.querySelector(id);
  el?.scrollIntoView({ behavior: 'smooth' });
}

// ─── Active Players Hook ─────────────────────────────────────────────────────

function useActivePlayers() {
  const [count, setCount] = useState(214);
  const [visible, setVisible] = useState(true);
  const countRef = useRef(214);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const changeCount = () => {
      setVisible(false);
      setTimeout(() => {
        const delta = randomBetween(-8, 8);
        const next = Math.max(142, Math.min(287, countRef.current + delta));
        setCount(next);
        setVisible(true);
      }, 300);
    };

    const timeout = setTimeout(changeCount, randomBetween(10000, 30000));
    const interval = setInterval(changeCount, randomBetween(10000, 30000));

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return { count, visible };
}

// ─── Events Data (auto-scroll banner) ────────────────────────────────────────

interface EventData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  eventType: string;
  gameSlug: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  badge: string;
  badgeColor: string;
}

function useActiveEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return { events, loaded };
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// ─── Auto-Scroll Banner ──────────────────────────────────────────────────────

const promoSlides = [
  { emoji: '🎪', title: 'بطولة المافيا الأسبوعية', subtitle: 'جائزة 500 💎 للفائز', bg: 'from-red-950 to-rose-950' },
  { emoji: '🔥', title: 'تحدي طبول الحرب', subtitle: 'تحدى أصدقائك الآن', bg: 'from-orange-950 to-amber-950' },
  { emoji: '🎁', title: 'مكافآت يومية مجانية', subtitle: 'سجل دخولك واكسب جوائز', bg: 'from-amber-950 to-yellow-950' },
  { emoji: '🏆', title: 'تصنيف أفضل اللاعبين', subtitle: 'نافس وتصدر لوحة المتصدرين', bg: 'from-emerald-950 to-teal-950' },
  { emoji: '⚡', title: 'لعبة جديدة قريباً', subtitle: 'ترقبوا مفاجآت قادمة', bg: 'from-purple-950 to-pink-950' },
];

function PromoBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isTouchingRef = useRef(false);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animId: number;
    let scrollPos = 0;
    const speed = 0.5;

    const step = () => {
      if (!isPaused && !isTouchingRef.current && autoScrollRef.current) {
        scrollPos += speed;
        if (scrollPos >= el.scrollWidth / 2) {
          scrollPos = 0;
        }
        el.scrollLeft = scrollPos;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  // Pause auto-scroll on touch, resume after 3s of no touch
  const handleTouchStart = useCallback(() => {
    isTouchingRef.current = true;
    autoScrollRef.current = false;
  }, []);
  const handleTouchEnd = useCallback(() => {
    isTouchingRef.current = false;
    // Resume auto-scroll after 3 seconds
    setTimeout(() => { autoScrollRef.current = true; }, 3000);
  }, []);

  // Duplicate slides for seamless loop
  const allSlides = [...promoSlides, ...promoSlides];

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none py-2 px-3 snap-x snap-mandatory"
        style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {allSlides.map((slide, i) => (
          <div
            key={i}
            className={`min-w-[260px] sm:min-w-[320px] flex-shrink-0 rounded-xl bg-gradient-to-l ${slide.bg} border border-white/5 p-4 cursor-default snap-start`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{slide.emoji}</span>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{slide.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{slide.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Edge fades - hidden during touch */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-10" />
    </div>
  );
}

// ─── Events Banner (API-driven) ──────────────────────────────────────────────

const badgeColorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  amber: { border: 'border-amber-500/40', bg: 'from-amber-500/10 to-amber-900/10', text: 'text-amber-300', glow: 'shadow-amber-500/10' },
  rose: { border: 'border-rose-500/40', bg: 'from-rose-500/10 to-rose-900/10', text: 'text-rose-300', glow: 'shadow-rose-500/10' },
  emerald: { border: 'border-emerald-500/40', bg: 'from-emerald-500/10 to-emerald-900/10', text: 'text-emerald-300', glow: 'shadow-emerald-500/10' },
  purple: { border: 'border-purple-500/40', bg: 'from-purple-500/10 to-purple-900/10', text: 'text-purple-300', glow: 'shadow-purple-500/10' },
};

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('انتهى'); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      if (days > 0) setTimeLeft(`${days}ي ${hours}س`);
      else if (hours > 0) setTimeLeft(`${hours}س ${mins}د`);
      else if (mins > 0) setTimeLeft(`${mins}د ${secs}ث`);
      else setTimeLeft(`${secs}ث`);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return <span className="text-[11px] font-bold text-slate-400">{timeLeft}</span>;
}

function EventsBannerSection() {
  const { events, loaded } = useActiveEvents();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isTouchingRef = useRef(false);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || events.length === 0) return;

    let animId: number;
    let scrollPos = 0;
    const speed = 0.4;

    const step = () => {
      if (!isPaused && !isTouchingRef.current && autoScrollRef.current) {
        scrollPos += speed;
        if (scrollPos >= el.scrollWidth / 2) {
          scrollPos = 0;
        }
        el.scrollLeft = scrollPos;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, events]);

  // Pause auto-scroll on touch, resume after 3s of no touch
  const handleTouchStart = useCallback(() => {
    isTouchingRef.current = true;
    autoScrollRef.current = false;
  }, []);
  const handleTouchEnd = useCallback(() => {
    isTouchingRef.current = false;
    setTimeout(() => { autoScrollRef.current = true; }, 3000);
  }, []);

  if (!loaded || events.length === 0) return <PromoBanner />;

  const allEvents = [...events, ...events];

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none py-2 px-3 snap-x snap-mandatory"
        style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {allEvents.map((event, i) => {
          const colors = badgeColorMap[event.badgeColor] || badgeColorMap.amber;
          return (
            <div
              key={`${event.id}-${i}`}
              className={`min-w-[260px] sm:min-w-[320px] flex-shrink-0 rounded-xl border ${colors.border} bg-gradient-to-l ${colors.bg} p-4 cursor-default shadow-lg ${colors.glow} snap-start`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{event.badge}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${colors.text} leading-tight mb-1`}>{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">{event.description}</p>
                  )}
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${colors.border} ${colors.text}`}>
                    <Clock className="w-3 h-3 ml-1 inline" />
                    <CountdownTimer endDate={event.endDate} />
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-10" />
    </div>
  );
}


// ─── Quick Actions Row ───────────────────────────────────────────────────────

function QuickActionsRow({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { toast } = useToast();

  // All quick actions shown only to logged-in users (store, events, etc. require auth)
  const actions = isLoggedIn ? [
    { icon: <Calendar className="w-5 h-5" />, label: 'الأحداث', emoji: '🎪', color: 'from-rose-500/20 to-orange-500/20 border-rose-500/30', textColor: 'text-rose-400' },
    { icon: <ShoppingBag className="w-5 h-5" />, label: 'المتجر', emoji: '🛍️', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30', textColor: 'text-amber-400' },
    { icon: <Trophy className="w-5 h-5" />, label: 'التصنيف', emoji: '🏆', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30', textColor: 'text-emerald-400' },
    { icon: <Gift className="w-5 h-5" />, label: 'ادعُ أصدقاءك', emoji: '🎁', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30', textColor: 'text-purple-400' },
    { icon: <Crown className="w-5 h-5" />, label: 'VIP', emoji: '👑', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30', textColor: 'text-yellow-400' },
  ] : [];

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 px-1">
      {actions.map((action, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
          onClick={() => toast({ title: `${action.emoji} ${action.label}`, description: 'قريباً...' })}
          className="flex flex-col items-center gap-1.5 min-w-[64px] group cursor-pointer"
        >
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} border flex items-center justify-center ${action.textColor} group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
            {action.icon}
          </div>
          <span className="text-[11px] text-slate-400 font-medium group-hover:text-slate-300 transition-colors whitespace-nowrap">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Daily Rewards Section ───────────────────────────────────────────────────

function DailyRewardsSection() {
  const { toast } = useToast();
  const [streak, setStreak] = useState(3);
  const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const todayIndex = new Date().getDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-l from-amber-950/40 via-slate-900/60 to-amber-950/40 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold text-amber-300">المكافآت اليومية</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">اليوم {streak}/7</span>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
          {days.map((day, i) => {
            const isClaimed = i < (todayIndex > 0 ? todayIndex - 1 : 6);
            const isToday = i === (todayIndex > 0 ? todayIndex - 1 : 6);
            const reward = i === 6 ? '🎁' : '💎';
            return (
              <button
                key={i}
                onClick={() => {
                  if (isToday) {
                    setStreak(prev => Math.min(prev + 1, 7));
                    toast({ title: '🎉 تم استلام المكافأة!', description: '💎 +50 جوهرة' });
                  }
                }}
                className={`flex flex-col items-center gap-1 min-w-[40px] sm:min-w-[48px] py-2 px-1 sm:px-2 rounded-xl transition-all ${
                  isClaimed
                    ? 'bg-amber-500/20 border border-amber-500/40'
                    : isToday
                      ? 'bg-gradient-to-b from-amber-500/30 to-amber-900/20 border border-amber-400/60 shadow-lg shadow-amber-500/10 hover:scale-105 cursor-pointer'
                      : 'bg-slate-800/40 border border-slate-700/30 opacity-50'
                }`}
              >
                <span className="text-xs sm:text-sm">{reward}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">{day.slice(0, 3)}</span>
                {isClaimed && <Heart className="w-3 h-3 text-amber-400" />}
                {isToday && !isClaimed && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
        {/* Streak progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-amber-400 to-orange-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(streak / 7) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Lucky Spin Card ─────────────────────────────────────────────────────────

function LuckySpinCard() {
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const newRotation = rotation + 720 + Math.random() * 360;
    setRotation(newRotation);
    setTimeout(() => {
      setIsSpinning(false);
      toast({
        title: '🎰 مبروك!',
        description: 'فزت بـ 100 💎 جوهرة!',
      });
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-2xl border border-rose-500/20 bg-gradient-to-l from-rose-950/40 via-slate-900/60 to-purple-950/40 p-4 sm:p-5 overflow-hidden relative"
    >
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="relative flex items-center gap-4">
        {/* Spin wheel visual */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0"
        >
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 3, ease: 'easeOut' }}
            className="w-full h-full rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 p-[3px] shadow-xl shadow-rose-500/20"
          >
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
              {/* Wheel segments (visual only) */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 origin-bottom-left bg-amber-500/20 rounded-tl-full" />
                <div className="absolute top-0 right-1/2 translate-x-1/2 w-1/2 h-1/2 origin-bottom-right bg-rose-500/20 rounded-tr-full" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/20 rounded-bl-full" />
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-emerald-500/20 rounded-br-full" />
              </div>
              <div className="relative z-10 text-center">
                <span className="text-2xl sm:text-3xl">🎰</span>
                <p className="text-[8px] sm:text-[9px] text-slate-300 font-bold mt-0.5">لف!</p>
              </div>
            </div>
          </motion.div>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <RotateCcw className={`w-4 h-4 text-rose-400 ${isSpinning ? 'animate-spin' : ''}`} />
            <h3 className="text-sm font-bold text-rose-300">عجلة الحظ</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-2">
            الفّ العجلة يومياً واكسب جوائز رائعة! 💎🎁
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
              <Clock className="w-3 h-3 ml-1 inline" />
              متاح مرة واحدة يومياً
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Game Card Component ──────────────────────────────────────────────────────

function GameCard({ game, index }: { game: GameData; index: number }) {
  const isAvailable = game.status === 'available';
  const isComingSoon = game.status === 'coming_soon';

  const gradientColors = isAvailable
    ? game.themeBorder.includes('red')
      ? ['#ef4444', '#a855f7', '#f59e0b', '#ef4444']
      : game.themeBorder.includes('orange')
        ? ['#f97316', '#ef4444', '#f59e0b', '#f97316']
        : game.themeBorder.includes('purple')
          ? ['#a855f7', '#6366f1', '#ec4899', '#a855f7']
          : game.themeBorder.includes('amber')
            ? ['#f59e0b', '#f97316', '#ef4444', '#f59e0b']
            : game.themeBorder.includes('violet')
              ? ['#8b5cf6', '#a855f7', '#6366f1', '#8b5cf6']
              : game.themeBorder.includes('teal')
                ? ['#14b8a6', '#10b981', '#f59e0b', '#14b8a6']
                : game.themeBorder.includes('emerald')
                  ? ['#10b981', '#14b8a6', '#059669', '#10b981']
                  : ['#ef4444', '#a855f7', '#f59e0b', '#ef4444']
    : null;

  return (
    <motion.div
      custom={index}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-30px' }}
    >
      <div
        className={`relative rounded-2xl p-[2px] ${
          isAvailable
            ? 'bg-gradient-to-br from-slate-700/50 via-slate-800/30 to-slate-700/50'
            : ''
        }`}
        style={
          isAvailable && gradientColors
            ? {
                background: `linear-gradient(var(--gradient-angle, 0deg), ${gradientColors.join(', ')})`,
                animation: 'card-border-spin 6s linear infinite',
              }
            : undefined
        }
      >
        <Link
          href={isAvailable && game.href ? game.href : '#games'}
          className={`group relative block rounded-[14px] border ${game.themeBorder} overflow-hidden transition-all duration-300 ${
            isAvailable
              ? 'hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1 cursor-pointer'
              : 'opacity-60 cursor-default pointer-events-none'
          }`}
          aria-label={isAvailable ? `العب ${game.title}` : `${game.title} قريباً`}
        >
          {/* Background Image Layer — أيقونات يلا تظهر كاملة مع تظليل سفلي للنص */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${game.themeBg}`}
            style={
              game.bgImage
                ? {
                    backgroundImage: `url(${game.bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {game.bgImage && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
            )}
          </div>

          {/* Coming Soon Overlay */}
          {isComingSoon && (
            <div className="absolute inset-0 z-5 bg-slate-950/30 backdrop-blur-[1px]" />
          )}

          {/* Content */}
          <div className="relative z-10 p-4 sm:p-5 flex flex-col min-h-[200px] sm:min-h-[230px]">
            {/* Top: Badge + Emoji */}
            <div className="flex items-start justify-between mb-2">
              <Badge
                className={`${game.themeBadge} text-[9px] sm:text-[10px] font-bold backdrop-blur-sm ${isComingSoon ? 'animate-pulse' : ''}`}
              >
                {isAvailable
                  ? game.isFree
                    ? '🟢 متاحة'
                    : '💎 VIP'
                  : '✨ قريباً'}
              </Badge>
              <motion.div
                className="text-3xl sm:text-4xl"
                whileHover={isAvailable ? { scale: 1.3, rotate: [0, -10, 10, 0] } : {}}
              >
                {game.emoji}
              </motion.div>
            </div>

            {/* Title */}
            <div className="mb-1">
              <h3 className={`text-base sm:text-lg font-black ${game.themeColor} leading-tight ${isComingSoon ? 'opacity-70' : ''}`}>
                {game.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500">{game.titleEn}</p>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1 mb-2">
              {game.description}
            </p>

            {/* Bottom: Players + Play button */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                <Users className="w-3 h-3" />
                {game.players}
              </span>
              {isAvailable ? (
                <motion.div
                  initial={false}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-white" />
                </motion.div>
              ) : (
                <motion.span
                  className="text-xs text-slate-500"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  🚧 قيد التطوير
                </motion.span>
              )}
            </div>
          </div>

          {/* Play Overlay on Hover (desktop) */}
          {isAvailable && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none">
              <motion.div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300"
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
              </motion.div>
            </div>
          )}
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Games Section ───────────────────────────────────────────────────────────

function GamesSection() {
  const { configs, loaded } = useAdminGameConfigs();

  const displayGames = loaded && configs.length > 0
    ? (() => {
        const adminOrderMap = new Map<string, number>();
        configs.forEach((c, i) => adminOrderMap.set(c.slug, c.order ?? i));

        const updated = games.map((g) => {
          const adminCfg = configs.find((c) => c.slug === g.id);
          if (adminCfg) {
            let status: GameData['status'] = g.status;
            if (adminCfg.isComingSoon) {
              status = 'coming_soon';
            } else if (!adminCfg.isEnabled) {
              status = 'coming_soon';
            } else {
              status = 'available';
            }

            return {
              ...g,
              status,
              title: adminCfg.name || g.title,
              isFree: adminCfg.isFree,
              description: adminCfg.description || g.description,
              icon: adminCfg.icon || g.emoji,
              players: adminCfg.playerRange ? `${adminCfg.playerRange} لاعب` : g.players,
            };
          }
          return g;
        });

        return updated.sort((a, b) => {
          const aOrder = adminOrderMap.get(a.id) ?? 999;
          const bOrder = adminOrderMap.get(b.id) ?? 999;
          return aOrder - bOrder;
        });
      })()
    : games;

  return (
    <section id="games" className="relative py-6 sm:py-10 bg-slate-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-black text-white">
              الألعاب
            </h2>
            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
              {displayGames.filter(g => g.status === 'available').length} متاحة
            </Badge>
          </div>
          <span className="text-xs text-slate-500">
            الكل ({displayGames.length})
          </span>
        </motion.div>

        {/* Games Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
        >
          {displayGames.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Bottom Navigation ───────────────────────────────────────────────────────

type BottomTab = 'home' | 'games' | 'events' | 'council' | 'profile';

function BottomNavigation({ eventsModalOpen, setEventsModalOpen, onProfileClick }: { eventsModalOpen: boolean; setEventsModalOpen: (open: boolean) => void; onProfileClick?: () => void }) {
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const { toast } = useToast();

  const tabs: { id: BottomTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { id: 'games', label: 'الألعاب', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'events', label: 'الأحداث', icon: <Calendar className="w-5 h-5" /> },
    { id: 'council', label: 'المجلس', icon: <Radio className="w-5 h-5" /> },
    { id: 'profile', label: 'الملف', icon: <User className="w-5 h-5" /> },
  ];

  const handleTabClick = (tabId: BottomTab) => {
    setActiveTab(tabId);

    if (tabId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tabId === 'games') {
      const el = document.querySelector('#games');
      el?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (tabId === 'events') {
      setEventsModalOpen(true);
      return;
    }

    if (tabId === 'council') {
      window.location.href = '/voice-rooms';
      return;
    }

    if (tabId === 'profile') {
      onProfileClick?.();
      return;
    }
  };

  const modalContent: Record<string, { title: string; description: string; icon: string }> = {
    store: { title: '🛍️ المتجر', description: 'قريباً! ستتمكن من شراء العناصر المميزة والعملات والمكافآت من المتجر.', icon: '🛍️' },
    council: { title: '🎙️ المجلس', description: 'غرف صوتية تفاعلية - تحدث مع أصدقائك مباشرة!', icon: '🎙️' },
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/40 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 relative min-w-[56px] ${
                  isActive
                    ? 'text-amber-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-1.5 w-8 h-0.5 rounded-full bg-amber-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Events Modal */}
      <EventsModal open={eventsModalOpen} onClose={() => setEventsModalOpen(false)} />

      {/* Generic Modals for Store & Profile */}
      <Dialog open={modalOpen !== null} onOpenChange={(open) => { if (!open) setModalOpen(null); }}>
        <DialogContent className="bg-slate-900 border-slate-800/60 sm:max-w-md">
          {modalOpen && modalContent[modalOpen] && (
            <>
              <DialogHeader className="text-center sm:text-center">
                <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <span className="text-2xl">{modalContent[modalOpen].icon}</span>
                  {modalContent[modalOpen].title.replace(/^[^\s]+\s/, '')}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-2 leading-relaxed">
                  {modalContent[modalOpen].description}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => {
                    toast({ title: '🔔 اشترك بالإشعارات', description: 'سنخبرك عند الإطلاق!' });
                    setModalOpen(null);
                  }}
                  className="bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  <Bell className="w-4 h-4 ml-2" />
                  أخبرني عند الإطلاق
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="relative pb-24">
      {/* Gradient line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 via-rose-500/40 to-transparent" />

      <div className="bg-gradient-to-b from-slate-950 to-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/15">
                <img
                  src="/platform-logo.png"
                  alt="ألعاب الغريب"
                  className="w-6 h-6 rounded-md object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML =
                      '<span class="text-white text-sm font-black">غ</span>';
                  }}
                />
              </div>
              <span className="text-base font-black bg-gradient-to-l from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                ألعاب الغريب
              </span>
            </div>

            <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            {/* Credits */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">💻 برمجة</span>
                <span className="text-xs font-bold bg-gradient-to-l from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  الغريب
                </span>
              </div>
              <span className="hidden sm:block text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">🏠 برعاية</span>
                <span className="text-xs font-bold bg-gradient-to-l from-amber-400 to-rose-400 bg-clip-text text-transparent">
                  ANA VIP 100034
                </span>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2">
              <button type="button" className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-sm hover:bg-slate-700/60 hover:scale-110 transition-all" aria-label="تابعنا">
                📱
              </button>
              <button type="button" className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-sm hover:bg-slate-700/60 hover:scale-110 transition-all" aria-label="انستغرام">
                📸
              </button>
              <button type="button" className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-sm hover:bg-slate-700/60 hover:scale-110 transition-all" aria-label="إشعارات">
                🔔
              </button>
            </div>

            <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            <p className="text-[11px] text-slate-600">
              © {new Date().getFullYear()} ألعاب الغريب — جميع الحقوق محفوظة
            </p>

            {/* Admin link removed for security - only accessible via /admin URL by admins */}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

// ─── Subscriber Profile Data Type ─────────────────────────────────────────

interface SubscriberProfileData {
  subscriber?: {
    name: string;
    email: string;
    phone: string;
    subscriptionCode: string;
    plan: string;
    allowedGames: string[];
    startDate: string;
    endDate: string;
    isTrial: boolean;
  };
  trialInfo?: {
    sessionsUsed: number;
    maxSessions: number;
    expiresAt: string;
  };
}

interface AuthUserData {
  id: string;
  username: string;
  email: string;
  displayName: string;
  phone: string;
  avatar: string;
  bio?: string;
  country?: string;
  role: string;
  numericId?: number | null;
}

export default function HomePage() {
  const [eventsModalOpen, setEventsModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<SubscriberProfileData | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUserData | null>(null);

  // Check auth session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setAuthUser(data.user);
        }
      })
      .catch(() => { /* silent */ });
  }, []);

  // Fetch subscriber profile data on mount
  useEffect(() => {
    const subCode = localStorage.getItem('gg_sub_code');
    if (!subCode) return;

    fetch('/api/subscription/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: subCode }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.subscriber) {
          setProfileData(data);
        }
      })
      .catch(() => { /* silent fail */ });
  }, []);

  const handleAuthSuccess = useCallback((user: AuthUserData) => {
    setAuthUser(user);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* silent */ }
    localStorage.removeItem('gg_sub_code');
    setAuthUser(null);
    setProfileData(null);
    window.location.reload();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <SiteHeader
        authUser={authUser}
        onProfileClick={() => setProfileOpen(true)}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Spacer for fixed header */}
      <div className="h-14 sm:h-16" />

      {/* الشعار أعلى الصفحة (منقول من الفوتر) */}
      <header className="pt-7 pb-3 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/15">
            <img
              src="/platform-logo.png"
              alt="ألعاب الغريب"
              className="w-10 h-10 rounded-lg object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML =
                  '<span class="text-white text-lg font-black">غ</span>';
              }}
            />
          </div>
          <span className="text-xl font-black bg-gradient-to-l from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </span>
        </div>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-24">
        {/* Games */}
        <GamesSection />
      </main>

      <SiteBottomNav activeTab="home" />

      {/* Auth Modals */}
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => setRegisterOpen(true)}
        onLoginSuccess={handleAuthSuccess}
      />
      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => setLoginOpen(true)}
        onRegisterSuccess={handleAuthSuccess}
      />

      {/* Yalla-styled Profile Dialog (dialog_user_info_v2) */}
      <YallaProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        authUser={authUser}
        subscriberCode={profileData?.subscriber?.subscriptionCode}
        subscriberPlan={profileData?.subscriber?.plan}
        isTrial={profileData?.subscriber?.isTrial}
        allowedGames={profileData?.subscriber?.allowedGames}
        onLoginClick={() => { setProfileOpen(false); setTimeout(() => setLoginOpen(true), 150); }}
        onRegisterClick={() => { setProfileOpen(false); setTimeout(() => setRegisterOpen(true), 150); }}
        onLogout={handleLogout}
        onProfileUpdated={(patch) => setAuthUser((u) => (u ? { ...u, ...patch } : u))}
      />

      {/* CSS keyframe for animated gradient border on cards */}
      <style jsx global>{`
        @property --gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes card-border-spin {
          to {
            --gradient-angle: 360deg;
          }
        }
        /* Hide scrollbar for horizontal scroll */
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Safe area for bottom nav (iOS) */
        .safe-area-pb {
          padding-bottom: max(0.375rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
