'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRiskStore } from '@/lib/risk-store';
import { getCardStats, getGridCols, CARD_INFO, CARD_COLOR_CONFIG } from '@/lib/risk-types';
import type { RiskCard, RiskPlayer } from '@/lib/risk-types';
import { Bomb, Shield, CircleDot, ScrollText, FastForward, Wallet, Play, AlertTriangle } from 'lucide-react';

// ============================================================
// Stats Bar — shows remaining card counts
// ============================================================
function StatsBar({ cards }: { cards: RiskCard[] }) {
  const stats = getCardStats(cards);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-emerald-400">
        <Shield className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.numbers}</span>
        <span className="text-[9px] text-slate-500 hidden sm:inline">رقم</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-red-400">
        <Bomb className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.bombs}</span>
        <span className="text-[9px] text-slate-500 hidden sm:inline">قنبلة</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-400">
        <FastForward className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.skips}</span>
        <span className="text-[9px] text-slate-500 hidden sm:inline">تخطي</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-300">
        <CircleDot className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.hidden}</span>
        <span className="text-[9px] text-slate-500 hidden sm:inline">متبقي</span>
      </div>
    </div>
  );
}

// ============================================================
// Player Score Panel
// ============================================================
function PlayerScorePanel({
  player,
  isCurrent,
}: {
  player: RiskPlayer;
  isCurrent: boolean;
}) {
  return (
    <motion.div
      key={player.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-2.5 sm:p-3 transition-all ${
        isCurrent ? `ring-2 ring-${player.color.replace('text-', '')}/50` : ''
      } bg-slate-900/40 border-slate-700/30`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{player.emoji}</span>
          <span className={`text-xs sm:text-sm font-bold ${player.color}`}>{player.name}</span>
          {isCurrent && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white"
            >
              ◀ الآن
            </motion.span>
          )}
        </div>
        <div className="text-left">
          <p className="text-sm sm:text-base font-black text-white">{player.score}</p>
          {isCurrent && player.roundScore > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-emerald-400 font-bold"
            >
              +{player.roundScore} جولة
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Grid Card Component
// ============================================================
function GridCard({
  card,
  onClick,
}: {
  card: RiskCard;
  onClick?: () => void;
}) {
  const canClick = !card.revealed && onClick;
  const colorConfig = card.color ? CARD_COLOR_CONFIG[card.color] : null;

  return (
    <motion.button
      whileTap={canClick ? { scale: 0.9 } : undefined}
      onClick={onClick}
      disabled={!canClick}
      className={`relative rounded-lg overflow-hidden transition-all ${
        canClick
          ? 'cursor-pointer hover:ring-2 hover:ring-violet-400/50 hover:scale-[1.03] active:scale-95'
          : 'cursor-default'
      }`}
    >
      {card.revealed ? (
        <motion.div
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center relative"
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
                    : colorConfig
                      ? `linear-gradient(135deg, #0a1a10, #0a2a18)`
                      : 'linear-gradient(135deg, #0a1a10, #0a2a18)',
          }}
        >
          <div className="text-xl sm:text-2xl mb-0.5">
            {card.type === 'bomb' ? '💣' : card.type === 'skip' ? '⏭️' : card.type === 'double' ? '✨' : card.type === 'triple' ? '🔥' : `${colorConfig?.emoji || ''}`}
          </div>
          {card.type === 'number' && (
            <div className="text-xs sm:text-sm font-black text-white">+{card.value}</div>
          )}
        </motion.div>
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-slate-800 via-slate-700/80 to-slate-800 border-2 border-slate-600/40 rounded-lg flex items-center justify-center hover:border-violet-500/30 transition-colors">
          <div className="text-slate-600 text-[10px] sm:text-xs font-bold">
            {card.index + 1}
          </div>
        </div>
      )}
    </motion.button>
  );
}

