'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Player, GamePhase, EliminationEvent, GameLogEntry } from '@/lib/game-types';

// ============================================================
// Types matching MafiaRoomState from server
// ============================================================
interface MafiaRoomData {
  code: string;
  hostName: string;
  gameMode: 'godfather' | 'diwaniya' | null;
  players: Player[];
  phase: GamePhase;
  round: number;
  eliminatedPlayers: EliminationEvent[];
  revealedCards: Record<string, string>;
  gameWinner: 'mafia' | 'citizen' | null;
  gameLog: GameLogEntry[];
  dayResults: {
    killedByMafia: Player | null;
    killedBySniper: Player | null;
    sniperSelfKilled: Player | null;
    medicSaved: boolean;
    silencedPlayer: Player | null;
    voteEliminated: Player | null;
    voteEvent: EliminationEvent | null;
    voteResults: Record<string, number>;
  } | null;
  nightEvents: EliminationEvent[];
  spectators: Array<{ id: string; name: string; joinedAt: number; lastSeen: number }>;
}

interface MafiaSpectatorViewProps {
  roomCode: string;
}

// ============================================================
// Confetti for game over
// ============================================================
function Confetti() {
  const colors = ['#dc2626', '#7c2d12', '#000000', '#fbbf24', '#f97316', '#a855f7'];
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
      style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-7xl mb-6"
      >
        🎩
      </motion.div>
      <h2 className="text-2xl font-black text-red-400 mb-2">في انتظار اللعبة</h2>
      <p className="text-sm text-slate-400 mb-1">
        كود الغرفة: <span className="font-mono text-white">{roomCode}</span>
      </p>
      <p className="text-xs text-slate-500">المستضيف يجهز المافيا... ستظهر الأحداث تلقائياً</p>
    </div>
  );
}

// ============================================================
// Phase banner
// ============================================================
function phaseLabel(phase: GamePhase, round: number): { label: string; emoji: string; color: string } {
  if (phase === 'game_over') return { label: 'انتهت اللعبة', emoji: '🏆', color: 'amber' };
  if (phase === 'setup' || phase === 'card_distribution') return { label: 'توزيع البطاقات', emoji: '🎴', color: 'purple' };
  if (phase.startsWith('night')) return { label: `ليلي — جولة ${round}`, emoji: '🌙', color: 'indigo' };
  if (phase.startsWith('day_announcements')) return { label: `إعلانات النهار`, emoji: '☀️', color: 'amber' };
  if (phase.startsWith('day_mayor_reveal')) return { label: `إعلان العمدة`, emoji: '👑', color: 'amber' };
  if (phase.startsWith('day_discussion')) return { label: `نقاش النهار`, emoji: '💬', color: 'cyan' };
  if (phase.startsWith('day_voting')) return { label: `التصويت`, emoji: '🗳️', color: 'rose' };
  if (phase.startsWith('day_elimination')) return { label: `إقصاء`, emoji: '☠️', color: 'red' };
  if (phase === 'good_son_revenge') return { label: `انتقام الولد الصالح`, emoji: '😇', color: 'emerald' };
  return { label: phase, emoji: '🎭', color: 'slate' };
}

function colorClass(color: string): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-950/40 border-amber-500/40 text-amber-200';
    case 'purple':
      return 'bg-purple-950/40 border-purple-500/40 text-purple-200';
    case 'indigo':
      return 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200';
    case 'cyan':
      return 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200';
    case 'rose':
      return 'bg-rose-950/40 border-rose-500/40 text-rose-200';
    case 'red':
      return 'bg-red-950/40 border-red-500/40 text-red-200';
    case 'emerald':
      return 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200';
    default:
      return 'bg-slate-800/40 border-slate-700/40 text-slate-300';
  }
}

