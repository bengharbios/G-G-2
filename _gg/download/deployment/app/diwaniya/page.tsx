'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTobolStore } from '@/lib/tobol-store';
import GameBoard from '@/components/tobol/GameBoard';
import TobolGameOver from '@/components/tobol/TobolGameOver';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home as HomeIcon, RotateCcw, Users, Home, Eye, Zap, Swords, Copy, Check } from 'lucide-react';
import type { SpectatorInfo } from '@/lib/tobol-room-store';


// ============================================================
// Hydration guard
// ============================================================
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}





// ============================================================
// Diwaniya Landing Page
// ============================================================
function DiwaniyaLanding({ onHost, onJoin }: { onHost: () => void; onJoin: (code: string, name: string) => void }) {
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setJoinError('يجب إدخال كود الغرفة');
      return;
    }
    if (!joinName.trim()) {
      setJoinError('يجب إدخال اسمك');
      return;
    }
    setJoinError('');
    onJoin(joinCode.trim().toUpperCase(), joinName.trim());
  };

  return (
    <div className="flex flex-col items-center py-6 sm:py-8 px-3 sm:px-4 tobol-bg relative" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto"
      >
        {/* Title */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
            className="text-6xl sm:text-7xl mb-3 sm:mb-4"
          >
            🏠
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-400 to-blue-500 mb-2">
            الديوانية
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold">
            Tobol Diwaniya — شاهد المعركة ⚔️
          </p>
        </div>

        {/* Create Room Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-bl from-blue-950/40 via-slate-900/80 to-slate-900/80 border-blue-500/30 mb-4 sm:mb-6">
            <CardContent className="pt-5 sm:pt-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-blue-300">
                    إنشاء غرفة ديوانية
                  </h2>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  أنشئ غرفة واحصل على كود للمشاهدين
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>ستحصل على كود غرفة فريد</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Users className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>شارك الكود مع المشاهدين لمتابعة المعركة</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Eye className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>المشاهدون يشاهدون بدون التدخل بالأيقونات</span>
                </div>
              </div>

              <Button
                onClick={onHost}
                className="w-full bg-gradient-to-l from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white font-bold text-base sm:text-lg py-5 transition-all duration-300 pulse-glow-blue"
              >
                <Home className="w-5 h-5 ml-2" />
                إنشاء غرفة
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex-1 h-px bg-gradient-to-l from-slate-600 to-transparent" />
          <span className="text-xs text-slate-500 font-bold">أو</span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent" />
        </div>

        {/* Join Room Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-bl from-green-950/40 via-slate-900/80 to-slate-900/80 border-green-500/30 mb-4 sm:mb-6">
            <CardContent className="pt-5 sm:pt-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-green-300">
                    دخول مشاهد
                  </h2>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  عندك كود الغرفة؟ شاهد المعركة مباشرة
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">كود الغرفة</label>
                  <Input
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                    placeholder="مثال: ABC123"
                    className="bg-slate-800/50 border-green-500/30 text-slate-200 placeholder:text-slate-500 text-center font-mono text-lg h-12 tracking-widest"
                    maxLength={6}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">اسمك</label>
                  <Input
                    value={joinName}
                    onChange={(e) => { setJoinName(e.target.value); setJoinError(''); }}
                    placeholder="اسمك في المعركة..."
                    className="bg-slate-800/50 border-green-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12"
                    dir="rtl"
                    maxLength={20}
                  />
                </div>

                {joinError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center">
                    ⚠️ {joinError}
                  </motion.p>
                )}

                <Button
                  onClick={handleJoin}
                  className="w-full bg-gradient-to-l from-green-600 to-emerald-800 hover:from-green-500 hover:to-emerald-700 text-white font-bold text-base sm:text-lg py-5 sm:py-6 transition-all duration-300 pulse-glow-blue"
                >
                  <Users className="w-5 h-5 ml-2" />
                  انضم للمشاهدة
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================================
// Diwaniya Setup (quick setup for host)
// ============================================================
function DiwaniyaSetup({ onBack }: { onBack: () => void }) {
  const { setTeamNames, redName, blueName, setScores, redScore, blueScore, startGame } = useTobolStore();

  return (
    <div className="flex flex-col items-center py-6 sm:py-8 px-3 sm:px-4 tobol-bg" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm sm:max-w-md mx-auto"
      >
        <Card className="bg-gradient-to-bl from-blue-950/40 via-slate-900/80 to-slate-900/80 border-blue-500/30">
          <CardContent className="pt-5 sm:pt-6">
            <div className="text-center mb-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="text-4xl mb-2">
                🏠
              </motion.div>
              <h2 className="text-lg sm:text-xl font-bold text-blue-300">إعداد غرفة الديوانية</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-1">سمّ الفرق وجهّز النقاط</p>
            </div>

            <div className="space-y-4">
              {/* Red Team */}
              <div>
                <label className="text-xs text-red-400 mb-1 block font-bold">🔴 الفريق الأحمر</label>
                <Input
                  value={redName}
                  onChange={(e) => setTeamNames(e.target.value, blueName)}
                  className="bg-red-950/30 border-red-500/30 text-red-200 h-12"
                  dir="rtl"
                  maxLength={20}
                />
              </div>

              {/* Blue Team */}
              <div>
                <label className="text-xs text-blue-400 mb-1 block font-bold">🔵 الفريق الأزرق</label>
                <Input
                  value={blueName}
                  onChange={(e) => setTeamNames(redName, e.target.value)}
                  className="bg-blue-950/30 border-blue-500/30 text-blue-200 h-12"
                  dir="rtl"
                  maxLength={20}
                />
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-red-400 mb-1 block font-bold">نقاط الأحمر</label>
                  <Input
                    type="number"
                    value={redScore}
                    onChange={(e) => setScores(parseInt(e.target.value) || 0, blueScore)}
                    className="bg-red-950/30 border-red-500/30 text-red-200 h-12 text-center"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs text-blue-400 mb-1 block font-bold">نقاط الأزرق</label>
                  <Input
                    type="number"
                    value={blueScore}
                    onChange={(e) => setScores(redScore, parseInt(e.target.value) || 0)}
                    className="bg-blue-950/30 border-blue-500/30 text-blue-200 h-12 text-center"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-4 text-sm"
              >
                رجوع
              </Button>
              <Button
                onClick={() => startGame()}
                className="flex-1 bg-gradient-to-l from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white font-bold text-base py-5 pulse-glow-blue"
              >
                🥁 ابدأ المعركة
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================
// Diwaniya TopBar with Room Code + Spectators
// ============================================================
function DiwaniyaTopBar() {
  const { phase, resetGame, roomCode } = useTobolStore();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSpectators, setShowSpectators] = useState(false);
  const [spectators, setSpectators] = useState<SpectatorInfo[]>([]);
  const isGameOver = phase === 'game_over';

  // Poll spectators list
  const pollSpectators = useCallback(async () => {
    if (!roomCode || isGameOver) return;
    try {
      const res = await fetch(`/api/tobol-room/${roomCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.room?.spectators) {
          setSpectators(data.room.spectators);
        }
      }
    } catch { /* silent */ }
  }, [roomCode, isGameOver]);

  useEffect(() => {
    if (!roomCode) return;
    pollSpectators();
    const interval = setInterval(pollSpectators, 3000);
    return () => clearInterval(interval);
  }, [roomCode, pollSpectators]);

  const handleExit = () => {
    setLeaving(true);
    setTimeout(() => {
      resetGame();
      setLeaving(false);
      setShowExitDialog(false);
    }, 300);
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const specCount = spectators.length;

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          <Button
            onClick={() => setShowExitDialog(true)}
            variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Button>

          {/* Center: Room code + Spectators */}
          {!isGameOver && roomCode && (
            <div className="flex items-center gap-2">
              {/* Spectators button */}
              <button
                onClick={() => setShowSpectators(true)}
                className="flex items-center gap-1 bg-green-950/40 border border-green-500/30 rounded-lg px-2 py-1 cursor-pointer hover:border-green-400/50 transition-colors relative"
              >
                <Eye className="w-3.5 h-3.5 text-green-400" />
                {specCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[10px] font-bold text-green-300"
                  >
                    {specCount}
                  </motion.span>
                )}
              </button>

              {/* Room code */}
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 bg-gradient-to-l from-blue-950/50 to-purple-950/40 border border-blue-500/30 rounded-lg px-2.5 py-1 cursor-pointer hover:border-blue-400/50 transition-colors"
              >
                <span className="text-[10px] sm:text-xs font-bold text-blue-300">كود:</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wider">{roomCode}</span>
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-blue-400" />}
              </button>
            </div>
          )}

          {isGameOver && (
            <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5 border-yellow-500/50 text-yellow-300">
              🏁 انتهت المعركة
            </Badge>
          )}

          {!isGameOver && (
            <div className="relative">
              {!showResetConfirm ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </motion.button>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
                  <span className="text-[10px] text-red-400 font-bold">مؤكد؟</span>
                  <button onClick={handleReset} className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold">نعم</button>
                  <button onClick={() => setShowResetConfirm(false)} className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-bold">لا</button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Room Code Banner */}
      {!isGameOver && roomCode && (
        <div className="bg-gradient-to-l from-red-900/50 to-blue-900/50 border-b border-slate-700/30 py-3 px-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-300 mb-0.5">📺 شارك هذا الكود مع المشاهدين:</p>
                <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-[0.3em]">{roomCode}</p>
              </div>
              <button
                onClick={copyCode}
                className="text-xs bg-blue-800/50 text-blue-200 px-3 py-2 rounded-lg hover:bg-blue-700/50 transition-colors flex items-center gap-1"
              >
                {copied ? <><Check className="w-4 h-4" /> <span>تم!</span></> : <><Copy className="w-4 h-4" /> <span>نسخ</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* Spectators Modal                  */}
      {/* ================================ */}
      <AnimatePresence>
        {showSpectators && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowSpectators(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">👁️</div>
                <h3 className="text-lg font-bold text-slate-200">
                  المشاهدون ({specCount})
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  {specCount === 0
                    ? 'لا يوجد مشاهدين حالياً'
                    : `${specCount} مشاهد يتفرج على المعركة`}
                </p>
              </div>

              {spectators.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3 opacity-30">👥</div>
                  <p className="text-slate-500 text-sm">بانتظار المشاهدين...</p>
                  <p className="text-slate-600 text-[10px] mt-1">شارك كود الغرفة لينضم المشاهدون</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto tobol-scrollbar">
                  {spectators.map((spec, i) => (
                    <motion.div
                      key={spec.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/30 rounded-xl p-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{spec.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{spec.name}</p>
                        <p className="text-[9px] text-slate-500">
                          انضم منذ {Math.round((Date.now() - spec.joinedAt) / 60000)} دقيقة
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    </motion.div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowSpectators(false)}
                className="w-full mt-4 text-xs text-slate-400 hover:text-slate-300 py-2 transition-colors"
              >
                إغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowExitDialog(false)}
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
                <h3 className="text-lg font-bold text-slate-200 mb-2">الخروج من الديوانية؟</h3>
                <p className="text-sm text-slate-400 mb-6">سيتم إنهاء الجلسة وسيخرج جميع المشاهدين.</p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowExitDialog(false)} variant="outline" disabled={leaving} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11">إلغاء</Button>
                  <Button onClick={handleExit} disabled={leaving} className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-11">
                    {leaving ? 'جاري الخروج...' : 'نعم، اخرج'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// DiwaniyaHeader
// ============================================================
function DiwaniyaHeader() {
  return (
    <div className="w-full border-b border-slate-800/30 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <img
              src="/platform-logo.png"
              alt="ألعاب الغريب"
              className="w-7 h-7 rounded-lg object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = "<span class='text-white text-sm font-black'>غ</span>";
              }}
            />
          </div>
          <h1 className="text-base sm:text-lg font-black bg-gradient-to-l from-blue-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </h1>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-bold text-slate-400">
            🏠 الديوانية
          </span>
          <a href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DiwaniyaFooter
// ============================================================
function DiwaniyaFooter() {
  return (
    <div className="w-full border-t border-slate-800/30 bg-slate-950/60 mt-auto">
      <div className="flex flex-col items-center gap-0.5 py-2 px-3">
        <span className="text-[10px] text-slate-600">ألعاب الغريب — الديوانية</span>
        <span className="text-[9px] text-slate-700">شاهد المعركة مباشرة ⚔️</span>
      </div>
    </div>
  );
}

// ============================================================
// Spectator View — read-only game board
// ============================================================
function SpectatorView({ roomCode, spectatorName }: { roomCode: string; spectatorName: string }) {
  const { phase, redName, blueName, redScore, blueScore, currentTurn, clickedBtns, lastAction, battleLog, modalData, mainBgId } = useTobolStore();

  return (
    <div className="flex flex-col min-h-screen tobol-bg">
      <div className="sticky top-0 z-50 border-b border-green-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold text-green-300">{spectatorName}</span>
          </div>
          <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5 border-green-500/50 text-green-300">
            👁️ مشاهد
          </Badge>
        </div>
      </div>
      <main className="flex-1">
        <GameBoard />
      </main>
      <DiwaniyaFooter />
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function DiwaniyaPage() {
  const { phase, setPhase, resetGame, setGameMode, startGame } = useTobolStore();
  const mounted = useHydrated();
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [spectatorName, setSpectatorName] = useState('');
  const [spectatorCode, setSpectatorCode] = useState('');

  // Always ensure diwaniya mode
  useEffect(() => {
    if (mounted) {
      setGameMode('diwaniya');
    }
  }, [mounted, setGameMode]);

  const handleHost = useCallback(() => {
    setGameMode('diwaniya');
    setPhase('setup');
  }, [setPhase, setGameMode]);

  const handleJoin = useCallback((code: string, name: string) => {
    // Redirect to Tobol spectator join page
    window.location.href = `/join/tobol/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`;
  }, []);

  const handleBackToLanding = useCallback(() => {
    resetGame();
    setSpectatorMode(false);
  }, [resetGame]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
        <DiwaniyaFooter />
      </div>
    );
  }

  // Spectator mode
  if (spectatorMode) {
    return <SpectatorView roomCode={spectatorCode} spectatorName={spectatorName} />;
  }

  // Landing page
  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col tobol-bg">
        <DiwaniyaHeader />
        <main className="flex-1">
          <DiwaniyaLanding onHost={handleHost} onJoin={handleJoin} />
        </main>
        <DiwaniyaFooter />
      </div>
    );
  }

  // Setup page
  if (phase === 'setup') {
    return (
      <div className="min-h-screen flex flex-col tobol-bg">
        <DiwaniyaHeader />
        <main className="flex-1">
          <DiwaniyaSetup onBack={handleBackToLanding} />
        </main>
        <DiwaniyaFooter />
      </div>
    );
  }

  // Playing / Game Over
  return (
    <div className="flex flex-col min-h-screen tobol-bg">
      <DiwaniyaTopBar />
      <main className="flex-1">
        {phase === 'playing' && <GameBoard />}
        {phase === 'game_over' && <TobolGameOver />}
      </main>
      <DiwaniyaFooter />
    </div>
  );
}
