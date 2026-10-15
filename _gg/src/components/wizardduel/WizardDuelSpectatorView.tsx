'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player, Effect, Card } from '@/lib/wizardduel-types';

// ============================================================
// Room state fetched from server (matches WizardDuelRoomState)
// ============================================================
interface WizardDuelRoomData {
  code: string;
  hostName: string;
  phase: string;
  currentTurn: '0' | '1' | null;
  turnCount: number;
  movesThisTurn: number;
  lastAction: string | null;
  winner: '0' | '1' | null;
  players?: {
    0: Player;
    1: Player;
  };
  battleLog?: Array<{ id: number; playerName: string; message: string; cardName?: string; valueChange?: number }>;
}

// Confetti for game over
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, []);

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

// HP Bar
function HpBar({ player, isCurrent }: { player: Player; isCurrent: boolean }) {
  const pct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const color = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444';
  return (
    <div
      style={{
        width: '100%',
        height: '14px',
        background: 'rgba(0,0,0,.5)',
        borderRadius: '999px',
        overflow: 'hidden',
        border: `1px solid ${color}50`,
        position: 'relative',
        boxShadow: isCurrent ? `0 0 8px ${color}40` : 'none',
      }}
    >
      <motion.div
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ height: '100%', background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: '999px' }}
      />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '10px', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,.9)',
      }}>
        {player.hp} / {player.maxHp}
      </div>
    </div>
  );
}

function ActiveEffects({ effects }: { effects: Effect[] }) {
  if (!effects || effects.length === 0) return null;
  const effectLabels: Record<string, { label: string; color: string; icon: string }> = {
    poison: { label: 'سم', color: '#22c55e', icon: '☠️' },
    freeze: { label: 'مجمد', color: '#3b82f6', icon: '❄️' },
    aura: { label: 'هالة', color: '#a855f7', icon: '🌀' },
    buffAtk: { label: 'تضاعف ضرر', color: '#ef4444', icon: '⚔️' },
    buffDef: { label: 'دفاع', color: '#22c55e', icon: '🛡️' },
    debuffAtk: { label: 'إضعاف', color: '#f59e0b', icon: '⬇️' },
    debuffDef: { label: 'لعنة', color: '#f59e0b', icon: '⬇️' },
    preventDmg: { label: 'درع', color: '#3b82f6', icon: '🛡️' },
    resurrect: { label: 'إحياء', color: '#22c55e', icon: '♻️' },
    counterAttack: { label: 'كمين', color: '#a855f7', icon: '🎯' },
    doubleDmg: { label: 'ضرر مضاعف', color: '#ef4444', icon: '⚡' },
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px', justifyContent: 'center' }}>
      {effects.map((e, i) => {
        const meta = effectLabels[e.type] || { label: e.type, color: '#9fc4b4', icon: '✨' };
        return (
          <span
            key={`${e.type}-${i}`}
            style={{
              fontSize: '9px', fontWeight: 700, color: meta.color,
              background: `${meta.color}15`, border: `1px solid ${meta.color}40`,
              padding: '1px 5px', borderRadius: '999px', whiteSpace: 'nowrap',
            }}
          >
            {meta.icon} {meta.label}{e.value ? `: ${e.value}` : ''}
          </span>
        );
      })}
    </div>
  );
}

