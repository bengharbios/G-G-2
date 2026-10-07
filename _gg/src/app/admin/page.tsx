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
  Search,
  Frame,
  User,
  ImageIcon,
  Upload,
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

type ActiveSection = 'dashboard' | 'games' | 'subscriptions' | 'sessions' | 'messages' | 'settings' | 'tables' | 'gem-charges' | 'leaderboard' | 'events' | 'frames' | 'users' | 'backgrounds';

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
  { id: 'frames', label: 'إدارة الإطارات', icon: <Frame className="w-5 h-5" /> },
  { id: 'users', label: 'إدارة المستخدمين', icon: <UserPlus className="w-5 h-5" /> },
  { id: 'backgrounds', label: 'خلفيات الرومات', icon: <ImageIcon className="w-5 h-5" /> },
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
  shifarat: 'emerald',
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

  // Users management
  const [appUsers, setAppUsers] = useState<Array<{
    id: string; username: string; email: string; displayName: string;
    phone: string; avatar: string; role: string; isActive: boolean;
    subscriptionId: string | null; lastLoginAt: string | null; createdAt: string;
  }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<typeof appUsers[number] | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', role: 'user', isActive: true });
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Frames management
  const [frames, setFrames] = useState<Array<{
    id: string; name: string; nameAr: string; description: string; imageUrl: string;
    rarity: string; gradientFrom: string; gradientTo: string; borderColor: string;
    glowColor: string; pattern: string; price: number; isFree: boolean; isActive: boolean;
    sortOrder: number; totalOwned: number; createdAt: string; updatedAt: string;
  }>>([]);
  const [frameFormOpen, setFrameFormOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<typeof frames[number] | null>(null);
  const [frameForm, setFrameForm] = useState({
    name: '', nameAr: '', description: '', rarity: 'common' as string,
    gradientFrom: '#f59e0b', gradientTo: '#eab308', borderColor: 'rgba(245, 158, 11, 0.7)',
    glowColor: 'rgba(245, 158, 11, 0.4)', pattern: 'gradient' as string,
    price: 0, isFree: false, isActive: true, sortOrder: 0,
  });
  const [frameFormLoading, setFrameFormLoading] = useState(false);
  // Grant frame state
  const [grantFrameOpen, setGrantFrameOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({ userId: '', frameId: '', obtainedFrom: 'admin', obtainedNote: '' });
  const [grantSelectedUser, setGrantSelectedUser] = useState<{ id: string; username: string; displayName: string } | null>(null);
  const [grantLoading, setGrantLoading] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; username: string; displayName: string }>>([]);
  // Backgrounds state
  const [backgrounds, setBackgrounds] = useState<Array<{
    id: string; name: string; nameAr: string; description: string; imageUrl: string;
    thumbnailUrl: string; rarity: string; price: number; isFree: boolean; isDefault: boolean;
    isActive: boolean; sortOrder: number; totalOwned: number; createdAt: string; updatedAt: string;
  }>>([]);
  const [bgFormOpen, setBgFormOpen] = useState(false);
  const [editingBg, setEditingBg] = useState<typeof backgrounds[number] | null>(null);
  const [bgForm, setBgForm] = useState({
    name: '', nameAr: '', description: '', imageUrl: '', thumbnailUrl: '',
    rarity: 'common' as string, price: 0, isFree: false, isDefault: false, isActive: true, sortOrder: 0,
  });
  const [bgFormLoading, setBgFormLoading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);

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

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setAppUsers(data.users || []);
      }
    } catch { /* ignore */ }
    setUsersLoading(false);
  }, []);

  const fetchFrames = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/frames');
      if (res.ok) {
        const data = await res.json();
        setFrames(data.frames || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchBackgrounds = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/backgrounds');
      if (res.ok) {
        const data = await res.json();
        setBackgrounds(data.backgrounds || []);
      }
    } catch { /* ignore */ }
  }, []);

  // ─── User CRUD Operations ───────────────────────────────────────────

  const handleEditUser = useCallback((user: typeof appUsers[number]) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName || '',
      phone: user.phone || '',
      role: user.role || 'user',
      isActive: user.isActive,
    });
    setShowEditDialog(true);
  }, []);

  const handleSaveUser = useCallback(async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('تم تحديث المستخدم بنجاح');
        setShowEditDialog(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        showToast(data.error || 'حدث خطأ أثناء التحديث', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setSavingUser(false);
    }
  }, [editingUser, editForm, fetchUsers, showToast]);

  const handleDeleteUser = useCallback((userId: string) => {
    setDeletingUserId(userId);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!deletingUserId) return;
    try {
      const res = await fetch(`/api/admin/users/${deletingUserId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('تم تعطيل المستخدم بنجاح');
        fetchUsers();
      } else {
        showToast(data.error || 'حدث خطأ أثناء الحذف', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingUserId(null);
    }
  }, [deletingUserId, fetchUsers, showToast]);

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
      case 'frames':
        fetchFrames();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'backgrounds':
        fetchBackgrounds();
        break;
      case 'settings':
        fetchSettings();
        break;
    }
  }, [activeSection, isAuthenticated, fetchStats, fetchGames, fetchSubscriptions, fetchSessions, fetchMessages, fetchSettings, fetchTables, fetchEvents, fetchGemCharges, fetchLeaderboard, fetchFrames, fetchUsers, fetchBackgrounds, gamesLoadedOnce, games.length]);

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

  // ─── Frames handlers ──────────────────────────────────────────────

  const openAddFrameDialog = () => {
    setEditingFrame(null);
    setFrameForm({
      name: '', nameAr: '', description: '', rarity: 'common',
      gradientFrom: '#f59e0b', gradientTo: '#eab308', borderColor: 'rgba(245, 158, 11, 0.7)',
      glowColor: 'rgba(245, 158, 11, 0.4)', pattern: 'gradient',
      price: 0, isFree: false, isActive: true, sortOrder: frames.length,
    });
    setFrameFormOpen(true);
  };

  const openEditFrameDialog = (frame: typeof frames[number]) => {
    setEditingFrame(frame);
    setFrameForm({
      name: frame.name, nameAr: frame.nameAr, description: frame.description,
      rarity: frame.rarity, gradientFrom: frame.gradientFrom, gradientTo: frame.gradientTo,
      borderColor: frame.borderColor, glowColor: frame.glowColor, pattern: frame.pattern,
      price: frame.price, isFree: frame.isFree, isActive: frame.isActive, sortOrder: frame.sortOrder,
    });
    setFrameFormOpen(true);
  };

  const saveFrame = async () => {
    if (!frameForm.name || !frameForm.nameAr) {
      showToast('اسم الإطار مطلوب', 'error');
      return;
    }
    setFrameFormLoading(true);
    try {
      if (editingFrame) {
        const res = await fetch('/api/admin/frames', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingFrame.id, ...frameForm }),
        });
        if (res.ok) {
          const data = await res.json();
          setFrames(prev => prev.map(f => f.id === data.frame.id ? data.frame : f));
          showToast('تم تحديث الإطار بنجاح');
          setFrameFormOpen(false);
        }
      } else {
        const res = await fetch('/api/admin/frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(frameForm),
        });
        if (res.ok) {
          showToast('تم إنشاء الإطار بنجاح');
          setFrameFormOpen(false);
          fetchFrames();
        }
      }
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setFrameFormLoading(false);
    }
  };

  const deleteFrameHandler = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/frames?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setFrames(prev => prev.filter(f => f.id !== id));
        showToast('تم حذف الإطار');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const toggleFrameActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/frames', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !active }),
      });
      if (res.ok) {
        setFrames(prev => prev.map(f => f.id === id ? { ...f, isActive: !active } : f));
        showToast(active ? 'تم تعطيل الإطار' : 'تم تفعيل الإطار');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  // Grant frame handlers
  const searchUsersForGrant = async (query: string) => {
    if (!query || query.length < 2) { setUserSearchResults([]); return; }
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setUserSearchResults((data.users || []).slice(0, 5));
      }
    } catch { /* ignore */ }
  };

  const handleGrantFrame = async () => {
    if (!grantForm.userId || !grantForm.frameId) {
      showToast('المستخدم والإطار مطلوبان', 'error');
      return;
    }
    setGrantLoading(true);
    try {
      const res = await fetch('/api/admin/frames/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grantForm),
      });
      if (res.ok) {
        showToast('تم منح الإطار بنجاح');
        setGrantFrameOpen(false);
        setGrantForm({ userId: '', frameId: '', obtainedFrom: 'admin', obtainedNote: '' });
        setGrantSelectedUser(null);
        fetchFrames();
      } else {
        const data = await res.json();
        showToast(data.error || 'فشل في منح الإطار', 'error');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setGrantLoading(false);
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

          {/* ─── Frames Management ───────────────────────────────── */}
          {activeSection === 'frames' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Frame className="w-5 h-5 text-amber-400" />
                    إدارة الإطارات
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-slate-400">{frames.length} إطار</p>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      {frames.filter(f => f.isActive).length} نشط
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/60"
                    onClick={() => fetchFrames()}
                  >
                    <RefreshCw className="w-3.5 h-3.5 ml-1" />
                    تحديث
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={() => setGrantFrameOpen(true)}
                  >
                    <Gift className="w-3.5 h-3.5 ml-1" />
                    منح إطار
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-500 text-white"
                    onClick={openAddFrameDialog}
                  >
                    <Plus className="w-3.5 h-3.5 ml-1" />
                    إضافة إطار
                  </Button>
                </div>
              </div>

              {/* Frames grid */}
              {frames.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800/50">
                  <CardContent className="py-12 text-center">
                    <Frame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">لا توجد إطارات بعد</p>
                    <p className="text-sm text-slate-500 mt-1">أضف إطاراً جديداً للبدء</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {frames.sort((a, b) => a.sortOrder - b.sortOrder).map((frame) => {
                    const rarityConfig: Record<string, { cls: string; label: string }> = {
                      common: { cls: 'bg-slate-500/10 border-slate-500/30 text-slate-400', label: 'عادي' },
                      rare: { cls: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400', label: 'نادر' },
                      epic: { cls: 'bg-violet-500/10 border-violet-500/30 text-violet-400', label: 'ملحمي' },
                      legendary: { cls: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'أسطوري' },
                    };
                    const rarity = rarityConfig[frame.rarity] || rarityConfig.common;

                    return (
                      <Card key={frame.id} className={`bg-slate-900/60 border-slate-800/50 ${!frame.isActive ? 'opacity-50' : ''}`}>
                        <CardContent className="p-4 space-y-3">
                          {/* Frame preview */}
                          <div className="flex justify-center pt-2">
                            <div
                              className="w-16 h-16 rounded-full mx-auto"
                              style={{
                                background: `linear-gradient(135deg, ${frame.gradientFrom}, ${frame.gradientTo})`,
                                padding: '3px',
                                boxShadow: `0 0 12px ${frame.glowColor}`,
                              }}
                            >
                              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                <User className="w-6 h-6 text-slate-500" />
                              </div>
                            </div>
                          </div>

                          {/* Name and rarity */}
                          <div className="text-center space-y-1">
                            <p className="font-bold text-white text-sm">{frame.nameAr || frame.name}</p>
                            <Badge variant="outline" className={`text-[10px] ${rarity.cls}`}>
                              {rarity.label}
                            </Badge>
                          </div>

                          {/* Price and owned */}
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{frame.isFree ? 'مجاني' : `${frame.price} جوهرة`}</span>
                            <span>{frame.totalOwned} مملوك</span>
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${frame.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {frame.isActive ? 'نشط' : 'معطل'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 text-xs"
                              onClick={() => openEditFrameDialog(frame)}
                            >
                              <Edit className="w-3.5 h-3.5 ml-1" />
                              تعديل
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`text-xs ${frame.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'}`}
                              onClick={() => toggleFrameActive(frame.id, frame.isActive)}
                            >
                              {frame.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteFrameHandler(frame.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Frame Create/Edit Dialog */}
              <Dialog open={frameFormOpen} onOpenChange={setFrameFormOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingFrame ? 'تعديل الإطار' : 'إضافة إطار جديد'}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {editingFrame ? 'قم بتعديل بيانات الإطار' : 'أدخل بيانات الإطار الجديد'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    {/* Frame preview */}
                    <div className="flex justify-center py-2">
                      <div
                        className="w-20 h-20 rounded-full mx-auto"
                        style={{
                          background: `linear-gradient(135deg, ${frameForm.gradientFrom}, ${frameForm.gradientTo})`,
                          padding: '3px',
                          boxShadow: `0 0 16px ${frameForm.glowColor}`,
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-500" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">الاسم (إنجليزي) *</Label>
                        <Input
                          value={frameForm.name}
                          onChange={(e) => setFrameForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Golden Frame"
                          className="bg-slate-800/60 border-slate-700/50 text-white text-sm"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">الاسم (عربي) *</Label>
                        <Input
                          value={frameForm.nameAr}
                          onChange={(e) => setFrameForm(prev => ({ ...prev, nameAr: e.target.value }))}
                          placeholder="الإطار الذهبي"
                          className="bg-slate-800/60 border-slate-700/50 text-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">الوصف</Label>
                      <Input
                        value={frameForm.description}
                        onChange={(e) => setFrameForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف مختصر للإطار"
                        className="bg-slate-800/60 border-slate-700/50 text-white text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">الندرة</Label>
                        <Select value={frameForm.rarity} onValueChange={(val) => setFrameForm(prev => ({ ...prev, rarity: val }))}>
                          <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            <SelectItem value="common">عادي</SelectItem>
                            <SelectItem value="rare">نادر</SelectItem>
                            <SelectItem value="epic">ملحمي</SelectItem>
                            <SelectItem value="legendary">أسطوري</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">النمط</Label>
                        <Select value={frameForm.pattern} onValueChange={(val) => setFrameForm(prev => ({ ...prev, pattern: val }))}>
                          <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            <SelectItem value="solid">صلب</SelectItem>
                            <SelectItem value="gradient">تدرج</SelectItem>
                            <SelectItem value="animated">متحرك</SelectItem>
                            <SelectItem value="dotted">منقط</SelectItem>
                            <SelectItem value="double">مزدوج</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">لون البداية</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={frameForm.gradientFrom}
                            onChange={(e) => setFrameForm(prev => ({ ...prev, gradientFrom: e.target.value }))}
                            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <Input
                            value={frameForm.gradientFrom}
                            onChange={(e) => setFrameForm(prev => ({ ...prev, gradientFrom: e.target.value }))}
                            className="bg-slate-800/60 border-slate-700/50 text-white text-xs flex-1"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">لون النهاية</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={frameForm.gradientTo}
                            onChange={(e) => setFrameForm(prev => ({ ...prev, gradientTo: e.target.value }))}
                            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <Input
                            value={frameForm.gradientTo}
                            onChange={(e) => setFrameForm(prev => ({ ...prev, gradientTo: e.target.value }))}
                            className="bg-slate-800/60 border-slate-700/50 text-white text-xs flex-1"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">لون الحدود</Label>
                        <Input
                          value={frameForm.borderColor}
                          onChange={(e) => setFrameForm(prev => ({ ...prev, borderColor: e.target.value }))}
                          className="bg-slate-800/60 border-slate-700/50 text-white text-xs"
                          dir="ltr"
                          placeholder="rgba(245, 158, 11, 0.7)"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">لون التوهج</Label>
                        <Input
                          value={frameForm.glowColor}
                          onChange={(e) => setFrameForm(prev => ({ ...prev, glowColor: e.target.value }))}
                          className="bg-slate-800/60 border-slate-700/50 text-white text-xs"
                          dir="ltr"
                          placeholder="rgba(245, 158, 11, 0.4)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">السعر (جواهر)</Label>
                        <Input
                          type="number"
                          value={frameForm.price}
                          onChange={(e) => setFrameForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                          className="bg-slate-800/60 border-slate-700/50 text-white text-sm"
                          min={0}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-sm">الترتيب</Label>
                        <Input
                          type="number"
                          value={frameForm.sortOrder}
                          onChange={(e) => setFrameForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                          className="bg-slate-800/60 border-slate-700/50 text-white text-sm"
                          min={0}
                        />
                      </div>
                      <div className="space-y-1.5 flex flex-col">
                        <Label className="text-slate-300 text-sm">مجاني</Label>
                        <div className="flex items-center h-9 mt-auto">
                          <Switch
                            checked={frameForm.isFree}
                            onCheckedChange={(checked) => setFrameForm(prev => ({ ...prev, isFree: checked }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={frameForm.isActive}
                        onCheckedChange={(checked) => setFrameForm(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label className="text-slate-300 text-sm">نشط</Label>
                    </div>
                  </div>

                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setFrameFormOpen(false)}
                      className="border-slate-700/50 text-slate-300 hover:bg-slate-800"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={saveFrame}
                      disabled={frameFormLoading}
                      className="bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      {frameFormLoading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
                      {editingFrame ? 'تحديث' : 'إنشاء'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Grant Frame Dialog */}
              <Dialog open={grantFrameOpen} onOpenChange={setGrantFrameOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>منح إطار لمستخدم</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      اختر المستخدم والإطار لمنحه
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    {/* User search */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">البحث عن مستخدم</Label>
                      <div className="relative">
                        <Input
                          value={grantSelectedUser ? `@${grantSelectedUser.username} (${grantSelectedUser.displayName})` : ''}
                          onChange={(e) => {
                            const val = e.target.value.replace('@', '').trim();
                            setGrantForm(prev => ({ ...prev, userId: '' }));
                            setGrantSelectedUser(null);
                            searchUsersForGrant(val);
                          }}
                          placeholder="ابحث بالاسم أو اسم المستخدم أو المعرف..."
                          className="bg-slate-800/60 border-slate-700/50 text-white text-sm"
                        />
                        {userSearchResults.length > 0 && !grantSelectedUser && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto">
                            {userSearchResults.map((u) => (
                              <button
                                key={u.id}
                                className="w-full px-3 py-2 text-right hover:bg-slate-700/50 transition-colors text-sm text-white"
                                onClick={() => {
                                  setGrantForm(prev => ({ ...prev, userId: u.id }));
                                  setGrantSelectedUser(u);
                                  setUserSearchResults([]);
                                }}
                              >
                                <span className="text-slate-400">@{u.username}</span>
                                <span className="mr-2">{u.displayName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Frame select */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">الإطار</Label>
                      <Select value={grantForm.frameId} onValueChange={(val) => setGrantForm(prev => ({ ...prev, frameId: val }))}>
                        <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white text-sm">
                          <SelectValue placeholder="اختر إطاراً" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 max-h-60">
                          {frames.filter(f => f.isActive).map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.nameAr || f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Obtained from */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">سبب المنح</Label>
                      <Select value={grantForm.obtainedFrom} onValueChange={(val) => setGrantForm(prev => ({ ...prev, obtainedFrom: val }))}>
                        <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          <SelectItem value="admin">إداري</SelectItem>
                          <SelectItem value="gift">هدية</SelectItem>
                          <SelectItem value="purchase">شراء</SelectItem>
                          <SelectItem value="level">مستوى</SelectItem>
                          <SelectItem value="event">حدث</SelectItem>
                          <SelectItem value="achievement">إنجاز</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">ملاحظة (اختياري)</Label>
                      <Input
                        value={grantForm.obtainedNote}
                        onChange={(e) => setGrantForm(prev => ({ ...prev, obtainedNote: e.target.value }))}
                        placeholder="ملاحظة إضافية"
                        className="bg-slate-800/60 border-slate-700/50 text-white text-sm"
                      />
                    </div>
                  </div>

                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => { setGrantFrameOpen(false); setUserSearchResults([]); setGrantSelectedUser(null); }}
                      className="border-slate-700/50 text-slate-300 hover:bg-slate-800"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleGrantFrame}
                      disabled={grantLoading || !grantForm.userId || !grantForm.frameId}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {grantLoading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Gift className="w-4 h-4 ml-1" />}
                      منح الإطار
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ─── Users Management ───────────────────────────────── */}
          {activeSection === 'users' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-400" />
                    إدارة المستخدمين
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {appUsers.length} مستخدم مسجل
                  </p>
                </div>
                <Button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  variant="outline"
                  className="bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/60"
                >
                  <RefreshCw className={`w-4 h-4 ml-1 ${usersLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="بحث بالاسم، البريد، أو اسم المستخدم..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pr-10 bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600"
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-slate-900/70 border-slate-700/50 text-white">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700/50">
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                    <SelectItem value="moderator">مشرف</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800/60 hover:bg-transparent">
                          <TableHead className="text-slate-400 font-semibold">المستخدم</TableHead>
                          <TableHead className="text-slate-400 font-semibold">البريد</TableHead>
                          <TableHead className="text-slate-400 font-semibold hidden md:table-cell">الهاتف</TableHead>
                          <TableHead className="text-slate-400 font-semibold">الدور</TableHead>
                          <TableHead className="text-slate-400 font-semibold hidden sm:table-cell">الحالة</TableHead>
                          <TableHead className="text-slate-400 font-semibold hidden lg:table-cell">آخر دخول</TableHead>
                          <TableHead className="text-slate-400 font-semibold hidden lg:table-cell">تاريخ التسجيل</TableHead>
                          <TableHead className="text-slate-400 font-semibold">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appUsers
                          .filter((u) => {
                            const search = userSearch.toLowerCase();
                            const matchesSearch = !search ||
                              u.username.toLowerCase().includes(search) ||
                              u.email.toLowerCase().includes(search) ||
                              u.displayName.toLowerCase().includes(search);
                            const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
                            return matchesSearch && matchesRole;
                          })
                          .map((user) => (
                            <TableRow key={user.id} className="border-slate-800/40 hover:bg-slate-800/30">
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.role === 'admin' ? 'from-rose-500 to-orange-500' : user.role === 'moderator' ? 'from-amber-500 to-yellow-500' : 'from-slate-500 to-slate-600'} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                      {user.displayName || user.username}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate" dir="ltr">
                                      @{user.username}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-slate-300 truncate" dir="ltr">{user.email}</p>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <p className="text-sm text-slate-400" dir="ltr">{user.phone || '—'}</p>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-[10px] font-bold ${
                                  user.role === 'admin'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : user.role === 'moderator'
                                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                      : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                                } border`}>
                                  {user.role === 'admin' ? 'مدير' : user.role === 'moderator' ? 'مشرف' : 'مستخدم'}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                  {user.isActive ? 'نشط' : 'معطل'}
                                </span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <p className="text-xs text-slate-500">
                                  {user.lastLoginAt
                                    ? new Date(user.lastLoginAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : 'لم يسجل بعد'}
                                </p>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <p className="text-xs text-slate-500">
                                  {new Date(user.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all"
                                    title="تعديل"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
                                    title="تعطيل"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  {appUsers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">لا يوجد مستخدمين مسجلين بعد</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-slate-900/50 border-slate-800/60">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-white">{appUsers.length}</p>
                    <p className="text-xs text-slate-400 mt-1">إجمالي المستخدمين</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800/60">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-400">{appUsers.filter(u => u.isActive).length}</p>
                    <p className="text-xs text-slate-400 mt-1">نشط</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800/60">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-amber-400">{appUsers.filter(u => u.role === 'admin' || u.role === 'moderator').length}</p>
                    <p className="text-xs text-slate-400 mt-1">طاقم الإدارة</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800/60">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-sky-400">{appUsers.filter(u => u.subscriptionId).length}</p>
                    <p className="text-xs text-slate-400 mt-1">مرتبط باشتراك</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ─── Edit User Dialog ────────────────────────────────────── */}
          <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) setEditingUser(null); }}>
            <DialogContent className="bg-slate-900 border-slate-800/60 sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-400" />
                  تعديل المستخدم
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm">
                  {editingUser ? `تعديل بيانات: @${editingUser.username}` : ''}
                </DialogDescription>
              </DialogHeader>

              {editingUser && (
                <div className="space-y-4 mt-2">
                  <div className="bg-slate-800/40 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-500">البريد الإلكتروني</p>
                    <p className="text-sm text-slate-300" dir="ltr">{editingUser.email}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">الاسم المعروض</label>
                    <input
                      value={editForm.displayName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full h-10 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">رقم الهاتف</label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full h-10 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">الدور / الصلاحية</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'admin', label: 'مدير', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300' },
                        { value: 'moderator', label: 'مشرف', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300' },
                        { value: 'user', label: 'مستخدم', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300' },
                      ].map((role) => (
                        <button
                          key={role.value}
                          onClick={() => setEditForm(prev => ({ ...prev, role: role.value }))}
                          className={`rounded-xl p-3 border text-center transition-all ${
                            editForm.role === role.value
                              ? `${role.bg} ${role.border} ${role.text} ring-1 ring-current`
                              : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600/50'
                          }`}
                        >
                          <Shield className={`w-5 h-5 mx-auto mb-1 ${editForm.role === role.value ? '' : 'opacity-40'}`} />
                          <span className="text-xs font-bold">{role.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-medium text-white">حالة الحساب</p>
                      <p className="text-xs text-slate-500">{editForm.isActive ? 'نشط ومفعل' : 'معطل'}</p>
                    </div>
                    <button
                      onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${editForm.isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${editForm.isActive ? 'left-0.5' : 'left-6'}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleSaveUser}
                      disabled={savingUser}
                      className="flex-1 h-10 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {savingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      حفظ التغييرات
                    </button>
                    <button
                      onClick={() => { setShowEditDialog(false); setEditingUser(null); }}
                      className="h-10 px-4 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-bold text-sm rounded-lg border border-slate-700/50"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ─── Delete Confirm Dialog ────────────────────────────────── */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="bg-slate-900 border-slate-800/60 sm:max-w-sm" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                  تأكيد تعطيل المستخدم
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm">
                  هل أنت متأكد؟ سيتم تعطيل الحساب ومنعه من تسجيل الدخول.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  تعطيل
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletingUserId(null); }}
                  className="flex-1 h-10 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-bold text-sm rounded-lg border border-slate-700/50"
                >
                  إلغاء
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ─── Backgrounds ───────────────────────────────────── */}
          {activeSection === 'backgrounds' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-violet-400" />
                    خلفيات الرومات
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">إدارة خلفيات غرف الصوت - الافتراضية والمباعة</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingBg(null);
                    setBgForm({ name: '', nameAr: '', description: '', imageUrl: '', thumbnailUrl: '', rarity: 'common', price: 0, isFree: false, isDefault: false, isActive: true, sortOrder: 0 });
                    setBgFormOpen(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> إضافة خلفية
                </Button>
              </div>

              {/* Backgrounds grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {backgrounds.map((bg) => (
                  <Card key={bg.id} className="bg-slate-900/60 border-slate-800/40 overflow-hidden">
                    {/* Thumbnail */}
                    <div className="relative h-32 bg-slate-800 overflow-hidden">
                      {bg.thumbnailUrl || bg.imageUrl ? (
                        <img
                          src={bg.thumbnailUrl || bg.imageUrl}
                          alt={bg.nameAr}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      {/* Badges */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {bg.isDefault && <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">افتراضية</Badge>}
                        {bg.isFree && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">مجانية</Badge>}
                        {!bg.isActive && <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">معطلة</Badge>}
                      </div>
                      {/* Rarity */}
                      <div className="absolute top-2 left-2">
                        <Badge className={`text-[10px] ${
                          bg.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          bg.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                          bg.rarity === 'rare' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          'bg-slate-500/20 text-slate-300 border-slate-500/30'
                        }`}>
                          {{ common: 'عادي', rare: 'نادر', epic: 'ملحمي', legendary: 'أسطوري' }[bg.rarity] || bg.rarity}
                        </Badge>
                      </div>
                    </div>
                    {/* Info */}
                    <CardContent className="p-3">
                      <h3 className="text-sm font-bold text-white truncate">{bg.nameAr}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{bg.description || 'بدون وصف'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-amber-400">{bg.price > 0 ? `${bg.price} 💎` : 'مجاني'}</span>
                        <span className="text-[10px] text-slate-500">مملوكة: {bg.totalOwned}</span>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-1.5 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-[11px] border-slate-700 text-slate-300 hover:bg-slate-800"
                          onClick={() => {
                            setEditingBg(bg);
                            setBgForm({
                              name: bg.name, nameAr: bg.nameAr, description: bg.description,
                              imageUrl: bg.imageUrl, thumbnailUrl: bg.thumbnailUrl, rarity: bg.rarity,
                              price: bg.price, isFree: bg.isFree, isDefault: bg.isDefault,
                              isActive: bg.isActive, sortOrder: bg.sortOrder,
                            });
                            setBgFormOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 ml-1" /> تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-7 text-[11px] border-slate-700 ${bg.isActive ? 'text-red-300 hover:bg-red-500/10' : 'text-emerald-300 hover:bg-emerald-500/10'}`}
                          onClick={async () => {
                            try {
                              await fetch('/api/admin/backgrounds', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: bg.id, isActive: !bg.isActive }),
                              });
                              fetchBackgrounds();
                              showToast(bg.isActive ? 'تم تعطيل الخلفية' : 'تم تفعيل الخلفية');
                            } catch { showToast('فشل', 'error'); }
                          }}
                        >
                          {bg.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-red-500/30 text-red-300 hover:bg-red-500/10"
                          onClick={async () => {
                            if (confirm(`حذف "${bg.nameAr}" نهائياً؟`)) {
                              try {
                                await fetch(`/api/admin/backgrounds?id=${bg.id}`, { method: 'DELETE' });
                                fetchBackgrounds();
                                showToast('تم حذف الخلفية');
                              } catch { showToast('فشل', 'error'); }
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {backgrounds.length === 0 && (
                <Card className="bg-slate-900/60 border-slate-800/40 p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">لا توجد خلفيات بعد</p>
                  <p className="text-slate-500 text-sm mt-1">اضغط "إضافة خلفية" لبدء الإضافة</p>
                </Card>
              )}

              {/* Background Form Dialog */}
              <Dialog open={bgFormOpen} onOpenChange={setBgFormOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg mx-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right">
                      {editingBg ? `تعديل: ${editingBg.nameAr}` : 'إضافة خلفية جديدة'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">الاسم (إنجليزي)</label>
                        <Input value={bgForm.name} onChange={e => setBgForm(p => ({ ...p, name: e.target.value }))}
                          className="bg-slate-800 border-slate-700 text-white" placeholder="room-bg-1" dir="ltr" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">الاسم (عربي)</label>
                        <Input value={bgForm.nameAr} onChange={e => setBgForm(p => ({ ...p, nameAr: e.target.value }))}
                          className="bg-slate-800 border-slate-700 text-white" placeholder="خلفية فضاء" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">الوصف</label>
                      <Input value={bgForm.description} onChange={e => setBgForm(p => ({ ...p, description: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white" placeholder="وصف الخلفية..." />
                    </div>
                    {/* File Upload */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">رفع صورة الخلفية</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 10 * 1024 * 1024) {
                              showToast('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت', 'error');
                              return;
                            }
                            setBgUploading(true);
                            try {
                              // Convert file to base64 for reliable upload
                              const base64 = await new Promise<string>((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const result = reader.result as string;
                                  resolve(result.split(',')[1]);
                                };
                                reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
                                reader.readAsDataURL(file);
                              });
                              const res = await fetch('/api/admin/backgrounds/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ file: base64, name: file.name, type: file.type }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                setBgForm(p => ({
                                  ...p,
                                  imageUrl: data.imageUrl,
                                  thumbnailUrl: data.thumbnailUrl || '',
                                }));
                                showToast('تم رفع الصورة بنجاح');
                              } else {
                                showToast(data.details ? `${data.error}: ${data.details}` : (data.error || 'فشل في رفع الصورة'), 'error');
                              }
                            } catch (uploadErr) {
                              showToast('فشل في رفع الصورة', 'error');
                              console.error('Upload error:', uploadErr);
                            }
                            setBgUploading(false);
                            e.target.value = '';
                          }}
                          className="hidden"
                          id="bg-file-upload"
                        />
                        <label
                          htmlFor="bg-file-upload"
                          className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-violet-500/50 hover:bg-slate-800/50 transition-colors"
                        >
                          {bgUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                          ) : bgForm.imageUrl ? (
                            <>
                              <img src={bgForm.thumbnailUrl || bgForm.imageUrl} alt="preview" className="w-16 h-20 object-cover rounded" />
                              <div className="text-xs text-slate-400">اضغط لتغيير الصورة</div>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-slate-500" />
                              <div className="text-xs text-slate-500">اضغط لرفع صورة (JPEG, PNG, WebP, GIF - حد 10MB)</div>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">رابط الصورة (يدوياً - اختياري)</label>
                      <Input value={bgForm.imageUrl} onChange={e => setBgForm(p => ({ ...p, imageUrl: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." dir="ltr" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">رابط الصورة المصغرة (يدوياً - اختياري)</label>
                      <Input value={bgForm.thumbnailUrl} onChange={e => setBgForm(p => ({ ...p, thumbnailUrl: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." dir="ltr" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">الندرة</label>
                        <select
                          value={bgForm.rarity}
                          onChange={e => setBgForm(p => ({ ...p, rarity: e.target.value }))}
                          className="w-full h-9 bg-slate-800 border border-slate-700 text-white rounded-md px-3 text-sm"
                        >
                          <option value="common">عادي</option>
                          <option value="rare">نادر</option>
                          <option value="epic">ملحمي</option>
                          <option value="legendary">أسطوري</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">السعر (جواهر)</label>
                        <Input type="number" min={0} value={bgForm.price} onChange={e => setBgForm(p => ({ ...p, price: Number(e.target.value) }))}
                          className="bg-slate-800 border-slate-700 text-white" dir="ltr" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">الترتيب</label>
                        <Input type="number" min={0} value={bgForm.sortOrder} onChange={e => setBgForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                          className="bg-slate-800 border-slate-700 text-white" dir="ltr" />
                      </div>
                      <div className="flex items-center gap-4 mt-5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={bgForm.isDefault} onChange={e => setBgForm(p => ({ ...p, isDefault: e.target.checked }))}
                            className="w-4 h-4 rounded border-slate-600" />
                          <span className="text-xs text-slate-300">افتراضية</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={bgForm.isFree} onChange={e => setBgForm(p => ({ ...p, isFree: e.target.checked }))}
                            className="w-4 h-4 rounded border-slate-600" />
                          <span className="text-xs text-slate-300">مجانية</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setBgFormOpen(false)} className="border-slate-700 text-slate-300">
                      إلغاء
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!bgForm.name || !bgForm.nameAr || !bgForm.imageUrl) {
                          showToast('الاسم ورابط الصورة مطلوبان', 'error');
                          return;
                        }
                        setBgFormLoading(true);
                        try {
                          const url = editingBg ? '/api/admin/backgrounds' : '/api/admin/backgrounds';
                          const method = editingBg ? 'PUT' : 'POST';
                          const body = editingBg ? { id: editingBg.id, ...bgForm } : bgForm;
                          const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                          if (res.ok) {
                            showToast(editingBg ? 'تم تحديث الخلفية' : 'تم إضافة الخلفية');
                            fetchBackgrounds();
                            setBgFormOpen(false);
                          } else {
                            showToast('فشل', 'error');
                          }
                        } catch { showToast('فشل في الاتصال', 'error'); }
                        setBgFormLoading(false);
                      }}
                      disabled={bgFormLoading}
                      className="bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      {bgFormLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBg ? 'حفظ التغييرات' : 'إضافة'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
