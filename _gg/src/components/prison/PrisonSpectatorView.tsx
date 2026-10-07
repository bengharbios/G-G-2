'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CELL_ITEMS, getRemainingItems, GRID_CONFIGS } from '@/lib/prison-types';
import type { CellItemType, PrisonTeam, PrisonPlayer, GridCell, InteractionState, PrisonLogEntry } from '@/lib/prison-types';
import { Skull, Lock, Key, Eye, SkipForward, ScrollText } from 'lucide-react';

// ============================================================
// Types matching PrisonRoomState from server
// ============================================================
interface PrisonRoomData {
  code: string;
  hostName: string;
  alphaName: string;
  betaName: string;
  currentTeam: PrisonTeam;
  players: PrisonPlayer[];
  gridSize: number;
  grid: GridCell[];
  interactionState: InteractionState;
  revealedCell: GridCell | null;
  selectedTargetId: string | null;
  gameLog: PrisonLogEntry[];
  winner: PrisonTeam | 'draw' | null;
  winReason: string;
  phase: string;
}

// ============================================================
// Confetti for spectator game over
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
function SpectatorGameOver({ room }: { room: PrisonRoomData }) {
  const isDraw = room.winner === 'draw';
  const winnerTeam = room.winner as PrisonTeam | null;
  const winnerName = isDraw ? 'تعادل!' : winnerTeam === 'alpha' ? room.alphaName : room.betaName;

  const skullMoves = room.gameLog.filter((e) => e.itemType === 'skull').length;
  const openMoves = room.gameLog.filter((e) => e.itemType === 'open').length;
  const keyMoves = room.gameLog.filter((e) => e.itemType === 'key').length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 prison-bg" dir="rtl">
      {!isDraw && <Confetti />}

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
            {isDraw ? '🤝' : '🏆'}
          </motion.div>
          <h1
            className={`text-3xl sm:text-4xl font-black mb-2 ${
              isDraw
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300'
                : winnerTeam === 'alpha'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300'
            }`}
          >
            {isDraw ? 'تعادل! 🤝' : `${winnerName} فاز! 🎉`}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">{room.winReason}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <Skull className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-slate-200">{skullMoves}</p>
            <p className="text-[10px] text-slate-500">إعدام</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <Lock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-slate-200">{openMoves}</p>
            <p className="text-[10px] text-slate-500">سجن</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <Key className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-slate-200">{keyMoves}</p>
            <p className="text-[10px] text-slate-500">تحرير</p>
          </div>
        </div>

        {/* Teams */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`text-center flex-1 ${winnerTeam === 'alpha' ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-xs text-amber-300 mb-1">{room.alphaName}</p>
              <p className="text-sm text-slate-400">
                {room.players.filter((p) => p.team === 'alpha' && p.status === 'active').length} أحرار / {room.players.filter((p) => p.team === 'alpha').length} إجمالي
              </p>
            </div>
            <div className="text-slate-600 text-sm font-bold mx-2">VS</div>
            <div className={`text-center flex-1 ${winnerTeam === 'beta' ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-xs text-cyan-300 mb-1">{room.betaName}</p>
              <p className="text-sm text-slate-400">
                {room.players.filter((p) => p.team === 'beta' && p.status === 'active').length} أحرار / {room.players.filter((p) => p.team === 'beta').length} إجمالي
              </p>
            </div>
          </div>
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
function StatsBar({ grid }: { grid: GridCell[] }) {
  const remaining = getRemainingItems(grid);

  const items: { type: CellItemType; icon: React.ReactNode; color: string }[] = [
    { type: 'skull', icon: <Skull className="w-3.5 h-3.5" />, color: 'text-red-400' },
    { type: 'open', icon: <Lock className="w-3.5 h-3.5" />, color: 'text-cyan-400' },
    { type: 'uniform', icon: <Eye className="w-3.5 h-3.5" />, color: 'text-orange-400' },
    { type: 'key', icon: <Key className="w-3.5 h-3.5" />, color: 'text-yellow-400' },
    { type: 'skip', icon: <SkipForward className="w-3.5 h-3.5" />, color: 'text-slate-400' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      {items.map((item) => (
        <div
          key={item.type}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 ${item.color}`}
        >
          {item.icon}
          <span className="text-xs font-bold">{remaining[item.type]}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Player Panel (read-only)
// ============================================================
function PlayerPanel({ team, teamName, players, currentPlayerId }: {
  team: PrisonTeam;
  teamName: string;
  players: PrisonPlayer[];
  currentPlayerId: string | null;
}) {
  const isAlpha = team === 'alpha';
  const teamPlayers = players.filter((p) => p.team === team);

  return (
    <div className={`rounded-xl border p-3 ${
      isAlpha ? 'border-amber-500/30 bg-amber-950/20' : 'border-cyan-500/30 bg-cyan-950/20'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs">{isAlpha ? '🟡' : '🔵'}</span>
        <h3 className={`text-xs font-bold ${isAlpha ? 'text-amber-300' : 'text-cyan-300'}`}>{teamName}</h3>
      </div>

      <div className="space-y-1.5">
        {teamPlayers.map((player) => {
          const isExecuted = player.status === 'executed';
          const isImprisoned = player.status === 'imprisoned';
          const isCurrentPlayer = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                isCurrentPlayer
                  ? isAlpha
                    ? 'bg-amber-900/40 border border-amber-500/50 text-amber-200'
                    : 'bg-cyan-900/40 border border-cyan-500/50 text-cyan-200'
                  : isExecuted
                    ? 'bg-red-950/20 border border-red-900/20 text-red-400/50 line-through'
                    : isImprisoned
                      ? 'bg-orange-950/20 border border-orange-900/20 text-orange-400/70'
                      : 'bg-slate-800/40 border border-slate-700/20 text-slate-400'
              }`}
            >
              <span className="shrink-0">
                {isExecuted ? '💀' : isImprisoned ? '🏚️' : '✅'}
              </span>
              <span className="flex-1 truncate">{player.name}</span>
              {isImprisoned && (
                <span className="text-[9px] bg-orange-900/40 px-1.5 py-0.5 rounded text-orange-300">
                  {player.uniformCount}x
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Grid Cell (read-only)
// ============================================================
function GridCellComponent({ cell }: { cell: GridCell }) {
  const item = CELL_ITEMS[cell.type];

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ aspectRatio: '1/1' }}
    >
      {cell.status === 'hidden' ? (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border-2 border-slate-600/50 rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">{cell.index + 1}</span>
          </div>
        </div>
      ) : (
        <div
          className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 rounded-xl flex items-center justify-center relative"
          style={{ borderColor: `${item.color}40` }}
        >
          <div className="relative w-[70%] h-[70%]">
            <img src={item.img} alt={item.title} className="w-full h-full object-contain" draggable={false} />
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 py-0.5 text-center text-[8px] sm:text-[9px] font-bold rounded-b-lg"
            style={{ backgroundColor: `${item.color}30`, color: item.color }}
          >
            {item.label}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Revealed Cell Modal (read-only)
// ============================================================
function RevealedCellModal({ cell, selectedTarget }: { cell: GridCell; selectedTarget: PrisonPlayer | null }) {
  const item = CELL_ITEMS[cell.type];

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
        <div className="w-24 h-24 mx-auto mb-4 relative">
          <img src={item.img} alt={item.title} className="w-full h-full object-contain" draggable={false} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black mb-2" style={{ color: item.color }}>
          {item.emoji} {item.title}
        </h2>
        <p className="text-sm text-slate-300 mb-2">{item.desc}</p>
        {selectedTarget && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold text-slate-200">
            {cell.type === 'open' && `🏚️ تم سجن ${selectedTarget.name}!`}
            {cell.type === 'key' && `🔓 تم تحرير ${selectedTarget.name}!`}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Game Log (read-only)
// ============================================================
function GameLogPanel({ gameLog }: { gameLog: PrisonLogEntry[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto mt-2">
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
        <div className="mt-1 max-h-[40vh] overflow-y-auto bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1 prison-scrollbar">
          {gameLog.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4">لا تحركات بعد...</p>
          ) : (
            gameLog.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg ${
                  entry.team === 'alpha' ? 'bg-amber-950/30 text-amber-300' : 'bg-cyan-950/30 text-cyan-300'
                }`}
              >
                <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
                <span className="flex-1">{entry.action}</span>
                <span className="text-[10px] opacity-60">{CELL_ITEMS[entry.itemType].emoji}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Interaction State Text
// ============================================================
function InteractionText({ state, room }: { state: InteractionState; room: PrisonRoomData }) {
  const currentPlayer = room.players.find((p) => p.id === room.selectedTargetId);
  const teamName = room.currentTeam === 'alpha' ? room.alphaName : room.betaName;

  let text = '';
  let bgColor = 'bg-slate-800/60';
  let textColor = 'text-slate-300';

  switch (state) {
    case 'waiting_for_player':
      text = `👆 بانتظار فريق ${teamName} لاختيار لاعب...`;
      bgColor = room.currentTeam === 'alpha' ? 'bg-amber-950/30' : 'bg-cyan-950/30';
      textColor = room.currentTeam === 'alpha' ? 'text-amber-300' : 'text-cyan-300';
      break;
    case 'waiting_for_cell':
      text = '🔓 جاري اختيار زنزانة...';
      bgColor = 'bg-emerald-950/30';
      textColor = 'text-emerald-300';
      break;
    case 'showing_result':
      text = '📋 عرض النتيجة...';
      bgColor = 'bg-slate-800/60';
      textColor = 'text-slate-300';
      break;
    case 'picking_opponent_jail':
      text = '🏚️ اختر لاعب خصم للسجن...';
      bgColor = 'bg-orange-950/30';
      textColor = 'text-orange-300';
      break;
    case 'picking_teammate_free':
      text = '🔓 اختر سجين للتحرير...';
      bgColor = 'bg-yellow-950/30';
      textColor = 'text-yellow-300';
      break;
    default:
      text = '';
  }

  if (!text) return null;

  return (
    <div className={`w-full max-w-md mx-auto text-center py-2 px-4 rounded-xl border mb-3 ${bgColor} ${textColor}`}>
      <p className="text-xs sm:text-sm font-bold">{text}</p>
    </div>
  );
}

// ============================================================
// Main Spectator View
// ============================================================
export default function PrisonSpectatorView({ roomCode }: { roomCode: string }) {
  const [room, setRoom] = useState<PrisonRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const expiredRef = useRef(false);

  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/prison-room/${roomCode}`);
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
      <div className="min-h-screen flex items-center justify-center prison-bg" dir="rtl">
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
      <div className="min-h-screen flex items-center justify-center prison-bg" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💔</div>
          <p className="text-red-400 text-lg font-bold mb-4">{error}</p>
          <a href="/" className="inline-block text-sm text-blue-400 hover:text-blue-300 underline">
            العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center prison-bg" dir="rtl">
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

  const config = GRID_CONFIGS[room.gridSize];
  const cols = config?.cols ?? 4;
  const selectedTarget = room.players.find((p) => p.id === room.selectedTargetId) ?? null;

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-3 sm:py-4" dir="rtl">
      {/* Spectator Badge */}
      <div className="mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
          <Eye className="w-3.5 h-3.5" />
          مشاهد — كود: {roomCode}
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-3">
        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400">
          🔒 السجن
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="mb-3 w-full">
        <StatsBar grid={room.grid} />
      </div>

      {/* Interaction State Text */}
      <InteractionText state={room.interactionState} room={room} />

      {/* Player Panels */}
      <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-2 sm:gap-3 mb-4">
        <PlayerPanel team="alpha" teamName={room.alphaName} players={room.players} currentPlayerId={room.currentPlayerId} />
        <PlayerPanel team="beta" teamName={room.betaName} players={room.players} currentPlayerId={room.currentPlayerId} />
      </div>

      {/* Grid */}
      <div className="w-full max-w-md mx-auto mb-3">
        <div className="grid gap-2 sm:gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {room.grid.map((cell) => (
            <GridCellComponent key={cell.id} cell={cell} />
          ))}
        </div>
      </div>

      {/* Game Log */}
      <GameLogPanel gameLog={room.gameLog} />

      {/* Revealed Cell Modal */}
      <AnimatePresence>
        {(room.interactionState === 'showing_result' || room.interactionState === 'picking_opponent_jail' || room.interactionState === 'picking_teammate_free') && room.revealedCell && (
          <RevealedCellModal cell={room.revealedCell} selectedTarget={selectedTarget} />
        )}
      </AnimatePresence>
    </div>
  );
}
