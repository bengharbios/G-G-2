'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CARD_COLORS, SPECIAL_CARD_INFO, getCardStats, getGridCols } from '@/lib/risk2-types';
import type { Risk2Card, Risk2Player, Risk2LogEntry, Risk2TurnState, CardColor, Risk2GameConfig } from '@/lib/risk2-types';
import { Bomb, SkipForward, ScrollText, Eye, AlertTriangle, Sparkles } from 'lucide-react';

// ============================================================
// Room data type matching what the API returns
// ============================================================
interface Risk2RoomData {
  players: Risk2Player[];
  currentPlayerIndex: number;
  cards: Risk2Card[];
  deckNumber: number;
  config: Risk2GameConfig;
  turnState: Risk2TurnState;
  lastDrawnCard: Risk2Card | null;
  drawnThisTurn: Risk2Card[];
  matchReason: string;
  gameLog: Risk2LogEntry[];
  winner: Risk2Player | null;
  winReason: string;
  phase: string;
}

// ============================================================
// Confetti for game over
// ============================================================
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#f59e0b', '#f97316', '#ef4444', '#22c55e', '#06b6d4', '#eab308', '#ec4899'];
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

// ============================================================
// Spectator Game Over
// ============================================================
function SpectatorGameOver({ room }: { room: Risk2RoomData }) {
  const winner = room.winner;
  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 risk-bg" dir="rtl">
      <Confetti />

      <div className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto">
        {/* Winner Banner */}
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
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-300 to-amber-400 mb-2">
            {winner ? `${winner.name} فاز! 🎉` : 'انتهت اللعبة!'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">{room.winReason}</p>
        </motion.div>

        {/* Final Scoreboard */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-4 space-y-2">
          {sorted.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                winner?.id === player.id
                  ? 'bg-orange-950/30 border border-orange-500/40'
                  : 'bg-slate-800/30 border border-slate-700/20'
              }`}
            >
              <span className="text-lg font-black w-6 text-center">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
              </span>
              <span className={`flex-1 text-sm font-bold truncate ${winner?.id === player.id ? 'text-orange-300' : 'text-slate-300'}`}>
                {player.name}
              </span>
              <span className={`text-sm font-black ${winner?.id === player.id ? 'text-orange-400' : 'text-white'}`}>
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {/* Spectator badge */}
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
function StatsBar({ cards }: { cards: Risk2Card[] }) {
  const stats = getCardStats(cards);
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-emerald-400">
        <span className="text-[10px] sm:text-xs font-bold">{stats.numbers}</span>
        <span className="text-[8px] text-slate-500 hidden sm:inline">رقم</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-red-400">
        <Bomb className="w-3 h-3" />
        <span className="text-[10px] sm:text-xs font-bold">{stats.bombs}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-400">
        <SkipForward className="w-3 h-3" />
        <span className="text-[10px] sm:text-xs font-bold">{stats.skips}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-amber-400">
        <span className="text-[10px] font-bold">×2</span>
        <span className="text-[10px] sm:text-xs font-bold">{stats.doubles}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-purple-400">
        <span className="text-[10px] font-bold">×3</span>
        <span className="text-[10px] sm:text-xs font-bold">{stats.triples}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-300">
        <span className="text-[10px] sm:text-xs font-bold">{stats.hidden}</span>
        <span className="text-[8px] text-slate-500 hidden sm:inline">متبقي</span>
      </div>
    </div>
  );
}

// ============================================================
// Scoreboard (read-only, collapsible when many players)
// ============================================================
function Scoreboard({ players, currentPlayerIndex, targetScore }: {
  players: Risk2Player[];
  currentPlayerIndex: number;
  targetScore: number;
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const isMany = players.length > 4;
  const [expanded, setExpanded] = useState(!isMany);
  const currentPlayer = players[currentPlayerIndex];

  // Collapsed: show only current player + their score
  if (isMany && !expanded) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/40 border border-slate-700/20 hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <span className="text-[10px] text-slate-500 font-bold">👥</span>
          <span className="text-[10px] text-slate-400 flex-1 text-right">{currentPlayer?.name}</span>
          {currentPlayer?.roundScore > 0 && (
            <span className="text-[9px] text-emerald-300 font-bold">+{currentPlayer.roundScore}</span>
          )}
          {currentPlayer?.multiplier > 1 && (
            <span className="text-[8px] text-yellow-300 font-bold">×{currentPlayer.multiplier}</span>
          )}
          <span className="text-xs font-black text-white">{currentPlayer?.score}</span>
          <span className="text-[10px] text-orange-300 font-bold">◀ الآن</span>
          <span className="text-[9px] text-slate-500 mr-auto">▼ {players.length} لاعبين</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {isMany && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full text-[9px] text-slate-500 text-left mb-1 hover:text-slate-400 transition-colors cursor-pointer"
        >
          ▲ طي النتائج
        </button>
      )}
      <div className={isMany ? 'grid grid-cols-2 gap-1' : 'space-y-1'}>
        {sorted.map((player, idx) => {
          const isCurrent = players.indexOf(player) === currentPlayerIndex;
          const progress = Math.min((player.score / targetScore) * 100, 100);

          return (
            <div
              key={player.id}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${
                isCurrent
                  ? 'bg-orange-950/30 border border-orange-500/40'
                  : 'bg-slate-800/30 border border-slate-700/20'
              }`}
            >
              <span className="text-[9px] text-slate-500 w-3 text-center font-bold">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold truncate ${isCurrent ? 'text-orange-300' : 'text-slate-300'}`}>
                    {player.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[7px] px-1 py-0 rounded bg-orange-500/20 text-orange-300 font-bold shrink-0">
                      ◀
                    </span>
                  )}
                  {player.roundScore > 0 && (
                    <span className="text-[8px] text-emerald-300 font-bold shrink-0">
                      +{player.roundScore}
                    </span>
                  )}
                  {player.multiplier > 1 && (
                    <span className="text-[8px] text-yellow-300 font-bold shrink-0">
                      ×{player.multiplier}
                    </span>
                  )}
                </div>
                {!isMany && (
                  <div className="mt-0.5 h-1 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress >= 100 ? 'bg-yellow-400' : isCurrent ? 'bg-orange-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span className={`text-xs font-black shrink-0 ${progress >= 100 ? 'text-yellow-400' : 'text-white'}`}>
                {player.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Drawn This Turn Display (read-only)
// ============================================================
function DrawnThisTurn({ cards }: { cards: Risk2Card[] }) {
  if (cards.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] text-slate-500 font-bold">بطاقات هذه الجولة:</span>
        <div className="flex-1 h-px bg-slate-800/50" />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {cards.map((card) => {
          const isGold = card.type === 'double' || card.type === 'triple';
          return (
          <div
            key={card.id}
            className={`w-10 h-12 sm:w-11 sm:h-13 rounded-lg flex flex-col items-center justify-center border-2 ${
              card.type === 'number'
                ? `${CARD_COLORS[card.color as CardColor].bg} ${CARD_COLORS[card.color as CardColor].border}`
                : card.type === 'bomb'
                  ? 'bg-red-950/40 border-red-500/40'
                  : card.type === 'skip'
                    ? 'bg-slate-800/60 border-slate-600/40'
                    : `bg-gradient-to-br ${SPECIAL_CARD_INFO[card.type].bg} ${SPECIAL_CARD_INFO[card.type].border} ${isGold ? 'shadow-md shadow-yellow-500/20' : ''}`
            }`}
          >
            {card.type === 'number' ? (
              <span className={`text-base font-black ${CARD_COLORS[card.color as CardColor].text}`}>
                {card.number}
              </span>
            ) : (
              <span className={`text-sm ${isGold ? 'drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]' : ''}`}>{SPECIAL_CARD_INFO[card.type].emoji}</span>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Grid Card (read-only)
// ============================================================
function GridCard({ card }: { card: Risk2Card }) {
  if (card.revealed) {
    if (card.type === 'number') {
      const colorInfo = CARD_COLORS[card.color as CardColor];
      return (
        <div className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center ${colorInfo.bg} ${colorInfo.border}`}>
          <span className={`text-lg sm:text-xl font-black ${colorInfo.text}`}>
            {card.number}
          </span>
        </div>
      );
    }

    const specialInfo = SPECIAL_CARD_INFO[card.type];
    const isGold = card.type === 'double' || card.type === 'triple';
    return (
      <div className={`w-full aspect-square rounded-lg border-2 bg-gradient-to-br ${specialInfo.bg} ${specialInfo.border} flex flex-col items-center justify-center ${isGold ? 'shadow-lg shadow-yellow-500/30 ring-1 ring-yellow-400/30' : ''}`}>
        <span className={`text-xl sm:text-2xl ${isGold ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' : ''}`}>{specialInfo.emoji}</span>
        <span className="text-[8px] font-bold mt-0.5" style={{ color: specialInfo.color }}>
          {specialInfo.label}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-slate-800 via-slate-700/80 to-slate-800 border-2 border-slate-600/40 flex items-center justify-center">
      <span className="text-slate-600 text-[9px] sm:text-[10px] font-bold">
        {card.index + 1}
      </span>
    </div>
  );
}

