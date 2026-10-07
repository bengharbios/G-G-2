'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  Crown,
  Gift,
  Gamepad2,
  Clock,
  Calendar,
  Zap,
  LogOut,
  Shield,
  Copy,
  CheckCircle2,
  Timer,
  Trophy,
  Star,
  Fingerprint,
  Pencil,
  KeyRound,
  LogIn,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  phone: string;
  avatar: string;
  role: string;
}

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriberName?: string;
  subscriberEmail?: string;
  subscriberPhone?: string;
  subscriberCode?: string;
  subscriberPlan?: string; // 'free' | 'trial' | 'paid'
  allowedGames?: string[]; // array of game slugs
  startDate?: string;
  endDate?: string;
  trialSessionsUsed?: number;
  trialMaxSessions?: number;
  trialExpiresAt?: string;
  isTrial?: boolean;
  playerId?: string;
  playerLevel?: number;
  playerXP?: number;
  xpToNextLevel?: number;
  xpProgress?: number; // 0-100 percentage
  onLogout?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  authUser?: AuthUser | null;
}

interface XPData {
  playerId: string | null;
  total: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  isMaxLevel: boolean;
}

// ─── Game Configuration ──────────────────────────────────────────────

const GAMES_CONFIG: Record<string, { name: string; emoji: string; color: string }> = {
  mafia: { name: 'المافيا', emoji: '🕵️', color: 'from-red-500/20 to-red-600/5' },
  tobol: { name: 'طبول الحرب', emoji: '🥁', color: 'from-orange-500/20 to-orange-600/5' },
  tabot: { name: 'الهروب من التابوت', emoji: '⚰️', color: 'from-purple-500/20 to-purple-600/5' },
  prison: { name: 'السجن', emoji: '🔒', color: 'from-amber-500/20 to-amber-600/5' },
  risk: { name: 'المجازفة', emoji: '💣', color: 'from-violet-500/20 to-violet-600/5' },
  risk2: { name: 'المجازفة 2', emoji: '🎴', color: 'from-orange-500/20 to-orange-600/5' },
  familyfeud: { name: 'فاميلي فيود', emoji: '🏆', color: 'from-amber-500/20 to-amber-600/5' },
  baharharb: { name: 'بحر و حرب', emoji: '🌊⚔️', color: 'from-teal-500/20 to-teal-600/5' },
};

// ─── Level Tier Configuration ────────────────────────────────────────

function getLevelTier(level: number) {
  if (level >= 91) return {
    name: 'أسطوري',
    gradient: 'from-rose-500 to-red-600',
    gradientBg: 'from-rose-500/20 to-red-600/10',
    ringFrom: '#f43f5e',
    ringTo: '#dc2626',
    glowColor: 'rgba(244, 63, 94, 0.25)',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgLight: 'bg-rose-500/10',
  };
  if (level >= 61) return {
    name: 'ألماسي',
    gradient: 'from-violet-500 to-purple-600',
    gradientBg: 'from-violet-500/20 to-purple-600/10',
    ringFrom: '#8b5cf6',
    ringTo: '#7c3aed',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgLight: 'bg-violet-500/10',
  };
  if (level >= 31) return {
    name: 'ذهبي',
    gradient: 'from-amber-500 to-yellow-500',
    gradientBg: 'from-amber-500/20 to-yellow-500/10',
    ringFrom: '#f59e0b',
    ringTo: '#eab308',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-500/10',
  };
  if (level >= 11) return {
    name: 'فضي',
    gradient: 'from-emerald-500 to-green-600',
    gradientBg: 'from-emerald-500/20 to-green-600/10',
    ringFrom: '#10b981',
    ringTo: '#16a34a',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10',
  };
  return {
    name: 'مبتدئ',
    gradient: 'from-slate-400 to-slate-500',
    gradientBg: 'from-slate-400/20 to-slate-500/10',
    ringFrom: '#94a3b8',
    ringTo: '#64748b',
    glowColor: 'rgba(148, 163, 184, 0.2)',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30',
    bgLight: 'bg-slate-500/10',
  };
}

// ─── Plan Helpers ─────────────────────────────────────────────────────

function getPlanBadge(plan: string, isTrial?: boolean) {
  if (isTrial) {
    return {
      label: 'تجربة',
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
      textColor: 'text-violet-300',
      icon: <Gift className="w-3 h-3" />,
    };
  }
  switch (plan) {
    case 'paid':
      return {
        label: 'مميز',
        gradient: 'from-amber-500 to-yellow-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        textColor: 'text-amber-300',
        icon: <Crown className="w-3 h-3" />,
      };
    case 'free':
    default:
      return {
        label: 'مجاني',
        gradient: 'from-slate-400 to-slate-500',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        textColor: 'text-slate-400',
        icon: <User className="w-3 h-3" />,
      };
  }
}

