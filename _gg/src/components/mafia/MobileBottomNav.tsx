'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/game-store';
import { GamePhase } from '@/lib/game-types';
import { t } from '@/lib/i18n';
import { Users, Moon, Sun, Vote, Skull, Shield, Crown } from 'lucide-react';

export default function MobileBottomNav() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.round);
  const gameWinner = useGameStore((s) => s.gameWinner);
  const lang = useGameStore((s) => s.lang);
  const tr = useMemo(() => t(lang), [lang]);

  const isInGame = phase !== 'setup';
  const isNight = phase.startsWith('night');
  const isGameOver = phase === 'game_over';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-l from-transparent via-purple-500/50 to-transparent" />
      
      <nav className="glass-strong px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around">
          {/* Players */}
          <NavButton
            icon={<Users className="w-5 h-5" />}
            label={tr.playerCount}
            active={phase === 'setup' || phase === 'card_distribution'}
            color={phase === 'setup' ? 'text-blue-400' : 'text-slate-500'}
          />
          
          {/* Night Phase */}
          <NavButton
            icon={<Moon className="w-5 h-5" />}
            label={tr.night}
            active={isNight && !isGameOver}
            color="text-indigo-400"
            badge={isNight && isInGame ? round : undefined}
          />
          
          {/* Day Phase */}
          <NavButton
            icon={<Sun className="w-5 h-5" />}
            label={tr.day}
            active={!isNight && isInGame && !isGameOver}
            color="text-yellow-400"
            badge={!isNight && isInGame ? round : undefined}
          />
          
          {/* Voting */}
          <NavButton
            icon={<Vote className="w-5 h-5" />}
            label={tr.phaseVoting}
            active={phase === 'day_voting'}
            color="text-red-400"
          />
          
          {/* Game Over */}
          <NavButton
            icon={gameWinner === 'mafia' ? <Skull className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            label={isGameOver ? (gameWinner === 'mafia' ? '💀' : '🏆') : tr.phaseGameOver}
            active={isGameOver}
            color={gameWinner === 'mafia' ? 'text-red-400' : 'text-blue-400'}
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  color = 'text-slate-500',
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  color?: string;
  badge?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-1 relative">
      <div className="relative">
        <motion.div
          animate={active ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={active ? color : 'text-slate-600'}
        >
          {icon}
        </motion.div>
        {active && (
          <motion.div
            layoutId="navIndicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current"
          />
        )}
        {badge !== undefined && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className={`text-[9px] font-medium ${active ? color : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
  );
}
