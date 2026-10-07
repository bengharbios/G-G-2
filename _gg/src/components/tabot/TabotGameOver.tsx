'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTabotStore } from '@/lib/tabot-store';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { TEAM_CONFIG, getTeamInfo } from '@/lib/tabot-types';

// ─── Confetti Configuration ─────────────────────────────────────────────

const CONFETTI_COLORS = [
  'bg-purple-500', 'bg-amber-500', 'bg-emerald-500', 'bg-red-500',
  'bg-pink-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-violet-500',
];

const confetti = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  x: Math.random() * 100,
  delay: Math.random() * 2,
  duration: 2 + Math.random() * 2,
  size: 4 + Math.random() * 8,
  rotation: Math.random() > 0.5 ? 1 : -1,
}));

// ─── Game Over Screen ───────────────────────────────────────────────────

export default function TabotGameOver() {
  const { winner, winReason, players, teamAlphaName, teamBetaName, resetGame, setPhase } = useTabotStore();

  const alphaInfo = getTeamInfo(players, 'alpha', teamAlphaName);
  const betaInfo = getTeamInfo(players, 'beta', teamBetaName);

  const winnerConfig = winner && winner !== 'draw' ? TEAM_CONFIG[winner] : null;

  const handlePlayAgain = () => {
    resetGame();
    setPhase('setup');
  };

  const handleHome = () => {
    resetGame();
    setPhase('landing');
  };

  return (
    <div className="relative min-h-[calc(100vh-100px)] flex flex-col items-center justify-center px-4 py-8 overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />

      {/* Confetti */}
      {winner && winner !== 'draw' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              className={`absolute ${c.color} rounded-sm`}
              style={{
                width: c.size,
                height: c.size * 0.6,
                left: `${c.x}%`,
                top: -10,
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [0, (Math.random() - 0.5) * 100],
                rotate: [0, 720 * c.rotation],
              }}
              transition={{
                duration: c.duration,
                delay: c.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="text-7xl sm:text-8xl"
        >
          {winner === 'draw' ? '🤝' : '🏆'}
        </motion.div>

        {/* Winner announcement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          {winner === 'draw' ? (
            <h2 className="text-3xl font-black text-white mb-2">تعادل!</h2>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-black text-slate-300 mb-1">فاز فريق</h2>
              <h2 className={`text-2xl sm:text-3xl font-black mb-2 bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent`}>
                {winnerConfig!.icon} {winner === 'alpha' ? teamAlphaName : teamBetaName}
              </h2>
            </>
          )}
          <p className="text-sm text-slate-500">
            {winReason || (winner === 'draw' ? 'لا فائز هذه المرة!' : 'تم حبس جميع لاعبي الفريق الخصم!')}
          </p>
        </motion.div>

        {/* Team result cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full grid grid-cols-2 gap-3"
        >
          <TeamResultCard
            name={teamAlphaName}
            icon={TEAM_CONFIG.alpha.icon}
            color={TEAM_CONFIG.alpha.color}
            borderColor={TEAM_CONFIG.alpha.borderColor}
            players={alphaInfo.players}
            isWinner={winner === 'alpha'}
          />
          <TeamResultCard
            name={teamBetaName}
            icon={TEAM_CONFIG.beta.icon}
            color={TEAM_CONFIG.beta.color}
            borderColor={TEAM_CONFIG.beta.borderColor}
            players={betaInfo.players}
            isWinner={winner === 'beta'}
          />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="w-full flex gap-3"
        >
          <Button
            variant="ghost"
            onClick={handleHome}
            className="flex-1 text-slate-500 hover:text-slate-300 border border-slate-800/50 h-11"
          >
            الرئيسية
          </Button>
          <Button
            onClick={handlePlayAgain}
            className="flex-1 bg-gradient-to-l from-purple-700 to-red-900 hover:from-purple-600 hover:to-red-800 text-white font-bold shadow-lg shadow-purple-900/40 h-11"
          >
            <RotateCcw className="w-4 h-4 ml-2" />
            العب مرة أخرى
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Team Result Card ───────────────────────────────────────────────────

function TeamResultCard({
  name,
  icon,
  color,
  borderColor,
  players,
  isWinner,
}: {
  name: string;
  icon: string;
  color: string;
  borderColor: string;
  players: { name: string; status: string; role: string; avatar: string }[];
  isWinner: boolean;
}) {
  const active = players.filter(p => p.status === 'active').length;
  const imprisoned = players.filter(p => p.status === 'imprisoned').length;
  const killed = players.filter(p => p.status === 'killed').length;

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      isWinner
        ? 'bg-gradient-to-b from-yellow-950/20 to-gray-900/60 border-yellow-500/40 shadow-lg shadow-yellow-500/10'
        : `bg-gray-900/60 ${borderColor}`
    }`}>
      {/* Team header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-sm font-bold ${color}`}>{name}</span>
        {isWinner && <CheckCircle className="w-4 h-4 text-yellow-500 mr-auto" />}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-3 text-xs mb-2">
        <span className="text-emerald-500 font-bold">✓ {active}</span>
        <span className="text-amber-500 font-bold">🔒 {imprisoned}</span>
        <span className="text-red-500 font-bold">💀 {killed}</span>
      </div>

      {/* Player list */}
      <div className="space-y-1">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="text-xs">{p.avatar}</span>
            <span>
              {p.status === 'active' ? '✅' : p.status === 'imprisoned' ? '🔒' : '💀'}
            </span>
            <span className={`truncate flex-1 ${
              p.status === 'active' ? 'text-slate-300' : 'text-slate-600 line-through'
            }`}>
              {p.name}
            </span>
            <span className="text-slate-600 text-[9px] shrink-0">
              {p.role === 'leader' ? '👑' : p.role === 'deputy' ? '⭐' : p.role === 'guest' ? '👁️' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
