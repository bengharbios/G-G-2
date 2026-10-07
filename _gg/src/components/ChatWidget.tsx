'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, X, Users, ChevronDown } from 'lucide-react';

interface ChatMsg { text: string; sender: 'me' | 'other'; timestamp: number; }
interface FriendItem { userId: string; username: string; displayName: string; }

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'general' | 'friend'>('general');
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendItem | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [unread, setUnread] = useState(0);
  const [showFriends, setShowFriends] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.success) setUser({ id: data.user.id });
    }).catch(() => {});
  }, []);

  const getStorageKey = useCallback(() => {
    if (tab === 'friend' && selectedFriend) return `chat:${user?.id}:${selectedFriend.userId}`;
    return 'chat:general';
  }, [tab, selectedFriend, user]);

  useEffect(() => {
    if (!open) return;
    const key = getStorageKey();
    try {
      const stored = localStorage.getItem(key);
      if (stored) setMessages(JSON.parse(stored));
      else setMessages([]);
    } catch { setMessages([]); }

    if (tab === 'friend') {
      fetch('/api/friends?type=friends').then(r => r.json()).then(data => {
        if (data.success) setFriends(data.friends.map((f: { userId: string; username: string; displayName: string }) => ({ userId: f.userId, username: f.username, displayName: f.displayName })));
      }).catch(() => {});
    }
  }, [open, tab, getStorageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const key = getStorageKey();
    const msg: ChatMsg = { text: input.trim(), sender: 'me', timestamp: Date.now() };
    const newMsgs = [...messages, msg];
    setMessages(newMsgs);
    setInput('');
    try { localStorage.setItem(key, JSON.stringify(newMsgs)); } catch {}

    // Simulate reply for general chat
    if (tab === 'general') {
      setTimeout(() => {
        const replies = ['أهلاً!', 'كيف حالك؟', 'ممتاز!', 'يلا نلعب! 🎮', 'حياك الله 👋'];
        const reply: ChatMsg = { text: replies[Math.floor(Math.random() * replies.length)], sender: 'other', timestamp: Date.now() };
        const updated = [...newMsgs, reply];
        setMessages(updated);
        try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
        if (!open) setUnread(u => u + 1);
      }, 1000 + Math.random() * 2000);
    }
  };

  const switchTab = (t: 'general' | 'friend') => {
    setTab(t);
    setSelectedFriend(null);
    setShowFriends(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => { setOpen(!open); if (open) setUnread(0); }}
        className="fixed bottom-20 left-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 shadow-lg shadow-amber-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform"
        whileTap={{ scale: 0.9 }}
        aria-label="الدردشة"
      >
        {open ? <X className="w-6 h-6" /> : (
          <>
            <MessageCircle className="w-6 h-6" />
            {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-950">{unread}</span>}
          </>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 left-4 z-50 w-80 h-96 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-800/80 border-b border-slate-700/50">
              <div className="flex gap-1">
                <button onClick={() => switchTab('general')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tab === 'general' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}>العامة</button>
                <button onClick={() => switchTab('friend')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tab === 'friend' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'}`}>صديق</button>
              </div>
              <span className="text-xs text-slate-500">{tab === 'friend' && selectedFriend ? selectedFriend.displayName : 'الدردشة'}</span>
            </div>

            {/* Friend Selection */}
            {tab === 'friend' && !selectedFriend && (
              <div className="p-2 border-b border-slate-800">
                <button onClick={() => setShowFriends(!showFriends)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg bg-slate-800/60 text-sm text-slate-300 hover:bg-slate-700/60">
                  <Users className="w-4 h-4" />
                  <span>اختر صديقاً</span>
                  <ChevronDown className={`w-3 h-3 mr-auto transition-transform ${showFriends ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showFriends && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden mt-1">
                      <div className="max-h-40 overflow-y-auto space-y-0.5">
                        {friends.length === 0 ? <p className="text-xs text-slate-500 p-2 text-center">لا يوجد أصدقاء</p> :
                          friends.map(f => (
                            <button key={f.userId} onClick={() => { setSelectedFriend(f); setShowFriends(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 text-sm text-slate-300">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white">{f.displayName.charAt(0)}</div>
                              {f.displayName}
                            </button>
                          ))
                        }
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'thin' }}>
              {messages.length === 0 && (
                <p className="text-center text-slate-600 text-xs mt-8">ابدأ المحادثة...</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] px-3 py-1.5 rounded-xl text-sm ${msg.sender === 'me' ? 'bg-red-600/80 text-white rounded-bl-sm' : 'bg-slate-700 text-slate-200 rounded-br-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-2 bg-slate-800/80 border-t border-slate-700/50">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="اكتب رسالة..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50"
                dir="rtl"
              />
              <Button size="sm" onClick={sendMessage} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 h-8 w-8 p-0 flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
