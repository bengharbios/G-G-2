'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTabotStore } from '@/lib/tabot-store';
import { Home, RotateCcw, X, Skull, Lock, Unlock } from 'lucide-react';
import {
  Door,
  DoorOutcome,
  OUTCOME_CONFIG,
  TEAM_CONFIG,
  getOpposingTeam,
  getTeamInfo,
} from '@/lib/tabot-types';

// ─── Animations ────────────────────────────────────────────────────────

const doorReveal = {
  hidden: { rotateY: 0 },
  revealed: { rotateY: 180 },
};

const overlayFade = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

// ─── Main Game Board ───────────────────────────────────────────────────

export default function TabotGameBoard() {
  const store = useTabotStore();
  const {
    phase,
    doors,
    players,
    currentPlayerIndex,
    lastRevealedDoor,
    showImprisonPicker,
    showFreePicker,
    teamAlphaName,
    teamBetaName,
    currentRound,
    revealDoor,
    nextTurn,
    imprisonPlayer,
    freePlayer,
    skipImprison,
    skipFree,
    resetGame,
    setPhase,
  } = store;

  const [showResult, setShowResult] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const currentPlayer = players[currentPlayerIndex];
  const alphaInfo = getTeamInfo(players, 'alpha');
  const betaInfo = getTeamInfo(players, 'beta');

  // Show result overlay when a door is revealed
  useEffect(() => {
    if (lastRevealedDoor) {
      setShowResult(true);
    }
  }, [lastRevealedDoor]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.gameLog]);

  const handleDoorClick = useCallback(
    (door: Door) => {
      if (door.isRevealed || showResult || showImprisonPicker || showFreePicker) return;
      if (!currentPlayer || !currentPlayer.isAlive || currentPlayer.isImprisoned) return;
      revealDoor(door.id);
    },
    [currentPlayer, showResult, showImprisonPicker, showFreePicker, revealDoor]
  );

  const handleDismissResult = useCallback(() => {
    setShowResult(false);
    // If no pickers shown and game not over, auto-advance
    if (!showImprisonPicker && !showFreePicker && phase !== 'game_over') {
      // Give time for player to see the result before advancing
      setTimeout(() => {
        nextTurn();
      }, 300);
    }
  }, [showImprisonPicker, showFreePicker, phase, nextTurn]);

  const handleImprison = useCallback(
    (targetId: string) => {
      imprisonPlayer(targetId);
      setTimeout(() => {
        nextTurn();
      }, 500);
    },
    [imprisonPlayer, nextTurn]
  );

  const handleFree = useCallback(
    (targetId: string) => {
      freePlayer(targetId);
      setTimeout(() => {
        nextTurn();
      }, 500);
    },
    [freePlayer, nextTurn]
  );

  const handleReset = () => {
    resetGame();
    setPhase('landing');
    setShowResetConfirm(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-100px)] flex flex-col items-center px-2 py-3 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-gray-950 to-black -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/15 via-transparent to-transparent -z-10" />

      {/* Team status bar */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 mb-3 px-1">
        {/* Alpha team */}
        <TeamStatusBadge team={alphaInfo} isActive={currentPlayer?.team === 'alpha'} />

        {/* Round badge */}
        <div className="text-xs text-slate-500 font-bold px-2 py-1 rounded-lg bg-gray-900/50 border border-gray-800/50">
          📋 الجولة {currentRound}
        </div>

        {/* Beta team */}
        <TeamStatusBadge team={betaInfo} isActive={currentPlayer?.team === 'beta'} />
      </div>

      {/* Current player banner */}
      {currentPlayer && currentPlayer.isAlive && !currentPlayer.isImprisoned && (
        <motion.div
          key={currentPlayer.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md flex items-center justify-center gap-2 py-2 px-4 rounded-xl mb-3 border ${
            currentPlayer.team === 'alpha'
              ? 'bg-red-950/30 border-red-900/30'
              : 'bg-blue-950/30 border-blue-900/30'
          }`}
        >
          <span className="text-sm">
            {currentPlayer.team === 'alpha' ? '👹' : '🦇'}
          </span>
          <span className={`text-sm font-bold ${
            currentPlayer.team === 'alpha' ? 'text-red-400' : 'text-blue-400'
          }`}>
            دور: {currentPlayer.name}
          </span>
        </motion.div>
      )}

      {/* 4x4 Door Grid */}
      <div className="w-full max-w-md">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {doors.map((door) => (
            <DoorButton
              key={door.id}
              door={door}
              onClick={() => handleDoorClick(door)}
              disabled={showResult || showImprisonPicker || showFreePicker}
            />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-md flex items-center justify-between mt-3 px-1">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>خروج</span>
        </button>

        <button
          onClick={() => setShowLog(true)}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-300 transition-colors"
        >
          <span>📋 السجل</span>
        </button>
      </div>

      {/* ─── OVERLAYS ─── */}

      {/* Result overlay */}
      <AnimatePresence>
        {showResult && lastRevealedDoor && (
          <ResultOverlay
            door={lastRevealedDoor}
            currentPlayerName={currentPlayer?.name || ''}
            onDismiss={handleDismissResult}
          />
        )}
      </AnimatePresence>

      {/* Imprison picker */}
      <AnimatePresence>
        {showImprisonPicker && currentPlayer && (
          <PlayerPicker
            title="⚰️ اختر لاعب خصم ليحبس!"
            players={players.filter(
              p => p.team === getOpposingTeam(currentPlayer.team) && p.isAlive && !p.isImprisoned
            )}
            onPick={handleImprison}
            onSkip={skipImprison}
            skipLabel="تخطى"
            playerIcon={<Lock className="w-4 h-4 text-amber-500" />}
          />
        )}
      </AnimatePresence>

      {/* Free picker */}
      <AnimatePresence>
        {showFreePicker && currentPlayer && (
          <PlayerPicker
            title="🧹 اختر زميلك المحبوس ليحرره!"
            players={players.filter(
              p => p.team === currentPlayer.team && p.isImprisoned && p.isAlive
            )}
            onPick={handleFree}
            onSkip={skipFree}
            skipLabel="تخطى"
            playerIcon={<Unlock className="w-4 h-4 text-emerald-500" />}
          />
        )}
      </AnimatePresence>

      {/* Game log */}
      <AnimatePresence>
        {showLog && (
          <GameLogSheet log={store.gameLog} onClose={() => setShowLog(false)} />
        )}
      </AnimatePresence>

      {/* Reset confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-xs w-full text-center"
            >
              <p className="text-white font-bold mb-4">هل تريد إنهاء اللعبة؟</p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 text-slate-400 border border-slate-700"
                >
                  لا
                </Button>
                <Button
                  onClick={handleReset}
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold"
                >
                  نعم
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Door Button Component ─────────────────────────────────────────────

function DoorButton({
  door,
  onClick,
  disabled,
}: {
  door: Door;
  onClick: () => void;
  disabled: boolean;
}) {
  const config = door.isRevealed ? OUTCOME_CONFIG[door.outcome] : null;

  return (
    <motion.button
      whileTap={!disabled && !door.isRevealed ? { scale: 0.95 } : undefined}
      onClick={door.isRevealed ? undefined : onClick}
      disabled={disabled || door.isRevealed}
      className={`
        relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300
        ${door.isRevealed
          ? 'cursor-default'
          : 'cursor-pointer hover:scale-[1.03] hover:shadow-lg hover:shadow-red-900/20 active:scale-95'
        }
        ${disabled && !door.isRevealed ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Door background */}
      <div className={`absolute inset-0 flex items-center justify-center ${
        door.isRevealed
          ? `${config!.bgColor} border ${config!.borderColor}`
          : 'bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900 border border-gray-700/40 hover:border-red-800/50'
      }`}>
        {/* Door content */}
        {door.isRevealed ? (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-2xl sm:text-3xl">{config!.emoji}</span>
            <span className={`text-[9px] sm:text-[10px] font-bold ${config!.color}`}>
              {config!.label}
            </span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl sm:text-3xl opacity-70">🪦</span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-bold">
              {door.id}
            </span>
          </div>
        )}
      </div>

      {/* Revealed door overlay line */}
      {door.isRevealed && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
          door.outcome === 'empty' ? 'bg-slate-600' :
          door.outcome === 'full' ? 'bg-amber-500' :
          door.outcome === 'free' ? 'bg-emerald-500' :
          door.outcome === 'ghost' ? 'bg-red-500' :
          'bg-purple-500'
        }`} />
      )}
    </motion.button>
  );
}

// ─── Result Overlay ────────────────────────────────────────────────────

function ResultOverlay({
  door,
  currentPlayerName,
  onDismiss,
}: {
  door: Door;
  currentPlayerName: string;
  onDismiss: () => void;
}) {
  const config = OUTCOME_CONFIG[door.outcome];

  return (
    <motion.div
      variants={overlayFade}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onDismiss}
      className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center px-4 cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.5, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 30 }}
        transition={{ type: 'spring', stiffness: 250, damping: 20 }}
        className={`relative max-w-sm w-full rounded-2xl border ${config.borderColor} ${config.bgColor} p-6 text-center`}
      >
        {/* Large emoji */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 1.5, repeat: 2 }}
          className="text-6xl mb-4"
        >
          {config.emoji}
        </motion.div>

        {/* Outcome label */}
        <h3 className={`text-2xl font-black ${config.color} mb-2`}>
          {config.label}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-4">
          {config.description}
        </p>

        {/* Door number */}
        <div className="text-xs text-slate-600">
          الباب رقم {door.id} — {currentPlayerName}
        </div>

        {/* Dismiss hint */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-4 text-xs text-slate-500"
        >
          اضغط للمتابعة
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Player Picker ─────────────────────────────────────────────────────

function PlayerPicker({
  title,
  players,
  onPick,
  onSkip,
  skipLabel,
  playerIcon,
}: {
  title: string;
  players: { id: string; name: string; team: string }[];
  onPick: (id: string) => void;
  onSkip: () => void;
  skipLabel: string;
  playerIcon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 max-w-sm w-full"
      >
        <h3 className="text-center text-lg font-bold text-white mb-4">
          {title}
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {players.map((player) => (
            <motion.button
              key={player.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPick(player.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                player.team === 'alpha'
                  ? 'border-red-800/40 bg-red-950/30 hover:bg-red-950/50'
                  : 'border-blue-800/40 bg-blue-950/30 hover:bg-blue-950/50'
              }`}
            >
              {playerIcon}
              <span className="text-sm text-white font-bold">{player.name}</span>
            </motion.button>
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-slate-500 hover:text-slate-300 border border-slate-700/50"
        >
          {skipLabel}
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Team Status Badge ─────────────────────────────────────────────────

function TeamStatusBadge({
  team,
  isActive,
}: {
  team: { id: string; name: string; icon: string; color: string; aliveCount: number; imprisonedCount: number };
  isActive: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
      isActive
        ? `${team.id === 'alpha' ? 'bg-red-950/40 border-red-800/50' : 'bg-blue-950/40 border-blue-800/50'}`
        : 'bg-gray-900/50 border-gray-800/50'
    }`}>
      <span className="text-sm">{team.icon}</span>
      <div className="flex flex-col">
        <span className={`text-[10px] font-bold ${team.color} leading-tight`}>
          {team.name}
        </span>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
          <span className="text-emerald-500">✓{team.aliveCount}</span>
          <span className="text-amber-500">🔒{team.imprisonedCount}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Game Log Sheet ────────────────────────────────────────────────────

function GameLogSheet({
  log,
  onClose,
}: {
  log: { round: number; message: string; timestamp: number }[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md bg-gray-950 border-t border-gray-800 rounded-t-2xl max-h-[70vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
          <h3 className="text-sm font-bold text-white">📋 سجل اللعبة</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {log.map((entry, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-slate-600 shrink-0 w-5 text-right">{entry.round}</span>
              <span className="text-slate-300">{entry.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </motion.div>
    </motion.div>
  );
}
