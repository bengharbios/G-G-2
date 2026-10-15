'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Question, Answer } from '@/lib/familyfeud-questions';

// ============================================================
// Types matching FamilyFeudRoomState from server
// ============================================================
interface FamilyFeudRoomData {
  code: string;
  hostName: string;
  phase: string;
  gameMode: string;
  uiPhase: string;
  gamePhase: string;
  showGameOver: boolean;

  team1Name: string;
  team2Name: string;
  team1Emoji: string;
  team2Emoji: string;
  team1Score: number;
  team2Score: number;
  currentTeam: 1 | 2;
  strikes: number;
  round: number;
  totalRounds: number;

  selectedQuestions: Question[];
  currentAnswers: Answer[];
  roundScore: number;

  fmQuestions: Question[];
  fmAnswers1: string[];
  fmAnswers2: string[];
  fmRevealed1: boolean[];
  fmRevealed2: boolean[];
  fmScore1: number;
  fmScore2: number;
  fmPhase: string;

  roundHistory: Array<{ round: number; team: 1 | 2; points: number; type: string }>;
  gameStats: {
    team1Correct: number;
    team2Correct: number;
    team1Strikes: number;
    team2Strikes: number;
    totalSteals: number;
    successfulSteals: number;
    fastMoneyScore1: number;
    fastMoneyScore2: number;
  };
  spectators: Array<{ id: string; name: string; joinedAt: number; lastSeen: number }>;
}

interface FamilyFeudSpectatorViewProps {
  roomCode: string;
}

