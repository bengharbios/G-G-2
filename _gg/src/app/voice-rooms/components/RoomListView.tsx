'use client';

/* ═══════════════════════════════════════════════════════════════════════
   RoomListView — Voice Room Lobby (Exact match to reference screenshots)

   Design from screenshots:
   - Teal-green gradient background + diamond pattern overlay
   - Header: avatar+badge | 3 pill tabs (اكتشف / رائج / غرفي) | search
   - "My" tab: White "Create my room" card OR "My Room" banner
   - Sub-tabs: مؤخراً / منضم / متابَع / أصدقاء (pill-shaped)
   - Room cards in 2-column grid (white cards, cover image, info, avatars)
   - Empty state: house illustration + message + yellow CTA button
   - Fixed bottom nav: 4 items with rounded-square icon containers + badges
   ═══════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Users,
  Swords,
  MessageCircle,
  Gift,
  ChevronLeft,
  Crown,
  Mic,
  Lock,
  Eye,
  Shield,
  Headphones,
  Star,
  Home,
  PartyPopper,
  Sparkles,
  X,
  Copy,
  LogOut,
  User as UserIcon,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Clock,
  Filter,
  Compass,
  Flame,
  Radio,
} from 'lucide-react';
import {
  TUI,
  type VoiceRoom,
  type AuthUser,
  type RoomMode,
  getAvatarColorFromPalette,
} from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoomListViewProps {
  rooms: VoiceRoom[];
  myRoom: VoiceRoom | null;
  onRoomClick: (room: VoiceRoom) => void;
  onCreateRoom: () => void;
  authUser: AuthUser | null;
  loading: boolean;
}

// ─── Main Tabs (with icons matching Friends page tab style) ──────────────────

const MAIN_TABS = [
  { id: 'explore', label: 'اكتشف', icon: Compass },
  { id: 'hot', label: 'رائج', icon: Flame },
  { id: 'mine', label: 'غرفي', icon: Home },
] as const;

type MainTab = (typeof MAIN_TABS)[number]['id'];

// ─── Sub Tabs (always visible, subtle pills) ─────────────────────────────────

const SUB_TABS = [
  { id: 'recent', label: 'مؤخراً' },
  { id: 'joined', label: 'منضم' },
  { id: 'following', label: 'متابَع' },
  { id: 'friends', label: 'أصدقاء' },
] as const;

type SubTab = (typeof SUB_TABS)[number]['id'];

// ─── Room theme gradients (for cover fallback) ────────────────────────────────

const THEME_GRADIENTS: Record<string, string> = {
  blue: 'linear-gradient(135deg, #1C66E5 0%, #6C54E8 100%)',
  green: 'linear-gradient(135deg, #00C2A8 0%, #0099FF 100%)',
  orange: 'linear-gradient(135deg, #FF643D 0%, #f59e0b 100%)',
  pink: 'linear-gradient(135deg, #F23C5B 0%, #7B61FF 100%)',
  teal: 'linear-gradient(135deg, #00E5E5 0%, #1C66E5 100%)',
  red: 'linear-gradient(135deg, #FC5555 0%, #FF643D 100%)',
  gold: 'linear-gradient(135deg, #F59E0B 0%, #FFD700 100%)',
  default: 'linear-gradient(135deg, #0D8A7A 0%, #00C896 100%)',
};

function getRoomGradient(theme: string): string {
  return THEME_GRADIENTS[theme] || THEME_GRADIENTS.default;
}

// Bottom Nav Items — موقوف: AppShell يوفر SiteBottomNav موحّد على كل الصفحات
// (الأحداث / الألعاب / المجلس / أصدقائي). القائمة الداخلية القديمة أُزيلت.

// ─── Diamond pattern SVG (inline) ─────────────────────────────────────────────

function DiamondPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.04 }}
    >
      <defs>
        <pattern id="lobbyDiamondPattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M16 0 L32 16 L16 32 L0 16 Z" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lobbyDiamondPattern)" />
    </svg>
  );
}

// ─── House SVG Illustration (empty state) ─────────────────────────────────────

function HouseIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main house */}
      <path d="M60 15L25 45V85H95V45L60 15Z" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinejoin="round" />
      {/* Roof */}
      <path d="M20 48L60 12L100 48" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Door */}
      <rect x="48" y="58" width="24" height="27" rx="2" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
      {/* Door knob */}
      <circle cx="66" cy="72" r="2" fill="rgba(255,255,255,0.25)" />
      {/* Window left */}
      <rect x="32" y="55" width="12" height="10" rx="1" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
      <line x1="38" y1="55" x2="38" y2="65" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1="32" y1="60" x2="44" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Window right */}
      <rect x="76" y="55" width="12" height="10" rx="1" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
      <line x1="82" y1="55" x2="82" y2="65" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1="76" y1="60" x2="88" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Tree left */}
      <rect x="6" y="68" width="4" height="17" rx="1" fill="rgba(255,255,255,0.12)" />
      <ellipse cx="8" cy="60" rx="12" ry="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Tree right */}
      <rect x="110" y="70" width="4" height="15" rx="1" fill="rgba(255,255,255,0.12)" />
      <ellipse cx="112" cy="62" rx="10" ry="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Ground */}
      <line x1="0" y1="85" x2="120" y2="85" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomListView({
  rooms,
  myRoom,
  onRoomClick,
  onCreateRoom,
  authUser,
  loading,
}: RoomListViewProps) {
  const [mainTab, setMainTab] = useState<MainTab>('explore');
  const [subTab, setSubTab] = useState<SubTab>('recent');
  const scrollRef = useRef<HTMLDivElement>(null);

  // موقوف: عرض بروفايل المستخدم يُدار الآن في AppShell عبر SiteHeader.
  // const [showProfile, setShowProfile] = useState(false);
  // useEffect(() => { ... }, [showProfile]);
  // const avatarPalette = authUser ? getAvatarColorFromPalette(authUser.id) : ...;

  // ── Avatar palette for user ──

  // ── Filter rooms by main tab ──
  const displayRooms = rooms.filter((room) => {
    // Don't show user's own room in the list (it's shown separately)
    if (myRoom && room.id === myRoom.id) return false;
    if (mainTab === 'explore') return true;
    if (mainTab === 'hot') return (room.participantCount || 0) > 5;
    return true; // 'mine' — all other rooms
  });

  /* ── Search & Filter State ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'new' | 'bookmarked'>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter rooms based on search and category
  const filteredRooms = displayRooms.filter(room => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!room.name.toLowerCase().includes(q) && !(room.description || '').toLowerCase().includes(q) && !(room.hostName || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (activeFilter === 'trending') {
      return (room.participantCount || 0) >= 5;
    }
    if (activeFilter === 'new') {
      const created = new Date(room.createdAt);
      const hours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
      return hours <= 24;
    }
    if (activeFilter === 'bookmarked') {
      return bookmarkedIds.has(room.id);
    }
    return true;
  });

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (activeFilter === 'trending') return (b.participantCount || 0) - (a.participantCount || 0);
    if (activeFilter === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return (b.participantCount || 0) - (a.participantCount || 0);
  });

  // Load bookmarks on mount
  useEffect(() => {
    const userId = authUser?.id;
    if (!userId) return;
    fetch(`/api/bookmarks?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.bookmarks) {
          setBookmarkedIds(new Set(data.bookmarks.map((b: any) => b.roomId)));
        }
      })
      .catch(() => {});
  }, [authUser?.id]);

  // Toggle bookmark
  async function toggleBookmark(roomId: string, roomName: string) {
    const userId = authUser?.id;
    if (!userId) return;
    const isBookmarked = bookmarkedIds.has(roomId);
    try {
      if (isBookmarked) {
        await fetch('/api/bookmarks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, roomId }) });
        setBookmarkedIds(prev => { const n = new Set(prev); n.delete(roomId); return n; });
      } else {
        await fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, roomId, roomName }) });
        setBookmarkedIds(prev => new Set(prev).add(roomId));
      }
    } catch { /* ignore */ }
  }

  return (
    <div
      className="relative min-h-screen"
      dir="rtl"
      style={{
        background: `linear-gradient(180deg, #0D8A7A 0%, #0A6B5E 30%, #074a42 100%)`,
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
      }}
    >
      {/* ═══ Diamond Pattern Overlay ═══ */}
      <DiamondPattern />

      {/* ══════════════════════════════════════════════════════════════
          PAGE HEADER — شعار المجلس (يطابق نمط صفحة الألعاب)
          ══════════════════════════════════════════════════════════════ */}
      <header className="relative z-10 pt-6 pb-3 flex flex-col items-center gap-2 max-w-lg mx-auto w-full px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#15BC83] to-[#0FA070] flex items-center justify-center shadow-lg shadow-[#15BC83]/20">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-white drop-shadow-md">المجلس</span>
        </div>
        <div className="w-28 h-px bg-gradient-to-r from-transparent via-[#15BC83]/40 to-transparent" />
      </header>

      {/* ══════════════════════════════════════════════════════════════
          MAIN TABS — تصميم مطابق لتبويبات صفحة الأصدقاء (مستطيلة بأيقونات)
          ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex gap-1 p-2 bg-[#0D8A7A]/20 border-b border-[#15BC83]/20 sticky top-14 max-w-lg mx-auto w-full">
        {MAIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all relative ${isActive ? 'bg-[#15BC83] text-white shadow-md' : 'text-white/50'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MY ROOM SECTION (visible on "غرفي" tab)
          ══════════════════════════════════════════════════════════════ */}
      {mainTab === 'mine' && (
        <div className="relative z-10 px-3 pt-2 pb-1 max-w-lg mx-auto w-full">
          {myRoom ? (
            /* ── My Room Banner ── */
            <div
              className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer active:scale-[0.98] bg-[#15BC83]/15 border border-[#15BC83]/30"
              onClick={() => onRoomClick(myRoom)}
            >
              {/* Room avatar */}
              <div
                className="flex-shrink-0 rounded-full overflow-hidden relative"
                style={{ width: 48, height: 48, border: '2px solid rgba(123, 97, 255, 0.5)' }}
              >
                {myRoom.roomAvatar ? (
                  <img src={myRoom.roomAvatar} alt={myRoom.name} className="w-full h-full object-cover rounded-full" />
                ) : myRoom.roomImage ? (
                  <img src={myRoom.roomImage} alt={myRoom.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center rounded-full"
                    style={{ background: getRoomGradient(myRoom.micTheme) }}
                  >
                    <Mic size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
                  </div>
                )}
                {/* Live dot */}
                <div
                  className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: TUI.colors.green, boxShadow: `0 0 6px ${TUI.colors.green}` }}
                />
              </div>

              {/* Room info */}
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{ fontSize: 'clamp(14px, 3.6vw, 16px)', fontWeight: 700, color: TUI.colors.white }}
                >
                  {myRoom.name}
                </p>
                <p
                  className="truncate"
                  style={{ fontSize: 'clamp(11px, 2.8vw, 12px)', color: 'rgba(255,255,255,0.55)' }}
                >
                  {myRoom.description || 'غرفتي'}
                </p>
              </div>

              {/* Join arrow */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <ChevronLeft size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
            </div>
          ) : (
            /* ── Create My Room Card — يطابق نمط زر البحث في صفحة الأصدقاء ── */
            <button
              onClick={onCreateRoom}
              className="w-full bg-[#15BC83] hover:bg-[#13a374] text-white rounded-xl p-3 flex items-center gap-3 transition-colors shadow-md shadow-[#15BC83]/30"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-black">إنشاء غرفتي</p>
                <p className="text-[11px] text-white/70">ابدأ بثّك الصوتي الآن</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUB-TABS (pill-shaped, always visible) — أصغر وأكثر إشراقاً
          ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 px-3 py-2 max-w-lg mx-auto w-full overflow-x-auto">
        {SUB_TABS.map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full transition-all text-xs font-bold whitespace-nowrap ${isActive ? 'bg-white text-[#0D8A7A] shadow-md' : 'bg-white/10 text-white/60'}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROOM LIST — natural body scroll (matches Games/Friends pattern)
          ══════════════════════════════════════════════════════════════ */}
      <div
        ref={scrollRef}
        className="relative z-10 px-3 pt-1 max-w-lg mx-auto w-full"
        style={{ paddingBottom: 100 }}
      >
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{
                borderColor: 'rgba(255,255,255,0.2)',
                borderTopColor: TUI.colors.tealLight,
                borderWidth: 3,
              }}
            />
          </div>
        )}

        {/* ── Search Bar ── */}
        {!loading && (
          <div style={{ padding: '0 4px 12px' }}>
            <div
              className="flex items-center"
              style={{
                height: 40,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '0 14px',
                border: '1px solid rgba(255,255,255,0.05)',
                gap: 10,
              }}
            >
              <Search size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن غرفة..."
                dir="rtl"
                className="flex-1 min-w-0 bg-transparent outline-none"
                style={{ fontSize: 13, color: '#fff' }}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center bg-transparent border-none cursor-pointer"
                style={{ padding: 4 }}
              >
                <Filter size={16} style={{ color: showFilters ? '#f59e0b' : 'rgba(255,255,255,0.4)' }} />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center" style={{ gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {[
                { key: 'all' as const, label: 'الكل', icon: Users },
                { key: 'trending' as const, label: 'الأكثر نشاطاً', icon: TrendingUp },
                { key: 'new' as const, label: 'جديدة', icon: Clock },
                ...(authUser ? [{ key: 'bookmarked' as const, label: 'المحفوظة', icon: BookmarkCheck }] : []),
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className="flex items-center gap-1.5 flex-shrink-0 bg-transparent border-none cursor-pointer touch-manipulation"
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    backgroundColor: activeFilter === key ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)',
                    border: activeFilter === key ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={12} style={{ color: activeFilter === key ? '#f59e0b' : 'rgba(255,255,255,0.4)' }} />
                  <span style={{ fontSize: 11, fontWeight: activeFilter === key ? 600 : 400, color: activeFilter === key ? '#f59e0b' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State — no rooms at all */}
        {!loading && displayRooms.length === 0 && !searchQuery && activeFilter === 'all' && (
          <EmptyState onCreateRoom={onCreateRoom} mainTab={mainTab} hasMyRoom={!!myRoom} />
        )}

        {/* Room Cards Grid */}
        {!loading && sortedRooms.length > 0 && (
          <div
            className="grid grid-cols-2 gap-3"
            style={{ paddingBottom: 10 }}
          >
            {sortedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => onRoomClick(room)}
                isBookmarked={bookmarkedIds.has(room.id)}
                onToggleBookmark={toggleBookmark}
                showBookmark={!!authUser}
              />
            ))}
          </div>
        )}

        {/* No results empty state */}
        {!loading && sortedRooms.length === 0 && (searchQuery || activeFilter !== 'all' || displayRooms.length === 0) && (
          <div className="flex flex-col items-center justify-center" style={{ padding: '40px 20px', gap: 12 }}>
            <Search size={40} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              {searchQuery ? 'لا توجد نتائج للبحث' : activeFilter === 'bookmarked' ? 'لا توجد غرف محفوظة' : 'لا توجد غرف حالياً'}
            </span>
          </div>
        )}
      </div>


    </div>
  );
}

