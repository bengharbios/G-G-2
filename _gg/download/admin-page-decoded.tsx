'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Gamepad2,
  Users,
  Activity,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Shield,
  Rocket,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  Bell,
  TrendingUp,
  Clock,
  UserPlus,
  Loader2,
  Menu,
  X,
  Edit,
  Copy,
  Crown,
  Gift,
  Star,
  Monitor,
  Gem,
  Trophy,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

// ─── Types ────────────────────────────────────────────────────────────

interface GameConfig {
  id: string;
  gameSlug: string;
  gameName: string;
  isEnabled: boolean;
  order: number;
  playerRange: string;
  description: string;
  icon: string;
  color: string;
  isComingSoon: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  email: string;
  name: string;
  phone: string;
  telegram: string;
  subscriptionCode: string;
  plan: string;
  isActive: boolean;
  allowedGames: string[];
  startDate: string;
  endDate: string | null;
  startedAt: string;
  expiresAt: string | null;
  createdAt: string;
}

interface SiteConfig {
  id: string;
  allowDirectRegistration: boolean;
  telegramLink: string;
  whatsappLink: string;
  subscriptionPrice: string;
  contactMessage: string;
  updatedAt: string;
  trialGameSlugs: string[];
  maxTrialSessions: number;
  trialDurationDays: number;
}

interface GameSession {
  id: string;
  gameSlug: string;
  hostName: string;
  playersCount: number;
  duration: number | null;
  createdAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalGames: number;
  enabledGames: number;
  comingSoonGames: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalSessions: number;
  sessionsToday: number;
  totalPlayers: number;
  unreadMessages: number;
  gameStats: { slug: string; name: string; sessions: number; players: number }[];
}

interface ActiveTable {
  id: string;
  code: string;
  phase: string;
  round: number;
  hostName: string;
  playerCount: number;
  joinedPlayerCount: number;
  gameType: string | null;
  createdAt: string;
  updatedAt: string;
  hostLastSeen: string;
  gameWinner: string | null;
}

interface GemChargeRequest {
  id: string;
  subscriptionCode: string;
  subscriberName: string;
  gemsAmount: number;
  packageType: 'small' | 'medium' | 'large' | 'mega';
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  eventType: string;
  gameSlug: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
  badge: string;
  badgeColor: string;
  rewardType?: string;
  rewardAmount?: number;
  rewardDescription?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  name: string;
  level: number;
  xp: number;
  isSpecialId: boolean;
}

type ActiveSection = 'dashboard' | 'games' | 'subscriptions' | 'sessions' | 'messages' | 'settings' | 'tables' | 'gem-charges' | 'leaderboard' | 'events';

// ─── Navigation items ─────────────────────────────────────────────────

const navItems: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'games', label: 'إدارة الألعاب', icon: <Gamepad2 className="w-5 h-5" /> },
  { id: 'subscriptions', label: 'الاشتراكات', icon: <Users className="w-5 h-5" /> },
  { id: 'sessions', label: 'الجلسات', icon: <Activity className="w-5 h-5" /> },
  { id: 'messages', label: 'الرسائل', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'tables', label: 'الطاولات المباشرة', icon: <Monitor className="w-5 h-5" /> },
  { id: 'events', label: 'الأحداث', icon: <CalendarDays className="w-5 h-5" /> },
  { id: 'gem-charges', label: 'شحن الجواهر', icon: <Gem className="w-5 h-5" /> },
  { id: 'leaderboard', label: 'المتصدرين', icon: <Trophy className="w-5 h-5" /> },
  { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-5 h-5" /> },
];

const packageTypeLabels: Record<string, string> = {
  small: 'صغير',
  medium: 'متوسط',
  large: 'كبير',
  mega: 'ميجا',
};

const rewardTypeLabels: Record<string, string> = {
  none: 'بدون',
  xp: 'نقاط خبرة',
  gems: 'جواهر',
  frame: 'إطار',
  cover: 'غلاف',
  dice: 'نرد',
};

