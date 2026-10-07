'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCardStats, getGridCols, CARD_COLOR_CONFIG } from '@/lib/risk-types';
import type { RiskCard, RiskPlayer, RiskLogEntry, RiskGameConfig, RiskTurnState, CardType } from '@/lib/risk-types';
import { Bomb, Shield, CircleDot, ScrollText, FastForward, Eye } from 'lucide-react';

// ============================================================
// Types matching room state from server
// ============================================================
interface RiskRoomData {
  code: string;
  hostName: string;
  players: RiskPlayer[];
  currentPlayerIndex: number;
  cards: RiskCard[];
  targetScore: number;
  turnState: RiskTurnState;
  lastDrawnCard: RiskCard | null;
  gameLog: RiskLogEntry[];
  winner: RiskPlayer | null;
  phase: string;
  spectators: Array<{ id: string; name: string; joinedAt: number }>;
  roundMultiplier: number;
  lastMatchInfo: { matched: boolean; matchType: 'color' | 'number' | null; matchWith: RiskCard | null; lostPoints: number; } | null;
}

// ============================================================
// Confetti
// ============================================================
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#f97316', '#eab308'];
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
          style={{ width: p.size, height: p.size, backgroundColor: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Spectator Game Over
// ============================================================
function SpectatorGameOver({ room }: { room: RiskRoomData }) {
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winnerPlayer = sortedPlayers[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 risk-bg" dir="rtl">
      {winnerPlayer && <Confetti />}
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
            🏆
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">
            {winnerPlayer ? `${winnerPlayer.name} فاز! 🎉` : 'انتهت اللعبة!'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">وصل للهدف أولاً!</p>
        </motion.div>

        {/* Player results */}
        <div className="space-y-2 mb-4">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className={`rounded-xl border p-3 ${
                idx === 0 ? 'ring-2 ring-yellow-400/50 border-yellow-500/30 bg-yellow-950/10' : 'border-slate-700/30 bg-slate-900/50 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{player.emoji}</span>
                  <span className={`text-sm font-bold ${player.color}`}>{player.name}</span>
                  {idx === 0 && <span className="text-[10px] text-yellow-400">🏆</span>}
                </div>
                <p className="text-xl font-black text-white">{player.score}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">👁️ أنت تشاهد كمشاهد</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Stats Bar (read-only)
// ============================================================
function StatsBar({ cards }: { cards: RiskCard[] }) {
  const stats = getCardStats(cards);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-emerald-400">
        <Shield className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.numbers}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-red-400">
        <Bomb className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.bombs}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-400">
        <FastForward className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.skips}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-300">
        <CircleDot className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.hidden}</span>
      </div>
    </div>
  );
}

// ============================================================
// Player Score (read-only)
// ============================================================
function PlayerScore({ player, isCurrent }: { player: RiskPlayer; isCurrent: boolean }) {
  return (
    <div className={`rounded-xl border p-2.5 sm:p-3 transition-all ${
      isCurrent ? 'ring-2 border-slate-500/30' : 'border-slate-700/30'
    } bg-slate-900/40`}
      style={isCurrent ? { borderColor: `${player.colorHex}60` } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{player.emoji}</span>
          <span className={`text-xs sm:text-sm font-bold ${player.color}`}>{player.name}</span>
          {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white">◀ الآن</span>}
        </div>
        <div className="text-left">
          <p className="text-sm sm:text-base font-black text-white">{player.score}</p>
          {isCurrent && player.roundScore > 0 && (
            <p className="text-[10px] text-emerald-400 font-bold">+{player.roundScore} جولة</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Grid Card (read-only)
// ============================================================
function GridCardRO({ card }: { card: RiskCard }) {
  const colorConfig = card.color ? CARD_COLOR_CONFIG[card.color] : null;

  return (
    <div className="rounded-lg overflow-hidden">
      {card.revealed ? (
        <div
          className="w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center"
          style={{
            borderColor: card.type === 'bomb' ? '#ef444460' : card.type === 'skip' ? '#94a3b860' : card.type === 'double' ? '#f59e0b60' : card.type === 'triple' ? '#a855f760' : colorConfig ? `${colorConfig.colorHex}60` : '#34d39960',
            background: card.type === 'bomb'
              ? 'linear-gradient(135deg, #1a0a0a, #2a1010)'
              : card.type === 'skip'
                ? 'linear-gradient(135deg, #1a1a2e, #1e1e30)'
                : card.type === 'double'
                  ? 'linear-gradient(135deg, #1a1500, #2a2010)'
                  : card.type === 'triple'
                    ? 'linear-gradient(135deg, #1a0a20, #2a1030)'
                    : 'linear-gradient(135deg, #0a1a10, #0a2a18)',
          }}
        >
          <div className="text-xl sm:text-2xl mb-0.5">
            {card.type === 'bomb' ? '💣' : card.type === 'skip' ? '⏭️' : card.type === 'double' ? '✨' : card.type === 'triple' ? '🔥' : `${colorConfig?.emoji || ''}`}
          </div>
          {card.type === 'number' && <div className="text-xs sm:text-sm font-black text-white">+{card.value}</div>}
        </div>
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-slate-800 via-slate-700/80 to-slate-800 border-2 border-slate-600/40 rounded-lg flex items-center justify-center">
          <div className="text-slate-600 text-[10px] sm:text-xs font-bold">{card.index + 1}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Game Log (read-only)
// ============================================================
function GameLogPanel({ gameLog }: { gameLog: RiskLogEntry[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700/80 transition-all cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <ScrollText className="w-3.5 h-3.5" />
          سجل اللعبة ({gameLog.length})
        </span>
        <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-1 max-h-[40vh] overflow-y-auto bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1 risk-scrollbar">
          {gameLog.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-slate-800/30 text-slate-300">
              <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
              <span className="flex-1">{entry.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Turn State Text
// ============================================================
function TurnStateText({ turnState, currentPlayer }: { turnState: RiskTurnState; currentPlayer: RiskPlayer }) {
  let text = '';
  switch (turnState) {
    case 'waiting_for_draw':
      text = `👆 بانتظار ${currentPlayer.name} لسحب بطاقة...`;
      break;
    case 'waiting_for_decision':
      text = `🤔 ${currentPlayer.name} يفكر... (استمر أو احفظ؟)`;
      break;
    case 'showing_result':
      text = '📋 عرض النتيجة...';
      break;
    case 'bomb_exploded':
      text = `💥 قنبلة! ${currentPlayer.name} خسر النقاط!`;
      break;
    case 'turn_lost':
      text = `😱 تطابق! ${currentPlayer.name} خسر النقاط!`;
      break;
    default:
      text = '';
  }

  if (!text) return null;
  return (
    <div className="w-full max-w-2xl mx-auto text-center py-2 px-4 rounded-xl border mb-3 bg-violet-950/30 border-violet-500/30 text-violet-300">
      <p className="text-xs sm:text-sm font-bold">{text}</p>
    </div>
  );
}

// ============================================================
// Main Spectator View
// ============================================================
export default function RiskSpectatorView({ roomCode }: { roomCode: string }) {
  const [room, setRoom] = useState<RiskRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);

  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/risk-room/${roomCode}`);
      if (!res.ok) {
        if (res.status === 404) {
          setExpired(true);
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
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (expired) {
      const timer = setTimeout(() => { window.location.href = '/'; }, 3000);
      return () => clearTimeout(timer);
    }
  }, [expired]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => { await pollRoom(); };
    fetchData();
    const interval = setInterval(() => { if (active) fetchData(); }, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [pollRoom]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center risk-bg" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">👁️</div>
          <p className="text-slate-400">جاري الاتصال بالغرفة...</p>
          <p className="text-slate-500 text-xs mt-2 font-mono">كود: {roomCode}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center risk-bg" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💔</div>
          <p className="text-red-400 text-lg font-bold mb-4">{error}</p>
          <a href="/" className="inline-block text-sm text-violet-400 hover:text-violet-300 underline">العودة للرئيسية</a>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center risk-bg" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">⏰</div>
          <p className="text-red-400 text-lg font-bold mb-2">الغرفة غير موجودة</p>
          <p className="text-slate-400 text-sm mb-4">انتهت صلاحية الغرفة أو تم إغلاقها</p>
          <p className="text-slate-500 text-xs">جاري التحويل للرئيسية...</p>
        </div>
      </div>
    );
  }

  if (!room) return null;

  if (room.phase === 'game_over') {
    return <SpectatorGameOver room={room} />;
  }

  const cols = getGridCols(room.cards.length || 50);
  const currentPlayer = room.players[room.currentPlayerIndex];

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-3 sm:py-4" dir="rtl">
      {/* Spectator Badge */}
      <div className="mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/40 border border-violet-500/30 text-violet-300 text-xs font-bold">
          <Eye className="w-3.5 h-3.5" />
          مشاهد — كود: {roomCode}
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-3">
        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400">
          💣 المجازفة
        </h1>
      </div>

      {/* Stats */}
      <div className="mb-3 w-full">
        <StatsBar cards={room.cards} />
      </div>

      {/* Round Multiplier */}
      {room.roundMultiplier > 1 && (
        <div className="mb-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-bold">
            {room.roundMultiplier >= 6 ? '🔥' : '✨'} المضاعف: ×{room.roundMultiplier}
          </div>
        </div>
      )}

      {/* Turn State */}
      {currentPlayer && <TurnStateText turnState={room.turnState} currentPlayer={currentPlayer} />}

      {/* Player Scores */}
      <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-2 sm:gap-3 mb-3">
        {room.players.map((player) => (
          <PlayerScore key={player.id} player={player} isCurrent={player.id === currentPlayer?.id} />
        ))}
      </div>

      {/* Grid */}
      <div className="w-full max-w-2xl mx-auto mb-3">
        <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {room.cards.map((card) => (
            <GridCardRO key={card.id} card={card} />
          ))}
        </div>
      </div>

      {/* Game Log */}
      <GameLogPanel gameLog={room.gameLog} />
    </div>
  );
}
