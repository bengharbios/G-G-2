'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Door,
  Player,
  GameLogEntry,
  InteractionState,
  TabotTeam,
  OUTCOME_CONFIG,
  TEAM_CONFIG,
  ROLE_CONFIG,
} from '@/lib/tabot-types';
import { ChevronDown, Crown, Hand, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── Types from synced state ────────────────────────────────────

interface TabotSyncedState {
  teamAlphaName: string;
  teamBetaName: string;
  players: Player[];
  doors: Door[];
  currentPlayerIndex: number;
  currentTeam: TabotTeam;
  lastRevealedDoor: Door | null;
  interactionState: InteractionState;
  votingForTeam: TabotTeam | null;
  teamVotes: Record<string, string | null>;
  currentRound: number;
  roundLog: GameLogEntry[];
  winner: TabotTeam | 'draw' | null;
  winReason: string;
}

// ── Spectator Door Card (read-only) ────────────────────────────

function SpectatorDoorCard({ door, index }: { door: Door; index: number }) {
  const config = door.isRevealed ? OUTCOME_CONFIG[door.outcome] : null;

  return (
    <motion.div
      key={door.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="relative"
    >
      <div
        className="relative w-full aspect-square rounded-xl border-2 overflow-hidden"
        style={{
          borderColor: door.isRevealed && config
            ? config.borderColor.replace('border-', '').replace('/50', '').replace('/30', '')
            : 'rgba(168, 85, 247, 0.3)',
        }}
      >
        {/* Unrevealed door */}
        {!door.isRevealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 via-purple-950 to-slate-900">
            <div className="absolute inset-0 shimmer opacity-30" />
            <span className="text-[10px] sm:text-xs font-bold text-purple-400/60 mb-0.5 relative z-10">
              #{door.id}
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl relative z-10">
              ⚰️
            </span>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-purple-500/20 to-transparent" />
          </div>
        )}

        {/* Revealed door */}
        {door.isRevealed && config && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${config.bgColor}`}>
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(to left, ${
                  config.type === 'safe' ? '#06b6d4, #22d3ee' :
                  config.type === 'attack' ? '#f59e0b, #ef4444' :
                  config.type === 'defense' ? '#10b981, #34d399' :
                  config.type === 'team_damage' ? '#f97316, #eab308' :
                  '#ef4444, #dc2626'
                })`,
              }}
            />
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5">{config.emoji}</span>
            <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-center px-1 leading-tight"
              style={{ color: config.color.includes('cyan') ? '#22d3ee' : 
                              config.color.includes('amber') ? '#fbbf24' :
                              config.color.includes('emerald') ? '#34d399' :
                              config.color.includes('red') ? '#f87171' :
                              config.color.includes('rose') ? '#fb7185' :
                              config.color.includes('orange') ? '#fb923c' :
                              config.color.includes('yellow') ? '#facc15' :
                              config.color.includes('purple') ? '#c084fc' :
                              '#cbd5e1' }}
            >
              {config.label}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Spectator Player Row ──────────────────────────────────────

function SpectatorPlayerRow({ player }: { player: Player }) {
  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300
        ${player.status === 'active' ? 'bg-white/5' : ''}
        ${player.status === 'imprisoned' ? 'opacity-60' : ''}
        ${player.status === 'killed' ? 'opacity-30' : ''}
      `}
    >
      <span className="text-lg">{player.avatar}</span>
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
          {player.role === 'leader' && (
            <span className="text-[10px] text-amber-400 shrink-0" title="قائد">👑</span>
          )}
          {player.role === 'deputy' && (
            <span className="text-[10px] text-blue-400 shrink-0" title="نائب">⭐</span>
          )}
        </div>
      </div>
      {player.status === 'imprisoned' && (
        <span className="text-amber-500/60 text-xs shrink-0">⛓️</span>
      )}
      {player.status === 'killed' && (
        <span className="text-red-500/40 text-xs shrink-0">💀</span>
      )}
    </div>
  );
}

// ── Spectator Team Panel ──────────────────────────────────────

function SpectatorTeamPanel({
  teamId,
  teamName,
  players,
}: {
  teamId: TabotTeam;
  teamName: string;
  players: Player[];
}) {
  const teamPlayers = players.filter(p => p.team === teamId);
  const members = teamPlayers.filter(p => p.role !== 'guest');
  const activeCount = members.filter(p => p.status === 'active').length;
  const imprisonedCount = members.filter(p => p.status === 'imprisoned').length;
  const killedCount = members.filter(p => p.status === 'killed').length;
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
      <div className={`px-3 py-2 border-b ${
        teamId === 'alpha' ? 'border-red-500/20 bg-red-950/30' : 'border-blue-500/20 bg-blue-950/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <span className={`text-sm font-bold ${config.color}`}>{teamName}</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className="text-emerald-400">نشط {activeCount}</span>
            <span className="text-amber-400">حبس {imprisonedCount}</span>
            <span className="text-red-400">قتل {killedCount}</span>
          </div>
        </div>
      </div>

      <div className="p-2 space-y-0.5 max-h-40 overflow-y-auto mafia-scrollbar">
        {teamPlayers.map((player) => (
          <SpectatorPlayerRow key={player.id} player={player} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Spectator Game Log ────────────────────────────────────────

function SpectatorGameLog({ roundLog }: { roundLog: GameLogEntry[] }) {
  const [isExpanded, setIsExpanded] = useState(true);
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

// ── Spectator Result Overlay (read-only) ──────────────────────

function SpectatorResultOverlay({
  outcome,
  playerName,
}: {
  outcome: string;
  playerName: string;
}) {
  const config = OUTCOME_CONFIG[outcome as keyof typeof OUTCOME_CONFIG];

  if (!config) return null;

  const bgGradient =
    config.type === 'safe' ? 'from-cyan-950/95 to-slate-950/95' :
    config.type === 'self_damage' && (outcome === 'kill_player' || outcome === 'kill_self') ? 'from-red-950/95 to-slate-950/95' :
    config.type === 'self_damage' ? 'from-yellow-950/95 to-slate-950/95' :
    'from-slate-950/95 to-purple-950/95';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.7, y: 30 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`bg-gradient-to-b ${bgGradient} border-2 rounded-2xl p-6 max-w-sm w-full shadow-2xl`}
        style={{
          borderColor: config.borderColor,
          boxShadow: `0 0 40px ${config.glowColor}`,
        }}
      >
        <div className="text-center">
          <p className="text-sm text-slate-300 mb-2">{playerName}</p>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="text-6xl mb-3"
          >
            {config.emoji}
          </motion.div>
          <h3 className={`text-xl sm:text-2xl font-black mb-1 ${config.color}`}>
            {config.label}
          </h3>
          <p className="text-sm text-slate-400 mb-3">
            {config.description}
          </p>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <Eye className="w-3 h-3" />
            وضع المشاهدة
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Spectator View ───────────────────────────────────────

export default function TabotSpectatorView({
  stateJson,
  roomCode,
  hostName,
}: {
  stateJson: string;
  roomCode: string;
  hostName: string;
}) {
  const [state, setState] = useState<TabotSyncedState | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(stateJson) as TabotSyncedState;
      setState(parsed);
    } catch {
      // Invalid JSON
    }
  }, [stateJson]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center tabot-bg" dir="rtl">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-5xl mb-4"
          >
            ⚰️
          </motion.div>
          <p className="text-slate-400">جاري تحميل اللعبة...</p>
        </div>
      </div>
    );
  }

  const { players, doors, currentTeam, interactionState, lastRevealedDoor, roundLog, winner, currentRound, teamAlphaName, teamBetaName } = state;
  const currentTeamName = currentTeam === 'alpha' ? teamAlphaName : teamBetaName;
  const teamConfig = TEAM_CONFIG[currentTeam];
  const openedDoors = doors.filter(d => d.isRevealed).length;
  const currentPlayer = state.currentPlayerIndex >= 0 ? players[state.currentPlayerIndex] : null;

  const isWaitingForPlayer = interactionState === 'waiting_for_player';
  const isWaitingForLeader = interactionState === 'waiting_for_leader';
  const isShowingResult = interactionState === 'showing_result';
  const isInteracting = [
    'picking_enemy_imprison',
    'picking_enemy_kill',
    'picking_teammate_free',
    'voting_teammate_imprison',
  ].includes(interactionState);

  // ── Game Over View ──────────────────────────────
  if (winner) {
    const alphaMembers = players.filter(p => p.team === 'alpha' && p.role !== 'guest');
    const betaMembers = players.filter(p => p.team === 'beta' && p.role !== 'guest');
    const alphaActive = alphaMembers.filter(p => p.status === 'active').length;
    const betaActive = betaMembers.filter(p => p.status === 'active').length;
    const alphaImprisoned = alphaMembers.filter(p => p.status === 'imprisoned').length;
    const betaImprisoned = betaMembers.filter(p => p.status === 'imprisoned').length;
    const alphaKilled = alphaMembers.filter(p => p.status === 'killed').length;
    const betaKilled = betaMembers.filter(p => p.status === 'killed').length;

    return (
      <div className="min-h-screen flex flex-col tabot-bg text-white" dir="rtl">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-purple-800/30">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">متفرج</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-400">
              🏆 انتهت اللعبة
            </Badge>
            <span className="text-[10px] text-slate-600">غرفة: {roomCode}</span>
          </div>
        </div>

        {/* Game Over Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 12 }}
              className="text-center mb-4"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-7xl mb-3"
              >
                🏆
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-6"
            >
              {winner === 'draw' ? (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-2">
                    تعادل! 🤝
                  </h1>
                  <p className="text-sm text-slate-400">{state.winReason}</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">{TEAM_CONFIG[winner].icon}</span>
                    <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-amber-300 to-purple-400">
                      {winner === 'alpha' ? teamAlphaName : teamBetaName}
                    </h1>
                  </div>
                  <p className="text-sm text-slate-400">{state.winReason}</p>
                </>
              )}
            </motion.div>

            {/* Team cards */}
            <div className="space-y-3">
              <div className={`rounded-xl border p-3 ${winner === 'alpha' ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-700/50 bg-slate-900/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👹</span>
                    <span className="text-sm font-bold text-red-400">{teamAlphaName}</span>
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-emerald-400">نشط {alphaActive}</span>
                    <span className="text-amber-400">حبس {alphaImprisoned}</span>
                    <span className="text-red-400">قتل {alphaKilled}</span>
                  </div>
                </div>
                {players.filter(p => p.team === 'alpha').map((player) => (
                  <SpectatorPlayerRow key={player.id} player={player} />
                ))}
              </div>

              <div className={`rounded-xl border p-3 ${winner === 'beta' ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-700/50 bg-slate-900/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🦇</span>
                    <span className="text-sm font-bold text-blue-400">{teamBetaName}</span>
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-emerald-400">نشط {betaActive}</span>
                    <span className="text-amber-400">حبس {betaImprisoned}</span>
                    <span className="text-red-400">قتل {betaKilled}</span>
                  </div>
                </div>
                {players.filter(p => p.team === 'beta').map((player) => (
                  <SpectatorPlayerRow key={player.id} player={player} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing View ────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen tabot-bg text-white" dir="rtl">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-purple-800/30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">متفرج</span>
          </div>
          <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5 border-purple-500/50 text-purple-400">
            📋 الجولة {currentRound} — {currentTeamName}
          </Badge>
          <span className="text-[10px] text-slate-600">غرفة: {roomCode}</span>
        </div>
      </div>

      {/* Main content */}
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

          {isWaitingForPlayer && currentPlayer && (
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Hand className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300">
                  {currentPlayer.name} — يختار باباً
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {teamConfig.icon} {currentTeamName}
              </p>
            </div>
          )}

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

          {isInteracting && (
            <div>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs font-bold text-amber-300"
              >
                جاري الاختيار...
              </motion.span>
            </div>
          )}
        </motion.div>

        {/* Current team panel */}
        <SpectatorTeamPanel
          teamId={currentTeam}
          teamName={currentTeamName}
          players={players}
        />

        {/* Door grid */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">🚪 الأبواب</span>
            <span className="text-[10px] text-slate-600">{openedDoors}/16</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {doors.map((door, i) => (
              <SpectatorDoorCard key={door.id} door={door} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Game Log */}
      <SpectatorGameLog roundLog={roundLog} />

      {/* Result overlay (read-only) */}
      <AnimatePresence>
        {isShowingResult && lastRevealedDoor && currentPlayer && (
          <SpectatorResultOverlay
            outcome={lastRevealedDoor.outcome}
            playerName={currentPlayer.name}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