// ============================================================
// Confetti for game over
// ============================================================
function Confetti() {
  const colors = ['#fbbf24', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4'];
  const particles = Array.from({ length: 40 }).map((_, i) => ({
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
      style={{ background: 'linear-gradient(180deg, #1a1342 0%, #0d0828 100%)' }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-7xl mb-6"
      >
        📺
      </motion.div>
      <h2 className="text-2xl font-black text-amber-300 mb-2">في انتظار اللعبة</h2>
      <p className="text-sm text-slate-400 mb-1">
        كود الغرفة: <span className="font-mono text-white">{roomCode}</span>
      </p>
      <p className="text-xs text-slate-500">المستضيف يجهز الأسئلة... ستظهر الجولة تلقائياً</p>
    </div>
  );
}

// ============================================================
// Game Over Overlay
// ============================================================
function GameOverScreen({ room }: { room: FamilyFeudRoomData }) {
  const winner =
    room.team1Score > room.team2Score
      ? 1
      : room.team2Score > room.team1Score
      ? 2
      : 0;
  const winnerName =
    winner === 1 ? room.team1Name : winner === 2 ? room.team2Name : 'تعادل!';
  const scoreDiff = Math.abs(room.team1Score - room.team2Score);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #1a1342 0%, #0d0828 100%)' }}
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
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300'
                : winner === 2
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-200'
            }`}
          >
            {winner === 0 ? 'تعادل! 🤝' : `${winnerName} فاز! 🎉`}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {winner === 0 ? 'الفريقان متعادلان بالنقاط' : `فاز بفارق ${scoreDiff} نقطة`}
          </p>
        </motion.div>

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`text-center flex-1 ${winner === 1 ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-3xl mb-1">{room.team1Emoji}</p>
              <p className="text-xs text-slate-400 mb-1">{room.team1Name}</p>
              <p className={`text-3xl font-black ${winner === 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                {room.team1Score}
              </p>
            </div>
            <div className="text-slate-600 text-sm font-bold mx-2">VS</div>
            <div className={`text-center flex-1 ${winner === 2 ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-3xl mb-1">{room.team2Emoji}</p>
              <p className="text-xs text-slate-400 mb-1">{room.team2Name}</p>
              <p className={`text-3xl font-black ${winner === 2 ? 'text-purple-400' : 'text-slate-400'}`}>
                {room.team2Score}
              </p>
            </div>
          </div>
        </div>

        <a
          href="/familyfeud"
          className="block w-full text-center bg-gradient-to-l from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white font-bold text-sm py-3.5 rounded-xl transition-all"
        >
          🔗 أدخل كود جديد
        </a>
      </div>
    </div>
  );
}

// ============================================================
// Main FamilyFeudSpectatorView
// ============================================================
export default function FamilyFeudSpectatorView({ roomCode }: FamilyFeudSpectatorViewProps) {
  const [room, setRoom] = useState<FamilyFeudRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollFailCount = useRef(0);

  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/familyfeud-room/${roomCode}`);
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
        style={{ background: 'linear-gradient(180deg, #1a1342 0%, #0d0828 100%)' }}
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
            href="/familyfeud"
            className="inline-block text-sm text-amber-400 hover:text-amber-300 underline"
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
  if (room.showGameOver || room.gamePhase === 'game_over') {
    return <GameOverScreen room={room} />;
  }

  const currentQuestion = room.selectedQuestions?.[room.round - 1];
  const isFastMoney = room.gamePhase === 'fast_money';

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #1a1342 0%, #0d0828 100%)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-amber-800/40 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📺</span>
            <div>
              <p className="text-xs font-bold text-amber-300">فاميلي فيود</p>
              <p className="text-[9px] text-slate-500">👁 مشاهد • غرفة {roomCode}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {isFastMoney
              ? 'الجولة الختامية'
              : `الجولة ${room.round}${room.totalRounds ? `/${room.totalRounds}` : ''}`}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-md mx-auto w-full p-3">
        {/* Scores */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <motion.div
            animate={{ scale: room.currentTeam === 1 ? 1.02 : 1 }}
            className={`rounded-xl p-3 text-center transition-all ${
              room.currentTeam === 1
                ? 'bg-amber-950/40 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800/50 border border-slate-700/50'
            }`}
          >
            <p className="text-3xl mb-1">{room.team1Emoji}</p>
            <p className="text-[10px] text-slate-400 mb-1 truncate">{room.team1Name}</p>
            <p className={`text-3xl font-black ${room.currentTeam === 1 ? 'text-amber-400' : 'text-slate-300'}`}>
              {room.team1Score}
            </p>
          </motion.div>
          <motion.div
            animate={{ scale: room.currentTeam === 2 ? 1.02 : 1 }}
            className={`rounded-xl p-3 text-center transition-all ${
              room.currentTeam === 2
                ? 'bg-purple-950/40 border-2 border-purple-500/50 shadow-lg shadow-purple-500/10'
                : 'bg-slate-800/50 border border-slate-700/50'
            }`}
          >
            <p className="text-3xl mb-1">{room.team2Emoji}</p>
            <p className="text-[10px] text-slate-400 mb-1 truncate">{room.team2Name}</p>
            <p className={`text-3xl font-black ${room.currentTeam === 2 ? 'text-purple-400' : 'text-slate-300'}`}>
              {room.team2Score}
            </p>
          </motion.div>
        </div>

        {/* Fast Money View */}
        {isFastMoney ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-amber-500/40 rounded-2xl p-4 mb-3"
          >
            <p className="text-center text-amber-300 text-sm font-bold mb-3">
              💰 الجولة الختامية
            </p>
            <p className="text-center text-slate-400 text-xs mb-3">
              نقاط: <span className="text-amber-300 font-bold">{room.fmScore1}</span> —{' '}
              <span className="text-purple-300 font-bold">{room.fmScore2}</span>
            </p>
            {room.fmQuestions?.length > 0 && (
              <div className="space-y-2">
                {room.fmQuestions.slice(0, 5).map((q, i) => {
                  const ans1 = room.fmAnswers1?.[i] || '';
                  const ans2 = room.fmAnswers2?.[i] || '';
                  const rev1 = room.fmRevealed1?.[i] || false;
                  const rev2 = room.fmRevealed2?.[i] || false;
                  return (
                    <div key={i} className="bg-slate-800/40 rounded-lg p-2.5">
                      <p className="text-xs text-slate-300 mb-1.5">
                        {i + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div
                          className={`text-[10px] px-2 py-1 rounded border text-center ${
                            rev1
                              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                              : 'bg-slate-900/40 border-slate-700/40 text-slate-500'
                          }`}
                        >
                          {rev1 ? ans1 || '—' : 'مخفي'}
                        </div>
                        <div
                          className={`text-[10px] px-2 py-1 rounded border text-center ${
                            rev2
                              ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                              : 'bg-slate-900/40 border-slate-700/40 text-slate-500'
                          }`}
                        >
                          {rev2 ? ans2 || '—' : 'مخفي'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : currentQuestion ? (
          <motion.div
            key={room.round}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 mb-3"
          >
            <p className="text-center text-amber-300 text-sm font-bold mb-3">
              {currentQuestion.question}
            </p>

            {/* Answers board */}
            <div className="space-y-1.5">
              {currentQuestion.answers.map((ans, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                    ans.revealed
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-700/60 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold">
                      {ans.revealed ? ans.text : '•••'}
                    </span>
                  </div>
                  {ans.revealed && (
                    <span className="text-amber-300 font-black text-sm">
                      {ans.points}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Strikes */}
            {room.strikes > 0 && (
              <div className="mt-3 text-center">
                <p className="text-red-400 text-xl font-bold">
                  {'✗'.repeat(Math.min(room.strikes, 3))}
                </p>
              </div>
            )}

            {/* Round score */}
            <div className="mt-3 text-center text-xs text-slate-400">
              نقاط الجولة: <span className="text-amber-300 font-bold">{room.roundScore}</span>
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
