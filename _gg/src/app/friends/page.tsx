'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Search, Check, X, UserMinus, ArrowRight, Loader2 } from 'lucide-react';

interface AuthUser { id: string; username: string; displayName: string; avatar: string; }
interface Friend { friendshipId: string; userId: string; username: string; displayName: string; avatar: string; level: number; }
interface PendingReq { id: string; fromUserId: string; fromUsername: string; fromDisplayName: string; fromAvatar: string; }
interface SearchResult { id: string; username: string; displayName: string; avatar: string; }

export default function FriendsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<PendingReq[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.success && data.user) { setUser(data.user); loadData(); }
      else { router.push('/'); }
      setLoading(false);
    }).catch(() => { router.push('/'); setLoading(false); });
  }, []);

  const loadData = useCallback(async () => {
    const [fRes, rRes] = await Promise.all([fetch('/api/friends?type=friends'), fetch('/api/friends?type=pending')]);
    const fData = await fRes.json(); if (fData.success) setFriends(fData.friends);
    const rData = await rRes.json(); if (rData.success) setRequests(rData.requests);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/friends?type=search&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) setSearchResults(data.users);
    } finally { setSearching(false); }
  };

  const handleSendRequest = async (username: string) => {
    setSendingTo(username);
    try {
      const res = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toUsername: username }) });
      const data = await res.json();
      if (data.success) { toast({ title: 'تم إرسال الطلب', description: `تم إرسال طلب صداقة إلى ${username}` }); setSearchResults(prev => prev.filter(u => u.username !== username)); }
      else { toast({ title: 'خطأ', description: data.error, variant: 'destructive' }); }
    } finally { setSendingTo(null); }
  };

  const handleAccept = async (id: string) => {
    const res = await fetch(`/api/friends/${id}`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) { toast({ title: 'تم القبول', description: 'تم قبول طلب الصداقة' }); setRequests(prev => prev.filter(r => r.id !== id)); loadData(); }
  };

  const handleReject = async (id: string) => {
    const res = await fetch(`/api/friends/${id}?action=reject`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast({ title: 'تم الرفض' }); setRequests(prev => prev.filter(r => r.id !== id)); }
  };

  const handleRemove = async (friendshipId: string, name: string) => {
    const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast({ title: 'تم الحذف', description: `تم حذف ${name} من الأصدقاء` }); setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId)); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">الأصدقاء</h1>
            <p className="text-xs text-slate-400">إدارة أصدقائك وطلبات الصداقة</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <Tabs defaultValue="friends" className="w-full" dir="rtl">
          <TabsList className="bg-slate-900 border border-slate-800/50 w-full mb-4">
            <TabsTrigger value="friends" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              <Users className="w-4 h-4 ml-1.5" /> أصدقائي {friends.length > 0 && <Badge variant="secondary" className="mr-1.5 text-[10px] bg-slate-700">{friends.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <UserPlus className="w-4 h-4 ml-1.5" /> الطلبات {requests.length > 0 && <Badge variant="secondary" className="mr-1.5 text-[10px] bg-rose-500/20 text-rose-300">{requests.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="search" className="flex-1 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Search className="w-4 h-4 ml-1.5" /> بحث
            </TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <AnimatePresence mode="wait">
              {friends.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">لا يوجد أصدقاء حتى الآن</p>
                  <p className="text-slate-500 text-xs mt-1">ابحث عن أصدقاء جدد من تبويب البحث</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {friends.map((f, i) => (
                    <motion.div key={f.friendshipId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="bg-slate-900/60 border-slate-800/50 hover:border-slate-700/50 transition-colors">
                        <CardContent className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                              {f.avatar ? <img src={f.avatar} className="w-full h-full rounded-full object-cover" /> : (f.displayName || f.username).charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{f.displayName || f.username}</p>
                              <p className="text-xs text-slate-500">@{f.username} · مستوى {f.level}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => handleRemove(f.friendshipId, f.displayName || f.username)}>
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <AnimatePresence mode="wait">
              {requests.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <UserPlus className="w-16 h-16 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">لا يوجد طلبات معلقة</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {requests.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="bg-slate-900/60 border-amber-500/20">
                        <CardContent className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                              {r.fromAvatar ? <img src={r.fromAvatar} className="w-full h-full rounded-full object-cover" /> : (r.fromDisplayName || r.fromUsername).charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{r.fromDisplayName || r.fromUsername}</p>
                              <p className="text-xs text-slate-500">@{r.fromUsername}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <Button size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 h-8 px-3" onClick={() => handleAccept(r.id)}>
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 px-3" onClick={() => handleReject(r.id)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search">
            <div className="flex gap-2 mb-4">
              <Input placeholder="ابحث بالاسم أو المعرف..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500" />
              <Button onClick={handleSearch} disabled={searching} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-4">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <AnimatePresence mode="wait">
              {searchResults.length === 0 && !searching ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">ابحث عن مستخدمين لإضافة أصدقاء</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="bg-slate-900/60 border-slate-800/50">
                        <CardContent className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                              {(u.displayName || u.username).charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{u.displayName || u.username}</p>
                              <p className="text-xs text-slate-500">@{u.username}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 h-8 px-3" disabled={sendingTo === u.username} onClick={() => handleSendRequest(u.username)}>
                            {sendingTo === u.username ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 ml-1" />}
                            <span className="text-xs">أضف</span>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
