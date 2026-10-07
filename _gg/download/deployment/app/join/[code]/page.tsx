'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLE_CONFIGS, type RoleType } from '@/lib/game-types';
import type { EliminationEvent } from '@/lib/game-types';
import { useToast } from '@/hooks/use-toast';
import { Timer, Eye } from 'lucide-react';
import WelcomePopup from '@/components/mafia/WelcomePopup';
import { playNightSound, playDaySound, playBgMusic } from '@/lib/sounds';
import TabotSpectatorView from '@/components/tabot/TabotSpectatorView';

// ============================================================
// Types for room state
// ============================================================
interface RoomState {
  id: string;
  code: string;
  phase: string;
  round: number;
  gameWinner: string | null;
  hostName: string;
  playerCount: number;
  stateJson: string;
  resultsJson: string | null;
  updatedAt: string;
  hostLastSeen: string;
  players: RoomPlayerState[];
  isEnded?: boolean;
  gameType?: string | null;
}

interface RoomPlayerState {
  id: string;
  name: string;
  role: string | null;
  isAlive: boolean;
  isSilenced: boolean;
  hasRevealedMayor: boolean;
  voteTarget: string | null;
  nightActionTarget: string | null;
  nightActionType: string | null;
  hasJoined: boolean;
}

interface StateData {
  players?: Array<{
    name: string;
    role: string | null;
    isAlive: boolean;
    isSilenced: boolean;
    hasRevealedMayor: boolean;
  }>;
  dayResults?: {
    killedByMafia: { name: string; role: string } | null;
    killedBySniper: { name: string; role: string } | null;
    sniperSelfKilled: { name: string; role: string } | null;
    medicSaved: boolean;
    silencedPlayer: { name: string; role: string } | null;
    voteEliminated: { name: string; role: string } | null;
    voteResults: Record<string, number>;
  };
  eliminatedPlayers?: EliminationEvent[];
  gameLog?: Array<{ round: number; phase: string; message: string; timestamp: number }>;
}

// ============================================================
// Phase notification messages
// ============================================================
const PHASE_NOTIFICATIONS: Record<string, { title: string; description: string }> = {
  card_distribution: { title: '🃏 توزيع البطاقات', description: 'اضغط لرؤية دورك!' },
  night_start: { title: '🌙 التغميضة', description: 'أغمضوا أعينكم...' },
  night_mafia_wake: { title: '👾 المافيا تستيقظ', description: 'لا تفتح عينيك!' },
  night_boss_kill: { title: '🔪 شيخ المافيا يختار', description: 'لا تفتح عينيك!' },
  night_silencer: { title: '🤫 التسكيت', description: 'لا تفتح عينيك!' },
  night_mafia_sleep: { title: '😴 المافيا تنام', description: 'لا تزال مغمضاً...' },
  night_medic: { title: '🏥 الطبيب', description: 'لا تفتح عينيك!' },
  night_sniper: { title: '🎯 القناص', description: 'لا تفتح عينيك!' },
  night_end: { title: '🌅 انتهت الليل', description: 'استعدوا!' },
  day_announcements: { title: '☀️ أحداث الليل', description: 'شوفوا شو صار!' },
  day_mayor_reveal: { title: '🏛️ كشف العمده', description: 'هل سيكشف بطاقته؟' },
  day_discussion: { title: '💬 وقت النقاش', description: 'ناقشوا واكتشفوا المافيا!' },
  day_voting: { title: '🗳️ التصويت', description: 'صوّتوا بذكاء!' },
  day_elimination: { title: '⚔️ الإقصاء', description: 'شوفوا النتيجة!' },
  good_son_revenge: { title: '👦 انتقام الولد الصالح', description: 'يختار شخصاً ليأخذه!' },
  game_over: { title: '🏁 انتهت اللعبة!', description: 'شوفوا من الفاز!' },
};

function JoinPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = (params.code as string) || '';
  const name = searchParams.get('name') || '';
  const { toast } = useToast();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [stateData, setStateData] = useState<StateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  // Name entry form state
  const [inputName, setInputName] = useState('');
  const [nameError, setNameError] = useState('');
  const [showRoleCard, setShowRoleCard] = useState(false);

  // Track approval status
  const wasApprovedRef = useRef(false);

  // Welcome popup: only show ONCE per device (check localStorage after mount)
  const [showWelcome, setShowWelcome] = useState(false);
  const [isTabot, setIsTabot] = useState(false);
  const [tabotStateJson, setTabotStateJson] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('mafia_welcome_shown')) {
      setShowWelcome(true);
    }
  }, []);

  // Poll room state (for gameType detection & tabot spectator polling)
  const pollRoomForType = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/room/${code}`);
      if (!res.ok) {
        setError('خطأ في جلب البيانات');
        return;
      }
      const data = await res.json();
      if (data.gameType === 'tabot') {
        setIsTabot(true);
        setTabotStateJson(data.stateJson || '{}');
        setLoading(false);
      }
    } catch {
      // silent
    }
  }, [code]);

  // Initial check for game type
  useEffect(() => {
    pollRoomForType();
    const interval = setInterval(pollRoomForType, 2000);
    return () => clearInterval(interval);
  }, [pollRoomForType]);

  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('mafia_welcome_shown', 'true');
  }, []);

  const needsNameEntry = !!code && !name;

  // Track previous phase to detect changes for notifications
  const prevPhaseRef = useRef<string | null>(null);
  const prevRoundRef = useRef<number>(0);

  // Handle name submission
  const handleNameSubmit = () => {
    if (!inputName.trim()) {
      setNameError('يجب إدخال اسمك');
      return;
    }
    if (inputName.trim().length < 2) {
      setNameError('الاسم قصير جداً');
      return;
    }
    // Save name to localStorage for refresh persistence
    localStorage.setItem(`mafia_player_name_${code}`, inputName.trim());
    window.location.href = `/join/${code}?name=${encodeURIComponent(inputName.trim())}`;
  };

  // Join room on mount
  useEffect(() => {
    if (!code) {
      setError('كود غير صالح');
      setLoading(false);
      return;
    }
    if (!name) {
      // Check localStorage for saved name (page refresh without query param)
      const savedName = localStorage.getItem(`mafia_player_name_${code}`);
      if (savedName) {
        window.location.href = `/join/${code}?name=${encodeURIComponent(savedName)}`;
        return;
      }
      setLoading(false);
      return;
    }

    async function join() {
      try {
        const res = await fetch(`/api/room/${code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'فشل الانضمام');
          setLoading(false);
          return;
        }

        setPlayerId(data.player.id);

        // If rejoining, restore role revealed state
        if (data.rejoining) {
          setIsRejoining(true);
          // If already approved, mark ref so we don't show approval toast again
          if (data.player.hasJoined) {
            wasApprovedRef.current = true;
          }
          // If game is past card_distribution, auto-reveal role
          if (data.room.phase !== 'waiting' && data.room.phase !== 'card_distribution') {
            setRoleRevealed(true);
          }
        }
      } catch {
        setError('تعذر الاتصال بالخادم');
        setLoading(false);
      }
    }

    join();
  }, [code, name]);

  // Poll room state
  const pollRoom = useCallback(async () => {
    if (!code || !playerId) return;
    try {
      const res = await fetch(`/api/room/${code}?playerId=${playerId}`);
      if (!res.ok) {
        setError('خطأ في جلب البيانات');
        return;
      }
      const data = await res.json();
      setRoom(data);
      if (data.stateJson) {
        try {
          setStateData(JSON.parse(data.stateJson));
        } catch {
          // ignore parse errors
        }
      }

      // Check if host ended the session (room was reset)
      if (data.isEnded || data.phase === 'setup') {
        toast({
          title: '🛑 انتهت الجلسة',
          description: 'المستضيف أنهى اللعبة',
        });
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // Check if host is still alive via heartbeat (15 second threshold)
      if (data.hostLastSeen) {
        const lastSeen = new Date(data.hostLastSeen).getTime();
        const now = Date.now();
        const secondsSinceHostSeen = (now - lastSeen) / 1000;
        if (secondsSinceHostSeen > 15) {
          toast({
            title: '🔌 المستضيف غير متصل',
            description: 'المستضيف فقد الاتصال - سيتم إعادتك للرئيسية',
            variant: 'destructive',
          });
          setTimeout(() => {
            window.location.href = '/';
          }, 2500);
          return;
        }
      }

      setLoading(false);

      // Detect player approval and show toast
      const myP = data.players?.find((p: RoomPlayerState) => p.id === playerId);
      if (myP?.hasJoined && !wasApprovedRef.current) {
        wasApprovedRef.current = true;
        toast({
          title: '✅ تمت الموافقة!',
          description: 'المستضيف وافق على انضمامك - استعد للعبة!',
        });
      }
    } catch {
      // silent poll error
    }
  }, [code, playerId, toast]);

  useEffect(() => {
    if (!playerId) return;
    pollRoom();
    const interval = setInterval(pollRoom, 2000);
    return () => clearInterval(interval);
  }, [playerId, pollRoom]);

  // Show notification when phase changes
  useEffect(() => {
    if (!room?.phase) return;

    const prevPhase = prevPhaseRef.current;
    const prevRound = prevRoundRef.current;

    // Skip notification on first load or when rejoining
    if (prevPhase === null || isRejoining) {
      prevPhaseRef.current = room.phase;
      prevRoundRef.current = room.round || 0;
      return;
    }

    if (prevPhase !== room.phase) {
      const notif = PHASE_NOTIFICATIONS[room.phase];
      if (notif) {
        toast({
          title: notif.title,
          description: notif.description,
        });
      }

      // Play sounds on phase transitions
      if (room.phase === 'night_start') {
        playNightSound();
      } else if (room.phase === 'day_announcements') {
        playDaySound();
      }

      // Reset vote state when entering voting
      if (room.phase === 'day_voting') {
        setSelectedVote(null);
        setVoteSubmitted(false);
      }

      // Start background music when game begins (card_distribution phase)
      if (room.phase === 'card_distribution') {
        playBgMusic();
      }

      prevPhaseRef.current = room.phase;
    }

    // Show round change notification
    if (room.round && room.round !== prevRound && room.phase === 'night_start') {
      setTimeout(() => {
        toast({
          title: `📋 الجولة ${room.round}`,
          description: 'جولة جديدة تبدأ!',
        });
      }, 500);
    }

    prevRoundRef.current = room.round || 0;
  }, [room?.phase, room?.round, isRejoining, toast]);

  // Day results notifications (only show new ones)
  const lastDayResultsNotifRef = useRef<string>('');
  useEffect(() => {
    if (!stateData?.dayResults) return;

    const results = stateData.dayResults;
    let notifKey = '';

    if (results.killedByMafia) notifKey += `kill:${results.killedByMafia.name}`;
    if (results.medicSaved) notifKey += 'saved';
    if (results.silencedPlayer) notifKey += `silenced:${results.silencedPlayer.name}`;
    if (results.voteEliminated) notifKey += `vote:${results.voteEliminated.name}`;

    if (notifKey && notifKey !== lastDayResultsNotifRef.current && room?.phase === 'day_announcements') {
      lastDayResultsNotifRef.current = notifKey;

      if (results.killedByMafia) {
        setTimeout(() => {
          toast({
            title: '💀 قتلت المافيا',
            description: `${results.killedByMafia!.name} (${ROLE_CONFIGS[results.killedByMafia!.role as RoleType]?.nameAr || ''})`,
          });
        }, 300);
      }

      if (results.medicSaved) {
        setTimeout(() => {
          toast({
            title: '🏥 أنقذ الطبيب شخصاً!',
            description: 'نجا شخص من الموت هذه الليلة',
          });
        }, 800);
      }

      if (results.silencedPlayer) {
        setTimeout(() => {
          toast({
            title: '🤫 تم التسكيت',
            description: `${results.silencedPlayer!.name} مسكوت هذه الجولة`,
          });
        }, 1300);
      }

      if (results.voteEliminated) {
        // Shown in elimination phase
      }
    }
  }, [stateData?.dayResults, room?.phase]);

  // Submit vote
  const submitVote = async () => {
    if (!playerId || !selectedVote || !code) return;
    try {
      const res = await fetch(`/api/room/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, targetId: selectedVote }),
      });
      if (res.ok) {
        setVoteSubmitted(true);
        toast({
          title: '✅ تم التصويت',
          description: `صوّتت على ${selectedVote}`,
        });
      }
    } catch {
      // silent error
    }
  };

  // Find my player data
  const myPlayer = room?.players.find((p) => p.id === playerId);
  const myRole = myPlayer?.role as RoleType | undefined;
  const myRoleConfig = myRole ? ROLE_CONFIGS[myRole] : null;

  // Find my player from stateJson
  const myStatePlayer = stateData?.players?.find((p) => p.name === name);
  const isSilenced = myStatePlayer?.isSilenced || myPlayer?.isSilenced || false;
  const isAlive = myStatePlayer?.isAlive ?? myPlayer?.isAlive ?? true;

  // ============================================================
  // Render
  // ============================================================

  // ── Tabot Spectator View ──
  if (isTabot) {
    return (
      <TabotSpectatorView
        stateJson={tabotStateJson}
        roomCode={code}
        hostName={room?.hostName || ''}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mafia-bg-night" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🕵️</div>
          <p className="text-slate-400">{isRejoining ? 'جاري العودة للعبة...' : 'جاري الانضمام...'}</p>
        </div>
      </div>
    );
  }

  // Show name entry form when no name in URL
  if (needsNameEntry && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-night" dir="rtl">
        {/* Welcome popup - only on name entry landing */}
        <WelcomePopup show={showWelcome} onDismiss={handleDismissWelcome} />

        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white star-twinkle"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
                animationDuration: Math.random() * 3 + 2 + 's',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
              className="text-6xl sm:text-7xl mb-3 sm:mb-4"
            >
              🕴️
            </motion.div>
            <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 to-red-400 mb-2">
              لعبة المافيا
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-bold">
              دخول لاعب 🔥
            </p>
          </div>

          <Card className="bg-gradient-to-bl from-green-950/40 via-slate-900/80 to-slate-900/80 border-green-500/30">
            <CardContent className="pt-5 sm:pt-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 mb-1">
                  <span className="text-lg">🕵️</span>
                  <h2 className="text-lg sm:text-xl font-bold text-green-300">
                    انضم للعبة
                  </h2>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  الغرفة: <span className="font-mono text-white font-bold tracking-wider">{code}</span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    اسمك في اللعبة
                  </label>
                  <Input
                    value={inputName}
                    onChange={(e) => { setInputName(e.target.value); setNameError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                    placeholder="اسمك..."
                    className="bg-slate-800/50 border-green-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12 text-lg"
                    dir="rtl"
                    maxLength={20}
                    autoFocus
                  />
                </div>

                {nameError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs text-center"
                  >
                    ⚠️ {nameError}
                  </motion.p>
                )}

                <Button
                  onClick={handleNameSubmit}
                  className="w-full bg-gradient-to-l from-green-600 to-emerald-800 hover:from-green-500 hover:to-emerald-700 text-white font-bold text-base sm:text-lg py-5 pulse-glow-blue"
                >
                  انضم للعبة 🔥
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-4">
            <Button
              variant="ghost"
              onClick={() => (window.location.href = '/')}
              className="text-slate-500 hover:text-slate-300 text-xs gap-1"
            >
              ← العودة للرئيسية
            </Button>
          </div>

          <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-4">
            ٦-٢٠ لاعب | مافيا ضد صالحين
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center mafia-bg-night" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💀</div>
          <p className="text-red-400 text-lg font-bold mb-4">{error}</p>
          <Button
            onClick={() => (window.location.href = '/')}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  const phase = room?.phase || 'waiting';

  return (
    <div className="min-h-screen flex flex-col mafia-bg-night" dir="rtl">
      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800/50">
          <div className="max-w-md mx-auto flex items-center justify-between">
            {/* Player identity - name + role */}
            {myRoleConfig && roleRevealed ? (
              <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${
                myRoleConfig.team === 'mafia'
                  ? 'bg-red-950/30 border-red-500/20'
                  : 'bg-blue-950/30 border-blue-500/20'
              }`}>
                <span className="text-xl">{myRoleConfig.icon}</span>
                <div>
                  <p className={`text-sm font-bold ${myRoleConfig.textColor}`}>{myRoleConfig.nameAr}</p>
                  <p className="text-xs text-slate-400 font-bold">{name}</p>
                </div>
                {!isAlive && (
                  <span className="text-sm ml-1">💀</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">🕵️</span>
                <div>
                  <p className="text-sm font-bold text-slate-200">{name}</p>
                  <p className="text-[10px] text-slate-500">الغرفة: <span className="font-mono text-white">{code}</span></p>
                </div>
              </div>
            )}
            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
              الجولة {room?.round || 0}
            </Badge>
          </div>
        </div>

        {/* Phase Content */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
          <AnimatePresence mode="wait">
            {/* WAITING PHASE */}
            {phase === 'waiting' && (
              <WaitingPhase key="waiting" room={room} playerId={playerId} playerName={name} />
            )}

            {/* CARD DISTRIBUTION */}
            {phase === 'card_distribution' && (
              <CardDistributionPhase
                key="card_dist"
                myRole={myRoleConfig}
                roleRevealed={roleRevealed}
                onReveal={() => setRoleRevealed(true)}
              />
            )}

            {/* NIGHT PHASES */}
            {(phase.startsWith('night_') || phase === 'night_end') && (
              <NightPhase
                key={phase}
                phase={phase}
                myRole={myRole}
                playerId={playerId}
                playerName={name}
                roomCode={code}
                roomPlayers={room?.players || []}
                statePlayers={stateData?.players || []}
              />
            )}

            {/* DAY ANNOUNCEMENTS */}
            {phase === 'day_announcements' && (
              <DayAnnouncementsPhase key="day_ann" stateData={stateData} />
            )}

            {/* DAY MAYOR REVEAL */}
            {phase === 'day_mayor_reveal' && (
              <MayorRevealPhase
                key="mayor"
                stateData={stateData}
                myRole={myRole}
                playerId={playerId}
                roomCode={code}
                roomPlayers={room?.players || []}
              />
            )}

            {/* DAY DISCUSSION */}
            {phase === 'day_discussion' && (
              <DiscussionPhase
                key="discussion"
                isSilenced={isSilenced}
              />
            )}

            {/* DAY VOTING */}
            {phase === 'day_voting' && (
              <VotingPhase
                key="voting"
                players={stateData?.players || []}
                roomPlayers={room?.players || []}
                myName={name}
                isSilenced={isSilenced}
                isAlive={isAlive}
                selectedVote={selectedVote}
                voteSubmitted={voteSubmitted}
                onSelectVote={setSelectedVote}
                onSubmitVote={submitVote}
              />
            )}

            {/* DAY ELIMINATION */}
            {phase === 'day_elimination' && (
              <EliminationPhase key="elimination" stateData={stateData} />
            )}

            {/* GOOD SON REVENGE */}
            {phase === 'good_son_revenge' && (
              <GoodSonPhase
                key="good_son"
                playerId={playerId}
                playerName={name}
                myRole={myRole}
                players={stateData?.players || []}
                roomPlayers={room?.players || []}
              />
            )}

            {/* GAME OVER */}
            {phase === 'game_over' && (
              <GameOverPhase key="game_over" room={room} stateData={stateData} />
            )}
          </AnimatePresence>
        </div>
        {/* Footer Bar */}
        <div className="border-t border-slate-800/50 p-3">
          <div className="max-w-md mx-auto flex items-center justify-between">
            {/* Role Card - prominent display */}
            <div className="flex-1">
              {myRoleConfig && roleRevealed ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRoleCard(!showRoleCard)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${
                    myRoleConfig.team === 'mafia'
                      ? 'bg-red-950/30 border-red-500/20'
                      : 'bg-blue-950/30 border-blue-500/20'
                  }`}
                >
                  <span className="text-xl">{myRoleConfig.icon}</span>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${myRoleConfig.textColor}`}>{myRoleConfig.nameAr}</p>
                    <p className="text-sm text-slate-200 font-bold">{name}</p>
                  </div>
                  {!isAlive && (
                    <span className="text-xs text-red-400 ml-1">💀 مقتول</span>
                  )}
                </motion.button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2">
                  <span className="text-sm">🕵️</span>
                  <p className="text-sm text-slate-300 font-bold">{name}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Rules button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-300 text-[10px] h-7 px-2"
                onClick={() => toast({ title: '📜 القوانين', description: 'المافيا ضد الصالحين - اكتشفوا المافيا قبل أن يسيطروا!' })}
              >
                📜
              </Button>
              {/* Leave button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-red-400 text-[10px] h-7 px-2"
                onClick={() => { window.location.href = '/'; }}
              >
                🚪
              </Button>
            </div>
          </div>
        </div>

        {/* Role Card Modal */}
        <AnimatePresence>
          {showRoleCard && myRoleConfig && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setShowRoleCard(false)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-64 h-80 bg-gradient-to-br ${myRoleConfig.gradient} border-2 ${myRoleConfig.borderColor} rounded-2xl flex flex-col items-center justify-center p-6 shadow-2xl`}
              >
                <div className="text-6xl mb-3">{myRoleConfig.icon}</div>
                <h3 className={`text-xl font-black ${myRoleConfig.textColor}`}>{myRoleConfig.nameAr}</h3>
                <Badge
                  variant="outline"
                  className={`mt-2 text-xs ${myRoleConfig.team === 'mafia' ? 'border-red-500/50 text-red-300' : 'border-blue-500/50 text-blue-300'}`}
                >
                  {myRoleConfig.team === 'mafia' ? 'مافيا' : 'صالح'}
                </Badge>
                <p className={`text-xs mt-4 ${myRoleConfig.textColor} opacity-80 text-center leading-relaxed`}>
                  {myRoleConfig.description}
                </p>
                <p className="text-[10px] text-white/40 mt-3">اضغط خارج البطاقة للإغلاق</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Text */}
      <p className="relative z-10 text-center text-[10px] text-slate-600 pb-2">
        لعبة المافيا | ٦-٢٠ لاعب
      </p>
    </div>
  );
}

// ============================================================
// WAITING PHASE
// ============================================================
function WaitingPhase({ room, playerId, playerName }: { room: RoomState | null; playerId: string | null; playerName: string }) {
  const myPlayer = room?.players.find((p) => p.id === playerId);
  const isApproved = myPlayer?.hasJoined ?? false;
  const approvedCount = room?.players.filter((p) => p.hasJoined).length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto text-center"
    >
      {/* My status card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl border p-5 sm:p-6 mb-5 ${
          isApproved
            ? 'bg-green-950/30 border-green-500/40'
            : 'bg-amber-950/30 border-amber-500/40'
        }`}
      >
        {isApproved ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
              className="text-5xl mb-3"
            >
              ✅
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-black text-green-300 mb-2">
              تمت الموافقة!
            </h2>
            <p className="text-sm text-green-200/70">
              المستضيف وافق على انضمامك - استعد للعبة
            </p>
          </>
        ) : (
          <>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-5xl mb-3"
            >
              ⏳
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-2">
              بانتظار الموافقة...
            </h2>
            <p className="text-sm text-amber-200/70">
              المستضيف لم يوافق على انضمامك بعد
            </p>
          </>
        )}
      </motion.div>

      {/* Players count */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 bg-slate-800/60 rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-300">
            {approvedCount} موافق عليهم
          </span>
        </div>
        {room && (
          <span className="text-xs text-slate-500">
            من {room.playerCount} لاعب
          </span>
        )}
      </div>

      {/* Players list */}
      {room && room.players.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-3">اللاعبون</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {room.players.map((p, i) => {
              const isMe = p.id === playerId;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-lg p-2.5 flex items-center gap-2 ${
                    isMe
                      ? 'bg-yellow-900/30 border border-yellow-500/30'
                      : p.hasJoined
                      ? 'bg-green-950/20 border border-green-800/30'
                      : 'bg-slate-800/50 border border-slate-700/30'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    p.hasJoined
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : 'bg-gradient-to-br from-slate-500 to-slate-600'
                  }`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-300 truncate block">
                      {p.name}
                    </span>
                    <span className={`text-[9px] ${
                      isMe ? 'text-yellow-400' : p.hasJoined ? 'text-green-400/70' : 'text-slate-500'
                    }`}>
                      {isMe ? '(أنت)' : p.hasJoined ? '✓' : '⏳'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Waiting message */}
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-[10px] text-slate-500 mt-4"
      >
        {isApproved ? '⏳ انتظر حتى يبدأ توزيع البطاقات...' : '⏳ انتظر موافقة المستضيف...'}
      </motion.p>
    </motion.div>
  );
}

// ============================================================
// CARD DISTRIBUTION PHASE
// ============================================================
function CardDistributionPhase({
  myRole,
  roleRevealed,
  onReveal,
}: {
  myRole: typeof ROLE_CONFIGS[RoleType] | undefined;
  roleRevealed: boolean;
  onReveal: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    // Call reveal after flip animation starts
    setTimeout(() => onReveal(), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-sm mx-auto text-center"
    >
      <h2 className="text-xl font-bold text-slate-200 mb-2">
        🃏 بطاقتك جاهزة!
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        اضغط على البطاقة لرؤية دورك
      </p>
      <motion.div
        whileHover={!flipped ? { scale: 1.05 } : {}}
        whileTap={!flipped ? { scale: 0.95 } : {}}
        onClick={handleFlip}
        className={`mx-auto w-52 h-72 sm:w-60 sm:h-80 card-flip-container ${!flipped ? 'cursor-pointer' : ''}`}
      >
        <div className={`w-full h-full card-flip-inner ${flipped ? 'flipped' : ''}`}>
          {/* Back of card */}
          <div className="card-front bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-3">🃏</div>
              <p className="text-slate-400 text-sm font-bold">لعبة المافيا</p>
              <p className="text-slate-500 text-xs mt-1">اضغط للكشف</p>
            </div>
          </div>
          {/* Front of card (role) */}
          {myRole && (
            <div className={`card-back bg-gradient-to-br ${myRole.gradient} border-2 ${myRole.borderColor} rounded-2xl flex flex-col items-center justify-center p-4 shadow-2xl`}>
              <div className="text-5xl mb-2">{myRole.icon}</div>
              <h3 className={`text-lg font-black ${myRole.textColor}`}>{myRole.nameAr}</h3>
              <Badge
                variant="outline"
                className={`mt-2 text-[10px] ${myRole.team === 'mafia' ? 'border-red-500/50 text-red-300' : 'border-blue-500/50 text-blue-300'}`}
              >
                {myRole.team === 'mafia' ? 'مافيا' : 'صالح'}
              </Badge>
              <p className={`text-xs mt-3 ${myRole.textColor} opacity-80`}>
                {myRole.description}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <p className="text-xs text-slate-500">
            ⚠️ لا تُظهر بطاقتك لأحد! انتظر تعليمات العراب...
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================
// NIGHT PHASE - Player side with role-based selection
// ============================================================
function NightPhase({
  phase,
  myRole,
  playerId,
  playerName,
  roomCode,
  roomPlayers,
  statePlayers,
}: {
  phase: string;
  myRole: RoleType | undefined;
  playerId: string | null;
  playerName: string;
  roomCode: string;
  roomPlayers: RoomPlayerState[];
  statePlayers: Array<{ name: string; role: string | null; isAlive: boolean; isSilenced: boolean; hasRevealedMayor: boolean }>;
}) {
  const { toast } = useToast();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [sniperShooting, setSniperShooting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Track last synced target from server to detect host changes
  const lastSyncedTargetRef = useRef<string | null>(null);
  const lastSyncedActionRef = useRef<string | null>(null);

  // Reset selection when phase changes
  useEffect(() => {
    setSelectedTarget(null);
    setActionSubmitted(false);
    setSniperShooting(false);
    lastSyncedTargetRef.current = null;
    lastSyncedActionRef.current = null;
  }, [phase]);

  // Check if this player's role is active for the current phase
  const phaseRoleMap: Record<string, RoleType | null> = {
    night_boss_kill: 'mafia_boss',
    night_silencer: 'mafia_silencer',
    night_medic: 'medic',
    night_sniper: 'sniper',
  };

  const roleActionTypeMap: Record<string, string> = {
    mafia_boss: 'boss_kill',
    mafia_silencer: 'silencer',
    medic: 'medic_save',
    sniper: 'sniper_shoot',
  };

  const isMyTurn = myRole && phaseRoleMap[phase] === myRole;
  const actionType = myRole ? roleActionTypeMap[myRole] : null;

  // Check if the host already submitted an action for this player (host chose on their behalf)
  const myRoomPlayer = roomPlayers.find((p) => p.id === playerId);
  const hostChoseForMe = myRoomPlayer?.nightActionTarget && myRoomPlayer?.nightActionType;

  // If host chose for me (or changed selection), sync the displayed choice
  useEffect(() => {
    const serverTarget = myRoomPlayer?.nightActionTarget || null;
    const serverAction = myRoomPlayer?.nightActionType || null;

    // Only update if the server data actually changed from what we last synced
    if (serverTarget !== lastSyncedTargetRef.current || serverAction !== lastSyncedActionRef.current) {
      if (serverAction) {
        setSelectedTarget(serverTarget);
        // Don't set actionSubmitted - let the player confirm or change the host's choice

        if (serverAction === 'sniper_hold') {
          setSniperShooting(false);
        } else if (serverAction === 'sniper_shoot') {
          setSniperShooting(true);
          setSelectedTarget(serverTarget);
        }

        lastSyncedTargetRef.current = serverTarget;
        lastSyncedActionRef.current = serverAction;
      }
    }
  }, [myRoomPlayer?.nightActionTarget, myRoomPlayer?.nightActionType]);

  // Get alive players (excluding self for some roles)
  const alivePlayers = statePlayers.filter((p) => p.isAlive && p.name !== playerName);
  const allAlivePlayers = statePlayers.filter((p) => p.isAlive);

  // Submit night action
  const submitAction = async (targetName: string | null, aType: string) => {
    if (!playerId || !roomCode || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/room/${roomCode}/night-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, actionType: aType, targetName }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionSubmitted(true);
        toast({
          title: '✅ تم تسجيل اختيارك',
          description: aType === 'sniper_hold' ? 'أمسكت الرصاصة' : `اخترت: ${targetName}`,
        });
      } else {
        toast({
          title: '❌ خطأ',
          description: data.error || 'فشل تسجيل الاختيار',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '❌ خطأ',
        description: 'تعذر الاتصال بالخادم',
        variant: 'destructive',
      });
    }
    setSubmitting(false);
  };

  // Generic phase info for non-active players
  const phaseTexts: Record<string, { icon: string; title: string; desc: string }> = {
    night_start: { icon: '🌙', title: 'أغمضوا أعينكم', desc: 'الليل حلّ... المافيا تستيقظ!' },
    night_mafia_wake: { icon: '👁️', title: 'المافيا تستيقظ', desc: 'لا تفتح عينيك! العراب يدير المرحلة' },
    night_mafia_sleep: { icon: '😴', title: 'المافيا تنام', desc: 'لا تزال مغمضاً...' },
    night_end: { icon: '🌅', title: 'النور يعود', desc: 'الليلة انتهت... استعدوا!' },
  };

  // Active role phase info
  const activePhaseTexts: Record<string, { icon: string; title: string; desc: string }> = {
    night_boss_kill: { icon: '🔪', title: 'شيخ المافيا - دورك!', desc: 'اختر ضحيتك بحكمة!' },
    night_silencer: { icon: '🤫', title: 'مافيا التسكيت - دورك!', desc: 'اختر من تريد تسكيته!' },
    night_medic: { icon: '🏥', title: 'الطبيب - دورك!', desc: 'خمّن من قتله المافيا لإنقاذه!' },
    night_sniper: { icon: '🎯', title: 'القناص - دورك!', desc: 'عندك رصاصة وحدة! إما تقتل المافيا أو تموت معاه!' },
  };

  // If this is not the player's active phase, show generic message
  if (!isMyTurn) {
    // For night_mafia_wake, show special message for mafia members
    if (phase === 'night_mafia_wake' && myRole && ['mafia_boss', 'mafia_silencer', 'mafia_regular'].includes(myRole)) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full max-w-sm mx-auto text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-6xl sm:text-7xl mb-6 moon-glow"
          >
            👁️
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-black text-red-100 mb-3">
            المافيا تستيقظ!
          </h2>
          <p className="text-sm sm:text-base text-red-300/70">
            أنت من المافيا - استعد!
          </p>
          <div className="mt-4">
            <Badge className="bg-red-900/60 text-red-200 border-red-500/30 px-3 py-1">
              {ROLE_CONFIGS[myRole]?.icon} {ROLE_CONFIGS[myRole]?.nameAr}
            </Badge>
          </div>
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs text-slate-400">العراب يدير اللعبة...</span>
            </div>
          </div>
        </motion.div>
      );
    }

    const info = phaseTexts[phase] || activePhaseTexts[phase] || { icon: '🌙', title: 'مرحلة ليلية', desc: 'لا تفتح عينيك!' };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-sm mx-auto text-center"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl sm:text-7xl mb-6 moon-glow"
        >
          {info.icon}
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-3">
          {info.title}
        </h2>
        <p className="text-sm sm:text-base text-slate-400">
          {info.desc}
        </p>
        <div className="mt-6">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-slate-400">العراب يدير اللعبة...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // This IS the player's active phase - show selection UI
  const info = activePhaseTexts[phase] || { icon: '🌙', title: 'دورك!', desc: 'اختر!' };
  const roleConfig = myRole ? ROLE_CONFIGS[myRole] : null;

  // For sniper: show shoot/hold buttons
  if (phase === 'night_sniper') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-sm mx-auto text-center"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl sm:text-7xl mb-6 moon-glow"
        >
          🎯
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black text-amber-100 mb-3">
          القناص - دورك!
        </h2>
        <p className="text-sm text-amber-300/70 mb-4">
          عندك رصاصة وحدة! إما تقتل المافيا أو تموت معاه!
        </p>

        {/* Host pre-selected notice for sniper */}
        {hostChoseForMe && !actionSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <div className="inline-flex items-center gap-2 bg-blue-950/40 border border-blue-500/30 rounded-full px-3 py-1.5">
              <span className="text-blue-400 text-xs font-bold">
                📋 المستضيف اختار: {myRoomPlayer?.nightActionType === 'sniper_hold' ? 'أمسك الرصاصة' : myRoomPlayer?.nightActionTarget}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">يمكنك التغيير أو التأكيد</p>
          </motion.div>
        )}

        {actionSubmitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4"
          >
            <div className="bg-green-950/40 border border-green-500/30 rounded-2xl p-5">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-green-300 font-bold">
                {sniperShooting
                  ? `أطلقت الرصاصة على: ${selectedTarget}`
                  : 'أمسكت الرصاصة'}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Shoot / Hold buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setSniperShooting(false);
                  setSelectedTarget(null);
                  submitAction(null, 'sniper_hold');
                }}
                className={`flex-1 py-4 text-sm font-bold ${
                  !sniperShooting
                    ? 'bg-slate-700 text-slate-200 border-2 border-slate-500'
                    : 'bg-slate-800/50 text-slate-500 border-2 border-slate-700'
                }`}
              >
                أمسك الرصاصة 🤲
              </Button>
              <Button
                onClick={() => setSniperShooting(true)}
                className={`flex-1 py-4 text-sm font-bold ${
                  sniperShooting
                    ? 'bg-amber-700 text-amber-100 border-2 border-amber-500'
                    : 'bg-slate-800/50 text-slate-500 border-2 border-slate-700'
                }`}
              >
                أطلق الرصاصة 🔫
              </Button>
            </div>

            {/* Target selection when shooting */}
            {sniperShooting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <p className="text-amber-300 text-xs font-bold mb-3">اختر هدفك:</p>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto mafia-scrollbar">
                  {alivePlayers.map((player) => (
                    <div
                      key={player.name}
                      onClick={() => setSelectedTarget(player.name)}
                      className={`rounded-xl p-2.5 border-2 transition-all duration-200 cursor-pointer ${
                        selectedTarget === player.name
                          ? 'bg-amber-900/60 border-amber-500 scale-105'
                          : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center mx-auto mb-1">
                          <span className="text-sm font-bold text-slate-200">
                            {player.name.charAt(0)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 truncate">{player.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    if (selectedTarget) {
                      submitAction(selectedTarget, 'sniper_shoot');
                    }
                  }}
                  disabled={!selectedTarget || submitting}
                  className="w-full mt-3 bg-gradient-to-l from-amber-700 to-red-900 hover:from-amber-600 hover:to-red-800 text-white font-bold py-3 text-sm disabled:opacity-40"
                >
                  {submitting ? '...جاري' : '🎯 تأكيد الإطلاق'}
                </Button>
              </motion.div>
            )}
          </div>
        )}

        <div className="mt-6">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-slate-400">بانتظار العراب...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // For boss, silencer, medic: show target selection grid
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-sm mx-auto text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-6xl sm:text-7xl mb-6 moon-glow"
      >
        {info.icon}
      </motion.div>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-3">
        {info.title}
      </h2>
      <p className="text-sm text-slate-400 mb-2">
        {info.desc}
      </p>

      {/* Show role badge */}
      {roleConfig && (
        <Badge className={`${roleConfig.team === 'mafia' ? 'bg-red-900/60 text-red-200 border-red-500/30' : 'bg-blue-900/60 text-blue-200 border-blue-500/30'} px-3 py-1 border`}>
          {roleConfig.icon} {roleConfig.nameAr}
        </Badge>
      )}

      {/* Host pre-selected notice */}
      {hostChoseForMe && !actionSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 mb-1"
        >
          <div className="inline-flex items-center gap-2 bg-blue-950/40 border border-blue-500/30 rounded-full px-3 py-1.5">
            <span className="text-blue-400 text-xs font-bold">
              📋 المستضيف اختار: {myRoomPlayer?.nightActionTarget}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">يمكنك التغيير أو التأكيد</p>
        </motion.div>
      )}

      {actionSubmitted ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4"
        >
          <div className="bg-green-950/40 border border-green-500/30 rounded-2xl p-5">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-300 font-bold text-lg">
              {phase === 'night_medic' ? 'اخترت من ستنقذه' : 'تم تسجيل اختيارك'}
            </p>
            {(selectedTarget || myRoomPlayer?.nightActionTarget) && (
              <p className="text-white text-xl font-black mt-2">{selectedTarget || myRoomPlayer?.nightActionTarget}</p>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="mt-4">
          {/* Selection prompt */}
          <p className="text-slate-300 text-xs font-bold mb-3">
            {phase === 'night_boss_kill' && '🔪 اختر ضحيتك:'}
            {phase === 'night_silencer' && '🤫 اختر من تريد تسكيته:'}
            {phase === 'night_medic' && '🏥 من تعتقد أنه سيُقتل؟'}
          </p>

          {/* Target grid */}
          <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto mafia-scrollbar">
            {(phase === 'night_medic' ? allAlivePlayers : alivePlayers).map((player) => (
              <div
                key={player.name}
                onClick={() => setSelectedTarget(player.name)}
                className={`rounded-xl p-2.5 border-2 transition-all duration-200 cursor-pointer ${
                  selectedTarget === player.name
                    ? phase === 'night_boss_kill'
                      ? 'bg-red-900/60 border-red-500 scale-105'
                      : phase === 'night_silencer'
                      ? 'bg-purple-900/60 border-purple-500 scale-105'
                      : 'bg-cyan-900/60 border-cyan-500 scale-105'
                    : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500/50'
                }`}
              >
                <div className="text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1 ${
                    selectedTarget === player.name
                      ? phase === 'night_boss_kill'
                        ? 'bg-red-800/80 border border-red-400'
                        : phase === 'night_silencer'
                        ? 'bg-purple-800/80 border border-purple-400'
                        : 'bg-cyan-800/80 border border-cyan-400'
                      : 'bg-slate-700 border border-slate-600'
                  }`}>
                    <span className="text-sm font-bold text-white">
                      {player.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">{player.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Submit button */}
          <Button
            onClick={() => {
              if (selectedTarget && actionType) {
                submitAction(selectedTarget, actionType);
              }
            }}
            disabled={!selectedTarget || submitting}
            className={`w-full mt-3 font-bold py-3 text-sm disabled:opacity-40 ${
              phase === 'night_boss_kill'
                ? 'bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white'
                : phase === 'night_silencer'
                ? 'bg-gradient-to-l from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white'
                : 'bg-gradient-to-l from-cyan-700 to-teal-900 hover:from-cyan-600 hover:to-teal-800 text-white'
            }`}
          >
            {submitting ? '...جاري' : hostChoseForMe ? '🔄 تأكيد أو تغيير الاختيار' : '✅ تأكيد الاختيار'}
          </Button>
        </div>
      )}

      <div className="mt-6">
        <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs text-slate-400">بانتظار العراب...</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// DAY ANNOUNCEMENTS
// ============================================================
function DayAnnouncementsPhase({ stateData }: { stateData: StateData | null }) {
  const dayResults = stateData?.dayResults;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8 }}
        className="text-5xl mb-4"
      >
        ☀️
      </motion.div>
      <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-6">
        أحداث الليل
      </h2>

      <div className="space-y-3">
        {/* Killed by Mafia */}
        {dayResults?.killedByMafia && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 blood-splatter"
          >
            <p className="text-red-400 font-bold text-sm">💀 قتلت المافيا</p>
            <p className="text-white text-lg font-bold mt-1">{dayResults.killedByMafia.name}</p>
            <Badge variant="outline" className="mt-1 border-red-500/50 text-red-300 text-xs">
              {ROLE_CONFIGS[dayResults.killedByMafia.role as RoleType]?.nameAr || dayResults.killedByMafia.role}
            </Badge>
          </motion.div>
        )}

        {/* Medic Saved */}
        {dayResults?.medicSaved && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-green-950/30 border border-green-500/30 rounded-xl p-4"
          >
            <p className="text-green-400 font-bold text-sm">🏥 الطبيب أنقذ شخصاً!</p>
            <p className="text-slate-300 text-sm mt-1">نجا شخص من الموت هذه الليلة</p>
          </motion.div>
        )}

        {/* Silenced Player */}
        {dayResults?.silencedPlayer && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4"
          >
            <p className="text-purple-400 font-bold text-sm">🤫 تم التسكيت</p>
            <p className="text-white text-lg font-bold mt-1">{dayResults.silencedPlayer.name}</p>
            <p className="text-slate-400 text-xs mt-1">لا يستطيع التحدث هذه الجولة</p>
          </motion.div>
        )}

        {/* Sniper Kill */}
        {dayResults?.killedBySniper && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4"
          >
            <p className="text-amber-400 font-bold text-sm">🎯 القناص أصاب هدفه</p>
            <p className="text-white text-lg font-bold mt-1">{dayResults.killedBySniper.name}</p>
          </motion.div>
        )}

        {/* Sniper Self Kill */}
        {dayResults?.sniperSelfKilled && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
            className="bg-red-950/30 border border-red-500/30 rounded-xl p-4"
          >
            <p className="text-red-400 font-bold text-sm">💀 القناص قتل نفسه!</p>
            <p className="text-white font-bold mt-1">{dayResults.sniperSelfKilled.name}</p>
            <p className="text-slate-400 text-xs mt-1">أخطأ الهدف... ودفع الثمن</p>
          </motion.div>
        )}

        {/* No events */}
        {!dayResults?.killedByMafia && !dayResults?.medicSaved && !dayResults?.silencedPlayer && (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
            <p className="text-slate-400 text-sm">ليلة هادئة... لا أحد قُتل</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// MAYOR REVEAL PHASE
// ============================================================
function MayorRevealPhase({
  stateData,
  myRole,
  playerId,
  roomCode,
  roomPlayers,
}: {
  stateData: StateData | null;
  myRole: RoleType | undefined;
  playerId: string | null;
  roomCode: string;
  roomPlayers: RoomPlayerState[];
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<'reveal' | 'hide' | null>(null);

  const mayor = stateData?.players?.find((p) => p.hasRevealedMayor);
  const isMayor = myRole === 'mayor';

  // Check if the DB already has our decision (for rejoining/polling)
  const myRoomPlayer = roomPlayers.find((p) => p.id === playerId);
  const alreadyDecided = myRoomPlayer?.hasRevealedMayor !== undefined && (
    (myRoomPlayer?.hasRevealedMayor === true) ||
    // Detect if phase moved on (host already processed our choice)
    (stateData?.players?.some((p) => p.hasRevealedMayor))
  );

  const submitDecision = async (reveal: boolean) => {
    if (!playerId || !roomCode || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/room/${roomCode}/mayor-reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, reveal }),
      });
      if (res.ok) {
        setDecision(reveal ? 'reveal' : 'hide');
        toast({
          title: reveal ? '✅ تم كشف البطاقة!' : '🔒 ستبقى بطاقتك سراً',
          description: reveal ? 'صوتك يساوي ٣ أصوات الآن' : 'قرار حكيم!',
        });
      } else {
        const data = await res.json();
        toast({
          title: '❌ خطأ',
          description: data.error || 'فشل إرسال القرار',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '❌ خطأ في الاتصال',
        description: 'تعذر إرسال القرار',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-sm mx-auto text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="text-5xl mb-4"
      >
        🏛️
      </motion.div>
      <h2 className="text-xl font-bold text-slate-200 mb-4">
        كشف العمده
      </h2>

      {/* Mayor revealed result */}
      {mayor ? (
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-300 font-bold text-sm">العمده يكشف بطاقته!</p>
          <p className="text-white text-xl font-bold mt-2">{mayor.name}</p>
          <p className="text-xs text-slate-400 mt-1">صوته يساوي ٣ أصوات الآن</p>
        </div>
      ) : isMayor && !decision && !alreadyDecided ? (
        /* Mayor sees active choice */
        <div className="space-y-4">
          <p className="text-yellow-300 font-bold text-sm mb-2">
            👑 أنت العمده! هل تريد كشف بطاقتك؟
          </p>
          <p className="text-slate-400 text-xs">
            إذا كشفت، صوتك بيساوي ٣ أصوات! خطوة جريئة!
          </p>
          <div className="space-y-3 pt-2">
            <Button
              onClick={() => submitDecision(true)}
              disabled={submitting}
              className="w-full bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold py-4 pulse-glow-gold disabled:opacity-50"
            >
              🏛️ نعم، أكشف بطاقتي!
            </Button>
            <Button
              onClick={() => submitDecision(false)}
              disabled={submitting}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 font-bold py-4 disabled:opacity-50"
            >
              🔒 لا، سأبقى سراً
            </Button>
          </div>
        </div>
      ) : decision === 'reveal' ? (
        /* Mayor chose to reveal */
        <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-300 font-bold text-sm">أرسلت قرارك!</p>
          <p className="text-white text-lg font-bold mt-2">🏛️ كشفت بطاقتك</p>
          <p className="text-xs text-slate-400 mt-1">بانتظار المستضيف...</p>
        </div>
      ) : decision === 'hide' ? (
        /* Mayor chose to hide */
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <p className="text-slate-300 font-bold text-sm">أرسلت قرارك!</p>
          <p className="text-white text-lg font-bold mt-2">🔒 بطاقتك تبقى سراً</p>
          <p className="text-xs text-slate-400 mt-1">بانتظار المستضيف...</p>
        </div>
      ) : (
        /* Non-mayor or already decided */
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <p className="text-slate-400 text-sm">العراب يسأل عن كشف العمده...</p>
            <p className="text-xs text-slate-500 mt-1">انتظر القرار...</p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// DISCUSSION PHASE
// ============================================================
function DiscussionPhase({
  isSilenced,
}: {
  isSilenced: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm mx-auto text-center"
    >
      {isSilenced ? (
        <>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-5xl mb-4"
          >
            🤫
          </motion.div>
          <h2 className="text-xl font-bold text-purple-300 mb-2">
            أنت مسكت هالجولة!
          </h2>
          <p className="text-sm text-slate-400">
            لا يمكنك التحدث أو التصويت في هذه الجولة
          </p>
          <p className="text-xs text-slate-500 mt-4">
            استمع للنقاش... قد تتعلم شيئاً مفيداً
          </p>
        </>
      ) : (
        <>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-4"
          >
            💬
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3">
            وقت النقاش
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            ناقشوا مع بعض... اكتشفوا المافيا!
          </p>
          {/* Host controls the timer - waiting message */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 inline-block"
          >
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              >
                <Timer className="w-4 h-4 text-blue-400" />
              </motion.div>
              <p className="text-sm text-blue-300 font-bold">
                المستضيف يتحكم بالمؤقت
              </p>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// ============================================================
// VOTING PHASE
// ============================================================
function VotingPhase({
  players,
  roomPlayers,
  myName,
  isSilenced,
  isAlive,
  selectedVote,
  voteSubmitted,
  onSelectVote,
  onSubmitVote,
}: {
  players: Array<{ name: string; role: string | null; isAlive: boolean; isSilenced: boolean }>;
  roomPlayers: Array<{ id: string; name: string; isAlive: boolean; isSilenced: boolean; hasRevealedMayor: boolean; voteTarget: string | null }>;
  myName: string;
  isSilenced: boolean;
  isAlive: boolean;
  selectedVote: string | null;
  voteSubmitted: boolean;
  onSelectVote: (name: string | null) => void;
  onSubmitVote: () => void;
}) {
  const alivePlayers = players.filter(
    (p) => p.isAlive && p.name !== myName
  );

  // ============================================================
  // COMPUTE LIVE VOTE TALLY from roomPlayers.voteTarget
  // ============================================================
  const voteTally = useMemo(() => {
    const tally: Record<string, { count: number; voters: string[] }> = {};
    for (const rp of roomPlayers) {
      if (!rp.isAlive || rp.isSilenced || !rp.voteTarget) continue;
      const weight = rp.hasRevealedMayor ? 3 : 1;
      if (!tally[rp.voteTarget]) {
        tally[rp.voteTarget] = { count: 0, voters: [] };
      }
      tally[rp.voteTarget].count += weight;
      tally[rp.voteTarget].voters.push(rp.name);
    }
    return tally;
  }, [roomPlayers]);

  // Sorted tally (most votes first)
  const sortedTally = useMemo(() => {
    return Object.entries(voteTally)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [voteTally]);

  // Count how many have voted
  const votedCount = roomPlayers.filter(
    (rp) => rp.isAlive && !rp.isSilenced && rp.voteTarget
  ).length;
  const totalVoters = roomPlayers.filter(
    (rp) => rp.isAlive && !rp.isSilenced
  ).length;

  // Find my current vote target from room
  const myRoomPlayer = roomPlayers.find((rp) => rp.name === myName);
  const myCurrentVote = myRoomPlayer?.voteTarget || null;

  // Check if there's a revealed mayor
  const revealedMayor = roomPlayers.find((rp) => rp.isAlive && rp.hasRevealedMayor);

  if (isSilenced) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🤫</div>
          <h2 className="text-xl font-bold text-purple-300 mb-1">أنت مسكت!</h2>
          <p className="text-sm text-slate-400">لا يمكنك التصويت في هذه الجولة</p>
        </div>
        {/* Still show the live tally for silenced players */}
        {sortedTally.length > 0 && (
          <Card className="bg-slate-900/60 border-slate-700/50 mt-4">
            <CardContent className="pt-3 pb-3">
              <h3 className="text-slate-400 font-bold text-xs mb-2">📊 نتائج التصويت الحالية</h3>
              <div className="space-y-1.5">
                {sortedTally.map(({ name, count, voters }) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs w-20 truncate text-right shrink-0">{name}</span>
                    <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-red-600 to-red-800 rounded-full flex items-center justify-end px-1.5"
                        style={{ width: `${Math.max(count / (totalVoters || 1) * 100, 10)}%` }}>
                        <span className="text-[9px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 shrink-0">👤×{voters.length}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  if (!isAlive) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">👻</div>
          <h2 className="text-xl font-bold text-slate-400 mb-1">أنت ميت!</h2>
          <p className="text-sm text-slate-500">لا يمكنك التصويت... شاهد ما يحدث</p>
        </div>
        {/* Show the live tally for dead players too */}
        {sortedTally.length > 0 && (
          <Card className="bg-slate-900/60 border-slate-700/50 mt-4">
            <CardContent className="pt-3 pb-3">
              <h3 className="text-slate-400 font-bold text-xs mb-2">📊 نتائج التصويت الحالية</h3>
              <div className="space-y-1.5">
                {sortedTally.map(({ name, count, voters }) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs w-20 truncate text-right shrink-0">{name}</span>
                    <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-slate-600 to-slate-700 rounded-full flex items-center justify-end px-1.5"
                        style={{ width: `${Math.max(count / (totalVoters || 1) * 100, 10)}%` }}>
                        <span className="text-[9px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 shrink-0">👤×{voters.length}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-3">
        <div className="text-4xl mb-2">🗳️</div>
        <h2 className="text-xl font-bold text-slate-200 mb-1">
          التصويت
        </h2>
        <p className="text-xs text-slate-400">
          اختر الشخص الذي تريد إقصاءه
          {voteSubmitted && (
            <span className="text-yellow-400 mr-1"> • يمكنك تغيير صوتك!</span>
          )}
        </p>
      </div>

      {/* Mayor reveal info banner */}
      {revealedMayor && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-yellow-950/30 border border-yellow-500/30 rounded-xl p-3 mb-3 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xl">👑</span>
            <span className="text-yellow-300 font-bold text-sm">{revealedMayor.name} هو العمده!</span>
          </div>
          <p className="text-yellow-400/70 text-[10px]">صوت العمده يساوي ٣ أصوات بدل صوت واحد</p>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* LIVE VOTE TALLY */}
      {/* ============================================================ */}
      {sortedTally.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-700/50 mb-3">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                📊 نتائج التصويت الحالية
              </h3>
              <Badge variant="outline" className={`text-[10px] px-1.5 ${
                votedCount === totalVoters
                  ? 'border-green-500/50 text-green-400'
                  : 'border-yellow-500/50 text-yellow-400'
              }`}>
                {votedCount}/{totalVoters} صوّتوا
              </Badge>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto mafia-scrollbar">
              {sortedTally.map(({ name, count, voters }, idx) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <span className={`text-xs w-20 truncate text-right shrink-0 font-bold ${
                    idx === 0 ? 'text-red-300' : 'text-slate-300'
                  }`}>
                    {idx === 0 ? '🔴 ' : ''}{name}
                  </span>
                  <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center justify-end px-1.5 ${
                        idx === 0
                          ? 'bg-gradient-to-l from-red-600 to-red-800'
                          : 'bg-gradient-to-l from-slate-600 to-slate-700'
                      }`}
                      style={{
                        width: `${Math.max((count / (totalVoters || 1)) * 100, 8)}%`,
                      }}
                    >
                      <span className="text-[9px] font-bold text-white">{count}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 shrink-0">
                    👤×{voters.length}
                    {idx === 0 && <span className="text-yellow-400 mr-0.5"> ⚠️</span>}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* CANDIDATE GRID with vote counts */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 max-h-[50vh] overflow-y-auto mafia-scrollbar px-1">
        {alivePlayers.map((p, i) => {
          const tallyForThis = voteTally[p.name];
          const isMyCurrentVote = myCurrentVote === p.name;
          const isSelected = selectedVote === p.name;
          // Check if this player is the revealed mayor
          const isMayor = roomPlayers.find((rp) => rp.name === p.name)?.hasRevealedMayor;

          return (
            <motion.button
              key={p.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelectVote(isSelected ? null : p.name)}
              className={`rounded-xl p-3 sm:p-4 text-center transition-all duration-200 border relative ${
                isSelected
                  ? 'bg-red-950/50 border-red-500/50 scale-105 shadow-lg shadow-red-500/10'
                  : isMayor
                  ? 'bg-yellow-950/20 border-yellow-500/30'
                  : isMyCurrentVote && !isSelected
                  ? 'bg-yellow-950/30 border-yellow-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Mayor crown badge */}
              {isMayor && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1 bg-yellow-900 border border-yellow-500/50 rounded-full w-5 h-5 flex items-center justify-center z-10"
                >
                  <span className="text-[10px]">👑</span>
                </motion.div>
              )}
              {/* Vote count badge */}
              {tallyForThis && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -left-1 bg-red-900 border border-red-500/50 rounded-full w-5 h-5 flex items-center justify-center z-10"
                >
                  <span className="text-[9px] font-black text-red-200">{tallyForThis.count}</span>
                </motion.div>
              )}
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                isSelected
                  ? 'bg-red-900/50 text-red-200'
                  : isMayor
                  ? 'bg-yellow-900/40 text-yellow-200 border border-yellow-500/30'
                  : isMyCurrentVote
                  ? 'bg-yellow-900/50 text-yellow-200'
                  : 'bg-slate-700/50 text-slate-300'
              }`}>
                {p.name.charAt(0)}
              </div>
              <p className={`text-xs font-bold truncate ${
                isSelected ? 'text-red-200' : isMayor ? 'text-yellow-200' : isMyCurrentVote ? 'text-yellow-200' : 'text-slate-300'
              }`}>
                {p.name}
              </p>
              {/* Indicators */}
              {isMayor && !isSelected && !isMyCurrentVote && (
                <p className="text-[9px] text-yellow-400 mt-0.5">👑 عمده (×٣ أصوات)</p>
              )}
              {isMyCurrentVote && !isSelected && (
                <p className="text-[9px] text-yellow-400 mt-0.5">✓ صوتك الحالي</p>
              )}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-red-400 text-lg mt-0.5"
                >
                  ☠️
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* ACTION BUTTON - Submit or Change Vote */}
      {/* ============================================================ */}
      {selectedVote && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <Button
            onClick={onSubmitVote}
            className={`font-bold text-base py-5 w-full max-w-xs ${
              voteSubmitted
                ? 'bg-gradient-to-l from-yellow-600 to-amber-800 hover:from-yellow-500 hover:to-amber-700 text-white'
                : 'bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white pulse-glow-red'
            }`}
          >
            {voteSubmitted
              ? `🔄 تغيير الصوت إلى ${selectedVote}`
              : `تأكيد التصويت على ${selectedVote}`}
          </Button>
        </motion.div>
      )}

      {/* Already voted indicator (voted from own device) */}
      {voteSubmitted && !selectedVote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-2"
        >
          <div className="inline-flex items-center gap-2 bg-green-950/30 border border-green-500/20 rounded-full px-4 py-2">
            <span className="text-green-400 text-sm font-bold">✅ صوّتت على {myCurrentVote}</span>
          </div>
          <p className="text-xs text-yellow-400 mt-2">اضغط على شخص آخر لتغيير صوتك</p>
        </motion.div>
      )}

      {/* Host voted on your behalf */}
      {!voteSubmitted && myCurrentVote && !selectedVote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-2"
        >
          <div className="inline-flex items-center gap-2 bg-blue-950/30 border border-blue-500/20 rounded-full px-4 py-2">
            <span className="text-blue-400 text-sm font-bold">📋 المستضيف صوّب عنك على {myCurrentVote}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">اضغط على شخص آخر لتغيير صوتك</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================
// ELIMINATION PHASE
// ============================================================
function EliminationPhase({ stateData }: { stateData: StateData | null }) {
  const eliminated = stateData?.dayResults?.voteEliminated;
  const voteResults = stateData?.dayResults?.voteResults || {};

  // Sort vote results by count
  const sortedResults = useMemo(() => {
    return Object.entries(voteResults)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [voteResults]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-md mx-auto"
    >
      {eliminated ? (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="text-6xl mb-4"
          >
            💀
          </motion.div>
          <h2 className="text-xl font-bold text-red-400 mb-3">
            تم الإقصاء!
          </h2>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-5 inline-block mb-4">
              <p className="text-white text-2xl font-black">{eliminated.name}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Badge variant="outline" className="border-red-500/50 text-red-300 text-xs">
                  {ROLE_CONFIGS[eliminated.role as RoleType]?.nameAr || eliminated.role}
                </Badge>
                <span className="text-lg">{ROLE_CONFIGS[eliminated.role as RoleType]?.icon || '❓'}</span>
              </div>
              <p className="text-red-300/60 text-[10px] mt-2">
                حصل على أكبر عدد من الأصوات
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">لا إقصاء</h2>
          <p className="text-sm text-slate-400">لم يتم إقصاء أحد - تعادل في الأصوات!</p>
        </div>
      )}

      {/* Vote results breakdown */}
      {sortedResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardContent className="pt-3 pb-3">
              <h3 className="text-slate-400 font-bold text-xs mb-2 flex items-center gap-1.5">
                📊 نتيجة التصويت
              </h3>
              <div className="space-y-1.5">
                {sortedResults.map(({ name, count }, idx) => {
                  const wasEliminated = eliminated?.name === name;
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <span className={`text-xs w-20 truncate text-right shrink-0 font-bold ${
                        wasEliminated ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        {wasEliminated ? '💀 ' : ''}{name}
                      </span>
                      <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full flex items-center justify-end px-1.5 ${
                            wasEliminated
                              ? 'bg-gradient-to-l from-red-600 to-red-800'
                              : 'bg-gradient-to-l from-slate-600 to-slate-700'
                          }`}
                          style={{ width: `${Math.max((count / (sortedResults[0]?.count || 1)) * 100, 8)}%` }}
                        >
                          <span className="text-[9px] font-bold text-white">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================
// GOOD SON REVENGE PHASE
// ============================================================
function GoodSonPhase({
  playerId,
  playerName,
  myRole,
  players,
  roomPlayers,
}: {
  playerId: string | null;
  playerName: string;
  myRole: RoleType | undefined;
  players: Array<{ name: string; role: string | null; isAlive: boolean }>;
  roomPlayers: Array<{ id: string; name: string; isAlive: boolean; role: string | null }>;
}) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const code = useParams().code as string;

  const isGoodSon = myRole === 'good_son';
  const alivePlayers = players.filter((p) => p.isAlive && p.name !== playerName);

  const handleSubmit = async () => {
    if (!playerId || !selectedTarget || !code) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/room/${code}/good-son-revenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, targetName: selectedTarget }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitted(true);
        toast({
          title: '👦 تم الانتقام!',
          description: `أخذت ${data.targetName} معك! (${ROLE_CONFIGS[data.targetRole as RoleType]?.nameAr || data.targetRole})`,
        });
      } else {
        const err = await res.json();
        toast({ title: '❌ خطأ', description: err.error || 'فشل تنفيذ الانتقام' });
      }
    } catch {
      toast({ title: '❌ خطأ', description: 'تعذر الاتصال بالخادم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-md mx-auto text-center"
    >
      {submitted ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="text-6xl mb-4"
          >
            ⚡
          </motion.div>
          <h2 className="text-xl font-bold text-amber-300 mb-2">
            تم الانتقام!
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            {selectedTarget} سيغادر اللعبة معك...
          </p>
          <div className="bg-slate-800/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-slate-400">بانتظار المستضيف...</span>
            </div>
          </div>
        </>
      ) : isGoodSon ? (
        <>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-6xl mb-4"
          >
            👦
          </motion.div>
          <h2 className="text-xl font-bold text-amber-300 mb-2">
            أنت الولد الصالح! اختر من تأخذه معك!
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            اختر لاعباً حياً ليخرج من اللعبة معك
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-[50vh] overflow-y-auto mafia-scrollbar px-1">
            {alivePlayers.map((p, i) => (
              <motion.button
                key={p.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedTarget(selectedTarget === p.name ? null : p.name)}
                className={`rounded-xl p-3 text-center transition-all duration-200 border ${
                  selectedTarget === p.name
                    ? 'bg-red-950/50 border-red-500/50 scale-105'
                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                }`}
              >
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                  selectedTarget === p.name
                    ? 'bg-red-900/50 text-red-200'
                    : 'bg-slate-700/50 text-slate-300'
                }`}>
                  {p.name.charAt(0)}
                </div>
                <p className={`text-xs font-bold truncate ${
                  selectedTarget === p.name ? 'text-red-200' : 'text-slate-300'
                }`}>
                  {p.name}
                </p>
                {selectedTarget === p.name && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-400 text-lg mt-0.5">
                    ☠️
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
          {selectedTarget && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-l from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 text-white font-bold text-base py-5 disabled:opacity-40"
            >
              {isSubmitting ? '⏳ جاري...' : `💀 خذ ${selectedTarget} معك!`}
            </Button>
          )}
        </>
      ) : (
        <>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-6xl mb-4"
          >
            👦
          </motion.div>
          <h2 className="text-xl font-bold text-amber-300 mb-2">
            الولد الصالح يختار!
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            الولد الصالح يختار شخصاً ليأخذه معه...
          </p>
          <div className="bg-slate-800/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-slate-400">بانتظار الولد الصالح...</span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ============================================================
// GAME OVER PHASE
// ============================================================
function GameOverPhase({
  room,
  stateData,
}: {
  room: RoomState | null;
  stateData: StateData | null;
}) {
  const winner = room?.gameWinner;
  const allPlayers = stateData?.players || [];
  const gameLog = stateData?.gameLog || [];

  const isMafiaWin = winner === 'mafia';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Winner Banner */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 10 }}
        className={`text-center mb-6 p-4 sm:p-6 rounded-2xl ${
          isMafiaWin
            ? 'bg-gradient-to-b from-red-950/50 to-slate-900/50 border border-red-500/30'
            : 'bg-gradient-to-b from-blue-950/50 to-slate-900/50 border border-blue-500/30'
        }`}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl mb-3"
        >
          {isMafiaWin ? '💀' : '🏆'}
        </motion.div>
        <h1 className={`text-2xl sm:text-3xl font-black ${
          isMafiaWin ? 'text-red-400' : 'text-blue-400'
        }`}>
          {isMafiaWin ? 'المافيا فازت!' : 'الصالحون فازوا!'}
        </h1>
      </motion.div>

      {/* All Roles Revealed */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-bold text-slate-300 mb-3 text-center">
          🃏 جميع الأدوار
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto mafia-scrollbar">
          {allPlayers.map((p, i) => {
            const roleConfig = p.role ? ROLE_CONFIGS[p.role as RoleType] : null;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl p-2.5 text-center border ${
                  !p.isAlive
                    ? 'bg-slate-800/30 border-slate-700/30 opacity-50'
                    : roleConfig?.team === 'mafia'
                    ? 'bg-red-950/20 border-red-500/20'
                    : 'bg-blue-950/20 border-blue-500/20'
                }`}
              >
                <div className="text-2xl mb-1">{roleConfig?.icon || '❓'}</div>
                <p className={`text-[11px] font-bold truncate ${!p.isAlive ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {p.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {roleConfig?.nameAr || '—'}
                </p>
                {!p.isAlive && <p className="text-[9px] text-red-400/60">💀 ميت</p>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Game Log */}
      {gameLog.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-300 mb-3 text-center">
            📜 سجل اللعبة
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto mafia-scrollbar">
            {gameLog.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500 shrink-0">
                  ر{entry.round}
                </Badge>
                <p className="text-slate-400">{entry.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Play Again */}
      <div className="text-center py-4">
        <p className="text-sm text-slate-400 font-bold mb-3"> شكراً للعب! 🙏</p>
        <Button
          onClick={() => (window.location.href = '/')}
          className="w-full bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-base py-5 pulse-glow-gold"
        >
          🔄 العب مرة أخرى
        </Button>
        <p className="text-[10px] text-slate-500 mt-2">
          أدخل كود واسم جديد للانضمام للعبة ثانية
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN EXPORT WITH SUSPENSE
// ============================================================
export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center mafia-bg-night">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce">🕵️</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
