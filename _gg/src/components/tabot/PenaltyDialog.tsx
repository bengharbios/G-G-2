'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTabotStore } from '@/lib/tabot-store';
import { Player, OUTCOME_CONFIG, DoorOutcome, ROLE_CONFIG } from '@/lib/tabot-types';
import { Link2, Skull, KeyRound, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

// ============================================================
// Result Overlay — Shows when a door is revealed (no action needed)
// ============================================================

export function ResultOverlay({
  outcome,
  playerName,
  onContinue,
}: {
  outcome: DoorOutcome;
  playerName: string;
  onContinue: () => void;
}) {
  const config = OUTCOME_CONFIG[outcome];

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
          {/* Player name */}
          <p className="text-sm text-slate-300 mb-2">{playerName}</p>

          {/* Emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="text-6xl mb-3"
          >
            {config.emoji}
          </motion.div>

          {/* Title */}
          <h3 className={`text-xl sm:text-2xl font-black mb-1 ${config.color}`}>
            {config.label}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-400 mb-5">
            {config.description}
          </p>

          {/* Continue button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={onContinue}
              className={`w-full font-bold py-5 text-base ${
                config.type === 'safe'
                  ? 'bg-gradient-to-l from-cyan-600 to-blue-800 hover:from-cyan-500 hover:to-blue-700 text-white'
                  : config.type === 'attack' || config.type === 'team_damage'
                  ? 'bg-gradient-to-l from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 text-white'
                  : 'bg-gradient-to-l from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white'
              }`}
            >
              متابعة
              <ChevronLeft className="w-4 h-4 mr-2" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Player Picker — For picking enemy/teammate (imprison/kill/free)
// ============================================================

export function PlayerPicker({
  title,
  description,
  icon,
  accentColor,
  players,
  onSelect,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  players: Player[];
  onSelect: (playerId: string) => void;
}) {
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
        className="bg-[#1a1025] border border-purple-700/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
      >
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {icon}
            <h3 className="text-lg font-bold text-slate-200">{title}</h3>
          </div>
          <p className="text-xs text-slate-400">{description}</p>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto mafia-scrollbar">
          {players.map((player, i) => (
            <motion.button
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(player.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                bg-slate-800/50 border-slate-700/50 hover:${accentColor}`}
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
// Team Vote Dialog — For voting to imprison a teammate
// ============================================================

export function TeamVoteDialog({
  teamName,
  voters,
  onVote,
}: {
  teamName: string;
  voters: Player[];
  onVote: (voterId: string, targetId: string) => void;
}) {
  const { teamVotes } = useTabotStore();
  const [currentVoterIndex, setCurrentVoterIndex] = useState(() => {
    // Find first voter who hasn't voted
    const idx = voters.findIndex(v => !teamVotes[v.id]);
    return idx >= 0 ? idx : 0;
  });

  const currentVoter = voters[currentVoterIndex];
  const eligibleTargets = voters.filter(v => v.id !== currentVoter?.id);
  const allVoted = Object.values(teamVotes).every(v => v !== null);
  const votedCount = Object.values(teamVotes).filter(v => v !== null).length;

  if (allVoted) return null;

  const handleVote = (targetId: string) => {
    if (!currentVoter) return;
    onVote(currentVoter.id, targetId);
    // Move to next unvoted voter
    setTimeout(() => {
      const nextIdx = voters.findIndex((v, i) => i > currentVoterIndex && !teamVotes[v.id]);
      if (nextIdx >= 0) {
        setCurrentVoterIndex(nextIdx);
      } else {
        // Check if there's any unvoted voter before current
        const prevIdx = voters.findIndex(v => !teamVotes[v.id]);
        if (prevIdx >= 0) setCurrentVoterIndex(prevIdx);
      }
    }, 300);
  };

  const progress = (votedCount / voters.length) * 100;

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
        className="bg-[#1a1025] border border-orange-700/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-4">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-4xl mb-2"
          >
            🗡️
          </motion.div>
          <h3 className="text-lg font-bold text-orange-300">خيانة داخلية!</h3>
          <p className="text-xs text-slate-400">
            فريق &quot;{teamName}&quot; يصوّت لاختيار من يُحبس
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>الأصوات</span>
            <span>{votedCount}/{voters.length}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-orange-500 to-amber-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Current voter */}
        {currentVoter && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3 bg-orange-950/30 border border-orange-700/30 rounded-lg p-2">
              <span className="text-lg">{currentVoter.avatar}</span>
              <div>
                <span className="text-sm font-bold text-orange-200">{currentVoter.name}</span>
                <span className="text-[10px] text-slate-500 block">صوّت لمن تريد حبسه</span>
              </div>
            </div>

            {/* Target selection */}
            <div className="space-y-2 max-h-48 overflow-y-auto mafia-scrollbar">
              {eligibleTargets.map((target, i) => (
                <motion.button
                  key={target.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVote(target.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:border-orange-500/50 hover:bg-orange-950/20 transition-all cursor-pointer"
                >
                  <span className="text-xl">{target.avatar}</span>
                  <div className="flex-1 text-right">
                    <span className="text-sm font-bold text-slate-200">{target.name}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {ROLE_CONFIG[target.role].emoji} {ROLE_CONFIG[target.role].label}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Main Penalty Dialog — Routes to the correct dialog
// ============================================================

export default function PenaltyDialog({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const {
    lastRevealedDoor,
    players,
    currentPlayerIndex,
    interactionState,
    teamAlphaName,
    teamBetaName,
    votingForTeam,
    teamVotes,
  } = useTabotStore();

  const { advanceTurn, imprisonPlayer, killPlayer, freePlayer, skipInteraction } = useTabotStore();

  if (!lastRevealedDoor) return null;

  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return null;

  const config = OUTCOME_CONFIG[lastRevealedDoor.outcome];

  // No action needed — just show result
  if (interactionState === 'showing_result') {
    return (
      <ResultOverlay
        outcome={lastRevealedDoor.outcome}
        playerName={currentPlayer.name}
        onContinue={advanceTurn}
      />
    );
  }

  // Pick enemy to imprison
  if (interactionState === 'picking_enemy_imprison') {
    const enemyTeam = currentPlayer.team === 'alpha' ? 'beta' : 'alpha';
    const targets = players.filter(
      p => p.team === enemyTeam && p.status === 'active' && p.role !== 'guest'
    );
    return (
      <PlayerPicker
        title="احبس عدوك"
        description={`${currentPlayer.name} يختار لاعب من الفريق الخصم ليُسجن`}
        icon={<Link2 className="w-5 h-5 text-amber-400" />}
        accentColor="border-amber-500/50 bg-amber-950/20"
        players={targets}
        onSelect={(id) => {
          imprisonPlayer(id);
        }}
      />
    );
  }

  // Pick enemy to kill
  if (interactionState === 'picking_enemy_kill') {
    const enemyTeam = currentPlayer.team === 'alpha' ? 'beta' : 'alpha';
    const targets = players.filter(
      p => p.team === enemyTeam && p.status === 'active' && p.role !== 'guest'
    );
    return (
      <PlayerPicker
        title="اختر ضحيتك"
        description={`${currentPlayer.name} يختار خصماً ليقتله`}
        icon={<Skull className="w-5 h-5 text-rose-400" />}
        accentColor="border-rose-500/50 bg-rose-950/20"
        players={targets}
        onSelect={(id) => {
          killPlayer(id);
        }}
      />
    );
  }

  // Pick teammate to free
  if (interactionState === 'picking_teammate_free') {
    const targets = players.filter(
      p => p.team === currentPlayer.team && p.status === 'imprisoned' && p.role !== 'guest'
    );
    return (
      <PlayerPicker
        title="حرر زميلك"
        description={`${currentPlayer.name} يختار زميلاً محبوساً ليحرره`}
        icon={<KeyRound className="w-5 h-5 text-emerald-400" />}
        accentColor="border-emerald-500/50 bg-emerald-950/20"
        players={targets}
        onSelect={(id) => {
          freePlayer(id);
        }}
      />
    );
  }

  // Vote to imprison teammate
  if (interactionState === 'voting_teammate_imprison' && votingForTeam) {
    const teamName = votingForTeam === 'alpha' ? teamAlphaName : teamBetaName;
    const voters = players.filter(
      p => p.team === votingForTeam && p.status === 'active' && p.role !== 'guest'
    );
    return (
      <TeamVoteDialog
        teamName={teamName}
        voters={voters}
        onVote={(voterId: string, targetId: string) => {
          useTabotStore.getState().castVote(voterId, targetId);
        }}
      />
    );
  }

  return null;
}
