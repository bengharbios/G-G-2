'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrisonStore } from '@/lib/prison-store';
import { CELL_ITEMS, getRemainingItems, GRID_CONFIGS } from '@/lib/prison-types';
import type { CellItemType, PrisonTeam, PrisonPlayer, GridCell } from '@/lib/prison-types';
import { Skull, Lock, Key, Eye, SkipForward, ScrollText } from 'lucide-react';

// ============================================================
// Stats Bar — shows remaining items
// ============================================================
function StatsBar({ grid }: { grid: GridCell[] }) {
  const remaining = getRemainingItems(grid);

  const items: { type: CellItemType; icon: React.ReactNode; label: string; color: string }[] = [
    { type: 'skull', icon: <Skull className="w-3.5 h-3.5" />, label: 'إعدام', color: 'text-red-400' },
    { type: 'open', icon: <Lock className="w-3.5 h-3.5" />, label: 'فارغة', color: 'text-cyan-400' },
    { type: 'uniform', icon: <Eye className="w-3.5 h-3.5" />, label: 'ملابس', color: 'text-orange-400' },
    { type: 'key', icon: <Key className="w-3.5 h-3.5" />, label: 'مفتاح', color: 'text-yellow-400' },
    { type: 'skip', icon: <SkipForward className="w-3.5 h-3.5" />, label: 'ممتلئة', color: 'text-slate-400' },
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
          <span className="text-[9px] text-slate-500 hidden sm:inline">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Team Indicator
// ============================================================
function TeamIndicator({ team, teamName }: { team: PrisonTeam; teamName: string }) {
  const isAlpha = team === 'alpha';
  return (
    <motion.div
      key={team}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-center py-1.5 px-4 rounded-xl border-2 ${
        isAlpha
          ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
          : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
      }`}
    >
      <p className="text-xs sm:text-sm font-bold">
        {isAlpha ? '🟡' : '🔵'} دور فريق {teamName}
      </p>
    </motion.div>
  );
}

// ============================================================
// Player Panel — shows team players with status
// ============================================================
function PlayerPanel({
  team,
  teamName,
  players,
  currentPlayerId,
  interactionState,
  onSelectPlayer,
}: {
  team: PrisonTeam;
  teamName: string;
  players: PrisonPlayer[];
  currentPlayerId: string | null;
  interactionState: string;
  onSelectPlayer: (id: string) => void;
}) {
  const isAlpha = team === 'alpha';
  const teamPlayers = players.filter((p) => p.team === team);
  const isCurrentTeam = interactionState.startsWith('waiting_for_') || interactionState === 'showing_result';

  return (
    <div className={`rounded-xl border p-3 ${
      isAlpha
        ? 'border-amber-500/30 bg-amber-950/20'
        : 'border-cyan-500/30 bg-cyan-950/20'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs">{isAlpha ? '🟡' : '🔵'}</span>
        <h3 className={`text-xs font-bold ${isAlpha ? 'text-amber-300' : 'text-cyan-300'}`}>
          {teamName}
        </h3>
        <span className="text-[10px] text-slate-500">
          ({teamPlayers.filter((p) => p.status !== 'executed').length} حي)
        </span>
      </div>

      <div className="space-y-1.5">
        {teamPlayers.map((player) => {
          const isActive = player.status === 'active';
          const isImprisoned = player.status === 'imprisoned';
          const isExecuted = player.status === 'executed';
          const isCurrentPlayer = player.id === currentPlayerId;

          const canSelect =
            interactionState === 'waiting_for_player' &&
            isActive &&
            player.team === team;

          return (
            <motion.button
              key={player.id}
              whileTap={canSelect ? { scale: 0.97 } : undefined}
              onClick={() => canSelect && onSelectPlayer(player.id)}
              disabled={!canSelect}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                isCurrentPlayer
                  ? isAlpha
                    ? 'bg-amber-900/40 border border-amber-500/50 text-amber-200 shadow-lg shadow-amber-950/30'
                    : 'bg-cyan-900/40 border border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-950/30'
                  : isExecuted
                    ? 'bg-red-950/20 border border-red-900/20 text-red-400/50 line-through'
                    : isImprisoned
                      ? 'bg-orange-950/20 border border-orange-900/20 text-orange-400/70'
                      : canSelect
                        ? 'bg-slate-800/60 border border-slate-700/30 text-slate-200 hover:border-amber-500/40 hover:bg-slate-800/80 cursor-pointer'
                        : 'bg-slate-800/40 border border-slate-700/20 text-slate-400'
              }`}
            >
              <span className="shrink-0">
                {isExecuted ? '💀' : isImprisoned ? '🏚️' : isActive ? '✅' : ''}
              </span>
              <span className="flex-1 truncate">{player.name}</span>
              {isImprisoned && (
                <span className="text-[9px] bg-orange-900/40 px-1.5 py-0.5 rounded text-orange-300">
                  مسجون {player.uniformCount}x
                </span>
              )}
              {isCurrentPlayer && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-[9px] bg-amber-900/40 px-1.5 py-0.5 rounded text-amber-300"
                >
                  اللعب
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Grid Cell Component
// ============================================================
function GridCellComponent({
  cell,
  cols,
  onClick,
}: {
  cell: GridCell;
  cols: number;
  onClick?: () => void;
}) {
  const item = CELL_ITEMS[cell.type];

  return (
    <motion.button
      whileTap={cell.status === 'hidden' && onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={!onClick}
      className={`relative rounded-xl overflow-hidden transition-all ${
        cell.status === 'hidden'
          ? 'cursor-pointer hover:ring-2 hover:ring-amber-400/50 hover:scale-[1.02]'
          : 'cursor-default'
      }`}
      style={{ aspectRatio: '1/1' }}
    >
      {cell.status === 'hidden' ? (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border-2 border-slate-600/50 rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
              {cell.index + 1}
            </span>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 rounded-xl flex items-center justify-center relative"
          style={{ borderColor: `${item.color}40` }}
        >
          <div className="relative w-[70%] h-[70%]">
            <img
              src={item.img}
              alt={item.title}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 py-0.5 text-center text-[8px] sm:text-[9px] font-bold rounded-b-lg"
            style={{ backgroundColor: `${item.color}30`, color: item.color }}
          >
            {item.label}
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

// ============================================================
// Result Modal — shows what was revealed
// ============================================================
function ResultModal({
  cell,
  interactionState,
  currentPlayerName,
  selectedTargetName,
  onAction,
  onClose,
}: {
  cell: GridCell;
  interactionState: string;
  currentPlayerName: string;
  selectedTargetName: string | null;
  onAction: () => void;
  onClose: () => void;
}) {
  const item = CELL_ITEMS[cell.type];

  let actionLabel = 'متابعة';
  if (cell.type === 'open' && interactionState === 'picking_opponent_jail') {
    actionLabel = 'اختر لاعب للسجن';
  } else if (cell.type === 'key' && interactionState === 'picking_teammate_free') {
    actionLabel = 'اختر سجين للتحرير';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={(interactionState === 'showing_result' && cell.type !== 'open' && cell.type !== 'key') ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
      >
        {/* Item Image */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.1 }}
          className="w-24 h-24 mx-auto mb-4 relative"
        >
          <img
            src={item.img}
            alt={item.title}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </motion.div>

        {/* Title */}
        <h2
          className="text-xl sm:text-2xl font-black mb-2"
          style={{ color: item.color }}
        >
          {item.emoji} {item.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-300 mb-1">{item.desc}</p>

        {/* Current player info */}
        <p className="text-xs text-slate-500 mb-4">
          {currentPlayerName}
        </p>

        {/* Target info (if applicable) */}
        {selectedTargetName && interactionState === 'showing_result' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-bold text-slate-200 mb-4"
          >
            {cell.type === 'open' && `🏚️ تم سجن ${selectedTargetName}!`}
            {cell.type === 'key' && `🔓 تم تحرير ${selectedTargetName}!`}
          </motion.p>
        )}

        {/* Action buttons */}
        {interactionState === 'showing_result' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAction}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white transition-all cursor-pointer"
          >
            متابعة ▶
          </motion.button>
        ) : (
          <p className="text-sm font-bold text-slate-300 py-2">
            {actionLabel}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Player Selection Overlay — for picking opponent or teammate
// ============================================================
function PlayerSelectionOverlay({
  title,
  players,
  onSelect,
  icon,
}: {
  title: string;
  players: PrisonPlayer[];
  onSelect: (id: string) => void;
  icon: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 p-4"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 max-w-sm w-full shadow-2xl"
      >
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">{icon}</div>
          <h3 className="text-base font-bold text-slate-200">{title}</h3>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {players.map((player) => (
            <motion.button
              key={player.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(player.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-amber-500/50 transition-all text-right cursor-pointer"
            >
              <span className="text-lg">👤</span>
              <span className="text-sm font-bold text-slate-200">{player.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Game Log Panel — collapsible log
// ============================================================
function GameLogPanel() {
  const { gameLog } = usePrisonStore();
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameLog, isOpen]);

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
                  entry.team === 'alpha'
                    ? 'bg-amber-950/30 text-amber-300'
                    : 'bg-cyan-950/30 text-cyan-300'
                }`}
              >
                <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
                <span className="flex-1">{entry.action}</span>
                <span className="text-[10px] opacity-60">{CELL_ITEMS[entry.itemType].emoji}</span>
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
    grid,
    gridSize,
    currentTeam,
    alphaName,
    betaName,
    players,
    currentPlayerId,
    interactionState,
    revealedCell,
    selectedTargetId,
    selectPlayer,
    revealCell,
    imprisonOpponent,
    freeTeammate,
    advanceTurn,
    closeModal,
  } = usePrisonStore();

  const config = GRID_CONFIGS[gridSize];
  const cols = config?.cols ?? 4;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const selectedTarget = players.find((p) => p.id === selectedTargetId);
  const opponentTeam: PrisonTeam = currentTeam === 'alpha' ? 'beta' : 'alpha';

  // Players available for targeting
  const activeOpponents = players.filter(
    (p) => p.team === opponentTeam && p.status === 'active'
  );
  const imprisonedTeammates = players.filter(
    (p) => p.team === currentTeam && p.status === 'imprisoned'
  );

  // Active players on current team
  const activeCurrentTeamPlayers = players.filter(
    (p) => p.team === currentTeam && p.status === 'active'
  );

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-3 sm:py-4" dir="rtl">
      {/* Title */}
      <div className="text-center mb-3">
        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400">
          🔒 السجن
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="mb-3 w-full">
        <StatsBar grid={grid} />
      </div>

      {/* Team Turn Indicator */}
      <div className="mb-3">
        <TeamIndicator team={currentTeam} teamName={currentTeam === 'alpha' ? alphaName : betaName} />
      </div>

      {/* Player Panels */}
      <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-2 sm:gap-3 mb-4">
        <PlayerPanel
          team="alpha"
          teamName={alphaName}
          players={players}
          currentPlayerId={currentPlayerId}
          interactionState={interactionState}
          onSelectPlayer={selectPlayer}
        />
        <PlayerPanel
          team="beta"
          teamName={betaName}
          players={players}
          currentPlayerId={currentPlayerId}
          interactionState={interactionState}
          onSelectPlayer={selectPlayer}
        />
      </div>

      {/* Interaction Instruction */}
      <AnimatePresence mode="wait">
        {interactionState === 'waiting_for_player' && (
          <motion.div
            key="waiting_player"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`w-full max-w-md mx-auto text-center py-2 px-4 rounded-xl border mb-3 ${
              currentTeam === 'alpha'
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <p className="text-xs sm:text-sm font-bold">
              👆 اختر لاعب من فريق {currentTeam === 'alpha' ? alphaName : betaName}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {activeCurrentTeamPlayers.length} لاعب متاح
            </p>
          </motion.div>
        )}

        {interactionState === 'waiting_for_cell' && currentPlayer && (
          <motion.div
            key="waiting_cell"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-md mx-auto text-center py-2 px-4 rounded-xl border mb-3 bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
          >
            <p className="text-xs sm:text-sm font-bold">
              🔓 اختر زنزانة — {currentPlayer.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="w-full max-w-md mx-auto mb-3">
        <div
          className="grid gap-2 sm:gap-2.5"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {grid.map((cell) => (
            <GridCellComponent
              key={cell.id}
              cell={cell}
              cols={cols}
              onClick={
                interactionState === 'waiting_for_cell' && cell.status === 'hidden'
                  ? () => revealCell(cell.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Game Log */}
      <GameLogPanel />

      {/* ================================ */}
      {/* Overlays                         */}
      {/* ================================ */}

      {/* Result Modal */}
      <AnimatePresence>
        {interactionState === 'showing_result' && revealedCell && (
          <ResultModal
            cell={revealedCell}
            interactionState={interactionState}
            currentPlayerName={currentPlayer?.name ?? ''}
            selectedTargetName={selectedTarget?.name ?? null}
            onAction={advanceTurn}
            onClose={closeModal}
          />
        )}

        {/* Picking opponent to jail (open cell) */}
        {interactionState === 'picking_opponent_jail' && revealedCell && (
          <ResultModal
            cell={revealedCell}
            interactionState={interactionState}
            currentPlayerName={currentPlayer?.name ?? ''}
            selectedTargetName={null}
            onAction={advanceTurn}
            onClose={closeModal}
          />
        )}

        {/* Picking teammate to free (key cell) */}
        {interactionState === 'picking_teammate_free' && revealedCell && (
          <ResultModal
            cell={revealedCell}
            interactionState={interactionState}
            currentPlayerName={currentPlayer?.name ?? ''}
            selectedTargetName={null}
            onAction={advanceTurn}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* Player Selection: Opponent to Jail */}
      <AnimatePresence>
        {interactionState === 'picking_opponent_jail' && activeOpponents.length > 0 && (
          <PlayerSelectionOverlay
            title={`اختر لاعب من فريق ${opponentTeam === 'alpha' ? alphaName : betaName} للسجن`}
            players={activeOpponents}
            onSelect={imprisonOpponent}
            icon="🏚️"
          />
        )}
      </AnimatePresence>

      {/* Player Selection: Teammate to Free */}
      <AnimatePresence>
        {interactionState === 'picking_teammate_free' && imprisonedTeammates.length > 0 && (
          <PlayerSelectionOverlay
            title={`اختر سجين من فريق ${currentTeam === 'alpha' ? alphaName : betaName} للتحرير`}
            players={imprisonedTeammates}
            onSelect={freeTeammate}
            icon="🔓"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