// ============================================================
// Result Display (read-only)
// ============================================================
function ResultDisplay({
  card,
  currentPlayerName,
  matchReason,
  turnState,
}: {
  card: Risk2Card;
  currentPlayerName: string;
  matchReason: string;
  turnState: string;
}) {
  let title = '';
  let desc = '';
  let color = '#fff';

  if (card.type === 'number') {
    const colorInfo = CARD_COLORS[card.color as CardColor];
    if (turnState === 'turn_lost') {
      title = '❌ خسر الدور!';
      desc = matchReason;
      color = '#ef4444';
    } else if (turnState === 'waiting_for_decision') {
      title = `${card.number} ${colorInfo.emoji}`;
      desc = `${colorInfo.label} — آمن!`;
      color = colorInfo.hex;
    } else {
      title = `${card.number} ${colorInfo.emoji}`;
      desc = colorInfo.label;
      color = colorInfo.hex;
    }
  } else {
    const info = SPECIAL_CARD_INFO[card.type];
    title = `${info.emoji} ${info.label}`;
    desc = info.desc;
    color = info.color;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.1 }}
          className="text-5xl mb-3"
        >
          {card.type === 'number'
            ? <span className="text-4xl" style={{ color }}><span className="text-2xl">{CARD_COLORS[card.color as CardColor].emoji}</span> {card.number}</span>
            : <span>{SPECIAL_CARD_INFO[card.type].emoji}</span>
          }
        </motion.div>

        <h2 className="text-xl font-black mb-2" style={{ color }}>
          {title}
        </h2>
        <p className="text-sm text-slate-300 mb-1">{desc}</p>
        <p className="text-xs text-slate-500 mb-4">{currentPlayerName}</p>
        <p className="text-[10px] text-slate-600 italic">👁️ وضع المشاهد</p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// New Deck Notification