// ============================================================
// Game Over Overlay
// ============================================================
function GameOverScreen({ room }: { room: MafiaRoomData }) {
  const winner = room.gameWinner;
  const winnerLabel = winner === 'mafia' ? 'المافيا فازت! 🎩' : winner === 'citizen' ? 'المدنيون فازوا! 🛡️' : 'اللعبة انتهت';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
    >
      {winner && <Confetti />}
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
            {winner === 'mafia' ? '🎩' : winner === 'citizen' ? '🛡️' : '🎭'}
          </motion.div>
          <h1
            className={`text-3xl sm:text-4xl font-black mb-2 ${
              winner === 'mafia'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600'
                : winner === 'citizen'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300'
                : 'text-slate-300'
            }`}
          >
            {winnerLabel}
          </h1>
        </motion.div>

        {/* Players summary */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 mb-4">
          <p className="text-xs text-slate-400 mb-3 text-center">اللاعبون وأدوارهم</p>
          <div className="grid grid-cols-2 gap-1.5">
            {room.players.map((p) => {
              const elim = room.eliminatedPlayers.find((e) => e.playerId === p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 bg-slate-800/40 rounded-lg p-1.5"
                >
                  <span className="text-sm">{p.isAlive ? '🟢' : '💀'}</span>
                  <span className="text-[11px] text-slate-200 flex-1 truncate">{p.name}</span>
                  <span className="text-[9px] text-slate-400">
                    {elim?.role || p.role || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <a
          href="/mafia"
          className="block w-full text-center bg-gradient-to-l from-red-700 to-rose-900 hover:from-red-600 hover:to-rose-800 text-white font-bold text-sm py-3.5 rounded-xl transition-all"
        >
          🔗 أدخل كود جديد
        </a>
      </div>
    </div>
  );
}

// ============================================================
// Player card
// ============================================================
function PlayerCard({ player, room }: { player: Player; room: MafiaRoomData }) {
  const elim = room.eliminatedPlayers.find((e) => e.playerId === player.id);
  const revealedRole = room.revealedCards[player.id] || elim?.role || null;

  return (
    <div
      className={`rounded-lg p-2 border text-center transition-all ${
        !player.isAlive
          ? 'bg-red-950/30 border-red-700/40 opacity-60'
          : player.isSilenced
          ? 'bg-slate-800/60 border-slate-600/50'
          : 'bg-slate-800/40 border-slate-700/40'
      }`}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-base">
          {!player.isAlive ? '💀' : player.isSilenced ? '🔇' : '🟢'}
        </span>
        <span className="text-[11px] font-bold text-slate-200 truncate">{player.name}</span>
      </div>
      <div className="text-[9px] text-slate-500">
        {revealedRole ? (
          <span className="font-bold text-amber-300">{revealedRole}</span>
        ) : (
          <span className="text-slate-600">مخفي</span>
        )}
      </div>
      {player.hasRevealedMayor && (
        <div className="text-[9px] text-amber-400 mt-0.5">👑 عمدة</div>
      )}
    </div>
  );
}

// ============================================================
// Main MafiaSpectatorView
// ============================================================
export default function MafiaSpectatorView({ roomCode }: MafiaSpectatorViewProps) {
  const [room, setRoom] = useState<MafiaRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollFailCount = useRef(0);

  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/mafia-room/${roomCode}`);
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
        style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
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
            href="/mafia"
            className="inline-block text-sm text-red-400 hover:text-red-300 underline"
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

  if (room.phase === 'game_over' || room.gameWinner) {
    return <GameOverScreen room={room} />;
  }

  const phaseInfo = phaseLabel(room.phase, room.round);
  const aliveCount = room.players.filter((p) => p.isAlive).length;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-red-900/40 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎩</span>
            <div>
              <p className="text-xs font-bold text-red-300">المافيا</p>
              <p className="text-[9px] text-slate-500">👁 مشاهد • غرفة {roomCode}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            <span className="text-emerald-400">🟢 {aliveCount}</span> /{' '}
            <span className="text-red-400">💀 {room.players.length - aliveCount}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-md mx-auto w-full p-3">
        {/* Phase banner */}
        <motion.div
          key={room.phase}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-3 border text-center mb-3 ${colorClass(phaseInfo.color)}`}
        >
          <p className="text-2xl mb-1">{phaseInfo.emoji}</p>
          <p className="text-sm font-bold">{phaseInfo.label}</p>
        </motion.div>

        {/* Day results (if in day_announcements / day_discussion / later) */}
        {room.dayResults && (room.phase === 'day_announcements' || room.phase === 'day_mayor_reveal' || room.phase === 'day_discussion' || room.phase === 'day_voting' || room.phase === 'day_elimination') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 mb-3"
          >
            <p className="text-xs text-slate-400 mb-2 text-center">☀️ نتائج الليلة الماضية</p>
            <div className="space-y-1.5 text-[11px]">
              {room.dayResults.killedByMafia && (
                <div className="bg-red-950/40 border border-red-700/40 rounded p-2 flex items-center gap-2">
                  <span>☠️</span>
                  <span className="text-red-300 flex-1">
                    قتلت المافيا: <b>{room.dayResults.killedByMafia.name}</b>
                  </span>
                </div>
              )}
              {room.dayResults.killedBySniper && (
                <div className="bg-orange-950/40 border border-orange-700/40 rounded p-2 flex items-center gap-2">
                  <span>🎯</span>
                  <span className="text-orange-300 flex-1">
                    قنص القناص: <b>{room.dayResults.killedBySniper.name}</b>
                  </span>
                </div>
              )}
              {room.dayResults.sniperSelfKilled && (
                <div className="bg-orange-950/40 border border-orange-700/40 rounded p-2 flex items-center gap-2">
                  <span>🎯</span>
                  <span className="text-orange-300 flex-1">
                    أخطأ القناص ومات: <b>{room.dayResults.sniperSelfKilled.name}</b>
                  </span>
                </div>
              )}
              {room.dayResults.medicSaved && (
                <div className="bg-emerald-950/40 border border-emerald-700/40 rounded p-2 flex items-center gap-2">
                  <span>💉</span>
                  <span className="text-emerald-300 flex-1">أنقذ الطبيب هدف المافيا</span>
                </div>
              )}
              {room.dayResults.silencedPlayer && (
                <div className="bg-slate-800/60 border border-slate-600/50 rounded p-2 flex items-center gap-2">
                  <span>🔇</span>
                  <span className="text-slate-300 flex-1">
                    تم إسكات: <b>{room.dayResults.silencedPlayer.name}</b>
                  </span>
                </div>
              )}
              {!room.dayResults.killedByMafia && !room.dayResults.killedBySniper && !room.dayResults.sniperSelfKilled && !room.dayResults.medicSaved && !room.dayResults.silencedPlayer && (
                <p className="text-center text-slate-500 text-[10px]">ليلة هادئة</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Vote results (if in day_elimination) */}
        {room.dayResults?.voteResults && Object.keys(room.dayResults.voteResults).length > 0 && (room.phase === 'day_voting' || room.phase === 'day_elimination') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 mb-3"
          >
            <p className="text-xs text-slate-400 mb-2 text-center">🗳️ نتائج التصويت</p>
            <div className="space-y-1">
              {Object.entries(room.dayResults.voteResults).map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between bg-slate-800/40 rounded px-2 py-1"
                >
                  <span className="text-[11px] text-slate-200">{name}</span>
                  <span className="text-xs font-bold text-amber-300">{count} صوت</span>
                </div>
              ))}
            </div>
            {room.dayResults.voteEliminated && (
              <div className="mt-2 bg-red-950/40 border border-red-700/40 rounded p-2 text-center">
                <p className="text-[11px] text-red-300">
                  ☠️ تم إقصاء: <b>{room.dayResults.voteEliminated.name}</b> ({room.dayResults.voteEvent?.role})
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Players grid */}
        <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-3 mb-3">
          <p className="text-[10px] text-slate-500 mb-2 text-center">👥 اللاعبون</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {room.players.map((p) => (
              <PlayerCard key={p.id} player={p} room={room} />
            ))}
          </div>
        </div>

        {/* Game log */}
        {room.gameLog && room.gameLog.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-3 mb-3">
            <p className="text-[10px] text-slate-500 mb-2 text-center">📜 سجل اللعبة</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {[...room.gameLog].reverse().slice(0, 20).map((entry, i) => (
                <motion.div
                  key={`${entry.timestamp}-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] px-2 py-1.5 rounded-lg bg-slate-800/40 text-slate-300"
                >
                  <span className="text-slate-500 ml-1">R{entry.round}</span>
                  {entry.message}
                </motion.div>
              ))}
            </div>
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
