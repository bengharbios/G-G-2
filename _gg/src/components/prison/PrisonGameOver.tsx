'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePrisonStore } from '@/lib/prison-store';
import type { PrisonTeam } from '@/lib/prison-types';
import {
  Trophy,
  RotateCcw,
  Skull,
  Lock,
  Key,
  Home as HomeIcon,
  Users,
  ScrollText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================
// Confetti particle component
// ============================================================
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#f59e0b', '#f97316', '#ef4444', '#22c55e', '#06b6d4', '#eab308', '#ec4899'];
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
          className="absolute confetti-piece"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Team Stats
// ============================================================
function TeamStats({
  team,
  teamName,
  players,
  isWinner,
}: {
  team: PrisonTeam;
  teamName: string;
  players: { id: string; name: string; team: PrisonTeam; status: string; uniformCount: number }[];
  isWinner: boolean;
}) {
  const teamPlayers = players.filter((p) => p.team === team);
  const executed = teamPlayers.filter((p) => p.status === 'executed').length;
  const imprisoned = teamPlayers.filter((p) => p.status === 'imprisoned').length;
  const freed = teamPlayers.reduce((sum, p) => sum + p.uniformCount - (p.status === 'imprisoned' ? 0 : 0), 0);
  const active = teamPlayers.filter((p) => p.status === 'active').length;
  const isAlpha = team === 'alpha';

  const colorClass = isAlpha ? 'text-amber-' : 'text-cyan-';
  const bgClass = isAlpha ? 'bg-amber-950/30 border-amber-500/30' : 'bg-cyan-950/30 border-cyan-500/30';

  return (
    <div className={`rounded-xl border p-3 ${bgClass} ${isWinner ? 'ring-2 ring-amber-400/50' : 'opacity-70'}`}>
      <Badge className={`text-xs mb-2 ${isAlpha ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30' : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30'}`}>
        {isWinner ? '🏆' : '💀'} {teamName}
      </Badge>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
          <p className="text-lg font-black text-green-400">{active}</p>
          <p className="text-[10px] text-slate-500">أحرار</p>
        </div>
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
          <p className="text-lg font-black text-orange-400">{imprisoned}</p>
          <p className="text-[10px] text-slate-500">مسجونين</p>
        </div>
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
          <p className="text-lg font-black text-red-400">{executed}</p>
          <p className="text-[10px] text-slate-500">معدومين</p>
        </div>
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
          <p className="text-lg font-black text-yellow-400">{teamPlayers.length}</p>
          <p className="text-[10px] text-slate-500">إجمالي</p>
        </div>
      </div>

      {/* Player list */}
      <div className="mt-3 space-y-1">
        {teamPlayers.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
              player.status === 'executed'
                ? 'bg-red-950/20 text-red-400/60 line-through'
                : player.status === 'imprisoned'
                  ? 'bg-orange-950/20 text-orange-400/70'
                  : 'bg-green-950/20 text-green-400'
            }`}
          >
            <span>
              {player.status === 'executed' ? '💀' : player.status === 'imprisoned' ? '🏚️' : '✅'}
            </span>
            <span className="flex-1 truncate">{player.name}</span>
            {player.status === 'imprisoned' && (
              <span className="text-[9px] bg-orange-900/40 px-1 py-0.5 rounded">
                {player.uniformCount}x
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main PrisonGameOver Component
// ============================================================
export default function PrisonGameOver() {
  const router = useRouter();
  const {
    alphaName,
    betaName,
    players,
    gameLog,
    winner,
    winReason,
    resetGame,
  } = usePrisonStore();

  const isDraw = winner === 'draw';
  const winnerTeam = winner as PrisonTeam | null;
  const winnerName = isDraw ? 'تعادل!' : winnerTeam === 'alpha' ? alphaName : betaName;

  // Stats
  const totalMoves = gameLog.length;
  const skullMoves = gameLog.filter((e) => e.itemType === 'skull').length;
  const openMoves = gameLog.filter((e) => e.itemType === 'open').length;
  const keyMoves = gameLog.filter((e) => e.itemType === 'key').length;
  const uniformMoves = gameLog.filter((e) => e.itemType === 'uniform').length;

  const handlePlayAgain = () => {
    resetGame();
  };

  const handleHome = () => {
    resetGame();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 prison-bg">
      {/* Confetti for winner */}
      {!isDraw && <Confetti />}

      <div className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto py-6 sm:py-8">
        {/* Winner Banner */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-center mb-6 sm:mb-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl sm:text-8xl mb-3 sm:mb-4"
          >
            {isDraw ? '🤝' : '🏆'}
          </motion.div>
          <h1
            className={`text-3xl sm:text-4xl font-black mb-2 ${
              isDraw
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300'
                : winnerTeam === 'alpha'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300'
            }`}
          >
            {isDraw ? 'تعادل! 🤝' : `${winnerName} فاز! 🎉`}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {winReason}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <ScrollText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{totalMoves}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">تحركات</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{skullMoves}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">إعدام</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{openMoves}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">سجن</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Key className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{keyMoves}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">تحرير</p>
            </CardContent>
          </Card>
        </div>

        {/* Teams Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-6">
          <TeamStats
            team="alpha"
            teamName={alphaName}
            players={players}
            isWinner={winnerTeam === 'alpha'}
          />
          <TeamStats
            team="beta"
            teamName={betaName}
            players={players}
            isWinner={winnerTeam === 'beta'}
          />
        </div>

        {/* Game Log */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-4 sm:mb-6">
          <CardContent className="pt-3 sm:pt-4">
            <h3 className="text-slate-200 font-bold mb-2 sm:mb-3 text-xs sm:text-sm flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              📜 سجل اللعبة
            </h3>
            <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-56 overflow-y-auto prison-scrollbar">
              {gameLog.length === 0 ? (
                <p className="text-center text-slate-600 text-xs py-4">لا توجد تحركات...</p>
              ) : (
                gameLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 text-xs sm:text-sm"
                  >
                    <span className="text-slate-600 text-[10px] sm:text-xs mt-0.5 shrink-0 w-5 sm:w-6">
                      {entry.id}.
                    </span>
                    <span
                      className={
                        entry.team === 'alpha'
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                      }
                    >
                      {entry.action}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handlePlayAgain}
            className="flex-1 bg-gradient-to-l from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            العب مرة أخرى
          </Button>
          <Button
            onClick={handleHome}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 py-5 sm:py-6"
          >
            <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
