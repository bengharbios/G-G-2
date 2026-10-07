'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Crown,
  Gift,
  Gamepad2,
  Clock,
  Calendar,
  Shield,
  Copy,
  CheckCircle2,
  Gem,
  Trophy,
  Star,
  Pencil,
  KeyRound,
  LogOut,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Settings,
  Fingerprint,
  TrendingUp,
  Camera,
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
  subscriptionId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface SubscriptionData {
  name: string;
  email: string;
  phone: string;
  subscriptionCode: string;
  plan: string;
  isTrial: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  expiresAt: string | null;
  allowedGames: string[];
  allowedGamesInfo: Array<{ slug: string; name: string; emoji: string; color: string } | null>;
  daysRemaining: number;
  gemsBalance: number;
}

interface TrialInfo {
  sessionsUsed: number;
  maxSessions: number;
  expiresAt: string | null;
  daysLeft: number;
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

// ─── Format Helpers ───────────────────────────────────────────────────

function formatDate(dateStr: string | undefined | null): string {
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

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num);
}

// ─── Countdown Timer Hook ─────────────────────────────────────────────

function useCountdown(targetDate: string | undefined | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: diff <= 0,
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// ─── Animation Variants ───────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── Countdown Display ────────────────────────────────────────────────

function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
  expired,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}) {
  if (expired) {
    return <span className="text-sm text-rose-400 font-bold">منتهي الصلاحية</span>;
  }
  return (
    <div className="flex items-center justify-center gap-1.5" dir="ltr">
      {[
        { value: days, label: 'ي' },
        { value: hours, label: 'س' },
        { value: minutes, label: 'د' },
        { value: seconds, label: 'ث' },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <div className="w-10 h-10 rounded-lg bg-slate-900/80 border border-amber-500/20 flex items-center justify-center">
            <span className="text-sm font-black font-mono text-white">
              {String(unit.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] text-slate-500 mt-0.5 block">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Large Avatar Ring Component ──────────────────────────────────────

function AvatarLevelRing({
  level,
  progress,
  tier,
  avatarUrl,
  avatarLetter,
  equippedFrame,
  children,
}: {
  level: number;
  progress: number;
  tier: ReturnType<typeof getLevelTier>;
  avatarUrl?: string | null;
  avatarLetter: string;
  equippedFrame?: {
    gradientFrom: string;
    gradientTo: string;
    glowColor: string;
    borderColor: string;
    pattern: string;
  } | null;
  children?: React.ReactNode;
}) {
  const ringSize = 148;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const avatarSize = 96;
  const frameOffset = equippedFrame ? 6 : 0;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: ringSize + 30,
          height: ringSize + 30,
          background: `radial-gradient(circle, ${tier.glowColor}, transparent 70%)`,
          filter: 'blur(10px)',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />

      {/* Frame glow (behind ring) */}
      {equippedFrame && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: avatarSize + frameOffset * 2 + 12,
            height: avatarSize + frameOffset * 2 + 12,
            background: `linear-gradient(135deg, ${equippedFrame.gradientFrom}, ${equippedFrame.gradientTo})`,
            filter: 'blur(8px)',
          }}
          animate={equippedFrame.pattern === 'animated' ? {
            opacity: [0.3, 0.6, 0.3],
          } : { opacity: 0.4 }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        />
      )}

      {/* SVG Level Ring */}
      <svg width={ringSize} height={ringSize} className="transform -rotate-90 drop-shadow-lg relative z-10">
        <defs>
          <linearGradient id={`game-level-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tier.ringFrom} />
            <stop offset="100%" stopColor={tier.ringTo} />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(15, 23, 42, 0.8)"
          strokeWidth={strokeWidth}
        />
        {/* Decorative inner ring */}
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius - strokeWidth - 2}
          fill="none"
          stroke="rgba(51, 65, 85, 0.2)"
          strokeWidth={1}
        />
        {/* Progress arc */}
        <motion.circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="url(#game-level-ring)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
        />
        {/* Glowing dot at progress end */}
        <motion.circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth + 4}
          stroke="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
          style={{ filter: `drop-shadow(0 0 6px ${tier.ringFrom})` }}
        />
      </svg>

      {/* Avatar container (centered on top of ring) */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        {/* Equipped frame border */}
        {equippedFrame && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: avatarSize + frameOffset * 2,
              height: avatarSize + frameOffset * 2,
              background: `linear-gradient(135deg, ${equippedFrame.gradientFrom}, ${equippedFrame.gradientTo})`,
              boxShadow: equippedFrame.pattern === 'animated'
                ? `0 0 16px ${equippedFrame.glowColor}, 0 0 32px ${equippedFrame.glowColor}`
                : `0 0 10px ${equippedFrame.glowColor}`,
            }}
            animate={equippedFrame.pattern === 'animated' ? {
              boxShadow: [
                `0 0 16px ${equippedFrame.glowColor}, 0 0 32px ${equippedFrame.glowColor}`,
                `0 0 24px ${equippedFrame.glowColor}, 0 0 48px ${equippedFrame.glowColor}`,
                `0 0 16px ${equippedFrame.glowColor}, 0 0 32px ${equippedFrame.glowColor}`,
              ],
            } : {}}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            {equippedFrame.pattern === 'double' && (
              <div className="absolute inset-0 rounded-full" style={{
                border: '2px solid ' + equippedFrame.borderColor,
                background: 'transparent',
                margin: '4px',
              }} />
            )}
          </motion.div>
        )}
        <div
          className="rounded-full overflow-hidden border-[3px] border-slate-950 shadow-2xl flex items-center justify-center bg-slate-800"
          style={{ width: avatarSize, height: avatarSize }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="الملف الشخصي" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-black text-white drop-shadow-lg">
              {avatarLetter.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Level badge at bottom of ring */}
      <motion.div
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 400 }}
        className="absolute -bottom-3 z-30"
      >
        <div className="relative">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg`}
            style={{ boxShadow: `0 0 16px ${tier.glowColor}` }}
          >
            <Shield className="w-4 h-4 text-white/60 absolute -top-1 right-1" />
            <span className="text-lg font-black text-white drop-shadow-lg">{level}</span>
          </div>
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900 border ${tier.borderColor}`}>
            <span className={`text-[9px] font-bold bg-gradient-to-l ${tier.gradient} bg-clip-text text-transparent whitespace-nowrap`}>
              {tier.name}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Collapsible Section Component ────────────────────────────────────

function CollapsibleSection({
  icon,
  title,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Separator className="bg-slate-800/60" />
            <div className="p-4 sm:p-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-6 w-32 rounded-lg bg-slate-800 animate-pulse" />
        </div>
        {/* Hero centered skeleton */}
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="w-36 h-36 rounded-full bg-slate-800 animate-pulse" />
          <div className="h-8 w-40 rounded-lg bg-slate-800 animate-pulse" />
          <div className="h-4 w-28 rounded bg-slate-800 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-800 animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-slate-800 animate-pulse" />
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/60 rounded-xl p-4 space-y-2 animate-pulse">
              <div className="h-4 w-16 rounded bg-slate-800" />
              <div className="h-8 w-12 rounded bg-slate-800" />
            </div>
          ))}
        </div>
        {/* Cards skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900/60 rounded-xl p-5 space-y-3 animate-pulse">
            <div className="h-5 w-24 rounded bg-slate-800" />
            <div className="h-4 w-full rounded bg-slate-800" />
            <div className="h-4 w-3/4 rounded bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────

export default function ProfilePage() {
  const { toast } = useToast();

  // Data state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [codeCopied, setCodeCopied] = useState(false);
  const [playerIdCopied, setPlayerIdCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ─── Avatar Upload Handler ─────────────────────────────────────
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'خطأ', description: 'يرجى اختيار ملف صورة فقط', variant: 'destructive' });
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'حجم كبير', description: 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت', variant: 'destructive' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Resize image on client side before uploading
      const resizedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 256;
            let { width, height } = img;
            if (width > height) {
              if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
            } else {
              if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not supported')); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = ev.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Upload to server
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: resizedBase64 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'تم تحديث الصورة', description: 'تم تغيير صورة الملف الشخصي' });
        // Refresh user data
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) setAuthUser(meData.user);
        }
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل رفع الصورة', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل رفع الصورة', variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }, [toast]);

  // Password state
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
    id: string; frameId: string; isEquipped: boolean; obtainedFrom: string; obtainedNote: string; obtainedAt: string;
    frame: { id: string; name: string; nameAr: string; description: string; rarity: string; gradientFrom: string; gradientTo: string; borderColor: string; glowColor: string; pattern: string; price: number; isFree: boolean; isActive: boolean; sortOrder: number; };
  }>>([]);
  const [framesLoading, setFramesLoading] = useState(false);
  const [equippingFrameId, setEquippingFrameId] = useState<string | null>(null);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    subscription: false,
    editProfile: false,
    changePassword: false,
    accountInfo: false,
    dangerZone: false,
  });

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const planBadge = getPlanBadge(subscription?.plan || 'free', subscription?.isTrial);
  const displayLevel = xpData?.level ?? 1;
  const displayProgress = xpData?.isMaxLevel ? 100 : (xpData?.progress ?? 0);
  const levelTier = getLevelTier(displayLevel);
  const referenceDate = subscription?.endDate || subscription?.expiresAt;
  const countdown = useCountdown(referenceDate);

  const equippedFrame = useMemo(() => {
    const ef = userFrames.find(f => f.isEquipped);
    return ef ? ef.frame : null;
  }, [userFrames]);

  const resolvedGames = useMemo(() => {
    if (!subscription?.allowedGamesInfo) return [];
    return subscription.allowedGamesInfo.filter(Boolean) as Array<{ slug: string; name: string; emoji: string; color: string }>;
  }, [subscription?.allowedGamesInfo]);

  const toggleSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ─── Fetch Data ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchAllData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch auth user
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          // Not logged in - redirect
          if (!cancelled) {
            window.location.href = '/';
            return;
          }
        }
        const meData = await meRes.json();
        if (!cancelled && meData.success && meData.user) {
          setAuthUser(meData.user);
        }

        // Fetch subscription profile
        const savedCode = localStorage.getItem('gg_sub_code');
        if (savedCode) {
          const subRes = await fetch('/api/subscription/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: savedCode }),
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            if (!cancelled && subData.success) {
              setSubscription(subData.subscriber);
              if (subData.trialInfo) {
                setTrialInfo(subData.trialInfo);
              }
            }
          }

          // Fetch XP data
          const xpRes = await fetch(`/api/player/xp?code=${encodeURIComponent(savedCode)}`);
          if (xpRes.ok) {
            const xpResData = await xpRes.json();
            if (!cancelled && xpResData.success && xpResData.xp) {
              setXpData({
                playerId: xpResData.playerId ?? null,
                total: xpResData.xp.total ?? 0,
                level: xpResData.xp.level ?? 1,
                currentLevelXP: xpResData.xp.currentLevelXP ?? 0,
                nextLevelXP: xpResData.xp.nextLevelXP ?? 0,
                progress: xpResData.xp.progress ?? 0,
                isMaxLevel: xpResData.xp.isMaxLevel ?? false,
              });
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Profile fetch error:', err);
          setError('حدث خطأ أثناء تحميل البيانات');
        }
      }

      // Fetch user frames
      try {
        const framesRes = await fetch('/api/frames');
        if (framesRes.ok) {
          const framesData = await framesRes.json();
          if (!cancelled && framesData.success) {
            setUserFrames(framesData.userFrames || []);
          }
        }
      } catch (frameErr) {
        console.error('Frames fetch error:', frameErr);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAllData();

    return () => { cancelled = true; };
  }, []);

  // Initialize edit fields
  useEffect(() => {
    if (isEditMode) {
      setEditDisplayName(authUser?.displayName ?? '');
      setEditPhone(authUser?.phone ?? '');
    }
  }, [isEditMode, authUser]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    localStorage.removeItem('gg_sub_code');
    localStorage.removeItem('gg_sub_info');
    toast({ title: 'تم تسجيل الخروج', description: 'تم تسجيل خروجك بنجاح' });
    window.location.href = '/';
  }, [toast]);

  const handleCopyCode = useCallback(() => {
    if (!subscription?.subscriptionCode) return;
    navigator.clipboard.writeText(subscription.subscriptionCode).then(() => {
      setCodeCopied(true);
      toast({ title: 'تم النسخ', description: `تم نسخ الكود: ${subscription.subscriptionCode}` });
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }, [subscription?.subscriptionCode, toast]);

  const handleCopyPlayerId = useCallback(() => {
    if (!xpData?.playerId) return;
    navigator.clipboard.writeText(xpData.playerId).then(() => {
      setPlayerIdCopied(true);
      toast({ title: 'تم نسخ معرف اللاعب' });
      setTimeout(() => setPlayerIdCopied(false), 2000);
    });
  }, [xpData?.playerId, toast]);

  const handleSaveProfile = useCallback(async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editDisplayName, phone: editPhone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'تم تحديث الملف الشخصي', description: 'تم حفظ التغييرات بنجاح' });
        setIsEditMode(false);
        setOpenSections(prev => ({ ...prev, editProfile: false }));
        // Refresh user data
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setAuthUser(meData.user);
          }
        }
      } else {
        toast({ title: 'خطأ', description: data.error || 'حدث خطأ أثناء التحديث', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setIsSavingProfile(false);
    }
  }, [editDisplayName, editPhone, toast]);

  const handleChangePassword = useCallback(async () => {
    if (!passwordCurrent || !passwordNew || !passwordConfirm) {
      toast({ title: 'حقول مطلوبة', description: 'يرجى ملء جميع حقول كلمة المرور', variant: 'destructive' });
      return;
    }
    if (passwordNew !== passwordConfirm) {
      toast({ title: 'كلمات المرور غير متطابقة', description: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين', variant: 'destructive' });
      return;
    }
    if (passwordNew.length < 6) {
      toast({ title: 'كلمة مرور ضعيفة', description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordCurrent, newPassword: passwordNew }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'تم تغيير كلمة المرور', description: 'تم تحديث كلمة المرور بنجاح' });
        setShowChangePassword(false);
        setOpenSections(prev => ({ ...prev, changePassword: false }));
        setPasswordCurrent('');
        setPasswordNew('');
        setPasswordConfirm('');
      } else {
        toast({ title: 'خطأ', description: data.error || 'حدث خطأ أثناء التغيير', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordCurrent, passwordNew, passwordConfirm, toast]);

  const handleEquipFrame = useCallback(async (uf: typeof userFrames[number]) => {
    setEquippingFrameId(uf.frameId);
    try {
      if (uf.isEquipped) {
        // Unequip
        const res = await fetch('/api/frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'equip', frameId: null }),
        });
        if (res.ok) {
          setUserFrames(prev => prev.map(f => ({ ...f, isEquipped: false })));
          toast({ title: 'تم إزالة الإطار', description: 'لم تعد تستخدم أي إطار' });
        }
      } else {
        // Equip
        const res = await fetch('/api/frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'equip', frameId: uf.frameId }),
        });
        if (res.ok) {
          setUserFrames(prev => prev.map(f => ({ ...f, isEquipped: f.frameId === uf.frameId })));
          toast({ title: 'تم تفعيل الإطار', description: `تم تفعيل إطار: ${uf.frame.nameAr}` });
        }
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تغيير الإطار', variant: 'destructive' });
    } finally {
      setEquippingFrameId(null);
    }
  }, [toast]);

  // ─── Loading State ─────────────────────────────────────────────────

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-white">{error}</h2>
          <Button onClick={() => window.location.href = '/'} variant="outline" className="border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────

  const displayName = authUser?.displayName || subscription?.name || 'مستخدم';
  const username = authUser?.username || '';
  const role = authUser?.role || 'user';
  const roleBadge = role === 'admin'
    ? { label: 'مدير', color: 'bg-rose-500/10 border-rose-500/30 text-rose-300' }
    : role === 'moderator'
      ? { label: 'مشرف', color: 'bg-amber-500/10 border-amber-500/30 text-amber-300' }
      : { label: 'عضو', color: 'bg-slate-500/10 border-slate-500/30 text-slate-400' };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" dir="rtl">
      {/* Custom scrollbar */}
      <style>{`
        .profile-scroll::-webkit-scrollbar { width: 4px; }
        .profile-scroll::-webkit-scrollbar-track { background: transparent; }
        .profile-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 4px; }
        .profile-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.5); }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .ornate-border { position: relative; }
        .ornate-border::before { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(244,63,94,0.1), rgba(245,158,11,0.3)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
      `}</style>

      <div className="flex-1">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-5 profile-scroll"
        >
          {/* ─── Page Header ─── */}
          <motion.div variants={itemVariant} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-lg sm:text-xl font-black bg-gradient-to-l from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                الملف الشخصي
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenSections(prev => ({ ...prev, subscription: !prev.subscription, editProfile: false, changePassword: false, accountInfo: false, dangerZone: false }))}
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="الإعدادات"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* ─── Centered Avatar Hero ─── */}
          <motion.div
            custom={0}
            variants={fadeInUp}
            className="relative"
          >
            {/* Cover gradient background */}
            <div className="relative rounded-2xl overflow-hidden">
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-b ${
                  subscription?.isTrial
                    ? 'from-violet-900/60 via-purple-900/30 to-slate-950'
                    : subscription?.plan === 'paid'
                      ? 'from-amber-900/60 via-orange-900/20 to-slate-950'
                      : 'from-slate-800/50 via-slate-900/20 to-slate-950'
                }`} />
                {/* Animated particles */}
                <motion.div
                  className="absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-10"
                  style={{
                    background: subscription?.isTrial
                      ? 'radial-gradient(circle, #8b5cf6, transparent)'
                      : subscription?.plan === 'paid'
                        ? 'radial-gradient(circle, #f59e0b, transparent)'
                        : 'radial-gradient(circle, #64748b, transparent)',
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.12, 0.06] }}
                  transition={{ repeat: Infinity, duration: 5 }}
                />
                <motion.div
                  className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-10"
                  style={{
                    background: 'radial-gradient(circle, #f59e0b, transparent)',
                  }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.1, 0.04] }}
                  transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                />
                {/* Grid pattern */}
                <div
                  className="absolute inset-0 opacity-[0.02]"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
              </div>

              {/* Avatar + Level Ring - centered, overlapping the cover */}
              <div className="flex flex-col items-center -mt-24 sm:-mt-28 relative z-10 pb-6">
                {/* Hidden file input for avatar upload */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="relative">
                  <AvatarLevelRing
                    level={displayLevel}
                    progress={displayProgress}
                    tier={levelTier}
                    avatarUrl={authUser?.avatar}
                    avatarLetter={displayName.charAt(0)}
                    equippedFrame={equippedFrame}
                  />
                  {/* Camera button overlay */}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-slate-950 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
                    title="تغيير صورة الملف الشخصي"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>

                {/* Name section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-10 text-center space-y-2"
                >
                  <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-l from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
                    {displayName}
                  </h2>
                  {username && (
                    <p className="text-sm text-slate-500 font-medium">@{username}</p>
                  )}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Badge variant="outline" className={`text-[10px] px-2.5 py-0.5 ${planBadge.bg} ${planBadge.border} ${planBadge.textColor} border`}>
                      {planBadge.icon}
                      {planBadge.label}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] px-2.5 py-0.5 ${roleBadge.color} border`}>
                      {roleBadge.label}
                    </Badge>
                  </div>
                  {authUser?.createdAt && (
                    <p className="text-xs text-slate-600 flex items-center justify-center gap-1 pt-1">
                      <Calendar className="w-3 h-3" />
                      عضو منذ {formatDate(authUser.createdAt)}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* ─── Stats Cards ─── */}
          <motion.div custom={1} variants={fadeInUp} className="grid grid-cols-3 gap-3">
            {/* Level Card */}
            <div className="ornate-border bg-slate-900/70 rounded-xl p-3 sm:p-4 flex flex-col items-center text-center border border-slate-800/50">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-l from-amber-300 to-amber-500 bg-clip-text text-transparent">{displayLevel}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">المستوى</span>
              <div className="w-full mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-l ${levelTier.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[9px] text-slate-600 mt-1">
                {xpData ? `${formatNumber(xpData.total)} XP` : '—'}
              </span>
            </div>

            {/* Gems Card */}
            <div className="ornate-border bg-slate-900/70 rounded-xl p-3 sm:p-4 flex flex-col items-center text-center border border-slate-800/50">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 flex items-center justify-center mb-2">
                <Gem className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-l from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
                {subscription?.gemsBalance ? formatNumber(subscription.gemsBalance) : '0'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">الجواهر</span>
            </div>

            {/* Games Card */}
            <div className="ornate-border bg-slate-900/70 rounded-xl p-3 sm:p-4 flex flex-col items-center text-center border border-slate-800/50">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center mb-2">
                <Gamepad2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-l from-emerald-300 to-emerald-500 bg-clip-text text-transparent">{resolvedGames.length}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">الألعاب</span>
            </div>
          </motion.div>

          {/* ─── XP Progress Section ─── */}
          {xpData && (
            <motion.div custom={2} variants={fadeInUp}>
              <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${levelTier.textColor}`} />
                      <span className="text-sm font-bold text-white">تقدم المستوى</span>
                    </div>
                    <span className={`text-xs font-bold ${levelTier.textColor}`}>
                      {xpData.isMaxLevel ? 'أقصى مستوى!' : `${formatNumber(xpData.currentLevelXP)} / ${formatNumber(xpData.nextLevelXP)}`}
                    </span>
                  </div>
                  <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`absolute inset-y-0 right-0 rounded-full bg-gradient-to-l ${levelTier.gradient}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${displayProgress}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                    />
                    <motion.div
                      className={`absolute inset-y-0 right-0 rounded-full bg-gradient-to-l ${levelTier.gradient} opacity-30`}
                      initial={{ width: 0 }}
                      animate={{ width: `${displayProgress}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                      style={{ filter: 'blur(4px)' }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    {xpData.isMaxLevel ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400">
                        <Star className="w-3.5 h-3.5" />
                        <span>وصلت لأقصى مستوى! أنت {levelTier.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>تحتاج {formatNumber(xpData.nextLevelXP - xpData.currentLevelXP)} XP للمستوى القادم</span>
                      </div>
                    )}
                    {xpData.playerId && (
                      <div className="flex items-center gap-1.5">
                        <Fingerprint className="w-3 h-3 text-slate-600" />
                        <span className="text-[10px] text-slate-600 font-mono" dir="ltr">{xpData.playerId.slice(0, 8)}...</span>
                        <button onClick={handleCopyPlayerId} className="text-slate-600 hover:text-slate-400 transition-colors">
                          {playerIdCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Frame Gallery ─── */}
          <motion.div custom={3} variants={fadeInUp}>
            <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/20 flex items-center justify-center">
                      <span className="text-base">🖼️</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">معرض الإطارات</h3>
                      <p className="text-[10px] text-slate-500">اختر إطاراً لتفعيله على ملفك</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-slate-800/50 border-slate-700/50 text-slate-400">
                    {userFrames.length}
                  </Badge>
                </div>

                {userFrames.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
                      <span className="text-3xl opacity-40">🖼️</span>
                    </div>
                    <p className="text-xs text-slate-500">لا تملك أي إطارات بعد</p>
                    <p className="text-[10px] text-slate-600">احصل على إطارات من الأحداث أو الوصول لمستويات جديدة</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {userFrames.map((uf) => {
                      const rarityConfig: Record<string, { label: string; color: string; border: string }> = {
                        common: { label: 'عادي', color: 'bg-slate-500/10 text-slate-400', border: 'border-slate-500/30' },
                        rare: { label: 'نادر', color: 'bg-cyan-500/10 text-cyan-400', border: 'border-cyan-500/30' },
                        epic: { label: 'ملحمي', color: 'bg-violet-500/10 text-violet-400', border: 'border-violet-500/30' },
                        legendary: { label: 'أسطوري', color: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/30' },
                      };
                      const rarity = rarityConfig[uf.frame.rarity] || rarityConfig.common;
                      const isAnimated = uf.frame.pattern === 'animated';
                      const isEquipping = equippingFrameId === uf.frameId;

                      return (
                        <motion.button
                          key={uf.id}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleEquipFrame(uf)}
                          disabled={isEquipping}
                          className={`relative p-3 rounded-xl transition-all duration-200 ${
                            uf.isEquipped
                              ? 'bg-emerald-950/30 border-2 border-emerald-500/40'
                              : 'bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/60'
                          }`}
                        >
                          {/* Frame preview */}
                          <div className="relative w-14 h-14 mx-auto mb-2">
                            <motion.div
                              animate={isAnimated && uf.isEquipped ? {
                                boxShadow: [
                                  `0 0 8px ${uf.frame.glowColor}`,
                                  `0 0 20px ${uf.frame.glowColor}`,
                                  `0 0 8px ${uf.frame.glowColor}`,
                                ],
                              } : {}}
                              transition={isAnimated ? { repeat: Infinity, duration: 2 } : undefined}
                              className="absolute -inset-1 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${uf.frame.gradientFrom}, ${uf.frame.gradientTo})`,
                                padding: '3px',
                                boxShadow: !isAnimated ? `0 0 8px ${uf.frame.glowColor}` : undefined,
                              }}
                            >
                              {uf.frame.pattern === 'double' && (
                                <div className="absolute inset-0 rounded-full" style={{
                                  border: '1.5px solid ' + uf.frame.borderColor,
                                  background: 'transparent',
                                  margin: '3px',
                                }} />
                              )}
                              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                {authUser?.avatar ? (
                                  <img src={authUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span className="text-lg font-bold text-slate-400">
                                    {displayName.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </motion.div>

                            {/* Equipped checkmark */}
                            {uf.isEquipped && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-lg"
                              >
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </motion.div>
                            )}

                            {/* Loading indicator */}
                            {isEquipping && (
                              <div className="absolute inset-0 rounded-full bg-slate-950/60 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                              </div>
                            )}
                          </div>

                          {/* Frame name */}
                          <p className={`text-[10px] font-bold text-center truncate ${uf.isEquipped ? 'text-emerald-300' : 'text-slate-300'}`}>
                            {uf.frame.nameAr}
                          </p>

                          {/* Rarity badge */}
                          <Badge variant="outline" className={`text-[8px] px-1.5 py-0 mt-1.5 mx-auto block w-fit ${rarity.color} ${rarity.border} border`}>
                            {rarity.label}
                          </Badge>

                          {/* Equipped green glow effect */}
                          {uf.isEquipped && (
                            <motion.div
                              className="absolute inset-0 rounded-xl pointer-events-none"
                              style={{ boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)' }}
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {userFrames.length > 0 && (
                  <p className="text-[10px] text-slate-600 text-center">
                    اضغط على إطار لتفعيله · اضغط على الإطار المفعّل لإزالته
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Settings Section ─── */}
          <motion.div custom={4} variants={fadeInUp} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Settings className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-400">الإعدادات</h3>
            </div>

            {/* Subscription Info */}
            <CollapsibleSection
              icon={
                subscription?.isTrial ? (
                  <Gift className="w-4 h-4 text-violet-400" />
                ) : subscription?.plan === 'paid' ? (
                  <Crown className="w-4 h-4 text-amber-400" />
                ) : (
                  <Shield className="w-4 h-4 text-slate-400" />
                )
              }
              title={subscription?.isTrial ? 'اشتراك تجريبي' : subscription?.plan === 'paid' ? 'اشتراك مميز' : 'الاشتراك'}
              badge={
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${planBadge.bg} ${planBadge.border} ${planBadge.textColor} border`}>
                  {planBadge.icon}
                  {planBadge.label}
                </Badge>
              }
              isOpen={openSections.subscription}
              onToggle={() => {
                setOpenSections(prev => ({
                  ...prev,
                  subscription: !prev.subscription,
                  editProfile: false,
                  changePassword: false,
                  accountInfo: false,
                  dangerZone: false,
                }));
              }}
            >
              {subscription && (
                <div className="space-y-4">
                  {/* Subscription Code */}
                  <div className="bg-slate-800/40 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">كود الاشتراك</p>
                      <p className="text-sm font-mono font-bold text-white" dir="ltr">{subscription.subscriptionCode}</p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="w-9 h-9 rounded-lg bg-slate-700/50 border border-slate-600/30 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                    >
                      {codeCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 mb-1">تاريخ البداية</p>
                      <p className="text-xs font-bold text-slate-300">{formatDate(subscription.startDate)}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 mb-1">
                        {referenceDate ? (countdown.expired ? 'تاريخ الانتهاء' : 'ينتهي في') : 'تاريخ الانتهاء'}
                      </p>
                      <p className="text-xs font-bold text-slate-300">{formatDate(referenceDate)}</p>
                    </div>
                  </div>

                  {/* Countdown */}
                  {referenceDate && !countdown.expired && (
                    <div className="bg-slate-800/40 rounded-xl p-3 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-400 ml-2" />
                      <CountdownDisplay
                        days={countdown.days}
                        hours={countdown.hours}
                        minutes={countdown.minutes}
                        seconds={countdown.seconds}
                        expired={false}
                      />
                    </div>
                  )}

                  {/* Trial Info */}
                  {trialInfo && (
                    <div className="bg-violet-950/20 border border-violet-500/20 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        معلومات التجربة
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
                          <Gamepad2 className="w-4 h-4 mx-auto text-violet-400 mb-1" />
                          <p className="text-sm font-black text-white">{trialInfo.sessionsUsed}/{trialInfo.maxSessions}</p>
                          <p className="text-[9px] text-slate-500">الجولات</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
                          <Clock className="w-4 h-4 mx-auto text-violet-400 mb-1" />
                          <p className="text-sm font-black text-white">{trialInfo.daysLeft}</p>
                          <p className="text-[9px] text-slate-500">أيام متبقية</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Allowed Games */}
                  {resolvedGames.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400">الألعاب المتاحة</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {resolvedGames.map((game) => (
                          <motion.div
                            key={game.slug}
                            whileHover={{ scale: 1.02 }}
                            className={`bg-gradient-to-br ${GAMES_CONFIG[game.slug]?.color || 'from-slate-500/20 to-slate-600/5'} rounded-xl p-3 flex items-center gap-2.5 border border-slate-800/30`}
                          >
                            <span className="text-xl">{game.emoji}</span>
                            <span className="text-xs font-bold text-slate-300">{game.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* Edit Profile */}
            <CollapsibleSection
              icon={<Pencil className="w-4 h-4 text-amber-400" />}
              title="تعديل الملف الشخصي"
              isOpen={openSections.editProfile}
              onToggle={() => {
                setOpenSections(prev => ({
                  ...prev,
                  editProfile: !prev.editProfile,
                  subscription: false,
                  changePassword: false,
                  accountInfo: false,
                  dangerZone: false,
                }));
              }}
            >
              <div className="bg-gradient-to-br from-amber-950/20 to-slate-900/30 border border-amber-500/10 rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">الاسم المعروض</Label>
                  <Input
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="أدخل اسمك المعروض"
                    className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">رقم الهاتف</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="أدخل رقم هاتفك"
                    className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50"
                    dir="ltr"
                    type="tel"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex-1 h-10 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs border border-amber-500/20 disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-1.5" />}
                    حفظ التغييرات
                  </Button>
                  <Button
                    onClick={() => setOpenSections(prev => ({ ...prev, editProfile: false }))}
                    variant="outline"
                    className="h-10 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-bold text-xs border border-slate-700/50 px-4"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </CollapsibleSection>

            {/* Change Password */}
            <CollapsibleSection
              icon={<KeyRound className="w-4 h-4 text-slate-400" />}
              title="تغيير كلمة المرور"
              isOpen={openSections.changePassword}
              onToggle={() => {
                setOpenSections(prev => ({
                  ...prev,
                  changePassword: !prev.changePassword,
                  subscription: false,
                  editProfile: false,
                  accountInfo: false,
                  dangerZone: false,
                }));
              }}
            >
              <div className="space-y-3">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input
                      value={passwordCurrent}
                      onChange={(e) => setPasswordCurrent(e.target.value)}
                      type={showCurrentPw ? 'text' : 'password'}
                      placeholder="••••••"
                      className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50 pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      value={passwordNew}
                      onChange={(e) => setPasswordNew(e.target.value)}
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="6 أحرف على الأقل"
                      className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50 pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">تأكيد كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="أعد كتابة كلمة المرور"
                      className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50 pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full h-10 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs border border-amber-500/20 disabled:opacity-50"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <Shield className="w-4 h-4 ml-1.5" />}
                  تحديث كلمة المرور
                </Button>
              </div>
            </CollapsibleSection>

            {/* Account Info */}
            <CollapsibleSection
              icon={<User className="w-4 h-4 text-slate-400" />}
              title="معلومات الحساب"
              isOpen={openSections.accountInfo}
              onToggle={() => {
                setOpenSections(prev => ({
                  ...prev,
                  accountInfo: !prev.accountInfo,
                  subscription: false,
                  editProfile: false,
                  changePassword: false,
                  dangerZone: false,
                }));
              }}
            >
              <div className="space-y-3">
                {username && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">اسم المستخدم</p>
                      <p className="text-sm text-slate-300 truncate">@{username}</p>
                    </div>
                  </div>
                )}
                {(authUser?.email || subscription?.email) && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">البريد الإلكتروني</p>
                      <p className="text-sm text-slate-300 truncate">{authUser?.email || subscription?.email}</p>
                    </div>
                  </div>
                )}
                {(authUser?.phone || subscription?.phone) && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">رقم الهاتف</p>
                      <p className="text-sm text-slate-300" dir="ltr">{authUser?.phone || subscription?.phone || '—'}</p>
                    </div>
                  </div>
                )}
                {authUser?.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">آخر دخول</p>
                      <p className="text-sm text-slate-300">{formatDate(authUser.lastLoginAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Danger Zone */}
            <Card className="bg-slate-900/40 border-rose-500/10 overflow-hidden">
              <button
                onClick={() => setOpenSections(prev => ({
                  ...prev,
                  dangerZone: !prev.dangerZone,
                  subscription: false,
                  editProfile: false,
                  changePassword: false,
                  accountInfo: false,
                }))}
                className="w-full p-4 sm:p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-rose-400">منطقة الخطر</h3>
                </div>
                {openSections.dangerZone ? (
                  <ChevronUp className="w-4 h-4 text-rose-500/50" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-rose-500/50" />
                )}
              </button>
              <AnimatePresence>
                {openSections.dangerZone && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <Separator className="bg-rose-500/10" />
                    <div className="p-4 sm:p-5 space-y-3">
                      <p className="text-xs text-slate-500">
                        حذف الحساب سيؤدي لإزالة جميع بياناتك بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
                      </p>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="outline"
                        className="w-full h-10 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/50 text-sm font-bold transition-all"
                      >
                        حذف الحساب نهائياً
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          <div className="pb-6" />
        </motion.div>
      </div>

      {/* ─── Sticky Footer ─── */}
      <footer className="sticky bottom-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/40 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="h-10 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 font-bold text-xs border border-slate-700/50 px-5"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </div>
      </footer>

      {/* ─── Delete Account Dialog ─── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[380px] bg-slate-900 border-slate-800/60" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              تأكيد حذف الحساب
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              هل أنت متأكد من حذف حسابك؟ سيتم حذف جميع بياناتك بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                toast({ title: 'لم يتم الحذف', description: 'تم إلغاء عملية الحذف' });
              }}
              variant="outline"
              className="flex-1 h-10 bg-slate-800/50 text-slate-300 font-bold text-sm border border-slate-700/50"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                toast({
                  title: 'ميزة قيد التطوير',
                  description: 'حذف الحساب سيكون متاحاً قريباً',
                  variant: 'destructive',
                });
              }}
              className="flex-1 h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm"
            >
              حذف نهائي
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
