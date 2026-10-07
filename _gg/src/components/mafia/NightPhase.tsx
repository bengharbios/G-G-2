'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/game-store';
import PlayerAvatar from './PlayerAvatar';
import {
  getAliveMafia,
  getMafiaBoss,
  getSilencer,
  getMedic,
  getSniper,
  getAlivePlayers,
} from '@/lib/game-logic';
import {
  Moon,
  Eye,
  EyeOff,
  ChevronLeft,
  VolumeX,
  Skull,
  Wifi,
  WifiOff,
  Smartphone,
} from 'lucide-react';
import { playNightSound } from '@/lib/sounds';

// ============================================================
// Helper: sync host's night action choice to room DB
// ============================================================
function syncHostNightAction(roomCode: string, roleName: string, targetName: string | null, actionType: string) {
  fetch(`/api/room/${roomCode}/night-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName: roleName, actionType, targetName }),
  }).catch(() => {});
}

export default function NightPhase() {
  const {
    players,
    phase,
    round,
    currentMafiaViewIndex,
    nightActions,
    selectedTarget,
    setPhase,
    setBossTarget,
    setSilencerTarget,
    setMedicTarget,
    setSniperTarget,
    setSniperShooting,
    setMafiaViewIndex,
    setSelectedTarget,
    processNight,
    gameWinner,
    showRolesToHost,
    gameMode,
    roomCode,
  } = useGameStore();

  const isDiwaniya = gameMode === 'diwaniya';
  const [showConfirm, setShowConfirm] = useState(false);
  const [remoteNightAction, setRemoteNightAction] = useState<{ targetName: string | null; actionType: string | null; playerName: string | null } | null>(null);
  const [pollError, setPollError] = useState(false);

  const aliveMafia = getAliveMafia(players);
  const boss = getMafiaBoss(players);
  const silencer = getSilencer(players);
  const medic = getMedic(players);
  const sniper = getSniper(players);
  const alivePlayers = getAlivePlayers(players);

  const handleNextPhase = useCallback(() => {
    setShowConfirm(false);
    setSelectedTarget(null);

    switch (phase) {
      case 'night_start':
        // Skip mafia wake if no mafia alive
        if (aliveMafia.length === 0) {
          if (medic) {
            setPhase('night_medic');
          } else if (sniper) {
            setPhase('night_sniper');
          } else {
            setPhase('night_end');
          }
        } else {
          setPhase('night_mafia_wake');
          setMafiaViewIndex(0);
        }
        break;
      case 'night_mafia_wake':
        if (currentMafiaViewIndex < aliveMafia.length - 1) {
          setMafiaViewIndex(currentMafiaViewIndex + 1);
        } else {
          // Skip boss_kill if no alive boss
          if (boss) {
            setPhase('night_boss_kill');
          } else if (silencer) {
            setPhase('night_silencer');
          } else {
            setPhase('night_mafia_sleep');
          }
        }
        break;
      case 'night_boss_kill':
        // Skip silencer if no alive silencer
        if (silencer) {
          setPhase('night_silencer');
        } else {
          setPhase('night_mafia_sleep');
        }
        break;
      case 'night_silencer':
        setPhase('night_mafia_sleep');
        break;
      case 'night_mafia_sleep':
        if (medic) {
          setPhase('night_medic');
        } else if (sniper) {
          setPhase('night_sniper');
        } else {
          setPhase('night_end');
        }
        break;
      case 'night_medic':
        if (sniper) {
          setPhase('night_sniper');
        } else {
          setPhase('night_end');
        }
        break;
      case 'night_sniper':
        setPhase('night_end');
        break;
      case 'night_end':
        processNight();
        break;
    }
  }, [phase, currentMafiaViewIndex, aliveMafia.length, boss, silencer, medic, sniper, setPhase, setMafiaViewIndex, setSelectedTarget, processNight]);

  // Auto-advance for some phases
  useEffect(() => {
    if (phase === 'night_start' || phase === 'night_mafia_sleep' || phase === 'night_end') {
      // Play owl sound when night starts
      if (phase === 'night_start') {
        playNightSound();
      }
      const timer = setTimeout(() => {
        handleNextPhase();
      }, phase === 'night_end' ? 2000 : 3000);
      return () => clearTimeout(timer);
    }
  }, [phase, handleNextPhase]);

  // Auto-skip dead role phases: if the role holder is dead, skip immediately
  useEffect(() => {
    if (phase === 'night_boss_kill' && !boss) {
      const timer = setTimeout(() => handleNextPhase(), 300);
      return () => clearTimeout(timer);
    }
    if (phase === 'night_silencer' && !silencer) {
      const timer = setTimeout(() => handleNextPhase(), 300);
      return () => clearTimeout(timer);
    }
    if (phase === 'night_medic' && !medic) {
      const timer = setTimeout(() => handleNextPhase(), 300);
      return () => clearTimeout(timer);
    }
    if (phase === 'night_sniper' && !sniper) {
      const timer = setTimeout(() => handleNextPhase(), 300);
      return () => clearTimeout(timer);
    }
  }, [phase, boss, silencer, medic, sniper, handleNextPhase]);

  // ============================================================
  // DIWANIYA MODE: Poll for remote night actions
  // ============================================================
  const pollRemoteNightActions = useCallback(async () => {
    if (!isDiwaniya || !roomCode) return;
    try {
      const res = await fetch(`/api/room/${roomCode}`);
      if (!res.ok) { setPollError(true); return; }
      const room = await res.json();
      setPollError(false);

      // Map: phase → role → find player with that role who has nightActionTarget set
      const phaseRoleMap: Record<string, string | null> = {
        night_boss_kill: boss?.name || null,
        night_silencer: silencer?.name || null,
        night_medic: medic?.name || null,
        night_sniper: sniper?.name || null,
      };

      const expectedRoleName = phaseRoleMap[phase];
      if (!expectedRoleName) return;

      // Find the role-holder player who has submitted a night action
      // Also detect sniper_hold (which has nightActionTarget=null but nightActionType='sniper_hold')
      const remotePlayer = room.players?.find((p: { name: string; nightActionTarget: string | null; nightActionType: string | null }) =>
        p.name === expectedRoleName && (p.nightActionTarget || p.nightActionType === 'sniper_hold')
      );

      if (remotePlayer) {
        setRemoteNightAction({
          targetName: remotePlayer.nightActionTarget,
          actionType: remotePlayer.nightActionType,
          playerName: remotePlayer.name,
        });

        // Auto-apply remote player's choice to local state (so processNight works correctly)
        const targetLocalId = players.find((p) => p.name === remotePlayer.nightActionTarget)?.id || null;
        if (remotePlayer.nightActionType === 'boss_kill' && targetLocalId) {
          setBossTarget(targetLocalId);
        } else if (remotePlayer.nightActionType === 'silencer' && targetLocalId) {
          setSilencerTarget(targetLocalId);
        } else if (remotePlayer.nightActionType === 'medic_save' && targetLocalId) {
          setMedicTarget(targetLocalId);
        } else if (remotePlayer.nightActionType === 'sniper_shoot' && targetLocalId) {
          setSniperShooting(true);
          setSniperTarget(targetLocalId);
        } else if (remotePlayer.nightActionType === 'sniper_hold') {
          setSniperShooting(false);
        }
      } else {
        setRemoteNightAction(null);
      }
    } catch {
      setPollError(true);
    }
  }, [isDiwaniya, roomCode, phase, boss, silencer, medic, sniper, players, setBossTarget, setSilencerTarget, setMedicTarget, setSniperTarget, setSniperShooting]);

  useEffect(() => {
    if (!isDiwaniya || !roomCode) return;
    // Only poll during active night phases
    const activePhases = ['night_boss_kill', 'night_silencer', 'night_medic', 'night_sniper'];
    if (!activePhases.includes(phase)) {
      setRemoteNightAction(null);
      return;
    }
    pollRemoteNightActions();
    const interval = setInterval(pollRemoteNightActions, 2000);
    return () => clearInterval(interval);
  }, [isDiwaniya, roomCode, phase, pollRemoteNightActions]);

  // When host makes a choice in Diwaniya mode, sync to room DB
  const syncHostChoice = useCallback((roleName: string, targetName: string | null, actionType: string) => {
    if (!isDiwaniya || !roomCode) return;
    syncHostNightAction(roomCode, roleName, targetName, actionType);
  }, [isDiwaniya, roomCode]);

  const canProceed = () => {
    switch (phase) {
      case 'night_boss_kill':
        // If no boss alive, can proceed (will be skipped)
        if (!boss) return true;
        return nightActions.bossTarget !== null;
      case 'night_silencer':
        // If no silencer alive, can proceed (will be skipped)
        if (!silencer) return true;
        return nightActions.silencerTarget !== null;
      case 'night_medic':
        return nightActions.medicTarget !== null;
      case 'night_sniper':
        return !nightActions.sniperShooting || nightActions.sniperTarget !== null;
      default:
        return true;
    }
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case 'night_start':
        return '🌙 التغميضة';
      case 'night_mafia_wake':
        return '👾 المافيا تستيقظ';
      case 'night_boss_kill':
        return '🔪 شيخ المافيا يختار';
      case 'night_silencer':
        return '🤫 التسكيت';
      case 'night_mafia_sleep':
        return '😴 المافيا تنام';
      case 'night_medic':
        return '🏥 الطبيب';
      case 'night_sniper':
        return '🎯 القناص';
      case 'night_end':
        return '🌅 انتهت الليل';
      default:
        return '';
    }
  };

  const getPhaseDescription = () => {
    switch (phase) {
      case 'night_start':
        return 'أغمضوا أعينكم يا جماعة! الليلة رح تكون حامية! 🔥';
      case 'night_mafia_wake':
        return 'المافيا الثلاثة... افتحوا بعدين تعرفوا على بعض بالظلام! 👀';
      case 'night_boss_kill':
        return `${boss?.name}... اختر ضحيتك بحكمة! دم أو ابتسامة؟ 🩸`;
      case 'night_silencer':
        return `${silencer?.name}... اختر مين بده يمشي مسكوت هالجولة! 🤫`;
      case 'night_mafia_sleep':
        return 'المافيا... ناموا حلوين! وبلا أحلام موالية! 😴';
      case 'night_medic':
        return `${medic?.name}... خمّن صح وانقذ حياة! أو تخطئ وتندم! 💊`;
      case 'night_sniper':
        return `${sniper?.name}... عندك رصاصة وحدة! إما تقتل المافيا أو تموت معاه! 🔫`;
      case 'night_end':
        return 'افتحوا أعينكم يا جماعة! شوفوا شو صار هالليل! 👁️';
      default:
        return '';
    }
  };

  const renderTargetSelection = (
    title: string,
    targets: typeof players,
    onSelect: (id: string | null) => void,
    currentTarget: string | null,
    excludeIds: string[] = []
  ) => {
    const selectable = targets.filter(
      (p) => p.isAlive && !excludeIds.includes(p.id)
    );

    // Host can always choose (even in Diwaniya, in case player disconnects)
    const isReadOnly = false;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <p className="text-slate-300 text-xs sm:text-sm text-center mb-2 sm:mb-3 font-bold">{title}</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-52 sm:max-h-60 overflow-y-auto mafia-scrollbar">
          {selectable.map((player) => (
            <div
              key={player.id}
              onClick={isReadOnly ? undefined : () => onSelect(player.id)}
              role={isReadOnly ? undefined : "button"}
              tabIndex={isReadOnly ? undefined : 0}
              onKeyDown={isReadOnly ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(player.id); }}
              className={`rounded-xl p-2 sm:p-3 border-2 transition-all duration-200 ${
                isReadOnly ? 'cursor-default ' : 'cursor-pointer '
              }${
                currentTarget === player.id
                  ? 'bg-red-900/60 border-red-500 scale-105'
                  : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-800'
              }`}
            >
              <PlayerAvatar
                name={player.name}
                isAlive={true}
                role={player.role}
                size="sm"
                showRole={showRolesToHost}
              />
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-night">
      {/* Moon */}
      <div className="fixed top-8 right-8 sm:top-10 sm:right-10 z-0">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-80 moon-glow"
          style={{
            boxShadow: '0 0 40px rgba(234, 179, 8, 0.3), 0 0 80px rgba(234, 179, 8, 0.1)',
          }}
        />
      </div>

      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
        {/* Round indicator */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs">
            الجولة {round}
          </Badge>
          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
            🌙 الليل
          </Badge>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            {/* Phase title */}
            <div className="text-center mb-6 sm:mb-8">
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl sm:text-3xl font-black text-slate-100 mb-2"
              >
                {getPhaseTitle()}
              </motion.h2>
              <p className="text-slate-400 text-sm sm:text-base">{getPhaseDescription()}</p>
            </div>

            {/* Phase content */}
            {phase === 'night_start' && (
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-900 to-slate-950 border-2 border-indigo-500/30 flex items-center justify-center pulse-glow-blue"
                >
                  <span className="text-5xl sm:text-6xl">🌙</span>
                </motion.div>
              </div>
            )}

            {phase === 'night_mafia_wake' && aliveMafia[currentMafiaViewIndex] && (
              <Card className="bg-red-950/50 border-red-500/30 mb-4 sm:mb-6">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <p className="text-red-300 text-xs sm:text-sm mb-3">
                      مرر الجهاز إلى:
                    </p>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-900/50 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl sm:text-2xl font-bold text-red-200">
                        {aliveMafia[currentMafiaViewIndex]?.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-red-100">
                      {aliveMafia[currentMafiaViewIndex]?.name}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                      <span className="text-red-400 text-xs sm:text-sm">زميلائك:</span>
                      {aliveMafia
                        .filter(
                          (m) => m.id !== aliveMafia[currentMafiaViewIndex]?.id
                        )
                        .map((m) => (
                          <Badge
                            key={m.id}
                            className="bg-red-900/50 text-red-200 border-red-500/30 text-xs"
                          >
                            {m.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {phase === 'night_boss_kill' && (
              <>
                {/* Diwaniya mode: show remote action status */}
                {isDiwaniya && (
                  <div className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 mb-3 text-xs font-bold ${
                    pollError
                      ? 'bg-red-950/40 border border-red-500/30 text-red-400'
                      : remoteNightAction
                      ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400'
                      : 'bg-green-950/30 border border-green-500/20 text-green-400'
                  }`}>
                    {pollError ? (
                      <><WifiOff className="w-3.5 h-3.5" /> تعذّر الاتصال</>
                    ) : remoteNightAction ? (
                      <><Smartphone className="w-3.5 h-3.5" /> وصل اختيار شيخ المافيا ✓</>
                    ) : (
                      <><Wifi className="w-3.5 h-3.5" /> بانتظار اختيار شيخ المافيا من جهازه...</>
                    )}
                  </div>
                )}
                {remoteNightAction && phase === 'night_boss_kill' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 mb-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="font-bold">{remoteNightAction.playerName}</span>
                      <span>اختار:</span>
                      <span className="font-black text-white">{remoteNightAction.targetName}</span>
                    </div>
                  </motion.div>
                )}
                {renderTargetSelection(
                  isDiwaniya ? '🎯 اللاعب يختار ضحيية:' : 'اختر ضحيتك:',
                  players,
                  (id) => {
                    setBossTarget(id);
                    const targetName = players.find(p => p.id === id)?.name || null;
                    syncHostChoice(boss?.name || '', targetName, 'boss_kill');
                  },
                  nightActions.bossTarget,
                  aliveMafia.map((m) => m.id)
                )}
                {nightActions.bossTarget && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 sm:mt-4 text-center"
                  >
                    <Badge className="bg-red-900/80 text-red-200 border-red-500/30 px-3 sm:px-4 py-1 text-xs sm:text-sm">
                      <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                      الهدف: {players.find((p) => p.id === nightActions.bossTarget)?.name}
                    </Badge>
                  </motion.div>
                )}
              </>
            )}

            {phase === 'night_silencer' && (
              <>
                {isDiwaniya && (
                  <div className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 mb-3 text-xs font-bold ${
                    pollError ? 'bg-red-950/40 border border-red-500/30 text-red-400' 
                    : remoteNightAction ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400'
                    : 'bg-green-950/30 border border-green-500/20 text-green-400'
                  }`}>
                    {pollError ? (<><WifiOff className="w-3.5 h-3.5" /> تعذّر الاتصال</>) 
                    : remoteNightAction ? (<><Smartphone className="w-3.5 h-3.5" /> وصل اختيار التسكيت ✓</>)
                    : (<><Wifi className="w-3.5 h-3.5" /> بانتظار اختيار التسكيت من جهازه...</>)}
                  </div>
                )}
                {remoteNightAction && phase === 'night_silencer' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 mb-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="font-bold">{remoteNightAction.playerName}</span>
                      <span>اختار تسكيت:</span>
                      <span className="font-black text-white">{remoteNightAction.targetName}</span>
                    </div>
                  </motion.div>
                )}
                {renderTargetSelection(
                  isDiwaniya ? '🤫 اللاعب يختار من يسكته:' : 'اختر من تريد تسكيته:',
                  players,
                  (id) => {
                    setSilencerTarget(id);
                    const targetName = players.find(p => p.id === id)?.name || null;
                    syncHostChoice(silencer?.name || '', targetName, 'silencer');
                  },
                  nightActions.silencerTarget,
                  []
                )}
                {nightActions.silencerTarget && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 sm:mt-4 text-center"
                  >
                    <Badge className="bg-purple-900/80 text-purple-200 border-purple-500/30 px-3 sm:px-4 py-1 text-xs sm:text-sm">
                      <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                      التسكيت: {players.find((p) => p.id === nightActions.silencerTarget)?.name}
                    </Badge>
                  </motion.div>
                )}
              </>
            )}

            {phase === 'night_medic' && (
              <>
                {isDiwaniya && (
                  <div className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 mb-3 text-xs font-bold ${
                    pollError ? 'bg-red-950/40 border border-red-500/30 text-red-400' 
                    : remoteNightAction ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400'
                    : 'bg-green-950/30 border border-green-500/20 text-green-400'
                  }`}>
                    {pollError ? (<><WifiOff className="w-3.5 h-3.5" /> تعذّر الاتصال</>) 
                    : remoteNightAction ? (<><Smartphone className="w-3.5 h-3.5" /> وصل اختيار الطبيب ✓</>)
                    : (<><Wifi className="w-3.5 h-3.5" /> بانتظار اختيار الطبيب من جهازه...</>)}
                  </div>
                )}
                {remoteNightAction && phase === 'night_medic' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 mb-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="font-bold">{remoteNightAction.playerName}</span>
                      <span>اختار إنقاذ:</span>
                      <span className="font-black text-white">{remoteNightAction.targetName}</span>
                    </div>
                  </motion.div>
                )}
                {renderTargetSelection(
                  isDiwaniya ? '🏥 اللاعب يختار من سينقذ:' : 'من تعتقد أنه سيُقتل؟',
                  players,
                  (id) => {
                    setMedicTarget(id);
                    const targetName = players.find(p => p.id === id)?.name || null;
                    syncHostChoice(medic?.name || '', targetName, 'medic_save');
                  },
                  nightActions.medicTarget,
                  []
                )}
                {nightActions.medicTarget && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 sm:mt-4 text-center"
                  >
                    <Badge className="bg-cyan-900/80 text-cyan-200 border-cyan-500/30 px-3 sm:px-4 py-1 text-xs sm:text-sm">
                      🏥
                      إنقاذ: {players.find((p) => p.id === nightActions.medicTarget)?.name}
                    </Badge>
                  </motion.div>
                )}
              </>
            )}

            {phase === 'night_sniper' && (
              <div className="space-y-3 sm:space-y-4">
                {isDiwaniya && (
                  <div className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                    pollError ? 'bg-red-950/40 border border-red-500/30 text-red-400' 
                    : remoteNightAction ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400'
                    : 'bg-green-950/30 border border-green-500/20 text-green-400'
                  }`}>
                    {pollError ? (<><WifiOff className="w-3.5 h-3.5" /> تعذّر الاتصال</>) 
                    : remoteNightAction ? (<><Smartphone className="w-3.5 h-3.5" /> وصل اختيار القناص ✓</>)
                    : (<><Wifi className="w-3.5 h-3.5" /> بانتظار اختيار القناص من جهازه...</>)}
                  </div>
                )}
                {remoteNightAction && phase === 'night_sniper' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="font-bold">{remoteNightAction.playerName}</span>
                      {remoteNightAction.actionType === 'sniper_hold' ? (
                        <span>أمسك الرصاصة 🤲</span>
                      ) : (
                        <><span>أطلق على:</span><span className="font-black text-white">{remoteNightAction.targetName}</span></>
                      )}
                    </div>
                  </motion.div>
                )}
                {/* Sniper can choose from host device OR their own device */}
                <>
                  <div className="flex gap-2 sm:gap-3 justify-center">
                      <Button
                        onClick={() => {
                          setSniperShooting(false);
                          setSelectedTarget(null);
                          syncHostChoice(sniper?.name || '', null, 'sniper_hold');
                        }}
                        className={`flex-1 py-3 sm:py-4 text-sm sm:text-base ${
                          !nightActions.sniperShooting
                            ? 'bg-slate-700 text-slate-200 border-slate-500'
                            : 'bg-slate-800/50 text-slate-500 border-slate-700'
                        } border-2`}
                      >
                        أمسك الرصاصة 🤲
                      </Button>
                      <Button
                        onClick={() => setSniperShooting(true)}
                        className={`flex-1 py-3 sm:py-4 text-sm sm:text-base ${
                          nightActions.sniperShooting
                            ? 'bg-amber-700 text-amber-100 border-amber-500'
                            : 'bg-slate-800/50 text-slate-500 border-slate-700'
                        } border-2`}
                      >
                        أطلق الرصاصة 🔫
                      </Button>
                    </div>

                    {nightActions.sniperShooting && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        {renderTargetSelection(
                          'اختر هدفك:',
                          players,
                          (id) => {
                            setSniperTarget(id);
                            const targetName = players.find(p => p.id === id)?.name || null;
                            syncHostChoice(sniper?.name || '', targetName, 'sniper_shoot');
                          },
                          nightActions.sniperTarget,
                          [sniper?.id || '']
                        )}
                      </motion.div>
                    )}

                    {!nightActions.sniperShooting && sniper && !sniper.sniperBulletUsed && (
                      <p className="text-slate-500 text-xs sm:text-sm text-center">
                        الرصاصة محفوظة للجولات القادمة
                      </p>
                    )}
                  </>
              </div>
            )}

            {phase === 'night_end' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl sm:text-6xl mb-3 sm:mb-4"
                >
                  🌅
                </motion.div>
                <p className="text-yellow-400 text-base sm:text-lg font-bold">
                  افتحوا أعينكم...
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        {phase !== 'night_start' && phase !== 'night_mafia_sleep' && phase !== 'night_end' && (
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button
              onClick={handleNextPhase}
              disabled={!canProceed()}
              className="bg-gradient-to-l from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold px-6 sm:px-8 py-4 sm:py-5 text-sm sm:text-base disabled:opacity-40"
            >
              {phase === 'night_mafia_wake' && currentMafiaViewIndex < aliveMafia.length - 1
                ? 'اللاعب التالي'
                : 'التالي'}
              <ChevronLeft className="w-4 h-4 mr-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
