'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTabotStore } from '@/lib/tabot-store';
import type { TabotTeam, TabotPlayer } from '@/lib/tabot-types';
import { generateTabotId } from '@/lib/tabot-types';
import { Copy, Check, Users, Crown, Star, Plus, X, Palette, Wifi, Loader2, Eye, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// INLINE TEAM COLORS
// ============================================================
const TEAM_COLORS = [
  { name: 'بنفسجي', value: '#a855f7' },
  { name: 'برتقالي', value: '#f97316' },
  { name: 'أزرق', value: '#3b82f6' },
  { name: 'أخضر', value: '#22c55e' },
];

// ============================================================
// JOIN REQUEST TYPE
// ============================================================
interface JoinRequest {
  id: string;
  name: string;
  status: 'pending' | 'accepted' | 'rejected';
  teamId?: string;
  role?: 'leader' | 'deputy' | 'member' | 'guest';
}

// ============================================================
// LOCAL TYPES (for setup UI management)
// ============================================================
interface LocalTeam {
  id: string;
  name: string;
  color: string;
}

interface LocalPlayer {
  id: string;
  name: string;
  teamId: string;
  isLeader: boolean;
  isDeputy: boolean;
  isGuest: boolean;
}

// ============================================================
// COMPONENT
// ============================================================
interface DiwaniyaSetupProps {
  onStartGame: () => void;
}

export default function DiwaniyaSetup({ onStartGame }: DiwaniyaSetupProps) {
  const setRoomCode = useTabotStore((s) => s.setRoomCode);
  const setHostName = useTabotStore((s) => s.setHostName);
  const startGame = useTabotStore((s) => s.startGame);

  // Step management
  const [step, setStep] = useState<'create' | 'waiting' | 'teams' | 'ready'>('create');
  const [hostName, setLocalHostName] = useState('');

  // Room
  const [roomCode, setLocalRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Players from approved join requests
  const [localTeams] = useState<LocalTeam[]>([
    {
      id: generateTabotId('local-team'),
      name: 'الفريق الأول',
      color: TEAM_COLORS[0].value,
    },
    {
      id: generateTabotId('local-team'),
      name: 'الفريق الثاني',
      color: TEAM_COLORS[1].value,
    },
  ]);
  const [players, setLocalPlayers] = useState<LocalPlayer[]>([]);

  // Join requests
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  // Simulated names
  const simulateNames = [
    'أحمد 👨', 'سارة 👩', 'خالد 💪', 'نورة 🌸', 'فهد 🦅',
    'ريم ✨', 'عبدالله 👑', 'لطيفة 🌺', 'ماجد 🔥', 'هند 💎',
  ];
  let simulateIndex = 0;

  // ---- Create Room ----
  const createRoom = async () => {
    if (!hostName.trim()) return;

    setIsCreating(true);
    setHostName(hostName.trim());

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLocalRoomCode(code);
    setRoomCode(code);

    // Add host as player in first team
    setLocalPlayers([{
      id: generateTabotId('player'),
      name: hostName.trim(),
      teamId: localTeams[0].id,
      isLeader: true,
      isDeputy: false,
      isGuest: false,
    }]);

    setRoomCreated(true);
    setIsCreating(false);
    setStep('waiting');
  };

  const [roomCreated, setRoomCreated] = useState(false);

  // ---- Copy Functions ----
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/tabot/join/${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ---- Simulate Join Request ----
  const simulateJoinRequest = () => {
    const name = simulateNames[simulateIndex % simulateNames.length];
    simulateIndex++;

    const request: JoinRequest = {
      id: generateTabotId('join'),
      name,
      status: 'pending',
    };

    setJoinRequests((prev) => [...prev, request]);
  };

  // ---- Accept/Reject Join Request ----
  const acceptRequest = (requestId: string, teamId: string, role: string) => {
    setJoinRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: 'accepted' as const, teamId, role: role as JoinRequest['role'] }
          : r
      )
    );

    const request = joinRequests.find((r) => r.id === requestId);
    if (!request) return;

    const playerName = request.name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    const isLeader = role === 'leader';
    const isDeputy = role === 'deputy';
    const isGuest = role === 'guest';

    setLocalPlayers((prev) => [
      ...prev,
      {
        id: generateTabotId('player'),
        name: playerName,
        teamId,
        isLeader,
        isDeputy,
        isGuest,
      },
    ]);
  };

  const rejectRequest = (requestId: string) => {
    setJoinRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'rejected' as const } : r
      )
    );
  };

  // ---- Helpers ----
  const getTotalPlayers = () => players.length;

  const canStart = () => {
    if (!roomCreated) return false;
    // Check each team has at least 2 players with a leader
    for (const team of localTeams) {
      const teamPlayers = players.filter((p) => p.teamId === team.id);
      if (teamPlayers.length < 2) return false;
      if (!teamPlayers.some((p) => p.isLeader)) return false;
      const validPlayers = teamPlayers.filter((p) => p.name.trim() !== '');
      if (validPlayers.length < 2) return false;
    }
    return getTotalPlayers() >= 4;
  };

  // ---- Start Game ----
  const handleStart = () => {
    const storeTeams: TabotTeam[] = [];
    const storePlayers: TabotPlayer[] = [];

    for (const localTeam of localTeams) {
      const teamId = generateTabotId('team');
      let leaderId: string | null = null;
      let deputyId: string | null = null;

      const localTeamPlayers = players.filter(
        (p) => p.teamId === localTeam.id && p.name.trim() !== ''
      );

      for (const localPlayer of localTeamPlayers) {
        const playerId = generateTabotId('player');
        const isLeader = localPlayer.isLeader;
        const isDeputy = localPlayer.isDeputy;
        const isGuest = localPlayer.isGuest;

        if (isLeader) leaderId = playerId;
        if (isDeputy) deputyId = playerId;

        storePlayers.push({
          id: playerId,
          name: localPlayer.name.trim(),
          teamId,
          isLeader,
          isDeputy,
          isGuest,
          status: isGuest ? 'guest' : 'active',
          joinApproved: true,
          hasJoined: true,
        });
      }

      storeTeams.push({
        id: teamId,
        name: localTeam.name,
        leaderId,
        deputyId,
        color: localTeam.color,
        score: 0,
      });
    }

    useTabotStore.setState({
      teams: storeTeams,
      players: storePlayers,
      phase: 'team_setup',
      gameLog: [
        {
          round: 0,
          phase: 'setup',
          message: 'تم إعداد الفرق',
          timestamp: Date.now(),
        },
      ],
    });

    startGame();
    onStartGame();
  };

  // ============================================================
  // STEP 1: CREATE ROOM
  // ============================================================
  if (step === 'create') {
    return (
      <div className="flex flex-col items-center py-6 sm:py-8 px-3 sm:px-4 tabot-bg" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm sm:max-w-md mx-auto"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-5xl mb-3"
            >
              🪦
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-black text-orange-300 mb-2">
              إنشاء غرفة ⚱️
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              أنشئ غرفة وشارك الكود مع أصدقائك 👻
            </p>
          </div>

          <Card className="bg-gradient-to-bl from-orange-950/40 via-slate-900/80 to-slate-900/80 border-orange-500/30">
            <CardContent className="pt-5 sm:pt-6">
              {/* Host name */}
              <div className="mb-4">
                <label className="text-xs text-slate-400 mb-1 block">
                  اسمك (المستضيف) 👑
                </label>
                <Input
                  value={hostName}
                  onChange={(e) => setLocalHostName(e.target.value)}
                  className="bg-slate-800/50 border-orange-500/30 text-slate-200 h-12 text-sm"
                  placeholder="اسمك في اللعبة..."
                />
              </div>

              {/* Create room button */}
              <Button
                onClick={createRoom}
                disabled={isCreating || !hostName.trim()}
                className="w-full bg-gradient-to-l from-orange-600 to-red-800 hover:from-orange-500 hover:to-red-700 text-white font-bold text-base py-5 sm:py-6 transition-all duration-300 pulse-glow-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري إنشاء الغرفة...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wifi className="w-5 h-5" />
                    إنشاء غرفة جديدة 🔥
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // STEP 2 & 3: WAITING FOR PLAYERS
  // ============================================================
  if (step === 'waiting') {
    const pendingRequests = joinRequests.filter((r) => r.status === 'pending');
    const acceptedRequests = joinRequests.filter((r) => r.status === 'accepted');
    const rejectedRequests = joinRequests.filter((r) => r.status === 'rejected');

    return (
      <div className="flex flex-col items-center py-4 sm:py-6 px-3 sm:px-4 tabot-bg" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm sm:max-w-md mx-auto space-y-4"
        >
          {/* Room Code Banner */}
          <Card className="bg-gradient-to-l from-orange-900/50 to-purple-900/50 border-orange-500/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] sm:text-xs text-orange-300">📋 كود الغرفة:</p>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-widest">
                    {roomCode}
                  </p>
                </div>
                <button
                  onClick={copyCode}
                  className="text-xs bg-orange-800/50 text-orange-200 px-3 py-2 rounded-lg hover:bg-orange-700/50 transition-colors cursor-pointer"
                >
                  {copiedCode ? '✅ تم!' : '📋 نسخ الكود'}
                </button>
              </div>
              <button
                onClick={copyLink}
                className="w-full text-xs bg-purple-800/30 text-purple-200 px-3 py-2 rounded-lg hover:bg-purple-700/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {copiedLink ? '✅ تم نسخ الرابط!' : '🔗 نسخ الرابط'}
              </button>
            </CardContent>
          </Card>

          {/* Waiting indicator */}
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
            <span className="text-xs text-green-400">
              بانتظار اللاعبين
              <span className="inline-flex gap-0.5 mr-1">
                <span style={{ animation: 'waitingDots 1.4s infinite', animationDelay: '0s' }}>.</span>
                <span style={{ animation: 'waitingDots 1.4s infinite', animationDelay: '0.2s' }}>.</span>
                <span style={{ animation: 'waitingDots 1.4s infinite', animationDelay: '0.4s' }}>.</span>
              </span>
            </span>
          </div>

          {/* Empty state */}
          {joinRequests.length === 0 && (
            <Card className="bg-slate-900/40 border-slate-700/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">🦇</div>
                <p className="text-xs text-slate-500">لم ينضم أحد بعد...</p>
                <p className="text-[10px] text-slate-600 mt-1">شارك الكود مع أصدقائك!</p>
              </CardContent>
            </Card>
          )}

          {/* Simulate button */}
          <Button
            onClick={simulateJoinRequest}
            variant="ghost"
            className="w-full text-xs border border-dashed border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
          >
            🧪 محاكاة طلب انضمام
          </Button>

          {/* Accepted players */}
          {acceptedRequests.length > 0 && (
            <Card className="bg-slate-900/60 border-green-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-green-400 mb-2 font-bold">✅ اللاعبون المقبولون:</p>
                <div className="space-y-1.5">
                  {acceptedRequests.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 bg-green-950/20 rounded-lg p-2 text-xs"
                    >
                      <span className="text-green-400 font-bold">✅</span>
                      <span className="text-slate-300 flex-1">{r.name}</span>
                      <span className="text-slate-500 text-[10px]">
                        {localTeams.find((t) => t.id === r.teamId)?.name}
                      </span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                        {r.role === 'leader' ? '👑 قائد' : r.role === 'deputy' ? '⭐ نائب' : r.role === 'guest' ? '👁️ ضيف' : '👤 عضو'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejected players */}
          {rejectedRequests.length > 0 && (
            <Card className="bg-slate-900/60 border-red-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-red-400 mb-2 font-bold">❌ المرفوضون:</p>
                <div className="space-y-1.5">
                  {rejectedRequests.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 bg-red-950/20 rounded-lg p-2 text-xs"
                    >
                      <span className="text-red-400 font-bold">❌</span>
                      <span className="text-slate-400">{r.name}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Join Requests */}
          {pendingRequests.length > 0 && (
            <Card className="bg-slate-900/60 border-yellow-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-yellow-400 mb-3 font-bold">📋 طلبات الانضمام الجديدة:</p>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-800/50 rounded-xl p-3 space-y-3"
                    >
                      {/* Player info */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🦇</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-200">
                            {request.name}
                          </p>
                          <p className="text-[10px] text-slate-500">يريد الانضمام...</p>
                        </div>
                      </div>

                      {/* Team assignment */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <label className="text-[10px] text-slate-400 w-16 shrink-0 pt-1.5">
                            الفريق:
                          </label>
                          <div className="flex gap-1.5 flex-1">
                            {localTeams.map((team) => (
                              <button
                                key={team.id}
                                onClick={() => {
                                  setJoinRequests((prev) =>
                                    prev.map((r) =>
                                      r.id === request.id
                                        ? { ...r, teamId: team.id }
                                        : r
                                    )
                                  );
                                }}
                                className={cn(
                                  'flex-1 text-[10px] py-1.5 px-2 rounded-lg border transition-all cursor-pointer',
                                  request.teamId === team.id
                                    ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                                    : 'border-slate-700 text-slate-500 hover:border-slate-600'
                                )}
                                style={request.teamId === team.id ? { borderColor: team.color + '60' } : {}}
                              >
                                <div
                                  className="w-2 h-2 rounded-full mx-auto mb-0.5"
                                  style={{ backgroundColor: team.color }}
                                />
                                {team.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Role assignment */}
                        <div className="flex gap-2">
                          <label className="text-[10px] text-slate-400 w-16 shrink-0 pt-1.5">
                            الدور:
                          </label>
                          <div className="flex gap-1 flex-1">
                            {[
                              { key: 'leader', label: '👑 قائد' },
                              { key: 'deputy', label: '⭐ نائب' },
                              { key: 'member', label: '👤 عضو' },
                              { key: 'guest', label: '👁️ ضيف' },
                            ].map((roleOpt) => (
                              <button
                                key={roleOpt.key}
                                onClick={() => {
                                  setJoinRequests((prev) =>
                                    prev.map((r) =>
                                      r.id === request.id
                                        ? { ...r, role: roleOpt.key as JoinRequest['role'] }
                                        : r
                                    )
                                  );
                                }}
                                className={cn(
                                  'flex-1 text-[10px] py-1.5 px-1 rounded-lg border transition-all cursor-pointer',
                                  request.role === roleOpt.key
                                    ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                                    : 'border-slate-700 text-slate-500 hover:border-slate-600'
                                )}
                              >
                                {roleOpt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Accept / Reject buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (!request.teamId || !request.role) return;
                            acceptRequest(request.id, request.teamId, request.role);
                          }}
                          disabled={!request.teamId || !request.role}
                          className="flex-1 text-xs bg-green-600/30 text-green-300 hover:bg-green-600/50 border border-green-600/30 h-8 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ✅ قبول
                        </Button>
                        <Button
                          onClick={() => rejectRequest(request.id)}
                          className="flex-1 text-xs bg-red-600/30 text-red-300 hover:bg-red-600/50 border border-red-600/30 h-8"
                        >
                          ❌ رفض
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Go to team setup */}
          <Button
            onClick={() => setStep('teams')}
            className="w-full text-xs border border-dashed border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
          >
            👥 الانتقال لإعداد الفرق ({players.length} لاعب)
          </Button>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // STEP 4: TEAM SETUP (players already from approvals)
  // ============================================================
  if (step === 'teams') {
    return (
      <div className="flex flex-col items-center py-4 sm:py-6 px-3 sm:px-4 tabot-bg" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm sm:max-w-md mx-auto space-y-4"
        >
          {/* Room Code */}
          <Card className="bg-gradient-to-l from-orange-900/30 to-purple-900/30 border-orange-500/20">
            <CardContent className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">كود:</span>
                <span className="text-sm font-mono font-bold text-orange-300">{roomCode}</span>
              </div>
              <button
                onClick={() => setStep('waiting')}
                className="text-[10px] text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                ← العودة لطلبات الانضمام
              </button>
            </CardContent>
          </Card>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-black text-purple-300 mb-1">
              ⚰️ إعداد الفرق
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400">
              تأكد من الفرق والأدوار قبل البدء 👻
            </p>
          </div>

          {/* Team cards */}
          {localTeams.map((team) => {
            const teamPlayers = players.filter((p) => p.teamId === team.id);
            return (
              <Card
                key={team.id}
                className="overflow-hidden"
                style={{
                  borderColor: team.color + '40',
                  background: `linear-gradient(to bottom left, ${team.color}10, rgba(15, 10, 46, 0.6))`,
                }}
              >
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ backgroundColor: team.color + '10' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <h3 className="text-sm font-bold text-slate-200">{team.name}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400">{teamPlayers.length} لاعب</span>
                </div>
                <CardContent className="p-3">
                  <div className="space-y-1.5">
                    {teamPlayers.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-2">لا يوجد لاعبون</p>
                    )}
                    {teamPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5"
                      >
                        <span className="text-xs text-slate-300 flex-1">{player.name}</span>
                        <div className="flex gap-1 shrink-0">
                          {player.isLeader && (
                            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">
                              👑 قائد
                            </span>
                          )}
                          {player.isDeputy && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">
                              ⭐ نائب
                            </span>
                          )}
                          {player.isGuest && (
                            <span className="text-[9px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                              👁️ ضيف
                            </span>
                          )}
                          {!player.isLeader && !player.isDeputy && !player.isGuest && (
                            <span className="text-[9px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded-full">
                              👤 عضو
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Warnings */}
          {getTotalPlayers() < 4 && (
            <div className="flex items-center gap-2 p-2.5 bg-yellow-950/30 border border-yellow-600/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-[10px] text-yellow-400">
                يجب أن يكون 4 لاعبين على الأقل لبدء اللعبة ⚰️
              </p>
            </div>
          )}

          {/* Start button */}
          <Button
            onClick={handleStart}
            disabled={!canStart()}
            className={cn(
              'w-full font-bold text-base py-5 transition-all duration-300',
              canStart()
                ? 'bg-gradient-to-l from-purple-600 to-orange-800 hover:from-purple-500 hover:to-orange-700 text-white pulse-glow-purple'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            )}
          >
            ابدأ اللعبة 💀 ({getTotalPlayers()} لاعب)
          </Button>
        </motion.div>
      </div>
    );
  }

  // Fallback
  return null;
}
