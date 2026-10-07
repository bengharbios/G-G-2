'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Clock,
  Tag,
  Globe,
  Eye,
  HelpCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ALL_CATEGORIES } from '@/lib/shifarat-words';
import HowToPlay from './HowToPlay';
import type { TeamColor } from '@/lib/shifarat-types';

interface DiwaniyaSetupProps {
  onStart: (code: string, settings: any) => void;
  onBack: () => void;
}

const TIMER_OPTIONS = [30, 60, 90, 120, 0];

interface PendingPlayer {
  id: string;
  name: string;
  joinedAt: string;
}

interface RoomData {
  id: string;
  code: string;
  phase: string;
  hostName: string;
  playerCount: number;
  players: PendingPlayer[];
  createdAt: string;
}

export default function DiwaniyaSetup({ onStart, onBack }: DiwaniyaSetupProps) {
  const [step, setStep] = useState<'form' | 'waiting'>('form');
  const [hostName, setHostName] = useState('');
  const [team1Name, setTeam1Name] = useState('الفريق الأحمر');
  const [team2Name, setTeam2Name] = useState('الفريق الأزرق');
  const [timer, setTimer] = useState(60);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    ALL_CATEGORIES.map((c) => c.id)
  );
  const [firstTeam, setFirstTeam] = useState<TeamColor>('red');
  const [redSpymaster, setRedSpymaster] = useState('');
  const [blueSpymaster, setBlueSpymaster] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Poll room state
  const pollRoom = useCallback(async () => {
    if (!createdCode) return;
    try {
      const res = await fetch(`/api/room/${createdCode}?XTransformPort=3000`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data);
      } else if (res.status === 404) {
        setError('الغرفة لم تعد موجودة');
        setCreatedCode(null);
        setStep('form');
      }
    } catch {
      // silent poll
    }
  }, [createdCode]);

  useEffect(() => {
    if (step !== 'waiting') return;
    pollRoom();
    const interval = setInterval(pollRoom, 2000);
    return () => clearInterval(interval);
  }, [step, pollRoom]);

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      setError('يجب إدخال اسمك');
      return;
    }
    if (hostName.trim().length < 2) {
      setError('الاسم قصير جداً');
      return;
    }
    if (!team1Name.trim() || !team2Name.trim()) {
      setError('يجب إدخال أسماء الفريقين');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('يجب اختيار فئة واحدة على الأقل');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/room?XTransformPort=3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: hostName.trim(),
          team1Name: team1Name.trim(),
          team2Name: team2Name.trim(),
          timer,
          categories: selectedCategories,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setLoading(false);
        return;
      }

      setCreatedCode(data.code);
      setStep('waiting');
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdCode) {
      const link = `${window.location.origin}/join/${createdCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApprove = async (playerId: string) => {
    if (!createdCode) return;
    try {
      const res = await fetch(`/api/room/${createdCode}/join?XTransformPort=3000`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action: 'approve' }),
      });
      if (res.ok) pollRoom();
    } catch {
      // silent
    }
  };

  const handleReject = async (playerId: string) => {
    if (!createdCode) return;
    try {
      const res = await fetch(`/api/room/${createdCode}/join?XTransformPort=3000`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action: 'reject' }),
      });
      if (res.ok) pollRoom();
    } catch {
      // silent
    }
  };

  const handleStartGame = () => {
    if (!createdCode) return;
    onStart(createdCode, {
      hostName: hostName.trim(),
      team1Name: team1Name.trim(),
      team2Name: team2Name.trim(),
      timer,
      categories: selectedCategories,
      firstTeam,
      redSpymaster: redSpymaster.trim() || undefined,
      blueSpymaster: blueSpymaster.trim() || undefined,
    });
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== catId);
      }
      return [...prev, catId];
    });
  };

  const pendingPlayers = room?.players.filter((p) => !(p as any).hasJoined) || [];
  const approvedPlayers = room?.players.filter((p) => (p as any).hasJoined) || [];
  const MIN_PLAYERS = 2;
  const canStart = approvedPlayers.length >= MIN_PLAYERS && pendingPlayers.length === 0;

  const backgroundStyle = {
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
  };

  const cardStyle = {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(51, 65, 85, 0.5)',
    borderRadius: '1rem',
  };

  // ================================
  // FORM STEP
  // ================================
  if (step === 'form') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-start py-6 px-3 sm:px-4"
        dir="rtl"
        style={backgroundStyle}
      >
        {/* Decorative dots */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                backgroundColor: `rgba(16, 185, 129, ${Math.random() * 0.2 + 0.05})`,
                animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: Math.random() * 2 + 's',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md mx-auto space-y-4"
        >
          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
              🌐 الديوانية
            </h1>
            <p className="text-xs text-slate-400">أنشئ غرفة وادعُ أصدقائك</p>
          </div>

          {/* Top actions */}
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-slate-500 hover:text-slate-300 gap-1 text-xs -mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              رجوع
            </Button>
            <Button
              onClick={() => setShowHowToPlay(true)}
              variant="ghost"
              className="text-emerald-500 hover:text-emerald-400 gap-1 text-xs -mt-2"
            >
              <HelpCircle className="w-4 h-4" />
              كيف تلعب؟
            </Button>
          </div>

          {/* Host Name */}
          <div style={cardStyle}>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-200">اسمك (المضيف)</h2>
              </div>
              <Input
                value={hostName}
                onChange={(e) => { setHostName(e.target.value); setError(''); }}
                placeholder="اسمك..."
                className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right h-11"
                dir="rtl"
                maxLength={20}
              />
            </div>
          </div>

          {/* Team Names + Spymasters */}
          <div style={cardStyle}>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-200">أسماء الفرق والجواسيس</h2>
              </div>

              {/* Red Team */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                  <label className="text-xs text-red-300 font-bold">الفريق الأحمر</label>
                </div>
                <Input
                  value={team1Name}
                  onChange={(e) => { setTeam1Name(e.target.value); setError(''); }}
                  placeholder="اسم الفريق الأحمر..."
                  className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right h-11"
                  dir="rtl"
                  maxLength={20}
                />
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />
                  <Input
                    value={redSpymaster}
                    onChange={(e) => setRedSpymaster(e.target.value)}
                    placeholder="اسم الجاسوس (اختياري)..."
                    className="bg-slate-800/30 border-slate-700/40 text-slate-300 placeholder:text-slate-600 text-right h-10 text-xs"
                    dir="rtl"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* Blue Team */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                  <label className="text-xs text-blue-300 font-bold">الفريق الأزرق</label>
                </div>
                <Input
                  value={team2Name}
                  onChange={(e) => { setTeam2Name(e.target.value); setError(''); }}
                  placeholder="اسم الفريق الأزرق..."
                  className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right h-11"
                  dir="rtl"
                  maxLength={20}
                />
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-blue-400/60 flex-shrink-0" />
                  <Input
                    value={blueSpymaster}
                    onChange={(e) => setBlueSpymaster(e.target.value)}
                    placeholder="اسم الجاسوس (اختياري)..."
                    className="bg-slate-800/30 border-slate-700/40 text-slate-300 placeholder:text-slate-600 text-right h-10 text-xs"
                    dir="rtl"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* First Team Selector */}
          <div style={cardStyle}>
            <div className="p-4">
              <h2 className="text-sm font-bold text-slate-200 mb-3">الفريق الذي يبدأ أولاً</h2>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFirstTeam('red')}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                    firstTeam === 'red'
                      ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-500/10'
                      : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-red-500 mx-auto mb-1.5" />
                  <p className={`text-xs font-bold ${firstTeam === 'red' ? 'text-red-300' : 'text-slate-500'}`}>
                    أحمر
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">9 كلمات</p>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFirstTeam('blue')}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                    firstTeam === 'blue'
                      ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 mx-auto mb-1.5" />
                  <p className={`text-xs font-bold ${firstTeam === 'blue' ? 'text-blue-300' : 'text-slate-500'}`}>
                    أزرق
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">8 كلمات</p>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div style={cardStyle}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-200">الوقت</h2>
                <span className="text-xs text-slate-500 mr-auto">
                  {timer === 0 ? 'بدون وقت' : `${timer} ثانية`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TIMER_OPTIONS.map((t) => (
                  <motion.button
                    key={t}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setTimer(t)}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all min-w-[52px] min-h-[44px]"
                    style={{
                      background: timer === t
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))'
                        : 'rgba(30, 41, 59, 0.8)',
                      border: timer === t
                        ? '2px solid rgba(16, 185, 129, 0.5)'
                        : '2px solid rgba(51, 65, 85, 0.3)',
                      color: timer === t ? '#6ee7b7' : '#94a3b8',
                    }}
                  >
                    {t === 0 ? '∞' : t}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div style={cardStyle}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-200">الفئات</h2>
                <span className="text-[10px] text-slate-500 mr-auto">
                  {selectedCategories.length}/{ALL_CATEGORIES.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggleCategory(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px]"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))'
                          : 'rgba(30, 41, 59, 0.8)',
                        border: isSelected
                          ? '2px solid rgba(16, 185, 129, 0.5)'
                          : '2px solid rgba(51, 65, 85, 0.3)',
                        color: isSelected ? '#6ee7b7' : '#94a3b8',
                      }}
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.name}</span>
                      {isSelected && <Check className="w-3 h-3 mr-auto text-emerald-400" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs text-center"
            >
              ⚠️ {error}
            </motion.p>
          )}

          {/* Create Room Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full font-bold text-base sm:text-lg py-6 text-white"
              style={{
                background: 'linear-gradient(to left, #059669, #10b981)',
                borderRadius: '1rem',
                minHeight: '52px',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
              }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <Globe className="w-5 h-5 ml-2" />
              )}
              إنشاء الغرفة
            </Button>
          </motion.div>
        </motion.div>

        <HowToPlay open={showHowToPlay} onOpenChange={setShowHowToPlay} />
      </div>
    );
  }

  // ================================
  // WAITING STEP
  // ================================
  return (
    <div
      className="min-h-screen flex flex-col items-center py-4 px-3 sm:px-4"
      dir="rtl"
      style={backgroundStyle}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: `rgba(16, 185, 129, ${Math.random() * 0.2 + 0.05})`,
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-md mx-auto py-4 flex flex-col min-h-screen"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => setShowLeaveDialog(true)}
            variant="ghost"
            className="text-slate-500 hover:text-red-400 gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </Button>
          <Badge
            className="text-[10px] px-2.5"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#6ee7b7',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            🌐 الديوانية
          </Badge>
        </div>

        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-emerald-400 mb-1">🌐 الديوانية</h1>
          <p className="text-xs text-slate-400">في انتظار اللاعبين...</p>
        </div>

        {/* Room Code Card */}
        <div
          className="mb-4 p-5 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '1rem',
          }}
        >
          <p className="text-xs text-emerald-300 mb-2">كود الغرفة - شاركه مع اللاعبين:</p>
          <div
            className="rounded-xl p-4 mb-3 inline-block min-w-[200px]"
            style={{ background: 'rgba(15, 23, 42, 0.8)' }}
          >
            <p
              className="text-3xl sm:text-4xl font-mono font-black text-white tracking-[0.3em]"
              dir="ltr"
            >
              {createdCode}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 ml-1" /> تم!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 ml-1" /> نسخ اللينك
                </>
              )}
            </Button>
            <Button
              onClick={handleCopyCode}
              variant="outline"
              size="sm"
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Copy className="w-3.5 h-3.5 ml-1" />
              نسخ الكود
            </Button>
          </div>
        </div>

        {/* Pending Players */}
        {pendingPlayers.length > 0 && (
          <div
            className="mb-4 p-3"
            style={{
              background: 'rgba(120, 53, 15, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '1rem',
            }}
          >
            <h3 className="text-amber-300 font-bold text-xs sm:text-sm mb-2 flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
              </span>
              طلبات الانضمام ({pendingPlayers.length})
            </h3>
            <div className="space-y-2">
              <AnimatePresence>
                {pendingPlayers.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-lg p-2.5"
                    style={{ background: 'rgba(30, 41, 59, 0.5)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-amber-300"
                        style={{
                          background: 'rgba(120, 53, 15, 0.3)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        {player.name.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-200">{player.name}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleApprove(player.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'rgba(22, 101, 52, 0.3)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                        }}
                      >
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReject(player.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'rgba(127, 29, 29, 0.3)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Approved Players */}
        <div style={cardStyle} className="mb-4">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                اللاعبون
              </h3>
              <Badge
                className="text-[10px] px-2"
                style={{
                  background: approvedPlayers.length >= MIN_PLAYERS
                    ? 'rgba(22, 101, 52, 0.3)'
                    : 'rgba(120, 53, 15, 0.3)',
                  color: approvedPlayers.length >= MIN_PLAYERS ? '#86efac' : '#fcd34d',
                  border: approvedPlayers.length >= MIN_PLAYERS
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                {approvedPlayers.length} لاعب
              </Badge>
            </div>

            {approvedPlayers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {approvedPlayers.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 rounded-lg p-2"
                    style={{
                      background: 'rgba(22, 101, 52, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-green-300"
                      style={{
                        background: 'rgba(22, 101, 52, 0.3)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-300 truncate block">{player.name}</span>
                      <span className="text-[9px] text-green-400">✅ جاهز</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500">لم ينضم أحد بعد... شارك الكود!</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center mb-3">
            ⚠️ {error}
          </motion.p>
        )}

        {/* Start Button */}
        <AnimatePresence>
          {canStart && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Button
                onClick={handleStartGame}
                className="w-full font-bold text-base sm:text-lg py-6 text-white"
                style={{
                  background: 'linear-gradient(to left, #059669, #10b981)',
                  borderRadius: '1rem',
                  minHeight: '52px',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Play className="w-5 h-5 ml-2" />
                ابدأ اللعبة ({approvedPlayers.length} لاعب) 🔥
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />
      </motion.div>

      {/* Leave Dialog */}
      <AnimatePresence>
        {showLeaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowLeaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="p-6 max-w-sm w-full shadow-2xl"
              style={{
                background: '#0f172a',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                borderRadius: '1rem',
              }}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">مغادرة الغرفة؟</h3>
                <p className="text-sm text-slate-400 mb-6">
                  إذا خرجت، سيتم إنهاء الجلسة. هل تريد المتابعة؟
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowLeaveDialog(false)}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={onBack}
                    className="flex-1 text-white font-bold h-11"
                    style={{
                      background: 'linear-gradient(to left, #991b1b, #b91c1c)',
                    }}
                  >
                    نعم، اخرج
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