// ============================================================
function NewDeckNotification({ deckNumber }: { deckNumber: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-lg mx-auto text-center py-2 px-4 rounded-xl border bg-orange-950/30 border-orange-500/30 text-orange-300 mb-2"
    >
      <p className="text-xs font-bold flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4" />
        مجموعة جديدة #{deckNumber} من البطاقات!
        <Sparkles className="w-4 h-4" />
      </p>
    </motion.div>
  );
}

// ============================================================
// Game Log Panel (read-only)
// ============================================================
function GameLogPanel({ gameLog }: { gameLog: Risk2LogEntry[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameLog, isOpen]);

  return (
    <div className="w-full max-w-lg mx-auto mt-2">
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
          {gameLog.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4">لا تحركات بعد...</p>
          ) : (
            gameLog.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-slate-800/30 text-slate-300">
                <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
                <span className="flex-1">{entry.action}</span>
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
// Turn State Display (read-only)
// ============================================================
function TurnStateDisplay({ turnState, currentPlayer }: { turnState: string; currentPlayer: Risk2Player | null }) {
  if (!currentPlayer) return null;

  let text = '';
  let bgColor = 'bg-slate-800/60';
  let textColor = 'text-slate-300';

  switch (turnState) {
    case 'waiting_for_draw':
      text = `👆 بانتظار ${currentPlayer.name} لاختيار بطاقة...`;
      bgColor = 'bg-orange-950/30';
      textColor = 'text-orange-300';
      break;
    case 'waiting_for_decision':
      text = `🤔 ${currentPlayer.name} يفكر: استمر أو احفظ؟`;
      bgColor = 'bg-emerald-950/30';
      textColor = 'text-emerald-300';
      break;
    case 'showing_result':
      text = `📋 عرض النتيجة...`;
      bgColor = 'bg-slate-800/60';
      textColor = 'text-slate-300';
      break;
    case 'turn_lost':
      text = `❌ ${currentPlayer.name} خسر الدور!`;
      bgColor = 'bg-red-950/30';
      textColor = 'text-red-300';
      break;
    case 'bomb_exploded':
      text = `💣 قنبلة! ${currentPlayer.name} خسر كل رصيد الجولة!`;
      bgColor = 'bg-red-950/30';
      textColor = 'text-red-300';
      break;
    default:
      return null;
  }

  return (
    <div className={`w-full max-w-lg mx-auto text-center py-2 px-4 rounded-xl border mb-3 ${bgColor} ${textColor}`}>
      <p className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
        {turnState === 'waiting_for_draw' && <AlertTriangle className="w-4 h-4" />}
        {text}
      </p>
    </div>
  );
}

// ============================================================
// Main Spectator View
// ============================================================
export default function Risk2SpectatorView({ roomCode }: { roomCode: string }) {
  const [room, setRoom] = useState<Risk2RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const expiredRef = useRef(false);
  const prevDeckRef = useRef(0);

  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/risk2-room/${roomCode}`);
      if (!res.ok) {
        if (res.status === 404) {
          expiredRef.current = true;
          setExpired(true);
        } else {
          setError('خطأ في جلب البيانات');
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.ok && data.room) {
        setRoom(data.room);
        setLoading(false);
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLoading(false);
    }
  }, [roomCode]);

  // Track deck number changes via polling
  useEffect(() => {
    if (room && room.deckNumber > prevDeckRef.current && prevDeckRef.current > 0) {
      setShowNewDeck(true);
      const timer = setTimeout(() => setShowNewDeck(false), 3000);
    }
    if (room) {
      prevDeckRef.current = room.deckNumber;
    }
  }, [room]);

  useEffect(() => {
    if (expired) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [expired]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      await pollRoom();
    };
    fetchData();
    const interval = setInterval(() => {
      if (active) fetchData();
    }, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
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
          <a href="/" className="inline-block text-sm text-orange-400 hover:text-orange-300 underline">
            العودة للرئيسية
          </a>
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

  // Game over — show results screen
  if (room.phase === 'game_over') {
    return <SpectatorGameOver room={room} />;
  }

  const cols = getGridCols(room.cards.length);
  const currentPlayer = room.players[room.currentPlayerIndex];

  const shouldShowModal = (
    room.turnState === 'waiting_for_decision' ||
    room.turnState === 'showing_result' ||
    room.turnState === 'turn_lost' ||
    room.turnState === 'bomb_exploded'
  ) && !!room.lastDrawnCard;

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-3 sm:py-4" dir="rtl">
      {/* Spectator Badge */}
      <div className="mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-300 text-xs font-bold">
          <Eye className="w-3.5 h-3.5" />
          مشاهد — كود: {roomCode}
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-3">
        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-300 to-amber-400">
          🎴 المجازفة 2
        </h1>
        <p className="text-[10px] text-slate-500">الهدف: {room.config.targetScore} نقطة</p>
      </div>

      {/* Stats Bar */}
      <div className="mb-2 w-full">
        <StatsBar cards={room.cards} />
      </div>

      {/* Scoreboard */}
      <div className="w-full mb-3">
        <Scoreboard
          players={room.players}
          currentPlayerIndex={room.currentPlayerIndex}
          targetScore={room.config.targetScore}
        />
      </div>

      {/* New Deck Notification */}
      <AnimatePresence>
        {showNewDeck && <NewDeckNotification deckNumber={room.deckNumber} />}
      </AnimatePresence>

      {/* Turn State */}
      <TurnStateDisplay turnState={room.turnState} currentPlayer={currentPlayer} />

      {/* Drawn This Turn */}
      {(room.turnState !== 'waiting_for_draw' || room.drawnThisTurn.length > 0) && (
        <div className="mb-3">
          <DrawnThisTurn cards={room.drawnThisTurn} />
        </div>
      )}

      {/* Card Grid */}
      <div className="w-full max-w-lg mx-auto mb-3">
        <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {room.cards.map((card) => (
            <GridCard key={card.id} card={card} />
          ))}
        </div>
      </div>

      {/* Game Log */}
      <GameLogPanel gameLog={room.gameLog} />

      {/* Result Display Modal (read-only) */}
      <AnimatePresence mode="wait">
        {shouldShowModal && room.lastDrawnCard && (
          <ResultDisplay
            key={`modal-${room.lastDrawnCard.id}-${room.turnState}`}
            card={room.lastDrawnCard}
            currentPlayerName={currentPlayer?.name || ''}
            matchReason={room.matchReason}
            turnState={room.turnState}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
