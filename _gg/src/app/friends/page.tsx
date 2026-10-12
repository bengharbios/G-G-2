'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Users, Gamepad2, Clock, Search, UserPlus, MessageCircle, Send, X, Loader2, ChevronLeft, Gift, Smile, MoreVertical, Trash2, Flag } from 'lucide-react';
// NOTE: الهيدر (SiteHeader) والأزرار السفلية (SiteBottomNav) الآن تُدار في AppShell
// (src/components/shared/AppShell.tsx) — تُحمّل مرة واحدة وتشاركها كل الصفحات.
import YallaProfileDialog from '@/components/shared/YallaProfileDialog';
import {
  EMOJI_CATEGORIES,
  DEFAULT_GIFTS,
  GIFT_CATEGORIES,
  emojiToPng,
  getGiftById,
  isGiftMessage,
  parseGiftId,
  getGiftImageUrl,
} from '@/lib/chat-emojis-gifts';

type FriendTab = 'notifications' | 'nearby' | 'wishes' | 'recent';
type View = 'list' | 'search' | 'requests' | 'chat';

interface UserResult { id: string; username: string; displayName: string; avatar: string; numericId: number | null; }
interface FriendReq { id: string; fromUserId: string; fromDisplayName: string; fromAvatar: string; }
interface FriendItem { friendshipId: string; userId: string; username: string; displayName: string; avatar: string; level: number; }
interface ChatMsg { id: string; fromUserId: string; toUserId: string; text: string; type: string; isRead: number; createdAt: string; }