function PlayerPanel({ player, isCurrent }: { player: Player; isCurrent: boolean }) {
  const accent = player.isWizard ? '#a855f7' : '#ef4444';
  return (
    <div
      className={`tobol-team-panel-compact ${player.isWizard ? 'team-red' : 'team-blue'} ${isCurrent ? 'active-turn' : ''}`}
      style={{
        flex: 1,
        '--card-border-selected': `linear-gradient(180deg, ${accent}cc, ${accent})`,
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
        <span style={{ fontSize: '14px' }}>{player.isWizard ? '🔮' : '💀'}</span>
        <span style={{
          fontSize: '12px', fontWeight: 800, color: accent,
          textShadow: '0 1px 2px rgba(0,0,0,.6)',
        }}>{player.name}</span>
      </div>
      <div className="tobol-team-divider-compact" />
      <div style={{ marginTop: '4px' }}>
        <HpBar player={player} isCurrent={isCurrent} />
      </div>
      <ActiveEffects effects={player.activeEffects} />
      <div style={{ marginTop: '4px', fontSize: '10px', color: '#9fc4b4', fontWeight: 700 }}>
        🃏 {player.hand?.length || 0} بطاقة
      </div>
    </div>
  );
}

// ============================================================
// Battle Log Panel — collapsible
// ============================================================
function BattleLogPanel({ battleLog }: { battleLog: NonNullable<WizardDuelRoomData['battleLog']> }) {
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleLog, isOpen]);

  return (
    <div className="w-full max-w-md mx-auto mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700/80 transition-all cursor-pointer"
      >
        <span>📜 سجل المبارزة ({battleLog.length})</span>
        <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-1 max-h-[40vh] overflow-y-auto bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1">
          {battleLog.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4">لا توجد حركات بعد...</p>
          ) : (
            battleLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-purple-950/30 text-purple-200"
              >
                <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
                <span className="flex-1">{entry.message}</span>
                {entry.valueChange !== undefined && entry.valueChange !== 0 && (
                  <span className={`font-black text-[10px] ${entry.valueChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {entry.valueChange > 0 ? '+' : ''}{entry.valueChange}
                  </span>
                )}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Waiting for game state
// ============================================================
function WaitingForGame({ roomCode }: { roomCode: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950" dir="rtl">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-7xl mb-6"
      >🔮</motion.div>
      <h2 className="text-2xl font-black text-slate-300 mb-2">في انتظار المبارزة</h2>
      <p className="text-sm text-slate-500 mb-1">كود الغرفة: <span className="font-mono text-white">{roomCode}</span></p>
      <p className="text-xs text-slate-600">الساحر يجهز المبارزة... ستظهر اللوحة تلقائياً</p>
    </div>
  );
}

// ============================================================
// Game Over Overlay (spectator)
// ============================================================
function SpectatorGameOver({ room }: { room: WizardDuelRoomData }) {
  const wizard = room.players?.[0];
  const ai = room.players?.[1];
  const isWizardWinner = room.winner === '0';

  if (!wizard || !ai) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">انتهت المبارزة</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950" dir="rtl">
      {isWizardWinner && <Confetti />}
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
            {isWizardWinner ? '🏆' : '💀'}
          </motion.div>
          <h1
            className={`text-3xl sm:text-4xl font-black mb-2 ${
              isWizardWinner
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300'
            }`}
          >
            {isWizardWinner ? `${wizard.name} فاز! 🎉` : `${ai.name} فاز! 💀`}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {isWizardWinner ? 'تغلب الساحر على عدوه!' : 'تغلب العدو على الساحر'}
          </p>
        </motion.div>

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className={`text-center flex-1 ${isWizardWinner ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-xs text-slate-400 mb-1">{wizard.name}</p>
              <p className={`text-3xl font-black ${isWizardWinner ? 'text-purple-400' : 'text-slate-400'}`}>{wizard.hp}</p>
            </div>
            <div className="text-slate-600 text-sm font-bold mx-2">VS</div>
            <div className={`text-center flex-1 ${!isWizardWinner ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-xs text-slate-400 mb-1">{ai.name}</p>
              <p className={`text-3xl font-black ${!isWizardWinner ? 'text-red-400' : 'text-slate-400'}`}>{ai.hp}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 mb-4 text-center">
          <p className="text-amber-300 text-xs font-bold mb-1">🚩 انتهت الجلسة</p>
          <p className="text-slate-400 text-[10px]">إذا بدأ المستضيف جولة جديدة، ستحتاج كود الغرفة الجديد</p>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href="/diwaniya"
            className="block w-full text-center bg-gradient-to-l from-purple-600 to-indigo-800 hover:from-purple-500 hover:to-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all"
          >
            🔗 أدخل كود جديد
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Spectator View
// ============================================================
interface Props {
  roomCode: string;
}

export default function WizardDuelSpectatorView({ roomCode }: Props) {
  const [room, setRoom] = useState<WizardDuelRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollCountRef = useRef(0);

  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/wizardduel-room/${roomCode}`);
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
      if (data.success && data.room) {
        setRoom(data.room);
        setLoading(false);
      } else {
        pollCountRef.current += 1;
        if (pollCountRef.current > 5) {
          setError('تعذر تحميل بيانات الغرفة');
          setLoading(false);
        }
      }
    } catch {
      pollCountRef.current += 1;
      if (pollCountRef.current > 5) {
        setError('تعذر الاتصال بالخادم');
        setLoading(false);
      }
    }
  }, [roomCode]);

  useEffect(() => {
    pollRoom();
    const interval = setInterval(pollRoom, 3000);
    return () => clearInterval(interval);
  }, [pollRoom]);

  if (loading) {
    return <WaitingForGame roomCode={roomCode} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💔</div>
          <p className="text-red-400 text-lg font-bold mb-2">{error}</p>
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 mb-4 mt-3">
            <p className="text-amber-300 text-xs font-bold mb-1">🚩 انتهت الجلسة</p>
            <p className="text-slate-400 text-[10px]">المستضيف قد يكون قد بدأ جولة جديدة بكود مختلف</p>
          </div>
          <a
            href="/diwaniya"
            className="block w-full text-center bg-gradient-to-l from-purple-600 to-indigo-800 hover:from-purple-500 hover:to-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all"
          >
            🔗 أدخل كود جديد
          </a>
        </div>
      </div>
    );
  }

  if (!room) return null;

  // Game over
  if (room.phase === 'game_over' || room.winner) {
    return <SpectatorGameOver room={room} />;
  }

  // Waiting
  if (room.phase !== 'playing' || !room.players) {
    return <WaitingForGame roomCode={roomCode} />;
  }

  const isWizardTurn = room.currentTurn === '0';
  const wizard = room.players[0];
  const ai = room.players[1];

  return (
    <div
      className="w-full flex flex-col justify-center items-center p-4"
      dir="rtl"
      style={{ background: 'url(/battle/game_bg.webp) center / cover no-repeat, #1a0833', minHeight: '100vh' }}
    >
      {/* Title */}
      <div className="text-center mb-1">
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-amber-300 to-red-400">
          🔮 مبارزة السحرة
        </h1>
        <p className="text-xs sm:text-sm font-bold text-purple-300 mt-0.5">
          {isWizardTurn ? `دور ${wizard.name}` : `دور ${ai.name}`} — الدور {room.turnCount}
        </p>
      </div>

      {/* Notification Bar */}
      <div className="w-full max-w-md mx-auto mb-1">
        <div className="w-full px-4 py-1.5 rounded-lg border bg-purple-950/40 border-purple-500/40">
          <p className="text-xs font-bold text-center truncate text-purple-200">
            {room.lastAction || 'بدأت المبارزة'}
          </p>
        </div>
      </div>

      {/* Player Panels */}
      <div className="w-full max-w-md mx-auto mb-2 flex items-stretch gap-2">
        <PlayerPanel player={wizard} isCurrent={isWizardTurn} />
        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img src="/battle/vs_pk.webp" alt="VS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <PlayerPanel player={ai} isCurrent={!isWizardTurn} />
      </div>

      {/* AI's hand (face-down count) */}
      <div className="w-full max-w-md mx-auto mb-2 p-3 bg-slate-900/50 border border-slate-700/30 rounded-xl">
        <p className="text-xs text-center text-slate-400 font-bold mb-2">🃏 يد {ai.name} ({ai.hand?.length || 0})</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {Array.from({ length: Math.min(ai.hand?.length || 0, 5) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '40px', height: '56px',
                background: 'linear-gradient(135deg, rgba(168,85,247,.3), rgba(126,34,206,.15))',
                border: '1px solid rgba(168,85,247,.4)',
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
              }}
            >🔮</div>
          ))}
        </div>
      </div>

      {/* Battle Log */}
      {room.battleLog && room.battleLog.length > 0 && (
        <BattleLogPanel battleLog={room.battleLog} />
      )}

      <div className="mt-4 text-center">
        <p className="text-[10px] text-slate-500">
          👁 أنت تشاهد — يبدّل المستضيف الحالة كل بضع ثوانٍ
        </p>
      </div>
    </div>
  );
}
