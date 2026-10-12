'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Users, Gamepad2, Clock, Search, UserPlus, MessageCircle, X, Loader2, ChevronLeft, Gift, Smile, MoreVertical, Trash2, Flag } from 'lucide-react';
// NOTE: الهيدر (SiteHeader) والأزرار السفلية (SiteBottomNav) الآن تُدار في AppShell
// (src/components/shared/AppShell.tsx) — تُحمّل مرة واحدة وتشاركها كل الصفحات.
import YallaProfileDialog from '@/components/shared/YallaProfileDialog';

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
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState('');
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setView('list'); }, [tab]);

  const loadData = useCallback(async () => {
    try {
      const [fr, pr] = await Promise.all([
        fetch('/api/friends?type=friends').then(r => r.json()),
        fetch('/api/friends?type=pending').then(r => r.json()),
      ]);
      if (fr.success) setFriends(fr.friends || []);
      if (pr.success) setPendingReqs(pr.requests || []);
    } catch {}
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (view !== 'chat' || !chatFriend) { if (chatPollRef.current) clearInterval(chatPollRef.current); return; }
    const poll = async () => {
      try { const res = await fetch(`/api/chat?friendId=${chatFriend.userId}`); const data = await res.json(); if (data.success) setChatMessages(data.messages || []); } catch {}
    };
    poll();
    chatPollRef.current = setInterval(poll, 3000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [view, chatFriend]);

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
      await fetch(`/api/friends/${chatFriend.friendshipId}`, { method: 'DELETE' });
      setFriends(prev => prev.filter(f => f.friendshipId !== chatFriend.friendshipId));
      setToast('تم حذف الصديق'); setTimeout(() => setToast(''), 3000);
      setView('list'); setChatFriend(null); loadData();
    } catch {}
  };
  // Wrapper for delete from profile dialog (finds friendshipId from selectedUser)
  const handleDeleteFriendWrapper = async () => {
    if (!chatFriend) return;
    setProfileDialogOpen(false);
    setShowDeleteConfirm(true);
  };

  const openChat = (friend: FriendItem) => { setChatFriend(friend); setView('chat'); setChatMessages([]); };

  const sendMessage = async () => {
    if (!chatInput.trim() || !chatFriend) return;
    const text = chatInput.trim(); setChatInput('');
    try {
      await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toUserId: chatFriend.userId, text }) });
      const msgRes = await fetch(`/api/chat?friendId=${chatFriend.userId}`);
      const msgData = await msgRes.json();
      if (msgData.success) setChatMessages(msgData.messages || []);
    } catch {}
  };

  const tabs = [
    { id: 'notifications' as FriendTab, label: 'الإشعارات', icon: Bell, badge: pendingReqs.length },
    { id: 'nearby' as FriendTab, label: 'أصدقاء', icon: Users, badge: 0 },
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
                : friends.map(f => (
                  <div key={f.friendshipId} className="bg-[#15BC83]/10 rounded-xl p-3 mb-2 flex items-center gap-3">
                    <button onClick={() => openUserProfile(f)}><img src={f.avatar || '/yalla-avatars/defaultPhoto_1.png'} alt="" className="w-10 h-10 rounded-full" /></button>
                    <button onClick={() => openUserProfile(f)} className="flex-1 text-right"><p className="text-sm font-bold text-white">{f.displayName}</p><p className="text-xs text-white/50">مستوى {f.level}</p></button>
                    <button onClick={() => openChat(f)} className="w-9 h-9 rounded-full bg-[#15BC83]/20 flex items-center justify-center hover:bg-[#15BC83]/40"><MessageCircle className="w-4 h-4 text-[#15BC83]" /></button>
                  </div>
                ))}
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
      {view === 'chat' && chatFriend && (
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
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
              <button onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }} className="w-full px-4 py-2.5 text-right text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"><Trash2 className="w-4 h-4" /> حذف صديق</button>
              <button onClick={() => { setShowMenu(false); setToast('تم الإبلاغ'); setTimeout(() => setToast(''), 3000); }} className="w-full px-4 py-2.5 text-right text-sm text-white/70 hover:bg-[#15BC83]/10 flex items-center gap-2"><Flag className="w-4 h-4 text-white/50" /> إبلاغ</button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
              <div className="bg-[#0a2a1e] rounded-2xl overflow-hidden max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
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

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#062318]">
            {chatMessages.length === 0 && <p className="text-center text-white/30 text-xs py-8">لا توجد رسائل — ابدأ المحادثة</p>}
            {chatMessages.map((msg, i) => (
              <div key={msg.id || i} className={`flex ${msg.fromUserId === chatFriend.userId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.fromUserId === chatFriend.userId ? 'bg-white/10 text-white/90 border border-[#15BC83]/20' : 'bg-[#15BC83] text-white'}`}>
                  {msg.type === 'gift' && <span className="text-2xl block text-center">{msg.text}</span>}
                  {msg.type !== 'gift' && <p className="text-sm">{msg.text}</p>}
                  <p className="text-[9px] opacity-50 mt-1">{new Date(msg.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 bg-[#0a4a3a] border-t border-[#15BC83]/20">
            <button onClick={() => { setShowGifts(!showGifts); setShowEmoji(false); }} className="w-9 h-9 rounded-full bg-[#15BC83]/20 flex items-center justify-center"><Gift className="w-4 h-4 text-[#15BC83]" /></button>
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="اكتب رسالة..." className="flex-1 bg-white/5 border border-[#15BC83]/20 rounded-2xl px-4 py-2 text-sm text-white placeholder:text-white/30" />
            <button onClick={() => { setShowEmoji(!showEmoji); setShowGifts(false); }} className="w-9 h-9 rounded-full bg-[#15BC83]/20 flex items-center justify-center"><Smile className="w-4 h-4 text-[#15BC83]" /></button>
            <button onClick={sendMessage} className="w-9 h-9 rounded-full bg-[#15BC83] flex items-center justify-center"><MessageCircle className="w-4 h-4 text-white" /></button>
          </div>
          {showEmoji && <div className="bg-[#0a4a3a] p-3 border-t border-[#15BC83]/20 grid grid-cols-8 gap-2">{['😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥','🎉','🎁','💀','👻'].map(e => <button key={e} onClick={() => setChatInput(prev => prev + e)} className="text-2xl">{e}</button>)}</div>}
          {showGifts && <div className="bg-[#0a4a3a] p-3 border-t border-[#15BC83]/20"><div className="grid grid-cols-4 gap-2">{['🌹','🍫','💎','🏆','🎂','🎈','⭐','🎁'].map(g => <button key={g} onClick={async () => { setShowGifts(false); await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toUserId: chatFriend.userId, text: g, type: 'gift' }) }); const msgRes = await fetch(`/api/chat?friendId=${chatFriend.userId}`); const msgData = await msgRes.json(); if (msgData.success) setChatMessages(msgData.messages || []); }} className="text-3xl p-2 rounded-xl bg-[#15BC83]/10 hover:bg-[#15BC83]/20">{g}</button>)}</div></div>}
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