export default function FriendsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<FriendTab>('nearby');
  const [view, setView] = useState<View>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [sending, setSending] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [pendingReqs, setPendingReqs] = useState<FriendReq[]>([]);
  const [chatFriend, setChatFriend] = useState<FriendItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(EMOJI_CATEGORIES[0].id);
  const [giftCategory, setGiftCategory] = useState(GIFT_CATEGORIES[0].id);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState('');
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ملخّص الإشعارات: شارات على كل صديق + تبويب الأصدقاء + زر "أصدقائي" السفلي
  const [unreadByFriend, setUnreadByFriend] = useState<Record<string, { count: number; lastMessage?: string; lastMessageAt?: string }>>({});
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { setView('list'); }, [tab]);

  // جلب ملخّص الإشعارات بشكل دوري كل 10 ثوانٍ (أسرع الآن) عندما تكون الصفحة مرئية
  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/summary', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) return;
      setPendingCount(data.pendingFriendRequests ?? 0);
      const m: Record<string, { count: number; lastMessage?: string; lastMessageAt?: string }> = {};
      for (const u of (data.unreadByFriend || [])) {
        m[String(u.friendId)] = { count: Number(u.count) || 0, lastMessage: u.lastMessage || '', lastMessageAt: u.lastMessageAt || '' };
      }
      setUnreadByFriend(m);
    } catch {}
  }, []);
  useEffect(() => {
    loadSummary();
    const t = setInterval(() => { if (document.visibilityState === 'visible') loadSummary(); }, 10000);
    const onFocus = () => loadSummary();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadSummary(); });
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [loadSummary]);

  // إعادة جلب الملخّص بعد فتح الدردشة وإغلاقها (لتحديث الشارات)
  useEffect(() => {
    if (view !== 'chat') { loadSummary(); }
  }, [view, loadSummary]);

  const loadData = useCallback(async () => {
    try {
      const [fr, pr] = await Promise.all([
        fetch('/api/friends?type=friends').then(r => r.json()),
        fetch('/api/friends?type=pending').then(r => r.json()),
      ]);
      if (fr.success) setFriends(fr.friends || []);
      if (pr.success) setPendingReqs(pr.requests || []);
      // حدّث عدد الطلبات المعلّقة في ملخّص الإشعارات
      setPendingCount(pr.requests?.length || 0);
    } catch {}
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  // إعادة جلب قائمة الأصدقاء كل 20 ثانية — للكشف عن الحذف من الطرف الآخر
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') loadData(); }, 20000);
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [loadData]);

  useEffect(() => {
    if (view !== 'chat' || !chatFriend) { if (chatPollRef.current) clearInterval(chatPollRef.current); return; }
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat?friendId=${chatFriend.userId}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setChatMessages(data.messages || []);
          // حدّث حالة الصداقة من الاستجابة إن وُجدت
          if (data.friendshipStatus === 'none') {
            // الطرف الآخر حذفني — أعد تحميل قائمة الأصدقاء وحدّث الحالة
            loadData();
            setFriendStatus('none');
          } else if (data.friendshipStatus === 'friends') {
            setFriendStatus('friends');
          }
        }
      } catch {}
    };
    poll();
    chatPollRef.current = setInterval(poll, 3000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [view, chatFriend, loadData]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages]);

  // Open ANY user's profile in YallaProfileDialog (نفس نافذة بروفايلي)
  // يدعم كلًّا من الكائنات التي تستخدم `id` (UserResult) أو `userId` (FriendItem)
  const openUserProfile = (user: { id?: string; userId?: string; username: string; displayName?: string; avatar?: string; numericId?: number | null }) => {
    const id = user.id || user.userId || '';
    setSelectedUser({
      id, username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || '', numericId: user.numericId ?? null,
    });
    // تحقق من حالة الصداقة: صديق أم لا
    // استخدم `id` (UUID) للمقارنة مع friends[].userId
    const isFriend = friends.some(f => f.userId === id);
    setFriendStatus(isFriend ? 'friends' : 'none');
    setProfileDialogOpen(true);
  };

  const handleAddFriend = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      const res = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toUserId: selectedUser.id }) });
      const data = await res.json();
      if (data.success) { setFriendStatus('pending'); setToast('تم إرسال طلب صداقة'); setTimeout(() => setToast(''), 3000); }
      else { setToast(data.error || 'فشل'); setTimeout(() => setToast(''), 3000); }
    } catch {}
    setSending(false);
  };

  const handleAccept = async (reqId: string) => { await fetch(`/api/friends/${reqId}`, { method: 'PUT' }); setPendingReqs(prev => prev.filter(r => r.id !== reqId)); loadData(); setToast('تم القبول ✓'); setTimeout(() => setToast(''), 3000); };
  const handleReject = async (reqId: string) => { await fetch(`/api/friends/${reqId}?action=reject`, { method: 'DELETE' }); setPendingReqs(prev => prev.filter(r => r.id !== reqId)); };

  const handleDeleteFriend = async () => {
    if (!chatFriend) return;
    setShowDeleteConfirm(false); setShowMenu(false); setProfileDialogOpen(false);
    try {
      const res = await fetch(`/api/friends/${chatFriend.friendshipId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && !data.success) {
        setToast(data.error || 'فشل الحذف'); setTimeout(() => setToast(''), 3000);
        return;
      }
      // أزله من قائمة الأصدقاء في الواجهة
      setFriends(prev => prev.filter(f => f.friendshipId !== chatFriend.friendshipId));
      setToast('تم حذف الصديق'); setTimeout(() => setToast(''), 3000);
      // ابق في الدردشة لكن أظهر زر "إضافة صديق" بدلاً من مربع الإدخال
      // (chatFriend يبقى كما هو حتى تستطيع إعادة الإرسال لاحقاً)
      // نُحدّث حالة الصداقة في البروفايل أيضاً
      setFriendStatus('none');
    } catch (e) {
      setToast('فشل الاتصال بالسيرفر'); setTimeout(() => setToast(''), 3000);
    }
  };
  // Wrapper for delete from profile dialog (finds friendshipId from selectedUser)
  const handleDeleteFriendWrapper = async () => {
    if (!chatFriend) return;
    setProfileDialogOpen(false);
    setShowDeleteConfirm(true);
  };

  const openChat = (friend: FriendItem) => { setChatFriend(friend); setView('chat'); setChatMessages([]); };

  // إعادة إرسال طلب صداقة أثناء الدردشة بعد الحذف
  const handleReAddFriend = async () => {
    if (!chatFriend) return;
    setSending(true);
    try {
      const res = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toUserId: chatFriend.userId }) });
      const data = await res.json();
      if (data.success) { setFriendStatus('pending'); setToast('تم إرسال طلب صداقة'); setTimeout(() => setToast(''), 3000); }
      else { setToast(data.error || 'فشل'); setTimeout(() => setToast(''), 3000); }
    } catch {}
    setSending(false);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !chatFriend) return;
    const text = chatInput.trim(); setChatInput('');
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toUserId: chatFriend.userId, text }) });
      // إن ردّ السيرفر 403 → لم تعودا أصدقاء، حدّث الحالة وأظهر زر "إضافة صديق"
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        setFriendStatus('none');
        loadData();
        setToast(data.error || 'لم تعودا أصدقاء'); setTimeout(() => setToast(''), 3000);
        return;
      }
      const msgRes = await fetch(`/api/chat?friendId=${chatFriend.userId}`);
      const msgData = await msgRes.json();
      if (msgData.success) {
        setChatMessages(msgData.messages || []);
        if (msgData.friendshipStatus === 'none') { setFriendStatus('none'); loadData(); }
      }
    } catch {}
  };

  // حساب عدد الرسائل غير المقروءة الإجمالي عبر كل الأصدقاء
  const totalUnread = Object.values(unreadByFriend).reduce((s, v) => s + (v.count || 0), 0);

  const tabs = [
    { id: 'notifications' as FriendTab, label: 'الإشعارات', icon: Bell, badge: pendingCount },
    { id: 'nearby' as FriendTab, label: 'أصدقاء', icon: Users, badge: totalUnread },
    { id: 'wishes' as FriendTab, label: 'أمنيات', icon: Gamepad2, badge: 0 },
    { id: 'recent' as FriendTab, label: 'مؤخراً', icon: Clock, badge: 0 },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      {/* خلفية متدرّجة — الهيدر والأزرار السفلية تُقدّم من AppShell */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a4a3a] to-[#062318] -z-10" />

      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#15BC83] text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold">{toast}</div>}

      {/* === LIST === */}
      {view === 'list' && (
        <>
          <div className="flex gap-1 p-3 bg-[#0D8A7A]/20 border-b border-[#15BC83]/20 sticky top-14 z-40">
            {tabs.map(t => { const Icon = t.icon; return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all relative ${tab === t.id ? 'bg-[#15BC83] text-white' : 'text-white/50'}`}>
                <Icon className="w-5 h-5" /><span className="text-[10px] font-bold">{t.label}</span>
                {t.badge > 0 && <span className="absolute -top-1 right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">{t.badge}</span>}
              </button>
            ); })}
          </div>
          <div className="max-w-lg mx-auto p-3 pb-24">
            <button onClick={() => { setView('search'); setSearchQuery(''); setSearchResults([]); }} className="w-full bg-[#15BC83]/10 border border-[#15BC83]/20 rounded-xl px-4 py-3 text-sm text-white/40 flex items-center gap-2 mb-4">
              <Search className="w-4 h-4" /> ابحث عن صديق بمعرّفه...
            </button>
            {tab === 'notifications' && (
              <>
                {pendingReqs.length > 0 && <button onClick={() => setView('requests')} className="w-full bg-[#15BC83]/20 rounded-xl p-3 mb-2 flex items-center gap-3"><div className="relative"><Bell className="w-6 h-6 text-[#15BC83]" /><span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">{pendingReqs.length}</span></div><span className="text-sm font-bold">طلبات الصداقة ({pendingReqs.length})</span></button>}
                {pendingReqs.length === 0 && <div className="text-center text-white/40 py-20"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد إشعارات</p></div>}
              </>
            )}
            {tab === 'nearby' && (
              <>
                {friends.length === 0 ? <div className="text-center text-white/40 py-20"><UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد أصدقاء</p><button onClick={() => setView('search')} className="text-[#15BC83] text-sm mt-2">ابحث عن أصدقاء</button></div>
                : friends.map(f => {
                  const unread = unreadByFriend[f.userId];
                  const unreadCount = unread?.count || 0;
                  return (
                  <div key={f.friendshipId} className="bg-[#15BC83]/10 rounded-xl p-3 mb-2 flex items-center gap-3">
                    <button onClick={() => openUserProfile(f)} className="relative">
                      <img src={f.avatar || '/yalla-avatars/defaultPhoto_1.png'} alt="" className="w-10 h-10 rounded-full" />
                      {/* شارة الرسائل غير المقروءة على الأفاتار */}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 border-2 border-[#062318] leading-[14px]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <button onClick={() => openUserProfile(f)} className="flex-1 text-right min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${unreadCount > 0 ? 'text-white' : 'text-white/90'} truncate`}>{f.displayName}</p>
                        {unreadCount > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#15BC83] flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-white/50">مستوى {f.level}</p>
                      {unread && unread.lastMessage && unreadCount > 0 && (
                        <p className="text-[11px] text-[#15BC83]/80 truncate mt-0.5">
                          {unread.lastMessage.length > 30 ? unread.lastMessage.slice(0, 30) + '…' : unread.lastMessage}
                        </p>
                      )}
                    </button>
                    {/* زر "مراسلة" النصي بدلاً من أيقونة فقط — يظهر الشارة إن وُجدت */}
                    <button
                      onClick={() => openChat(f)}
                      className="relative flex items-center gap-1.5 px-3 h-9 rounded-full bg-[#15BC83] hover:bg-[#13a374] text-white text-xs font-bold shadow-md shadow-[#15BC83]/30 transition-colors"
                      aria-label={`مراسلة ${f.displayName}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>مراسلة</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -left-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 border-2 border-[#062318] leading-[12px]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                  );
                })}
              </>
            )}
            {tab === 'wishes' && <div className="text-center text-white/40 py-20"><Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد أمنيات</p></div>}
            {tab === 'recent' && (friends.length === 0 ? <div className="text-center text-white/40 py-20"><Clock className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا يوجد نشاط</p></div> : friends.map(f => <div key={f.friendshipId} className="bg-[#15BC83]/10 rounded-xl p-3 mb-2 flex items-center gap-3"><img src={f.avatar || '/yalla-avatars/defaultPhoto_1.png'} alt="" className="w-10 h-10 rounded-full opacity-60" /><div className="flex-1"><p className="text-sm font-bold text-white/80">{f.displayName}</p><p className="text-xs text-white/40">مؤخراً</p></div></div>))}
          </div>
        </>
      )}

      {/* === SEARCH === */}
      {view === 'search' && (
        <div className="max-w-lg mx-auto p-3">
          <div className="flex items-center gap-3 mb-4"><button onClick={() => setView('list')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X className="w-4 h-4 text-white" /></button><h2 className="text-lg font-bold text-white">البحث</h2></div>
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="ابحث بمعرّف (ID)" dir="ltr" className="w-full bg-[#15BC83]/10 border border-[#15BC83]/20 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-white/40" autoFocus />
            {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"><X className="w-4 h-4" /></button>}
          </div>
          {searching ? <div className="text-center py-10"><Loader2 className="w-6 h-6 text-[#15BC83] animate-spin mx-auto" /></div>
          : searchResults.length === 0 && searchQuery ? <div className="text-center text-white/40 py-10"><p>لم يتم العثور</p></div>
          : searchResults.map(u => (
            <button key={u.id} onClick={() => openUserProfile(u)} className="w-full bg-[#15BC83]/10 rounded-xl p-3 mb-2 flex items-center gap-3 hover:bg-[#15BC83]/20">
              <img src={u.avatar || '/yalla-avatars/defaultPhoto_1.png'} alt="" className="w-12 h-12 rounded-full" />
              <div className="flex-1 text-right"><p className="text-sm font-bold text-white">{u.displayName}</p><p className="text-xs text-white/50">ID: {u.numericId || u.id}</p></div>
              <ChevronLeft className="w-4 h-4 text-white/30" />
            </button>
          ))}
        </div>
      )}

      {/* === REQUESTS === */}
      {view === 'requests' && (
        <div className="max-w-lg mx-auto p-3">
          <div className="flex items-center gap-3 mb-4"><button onClick={() => setView('list')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X className="w-4 h-4 text-white" /></button><h2 className="text-lg font-bold text-white">طلب الصداقة</h2></div>
          {pendingReqs.length === 0 ? <div className="text-center text-white/40 py-20"><UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد طلبات</p></div>
          : pendingReqs.map(req => (
            <div key={req.id} className="bg-[#15BC83]/10 rounded-xl p-3 mb-2 flex items-center gap-3">
              <button onClick={() => openUserProfile({ id: req.fromUserId, username: req.fromDisplayName, displayName: req.fromDisplayName, avatar: req.fromAvatar })}><img src={req.fromAvatar || '/yalla-avatars/defaultPhoto_1.png'} alt="" className="w-12 h-12 rounded-full" /></button>
              <div className="flex-1"><p className="text-sm font-bold text-white">{req.fromDisplayName}</p><p className="text-xs text-white/50">يريد أن يصبح صديقك</p></div>
              <button onClick={() => handleReject(req.id)} className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center"><X className="w-4 h-4 text-red-400" /></button>
              <button onClick={() => handleAccept(req.id)} className="px-4 h-9 rounded-full bg-[#15BC83] text-white text-sm font-bold">قبول</button>
            </div>
          ))}
        </div>
      )}

      {/* === CHAT === */}
      {view === 'chat' && chatFriend && (function () {
        // تحقق من حالة الصداقة الحالية: إن لم يعد صديقاً، اظهر زر "إضافة صديق"
        const isStillFriend = friends.some(f => f.userId === chatFriend.userId);
        return (
        // تخطيط ثابت (fixed) بين الهيدر العلوي والأزرار السفلية —
        // أفضل من h-[calc(100dvh-...)] لأنه لا يتأثر بتغيّر حجم viewport
        // (مثل إظهار/إخفاء شريط URL في المتصفّح) — لا فجوات ولا تداخل
        <div className="fixed top-14 left-0 right-0 bottom-[75px] flex flex-col z-30">
          <div className="flex items-center gap-3 p-3 bg-[#0a4a3a] border-b border-[#15BC83]/20">
            <button onClick={() => setView('list')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
            {/* الضغط على صورة/اسم الصديق → يفتح بروفايله (نفس نافذة بروفايلي) */}
            <button onClick={() => openUserProfile(chatFriend)} className="flex items-center gap-2 flex-1">
              <img src={chatFriend.avatar || '/yalla-avatars/defaultPhoto_1.png'} alt="" className="w-8 h-8 rounded-full" />
              <span className="text-sm font-bold text-white">{chatFriend.displayName}</span>
            </button>
            <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><MoreVertical className="w-4 h-4 text-white" /></button>
          </div>

          {showMenu && (
            <div className="absolute top-12 left-3 z-50 bg-[#0a2a1e] rounded-xl shadow-2xl border border-[#15BC83]/30 py-1 min-w-[160px]">
              <button onClick={() => { setShowMenu(false); openUserProfile(chatFriend); }} className="w-full px-4 py-2.5 text-right text-sm text-white hover:bg-[#15BC83]/10 flex items-center gap-2"><Users className="w-4 h-4 text-[#15BC83]" /> عرض الملف</button>
              {isStillFriend ? (
                <button onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }} className="w-full px-4 py-2.5 text-right text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"><Trash2 className="w-4 h-4" /> حذف صديق</button>
              ) : (
                <button onClick={() => { setShowMenu(false); handleReAddFriend(); }} className="w-full px-4 py-2.5 text-right text-sm text-[#15BC83] hover:bg-[#15BC83]/10 flex items-center gap-2"><UserPlus className="w-4 h-4" /> إعادة إرسال طلب صداقة</button>
              )}
              <button onClick={() => { setShowMenu(false); setToast('تم الإبلاغ'); setTimeout(() => setToast(''), 3000); }} className="w-full px-4 py-2.5 text-right text-sm text-white/70 hover:bg-[#15BC83]/10 flex items-center gap-2"><Flag className="w-4 h-4 text-white/50" /> إبلاغ</button>
            </div>
          )}

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#062318]">
            {chatMessages.length === 0 && <p className="text-center text-white/30 text-xs py-8">{isStillFriend ? 'لا توجد رسائل — ابدأ المحادثة' : 'أصبح هذا المستخدم غير صديق — أعد إضافته لإرسال رسائل جديدة'}</p>}
            {chatMessages.map((msg, i) => {
              // في RTL: justify-start = جهة اليمين (الصديق), justify-end = جهة اليسار (أنا)
              // مثل واتساب: رسائلي على اليسار، رسائل الصديق على اليمين
              const isMine = msg.fromUserId !== chatFriend.userId;
              // كشف إن كانت رسالة هدية (text يبدأ بـ 'gift:')
              const isGift = msg.type === 'gift' && isGiftMessage(msg.text);
              const giftId = isGift ? parseGiftId(msg.text) : null;
              const gift = giftId ? getGiftById(giftId) : null;
              const giftImgUrl = gift ? getGiftImageUrl(gift) : null;
              // كشف إن كانت رسالة نصية تحتوي إيموجي فقط (نعرضها كصورة كبيرة)
              const isPureEmoji = msg.type !== 'gift' && /^[\p{Emoji}\s]+$/u.test(msg.text) && msg.text.trim().length > 0;
              const emojiPngUrl = isPureEmoji ? emojiToPng(msg.text.trim()) : null;
              return (
                <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`relative max-w-[75%] px-3 py-2 shadow-sm ${
                      isMine
                        ? 'bg-[#15BC83] text-white rounded-2xl rounded-bl-sm'
                        : 'bg-[#1a3a30] text-white/90 border border-[#15BC83]/20 rounded-2xl rounded-br-sm'
                    }`}
                  >
                    {isGift && gift && giftImgUrl ? (
                      // عرض الهدية كصورة + اسم + سعر
                      <div className="flex flex-col items-center gap-1 min-w-[120px]">
                        <img
                          src={giftImgUrl}
                          alt={gift.nameAr || gift.name}
                          className="w-16 h-16 object-contain"
                          onError={(e) => {
                            // احتياطي: إن فشل تحميل الصورة، اعرض الإيموجي كصورة
                            const t = e.currentTarget;
                            if (!t.src.includes('github')) {
                              t.src = emojiToPng(gift.emoji);
                            }
                          }}
                        />
                        <p className="text-xs font-bold text-center">{gift.nameAr || gift.name}</p>
                        {gift.price > 0 && (
                          <p className="text-[10px] flex items-center gap-1 justify-center">
                            <img src="/yalla-ui/diamonds.webp" alt="" className="w-3 h-3" />
                            {gift.price}
                          </p>
                        )}
                      </div>
                    ) : isPureEmoji && emojiPngUrl ? (
                      // عرض الإيموجي كصورة PNG كبيرة (ضمان一致性 عبر الأجهزة)
                      <img
                        src={emojiPngUrl}
                        alt={msg.text.trim()}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          // احتياطي: إن فشل تحميل PNG، اعرض كنص
                          const t = e.currentTarget as HTMLImageElement;
                          t.style.display = 'none';
                          const parent = t.parentElement;
                          if (parent) {
                            const fallback = document.createElement('p');
                            fallback.className = 'text-3xl';
                            fallback.textContent = msg.text.trim();
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : msg.type === 'gift' ? (
                      // هدية قديمة بصيغة إيموجي فقط (backward-compat) — اعرض كصورة
                      <img
                        src={emojiToPng(msg.text)}
                        alt={msg.text}
                        className="w-12 h-12 object-contain mx-auto"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                    )}
                    <p className={`text-[9px] mt-1 ${isMine ? 'text-white/70' : 'text-white/40'} text-left`}>
                      {new Date(msg.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* زر الإدخال إن كان صديقاً — أو زر "إضافة صديق" الأصفر إن لم يعد صديقاً */}
          {isStillFriend ? (
            <>
              <div className="flex items-center gap-2 p-3 bg-[#0a4a3a] border-t border-[#15BC83]/20">
                <button onClick={() => { setShowGifts(!showGifts); setShowEmoji(false); }} className="w-9 h-9 rounded-full bg-[#15BC83]/20 flex items-center justify-center"><Gift className="w-4 h-4 text-[#15BC83]" /></button>
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="اكتب رسالة..." className="flex-1 bg-white/5 border border-[#15BC83]/20 rounded-2xl px-4 py-2 text-sm text-white placeholder:text-white/30" />
                <button onClick={() => { setShowEmoji(!showEmoji); setShowGifts(false); }} className="w-9 h-9 rounded-full bg-[#15BC83]/20 flex items-center justify-center"><Smile className="w-4 h-4 text-[#15BC83]" /></button>
                <button onClick={sendMessage} className="w-9 h-9 rounded-full bg-[#15BC83] flex items-center justify-center hover:bg-[#13a374] transition-colors" aria-label="إرسال"><Send className="w-4 h-4 text-white" /></button>
              </div>
              {showEmoji && (
                <div className="bg-[#0a4a3a] border-t border-[#15BC83]/20 max-h-[40vh] flex flex-col">
                  {/* تبويبات فئات الإيموجي */}
                  <div className="flex gap-1 p-2 overflow-x-auto border-b border-[#15BC83]/20 flex-shrink-0">
                    {EMOJI_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setEmojiCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                          emojiCategory === cat.id
                            ? 'bg-[#15BC83] text-white'
                            : 'bg-[#15BC83]/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {/* شبكة الإيموجي للفئة المحدّدة — نعرضها كصور PNG لضمان一致性 */}
                  <div className="flex-1 overflow-y-auto p-2 grid grid-cols-8 gap-1">
                    {(EMOJI_CATEGORIES.find(c => c.id === emojiCategory)?.emojis || []).map((e, idx) => (
                      <button
                        key={`${e}-${idx}`}
                        onClick={() => setChatInput(prev => prev + e)}
                        className="aspect-square flex items-center justify-center rounded-lg hover:bg-[#15BC83]/15 transition-colors p-1"
                        title={e}
                      >
                        <img
                          src={emojiToPng(e)}
                          alt={e}
                          className="w-7 h-7 object-contain"
                          loading="lazy"
                          onError={(ev) => {
                            // احتياطي: عرض الإيموجي كنص إن فشل تحميل الصورة
                            const t = ev.currentTarget as HTMLImageElement;
                            t.style.display = 'none';
                            const parent = t.parentElement;
                            if (parent && !parent.querySelector('span')) {
                              const sp = document.createElement('span');
                              sp.className = 'text-2xl';
                              sp.textContent = e;
                              parent.appendChild(sp);
                            }
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {showGifts && (
                <div className="bg-[#0a4a3a] border-t border-[#15BC83]/20 max-h-[45vh] flex flex-col">
                  {/* تبويبات فئات الهدايا */}
                  <div className="flex gap-1 p-2 overflow-x-auto border-b border-[#15BC83]/20 flex-shrink-0">
                    {GIFT_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setGiftCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                          giftCategory === cat.id
                            ? 'bg-[#15BC83] text-white'
                            : 'bg-[#15BC83]/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <span className="ml-1">{cat.icon}</span>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  {/* شبكة الهدايا للفئة المحدّدة — مع الصور والأسعار */}
                  <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 gap-2">
                    {DEFAULT_GIFTS.filter(g => g.category === giftCategory).map(gift => {
                      const imgUrl = getGiftImageUrl(gift);
                      return (
                        <button
                          key={gift.id}
                          onClick={async () => {
                            setShowGifts(false);
                            // أرسل الهدية بصيغة 'gift:<id>' حتى يعرضها المستقبل بشكل صحيح
                            await fetch('/api/chat', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                toUserId: chatFriend.userId,
                                text: `gift:${gift.id}`,
                                type: 'gift',
                              }),
                            });
                            const msgRes = await fetch(`/api/chat?friendId=${chatFriend.userId}`);
                            const msgData = await msgRes.json();
                            if (msgData.success) setChatMessages(msgData.messages || []);
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#15BC83]/10 hover:bg-[#15BC83]/20 transition-colors"
                          title={gift.nameAr || gift.name}
                        >
                          <img
                            src={imgUrl}
                            alt={gift.nameAr || gift.name}
                            className="w-10 h-10 object-contain"
                            loading="lazy"
                            onError={(ev) => {
                              const t = ev.currentTarget as HTMLImageElement;
                              if (!t.src.includes('github')) t.src = emojiToPng(gift.emoji);
                            }}
                          />
                          <p className="text-[10px] font-bold text-white text-center truncate w-full">{gift.nameAr || gift.name}</p>
                          {gift.price > 0 && (
                            <p className="text-[9px] flex items-center gap-0.5 text-[#F5B841]">
                              <img src="/yalla-ui/diamonds.webp" alt="" className="w-2.5 h-2.5" />
                              {gift.price}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-[#0a4a3a] border-t border-[#15BC83]/20">
              <button
                onClick={handleReAddFriend}
                disabled={sending || friendStatus === 'pending'}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-black shadow-lg shadow-amber-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
                ) : friendStatus === 'pending' ? (
                  <><UserPlus className="w-4 h-4" /> طلب مرسل — في انتظار الموافقة</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> إعادة إضافة كصديق</>
                )}
              </button>
            </div>
          )}
        </div>
        );
      })()}

      {/* نافذة تأكيد حذف صديق — عالمية، تظهر من أي وضع */}
      {showDeleteConfirm && chatFriend && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#0a2a1e] rounded-2xl overflow-hidden max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-[#15BC83] py-3 px-4 flex items-center justify-between"><span className="text-white font-bold">تنبيه</span><button onClick={() => setShowDeleteConfirm(false)}><X className="w-4 h-4 text-white" /></button></div>
            <div className="p-6 text-center">
              <p className="text-white/80 text-sm mb-6">هل أنت متأكد أنك تريد حذف {chatFriend.displayName} من أصدقائك؟</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2 rounded-xl bg-[#15BC83]/20 text-white text-sm font-bold">إلغاء</button>
                <button onClick={handleDeleteFriend} className="px-6 py-2 rounded-xl bg-red-500 text-white text-sm font-bold">تأكيد</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === YallaProfileDialog — نفس نافذة بروفايلي لكن بوضع العرض (viewOnly) === */}
      <YallaProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        authUser={selectedUser ? {
          id: selectedUser.id,
          username: selectedUser.username,
          displayName: selectedUser.displayName,
          avatar: selectedUser.avatar,
          numericId: selectedUser.numericId,
        } : null}
        viewOnly
        friendStatus={friendStatus}
        onAddFriend={handleAddFriend}
        onDeleteFriend={() => {
          if (chatFriend) handleDeleteFriendWrapper();
          else if (selectedUser) {
            // Find friendshipId from friends list
            const f = friends.find(fr => fr.userId === selectedUser.id);
            if (f) { setChatFriend(f); handleDeleteFriendWrapper(); }
          }
        }}
        onSendMessage={() => {
          if (chatFriend) { setProfileDialogOpen(false); setView('chat'); }
          else if (selectedUser) {
            const f = friends.find(fr => fr.userId === selectedUser.id);
            if (f) { setProfileDialogOpen(false); setChatFriend(f); setView('chat'); setChatMessages([]); }
          }
        }}
      />

      {/* SiteBottomNav يُقدَّم الآن من AppShell على كل الصفحات */}
    </div>
  );

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true); setView('search');
    try {
      const res = await fetch(`/api/friends?type=search&q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch {}
    setSearching(false);
  }
}
