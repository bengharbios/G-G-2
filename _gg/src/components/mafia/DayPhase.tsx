'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/lib/game-store';
import PlayerAvatar from './PlayerAvatar';
import {
  getAlivePlayers,
} from '@/lib/game-logic';
import {
  VolumeX,
  Skull,
  Shield,
  Crosshair,
  Timer,
  MessageSquare,
  Vote,
  AlertTriangle,
  Trophy,
  Users,
  ChevronLeft,
  Crown,
  Moon,
  Hand,
  X,
  Check,
  ArrowRightLeft,
  Megaphone,
  Wifi,
  WifiOff,
  Eye,
} from 'lucide-react';
import { playDaySound } from '@/lib/sounds';

// ============================================================
// Live Voting Board Component
// ============================================================

interface VoteChangeRecord {
  voterName: string;
  fromName: string | null;
  toName: string | null;
  timestamp: number;
}

function LiveVotingBoard({
  onFinalize,
}: {
  onFinalize: () => void;
}) {
  const {
    players,
    votes,
    castVote,
    selectedTarget,
    setSelectedTarget,
    processVoteResults,
    showRolesToHost,
    gameMode,
    roomCode,
    mergeRemoteVotes,
  } = useGameStore();

  const isDiwaniya = gameMode === 'diwaniya';
  const [selectingVoterId, setSelectingVoterId] = useState<string | null>(null);
  const [voteChanges, setVoteChanges] = useState<VoteChangeRecord[]>([]);
  const [remotePollError, setRemotePollError] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<number>(0);
  const prevVoteCountRef = useRef(0);

  // ============================================================
  // REMOTE VOTE POLLING (Diwaniya mode only)
  // ============================================================
  const pollRemoteVotes = useCallback(async () => {
    if (!isDiwaniya || !roomCode) return;
    try {
      const res = await fetch(`/api/room/${roomCode}`);
      if (!res.ok) {
        setRemotePollError(true);
        return;
      }
      const room = await res.json();
      setRemotePollError(false);
      setLastPollTime(Date.now());

      // Build name → local player ID mapping
      const nameToLocalId = new Map<string, string>();
      for (const p of players) {
        nameToLocalId.set(p.name, p.id);
      }

      // Convert remote votes to local format
      // DB stores: voteTarget = target player NAME
      const remoteVotes: Array<{ voterId: string; targetId: string | null }> = [];
      for (const dbPlayer of room.players) {
        if (!dbPlayer.isAlive || dbPlayer.isSilenced) continue;
        if (!dbPlayer.voteTarget) continue;

        const localVoterId = nameToLocalId.get(dbPlayer.name);
        const localTargetId = nameToLocalId.get(dbPlayer.voteTarget);

        if (localVoterId && localTargetId) {
          remoteVotes.push({ voterId: localVoterId, targetId: localTargetId });
        }
      }

      if (remoteVotes.length > 0) {
        mergeRemoteVotes(remoteVotes);
      }
    } catch {
      setRemotePollError(true);
    }
  }, [isDiwaniya, roomCode, players, mergeRemoteVotes]);

  // Poll every 2 seconds in Diwaniya mode
  useEffect(() => {
    if (!isDiwaniya || !roomCode) return;
    pollRemoteVotes();
    const interval = setInterval(pollRemoteVotes, 2000);
    return () => clearInterval(interval);
  }, [isDiwaniya, roomCode, pollRemoteVotes]);

  // Detect new votes and show change announcements
  useEffect(() => {
    if (votes.length > prevVoteCountRef.current && prevVoteCountRef.current > 0) {
      const latestVote = votes[votes.length - 1];
      const voter = players.find((p) => p.id === latestVote.voterId);
      const target = latestVote.targetId
        ? players.find((p) => p.id === latestVote.targetId)
        : null;
      if (voter) {
        setVoteChanges((prev) => [
          ...prev,
          {
            voterName: voter.name,
            fromName: null,
            toName: target?.name || null,
            timestamp: Date.now(),
          },
        ]);
      }
    }
    prevVoteCountRef.current = votes.length;
  }, [votes.length, votes, players]);

  const alivePlayers = useMemo(() => getAlivePlayers(players), [players]);
  const silencedPlayers = useMemo(
    () => alivePlayers.filter((p) => p.isSilenced),
    [alivePlayers]
  );
  const votersWhoVoted = useMemo(
    () => alivePlayers.filter((p) => votes.some((v) => v.voterId === p.id)),
    [alivePlayers, votes]
  );

  // Live vote tally (mayor vote counts as 3 if revealed)
  const voteTally = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const vote of votes) {
      if (vote.targetId) {
        const voter = players.find((p) => p.id === vote.voterId);
        const weight = voter?.hasRevealedMayor ? 3 : 1;
        tally[vote.targetId] = (tally[vote.targetId] || 0) + weight;
      }
    }
    return tally;
  }, [votes, players]);

  // Sort tally by count descending
  const sortedTally = useMemo(() => {
    return Object.entries(voteTally)
      .map(([playerId, count]) => ({
        player: players.find((p) => p.id === playerId),
        count,
      }))
      .filter((item) => item.player)
      .sort((a, b) => b.count - a.count);
  }, [voteTally, players]);

  const handleVote = async (voterId: string, targetId: string | null) => {
    // Check if this is a vote change
    const existingVote = votes.find((v) => v.voterId === voterId);
    const voter = players.find((p) => p.id === voterId);

    if (existingVote && voter) {
      const oldTarget = existingVote.targetId
        ? players.find((p) => p.id === existingVote.targetId)?.name || null
        : null;
      const newTarget = targetId
        ? players.find((p) => p.id === targetId)?.name || null
        : null;

      if (oldTarget !== newTarget) {
        setVoteChanges((prev) => [
          ...prev,
          {
            voterName: voter.name,
            fromName: oldTarget,
            toName: newTarget,
            timestamp: Date.now(),
          },
        ]);
      }
    }

    castVote(voterId, targetId);

    // Diwaniya mode: sync vote to DB so players see it
    if (isDiwaniya && roomCode && voter) {
      try {
        if (targetId) {
          const targetPlayer = players.find((p) => p.id === targetId);
          await fetch(`/api/room/${roomCode}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerName: voter.name,
              targetId: targetPlayer?.name || null,
            }),
          });
        } else {
          // Clear vote (skip)
          await fetch(`/api/room/${roomCode}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerName: voter.name,
              clearVote: true,
            }),
          });
        }
      } catch {
        // silent error - vote is still stored locally
      }
    }

    setSelectingVoterId(null);
    setSelectedTarget(null);
  };

  const getVoteTargetName = (voterId: string): string | null => {
    const vote = votes.find((v) => v.voterId === voterId);
    if (!vote?.targetId) return null;
    return players.find((p) => p.id === vote.targetId)?.name || null;
  };

  const getVoteWeight = (voterId: string): number => {
    const voter = players.find((p) => p.id === voterId);
    return voter?.hasRevealedMayor ? 3 : 1;
  };

  const allVoted = alivePlayers.every(
    (p) => votes.some((v) => v.voterId === p.id)
  );

  return (
    <div className="space-y-4">
      {/* Diwaniya mode: connection status indicator */}
      {isDiwaniya && (
        <div className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
          remotePollError
            ? 'bg-red-950/40 border border-red-500/30 text-red-400'
            : 'bg-green-950/30 border border-green-500/20 text-green-400'
        }`}>
          {remotePollError ? (
            <><WifiOff className="w-3.5 h-3.5" /> تعذّر الاتصال بالخادم</>
          ) : (
            <><Wifi className="w-3.5 h-3.5" /> متصل - استقبال الأصوات لحظياً</>
          )}
          {lastPollTime > 0 && (
            <span className="text-[9px] opacity-60 ml-1">
              آخر تحديث: {new Date(lastPollTime).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* Vote change announcements */}
      <AnimatePresence>
        {voteChanges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1 max-h-24 overflow-y-auto mafia-scrollbar"
          >
            {voteChanges
              .slice()
              .reverse()
              .slice(0, 5)
              .map((change, i) => (
                <motion.div
                  key={`${change.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <ArrowRightLeft className="w-3 h-3 text-yellow-400 shrink-0" />
                  <span className="text-slate-400">
                    <strong className="text-yellow-300">{change.voterName}</strong>
                    {change.fromName ? (
                      <span>
                        : {change.fromName} → {change.toName || '🚫 إلغاء'}
                      </span>
                    ) : (
                      <span>
                        : 🗳️ {change.toName}
                      </span>
                    )}
                  </span>
                </motion.div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live vote tally */}
      {sortedTally.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="pt-3 pb-3">
            <h3 className="text-slate-300 font-bold text-xs sm:text-sm mb-2 flex items-center gap-1.5">
              <Vote className="w-3.5 h-3.5" />
              {isDiwaniya ? '📊 نتائج التصويت المباشر (الديوانية)' : '📊 نتائج التصويت المباشر'}
              <Badge className="bg-yellow-900/50 text-yellow-300 text-[9px] px-1.5 py-0 mr-auto">
                العمده = ٣ أصوات 👑
              </Badge>
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto mafia-scrollbar">
              {sortedTally.map(({ player, count }) => {
                const totalWeightedVotes = sortedTally.reduce(
                  (sum, t) => sum + t.count,
                  0
                );
                // Count how many mayor votes this player received
                const mayorVotesForThis = votes.filter(
                  (v) => v.targetId === player!.id && players.find((p) => p.id === v.voterId)?.hasRevealedMayor
                ).length;
                const regularVotesForThis = votes.filter(
                  (v) => v.targetId === player!.id && !players.find((p) => p.id === v.voterId)?.hasRevealedMayor
                ).length;
                return (
                  <motion.div
                    key={player!.id}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '100%' }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-slate-300 text-xs w-20 sm:w-28 truncate text-right shrink-0">
                      {player!.name}
                    </span>
                    <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-red-600 to-red-800 rounded-full vote-bar flex items-center justify-end px-1.5"
                        style={{
                          width: `${
                            totalWeightedVotes > 0
                              ? (count / totalWeightedVotes) * 100
                              : 0
                          }%`,
                          minWidth: count > 0 ? '2rem' : '0',
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {count}
                        </span>
                      </div>
                    </div>
                    {(mayorVotesForThis > 0 || regularVotesForThis > 0) && (
                      <span className="text-[9px] text-slate-500 shrink-0 w-16 sm:w-20 text-left">
                        {mayorVotesForThis > 0 && (
                          <span className="text-yellow-400">👑×{mayorVotesForThis} </span>
                        )}
                        {regularVotesForThis > 0 && (
                          <span>👤×{regularVotesForThis}</span>
                        )}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voter grid */}
      <Card className="bg-slate-900/60 border-slate-700/50">
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              {isDiwaniya ? '📱 أصوات اللاعبين' : 'اللاعبون المتبقون'} ({votersWhoVoted.length}/{alivePlayers.length})
            </h3>
            <div className="flex items-center gap-1.5">
              {isDiwaniya && (
                <Badge className="bg-blue-900/50 text-blue-300 text-[9px] px-1.5 py-0 border border-blue-500/30">
                  <Eye className="w-2.5 h-2.5 ml-0.5" />
                  مراقبة
                </Badge>
              )}
              {showRolesToHost && (
                <Badge className="bg-amber-900/50 text-amber-300 text-[9px] px-1.5 py-0 border border-amber-500/30">
                  👁️ المدير
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 ${
                  allVoted
                    ? 'border-green-500/50 text-green-400'
                    : 'border-yellow-500/50 text-yellow-400'
                }`}
              >
                {allVoted ? '✅ اكتمل التصويت' : `⏳ ${votersWhoVoted.length} من ${alivePlayers.length} صوّتوا`}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-52 overflow-y-auto mafia-scrollbar">
            {alivePlayers.map((player) => {
              const hasVoted = votes.some((v) => v.voterId === player.id);
              const voteTarget = getVoteTargetName(player.id);
              const isMayor = player.hasRevealedMayor;
              const isSilenced = player.isSilenced;
              const isSelecting = selectingVoterId === player.id;
              // In Diwaniya mode, host can also vote on behalf of disconnected players
              const canClickToVote = true;

              return (
                <div key={player.id} className="relative">
                  <motion.div
                    whileTap={canClickToVote ? { scale: 0.95 } : undefined}
                    onClick={() => {
                      if (isSilenced) return;
                      if (isSelecting) {
                        setSelectingVoterId(null);
                        setSelectedTarget(null);
                      } else {
                        setSelectingVoterId(player.id);
                        setSelectedTarget(null);
                      }
                    }}
                    className={`rounded-xl p-2 sm:p-3 border-2 transition-all duration-200 ${
                      canClickToVote ? 'cursor-pointer' : hasVoted ? 'cursor-default' : 'cursor-default'
                    } ${
                      isSilenced
                        ? 'bg-purple-950/30 border-purple-500/30 opacity-60'
                        : isDiwaniya && isSelecting
                        ? 'bg-blue-900/40 border-blue-500/70 scale-105'
                        : !isDiwaniya && isSelecting
                        ? 'bg-yellow-900/40 border-yellow-500/70 scale-105'
                        : hasVoted
                        ? 'bg-green-950/30 border-green-500/30'
                        : isDiwaniya
                        ? 'bg-slate-800/50 border-slate-600/30'
                        : 'bg-slate-800/50 border-slate-600/30 hover:border-yellow-500/50 hover:bg-slate-800'
                    }`}
                    role={canClickToVote ? 'button' : undefined}
                    tabIndex={canClickToVote ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (!canClickToVote) return;
                      if (
                        (e.key === 'Enter' || e.key === ' ') &&
                        !isSilenced
                      ) {
                        if (isSelecting) {
                          setSelectingVoterId(null);
                          setSelectedTarget(null);
                        } else {
                          setSelectingVoterId(player.id);
                          setSelectedTarget(null);
                        }
                      }
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <PlayerAvatar
                        name={player.name}
                        isAlive={true}
                        isSilenced={isSilenced}
                        role={player.role}
                        size="sm"
                        showRole={showRolesToHost}
                      />
                      {/* Status indicators */}
                      {isMayor && (
                        <Badge className="bg-yellow-900/80 text-yellow-200 text-[9px] px-1 py-0">
                          <Crown className="w-2.5 h-2.5 ml-0.5" />
                          عمده
                        </Badge>
                      )}
                      {isSilenced && (
                        <Badge className="bg-purple-900/80 text-purple-200 text-[9px] px-1 py-0">
                          <VolumeX className="w-2.5 h-2.5 ml-0.5" />
                          مسكوت
                        </Badge>
                      )}
                      {!isSilenced && (
                        hasVoted ? (
                          <Badge className={`text-[9px] px-1 py-0 ${isMayor ? 'bg-yellow-900/80 text-yellow-200' : 'bg-green-900/80 text-green-200'}`}>
                            <Check className="w-2.5 h-2.5 ml-0.5" />
                            {isMayor ? 'صوّت (×٣)' : 'صوّت'}
                          </Badge>
                        ) : isDiwaniya ? (
                          <Badge className="bg-slate-800/80 text-slate-500 text-[9px] px-1 py-0">
                            ⏳ لم يصوّت
                          </Badge>
                        ) : null
                      )}
                    </div>
                  </motion.div>

                  {/* Show vote target */}
                  {hasVoted && voteTarget && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-600/50 rounded px-1.5 py-0.5 whitespace-nowrap z-10"
                    >
                      <span className="text-[9px] text-yellow-300">
                        → {voteTarget}
                      </span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Diwaniya mode: Detailed vote breakdown (who voted for whom) */}
      {isDiwaniya && votes.length > 0 && (
        <Card className="bg-slate-900/60 border-blue-500/20">
          <CardContent className="pt-3 pb-3">
            <h3 className="text-blue-300 font-bold text-xs sm:text-sm mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              تفاصيل التصويت - من صوّت لمن؟
            </h3>
            <div className="space-y-1 max-h-36 overflow-y-auto mafia-scrollbar">
              {votes.map((vote) => {
                const voter = players.find((p) => p.id === vote.voterId);
                const target = vote.targetId
                  ? players.find((p) => p.id === vote.targetId)
                  : null;
                if (!voter) return null;
                return (
                  <motion.div
                    key={vote.voterId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-slate-800/40 rounded-lg px-2.5 py-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-green-900/50 border border-green-500/30 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-green-300">{voter.name.charAt(0)}</span>
                      </div>
                      <span className="text-xs text-slate-300">{voter.name}</span>
                      {voter.hasRevealedMayor && (
                        <span className="text-[8px] text-yellow-400">👑</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-500">صوّت لـ</span>
                      <span className="text-xs font-bold text-red-300">{target?.name || '—'}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target selection modal - host can vote for any player in both modes */}
      <AnimatePresence>
        {selectingVoterId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3"
            onClick={() => {
              setSelectingVoterId(null);
              setSelectedTarget(null);
            }}
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Voter info */}
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-yellow-500/50 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-yellow-400">
                    {players.find((p) => p.id === selectingVoterId)?.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                  {players.find((p) => p.id === selectingVoterId)?.name}
                </h3>
                {players.find((p) => p.id === selectingVoterId)?.hasRevealedMayor && (
                  <Badge className="bg-yellow-900/80 text-yellow-200 mt-1">
                    <Crown className="w-3 h-3 ml-1" />
                    عمده (٣ أصوات)
                  </Badge>
                )}
              </div>

              <p className="text-red-300 text-sm text-center mb-4 font-bold">
                اختر من تريد إقصاءه! 💀
              </p>

              {players.find((p) => p.id === selectingVoterId)?.hasRevealedMayor && (
                <div className="text-center mb-3">
                  <Badge className="bg-yellow-900/60 text-yellow-300 text-xs px-3 py-1 border border-yellow-500/30">
                    👑 صوتك يساوي ٣ أصوات! اختر بحكمة!
                  </Badge>
                </div>
              )}

              {/* Target selection */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                {alivePlayers
                  .filter((p) => p.id !== selectingVoterId)
                  .map((target) => (
                    <div
                      key={target.id}
                      onClick={() => setSelectedTarget(target.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          setSelectedTarget(target.id);
                      }}
                      className={`rounded-xl p-2 sm:p-3 border-2 transition-all duration-200 cursor-pointer ${
                        selectedTarget === target.id
                          ? 'bg-red-900/60 border-red-500 scale-105'
                          : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500/50'
                      }`}
                    >
                      <PlayerAvatar
                        name={target.name}
                        isAlive={true}
                        role={target.role}
                        size="sm"
                        showRole={showRolesToHost}
                      />
                    </div>
                  ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleVote(selectingVoterId, null);
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-4 text-sm"
                >
                  <X className="w-4 h-4 ml-1" />
                  تخطي
                </Button>
                <Button
                  onClick={() => {
                    if (selectedTarget) {
                      handleVote(selectingVoterId, selectedTarget);
                    }
                  }}
                  disabled={!selectedTarget}
                  className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold py-4 text-sm disabled:opacity-40"
                >
                  <Check className="w-4 h-4 ml-1" />
                  تأكيد الصوت
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt - different for each mode */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        {isDiwaniya ? (
          <div className="inline-flex items-center gap-2 bg-blue-950/30 border border-blue-500/20 rounded-full px-4 py-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-bold">
              {allVoted
                ? '✅ جميع اللاعبين صوّتوا - يمكنك إنهاء التصويت'
                : `⏳ ${votersWhoVoted.length}/${alivePlayers.length} صوّتوا - اضغط على أي لاعب لتصويت نيابة عنه`}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-yellow-950/30 border border-yellow-500/20 rounded-full px-4 py-2">
            <Megaphone className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-bold">
              حد بده يغير؟ اضغط على اسمك لتغيير صوتك
            </span>
          </div>
        )}
      </motion.div>

      {/* Silenced players notice */}
      {silencedPlayers.length > 0 && (
        <div className="text-center">
          <Badge className="bg-purple-900/50 text-purple-300 border-purple-500/30 px-3 py-1">
            <VolumeX className="w-3 h-3 ml-1" />
            {silencedPlayers.map((p) => p.name).join('، ')} مسكوتون ولا يستطيعون التصويت
          </Badge>
        </div>
      )}

      {/* Finalize button */}
      <Button
        onClick={onFinalize}
        className="w-full bg-gradient-to-l from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-lg py-5 sm:py-6 pulse-glow-red"
      >
        <Vote className="w-5 h-5 ml-2" />
        {isDiwaniya
          ? `إنهاء التصويت والعد (${votersWhoVoted.length}/${alivePlayers.length})`
          : `إنهاء التصويت (${votersWhoVoted.length}/${alivePlayers.length})`}
      </Button>
    </div>
  );
}

// ============================================================
// Main DayPhase Component
// ============================================================

export default function DayPhase() {
  const {
    players,
    phase,
    round,
    dayResults,
    gameWinner,
    setPhase,
    revealMayor,
    processVoteResults,
    selectedTarget,
    setSelectedTarget,
    showRolesToHost,
    gameMode,
    roomCode,
  } = useGameStore();

  const [selectedPreset, setSelectedPreset] = useState(2);
  const [discussionTimer, setDiscussionTimer] = useState(0);
  const [isDiscussionActive, setIsDiscussionActive] = useState(false);

  const totalDiscussionTime = selectedPreset * 60;

  const alivePlayers = getAlivePlayers(players);

  // Discussion timer
  useEffect(() => {
    if (phase === 'day_discussion' && isDiscussionActive && discussionTimer > 0) {
      const timer = setInterval(() => {
        setDiscussionTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, isDiscussionActive, discussionTimer]);

  const startDiscussion = () => {
    setIsDiscussionActive(true);
    setDiscussionTimer(totalDiscussionTime);
  };

  const skipToVoting = () => {
    setPhase('day_voting');
  };

  const handleFinalizeVotes = () => {
    processVoteResults();
    // processVoteResults may auto-set phase to 'good_son_revenge'
    // Only set day_elimination if it didn't change
    const currentPhase = useGameStore.getState().phase;
    if (currentPhase !== 'good_son_revenge') {
      setPhase('day_elimination');
    }
  };

  const isDiwaniya = gameMode === 'diwaniya';

  const mayorAlive = players.find(
    (p) => p.role === 'mayor' && p.isAlive && !p.hasRevealedMayor
  );

  // Diwaniya mode: Poll for mayor's reveal decision
  const [mayorDecisionPending, setMayorDecisionPending] = useState(false);
  useEffect(() => {
    if (!isDiwaniya || !roomCode || phase !== 'day_mayor_reveal') return;
    const pollMayorDecision = async () => {
      try {
        const res = await fetch(`/api/room/${roomCode}`);
        if (!res.ok) return;
        const data = await res.json();
        // Check if any player has been revealed as mayor in the DB
        const revealedMayor = data.players?.find((p: { hasRevealedMayor: boolean }) => p.hasRevealedMayor);
        if (revealedMayor) {
          // Auto-advance to discussion with the mayor revealed
          const mayorPlayer = players.find((p) => p.name === revealedMayor.name);
          if (mayorPlayer) {
            revealMayor(mayorPlayer.id);
          }
          setPhase('day_discussion');
          setMayorDecisionPending(false);
        } else {
          setMayorDecisionPending(true);
        }
      } catch {
        // silent
      }
    };
    pollMayorDecision();
    const interval = setInterval(pollMayorDecision, 2000);
    return () => clearInterval(interval);
  }, [isDiwaniya, roomCode, phase, players, revealMayor, setPhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play rooster sound when day announcements start
  useEffect(() => {
    if (phase === 'day_announcements') {
      playDaySound();
    }
  }, [phase]);

  // Render announcements
  if (phase === 'day_announcements') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-day">
        <div className="fixed top-8 left-8 sm:top-10 sm:left-10 z-0">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 opacity-80"
            style={{
              boxShadow:
                '0 0 40px rgba(234, 179, 8, 0.4), 0 0 80px rgba(234, 179, 8, 0.15)',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Badge
              variant="outline"
              className="border-yellow-500/50 text-yellow-400 text-xs"
            >
              الجولة {round}
            </Badge>
            <Badge
              variant="outline"
              className="border-yellow-600 text-yellow-300 text-xs"
            >
              ☀️ النهار
            </Badge>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-100 mb-6 sm:mb-8">
            ☀️ أحداث الليل - شوفوا شو صار!
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {/* Medic save */}
            {dayResults?.medicSaved && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-cyan-950/50 border-cyan-500/30">
                  <CardContent className="pt-4 sm:pt-6 text-center">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-cyan-200 font-bold text-sm sm:text-base">
                      أنقذ الطبيب شخصاً الليلة!
                    </p>
                    <p className="text-cyan-300/60 text-xs sm:text-sm mt-1">
                      لم يُقتل أحد
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Mafia kill */}
            {dayResults?.killedByMafia && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="blood-splatter"
              >
                <Card className="bg-red-950/50 border-red-500/30">
                  <CardContent className="pt-4 sm:pt-6 text-center">
                    <Skull className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-200 font-bold text-base sm:text-lg">
                      قُتل {dayResults.killedByMafia.name}!
                    </p>
                    <p className="text-red-300/60 text-xs sm:text-sm mt-1">
                      اغتاله شيخ المافيا
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Sniper kill */}
            {dayResults?.killedBySniper && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="blood-splatter"
              >
                <Card className="bg-amber-950/50 border-amber-500/30">
                  <CardContent className="pt-4 sm:pt-6 text-center">
                    <Crosshair className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-200 font-bold text-sm sm:text-base">
                      القناص قتل {dayResults.killedBySniper.name}!
                    </p>
                    <p className="text-amber-300/60 text-xs sm:text-sm mt-1">
                      {dayResults.sniperSelfKilled
                        ? 'لكن القناص أخطأ ومات أيضاً!'
                        : 'كان مافيا! هدف ممتاز!'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Sniper self kill */}
            {dayResults?.sniperSelfKilled && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="blood-splatter"
              >
                <Card className="bg-red-950/50 border-red-500/30">
                  <CardContent className="pt-4 sm:pt-6 text-center">
                    <p className="text-red-200 font-bold text-sm sm:text-base">
                      ❌ القناص {dayResults.sniperSelfKilled.name} مات أيضاً!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Nothing happened */}
            {!dayResults?.killedByMafia && !dayResults?.killedBySniper && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-green-950/30 border-green-500/20">
                  <CardContent className="pt-4 sm:pt-6 text-center">
                    <p className="text-green-300 font-bold text-base sm:text-lg">
                      ✅ ليلة هادئة! لم يُقتل أحد
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Silenced player */}
          {dayResults?.silencedPlayer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-3 sm:mt-4"
            >
              <Card className="bg-purple-950/40 border-purple-500/30">
                <CardContent className="pt-3 sm:pt-4 text-center">
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1" />
                  <p className="text-purple-200 font-bold text-sm sm:text-base">
                    {dayResults.silencedPlayer.name} مسكوت هذه الجولة!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Continue button */}
          <div className="mt-6 sm:mt-8">
            {gameWinner ? (
              <Button
                onClick={() => setPhase('game_over')}
                className="w-full bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
              >
                <Trophy className="w-5 h-5 ml-2" />
                عرض النتائج
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (mayorAlive) {
                    setPhase('day_mayor_reveal');
                  } else {
                    setPhase('day_discussion');
                  }
                }}
                className="w-full bg-gradient-to-l from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
              >
                <ChevronLeft className="w-5 h-5 ml-2" />
                المتابعة
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mayor reveal phase
  if (phase === 'day_mayor_reveal') {
    // Diwaniya mode: host can choose on behalf of mayor OR wait for mayor's device
    if (isDiwaniya) {
      const mayorName = mayorAlive?.name || 'العمده';

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-day">
          <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' }}
            >
              <span className="text-5xl sm:text-6xl block mb-4 sm:mb-6">
                🏛️
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-yellow-400 mb-3 sm:mb-4">
                هل يريد العمده كشف بطاقته؟ 🏛️
              </h2>

              {/* Mayor name */}
              {mayorAlive && (
                <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-xl p-3 mb-4">
                  <p className="text-yellow-300 font-bold text-sm">العمده: <span className="text-white">{mayorName}</span></p>
                  <p className="text-xs text-slate-400 mt-1">يمكنك الاختيار بدلاً منه إذا لم يفعل</p>
                </div>
              )}

              {/* Waiting indicator for mayor's device */}
              {mayorAlive && !players.some(p => p.hasRevealedMayor) && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 mb-4 inline-block"
                >
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    >
                      <Wifi className="w-4 h-4 text-blue-400" />
                    </motion.div>
                    <p className="text-blue-300 font-bold text-xs">
                      بانتظار قرار العمده من جهازه...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Host override buttons */}
              {mayorAlive && !players.some(p => p.hasRevealedMayor) && (
                <div className="space-y-3 mb-4">
                  <p className="text-slate-500 text-xs mb-2">— أو اختر بدلاً منه —</p>
                  <Button
                    onClick={async () => {
                      if (!roomCode || !mayorAlive) return;
                      try {
                        const res = await fetch(`/api/room/${roomCode}/mayor-reveal`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ playerName: mayorAlive.name, reveal: true }),
                        });
                        if (res.ok) {
                          revealMayor(mayorAlive.id);
                          setPhase('day_discussion');
                        }
                      } catch { /* silent */ }
                    }}
                    className="w-full bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-base py-4 sm:py-5"
                  >
                    <Crown className="w-5 h-5 ml-2" />
                    نعم، يكشف بطاقته! (صوتي = ٣ أصوات)
                  </Button>
                  <Button
                    onClick={() => setPhase('day_discussion')}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 font-bold text-base py-4 sm:py-5"
                  >
                    لا، العمده لم يكشف
                  </Button>
                </div>
              )}

              {/* Skip if no mayor alive or already revealed */}
              {(!mayorAlive || players.some(p => p.hasRevealedMayor)) && (
                <div className="mt-4">
                  <Button
                    onClick={() => setPhase('day_discussion')}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 font-bold text-sm py-3"
                  >
                    التالي
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      );
    }

    // Godfather mode: host handles the decision
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-day">
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
          >
            <span className="text-5xl sm:text-6xl block mb-4 sm:mb-6">
              🏛️
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-yellow-400 mb-3 sm:mb-4">
              هل يريد العمده كشف بطاقته؟ 🏛️
            </h2>
            <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base">
              مرر الجهاز إلى العمده سراً ليقرر! إذا كشف بصوته بيساوي ٣ أصوات! خطوة جريئة!
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  if (mayorAlive) revealMayor(mayorAlive.id);
                  setPhase('day_discussion');
                }}
                className="w-full bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6 pulse-glow-gold"
              >
                <Crown className="w-5 h-5 ml-2" />
                نعم، أكشف بطاقتي! (صوتي = ٣ أصوات)
              </Button>
              <Button
                onClick={() => setPhase('day_discussion')}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 font-bold text-base sm:text-lg py-5 sm:py-6"
              >
                لا، سأبقى سراً
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Discussion phase
  if (phase === 'day_discussion') {
    const revealedMayor = players.find(
      (p) => p.hasRevealedMayor && p.isAlive
    );

    return (
      <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 mafia-bg-day">
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Badge
              variant="outline"
              className="border-yellow-500/50 text-yellow-400 text-xs"
            >
              الجولة {round}
            </Badge>
            <Badge
              variant="outline"
              className="border-yellow-600 text-yellow-300 text-xs"
            >
              💬 النقاش
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-center text-slate-100 mb-2">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 inline ml-2" />
            وقت النقاش - كل كلمة بتعدّ! 🔥
          </h2>

          {/* Revealed mayor announcement */}
          {revealedMayor && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-yellow-950/30 border border-yellow-500/30 rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4 text-center"
            >
              <p className="text-yellow-300 text-xs sm:text-sm font-bold">
                🏛️ العمده <strong>{revealedMayor.name}</strong> كشف بطاقته! صوته
                يساوي ٣ أصوات
              </p>
            </motion.div>
          )}

          {/* Timer Setup */}
          <div className="text-center mb-4 sm:mb-6">
            {!isDiscussionActive ? (
              <div className="space-y-4">
                {/* Preset duration selector */}
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 5].map((m) => (
                    <motion.button
                      key={m}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedPreset(m)}
                      className={`px-5 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all ${
                        selectedPreset === m
                          ? 'bg-gradient-to-l from-blue-600 to-blue-800 text-blue-100 border-2 border-blue-400/50 shadow-lg shadow-blue-900/30'
                          : 'bg-slate-800/60 text-slate-400 border-2 border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-300'
                      }`}
                    >
                      {m} د
                    </motion.button>
                  ))}
                </div>

                {/* Start timer button */}
                <Button
                  onClick={startDiscussion}
                  className="bg-gradient-to-l from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white font-bold px-8 py-3.5 text-sm sm:text-base pulse-glow-blue"
                >
                  <Timer className="w-5 h-5 ml-2" />
                  ابدأ المؤقت ({formatTime(totalDiscussionTime)})
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Circular timer display */}
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-slate-800"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className={
                        discussionTimer <= 30
                          ? 'text-red-500'
                          : discussionTimer <= 60
                          ? 'text-amber-500'
                          : 'text-blue-500'
                      }
                      style={{
                        strokeDasharray: `${2 * Math.PI * 52}`,
                        strokeDashoffset: `${2 * Math.PI * 52 * (1 - discussionTimer / totalDiscussionTime)}`,
                        transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      key={discussionTimer}
                      initial={{ scale: discussionTimer <= 10 ? 1.15 : 1 }}
                      animate={{ scale: 1 }}
                      className={`text-3xl sm:text-4xl font-black tabular-nums ${
                        discussionTimer <= 30
                          ? 'text-red-400 ' + (discussionTimer <= 10 ? 'animate-pulse' : '')
                          : discussionTimer <= 60
                          ? 'text-amber-400'
                          : 'text-white'
                      }`}
                    >
                      {formatTime(discussionTimer)}
                    </motion.span>
                    <span className="text-[10px] text-slate-500 mt-0.5">متبقي</span>
                  </div>
                </div>

                {/* Progress bar underneath */}
                <Progress
                  value={totalDiscussionTime > 0 ? (discussionTimer / totalDiscussionTime) * 100 : 0}
                  className={`h-1.5 ${
                    discussionTimer <= 30
                      ? '[&>div]:bg-red-500'
                      : discussionTimer <= 60
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-blue-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Players grid */}
          <Card className="bg-slate-900/50 border-slate-700/50 mb-4 sm:mb-6">
            <CardContent className="pt-3 sm:pt-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  اللاعبون ({alivePlayers.length})
                </h3>
                {showRolesToHost && (
                  <Badge className="bg-amber-900/50 text-amber-300 text-[9px] px-1.5 py-0 border border-amber-500/30">
                    👁️ وضع المدير
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 max-h-48 sm:max-h-52 overflow-y-auto mafia-scrollbar">
                {players.map((player) => (
                  <PlayerAvatar
                    key={player.id}
                    name={player.name}
                    isAlive={player.isAlive}
                    isSilenced={player.isSilenced}
                    role={player.role}
                    isRevealed={
                      !!dayResults?.voteEliminated?.id === player.id
                    }
                    size="sm"
                    showRole={
                      showRolesToHost || !!dayResults?.voteEliminated?.id === player.id
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={skipToVoting}
            className="w-full bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold text-base sm:text-lg py-5 sm:py-6 pulse-glow-red"
          >
            <Vote className="w-5 h-5 ml-2" />
            الانتقال إلى التصويت 🔥
          </Button>
        </div>
      </div>
    );
  }

  // NEW: Live voting phase
  if (phase === 'day_voting') {
    return (
      <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 mafia-bg-day">
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Badge
              variant="outline"
              className="border-yellow-500/50 text-yellow-400 text-xs"
            >
              الجولة {round}
            </Badge>
            <Badge
              variant="outline"
              className="border-red-500/50 text-red-300 text-xs"
            >
              🗳️ التصويت المباشر
            </Badge>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-100 mb-4 sm:mb-6">
            <Hand className="w-6 h-6 sm:w-7 sm:h-7 inline ml-2" />
            التصويت 🔥
          </h2>
          <p className="text-yellow-400 text-center text-sm mb-4 sm:mb-6 font-bold">
            اضغط على اسم اللاعب ليصوّت - يمكن لأي لاعب تغيير صوته في أي وقت! حد بده يغير؟ 🔄
          </p>

          <LiveVotingBoard onFinalize={handleFinalizeVotes} />
        </div>
      </div>
    );
  }

  // Elimination phase
  if (phase === 'day_elimination') {
    const eliminated = dayResults?.voteEliminated;
    const isGoodSon = eliminated?.role === 'good_son';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-day">
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto text-center">
          {eliminated ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="blood-splatter mb-4 sm:mb-6"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-950/60 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Skull className="w-10 h-10 sm:w-12 sm:h-12 text-red-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-red-300 mb-2">
                  تم إقصاء {eliminated.name}! 💀
                </h2>

                {/* Vote counts */}
                {dayResults?.voteResults && (
                  <div className="mt-3 sm:mt-4 mb-4 sm:mb-6 bg-slate-900/50 rounded-xl p-3 sm:p-4">
                    <p className="text-slate-400 text-xs sm:text-sm mb-2">
                      نتائج التصويت:
                    </p>
                    <div className="space-y-1.5 sm:space-y-2">
                      {Object.entries(dayResults.voteResults)
                        .filter(([, count]) => count > 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([playerName, count]) => {
                          const totalVotes = Object.values(
                            dayResults.voteResults
                          ).reduce((sum, v) => sum + v, 0);
                          return (
                            <div
                              key={playerName}
                              className="flex items-center gap-2"
                            >
                              <span className="text-slate-300 text-xs sm:text-sm w-20 sm:w-24 truncate text-right">
                                {playerName}
                              </span>
                              <div className="flex-1 h-3.5 sm:h-4 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-l from-red-600 to-red-800 rounded-full vote-bar"
                                  style={{
                                    width: `${
                                      totalVotes > 0
                                        ? (count / totalVotes) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-yellow-400 text-xs sm:text-sm font-bold w-6 sm:w-8 text-left">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </motion.div>

              {gameWinner ? (
                <Button
                  onClick={() => setPhase('game_over')}
                  className="w-full bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
                >
                  <Trophy className="w-5 h-5 ml-2" />
                  عرض النتائج
                </Button>
              ) : isGoodSon ? (
                <Button
                  onClick={() => setPhase('good_son_revenge')}
                  className="w-full bg-gradient-to-l from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
                >
                  <AlertTriangle className="w-5 h-5 ml-2" />
                  الولد الصالح يختار ضحيته!
                </Button>
              ) : (
                <Button
                  onClick={() => setPhase('night_start')}
                  className="w-full bg-gradient-to-l from-indigo-800 to-slate-900 hover:from-indigo-700 hover:to-slate-800 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
                >
                  <Moon className="w-5 h-5 ml-2" />
                  ابدأ الليل
                </Button>
              )}
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 sm:mb-6"
              >
                <span className="text-5xl sm:text-6xl block mb-3 sm:mb-4">
                  ⚖️
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-200 mb-2">
                  تعادل في الأصوات!
                </h2>
                <p className="text-slate-400 text-sm sm:text-base">
                  لم يتم إقصاء أحد هذه الجولة
                </p>
              </motion.div>

              <Button
                onClick={() => setPhase('night_start')}
                className="w-full bg-gradient-to-l from-indigo-800 to-slate-900 hover:from-indigo-700 hover:to-slate-800 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
              >
                <Moon className="w-5 h-5 ml-2" />
                ابدأ الليل
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Good Son Revenge phase
  if (phase === 'good_son_revenge') {
    const selectableTargets = players.filter(
      (p) => p.isAlive && p.role !== 'good_son'
    );

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-night">
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
          <div className="text-center mb-4 sm:mb-6">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="text-5xl sm:text-6xl block mb-3 sm:mb-4"
            >
              👦
            </motion.span>
            <h2 className="text-xl sm:text-2xl font-black text-green-300 mb-2">
              الولد الصالح يختار!
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              اختر شخصاً ليخرج معك من اللعبة
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-56 sm:max-h-64 overflow-y-auto mafia-scrollbar mb-4 sm:mb-6">
            {selectableTargets.map((target) => (
              <div
                key={target.id}
                onClick={() => setSelectedTarget(target.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setSelectedTarget(target.id);
                }}
                className={`rounded-xl p-2 sm:p-3 border-2 transition-all duration-200 cursor-pointer ${
                  selectedTarget === target.id
                    ? 'bg-green-900/60 border-green-500 scale-105'
                    : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500/50'
                }`}
              >
                <PlayerAvatar name={target.name} isAlive={true} role={target.role} size="sm" showRole={showRolesToHost} />
              </div>
            ))}
          </div>

          <Button
            onClick={() => {
              const store = useGameStore.getState();
              store.setGoodSonTarget(selectedTarget!);
              store.processGoodSonRevenge();
              if (store.gameWinner) {
                setPhase('game_over');
              } else {
                setPhase('night_start');
              }
            }}
            disabled={!selectedTarget}
            className="w-full bg-gradient-to-l from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 text-white font-bold text-base sm:text-lg py-5 sm:py-6 disabled:opacity-40"
          >
            <AlertTriangle className="w-5 h-5 ml-2" />
            أخرجه معي!
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