// ─── Countdown Timer Hook ─────────────────────────────────────────────

function computeCountdown(targetDate: string) {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = Math.max(0, target - now);
  const expired = diff <= 0;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
    expired,
  };
}

const INITIAL_COUNTDOWN = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  total: 0,
  expired: true,
};

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState(INITIAL_COUNTDOWN);

  useEffect(() => {
    if (!targetDate) return;

    // Sync initial value via microtask to avoid synchronous setState in effect
    const id = requestAnimationFrame(() => {
      setTimeLeft(computeCountdown(targetDate));
    });

    const interval = setInterval(() => {
      setTimeLeft(computeCountdown(targetDate));
    }, 1000);

    return () => {
      cancelAnimationFrame(id);
      clearInterval(interval);
    };
  }, [targetDate]);

  return timeLeft;
}

// ─── Format Helpers ───────────────────────────────────────────────────

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getDaysRemaining(endDate: string | undefined): number {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num);
}

// ─── Motion Variants ──────────────────────────────────────────────────

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 30,
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

const gameCardVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

// ─── Countdown Display ────────────────────────────────────────────────

function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
  borderColor,
  warnDay,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  borderColor: string;
  warnDay?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {[
        { value: days, label: 'يوم', warn: warnDay && days <= 1 },
        { value: hours, label: 'ساعة' },
        { value: minutes, label: 'دقيقة' },
        { value: seconds, label: 'ثانية' },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg bg-slate-900/80 border ${unit.warn ? 'border-rose-500/30' : borderColor} flex items-center justify-center mb-0.5`}>
            <span className={`text-sm sm:text-lg font-black font-mono ${unit.warn ? 'text-rose-400' : 'text-white'}`}>
              {String(unit.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] text-slate-500">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Circular Level Badge ─────────────────────────────────────────────

function LevelRing({
  level,
  progress,
  tier,
}: {
  level: number;
  progress: number;
  tier: ReturnType<typeof getLevelTier>;
}) {
  const size = 96;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 16,
          height: size + 16,
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(circle, ${tier.glowColor}, transparent 70%)`,
          filter: 'blur(4px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <defs>
          <linearGradient id={`level-ring-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tier.ringFrom} />
            <stop offset="100%" stopColor={tier.ringTo} />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(30, 41, 59, 0.8)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#level-ring-${level})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white drop-shadow-lg">
          {level}
        </span>
      </div>
      {/* Tier label below */}
      <motion.span
        className={`mt-1.5 text-[10px] font-bold bg-gradient-to-l ${tier.gradient} bg-clip-text text-transparent`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        المستوى {level}
      </motion.span>
    </div>
  );
}

// ─── XP Section Skeleton ─────────────────────────────────────────────

function XPSkeleton() {
  return (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 space-y-4 animate-pulse">
      {/* Player ID row */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800" />
        <div className="h-4 w-32 rounded bg-slate-800" />
        <div className="w-7 h-7 rounded-lg bg-slate-800 mr-auto" />
      </div>
      <Separator className="bg-slate-800/60" />
      {/* Level + XP row */}
      <div className="flex items-center gap-5">
        <div className="w-24 h-24 rounded-full bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-20 rounded bg-slate-800" />
          <div className="h-2 w-full rounded-full bg-slate-800" />
          <div className="h-3 w-40 rounded bg-slate-800" />
          <div className="h-3 w-28 rounded bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

// ─── Login Prompt Component ──────────────────────────────────────────

function LoginPrompt({
  onLoginClick,
  onRegisterClick,
}: {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}) {
  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800/60 overflow-hidden" dir="rtl">
      {/* Top gradient */}
      <div className="relative h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-slate-800/60 via-slate-900/40 to-slate-950" />
        <motion.div
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #64748b, transparent)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Lock icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center"
          >
            <User className="w-8 h-8 text-slate-400" />
          </motion.div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-2"
        >
          <h2 className="text-xl font-black text-white">سجل دخولك للمتابعة</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            سجّل دخولك للاستمتاع بجميع الألعاب وتتبع مستواك وخبرتك
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-slate-300 text-xs">تتبع مستواك وخبرتك في كل لعبة</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-300 text-xs">الوصول لجميع الألعاب المتاحة</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-slate-300 text-xs">إدارة اشتراكك وملفك الشخصي</p>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <Button
            onClick={onLoginClick}
            className="w-full h-11 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm border border-emerald-500/20 transition-all shadow-lg shadow-emerald-500/10"
          >
            <LogIn className="w-4 h-4 ml-2" />
            تسجيل الدخول
          </Button>
          <Button
            onClick={onRegisterClick}
            variant="outline"
            className="w-full h-11 bg-slate-900/50 hover:bg-slate-800/50 text-slate-200 font-bold text-sm border border-slate-700/50 hover:border-slate-600/50 transition-all"
          >
            <UserPlus className="w-4 h-4 ml-2" />
            إنشاء حساب جديد
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export default function UserProfileModal({
  open,
  onOpenChange,
  subscriberName = '',
  subscriberEmail = '',
  subscriberPhone = '',
  subscriberCode = '',
  subscriberPlan = 'free',
  allowedGames = [],
  startDate,
  endDate,
  trialSessionsUsed = 0,
  trialMaxSessions = 1,
  trialExpiresAt,
  isTrial = false,
  onLogout,
  onLoginClick,
  onRegisterClick,
  authUser,
}: UserProfileModalProps) {
  const { toast } = useToast();
  const [codeCopied, setCodeCopied] = useState(false);
  const [playerIdCopied, setPlayerIdCopied] = useState(false);
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [xpLoading, setXpLoading] = useState(false);
  const [xpError, setXpError] = useState(false);

  // Edit profile state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Frames state
  const [userFrames, setUserFrames] = useState<Array<{
    id: string; frameId: string; isEquipped: boolean;
    frame: { id: string; nameAr: string; rarity: string; gradientFrom: string; gradientTo: string; borderColor: string; glowColor: string; pattern: string; };
  }>>([]);
  const [equippingFrameId, setEquippingFrameId] = useState<string | null>(null);

  const planBadge = getPlanBadge(subscriberPlan, isTrial);
  const daysRemaining = getDaysRemaining(endDate);
  const trialCountdown = useCountdown(trialExpiresAt);
  const subCountdown = useCountdown(endDate);

  // Initialize edit fields when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setEditDisplayName(authUser?.displayName ?? subscriberName ?? '');
      setEditPhone(authUser?.phone ?? subscriberPhone ?? '');
    }
  }, [isEditMode, authUser, subscriberName, subscriberPhone]);

  // Reset edit mode when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditMode(false);
      setShowChangePassword(false);
      setPasswordCurrent('');
      setPasswordNew('');
      setPasswordConfirm('');
    }
  }, [open]);

  // Fetch XP data when modal opens
  useEffect(() => {
    if (!open || !subscriberCode) return;

    let cancelled = false;

    async function fetchXP() {
      setXpLoading(true);
      setXpError(false);
      try {
        const res = await fetch(`/api/player/xp?code=${encodeURIComponent(subscriberCode)}`);
        if (cancelled) return;
        if (!res.ok) {
          setXpError(true);
          setXpLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.xp) {
          setXpData({
            playerId: data.playerId ?? null,
            total: data.xp.total ?? 0,
            level: data.xp.level ?? 1,
            currentLevelXP: data.xp.currentLevelXP ?? 0,
            nextLevelXP: data.xp.nextLevelXP ?? 0,
            progress: data.xp.progress ?? 0,
            isMaxLevel: data.xp.isMaxLevel ?? false,
          });
        }
      } catch {
        if (!cancelled) setXpError(true);
      } finally {
        if (!cancelled) setXpLoading(false);
      }
    }

    fetchXP();

    return () => {
      cancelled = true;
    };
  }, [open, subscriberCode]);

  // Fetch user frames when modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/frames')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) setUserFrames(data.userFrames || []);
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [open]);

  const equippedFrame = userFrames.find((f) => f.isEquipped) || null;

  const handleEquipFrame = useCallback(async (uf: typeof userFrames[number]) => {
    setEquippingFrameId(uf.frameId);
    try {
      if (uf.isEquipped) {
        const res = await fetch('/api/frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'equip', frameId: null }),
        });
        if (res.ok) setUserFrames((prev) => prev.map((f) => ({ ...f, isEquipped: false })));
      } else {
        const res = await fetch('/api/frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'equip', frameId: uf.frameId }),
        });
        if (res.ok) setUserFrames((prev) => prev.map((f) => ({ ...f, isEquipped: f.frameId === uf.frameId })));
      }
    } catch { /* silent */ }
    finally { setEquippingFrameId(null); }
  }, []);

  const resolvedGames = useMemo(() => {
    return allowedGames
      .map((slug) => ({
        slug,
        ...GAMES_CONFIG[slug],
      }))
      .filter((g) => g.name);
  }, [allowedGames]);

  const displayLevel = xpData?.level ?? 1;
  const displayProgress = xpData?.isMaxLevel ? 100 : (xpData?.progress ?? 0);
  const levelTier = getLevelTier(displayLevel);

  const handleCopyCode = useCallback(() => {
    if (!subscriberCode) return;
    navigator.clipboard.writeText(subscriberCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }, [subscriberCode]);

  const handleCopyPlayerId = useCallback(() => {
    if (!xpData?.playerId) return;
    navigator.clipboard.writeText(xpData.playerId).then(() => {
      setPlayerIdCopied(true);
      setTimeout(() => setPlayerIdCopied(false), 2000);
    });
  }, [xpData?.playerId]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('gg_sub_code');
    onLogout?.();
    onOpenChange(false);
  }, [onLogout, onOpenChange]);

  const handleSaveProfile = useCallback(async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName,
          phone: editPhone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'تم تحديث الملف الشخصي',
          description: 'تم حفظ التغييرات بنجاح',
          variant: 'default',
        });
        setIsEditMode(false);
      } else {
        toast({
          title: 'خطأ في التحديث',
          description: data.error || 'حدث خطأ أثناء حفظ التغييرات',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تعذر الاتصال بالخادم',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  }, [editDisplayName, editPhone, toast]);

  const handleChangePassword = useCallback(async () => {
    if (!passwordCurrent || !passwordNew || !passwordConfirm) {
      toast({
        title: 'حقول مطلوبة',
        description: 'يرجى ملء جميع حقول كلمة المرور',
        variant: 'destructive',
      });
      return;
    }
    if (passwordNew !== passwordConfirm) {
      toast({
        title: 'كلمات المرور غير متطابقة',
        description: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين',
        variant: 'destructive',
      });
      return;
    }
    if (passwordNew.length < 6) {
      toast({
        title: 'كلمة مرور ضعيفة',
        description: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordCurrent,
          newPassword: passwordNew,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'تم تغيير كلمة المرور',
          description: 'تم تحديث كلمة المرور بنجاح',
          variant: 'default',
        });
        setShowChangePassword(false);
        setPasswordCurrent('');
        setPasswordNew('');
        setPasswordConfirm('');
      } else {
        toast({
          title: 'خطأ في التغيير',
          description: data.error || 'حدث خطأ أثناء تغيير كلمة المرور',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تعذر الاتصال بالخادم',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordCurrent, passwordNew, passwordConfirm, toast]);

  // ── Login Prompt View ──
  if (!authUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[400px] p-0 overflow-hidden border-0 bg-transparent"
          showCloseButton={false}
        >
          <AnimatePresence mode="wait">
            {open && (
              <motion.div
                key="login-prompt"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <LoginPrompt onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />
              </motion.div>
            )}
          </AnimatePresence>
          <DialogHeader className="sr-only">
            <DialogTitle>تسجيل الدخول</DialogTitle>
            <DialogDescription>سجل دخولك للمتابعة</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Authenticated Profile View ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-0 overflow-hidden border-0 bg-transparent"
        showCloseButton={false}
      >
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="profile-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative flex flex-col"
              dir="rtl"
            >
              {/* ── Top Gradient Accent ── */}
              <div className="relative h-28 sm:h-32 overflow-hidden rounded-t-2xl">
                <div
                  className={`absolute inset-0 bg-gradient-to-bl ${isTrial ? 'from-violet-900/80 via-purple-900/60 to-slate-950' : subscriberPlan === 'paid' ? 'from-amber-900/80 via-orange-900/50 to-slate-950' : 'from-slate-800/60 via-slate-900/40 to-slate-950'}`}
                />
                {/* Decorative circles */}
                <motion.div
                  className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10"
                  style={{
                    background: isTrial
                      ? 'radial-gradient(circle, #8b5cf6, transparent)'
                      : subscriberPlan === 'paid'
                        ? 'radial-gradient(circle, #f59e0b, transparent)'
                        : 'radial-gradient(circle, #64748b, transparent)',
                  }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                />
                <motion.div
                  className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10"
                  style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
                  transition={{ repeat: Infinity, duration: 5, delay: 1 }}
                />
                {/* Grid pattern */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                {/* Close button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/50 transition-all z-10"
                >
                  <span className="text-lg leading-none">✕</span>
                </button>
              </div>

              {/* ── Avatar (overlapping header) ── */}
              <div className="absolute top-[72px] sm:top-[80px] right-6 z-10">
                <motion.div variants={itemVariants} className="relative">
                  {/* Glow ring */}
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${planBadge.gradient} opacity-40 blur-sm`} />
                  {/* Avatar */}
                  <div
                    className={`relative w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full bg-gradient-to-br ${planBadge.gradient} flex items-center justify-center border-4 border-slate-950 shadow-2xl overflow-hidden`}
                  >
                    {authUser.avatar ? (
                      <img
                        src={authUser.avatar}
                        alt={authUser.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                        {authUser.displayName ? authUser.displayName.charAt(0).toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                  {/* Plan badge */}
                  <div className="absolute -bottom-1 -left-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700/50 shadow-lg">
                    <span className={`bg-gradient-to-l ${planBadge.gradient} bg-clip-text text-transparent text-[10px] font-bold`}>
                      {planBadge.label}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* ── Content ── */}
              <div className="bg-slate-950 rounded-b-2xl border border-slate-800/60 border-t-0 overflow-hidden">
                <div className="p-4 sm:p-6 pt-14 sm:pt-16 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.5); }
                  `}</style>
                  <motion.div variants={itemVariants} className="space-y-5">
                    {/* ── User Name + Edit Button ── */}
                    <div className="flex items-start justify-between gap-2 pr-1">
                      <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                          {authUser.displayName || subscriberName || 'مستخدم'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">عضو في ألعاب الغريب</p>
                      </div>
                      {!isEditMode && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsEditMode(true)}
                          className="shrink-0 w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-slate-800 transition-all"
                          title="تعديل الملف الشخصي"
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                      )}
                      {isEditMode && (
                        <motion.button
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsEditMode(false)}
                          className="shrink-0 w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all"
                          title="إلغاء التعديل"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>

                    {/* ── Edit Profile Mode ── */}
                    <AnimatePresence>
                      {isEditMode && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            variants={itemVariants}
                            className="bg-gradient-to-br from-amber-950/30 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 space-y-4"
                          >
                            <div className="flex items-center gap-2">
                              <Pencil className="w-4 h-4 text-amber-400" />
                              <h3 className="text-sm font-bold text-amber-200">تعديل الملف الشخصي</h3>
                            </div>

                            {/* Display Name */}
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400">الاسم المعروض</Label>
                              <Input
                                value={editDisplayName}
                                onChange={(e) => setEditDisplayName(e.target.value)}
                                placeholder="أدخل اسمك المعروض"
                                className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20"
                                dir="rtl"
                              />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400">رقم الهاتف</Label>
                              <Input
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                placeholder="أدخل رقم هاتفك"
                                className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20"
                                dir="ltr"
                                type="tel"
                              />
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="flex-1 h-10 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs border border-amber-500/20 transition-all disabled:opacity-50"
                              >
                                {isSavingProfile ? (
                                  <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 ml-1.5" />
                                )}
                                حفظ التغييرات
                              </Button>
                              <Button
                                onClick={() => setIsEditMode(false)}
                                variant="outline"
                                disabled={isSavingProfile}
                                className="h-10 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-bold text-xs border border-slate-700/50 transition-all px-4"
                              >
                                إلغاء
                              </Button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── User Info Card ── */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 space-y-3"
                    >
                      {/* Email */}
                      {subscriberEmail && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 mb-0.5">البريد الإلكتروني</p>
                            <p className="text-slate-200 text-xs truncate" dir="ltr">{subscriberEmail}</p>
                          </div>
                        </div>
                      )}

                      {/* Phone */}
                      {(subscriberPhone || authUser.phone) && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 mb-0.5">رقم الهاتف</p>
                            <p className="text-slate-200 text-xs" dir="ltr">{subscriberPhone || authUser.phone}</p>
                          </div>
                        </div>
                      )}

                      {/* Subscription Code */}
                      {subscriberCode && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-slate-500 mb-0.5">كود الاشتراك</p>
                            <p className="text-slate-200 text-xs font-mono tracking-wider" dir="ltr">{subscriberCode}</p>
                          </div>
                          <button
                            onClick={handleCopyCode}
                            className="shrink-0 w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                          >
                            {codeCopied ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>

                    {/* ── Change Password Section ── */}
                    <motion.div variants={itemVariants}>
                      <AnimatePresence mode="wait">
                        {!showChangePassword ? (
                          <motion.button
                            key="pw-toggle-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowChangePassword(true)}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/60 hover:bg-slate-900/80 rounded-xl p-3 text-slate-400 hover:text-slate-200 transition-all group"
                          >
                            <KeyRound className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                            <span className="text-sm font-medium">تغيير كلمة المرور</span>
                          </motion.button>
                        ) : (
                          <motion.div
                            key="pw-form"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-sm border border-slate-700/40 rounded-xl p-4 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <KeyRound className="w-4 h-4 text-amber-400" />
                                  <h3 className="text-sm font-bold text-white">تغيير كلمة المرور</h3>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setShowChangePassword(false);
                                    setPasswordCurrent('');
                                    setPasswordNew('');
                                    setPasswordConfirm('');
                                  }}
                                  className="w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>

                              {/* Current Password */}
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-400">كلمة المرور الحالية</Label>
                                <div className="relative">
                                  <Input
                                    type={showCurrentPw ? 'text' : 'password'}
                                    value={passwordCurrent}
                                    onChange={(e) => setPasswordCurrent(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-9 bg-slate-800/60 border-slate-700/50 text-white text-xs placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 pl-10"
                                    dir="ltr"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                  >
                                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* New Password */}
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-400">كلمة المرور الجديدة</Label>
                                <div className="relative">
                                  <Input
                                    type={showNewPw ? 'text' : 'password'}
                                    value={passwordNew}
                                    onChange={(e) => setPasswordNew(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-9 bg-slate-800/60 border-slate-700/50 text-white text-xs placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 pl-10"
                                    dir="ltr"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowNewPw(!showNewPw)}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                  >
                                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Confirm New Password */}
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-400">تأكيد كلمة المرور الجديدة</Label>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPw ? 'text' : 'password'}
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-9 bg-slate-800/60 border-slate-700/50 text-white text-xs placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 pl-10"
                                    dir="ltr"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                  >
                                    {showConfirmPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Password mismatch warning */}
                              {passwordConfirm && passwordNew !== passwordConfirm && (
                                <motion.p
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-[10px] text-rose-400 flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  كلمات المرور غير متطابقتين
                                </motion.p>
                              )}

                              {/* Update button */}
                              <Button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword || !passwordCurrent || !passwordNew || !passwordConfirm}
                                className="w-full h-9 bg-gradient-to-l from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs border border-amber-500/20 transition-all disabled:opacity-40"
                              >
                                {isChangingPassword ? (
                                  <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                                )}
                                تحديث كلمة المرور
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* ── Level & XP Section ── */}
                    {xpLoading ? (
                      <XPSkeleton />
                    ) : xpData ? (
                      <motion.div
                        variants={itemVariants}
                        className="bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 space-y-4"
                      >
                        {/* Section header */}
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md ${levelTier.bgLight} flex items-center justify-center`}>
                            <Trophy className={`w-3.5 h-3.5 ${levelTier.textColor}`} />
                          </div>
                          <h3 className="text-sm font-bold text-white">المستوى والخبرة</h3>
                          {/* Max level badge */}
                          {xpData.isMaxLevel && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.6, type: 'spring' }}
                            >
                              <Badge className="bg-gradient-to-l from-rose-500/20 to-red-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold gap-1">
                                <Star className="w-3 h-3 fill-rose-400 text-rose-400" />
                                أقصى مستوى!
                              </Badge>
                            </motion.div>
                          )}
                        </div>

                        {/* Player ID badge */}
                        {xpData.playerId && (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center shrink-0">
                              <Fingerprint className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-slate-500 mb-0.5">رقم اللاعب</p>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-xs tracking-widest ${levelTier.bgLight} ${levelTier.borderColor} ${levelTier.textColor} border`}
                                >
                                  #{String(xpData.playerId).padStart(5, '0')}
                                </Badge>
                              </div>
                            </div>
                            <button
                              onClick={handleCopyPlayerId}
                              className="shrink-0 w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                              title="نسخ رقم اللاعب"
                            >
                              {playerIdCopied ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        <Separator className="bg-slate-800/60" />

                        {/* Level ring + XP details */}
                        <div className="flex items-center gap-5">
                          {/* Level badge */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                            className="shrink-0"
                          >
                            <LevelRing
                              level={displayLevel}
                              progress={displayProgress}
                              tier={levelTier}
                            />
                          </motion.div>

                          {/* XP info */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Tier name */}
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${levelTier.textColor}`}>
                                {levelTier.name}
                              </span>
                              {displayLevel >= 61 && (
                                <motion.span
                                  animate={{ rotate: [0, 15, -15, 0] }}
                                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                                >
                                  <Star className={`w-3.5 h-3.5 ${levelTier.textColor}`} />
                                </motion.span>
                              )}
                            </div>

                            {/* XP progress bar */}
                            {!xpData.isMaxLevel && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-400">
                                    {formatNumber(xpData.currentLevelXP)} / {formatNumber(xpData.nextLevelXP)} XP
                                  </span>
                                  <span className="text-slate-500">للمستوى التالي</span>
                                </div>
                                <div className="relative h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
                                  <motion.div
                                    className={`absolute inset-y-0 right-0 rounded-full bg-gradient-to-l ${levelTier.gradient}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, displayProgress)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                                  />
                                  {/* Shimmer effect */}
                                  <motion.div
                                    className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-white/10 to-transparent"
                                    style={{ width: `${Math.min(100, displayProgress)}%` }}
                                    animate={{ opacity: [0, 0.5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {Math.round(displayProgress)}%
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Max level display */}
                            {xpData.isMaxLevel && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="space-y-1.5"
                              >
                                <p className="text-[10px] text-slate-400">وصلت إلى أعلى مستوى</p>
                                <div className="h-2.5 rounded-full bg-gradient-to-l from-rose-500 to-red-600" />
                              </motion.div>
                            )}

                            {/* Total XP */}
                            <div className="flex items-center gap-1.5">
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span className="text-[11px] text-slate-400">
                                إجمالي الخبرة:{' '}
                                <span className="text-amber-300 font-bold">{formatNumber(xpData.total)}</span>{' '}
                                XP
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : xpError ? null : null}

                    {/* ── Subscription Details ── */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 space-y-3.5"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded-md ${planBadge.bg} flex items-center justify-center ${planBadge.textColor}`}>
                          {planBadge.icon}
                        </div>
                        <h3 className="text-sm font-bold text-white">تفاصيل الاشتراك</h3>
                      </div>

                      {/* Plan type + Days */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-500 mb-1">نوع الاشتراك</p>
                          <Badge className={`${planBadge.bg} ${planBadge.border} ${planBadge.textColor} text-xs border`}>
                            {planBadge.label}
                          </Badge>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-500 mb-1">الأيام المتبقية</p>
                          <p className={`text-lg font-black ${daysRemaining <= 7 && daysRemaining > 0 ? 'text-amber-400' : daysRemaining === 0 ? 'text-rose-400' : 'text-white'}`}>
                            {daysRemaining > 0 ? daysRemaining : '∞'}
                          </p>
                        </div>
                      </div>

                      {/* Dates */}
                      {(startDate || endDate) && (
                        <div className="grid grid-cols-2 gap-2.5">
                          {startDate && (
                            <div className="flex items-center gap-2 bg-slate-800/40 rounded-lg p-2.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[9px] text-slate-500">تاريخ البدء</p>
                                <p className="text-[11px] text-slate-300 truncate">{formatDate(startDate)}</p>
                              </div>
                            </div>
                          )}
                          {endDate && (
                            <div className="flex items-center gap-2 bg-slate-800/40 rounded-lg p-2.5">
                              <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[9px] text-slate-500">تاريخ الانتهاء</p>
                                <p className="text-[11px] text-slate-300 truncate">{formatDate(endDate)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Subscription countdown */}
                      {endDate && daysRemaining > 0 && !isTrial && (
                        <motion.div
                          className="bg-slate-800/40 rounded-lg p-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <p className="text-[10px] text-slate-500 mb-2 text-center">العد التنازلي للانتهاء</p>
                          <CountdownDisplay
                            days={subCountdown.days}
                            hours={subCountdown.hours}
                            minutes={subCountdown.minutes}
                            seconds={subCountdown.seconds}
                            borderColor="border-slate-700/40"
                          />
                        </motion.div>
                      )}
                    </motion.div>

                    {/* ── Trial Info ── */}
                    {isTrial && (
                      <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-violet-950/40 to-purple-950/20 backdrop-blur-sm border border-violet-500/20 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="w-4 h-4 text-violet-400" />
                          <h3 className="text-sm font-bold text-violet-200">معلومات التجربة</h3>
                        </div>

                        {/* Sessions progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">الجولات المستخدمة</span>
                            <span className="text-white font-bold">
                              {trialSessionsUsed} / {trialMaxSessions}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, (trialSessionsUsed / Math.max(1, trialMaxSessions)) * 100)}
                            className="h-2 bg-slate-800/80 [&>div]:bg-gradient-to-l [&>div]:from-violet-500 [&>div]:to-purple-500"
                          />
                        </div>

                        {/* Trial countdown */}
                        {trialExpiresAt && !trialCountdown.expired && (
                          <div className="mt-2">
                            <p className="text-[10px] text-slate-500 mb-2 text-center">انتهاء التجربة</p>
                            <CountdownDisplay
                              days={trialCountdown.days}
                              hours={trialCountdown.hours}
                              minutes={trialCountdown.minutes}
                              seconds={trialCountdown.seconds}
                              borderColor="border-violet-500/20"
                              warnDay
                            />
                          </div>
                        )}

                        {trialCountdown.expired && trialExpiresAt && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-center">
                            <p className="text-xs text-rose-400 font-bold">انتهت فترة التجربة</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── Allowed Games ── */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-white">الألعاب المتاحة</h3>
                        <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 mr-auto">
                          {resolvedGames.length} لعبة
                        </Badge>
                      </div>

                      {resolvedGames.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2.5">
                          {resolvedGames.map((game) => (
                            <motion.div
                              key={game.slug}
                              variants={gameCardVariants}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/40 hover:border-amber-500/30 rounded-xl p-3.5 text-center cursor-default transition-colors group"
                            >
                              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                                {game.emoji}
                              </div>
                              <p className="text-xs font-bold text-white leading-tight">{game.name}</p>
                              <div className="mt-2 flex items-center justify-center gap-1">
                                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                                <span className="text-[9px] text-emerald-400 font-medium">متاح</span>
                              </div>
                              {/* Hover gradient */}
                              <div
                                className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                              />
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6 text-center">
                          <Gamepad2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">لا توجد ألعاب متاحة</p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                </div>

                {/* ── Frames Gallery ── */}
                <motion.div variants={itemVariants}>
                  <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/20 flex items-center justify-center">
                          <span className="text-sm">🖼️</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">الإطارات</h3>
                          <p className="text-[10px] text-slate-500">{userFrames.length} إطار</p>
                        </div>
                      </div>
                      {userFrames.length > 0 && (
                        <button
                          onClick={() => { onOpenChange(false); window.location.href = '/profile'; }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-medium"
                        >
                          عرض الكل ←
                        </button>
                      )}
                    </div>
                    {userFrames.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-500">لا تملك أي إطارات بعد</p>
                      </div>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {userFrames.slice(0, 6).map((uf) => {
                          const isEquipping = equippingFrameId === uf.frameId;
                          return (
                            <motion.button
                              key={uf.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEquipFrame(uf)}
                              disabled={isEquipping}
                              className={`relative flex-shrink-0 p-2 rounded-lg transition-all ${
                                uf.isEquipped
                                  ? 'bg-emerald-950/30 border-2 border-emerald-500/40'
                                  : 'bg-slate-800/40 border border-slate-700/30'
                              }`}
                            >
                              <div className="relative w-12 h-12 mx-auto mb-1">
                                <div
                                  className="absolute -inset-0.5 rounded-full"
                                  style={{
                                    background: `linear-gradient(135deg, ${uf.frame.gradientFrom}, ${uf.frame.gradientTo})`,
                                    padding: '2px',
                                  }}
                                >
                                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <span className="text-sm font-bold text-slate-400">
                                      {authUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                </div>
                                {uf.isEquipped && (
                                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                  </div>
                                )}
                                {isEquipping && (
                                  <div className="absolute inset-0 rounded-full bg-slate-950/60 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                  </div>
                                )}
                              </div>
                              <p className={`text-[9px] font-bold text-center truncate ${uf.isEquipped ? 'text-emerald-300' : 'text-slate-400'}`}>
                                {uf.frame.nameAr}
                              </p>
                            </motion.button>
                          );
                        })}
                        {userFrames.length > 6 && (
                          <button
                            onClick={() => { onOpenChange(false); window.location.href = '/profile'; }}
                            className="flex-shrink-0 w-[56px] rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-center"
                          >
                            <span className="text-xs text-slate-400">+{userFrames.length - 6}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* ── View Full Profile Link ── */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => { onOpenChange(false); window.location.href = '/profile'; }}
                    className="w-full py-3 rounded-xl bg-gradient-to-l from-amber-950/40 to-slate-900/40 border border-amber-500/20 hover:border-amber-500/40 hover:from-amber-950/60 transition-all flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-300">عرض الملف الشخصي الكامل</span>
                  </button>
                </motion.div>

                {/* ── Logout Footer ── */}
                <div className="border-t border-slate-800/60 p-4 bg-slate-950/95 backdrop-blur-sm">
                  <Button
                    onClick={handleLogout}
                    className="w-full h-11 bg-gradient-to-l from-rose-600/80 to-rose-700/80 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm border border-rose-500/20 transition-all shadow-lg shadow-rose-500/10"
                  >
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل الخروج
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden a11y title */}
        <DialogHeader className="sr-only">
          <DialogTitle>الملف الشخصي</DialogTitle>
          <DialogDescription>عرض معلومات المستخدم والاشتراك</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
