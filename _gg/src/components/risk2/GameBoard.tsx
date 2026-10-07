'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRisk2Store } from '@/lib/risk2-store';
import { CARD_COLORS, SPECIAL_CARD_INFO, getCardStats, getGridCols } from '@/lib/risk2-types';
import type { Risk2Card, Risk2Player, CardColor } from '@/lib/risk2-types';
import { Bomb, SkipForward, Wallet, Play, AlertTriangle, ScrollText, RotateCcw, Sparkles } from 'lucide-react';

// ============================================================
// Stats Bar
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
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-900/40 border border-yellow-400/50 text-yellow-300">
        <span className="text-[10px] font-bold">×2</span>
        <span className="text-[10px] sm:text-xs font-bold">{stats.doubles}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-900/40 border border-amber-400/50 text-amber-300">
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
// Scoreboard — compact when > 4 players, expandable
// ============================================================
function Scoreboard({ players, currentPlayerIndex, targetScore }: {
  players: Risk2Player[];
  currentPlayerIndex: number;
  targetScore: number;
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const isMany = players.length > 4;
  const [expanded, setExpanded] = useState(!isMany);

  // Always show current player at top when collapsed
  const currentPlayer = players[currentPlayerIndex];

  // Compact single-line view for collapsed mode with many players
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
            <motion.div
              key={player.id}
              layout
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
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full rounded-full transition-all ${
                        progress >= 100 ? 'bg-yellow-400' : isCurrent ? 'bg-orange-500' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                )}
              </div>
              <span className={`text-xs font-black shrink-0 ${progress >= 100 ? 'text-yellow-400' : 'text-white'}`}>
                {player.score}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Drawn This Turn Display
// ============================================================
function DrawnThisTurn({ cards }: { cards: Risk2Card[] }) {
  if (cards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] text-slate-500 font-bold">بطاقات هذه الجولة:</span>
        <div className="flex-1 h-px bg-slate-800/50" />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {cards.map((card) => {
          const isGold = card.type === 'double' || card.type === 'triple';
          return (
          <motion.div
            key={card.id}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`w-10 h-12 sm:w-11 sm:h-[52px] rounded-lg flex flex-col items-center justify-center border-2 ${
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
          </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// Flip Card — 3D CSS card flip animation
// ============================================================
function FlipCard({ card, onClick }: { card: Risk2Card; onClick?: () => void }) {
  const canClick = !card.revealed && onClick;

  return (
    <motion.button
      whileTap={canClick ? { scale: 0.92 } : undefined}
      onClick={onClick}
      disabled={!canClick}
      className={`flip-card cursor-pointer ${canClick ? 'hover:z-10' : 'cursor-default'}`}
      style={{ perspective: '800px' }}
    >
      <div
        className={`relative w-full flip-card-inner ${card.revealed ? 'is-flipped' : ''}`}
        style={{ transitionDelay: '0.05s' }}
      >
        {/* FRONT — Face-down (the back of the card) */}
        <div className="flip-card-front absolute inset-0 rounded-xl border-2 border-slate-600/50 bg-gradient-to-br from-slate-800 via-slate-700/90 to-slate-800 flex items-center justify-center overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-1 rounded-lg border border-slate-600/20 bg-gradient-to-br from-slate-700/30 to-slate-800/30" />
          <div className="absolute inset-2 rounded-md border border-dashed border-slate-500/10" />
          {/* Center diamond */}
          <div className="relative z-10 w-5 h-5 rotate-45 border border-slate-500/30 bg-slate-700/40 flex items-center justify-center">
            <div className="w-2 h-2 rotate-0 bg-slate-500/20 rounded-full" />
          </div>
          {canClick && (
            <div className="absolute inset-0 rounded-xl hover:ring-2 hover:ring-orange-400/50 hover:border-orange-500/30 transition-all" />
          )}
        </div>

        {/* BACK — Revealed face */}
        <div className="flip-card-back rounded-xl border-2 overflow-hidden">
          {card.type === 'number' ? (
            <div className={`w-full h-full flex flex-col items-center justify-center ${CARD_COLORS[card.color as CardColor].bg} ${CARD_COLORS[card.color as CardColor].border}`}>
              {/* Corner number top-left */}
              <span className={`absolute top-0.5 left-1 text-[8px] font-bold ${CARD_COLORS[card.color as CardColor].text} opacity-60`}>
                {card.number}
              </span>
              {/* Center number */}
              <span className={`text-xl sm:text-2xl font-black ${CARD_COLORS[card.color as CardColor].text}`}>
                {card.number}
              </span>
              {/* Color dot */}
              <div className="mt-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: CARD_COLORS[card.color as CardColor].hex }} />
            </div>
          ) : (
            (() => {
              const isGold = card.type === 'double' || card.type === 'triple';
              const info = SPECIAL_CARD_INFO[card.type];
              return (
                <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${info.bg} ${info.border} ${isGold ? 'ring-1 ring-yellow-400/30 shadow-lg shadow-yellow-500/20' : ''}`}>
                  <span className={`text-2xl sm:text-3xl ${isGold ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}`}>
                    {info.emoji}
                  </span>
                  <span className="text-[8px] font-bold mt-0.5" style={{ color: info.color }}>
                    {info.label}
                  </span>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================
// Result Modal
// ============================================================
function ResultModal({
  card,
  currentPlayer,
  matchReason,
  turnState,
  onContinue,
  onBank,
  onAdvance,
  deckNumber,
}: {
  card: Risk2Card;
  currentPlayer: Risk2Player;
  matchReason: string;
  turnState: string;
  onContinue: () => void;
  onBank: () => void;
  onAdvance: () => void;
  deckNumber: number;
}) {
  const handleBackdropClick = () => {
    if (turnState === 'showing_result' || turnState === 'turn_lost' || turnState === 'bomb_exploded') {
      onAdvance();
    }
  };

  let title = '';
  let desc = '';
  let color = '#fff';
  const isGold = card.type === 'double' || card.type === 'triple';

  if (card.type === 'number') {
    const colorInfo = CARD_COLORS[card.color as CardColor];
    if (turnState === 'turn_lost') {
      title = '❌ خسرت الدور!';
      desc = matchReason;
      color = '#ef4444';
    } else {
      title = `${card.number} ${colorInfo.emoji}`;
      desc = `${colorInfo.label} — آمن!`;
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
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-900 border rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center ${isGold ? 'border-yellow-500/40 shadow-yellow-500/10' : 'border-slate-700'}`}
      >
        {/* Card Display */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.1 }}
          className="text-5xl mb-3"
        >
          {card.type === 'number'
            ? <span className="text-4xl" style={{ color }}><span className="text-2xl">{CARD_COLORS[card.color as CardColor].emoji}</span> {card.number}</span>
            : <span className={isGold ? 'drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]' : ''}>{SPECIAL_CARD_INFO[card.type].emoji}</span>
          }
        </motion.div>

        <h2 className="text-xl font-black mb-2" style={{ color }}>
          {title}
        </h2>

        <p className="text-sm text-slate-300 mb-1">{desc}</p>

        <p className="text-xs text-slate-500 mb-4">{currentPlayer.name}</p>

        {/* Score Info */}
        {card.type === 'number' && turnState === 'turn_lost' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-400 font-bold mb-4"
          >
            خسرت جميع نقاط الجولة!
          </motion.p>
        )}

        {/* Bomb info */}
        {card.type === 'bomb' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-400 font-bold mb-4"
          >
            💣 انفجار! خسرت جميع نقاط الجولة!
          </motion.p>
        )}

        {/* Action Buttons — show for waiting_for_decision (number + multiplier cards) */}
        {turnState === 'waiting_for_decision' && (
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              استمر ▶
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBank}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              احفظ 💰 ({currentPlayer.roundScore} نقطة)
            </motion.button>
          </div>
        )}

        {/* Universal continue for showing_result / turn_lost / bomb_exploded */}
        {(turnState === 'showing_result' || turnState === 'turn_lost' || turnState === 'bomb_exploded') && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdvance}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            متابعة ▶
          </motion.button>
        )}
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
// Game Log Panel
// ============================================================
function GameLogPanel() {
  const { gameLog } = useRisk2Store();
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameLog, isOpen]);

  return (
    <div className="w-full max-w-lg mx-auto mt-1">
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
        <div className="mt-1 max-h-[40vh] overflow-y-auto bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1">
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
// Main GameBoard
// ============================================================
export default function GameBoard() {
  const {
    players,
    currentPlayerIndex,
    cards,
    turnState,
    lastDrawnCard,
    drawnThisTurn,
    matchReason,
    deckNumber,
    config,
    drawCard,
    continueTurn,
    bankPoints,
    advanceTurn,
  } = useRisk2Store();

  const cols = getGridCols(cards.length);
  const currentPlayer = players[currentPlayerIndex];

  // Check if deck was just regenerated
  const [prevDeckNumber, setPrevDeckNumber] = useState(deckNumber);
  const [showNewDeck, setShowNewDeck] = useState(false);

  useEffect(() => {
    if (deckNumber > prevDeckNumber) {
      setShowNewDeck(true);
      const timer = setTimeout(() => setShowNewDeck(false), 3000);
      setPrevDeckNumber(deckNumber);
      return () => clearTimeout(timer);
    }
  }, [deckNumber, prevDeckNumber]);

  // Auto-advance bomb after 2.5 seconds
  useEffect(() => {
    if (turnState === 'bomb_exploded') {
      const timer = setTimeout(() => {
        advanceTurn();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [turnState, advanceTurn]);

  const shouldShowModal = (turnState === 'waiting_for_decision' || turnState === 'showing_result' || turnState === 'turn_lost' || turnState === 'bomb_exploded') && !!lastDrawnCard;

  if (!currentPlayer) return null;

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-2 sm:py-3" dir="rtl">
      {/* Title + Stats in one row */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between gap-2 mb-2">
        <div>
          <h1 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-300 to-amber-400">
            🎴 المجازفة 2
          </h1>
          <p className="text-[9px] text-slate-500">الهدف: {config.targetScore} | {cards.length} بطاقة</p>
        </div>
        <StatsBar cards={cards} />
      </div>

      {/* Scoreboard */}
      <div className="w-full mb-2">
        <Scoreboard
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          targetScore={config.targetScore}
        />
      </div>

      {/* New Deck Notification */}
      <AnimatePresence>
        {showNewDeck && <NewDeckNotification deckNumber={deckNumber} />}
      </AnimatePresence>

      {/* Turn Instruction */}
      <AnimatePresence mode="wait">
        {turnState === 'waiting_for_draw' && (
          <motion.div
            key="waiting_draw"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-lg mx-auto text-center py-1.5 px-4 rounded-xl border mb-2 bg-orange-950/30 border-orange-500/30 text-orange-300"
          >
            <p className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              اختر بطاقة — {currentPlayer.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawn This Turn */}
      {(turnState !== 'waiting_for_draw' || drawnThisTurn.length > 0) && (
        <div className="mb-2">
          <DrawnThisTurn cards={drawnThisTurn} />
        </div>
      )}

      {/* Card Grid with 3D Flip */}
      <div className="w-full max-w-lg mx-auto mb-2">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            perspective: '1200px',
          }}
        >
          {cards.map((card) => (
            <FlipCard
              key={card.id}
              card={card}
              onClick={
                turnState === 'waiting_for_draw' && !card.revealed
                  ? () => drawCard(card.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Bank button on the game board (always visible when player has round score > 0 and it's their turn) */}
      {turnState === 'waiting_for_draw' && currentPlayer.roundScore > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-lg mx-auto mb-2"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={bankPoints}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              <Wallet className="w-4 h-4" />
              احفظ النقاط 💰 ({currentPlayer.roundScore} نقطة)
            </motion.button>
          </motion.div>
        )}

      {/* Game Log */}
      <GameLogPanel />

      {/* Result Modal */}
      <AnimatePresence mode="wait">
        {shouldShowModal && turnState !== 'bomb_exploded' && (
          <ResultModal
            key={`modal-${lastDrawnCard!.id}-${turnState}`}
            card={lastDrawnCard!}
            currentPlayer={currentPlayer}
            matchReason={matchReason}
            turnState={turnState}
            onContinue={continueTurn}
            onBank={bankPoints}
            onAdvance={advanceTurn}
            deckNumber={deckNumber}
          />
        )}
      </AnimatePresence>

      {/* Bomb explosion overlay (auto-dismisses) */}
      <AnimatePresence>
        {turnState === 'bomb_exploded' && lastDrawnCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 20 }}
              transition={{ type: 'spring', damping: 8 }}
              className="bg-slate-900 border border-red-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-red-500/20 text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-6xl mb-3"
              >
                💣
              </motion.div>
              <h2 className="text-xl font-black text-red-400 mb-2">
                انفجار!
              </h2>
              <p className="text-sm text-slate-300 mb-1">
                {currentPlayer.name} خسر جميع نقاط الجولة!
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xs text-slate-500 mt-3"
              >
                جاري الانتقال تلقائياً...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
