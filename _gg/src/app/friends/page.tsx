'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Users, Gamepad2, Clock, Search, UserPlus, MessageCircle, X, Loader2 } from 'lucide-react';
import SiteHeader from '@/components/shared/SiteHeader';
import SiteBottomNav from '@/components/shared/SiteBottomNav';

type FriendTab = 'notifications' | 'nearby' | 'wishes' | 'recent';

interface FriendItem {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
  lastSeen?: string;
  game?: string;
}

export default function FriendsPage() {
  const [tab, setTab] = useState<FriendTab>('notifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ text: string; from: 'me' | 'them'; time: string }>>>({});
  const [addFriendId, setAddFriendId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  // Load friends and chats from localStorage (محلي على هاتف اللاعب)
  useEffect(() => {
    try {
      const savedFriends = localStorage.getItem('gg_friends');
      if (savedFriends) setFriends(JSON.parse(savedFriends));
      const savedChats = localStorage.getItem('gg_chats');
      if (savedChats) setChatMessages(JSON.parse(savedChats));
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem('gg_friends', JSON.stringify(friends)); }, [friends]);
  useEffect(() => { localStorage.setItem('gg_chats', JSON.stringify(chatMessages)); }, [chatMessages]);

  // إضافة صديق بالمعرّف (numericId)
  const handleAddFriend = async () => {
    if (!addFriendId.trim()) return;
    setAdding(true);
    setAddMsg('');
    try {
      const res = await fetch(`/api/user/lookup?id=${encodeURIComponent(addFriendId.trim())}`);
      const data = await res.json();
      if (data.success && data.user) {
        // هل هو موجود بالفعل؟
        if (friends.some(f => f.id === data.user.id)) {
          setAddMsg('هذا الصديق موجود بالفعل');
          return;
        }
        const newFriend: FriendItem = {
          id: data.user.id,
          name: data.user.displayName || data.user.username,
          avatar: data.user.avatar || '/yalla-avatars/defaultPhoto_1.png',
          status: 'offline',
          lastSeen: 'الآن',
        };
        setFriends(prev => [...prev, newFriend]);
        setAddFriendId('');
        setAddMsg(`تمت إضافة ${newFriend.name} ✓`);
      } else {
        setAddMsg(data.error || 'لم يتم العثور على مستخدم بهذا المعرّف');
      }
    } catch {
      setAddMsg('تعذر الاتصال بالخادم');
    } finally {
      setAdding(false);
    }
  };

  const sendChatMessage = (friendId: string, text: string) => {
    const now = new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => ({
      ...prev,
      [friendId]: [...(prev[friendId] || []), { text, from: 'me', time: now }],
    }));
  };

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'notifications' as FriendTab, label: 'الإشعارات', icon: Bell },
    { id: 'nearby' as FriendTab, label: 'أصدقاء', icon: Users },
    { id: 'wishes' as FriendTab, label: 'أمنيات', icon: Gamepad2 },
    { id: 'recent' as FriendTab, label: 'مؤخراً', icon: Clock },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="h-14" />

      <div className="fixed inset-0 bg-gradient-to-b from-[#0a4a3a] to-[#062318] -z-10" />

      {/* تبويبات */}
      <div className="flex gap-1 p-3 bg-[#0D8A7A]/20 border-b border-[#15BC83]/20 sticky top-14 z-40">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                tab === t.id ? 'bg-[#15BC83] text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="max-w-lg mx-auto p-3 pb-24 min-h-[calc(100vh-200px)]">
        {/* إضافة صديق */}
        {tab === 'nearby' && (
          <div className="mb-4 bg-[#15BC83]/10 rounded-xl p-3">
            <p className="text-xs text-white/50 mb-2">أضف صديقاً بمعرّفه (ID)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={addFriendId}
                onChange={e => setAddFriendId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                placeholder="أدخل معرّف الصديق (مثل 100002)"
                dir="ltr"
                className="flex-1 bg-white/5 border border-[#15BC83]/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30"
                disabled={adding}
              />
              <button
                onClick={handleAddFriend}
                disabled={adding || !addFriendId.trim()}
                className="w-10 h-10 rounded-xl bg-[#15BC83] flex items-center justify-center disabled:opacity-40"
              >
                {adding ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <UserPlus className="w-4 h-4 text-white" />}
              </button>
            </div>
            {addMsg && <p className="text-xs mt-2 text-white/60">{addMsg}</p>}
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'notifications' && (
            <motion.div key="notifs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center text-white/40 py-20">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد إشعارات</p>
              </div>
            </motion.div>
          )}

          {tab === 'nearby' && (
            <motion.div key="nearby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {friends.length > 1 && (
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن صديق..."
                    className="w-full bg-[#15BC83]/10 border border-[#15BC83]/20 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-white/40"
                  />
                </div>
              )}
              {filteredFriends.length === 0 ? (
                <div className="text-center text-white/40 py-16">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد أصدقاء بعد</p>
                  <p className="text-xs mt-1">أضف أصدقاء عبر معرّفهم بالأعلى</p>
                </div>
              ) : (
                filteredFriends.map(f => (
                  <div key={f.id} className="bg-[#15BC83]/10 rounded-xl p-3 mb-2 flex items-center gap-3">
                    <div className="relative">
                      <img src={f.avatar} alt="" className="w-10 h-10 rounded-full" />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a4a3a] ${f.status === 'online' ? 'bg-green-400' : 'bg-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{f.name}</p>
                      <p className="text-xs text-white/50">ID: {f.id}</p>
                    </div>
                    <button onClick={() => setChatOpen(f.id)} className="w-9 h-9 rounded-full bg-[#15BC83]/20 flex items-center justify-center hover:bg-[#15BC83]/40">
                      <MessageCircle className="w-4 h-4 text-[#15BC83]" />
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {tab === 'wishes' && (
            <motion.div key="wishes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center text-white/40 py-20">
                <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد أمنيات لعب</p>
              </div>
            </motion.div>
          )}

          {tab === 'recent' && (
            <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {friends.length === 0 ? (
                <div className="text-center text-white/40 py-20">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا يوجد نشاط مؤخر</p>
                </div>
              ) : (
                friends.map(f => (
                  <div key={f.id} className="bg-[#15BC83]/10 rounded-xl p-3 mb-2 flex items-center gap-3">
                    <img src={f.avatar} alt="" className="w-10 h-10 rounded-full opacity-60" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white/80">{f.name}</p>
                      <p className="text-xs text-white/40">{f.lastSeen || 'غير متصل'}</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* نافذة الدردشة */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setChatOpen(null)}
          >
            <motion.div
              className="bg-[#0a2a1e] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col"
              initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-3 border-b border-[#15BC83]/20">
                <button onClick={() => setChatOpen(null)} className="text-white/60">
                  <X className="w-5 h-5" />
                </button>
                <img src={friends.find(f => f.id === chatOpen)?.avatar || '/yalla-avatars/defaultPhoto_1.png'} alt="" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-bold text-white">{friends.find(f => f.id === chatOpen)?.name || 'محادثة'}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
                {(chatMessages[chatOpen] || []).map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'me' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 ${msg.from === 'me' ? 'bg-[#15BC83] text-white' : 'bg-white/10 text-white/80'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-[9px] opacity-50 mt-0.5">{msg.time}</p>
                    </div>
                  </div>
                ))}
                {(chatMessages[chatOpen] || []).length === 0 && (
                  <p className="text-center text-white/30 text-xs py-8">لا توجد رسائل — ابدأ المحادثة</p>
                )}
              </div>

              <ChatInput onSend={(text) => sendChatMessage(chatOpen, text)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteBottomNav activeTab="friends" />
    </div>
  );
}

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };
  return (
    <div className="flex gap-2 p-3 border-t border-[#15BC83]/20">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
        placeholder="اكتب رسالة..."
        className="flex-1 bg-white/5 border border-[#15BC83]/20 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30"
      />
      <button onClick={handleSend} className="w-10 h-10 rounded-xl bg-[#15BC83] flex items-center justify-center">
        <MessageCircle className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