// ─── Color map for game cards ─────────────────────────────────────────

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  red: { bg: 'from-red-950/60 to-red-900/30', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
  orange: { bg: 'from-orange-950/60 to-orange-900/30', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  purple: { bg: 'from-purple-950/60 to-purple-900/30', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  amber: { bg: 'from-amber-950/60 to-amber-900/30', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  violet: { bg: 'from-violet-950/60 to-violet-900/30', border: 'border-violet-500/30', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
  teal: { bg: 'from-teal-950/60 to-teal-900/30', border: 'border-teal-500/30', text: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  blue: { bg: 'from-blue-950/60 to-blue-900/30', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  pink: { bg: 'from-pink-950/60 to-pink-900/30', border: 'border-pink-500/30', text: 'text-pink-400', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
};

const gameNameMap: Record<string, string> = {
  mafia: 'المافيا',
  risk: 'المجازفة',
  risk2: 'المجازفة 2',
  tobol: 'طبول الحرب',
  tabot: 'الهروب من التابوت',
  prison: 'السجن',
  familyfeud: 'فاميلي فيود',
  baharharb: 'بحر و حرب',
};

const gameColorMap: Record<string, string> = {
  mafia: 'red',
  risk: 'violet',
  risk2: 'orange',
  tobol: 'amber',
  tabot: 'purple',
  prison: 'amber',
  familyfeud: 'amber',
  baharharb: 'teal',
};

// ─── Main Component ───────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [games, setGames] = useState<GameConfig[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [adminInfo, setAdminInfo] = useState<{ username: string; role: string; createdAt: string } | null>(null);
  const [systemInfo, setSystemInfo] = useState<Record<string, string> | null>(null);
  const [tables, setTables] = useState<ActiveTable[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tableDeleteConfirm, setTableDeleteConfirm] = useState<string | null>(null);
  const [closingInactive, setClosingInactive] = useState(false);

  // Settings form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');


  // Subscriber management dialog
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscription | null>(null);
  const [subForm, setSubForm] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: '',
    plan: 'free' as string,
    startDate: '',
    endDate: '',
    allowedGames: [] as string[],
  });
  const [subFormLoading, setSubFormLoading] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  // Site config
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [siteConfigForm, setSiteConfigForm] = useState({
    allowDirectRegistration: true,
    telegramLink: '',
    whatsappLink: '',
    subscriptionPrice: '',
    contactMessage: '',
    trialGameSlugs: [] as string[],
    maxTrialSessions: 1,
    trialDurationDays: 3,
  });
  const [siteConfigSaving, setSiteConfigSaving] = useState(false);

  // Edit game dialog
  const [editGameOpen, setEditGameOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameConfig | null>(null);

  // Events management
  const [events, setEvents] = useState<Event[]>([]);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: 'promotion' as string,
    gameSlug: '',
    startDate: '',
    endDate: '',
    badge: '🔥',
    badgeColor: 'amber' as string,
    rewardType: 'none',
    rewardAmount: 0,
    rewardDescription: '',
  });
  const [eventFormLoading, setEventFormLoading] = useState(false);

  // Gem charges
  const [gemCharges, setGemCharges] = useState<GemChargeRequest[]>([]);
  const [gemChargeLoading, setGemChargeLoading] = useState<string | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // ─── Toast helper ───────────────────────────────────────────────────

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Check auth on mount ────────────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          setIsAuthenticated(true);
          setShowLogin(false);
          const data = await res.json();
          setStats(data.stats);
        } else {
          setShowLogin(true);
          setIsAuthenticated(false);
        }
      } catch {
        setShowLogin(true);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ─── Data fetchers ──────────────────────────────────────────────────

  // Track if games have been loaded at least once
  const [gamesLoadedOnce, setGamesLoadedOnce] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data.games);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchSessions = useCallback(async (gameSlug?: string) => {
    try {
      const url = gameSlug
        ? `/api/admin/sessions?game=${gameSlug}`
        : '/api/admin/sessions';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setAdminInfo(data.user);
        setSystemInfo(data.system);
      }
    } catch { /* ignore */ }
    try {
      const res = await fetch('/api/admin/site-config');
      if (res.ok) {
        const data = await res.json();
        setSiteConfig(data.config);
        setSiteConfigForm({
          allowDirectRegistration: data.config.allowDirectRegistration,
          telegramLink: data.config.telegramLink,
          whatsappLink: data.config.whatsappLink,
          subscriptionPrice: data.config.subscriptionPrice,
          contactMessage: data.config.contactMessage,
          trialGameSlugs: data.config.trialGameSlugs || [],
          maxTrialSessions: data.config.maxTrialSessions || 1,
          trialDurationDays: data.config.trialDurationDays || 3,
        });
      }
    } catch { /* ignore */ }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data.rooms || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchGemCharges = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gem-charges');
      if (res.ok) {
        const data = await res.json();
        setGemCharges(data.requests || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/player/leaderboard?limit=20');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch { /* ignore */ }
  }, []);

  // ─── Load data when section changes ────────────────────────────────

  // Always fetch games on auth (needed for subscriber dialog)
  useEffect(() => {
    if (isAuthenticated && !gamesLoadedOnce) {
      fetchGames().then(() => setGamesLoadedOnce(true));
    }
  }, [isAuthenticated, gamesLoadedOnce, fetchGames]);

  useEffect(() => {
    if (!isAuthenticated) return;
    switch (activeSection) {
      case 'dashboard':
        fetchStats();
        break;
      case 'games':
        fetchGames();
        break;
      case 'subscriptions':
        fetchSubscriptions();
        // Ensure games are loaded for the subscriber dialog
        if (!gamesLoadedOnce || games.length === 0) {
          fetchGames().then(() => setGamesLoadedOnce(true));
        }
        break;
      case 'sessions':
        fetchSessions();
        break;
      case 'messages':
        fetchMessages();
        break;
      case 'tables':
        fetchTables();
        break;
      case 'events':
        fetchEvents();
        break;
      case 'gem-charges':
        fetchGemCharges();
        break;
      case 'leaderboard':
        fetchLeaderboard();
        break;
      case 'settings':
        fetchSettings();
        break;
    }
  }, [activeSection, isAuthenticated, fetchStats, fetchGames, fetchSubscriptions, fetchSessions, fetchMessages, fetchSettings, fetchTables, fetchEvents, fetchGemCharges, fetchLeaderboard, gamesLoadedOnce, games.length]);

  // ─── Auto-refresh tables every 10 seconds ──────────────────────────

  useEffect(() => {
    if (activeSection !== 'tables' || !isAuthenticated) return;
    const interval = setInterval(() => {
      fetchTables();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeSection, isAuthenticated, fetchTables]);

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setShowLogin(false);
        fetchStats();
        showToast('تم تسجيل الدخول بنجاح');
      } else {
        const data = await res.json();
        setLoginError(data.error || 'خطأ في تسجيل الدخول');
      }
    } catch {
      setLoginError('حدث خطأ في الاتصال');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
    } catch { /* ignore */ }
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
    setShowLogin(true);
    setStats(null);
    setGames([]);
    setSubscriptions([]);
    setSessions([]);
    setMessages([]);
  };

  const toggleGameEnabled = async (slug: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isEnabled: !enabled }),
      });
      if (res.ok) {
        setGames((prev) => prev.map((g) => (g.gameSlug === slug ? { ...g, isEnabled: !enabled } : g)));
        showToast(enabled ? 'تم تعطيل اللعبة' : 'تم تفعيل اللعبة');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const toggleComingSoon = async (slug: string, comingSoon: boolean) => {
    try {
      const res = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isComingSoon: !comingSoon }),
      });
      if (res.ok) {
        setGames((prev) => prev.map((g) => (g.gameSlug === slug ? { ...g, isComingSoon: !comingSoon } : g)));
        showToast(comingSoon ? 'تم إزالة علامة "قريباً"' : 'تم تعيين علامة "قريباً"');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const moveGameOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === games.length - 1)
    ) return;

    const newGames = [...games];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newGames[index], newGames[swapIndex]] = [newGames[swapIndex], newGames[index]];

    // Update orders
    for (let i = 0; i < newGames.length; i++) {
      newGames[i] = { ...newGames[i], order: i };
    }
    setGames(newGames);

    // Save to server
    for (const game of newGames) {
      await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: game.gameSlug, order: game.order }),
      });
    }
    showToast('تم تحديث ترتيب الألعاب');
  };

  const saveGameEdit = async () => {
    if (!editingGame) return;
    try {
      const res = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editingGame.gameSlug,
          gameName: editingGame.gameName,
          description: editingGame.description,
          icon: editingGame.icon,
          color: editingGame.color,
          playerRange: editingGame.playerRange,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGames((prev) => prev.map((g) => (g.gameSlug === data.game.gameSlug ? data.game : g)));
        setEditGameOpen(false);
        setEditingGame(null);
        showToast('تم تحديث اللعبة بنجاح');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const openAddSubscriberDialog = async () => {
    // Ensure games are loaded before opening dialog
    if (games.length === 0) {
      await fetchGames();
      setGamesLoadedOnce(true);
    }
    setEditingSubscriber(null);
    setSubForm({
      name: '',
      email: '',
      phone: '',
      telegram: '',
      plan: 'free',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      allowedGames: [],
    });
    setSubDialogOpen(true);
  };

  const openEditSubscriberDialog = async (sub: Subscription) => {
    // Ensure games are loaded before opening dialog
    if (games.length === 0) {
      await fetchGames();
      setGamesLoadedOnce(true);
    }
    setEditingSubscriber(sub);
    setSubForm({
      name: sub.name,
      email: sub.email,
      phone: sub.phone || '',
      telegram: sub.telegram || '',
      plan: sub.plan,
      startDate: sub.startDate ? sub.startDate.split('T')[0] : '',
      endDate: sub.endDate ? sub.endDate.split('T')[0] : '',
      allowedGames: sub.allowedGames || [],
    });
    setSubDialogOpen(true);
  };

  const toggleGameInForm = (gameSlug: string) => {
    setSubForm((prev) => ({
      ...prev,
      allowedGames: prev.allowedGames.includes(gameSlug)
        ? prev.allowedGames.filter((g) => g !== gameSlug)
        : [...prev.allowedGames, gameSlug],
    }));
  };

  const selectAllGamesInForm = () => {
    const allSlugs = games.map((g) => g.gameSlug);
    if (subForm.allowedGames.length === allSlugs.length) {
      setSubForm((prev) => ({ ...prev, allowedGames: [] }));
    } else {
      setSubForm((prev) => ({ ...prev, allowedGames: allSlugs }));
    }
  };

  const selectAllTrialGames = () => {
    const allSlugs = games.filter((g) => g.isEnabled && !g.isComingSoon).map((g) => g.gameSlug);
    if (siteConfigForm.trialGameSlugs.length === allSlugs.length) {
      setSiteConfigForm((prev) => ({ ...prev, trialGameSlugs: [] }));
    } else {
      setSiteConfigForm((prev) => ({ ...prev, trialGameSlugs: allSlugs }));
    }
  };

  const saveSubscriber = async () => {
    if (!subForm.name || !subForm.email) {
      showToast('الاسم والبريد مطلوبان', 'error');
      return;
    }
    setSubFormLoading(true);
    try {
      if (editingSubscriber) {
        const res = await fetch(`/api/admin/subscriptions/${editingSubscriber.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subForm.name,
            email: subForm.email,
            phone: subForm.phone,
            telegram: subForm.telegram,
            plan: subForm.plan,
            startDate: subForm.startDate || new Date().toISOString(),
            endDate: subForm.endDate || null,
            allowedGames: subForm.allowedGames,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSubscriptions((prev) => prev.map((s) => (s.id === data.subscription.id ? data.subscription : s)));
          showToast('تم تحديث المشترك بنجاح');
          setSubDialogOpen(false);
        }
      } else {
        const res = await fetch('/api/admin/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subForm.name,
            email: subForm.email,
            phone: subForm.phone,
            telegram: subForm.telegram,
            plan: subForm.plan,
            startDate: subForm.startDate || new Date().toISOString(),
            endDate: subForm.endDate || null,
            allowedGames: subForm.allowedGames,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          showToast(`تم إضافة المشترك - الكود: ${data.subscription.subscriptionCode}`);
          setSubDialogOpen(false);
          fetchSubscriptions();
        }
      }
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setSubFormLoading(false);
    }
  };

  const deleteSubscriber = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        showToast('تم حذف المشترك');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const toggleSubscriptionActive = async (id: string) => {
    try {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return;
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !sub.isActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions((prev) => prev.map((s) => (s.id === data.subscription.id ? data.subscription : s)));
        showToast(sub.isActive ? 'تم تعطيل المشترك' : 'تم تفعيل المشترك');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const copySubscriptionCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('تم نسخ الكود');
  };

  const saveSiteConfig = async () => {
    setSiteConfigSaving(true);
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteConfigForm),
      });
      if (res.ok) {
        const data = await res.json();
        setSiteConfig(data.config);
        showToast('تم حفظ الإعدادات بنجاح');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setSiteConfigSaving(false);
    }
  };

  const toggleRegistration = async (checked: boolean) => {
    setSiteConfigForm((prev) => ({ ...prev, allowDirectRegistration: checked }));
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...siteConfigForm, allowDirectRegistration: checked }),
      });
      if (res.ok) {
        const data = await res.json();
        setSiteConfig(data.config);
        showToast(checked ? 'تم تفعيل التسجيل المباشر' : 'تم تعطيل التسجيل المباشر');
      } else {
        setSiteConfigForm((prev) => ({ ...prev, allowDirectRegistration: !checked }));
        showToast('حدث خطأ', 'error');
      }
    } catch {
      setSiteConfigForm((prev) => ({ ...prev, allowDirectRegistration: !checked }));
      showToast('حدث خطأ', 'error');
    }
  };

  const markMessageRead = async (id: string) => {
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'mark_read' }),
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
        if (stats) setStats({ ...stats, unreadMessages: Math.max(0, stats.unreadMessages - 1) });
      }
    } catch { /* ignore */ }
  };

  const deleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        showToast('تم حذف الرسالة');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      showToast('جميع الحقول مطلوبة', 'error');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      showToast('كلمتا المرور غير متطابقتين', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        showToast('تم تحديث كلمة المرور بنجاح');
        setCurrentPassword('');
        setNewPassword('');
        setNewPasswordConfirm('');
      } else {
        const data = await res.json();
        showToast(data.error || 'فشل في تحديث كلمة المرور', 'error');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const handleNavClick = (section: ActiveSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const closeTable = async (code: string) => {
    try {
      const res = await fetch(`/api/admin/tables?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTables((prev) => prev.filter((t) => t.code !== code));
        showToast('تم إغلاق الطاولة');
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'فشل إغلاق الطاولة', 'error');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setTableDeleteConfirm(null);
    }
  };

  const handleCloseInactive = async () => {
    setClosingInactive(true);
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close_inactive', hoursOld: 24 }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`تم إغلاق ${data.deletedCount} طاولة غير نشطة`);
        fetchTables();
      } else {
        showToast('فشل إغلاق الطاولات', 'error');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setClosingInactive(false);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      t.code.toLowerCase().includes(q) ||
      t.hostName.toLowerCase().includes(q) ||
      (t.gameType || '').toLowerCase().includes(q) ||
      (gameNameMap[t.gameType || ''] || '').includes(q)
    );
  });

  // ─── Events handlers ──────────────────────────────────────────────

  const openAddEventDialog = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      eventType: 'promotion',
      gameSlug: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      badge: '🔥',
      badgeColor: 'amber',
      rewardType: 'none',
      rewardAmount: 0,
      rewardDescription: '',
    });
    setEventFormOpen(true);
  };

  const openEditEventDialog = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      gameSlug: event.gameSlug,
      startDate: event.startDate ? event.startDate.split('T')[0] : '',
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      badge: event.badge,
      badgeColor: event.badgeColor,
      rewardType: event.rewardType || 'none',
      rewardAmount: event.rewardAmount || 0,
      rewardDescription: event.rewardDescription || '',
    });
    setEventFormOpen(true);
  };

  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.startDate || !eventForm.endDate) {
      showToast('العنوان والتواريخ مطلوبة', 'error');
      return;
    }
    setEventFormLoading(true);
    try {
      if (editingEvent) {
        const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: eventForm.title,
            description: eventForm.description,
            eventType: eventForm.eventType,
            gameSlug: eventForm.gameSlug,
            startDate: new Date(eventForm.startDate).toISOString(),
            endDate: new Date(eventForm.endDate).toISOString(),
            badge: eventForm.badge,
            badgeColor: eventForm.badgeColor,
            rewardType: eventForm.rewardType,
            rewardAmount: eventForm.rewardAmount,
            rewardDescription: eventForm.rewardDescription,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setEvents((prev) => prev.map((e) => (e.id === data.event.id ? data.event : e)));
          showToast('تم تحديث الحدث بنجاح');
          setEventFormOpen(false);
        }
      } else {
        const res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: eventForm.title,
            description: eventForm.description,
            eventType: eventForm.eventType,
            gameSlug: eventForm.gameSlug,
            startDate: new Date(eventForm.startDate).toISOString(),
            endDate: new Date(eventForm.endDate).toISOString(),
            badge: eventForm.badge,
            badgeColor: eventForm.badgeColor,
            rewardType: eventForm.rewardType,
            rewardAmount: eventForm.rewardAmount,
            rewardDescription: eventForm.rewardDescription,
          }),
        });
        if (res.ok) {
          showToast('تم إضافة الحدث بنجاح');
          setEventFormOpen(false);
          fetchEvents();
        }
      }
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setEventFormLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        showToast('تم حذف الحدث');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const toggleEventActive = async (event: Event) => {
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !event.isActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === data.event.id ? data.event : e)));
        showToast(event.isActive ? 'تم تعطيل الحدث' : 'تم تفعيل الحدث');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  // ─── Gem Charge handlers ──────────────────────────────────────────

  const handleGemChargeAction = async (id: string, action: 'approve' | 'reject') => {
    setGemChargeLoading(id);
    try {
      const res = await fetch(`/api/admin/gem-charges/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setGemCharges((prev) =>
          prev.map((gc) => (gc.id === id ? { ...gc, status: action === 'approve' ? 'approved' as const : 'rejected' as const } : gc))
        );
      } else {
        const data = await res.json();
        showToast(data.error || 'فشل تنفيذ الإجراء', 'error');
      }
    } catch {
      showToast('حدث خطأ في الاتصال', 'error');
    } finally {
      setGemChargeLoading(null);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-400">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  // ─── Login screen ──────────────────────────────────────────────────

  if (showLogin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
        <Card className="w-full max-w-md bg-slate-900/90 border-slate-800/50 backdrop-blur-sm relative">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-white">لوحة التحكم</CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                ألعاب الغريب — تسجيل دخول المشرف
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertDescription className="text-red-400">{loginError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label className="text-slate-300">اسم المستخدم</Label>
                <Input
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  placeholder="admin"
                  dir="ltr"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-slate-800/50 border-slate-700/50 text-white pl-10"
                    placeholder="••••••••"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Shield className="w-4 h-4 ml-2" />
                )}
                تسجيل الدخول
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Admin dashboard ────────────────────────────────────────────────

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-slate-900/95 border-l border-slate-800/50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">لوحة التحكم</h2>
                <p className="text-[10px] text-slate-500">ألعاب الغريب</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeSection === item.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              {item.label}
              {item.id === 'messages' && unreadCount > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] mr-auto">
                  {unreadCount}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">المشرف</p>
              <p className="text-[10px] text-slate-500">Super Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-white">
                {navItems.find((n) => n.id === activeSection)?.label || 'لوحة التحكم'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (activeSection === 'messages') fetchMessages();
                  else fetchStats();
                }}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('messages')}
                className="text-slate-400 hover:text-white relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="p-4 md:p-6">
          {/* ─── Dashboard ─────────────────────────────────── */}
          {activeSection === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900/60 border-slate-800/40">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{stats.enabledGames}</p>
                      <p className="text-xs text-slate-500">ألعاب مفعّلة</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/60 border-slate-800/40">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{stats.activeSubscriptions}</p>
                      <p className="text-xs text-slate-500">اشتراكات نشطة</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/60 border-slate-800/40">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{stats.sessionsToday}</p>
                      <p className="text-xs text-slate-500">جلسات اليوم</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/60 border-slate-800/40">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{stats.totalPlayers}</p>
                      <p className="text-xs text-slate-500">إجمالي اللاعبين</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick actions + Game stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Quick actions */}
                <Card className="bg-slate-900/60 border-slate-800/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-white">إجراءات سريعة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-700/50 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                      onClick={() => setActiveSection('games')}
                    >
                      <Gamepad2 className="w-4 h-4 ml-2" />
                      إدارة الألعاب
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-700/50 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                      onClick={() => setActiveSection('messages')}
                    >
                      <MessageSquare className="w-4 h-4 ml-2" />
                      الرسائل {unreadCount > 0 && `(${unreadCount})`}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-700/50 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                      onClick={() => setActiveSection('settings')}
                    >
                      <Settings className="w-4 h-4 ml-2" />
                      الإعدادات
                    </Button>
                  </CardContent>
                </Card>

                {/* Game stats */}
                <Card className="bg-slate-900/60 border-slate-800/40 lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      إحصائيات الألعاب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.gameStats.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">لا توجد جلسات بعد</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {stats.gameStats.map((gs) => (
                          <div
                            key={gs.slug}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{gs.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>{gs.sessions} جلسة</span>
                              <span>{gs.players} لاعب</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Subscriber stats */}
              <Card className="bg-slate-900/60 border-slate-800/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    المشتركين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                      <p className="text-lg font-black text-white">{stats.totalSubscriptions}</p>
                      <p className="text-[10px] text-slate-500">إجمالي المشتركين</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-lg font-black text-emerald-400">{stats.activeSubscriptions}</p>
                      <p className="text-[10px] text-slate-500">نشط</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                      <p className="text-lg font-black text-white">{stats.totalSubscriptions - stats.activeSubscriptions}</p>
                      <p className="text-[10px] text-slate-500">غير نشط</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                      <p className="text-lg font-black text-white">{subscriptions.filter((s) => s.plan === 'paid').length}</p>
                      <p className="text-[10px] text-slate-500">مدفوع</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overview stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/30">
                  <p className="text-xl font-black text-white">{stats.totalGames}</p>
                  <p className="text-xs text-slate-500">إجمالي الألعاب</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/30">
                  <p className="text-xl font-black text-white">{stats.totalSessions}</p>
                  <p className="text-xs text-slate-500">إجمالي الجلسات</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/30">
                  <p className="text-xl font-black text-white">{stats.comingSoonGames}</p>
                  <p className="text-xs text-slate-500">ألعاب قادمة</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/30">
                  <p className="text-xl font-black text-white">{stats.unreadMessages}</p>
                  <p className="text-xs text-slate-500">رسائل غير مقروءة</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Games Management ───────────────────────────── */}
          {activeSection === 'games' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {games.length} لعبة — {games.filter((g) => g.isEnabled).length} مفعّلة
                </p>
              </div>

              <div className="space-y-2">
                {games.map((game, index) => {
                  const colors = colorMap[game.color] || colorMap.red;
                  return (
                    <Card
                      key={game.id}
                      className={`bg-slate-900/60 ${colors.border} transition-all`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Game info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center text-2xl`}>
                              {game.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-bold ${colors.text}`}>{game.gameName}</h3>
                                <span className="text-xs text-slate-500 font-mono" dir="ltr">{game.gameSlug}</span>
                                {!game.isEnabled && (
                                  <Badge variant="outline" className="border-slate-600 text-slate-500 text-[10px]">معطّلة</Badge>
                                )}
                                {game.isComingSoon && (
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">قريباً</Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{game.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600">
                                <span>لاعبين: {game.playerRange}</span>
                                <span>•</span>
                                <span>ترتيب: {game.order}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Order buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => moveGameOrder(index, 'up')}
                                disabled={index === 0}
                                className="p-1 rounded hover:bg-slate-800/50 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveGameOrder(index, 'down')}
                                disabled={index === games.length - 1}
                                className="p-1 rounded hover:bg-slate-800/50 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <Separator orientation="vertical" className="h-8 mx-1" />

                            {/* Toggle enabled */}
                            <div className="flex items-center gap-1.5">
                              <Switch
                                checked={game.isEnabled}
                                onCheckedChange={() => toggleGameEnabled(game.gameSlug, game.isEnabled)}
                              />
                              <span className="text-[10px] text-slate-500">تفعيل</span>
                            </div>

                            <Separator orientation="vertical" className="h-8 mx-1" />

                            {/* Toggle coming soon */}
                            <div className="flex items-center gap-1.5">
                              <Switch
                                checked={game.isComingSoon}
                                onCheckedChange={() => toggleComingSoon(game.gameSlug, game.isComingSoon)}
                              />
                              <span className="text-[10px] text-slate-500">قريباً</span>
                            </div>

                            <Separator orientation="vertical" className="h-8 mx-1" />

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-white"
                              onClick={() => {
                                setEditingGame({ ...game });
                                setEditGameOpen(true);
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Subscriptions ──────────────────────────────── */}
          {activeSection === 'subscriptions' && (
            <div className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/40">
                  <p className="text-xl font-black text-white">{subscriptions.length}</p>
                  <p className="text-[10px] text-slate-500">إجمالي المشتركين</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xl font-black text-emerald-400">{subscriptions.filter((s) => s.isActive).length}</p>
                  <p className="text-[10px] text-slate-500">نشط</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xl font-black text-amber-400">{subscriptions.filter((s) => s.plan === 'free').length}</p>
                  <p className="text-[10px] text-slate-500">مجاني</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xl font-black text-rose-400">{subscriptions.filter((s) => s.plan === 'paid').length}</p>
                  <p className="text-[10px] text-slate-500">مدفوع</p>
                </div>
              </div>

              {/* Header with add button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {subscriptions.length} مشترك — {subscriptions.filter((s) => s.isActive).length} نشط
                </p>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={openAddSubscriberDialog}>
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة مشترك
                </Button>
              </div>

              {/* Subscribers list */}
              <Card className="bg-slate-900/60 border-slate-800/40">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800/40 hover:bg-transparent">
                          <TableHead className="text-slate-400">الاسم</TableHead>
                          <TableHead className="text-slate-400">البريد</TableHead>
                          <TableHead className="text-slate-400">الكود</TableHead>
                          <TableHead className="text-slate-400">النوع</TableHead>
                          <TableHead className="text-slate-400">الألعاب</TableHead>
                          <TableHead className="text-slate-400">الحالة</TableHead>
                          <TableHead className="text-slate-400">الانتهاء</TableHead>
                          <TableHead className="text-slate-400 text-left">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                              لا يوجد مشتركين
                            </TableCell>
                          </TableRow>
                        ) : (
                          subscriptions.map((sub) => {
                            const isExpired = sub.endDate && new Date(sub.endDate) < new Date();
                            const statusIcon = !sub.isActive ? '❌' : isExpired ? '⏰' : '🟢';
                            const statusText = !sub.isActive ? 'معطل' : isExpired ? 'منتهي' : 'نشط';
                            const statusClass = !sub.isActive ? 'bg-red-500/20 text-red-400 border-red-500/30' : isExpired ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                            return (
                              <>
                                <TableRow
                                  key={sub.id}
                                  className="border-slate-800/30 cursor-pointer hover:bg-slate-800/30"
                                  onClick={() => setExpandedSubId(expandedSubId === sub.id ? null : sub.id)}
                                >
                                  <TableCell className="text-white font-medium">{sub.name}</TableCell>
                                  <TableCell className="text-slate-400 text-xs" dir="ltr">{sub.email}</TableCell>
                                  <TableCell>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copySubscriptionCode(sub.subscriptionCode); }}
                                      className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 transition-colors"
                                    >
                                      {sub.subscriptionCode}
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`text-[10px] ${sub.plan === 'paid' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : sub.plan === 'trial' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                                      {sub.plan === 'paid' ? <><Crown className="w-3 h-3 ml-1" />مدفوع</> : sub.plan === 'trial' ? <><Gift className="w-3 h-3 ml-1" />تجربة</> : <><Gift className="w-3 h-3 ml-1" />مجاني</>}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-0.5 flex-wrap max-w-[120px]">
                                      {sub.allowedGames && sub.allowedGames.length > 0
                                        ? sub.allowedGames.slice(0, 3).map((slug) => {
                                            const g = games.find((gm) => gm.gameSlug === slug);
                                            return (
                                              <span key={slug} className="text-xs" title={g?.gameName || slug}>
                                                {g?.icon || '🎮'}
                                              </span>
                                            );
                                          })
                                        : <span className="text-[10px] text-slate-600">—</span>}
                                      {(sub.allowedGames?.length ?? 0) > 3 && (
                                        <span className="text-[10px] text-slate-500">+{sub.allowedGames.length - 3}</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`text-[10px] ${statusClass}`}>
                                      {statusIcon} {statusText}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-500">
                                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString('ar-SA') : '—'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-amber-400 p-1 h-7 w-7" onClick={() => openEditSubscriberDialog(sub)} title="تعديل">
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-400 p-1 h-7 w-7" onClick={() => deleteSubscriber(sub.id)} title="حذف">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-emerald-400 p-1 h-7 w-7" onClick={() => toggleSubscriptionActive(sub.id)} title={sub.isActive ? 'تعطيل' : 'تفعيل'}>
                                        <Zap className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {/* Expanded details */}
                                {expandedSubId === sub.id && (
                                  <TableRow key={`${sub.id}-detail`} className="border-slate-800/20 bg-slate-800/20">
                                    <TableCell colSpan={8} className="p-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                        <div>
                                          <p className="text-xs text-slate-500 mb-1">الهاتف</p>
                                          <p className="text-slate-300" dir="ltr">{sub.phone || '—'}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-slate-500 mb-1">📱 تيليجرام</p>
                                          {sub.telegram ? (
                                            <a
                                              href={`https://t.me/${sub.telegram.replace('@', '')}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                                              dir="ltr"
                                            >
                                              {sub.telegram.startsWith('@') ? sub.telegram : `@${sub.telegram}`}
                                            </a>
                                          ) : (
                                            <p className="text-slate-600">—</p>
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-xs text-slate-500 mb-1">تاريخ البداية</p>
                                          <p className="text-slate-300">{sub.startDate ? new Date(sub.startDate).toLocaleDateString('ar-SA') : '—'}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-slate-500 mb-1">تاريخ التسجيل</p>
                                          <p className="text-slate-300">{new Date(sub.createdAt).toLocaleDateString('ar-SA')}</p>
                                        </div>
                                        <div className="sm:col-span-3">
                                          <p className="text-xs text-slate-500 mb-1">الألعاب المتاحة</p>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {sub.allowedGames && sub.allowedGames.length > 0
                                              ? sub.allowedGames.map((slug) => {
                                                  const g = games.find((gm) => gm.gameSlug === slug);
                                                  return (
                                                    <Badge key={slug} className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                                                      {g?.icon || '🎮'} {g?.gameName || slug}
                                                    </Badge>
                                                  );
                                                })
                                              : <span className="text-slate-600 text-xs">لا توجد ألعاب مخصصة</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Sessions ───────────────────────────────────── */}
          {activeSection === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-slate-400">{sessions.length} جلسة</p>
                <Select onValueChange={(v) => fetchSessions(v === 'all' ? undefined : v)}>
                  <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 text-white text-sm">
                    <SelectValue placeholder="فلتر حسب اللعبة" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">جميع الألعاب</SelectItem>
                    {games.map((g) => (
                      <SelectItem key={g.gameSlug} value={g.gameSlug}>
                        {g.icon} {g.gameName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-slate-900/60 border-slate-800/40">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800/40 hover:bg-transparent">
                          <TableHead className="text-slate-400">اللعبة</TableHead>
                          <TableHead className="text-slate-400">المضيف</TableHead>
                          <TableHead className="text-slate-400">اللاعبين</TableHead>
                          <TableHead className="text-slate-400">المدة</TableHead>
                          <TableHead className="text-slate-400">التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                              لا توجد جلسات
                            </TableCell>
                          </TableRow>
                        ) : (
                          sessions.map((session) => {
                            const game = games.find((g) => g.gameSlug === session.gameSlug);
                            return (
                              <TableRow key={session.id} className="border-slate-800/30">
                                <TableCell className="text-white font-medium">
                                  {game?.icon || '🎮'} {game?.gameName || session.gameSlug}
                                </TableCell>
                                <TableCell className="text-slate-400">{session.hostName}</TableCell>
                                <TableCell className="text-slate-400">{session.playersCount}</TableCell>
                                <TableCell className="text-slate-400">
                                  {session.duration ? `${Math.floor(session.duration / 60)} دقيقة` : '—'}
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">
                                  {new Date(session.createdAt).toLocaleString('ar-SA')}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Messages ───────────────────────────────────── */}
          {activeSection === 'messages' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                {messages.length} رسالة — {messages.filter((m) => !m.isRead).length} غير مقروءة
              </p>

              {messages.length === 0 ? (
                <Card className="bg-slate-900/60 border-slate-800/40">
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">لا توجد رسائل</p>
                  </CardContent>
                </Card>
              ) : (
                messages.map((msg) => (
                  <Card
                    key={msg.id}
                    className={`bg-slate-900/60 border-slate-800/40 ${!msg.isRead ? 'border-r-2 border-r-emerald-500' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-white text-sm">{msg.name}</span>
                            <span className="text-xs text-slate-500" dir="ltr">{msg.email}</span>
                            {!msg.isRead && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                جديدة
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(msg.createdAt).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!msg.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-emerald-400"
                              onClick={() => markMessageRead(msg.id)}
                              title="تحديد كمقروءة"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-red-400"
                            onClick={() => deleteMessage(msg.id)}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ─── Tables (Live Monitoring) ────────────────────────── */}
          {activeSection === 'tables' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-400">{tables.length} طاولة نشطة</p>
                  {tables.length > 0 && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full ml-1.5 animate-pulse" />
                      مباشر
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
                    onClick={handleCloseInactive}
                    disabled={closingInactive || tables.length === 0}
                  >
                    {closingInactive ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 ml-1" />}
                    إغلاق غير النشطة (24س)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700/50 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                    onClick={() => fetchTables()}
                  >
                    <RefreshCw className="w-3.5 h-3.5 ml-1" />
                    تحديث
                  </Button>
                </div>
              </div>

              {/* Search */}
              {tables.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث بالكود، المضيف، أو اسم اللعبة..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40"
                    dir="rtl"
                  />
                  {tableSearch && (
                    <button
                      onClick={() => setTableSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Delete confirmation dialog */}
              <Dialog open={!!tableDeleteConfirm} onOpenChange={(open) => { if (!open) setTableDeleteConfirm(null); }}>
                <DialogContent className="bg-slate-900 border-slate-800/60 text-white" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-400" />
                      تأكيد إغلاق الطاولة
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      هل أنت متأكد من إغلاق الطاولة <span className="text-white font-mono font-bold">{tableDeleteConfirm}</span>؟
                      <br />
                      سيتم حذفها نهائياً من قاعدة البيانات.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      className="border-slate-700/50 text-slate-300 hover:bg-slate-800/50"
                      onClick={() => setTableDeleteConfirm(null)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-500 text-white"
                      onClick={() => { if (tableDeleteConfirm) closeTable(tableDeleteConfirm); }}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      إغلاق الطاولة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Tables grid */}
              {filteredTables.length === 0 ? (
                <Card className="bg-slate-900/60 border-slate-800/40">
                  <CardContent className="py-16 text-center">
                    <Monitor className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {tableSearch ? 'لا توجد طاولات تطابق البحث' : 'لا توجد طاولات نشطة حالياً'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredTables.map((table) => {
                    const gt = table.gameType || '';
                    const gameColor = gameColorMap[gt] || 'red';
                    const colors = colorMap[gameColor] || colorMap.red;
                    const phaseMap: Record<string, { label: string; cls: string }> = {
                      waiting: { label: 'في الانتظار', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
                      playing: { label: 'قيد اللعب', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                      game_over: { label: 'انتهت', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
                      night: { label: 'الليل', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
                      day: { label: 'النهار', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                      voting: { label: 'تصويت', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
                    };
                    const phaseInfo = phaseMap[table.phase] || { label: table.phase, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
                    const gameMode = gt.includes('godfather') ? 'العراب' : 'الديوانية';
                    const timeSinceUpdate = (() => {
                      const diff = Math.floor((Date.now() - new Date(table.updatedAt).getTime()) / 1000);
                      if (diff < 60) return `منذ ${diff} ثانية`;
                      if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
                      return `منذ ${Math.floor(diff / 3600)} ساعة`;
                    })();
                    const watchUrl = gt === 'mafia' ? `/join/${table.code}` : `/${gt}`;

                    return (
                      <Card key={table.id} className={`bg-gradient-to-br ${colors.bg} ${colors.border} border transition-all`}>
                        <CardContent className="p-4 space-y-3">
                          {/* Top: badges */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <Badge className={`${colors.badge} text-[10px] border`}>
                              {gameNameMap[gt] || gt}
                            </Badge>
                            <Badge className={`${phaseInfo.cls} text-[10px] border`}>
                              {phaseInfo.label}
                            </Badge>
                          </div>

                          {/* Room code */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { navigator.clipboard.writeText(table.code); showToast('تم نسخ الكود'); }}
                              className="text-2xl font-black text-white font-mono tracking-widest hover:opacity-80 transition-opacity"
                              dir="ltr"
                              title="انقر للنسخ"
                            >
                              {table.code}
                            </button>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                          </div>

                          {/* Game mode */}
                          <Badge variant="outline" className="border-slate-600/50 text-slate-400 text-[10px]">
                            {gameMode}
                          </Badge>

                          {/* Info grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/30">
                              <p className="text-slate-500 mb-0.5">المضيف</p>
                              <p className="text-slate-300 font-medium truncate">{table.hostName}</p>
                            </div>
                            <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/30">
                              <p className="text-slate-500 mb-0.5">اللاعبين</p>
                              <p className="text-slate-300 font-medium">
                                {table.joinedPlayerCount} / {table.playerCount}
                              </p>
                            </div>
                          </div>

                          {/* Extra info */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeSinceUpdate}
                            </span>
                            <span className="flex items-center gap-2">
                              {table.phase === 'playing' && table.round > 0 && (
                                <span>الجولة {table.round}</span>
                              )}
                              {table.gameWinner && (
                                <span className="text-emerald-400">الفائز: {table.gameWinner}</span>
                              )}
                            </span>
                          </div>

                          {/* Creation date */}
                          <div className="text-[10px] text-slate-600" title={`أنشئت: ${table.createdAt ? new Date(table.createdAt).toLocaleString('ar-SA') : '-'}`}>
                            📅 {table.createdAt ? new Date(table.createdAt).toLocaleString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                              onClick={() => window.open(watchUrl, '_blank')}
                            >
                              <Eye className="w-3.5 h-3.5 ml-1" />
                              مشاهدة
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
                              onClick={() => setTableDeleteConfirm(table.code)}
                            >
                              <Trash2 className="w-3.5 h-3.5 ml-1" />
                              إغلاق
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Settings ───────────────────────────────────── */}
          {activeSection === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* Site Config - Registration & Subscription */}
              <Card className="bg-slate-900/60 border-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    إعدادات التسجيل والاشتراك
                  </CardTitle>
                  <CardDescription className="text-slate-500">إعدادات التسجيل المباشر وعرض الأسعار والتواصل</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Allow direct registration - Auto-save toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${siteConfigForm.allowDirectRegistration ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        {siteConfigForm.allowDirectRegistration ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <X className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm font-medium block">التسجيل المباشر (التجربة المجانية)</Label>
                        <span className={`text-[10px] font-bold ${siteConfigForm.allowDirectRegistration ? 'text-emerald-400' : 'text-red-400'}`}>
                          {siteConfigForm.allowDirectRegistration ? '● مفعّل - يمكن للمستخدمين التسجيل للحصول على تجربة مجانية' : '● معطّل - التسجيل فقط عن طريق الأدمن'}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={siteConfigForm.allowDirectRegistration}
                      onCheckedChange={toggleRegistration}
                    />
                  </div>

                  {/* Trial Settings */}
                  {siteConfigForm.allowDirectRegistration && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 p-4 rounded-xl bg-violet-950/20 border border-violet-500/20"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-bold text-violet-300">إعدادات التجربة المجانية</span>
                      </div>

                      {/* Trial duration */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-violet-400" />
                          مدة التجربة (أيام)
                        </Label>
                        <div className="flex items-center gap-2" dir="ltr">
                          <button
                            type="button"
                            onClick={() => setSiteConfigForm((prev) => ({ ...prev, trialDurationDays: Math.max(0, prev.trialDurationDays - 1) }))}
                            className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:text-white flex items-center justify-center transition-colors text-lg font-bold"
                          >
                            −
                          </button>
                          <div className="w-16 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-white font-bold text-base">
                            {siteConfigForm.trialDurationDays}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSiteConfigForm((prev) => ({ ...prev, trialDurationDays: Math.min(30, prev.trialDurationDays + 1) }))}
                            className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:text-white flex items-center justify-center transition-colors text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">0 = بدون حد زمني</p>
                      </div>

                      {/* Max trial sessions */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-2">
                          <Gamepad2 className="w-3.5 h-3.5 text-violet-400" />
                          عدد الجولات المسموحة
                        </Label>
                        <div className="flex items-center gap-2" dir="ltr">
                          <button
                            type="button"
                            onClick={() => setSiteConfigForm((prev) => ({ ...prev, maxTrialSessions: Math.max(1, prev.maxTrialSessions - 1) }))}
                            className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:text-white flex items-center justify-center transition-colors text-lg font-bold"
                          >
                            −
                          </button>
                          <div className="w-16 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-white font-bold text-base">
                            {siteConfigForm.maxTrialSessions}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSiteConfigForm((prev) => ({ ...prev, maxTrialSessions: Math.min(99, prev.maxTrialSessions + 1) }))}
                            className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:text-white flex items-center justify-center transition-colors text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">عدد المرات التي يمكن للمستخدم الدخول للعبة خلال التجربة</p>
                      </div>

                      {/* Trial games selection */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300 text-sm flex items-center gap-2">
                            <Crown className="w-3.5 h-3.5 text-violet-400" />
                            ألعاب التجربة
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={selectAllTrialGames}
                            className="text-[10px] text-violet-400 hover:text-violet-300 h-7 px-2"
                          >
                            {siteConfigForm.trialGameSlugs.length === games.filter((g) => g.isEnabled && !g.isComingSoon).length ? 'إلغاء الكل' : 'تحديد الكل'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {games.filter((g) => g.isEnabled && !g.isComingSoon).map((game) => (
                            <label
                              key={game.gameSlug}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                siteConfigForm.trialGameSlugs.includes(game.gameSlug)
                                  ? 'bg-violet-500/10 border-violet-500/30'
                                  : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                              }`}
                            >
                              <Checkbox
                                checked={siteConfigForm.trialGameSlugs.includes(game.gameSlug)}
                                onCheckedChange={() => {
                                  setSiteConfigForm((prev) => ({
                                    ...prev,
                                    trialGameSlugs: prev.trialGameSlugs.includes(game.gameSlug)
                                      ? prev.trialGameSlugs.filter((s) => s !== game.gameSlug)
                                      : [...prev.trialGameSlugs, game.gameSlug],
                                  }));
                                }}
                              />
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-base">{game.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-slate-300 truncate">{game.gameName}</p>
                                  <p className="text-[10px] text-slate-500">{game.playerRange} لاعب</p>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                        {siteConfigForm.trialGameSlugs.length === 0 && (
                          <p className="text-[10px] text-amber-400">⚠️ لم يتم تحديد ألعاب. التجربة ستشمل جميع الألعاب.</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <Separator className="bg-slate-800/50" />

                  {/* Telegram link */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm flex items-center gap-2">
                      📱 رابط تيليجرام
                    </Label>
                    <Input
                      value={siteConfigForm.telegramLink}
                      onChange={(e) => setSiteConfigForm((prev) => ({ ...prev, telegramLink: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                      placeholder="https://t.me/..."
                      dir="ltr"
                    />
                  </div>

                  {/* WhatsApp link */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm flex items-center gap-2">
                      💬 رابط واتساب
                    </Label>
                    <Input
                      value={siteConfigForm.whatsappLink}
                      onChange={(e) => setSiteConfigForm((prev) => ({ ...prev, whatsappLink: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                      placeholder="https://wa.me/..."
                      dir="ltr"
                    />
                  </div>

                  <Separator className="bg-slate-800/50" />

                  {/* Subscription price */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm flex items-center gap-2">
                      💰 سعر الاشتراك
                    </Label>
                    <Input
                      value={siteConfigForm.subscriptionPrice}
                      onChange={(e) => setSiteConfigForm((prev) => ({ ...prev, subscriptionPrice: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                      placeholder="5 دينار/شهر"
                    />
                  </div>

                  {/* Contact message */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm flex items-center gap-2">
                      📩 رسالة التواصل
                    </Label>
                    <Textarea
                      value={siteConfigForm.contactMessage}
                      onChange={(e) => setSiteConfigForm((prev) => ({ ...prev, contactMessage: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                      placeholder="رسالة مخصصة تظهر في صفحة التسجيل..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={saveSiteConfig}
                    disabled={siteConfigSaving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {siteConfigSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                    حفظ الإعدادات
                  </Button>
                </CardContent>
              </Card>

              {/* Change password */}
              <Card className="bg-slate-900/60 border-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    تغيير كلمة المرور
                  </CardTitle>
                  <CardDescription className="text-slate-500">قم بتغيير كلمة مرور المشرف</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300">كلمة المرور الحالية</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">كلمة المرور الجديدة</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">تأكيد كلمة المرور الجديدة</Label>
                    <Input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                      dir="ltr"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    تحديث كلمة المرور
                  </Button>
                </CardContent>
              </Card>

              {/* How Admin Panel Works */}
              <Card className="bg-slate-900/60 border-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    كيف تعمل لوحة التحكم؟
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs text-slate-400">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <p><strong className="text-slate-300">فوري:</strong> تغييرات الألعاب (تفعيل/تعطيل، قريباً، الوصف، الأيقونة، عدد اللاعبين، الترتيب) تظهر <strong className="text-white">فوراً</strong> بدون نشر.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">ℹ</span>
                      <p><strong className="text-slate-300">قاعدة البيانات:</strong> جميع التغييرات تُحفظ مباشرة في قاعدة بيانات Turso وتنعكس تلقائياً على الموقع.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">⚠</span>
                      <p><strong className="text-slate-300">متى تحتاج نشر؟</strong> فقط عند تغيير الكود المصدري (إضافة لعبة جديدة، تعديل التصميم).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System info */}
              {systemInfo && (
                <Card className="bg-slate-900/60 border-slate-800/40">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-400" />
                      معلومات النظام
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">البيئة</span>
                        <span className="text-slate-300">{systemInfo.environment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">قاعدة البيانات</span>
                        <span className="text-slate-300">{systemInfo.database}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Node.js</span>
                        <span className="text-slate-300" dir="ltr">{systemInfo.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">المنصة</span>
                        <span className="text-slate-300" dir="ltr">{systemInfo.platform}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Danger zone */}
              <Card className="bg-slate-900/60 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-red-400">تسجيل الخروج</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل الخروج
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Subscriber dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800/50 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingSubscriber ? 'تعديل المشترك' : 'إضافة مشترك جديد'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingSubscriber ? `تعديل بيانات ${editingSubscriber.name}` : 'أدخل بيانات المشترك الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">الاسم <span className="text-red-400">*</span></Label>
                <Input
                  value={subForm.name}
                  onChange={(e) => setSubForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  placeholder="اسم المشترك"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">البريد <span className="text-red-400">*</span></Label>
                <Input
                  value={subForm.email}
                  onChange={(e) => setSubForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  placeholder="email@example.com"
                  dir="ltr"
                  type="email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">الهاتف</Label>
                <Input
                  value={subForm.phone}
                  onChange={(e) => setSubForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  placeholder="+965 ..."
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-1">
                  📱 تيليجرام
                </Label>
                <Input
                  value={subForm.telegram}
                  onChange={(e) => setSubForm((prev) => ({ ...prev, telegram: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  placeholder="@username"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">النوع</Label>
                <Select value={subForm.plan} onValueChange={(v) => setSubForm((prev) => ({ ...prev, plan: v }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="free">مجاني</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">تاريخ البداية</Label>
                <Input
                  type="date"
                  value={subForm.startDate}
                  onChange={(e) => setSubForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={subForm.endDate}
                  onChange={(e) => setSubForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  dir="ltr"
                />
              </div>
            </div>

            <Separator className="bg-slate-800/50" />

            {/* Game access selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm font-medium">
                  الألعاب المتاحة
                  {games.length === 0 && (
                    <span className="text-amber-400 text-[10px] mr-2">جارٍ التحميل...</span>
                  )}
                </Label>
                {games.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                    onClick={selectAllGamesInForm}
                  >
                    {subForm.allowedGames.length === games.length ? 'إلغاء التحديد' : 'تحديد الكل'}
                  </Button>
                )}
              </div>
              {games.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  جارٍ تحميل قائمة الألعاب...
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-2">
                {games.map((game) => (
                  <label
                    key={game.gameSlug}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/30 cursor-pointer hover:bg-slate-800/60 transition-colors"
                  >
                    <Checkbox
                      checked={subForm.allowedGames.includes(game.gameSlug)}
                      onCheckedChange={() => toggleGameInForm(game.gameSlug)}
                    />
                    <span className="text-sm">{game.icon}</span>
                    <span className="text-xs text-slate-300">{game.gameName}</span>
                  </label>
                ))}
              </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)} className="border-slate-700 text-slate-300">
              إلغاء
            </Button>
            <Button
              onClick={saveSubscriber}
              disabled={subFormLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {subFormLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {editingSubscriber ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit game dialog */}
      <Dialog open={editGameOpen} onOpenChange={setEditGameOpen}>
        <DialogContent className="bg-slate-900 border-slate-800/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">تعديل اللعبة</DialogTitle>
            <DialogDescription className="text-slate-400">
              تعديل إعدادات {editingGame?.gameName}
            </DialogDescription>
          </DialogHeader>
          {editingGame && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-300">اسم اللعبة</Label>
                <Input
                  value={editingGame.gameName}
                  onChange={(e) => setEditingGame({ ...editingGame, gameName: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">الوصف</Label>
                <Textarea
                  value={editingGame.description}
                  onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">الأيقونة (إيموجي)</Label>
                  <Input
                    value={editingGame.icon}
                    onChange={(e) => setEditingGame({ ...editingGame, icon: e.target.value })}
                    className="bg-slate-800/50 border-slate-700/50 text-white"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">اللون</Label>
                  <Select
                    value={editingGame.color}
                    onValueChange={(v) => setEditingGame({ ...editingGame, color: v })}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {Object.keys(colorMap).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">نطاق اللاعبين</Label>
                <Input
                  value={editingGame.playerRange}
                  onChange={(e) => setEditingGame({ ...editingGame, playerRange: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  placeholder="4-14"
                  dir="ltr"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGameOpen(false)} className="border-slate-700 text-slate-300">
              إلغاء
            </Button>
            <Button onClick={saveGameEdit} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