// ─── Room Card (Grid Item) ─────────────────────────────────────────────────────

function RoomCard({ room, onClick, isBookmarked, onToggleBookmark, showBookmark }: { room: VoiceRoom; onClick: () => void; isBookmarked?: boolean; onToggleBookmark?: (roomId: string, roomName: string) => void; showBookmark?: boolean }) {
  const modeConfig: Record<RoomMode, { icon: typeof Mic; label: string; color: string }> = {
    public: { icon: Eye, label: 'عام', color: '#29CC6A' },
    key: { icon: Lock, label: 'بسر', color: '#F59E0B' },
    private: { icon: Star, label: 'خاص', color: '#7B61FF' },
  };

  const mode = modeConfig[room.roomMode] || modeConfig.public;
  const ModeIcon = mode.icon;
  const isLive = (room.participantCount || 0) > 0;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.97]"
      style={{
        aspectRatio: '1/1',
        backgroundColor: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2), 0 0 0 0 rgba(0,200,150,0)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25), 0 0 0 2px rgba(0,200,150,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2), 0 0 0 0 rgba(0,200,150,0)'; }}
    >
      {/* ── Cover Area (square, shows room avatar as main image) ── */}
      <div className="relative w-full flex-1">
        {/* Background gradient fallback */}
        <div
          className="absolute inset-0"
          style={{ background: getRoomGradient(room.micTheme) }}
        />

        {/* Room Avatar — main image */}
        {room.roomAvatar ? (
          <img
            src={room.roomAvatar}
            alt={room.name}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            loading="lazy"
          />
        ) : room.roomImage ? (
          <img
            src={room.roomImage}
            alt={room.name}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <Mic size={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: '60%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
          }}
        />

        {/* Top badges row */}
        <div className="absolute top-2 inset-x-0 flex items-center justify-between px-2">
          {/* Live "On" indicator */}
          {isLive ? (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(41, 204, 106, 0.9)',
                fontSize: 9,
                fontWeight: 700,
                color: TUI.colors.white,
                boxShadow: '0 1px 4px rgba(41,204,106,0.3)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              On
            </div>
          ) : (
            <div className="w-1" />
          )}

          {/* Seat count */}
          <div
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              fontSize: 9,
              fontWeight: 600,
              color: TUI.colors.white,
            }}
          >
            <Mic size={9} />
            {room.micSeatCount}
          </div>
        </div>

        {/* Participant count badge (top-left) */}
        <div
          className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            fontSize: 10,
            fontWeight: 600,
            color: TUI.colors.white,
          }}
        >
          <Users size={10} />
          {room.participantCount || 0}
        </div>

        {/* Bookmark button */}
        {showBookmark && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(room.id, room.name); }}
            className="absolute flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ top: 8, left: 40, width: 28, height: 28, zIndex: 5 }}
          >
            {isBookmarked
              ? <BookmarkCheck size={16} fill="#f59e0b" stroke="#f59e0b" />
              : <Bookmark size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
            }
          </button>
        )}

        {/* ── Room Info (overlaid at bottom) ── */}
        <div className="absolute bottom-0 inset-x-0 p-2.5">
          {/* Room Name */}
          <p
            className="truncate leading-tight mb-1"
            style={{
              fontSize: 'clamp(12px, 3.2vw, 14px)',
              fontWeight: 700,
              color: TUI.colors.white,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            {room.name}
          </p>

          {/* Host avatar + name + Mode badge */}
          <div className="flex items-center gap-1.5">
            {/* Host mini avatar */}
            <div
              className="flex-shrink-0 rounded-full overflow-hidden"
              style={{
                width: 16,
                height: 16,
                border: '1.5px solid rgba(255,255,255,0.3)',
              }}
            >
              {room.hostName ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    backgroundColor: getAvatarColorFromPalette(room.hostId || room.hostName).bg,
                    color: getAvatarColorFromPalette(room.hostId || room.hostName).text,
                    fontSize: 7,
                    fontWeight: 700,
                  }}
                >
                  {room.hostName.charAt(0)}
                </div>
              ) : null}
            </div>
            <span
              className="truncate flex-1"
              style={{
                fontSize: 'clamp(10px, 2.6vw, 11px)',
                color: 'rgba(255,255,255,0.75)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {room.hostName}
            </span>
            <span
              className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{
                fontSize: 8,
                fontWeight: 600,
                color: mode.color,
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
            >
              <ModeIcon size={8} />
              {mode.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  onCreateRoom,
  mainTab,
  hasMyRoom,
}: {
  onCreateRoom: () => void;
  mainTab: string;
  hasMyRoom: boolean;
}) {
  const isMine = mainTab === 'mine';

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 px-6">
      {/* House Illustration */}
      <HouseIllustration />

      {/* Text */}
      <p
        className="text-center"
        style={{
          fontSize: 'clamp(14px, 3.8vw, 16px)',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.8,
        }}
      >
        {isMine
          ? 'لم تزر أي غرفة مؤخراً'
          : 'لا توجد غرف صوتية حالياً'}
      </p>

      <p
        className="text-center"
        style={{
          fontSize: 'clamp(12px, 3.2vw, 13px)',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        {isMine
          ? 'ابدأ باستكشاف الغرف المتاحة وابقَ على اطلاع'
          : 'كن أول من ينشئ غرفة وابدأ المحادثة'}
      </p>

      {/* CTA Button (yellow, matching screenshot) */}
      <button
        onClick={onCreateRoom}
        className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-bold transition-all active:scale-95 mt-2"
        style={{
          backgroundColor: '#F59E0B',
          fontSize: 'clamp(14px, 3.8vw, 16px)',
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
          minHeight: 48,
        }}
      >
        <Search size={18} />
        {isMine ? 'ابحث عن غرف' : 'أنشئ غرفتك الأولى'}
      </button>
    </div>
  );
}