// ============================================================
// Bomb Explosion Animation
// ============================================================
function BombExplosion({ onComplete }: { onComplete: () => void }) {
  const [particles] = useState(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      angle: (i / 20) * 360,
      distance: 50 + Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: ['#ef4444', '#f97316', '#eab308', '#dc2626'][Math.floor(Math.random() * 4)],
    }))
  );

  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 2], opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.8 }}
        className="absolute w-64 h-64 rounded-full bg-red-500/30 blur-2xl"
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0.5] }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative z-10 text-8xl"
      >
        💥
      </motion.div>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Result Modal
// ============================================================
function ResultModal({
  card,
  currentPlayer,
  roundMultiplier,
  lastMatchInfo,
  onContinue,
  onBank,
  onAdvance,
  turnState,
}: {
  card: RiskCard;
  currentPlayer: RiskPlayer;
  roundMultiplier: number;
  lastMatchInfo: { matched: boolean; matchType: 'color' | 'number' | null; matchWith: RiskCard | null; lostPoints: number; } | null;
  onContinue: () => void;
  onBank: () => void;
  onAdvance: () => void;
  turnState: string;
}) {
  const cardInfo = CARD_INFO[card.type];
  const colorConfig = card.color ? CARD_COLOR_CONFIG[card.color] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4"
      onClick={(turnState === 'showing_result' || turnState === 'turn_lost') ? onAdvance : undefined}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
      >
        {/* Turn lost state */}
        {turnState === 'turn_lost' && lastMatchInfo && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.1 }}
              className="text-6xl mb-4"
            >
              😱
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-black mb-2 text-red-400">
              تطابق!
            </h2>
            <p className="text-sm text-slate-300 mb-1">
              {lastMatchInfo.matchType === 'color'
                ? `اللون ${lastMatchInfo.matchWith?.color ? CARD_COLOR_CONFIG[lastMatchInfo.matchWith.color].labelAr : ''} تكرر!`
                : `الرقم ${lastMatchInfo.matchWith?.number} تكرر!`}
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 font-bold mb-4"
            >
              {currentPlayer.name} خسر {lastMatchInfo.lostPoints} نقطة!
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAdvance}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              متابعة ▶
            </motion.button>
          </>
        )}

        {/* Showing result state */}
        {turnState !== 'turn_lost' && (
          <>
            {/* Card type display */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.1 }}
              className="text-6xl mb-4"
            >
              {cardInfo.emoji}
            </motion.div>

            <h2
              className="text-xl sm:text-2xl font-black mb-2"
              style={{ color: cardInfo.color }}
            >
              {cardInfo.label}
            </h2>

            <p className="text-sm text-slate-300 mb-1">{cardInfo.desc}</p>

            {card.type === 'number' && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-black text-emerald-400 mb-1"
              >
                +{card.value} {roundMultiplier > 1 ? `×${roundMultiplier} = ${card.value * roundMultiplier}` : ''}
              </motion.p>
            )}

            {card.type === 'number' && colorConfig && (
              <p className="text-xs text-slate-500 mb-4">
                {colorConfig.emoji} {colorConfig.labelAr}
              </p>
            )}

            {card.type === 'bomb' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400 font-bold mb-4"
              >
                {currentPlayer.name} خسر {currentPlayer.roundScore} نقطة!
              </motion.p>
            )}

            {card.type === 'skip' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-400 mb-4"
              >
                تم تخطي دور {currentPlayer.name}
              </motion.p>
            )}

            {card.type === 'double' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-amber-400 font-bold mb-4"
              >
                المضاعف الآن: ×{roundMultiplier}
              </motion.p>
            )}

            {card.type === 'triple' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-purple-400 font-bold mb-4"
              >
                المضاعف الآن: ×{roundMultiplier}
              </motion.p>
            )}

            {/* Action buttons for number cards: continue or bank */}
            {card.type === 'number' && turnState === 'waiting_for_decision' && (
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

            {/* Universal continue button for showing_result state */}
            {turnState === 'showing_result' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAdvance}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                متابعة ▶
              </motion.button>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Game Log Panel
// ============================================================
function GameLogPanel() {
  const { gameLog } = useRiskStore();
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameLog, isOpen]);

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
          {gameLog.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4">لا تحركات بعد...</p>
          ) : (
            gameLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-slate-800/30 text-slate-300"
              >
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
// Main GameBoard Component
// ============================================================
export default function GameBoard() {
  const {
    players,
    currentPlayerIndex,
    cards,
    turnState,
    lastDrawnCard,
    roundMultiplier,
    lastMatchInfo,
    drawCard,
    continueTurn,
    bankPoints,
    advanceTurn,
  } = useRiskStore();

  // Explosion shows when bomb explodes (auto-transitions to showing_result)
  const showExplosion = turnState === 'bomb_exploded';

  const handleExplosionComplete = () => {
    const state = useRiskStore.getState();
    if (state.turnState === 'bomb_exploded') {
      useRiskStore.setState({ turnState: 'showing_result' });
    }
  };

  const cols = getGridCols(cards.length || 50);
  const currentPlayer = players[currentPlayerIndex];

  const shouldShowModal = (
    (turnState === 'waiting_for_decision' || turnState === 'showing_result' || turnState === 'turn_lost') &&
    !showExplosion &&
    !!lastDrawnCard
  );

  const handleDrawCard = (cardId: string) => {
    drawCard(cardId);
  };

  const handleContinue = () => {
    continueTurn();
  };

  const handleBank = () => {
    bankPoints();
  };

  const handleAdvance = () => {
    advanceTurn();
  };

  if (!currentPlayer) return null;

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-3 sm:py-4" dir="rtl">
      {/* Title */}
      <div className="text-center mb-3">
        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400">
          💣 المجازفة
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="mb-3 w-full">
        <StatsBar cards={cards} />
      </div>

      {/* Round Multiplier Badge */}
      {roundMultiplier > 1 && (
        <div className="mb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-bold"
          >
            {roundMultiplier >= 6 ? '🔥' : '✨'} المضاعف: ×{roundMultiplier}
          </motion.div>
        </div>
      )}

      {/* Player Turn Indicator */}
      <div className="mb-3">
        <motion.div
          key={currentPlayerIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-1.5 px-4 rounded-xl border-2 bg-slate-900/40 border-slate-700/30"
          style={{ borderColor: `${currentPlayer.colorHex}60` }}
        >
          <p className="text-xs sm:text-sm font-bold" style={{ color: currentPlayer.colorHex }}>
            {currentPlayer.emoji} دور {currentPlayer.name}
            {currentPlayer.roundScore > 0 && (
              <span className="text-emerald-400 mr-2">(+{currentPlayer.roundScore} جولة)</span>
            )}
          </p>
        </motion.div>
      </div>

      {/* Player Scores */}
      <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-2 sm:gap-3 mb-3">
        {players.map((player) => (
          <PlayerScorePanel
            key={player.id}
            player={player}
            isCurrent={player.id === currentPlayer.id}
          />
        ))}
      </div>

      {/* Interaction Instruction */}
      <AnimatePresence mode="wait">
        {turnState === 'waiting_for_draw' && (
          <motion.div
            key="waiting_draw"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-2xl mx-auto text-center py-2 px-4 rounded-xl border mb-3 bg-violet-950/30 border-violet-500/30 text-violet-300"
          >
            <p className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              اختر بطاقة — {currentPlayer.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Grid */}
      <div className="w-full max-w-2xl mx-auto mb-3">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {cards.map((card) => (
            <GridCard
              key={card.id}
              card={card}
              onClick={
                turnState === 'waiting_for_draw' && !card.revealed
                  ? () => handleDrawCard(card.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Game Log */}
      <GameLogPanel />

      {/* Bomb Explosion */}
      <AnimatePresence>
        {showExplosion && <BombExplosion onComplete={handleExplosionComplete} />}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence mode="wait">
        {shouldShowModal && currentPlayer && (
          <ResultModal
            key={`modal-${lastDrawnCard!.id}-${turnState}`}
            card={lastDrawnCard!}
            currentPlayer={currentPlayer}
            roundMultiplier={roundMultiplier}
            lastMatchInfo={lastMatchInfo}
            onContinue={handleContinue}
            onBank={handleBank}
            onAdvance={handleAdvance}
            turnState={turnState}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
