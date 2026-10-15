'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Types matching BaharHarbRoomState from server
// ============================================================
interface BaharHarbQuestion {
  id: number;
  clues: [string, string];
  answers: [string, string];
}

interface BaharHarbRoomData {
  code: string;
  hostName: string;
  phase: string;
  gameMode: string;
  playMode: 'teams' | 'individuals';
  team1Name: string;
  team2Name: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: BaharHarbQuestion[];
  team1Score: number;
  team2Score: number;
  showClue1: boolean;
  showClue2: boolean;
  showAnswer1: boolean;
  showAnswer2: boolean;
  battleLog: Array<{ id: number; team: 1 | 2; message: string }>;
  logCounter: number;
  spectators: Array<{ id: string; name: string; joinedAt: number; lastSeen: number }>;
}

interface BaharHarbSpectatorViewProps {
  roomCode: string;
}

// ============================================================
// Confetti for game over
// ============================================================
function Confetti() {
  const colors = ['#22d3ee', '#0ea5e9', '#14b8a6', '#f97316', '#eab308', '#a855f7'];
  const particles = Array.from({ length: 36 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    size: 4 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Waiting for game state
// ============================================================
function WaitingForGame({ roomCode }: { roomCode: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      dir="rtl"
      style={{
        background:
          'linear-gradient(180deg, #04141a 0%, #0a1d24 100%)',
        color: '#cbd5e1',
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-7xl mb-6"
      >
        🌊
      </motion.div>
      <h2 className="text-2xl font-black text-cyan-300 mb-2">في انتظار اللعبة</h2>
      <p className="text-sm text-slate-500 mb-1">
        كود الغرفة: <span className="font-mono text-white">{roomCode}</span>
      </p>
      <p className="text-xs text-slate-600">المستضيف يجهز البحر والحرب... ستظهر الأسئلة تلقائياً</p>
    </div>
  );
}

// ============================================================
// Game Over Overlay
// ============================================================
function GameOverScreen({ room }: { room: BaharHarbRoomData }) {
  const winner =
    room.team1Score > room.team2Score
      ? 1
      : room.team2Score > room.team1Score
      ? 2
      : 0; // draw
  const winnerName =
    winner === 1 ? room.team1Name : winner === 2 ? room.team2Name : 'تعادل!';
  const scoreDiff = Math.abs(room.team1Score - room.team2Score);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #04141a 0%, #0a1d24 100%)' }}
    >
      {winner !== 0 && <Confetti />}
      <div className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-center mb-6"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl sm:text-8xl mb-3"
          >
            {winner === 0 ? '🤝' : '🏆'}
          </motion.div>
          <h1
            className={`text-3xl sm:text-4xl font-black mb-2 ${
              winner === 1
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300'
                : winner === 2
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200'
            }`}
          >
            {winner === 0 ? 'تعادل! 🤝' : `${winnerName} فاز! 🎉`}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {winner === 0
              ? 'الفريقان متعادلان بالنقاط'
              : `فاز بفارق ${scoreDiff} نقطة`}
          </p>
        </motion.div>

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`text-center flex-1 ${winner === 1 ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-xs text-slate-400 mb-1">{room.team1Name}</p>
              <p className={`text-3xl font-black ${winner === 1 ? 'text-cyan-400' : 'text-slate-400'}`}>
                {room.team1Score}
              </p>
            </div>
            <div className="text-slate-600 text-sm font-bold mx-2">VS</div>
            <div className={`text-center flex-1 ${winner === 2 ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-xs text-slate-400 mb-1">{room.team2Name}</p>
              <p className={`text-3xl font-black ${winner === 2 ? 'text-orange-400' : 'text-slate-400'}`}>
                {room.team2Score}
              </p>
            </div>
          </div>
          {room.team1Score + room.team2Score > 0 && (
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800">
              <motion.div
                initial={{ width: '50%' }}
                animate={{ width: `${(room.team1Score / (room.team1Score + room.team2Score)) * 100}%` }}
                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-l from-cyan-500 to-teal-700"
              />
              <motion.div
                initial={{ width: '50%' }}
                animate={{ width: `${(room.team2Score / (room.team1Score + room.team2Score)) * 100}%` }}
                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-r from-orange-500 to-amber-700"
              />
            </div>
          )}
        </div>

        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 mb-4 text-center">
          <p className="text-amber-300 text-xs font-bold mb-1">🚩 انتهت الجلسة</p>
          <p className="text-slate-400 text-[10px]">إذا بدأ المستضيف جولة جديدة، ستحتاج كود الغرفة الجديد</p>
        </div>

        <a
          href="/baharharb"
          className="block w-full text-center bg-gradient-to-l from-cyan-600 to-teal-800 hover:from-cyan-500 hover:to-teal-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all"
        >
          🔗 أدخل كود جديد
        </a>
      </div>
    </div>
  );
}

// ============================================================
// Battle Log Panel
// ============================================================
function BattleLogPanel({ battleLog }: { battleLog: BaharHarbRoomData['battleLog'] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700/80 transition-all cursor-pointer"
      >
        <span>📜 سجل المعركة ({battleLog.length})</span>
        <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-1 max-h-[40vh] overflow-y-auto bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1">
          {battleLog.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4">لا أحداث بعد...</p>
          ) : (
            battleLog.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg ${
                  entry.team === 1
                    ? 'bg-cyan-950/30 text-cyan-300'
                    : 'bg-orange-950/30 text-orange-300'
                }`}
              >
                <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
                <span className="flex-1">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main BaharHarbSpectatorView
// ============================================================
export default function BaharHarbSpectatorView({ roomCode }: BaharHarbSpectatorViewProps) {
  const [room, setRoom] = useState<BaharHarbRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollFailCount = useRef(0);

  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/baharharb-room/${roomCode}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('الغرفة غير موجودة أو انتهت صلاحيتها');
        } else {
          setError('خطأ في جلب البيانات');
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data?.success && data?.room) {
        setRoom(data.room);
        setLoading(false);
        setError('');
        pollFailCount.current = 0;
      } else {
        pollFailCount.current += 1;
        if (pollFailCount.current > 5) {
          setError('تعذر تحميل بيانات الغرفة');
          setLoading(false);
        }
      }
    } catch {
      pollFailCount.current += 1;
      if (pollFailCount.current > 5) {
        setError('تعذر الاتصال بالخادم');
        setLoading(false);
      }
    }
  }, [roomCode]);

  useEffect(() => {
    pollRoom();
    const interval = setInterval(pollRoom, 2000);
    return () => clearInterval(interval);
  }, [pollRoom]);

  if (loading) {
    return <WaitingForGame roomCode={roomCode} />;
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        dir="rtl"
        style={{ background: 'linear-gradient(180deg, #04141a 0%, #0a1d24 100%)' }}
      >
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💔</div>
          <p className="text-red-400 text-lg font-bold mb-2">{error}</p>
          {roomCode && (
            <p className="text-slate-500 text-xs mb-4">
              كود: <span className="font-mono text-white">{roomCode}</span>
            </p>
          )}
          <a
            href="/baharharb"
            className="inline-block text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    );
  }

  if (!room) {
    return <WaitingForGame roomCode={roomCode} />;
  }

  // Game over screen
  if (room.phase === 'game_over') {
    return <GameOverScreen room={room} />;
  }

  const question = room.questions?.[room.currentQuestionIndex];
  const totalQ = room.totalQuestions || room.questions?.length || 0;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #04141a 0%, #0a1d24 100%)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-cyan-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌊</span>
            <div>
              <p className="text-xs font-bold text-cyan-300">بحر و حرب</p>
              <p className="text-[9px] text-slate-500">👁 مشاهد • غرفة {roomCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              سؤال {room.currentQuestionIndex + 1}
              {totalQ > 0 ? ` / ${totalQ}` : ''}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-md mx-auto w-full p-3">
        {/* Scores */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <motion.div
            animate={{ scale: 1 }}
            className="rounded-xl p-3 text-center bg-cyan-950/30 border border-cyan-500/40"
          >
            <p className="text-[10px] text-slate-400 mb-1">{room.team1Name}</p>
            <p className="text-3xl font-black text-cyan-400">{room.team1Score}</p>
          </motion.div>
          <motion.div
            animate={{ scale: 1 }}
            className="rounded-xl p-3 text-center bg-orange-950/30 border border-orange-500/40"
          >
            <p className="text-[10px] text-slate-400 mb-1">{room.team2Name}</p>
            <p className="text-3xl font-black text-orange-400">{room.team2Score}</p>
          </motion.div>
        </div>

        {/* Current question */}
        {question ? (
          <motion.div
            key={`${question.id}-${room.currentQuestionIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 mb-3"
          >
            <p className="text-[10px] text-slate-500 mb-3 text-center">
              السؤال {room.currentQuestionIndex + 1}
            </p>

            {/* Pair 1 */}
            <div className="space-y-2 mb-3">
              <div
                className={`rounded-lg p-2.5 border text-center transition-all ${
                  room.showClue1
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <p className="text-[9px] text-slate-500 mb-0.5">💡 الدليل ١</p>
                <p className="text-sm font-bold">
                  {room.showClue1 ? question.clues[0] : '•••'}
                </p>
              </div>
              <div
                className={`rounded-lg p-2.5 border text-center transition-all ${
                  room.showAnswer1
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <p className="text-[9px] text-slate-500 mb-0.5">✅ الإجابة ١</p>
                <p className="text-sm font-bold">
                  {room.showAnswer1 ? question.answers[0] : '•••'}
                </p>
              </div>
            </div>

            {/* Pair 2 */}
            <div className="space-y-2">
              <div
                className={`rounded-lg p-2.5 border text-center transition-all ${
                  room.showClue2
                    ? 'bg-orange-950/40 border-orange-500/50 text-orange-200'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <p className="text-[9px] text-slate-500 mb-0.5">💡 الدليل ٢</p>
                <p className="text-sm font-bold">
                  {room.showClue2 ? question.clues[1] : '•••'}
                </p>
              </div>
              <div
                className={`rounded-lg p-2.5 border text-center transition-all ${
                  room.showAnswer2
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <p className="text-[9px] text-slate-500 mb-0.5">✅ الإجابة ٢</p>
                <p className="text-sm font-bold">
                  {room.showAnswer2 ? question.answers[1] : '•••'}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 text-center mb-3">
            <p className="text-slate-400 text-sm">في انتظار أول سؤال...</p>
          </div>
        )}

        {/* Spectators count */}
        <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-2 mb-2 text-center">
          <p className="text-[10px] text-slate-500">
            👁 {room.spectators?.length || 0} مشاهد
          </p>
        </div>

        {/* Battle log */}
        <BattleLogPanel battleLog={room.battleLog || []} />

        {/* Spectator notice */}
        <div className="mt-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/40 text-center">
          <p className="text-[10px] text-slate-500">
            👁 أنت تشاهد فقط — لا يمكن التدخل في اللعبة
          </p>
        </div>
      </main>
    </div>
  );
}
