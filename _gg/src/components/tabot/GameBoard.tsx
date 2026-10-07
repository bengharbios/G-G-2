'use client';

import { useTabotStore } from '@/lib/tabot-store';
import {
  getTeamInfo,
  getActiveMembers,
  TEAM_CONFIG,
  ROLE_CONFIG,
  TabotTeam,
  Player,
} from '@/lib/tabot-types';
import DoorCard from './DoorCard';
import PenaltyDialog from './PenaltyDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Crown, Hand } from 'lucide-react';

// ============================================================
// Player Row Component — Visual styling for states (NO emoji)
// ============================================================

function PlayerRow({ player }: { player: Player }) {
  return (
    <motion.div
      layout
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300
        ${player.status === 'active' ? 'bg-white/5' : ''}
        ${player.status === 'imprisoned' ? 'opacity-60' : ''}
        ${player.status === 'killed' ? 'opacity-30' : ''}
      `}
    >
      {/* Avatar */}
      <span className="text-lg">{player.avatar}</span>

      {/* Name with role badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`
              text-xs sm:text-sm font-bold truncate
              ${player.status === 'killed' ? 'line-through text-red-300/60' : 'text-slate-200'}
            `}
          >
            {player.name}
          </span>
          {/* Role badge (leader/deputy) — small and inline */}
          {player.role === 'leader' && (
            <span className="text-[10px] text-amber-400 shrink-0" title="قائد">👑</span>
          )}
          {player.role === 'deputy' && (
            <span className="text-[10px] text-blue-400 shrink-0" title="نائب">⭐</span>
          )}
        </div>
      </div>

      {/* Chain indicator for imprisoned */}
      {player.status === 'imprisoned' && (
        <span className="text-amber-500/60 text-xs shrink-0">⛓️</span>
      )}

      {/* Death indicator for killed */}
      {player.status === 'killed' && (
        <span className="text-red-500/40 text-xs shrink-0">💀</span>
      )}
    </motion.div>
  );
}

// ============================================================
// Current Team Panel — Shows ONLY the current team
// ============================================================

function CurrentTeamPanel({
  teamId,
  teamName,
}: {
  teamId: TabotTeam;
  teamName: string;
}) {
  const { players, currentPlayerIndex } = useTabotStore();
  const teamInfo = getTeamInfo(players, teamId, teamName);
  const config = TEAM_CONFIG[teamId];

  return (
    <motion.div
      key={teamId}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border overflow-hidden ${
        teamId === 'alpha'
          ? 'border-red-500/30 bg-gradient-to-b from-red-950/30 to-slate-900/50'
          : 'border-blue-500/30 bg-gradient-to-b from-blue-950/30 to-slate-900/50'
      }`}
    >
      {/* Team header */}
      <div className={`px-3 py-2 border-b ${
        teamId === 'alpha' ? 'border-red-500/20 bg-red-950/30' : 'border-blue-500/20 bg-blue-950/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <span className={`text-sm font-bold ${config.color}`}>{teamInfo.name}</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className="text-emerald-400">نشط {teamInfo.activeCount}</span>
            <span className="text-amber-400">حبس {teamInfo.imprisonedCount}</span>
            <span className="text-red-400">قتل {teamInfo.killedCount}</span>
          </div>
        </div>
      </div>

      {/* Players list — display only, no click handling here */}
      <div className="p-2 space-y-0.5 max-h-40 overflow-y-auto mafia-scrollbar">
        {teamInfo.players.map((player) => {
          return <PlayerRow key={player.id} player={player} />;
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// Leader Picker Dialog — Popup for leader to choose who opens
// ============================================================

function LeaderPickerDialog() {
  const { players, currentTeam, teamAlphaName, teamBetaName, selectPicker } = useTabotStore();

  const teamName = currentTeam === 'alpha' ? teamAlphaName : teamBetaName;
  const config = TEAM_CONFIG[currentTeam];
  const teamMembers = players.filter(
    p => p.team === currentTeam && p.status === 'active' && p.role !== 'guest'
  );
  const leader = players.find(p => p.team === currentTeam && p.role === 'leader');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        className="bg-[#1a1025] border border-amber-700/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-4">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl mb-2"
          >
            👑
          </motion.div>
          <h3 className="text-lg font-bold text-amber-300">القائد يختار</h3>
          <p className="text-xs text-slate-400">
            {config.icon} {teamName} — اختر من يفتح الباب
          </p>
          {leader && (
            <p className="text-[10px] text-amber-500/70 mt-1">
              القائد: {leader.name}
            </p>
          )}
        </div>

        {/* Player selection */}
        <div className="space-y-2 max-h-60 overflow-y-auto mafia-scrollbar">
          {teamMembers.map((player, i) => (
            <motion.button
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectPicker(player.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 hover:bg-amber-950/20"
            >
              <span className="text-xl">{player.avatar}</span>
              <div className="flex-1 text-right">
                <span className="text-sm font-bold text-slate-200">{player.name}</span>
                <span className="text-[10px] text-slate-500 block">
                  {ROLE_CONFIG[player.role].emoji} {ROLE_CONFIG[player.role].label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Game Log
// ============================================================

function GameLog({ defaultExpanded = true }: { defaultExpanded?: boolean }) {
  const { roundLog } = useTabotStore();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [roundLog]);

  return (
    <div className="border-t border-purple-800/30 bg-black/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <span className="text-xs font-bold text-slate-400">📋 سجل الأحداث ({roundLog.length})</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 200 }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div
              ref={logRef}
              className="px-3 pb-3 space-y-1 overflow-y-auto max-h-48 mafia-scrollbar"
            >
              {roundLog.map((entry, i) => (
                <div
                  key={i}
                  className={`text-[11px] px-2 py-1 rounded ${
                    entry.type === 'danger' ? 'text-red-300/80 bg-red-950/20' :
                    entry.type === 'success' ? 'text-emerald-300/80 bg-emerald-950/20' :
                    entry.type === 'system' ? 'text-amber-300/80 bg-amber-950/20 font-bold' :
                    entry.type === 'action' ? 'text-purple-300/80 bg-purple-950/20' :
                    'text-slate-400/80'
                  }`}
                >
                  <span className="text-slate-600 ml-1">R{entry.round}</span>
                  {entry.message}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// MAIN GAME BOARD
// ============================================================

export default function GameBoard() {
  const {
    doors,
    currentTeam,
    teamAlphaName,
    teamBetaName,
    players,
    interactionState,
    revealDoor,
    advanceTurn,
    currentPlayerIndex,
  } = useTabotStore();

  // Determine what the door grid should look like
  const isWaitingForPlayer = interactionState === 'waiting_for_player';
  const isWaitingForLeader = interactionState === 'waiting_for_leader';
  const isShowingResult = interactionState === 'showing_result';
  const isInteracting = [
    'picking_enemy_imprison',
    'picking_enemy_kill',
    'picking_teammate_free',
    'voting_teammate_imprison',
  ].includes(interactionState);

  const currentTeamName = currentTeam === 'alpha' ? teamAlphaName : teamBetaName;
  const teamConfig = TEAM_CONFIG[currentTeam];
  const openedDoors = doors.filter(d => d.isRevealed).length;

  return (
    <div className="flex flex-col min-h-full" dir="rtl">
      {/* Main content area */}
      <div className="flex-1 flex flex-col gap-3 p-3 sm:p-4 max-w-lg mx-auto w-full">
        {/* Turn Indicator */}
        <motion.div
          key={`${currentTeam}-${interactionState}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-3 text-center ${
            currentTeam === 'alpha'
              ? 'border-red-500/30 bg-red-950/20'
              : 'border-blue-500/30 bg-blue-950/20'
          }`}
        >
          {/* Waiting for leader */}
          {isWaitingForLeader && (
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">القائد يختار من يفتح الباب</span>
              </div>
              <p className="text-[10px] text-slate-500">
                {teamConfig.icon} {currentTeamName}
              </p>
            </div>
          )}

          {/* Waiting for player to pick door */}
          {isWaitingForPlayer && (
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Hand className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300">
                  {players[currentPlayerIndex]?.name} — اختر باباً
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {teamConfig.icon} {currentTeamName}
              </p>
            </div>
          )}

          {/* Showing result */}
          {isShowingResult && (
            <div>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs font-bold text-slate-300"
              >
                انتظر النتيجة...
              </motion.span>
            </div>
          )}

          {/* Interacting */}
          {isInteracting && (
            <div>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs font-bold text-amber-300"
              >
                اختر الهدف...
              </motion.span>
            </div>
          )}
        </motion.div>

        {/* Current team panel (display only, selection in popup) */}
        <CurrentTeamPanel
          teamId={currentTeam}
          teamName={currentTeamName}
        />

        {/* Door grid */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">🚪 الأبواب</span>
            <span className="text-[10px] text-slate-600">{openedDoors}/16</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {doors.map((door, i) => (
              <DoorCard
                key={door.id}
                door={door}
                index={i}
                isSelectable={isWaitingForPlayer}
                onSelect={revealDoor}
              />
            ))}
          </div>
        </div>

        {/* Skip interaction button (when no valid targets) */}
        {interactionState === 'showing_result' && (
          <div className="flex justify-center">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={advanceTurn}
              className="px-6 py-2 rounded-lg bg-purple-600/30 border border-purple-500/30 text-sm text-purple-300 hover:bg-purple-600/40 transition-colors cursor-pointer"
            >
              التالي ←
            </motion.button>
          </div>
        )}
      </div>

      {/* Game Log — auto-expanded */}
      <GameLog defaultExpanded={true} />

      {/* All Dialogs */}
      <AnimatePresence>
        {/* Leader picker popup */}
        {isWaitingForLeader && <LeaderPickerDialog />}

        {/* Result overlay */}
        {isShowingResult && (
          <PenaltyDialog onDismiss={advanceTurn} />
        )}

        {/* Interaction dialogs (pick enemy, free teammate, vote) */}
        {isInteracting && (
          <PenaltyDialog onDismiss={() => {}} />
        )}
      </AnimatePresence>
    </div>
  );
}
