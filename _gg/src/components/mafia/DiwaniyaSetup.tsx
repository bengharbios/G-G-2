'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/game-store';
import { MIN_PLAYERS, MAX_PLAYERS, getTeamComposition } from '@/lib/game-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Plus,
  Minus,
  Shield,
  Skull,
  Copy,
  Check,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Play,
  ArrowLeft,
  Info,
} from 'lucide-react';

interface DiwaniyaSetupProps {
  onStartGame: () => void;
}

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

export default function DiwaniyaSetup({ onStartGame }: DiwaniyaSetupProps) {
  const { startGame, setRoomCode, setHostName: setStoreHostName, roomCode: persistedRoomCode, hostName: persistedHostName } = useGameStore();

  const [step, setStep] = useState<'form' | 'waiting'>('form');
  const [hostName, setHostName] = useState('');
  const [playerCount, setPlayerCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const composition = getTeamComposition(playerCount);

  // Restore from persisted room code (page refresh)
  useEffect(() => {
    if (persistedRoomCode && !createdCode) {
      setCreatedCode(persistedRoomCode);
      if (persistedHostName) setHostName(persistedHostName);
      setStep('waiting');
    }
  }, [persistedRoomCode, createdCode, persistedHostName]);

  // Poll room state when waiting
  const pollRoom = useCallback(async () => {
    if (!createdCode) return;
    try {
      const res = await fetch(`/api/room/${createdCode}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data);

        // Sync playerCount from server data (important after page refresh)
        if (data.playerCount) {
          setPlayerCount(data.playerCount);
        }

        // Check if room was ended (host reset from another tab or server)
        if (data.phase === 'setup' && !data.players?.some((p: any) => p.hasJoined)) {
          // Room was fully reset - go back to form
          setRoom(null);
          setCreatedCode(null);
          setStep('form');
          useGameStore.getState().setRoomCode(null);
          useGameStore.getState().setGameMode(null);
          return;
        }
      } else if (res.status === 404) {
        // Room doesn't exist anymore
        setError('الغرفة لم تعد موجودة. أنشئ غرفة جديدة.');
        setCreatedCode(null);
        setStep('form');
        useGameStore.getState().setRoomCode(null);
        useGameStore.getState().setGameMode(null);
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
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: hostName.trim(),
          playerCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setLoading(false);
        return;
      }

      setCreatedCode(data.code);
      setRoomCode(data.code);
      setStoreHostName(hostName.trim());
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
    try {
      const res = await fetch(`/api/room/${createdCode}/join`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action: 'approve' }),
      });
      if (res.ok) pollRoom();
    } catch {
      // silent
    }
  };

  const handleApproveAll = async () => {
    if (!createdCode || pendingPlayers.length === 0) return;
    try {
      const res = await fetch(`/api/room/${createdCode}/join`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_all' }),
      });
      if (res.ok) pollRoom();
    } catch {
      // silent
    }
  };

  const handleReject = async (playerId: string) => {
    try {
      const res = await fetch(`/api/room/${createdCode}/join`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action: 'reject' }),
      });
      if (res.ok) pollRoom();
    } catch {
      // silent
    }
  };

  // Leave room and go back to home
  const handleLeaveRoom = async () => {
    if (!createdCode) {
      useGameStore.getState().resetGame();
      return;
    }
    setLeaving(true);
    try {
      // Delete room from server - this will signal all players that session ended
      await fetch(`/api/room/${createdCode}`, { method: 'DELETE' });
    } catch {
      // Even if API fails, still leave locally
    }
    // Clear persisted state
    localStorage.removeItem(`mafia_player_name_${createdCode}`);
    useGameStore.getState().resetGame();
    setLeaving(false);
    window.location.href = '/';
  };

  const handleStartGame = async () => {
    if (!room || !createdCode) return;

    // Get approved players
    const approvedPlayers = room.players.filter((p) => p.hasJoined);
    if (approvedPlayers.length < MIN_PLAYERS) return;

    try {
      // Start game via API - assigns roles
      const res = await fetch(`/api/room/${createdCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        return;
      }

      // Start game locally with approved players
      const playerNames = approvedPlayers.map((p) => p.name);
      startGame(playerNames);
      // Enable role display for host in Diwaniya mode
      useGameStore.getState().toggleRolesToHost();
      onStartGame();
    } catch {
      setError('تعذر بدء اللعبة');
    }
  };

  const pendingPlayers = room?.players.filter((p) => !p.hasJoined) || [];
  const approvedPlayers = room?.players.filter((p) => p.hasJoined) || [];
  const canStart = approvedPlayers.length >= MIN_PLAYERS && pendingPlayers.length === 0;
  const hasEnoughPlayers = approvedPlayers.length >= MIN_PLAYERS;

  // ================================
  // FORM STEP
  // ================================
  if (step === 'form') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-night" dir="rtl">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white star-twinkle"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
                animationDuration: Math.random() * 3 + 2 + 's',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto"
        >
          {/* Title */}
          <div className="text-center mb-4 sm:mb-6">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
              className="text-6xl sm:text-7xl mb-3 sm:mb-4"
            >
              🏠
            </motion.div>
            <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 mb-2">
              الديوانية
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-bold">
              أنشئ غرفة وادعُ أصدقاءك 🔥
            </p>
          </div>

          {/* Back button */}
          <Button
            onClick={() => useGameStore.getState().resetGame()}
            variant="ghost"
            className="text-slate-500 hover:text-slate-300 mb-3 gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>

          {/* Rules */}
          <div className="flex justify-center mb-3">
            <Button variant="ghost" onClick={() => setShowRules(!showRules)} className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-2 text-sm">
              <Info className="w-4 h-4" />
              {showRules ? 'إخفاء القوانين' : '📜 القوانين'}
            </Button>
          </div>

          <AnimatePresence>
            {showRules && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Card className="bg-slate-900/80 border-slate-700/50 mb-3">
                  <CardContent className="pt-3 text-xs text-slate-300 space-y-2">
                    <p className="text-slate-400">🏗️ <strong className="text-slate-200">الديوانية:</strong> أنت العراب تنشئ غرفة وتشارك الكود مع أصدقائك. كل لاعب ينضم من جهازه الخاص. توافق على كل طلب انضمام ثم تبدأ اللعبة.</p>
                    <p className="text-slate-400">📱 كل لاعب يرى دوره فقط على جهازه</p>
                    <p className="text-slate-400">🎮 أنت تتحكم بكل المراحل من جهازك</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Setup Form */}
          <Card className="bg-slate-900/80 border-blue-500/30 mb-3">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">اسمك (العراب)</label>
                  <Input
                    value={hostName}
                    onChange={(e) => { setHostName(e.target.value); setError(''); }}
                    placeholder="اسمك..."
                    className="bg-slate-800/50 border-blue-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12"
                    dir="rtl"
                    maxLength={20}
                  />
                </div>

                {/* Player Count Selector */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">عدد اللاعبين</label>
                  <div className="flex items-center justify-center gap-4">
                    <div
                      onClick={() => setPlayerCount((p) => Math.max(MIN_PLAYERS, p - 1))}
                      className="w-10 h-10 rounded-full bg-red-900/50 border border-red-500/50 flex items-center justify-center cursor-pointer hover:bg-red-800/50"
                      role="button"
                      tabIndex={0}
                    >
                      <Minus className="w-4 h-4 text-red-300" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-slate-100">{playerCount}</div>
                      <div className="text-[10px] text-slate-500">لاعب</div>
                    </div>
                    <div
                      onClick={() => setPlayerCount((p) => Math.min(MAX_PLAYERS, p + 1))}
                      className="w-10 h-10 rounded-full bg-green-900/50 border border-green-500/50 flex items-center justify-center cursor-pointer hover:bg-green-800/50"
                      role="button"
                      tabIndex={0}
                    >
                      <Plus className="w-4 h-4 text-green-300" />
                    </div>
                  </div>
                </div>

                {/* Team Composition */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Skull className="w-3 h-3 text-red-400" />
                      <span className="text-red-300 text-[10px] font-bold">مافيا ({composition.mafiaCount})</span>
                    </div>
                    {composition.mafiaRoles.map((r, i) => (
                      <p key={i} className="text-[9px] text-slate-500">{r.name}</p>
                    ))}
                  </div>
                  <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-300 text-[10px] font-bold">صالحين ({composition.citizenCount})</span>
                    </div>
                    {composition.citizenSpecialRoles.map((r) => (
                      <p key={r.type} className="text-[9px] text-slate-500">{r.name}</p>
                    ))}
                    {composition.plainCitizens > 0 && (
                      <p className="text-[9px] text-slate-500">مواطن ×{composition.plainCitizens}</p>
                    )}
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center">
                    ⚠️ {error}
                  </motion.p>
                )}

                <Button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full bg-gradient-to-l from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white font-bold text-base sm:text-lg py-5 pulse-glow-blue"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Home className="w-5 h-5 ml-2" />}
                  إنشاء الغرفة
                </Button>
              </div>
            </CardContent>
          </Card>

      </motion.div>
      </div>
    );
  }

  // ================================
  // WAITING STEP
  // ================================
  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 mafia-bg-night" dir="rtl">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto py-4 flex flex-col min-h-screen"
      >
        {/* Top Bar: Back button + Mode indicator */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => setShowLeaveDialog(true)}
            variant="ghost"
            className="text-slate-500 hover:text-red-400 gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </Button>
          <Badge className="text-[10px] bg-blue-950/50 text-blue-300 border border-blue-500/30 px-2.5">
            🏠 الديوانية
          </Badge>
        </div>

        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-blue-300 mb-1">🏠 الديوانية</h1>
          <p className="text-xs text-slate-400">في انتظار اللاعبين...</p>
        </div>

        {/* Room Code Card */}
        <Card className="bg-gradient-to-bl from-indigo-950/50 via-slate-900/80 to-slate-900/80 border-indigo-500/30 mb-4">
          <CardContent className="pt-5 text-center">
            <p className="text-xs text-indigo-300 mb-2">كود الغرفة - شاركه مع اللاعبين:</p>
            <div className="bg-slate-800/80 rounded-xl p-4 mb-3 inline-block min-w-[200px]">
              <p className="text-3xl sm:text-4xl font-mono font-black text-white tracking-[0.3em]">
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
                {copied ? <><Check className="w-3.5 h-3.5 ml-1" /> تم!</> : <><Copy className="w-3.5 h-3.5 ml-1" /> نسخ اللينك</>}
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
            <p className="text-[10px] text-slate-500 mt-2">
              {playerCount} لاعب مطلوب
            </p>
          </CardContent>
        </Card>

        {/* Pending Players (need approval) */}
        {pendingPlayers.length > 0 && (
          <Card className="bg-amber-950/30 border-amber-500/30 mb-4">
            <CardContent className="pt-3 pb-3">
              <h3 className="text-amber-300 font-bold text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                </span>
                طلبات الانضمام ({pendingPlayers.length})
              </h3>
              {/* Accept All button */}
              <Button
                onClick={handleApproveAll}
                variant="ghost"
                size="sm"
                className="text-[10px] text-green-400 hover:text-green-300 hover:bg-green-900/30 h-6 px-2"
              >
                <CheckCircle className="w-3 h-3 ml-1" />
                قبول الجميع
              </Button>
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingPlayers.map((player, i) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-900/50 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                          {player.name.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-200">{player.name}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleApprove(player.id)}
                          className="w-8 h-8 rounded-lg bg-green-900/50 border border-green-500/30 flex items-center justify-center hover:bg-green-800/50"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleReject(player.id)}
                          className="w-8 h-8 rounded-lg bg-red-900/50 border border-red-500/30 flex items-center justify-center hover:bg-red-800/50"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved Players */}
        <Card className="bg-slate-900/80 border-slate-700/50 mb-4">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                اللاعبون الموافق عليهم
              </h3>
              <Badge
                className={`text-[10px] px-2 ${
                  hasEnoughPlayers
                    ? 'bg-green-900/50 text-green-300 border border-green-500/30'
                    : 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
                }`}
              >
                {approvedPlayers.length}/{playerCount}
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
                    className="bg-green-950/30 border border-green-500/20 rounded-lg p-2 flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-green-900/50 border border-green-500/30 flex items-center justify-center text-[10px] font-bold text-green-300">
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-300 truncate block">{player.name}</span>
                      <span className="text-[9px] text-green-400">✅ موافق</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500">
                  لم ينضم أحد بعد... شارك الكود!
                </p>
              </div>
            )}

            {!hasEnoughPlayers && approvedPlayers.length > 0 && (
              <p className="text-[10px] text-yellow-400 text-center mt-2">
                تحتاج {MIN_PLAYERS - approvedPlayers.length} لاعب على الأقل لبدء اللعبة
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center mb-3">
            ⚠️ {error}
          </motion.p>
        )}

        {/* Start Game Button */}
        <AnimatePresence>
          {canStart && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-l from-green-600 to-emerald-800 hover:from-green-500 hover:to-emerald-700 text-white font-bold text-base sm:text-lg py-5 pulse-glow-gold"
              >
                <Play className="w-5 h-5 ml-2" />
                ابدأ اللعبة ({approvedPlayers.length} لاعب) 🔥
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting message when enough players but still pending */}
        {false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-2"
          >
            <p className="text-xs text-slate-400">
              جميع الطلبات معالجة - جاهز للبدء!
            </p>
          </motion.div>
        )}

        {/* Spacer to push footer down */}
        <div className="flex-1" />
      </motion.div>

      {/* Leave Confirmation Dialog */}
      <AnimatePresence>
        {showLeaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowLeaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">
                  مغادرة الغرفة؟
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  إذا خرجت، سيتم إنهاء الجلسة وسيخرج جميع اللاعبين. هل تريد المتابعة؟
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowLeaveDialog(false)}
                    variant="outline"
                    disabled={leaving}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleLeaveRoom}
                    disabled={leaving}
                    className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-11"
                  >
                    {leaving ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الخروج...
                      </span>
                    ) : (
                      'نعم، اخرج'
                    )}
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
