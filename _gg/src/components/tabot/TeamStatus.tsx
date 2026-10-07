'use client';

import { motion } from 'framer-motion';
import { TeamInfo, STATUS_CONFIG, ROLE_CONFIG } from '@/lib/tabot-types';

interface TeamStatusProps {
  team: TeamInfo;
  isActive: boolean;
}

export default function TeamStatus({ team, isActive }: TeamStatusProps) {
  return (
    <motion.div
      animate={isActive ? { opacity: [0.85, 1, 0.85] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className={`rounded-xl border ${team.borderColor} bg-gradient-to-b ${team.gradient} p-2.5 sm:p-3 transition-all ${
        isActive
          ? `ring-2 ${
              team.id === 'alpha'
                ? 'ring-red-500/50 shadow-lg shadow-red-500/10'
                : 'ring-blue-500/50 shadow-lg shadow-blue-500/10'
            }`
          : 'opacity-60'
      }`}
    >
      {/* Team header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base sm:text-lg">{team.icon}</span>
          <span className={`font-black text-xs sm:text-sm ${team.color}`}>{team.name}</span>
        </div>
        {isActive && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full"
          >
            ◀ دورك
          </motion.span>
        )}
      </div>

      {/* Role badges */}
      <div className="flex items-center gap-1.5 mb-2">
        {team.leader && (
          <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
            👑 {team.leader.name}
          </span>
        )}
        {team.deputy && (
          <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
            ⭐ {team.deputy.name}
          </span>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-[10px] sm:text-xs mb-2">
        <div className="flex items-center gap-0.5">
          <span className="text-emerald-500 text-xs">✅</span>
          <span className="text-slate-300 font-bold">{team.activeCount}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-amber-500 text-xs">🔒</span>
          <span className="text-slate-300 font-bold">{team.imprisonedCount}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-red-500 text-xs">💀</span>
          <span className="text-slate-300 font-bold">{team.killedCount}</span>
        </div>
      </div>

      {/* Player list */}
      <div className="space-y-1 max-h-32 overflow-y-auto mafia-scrollbar">
        {team.players.map((player) => {
          const statusConfig = STATUS_CONFIG[player.status];
          const roleConfig = ROLE_CONFIG[player.role];
          const isEliminated = player.status !== 'active';

          return (
            <div
              key={player.id}
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md transition-all ${
                isEliminated ? 'opacity-40' : 'bg-white/[0.03]'
              }`}
            >
              <span className="text-xs">{player.avatar}</span>
              <span className="text-[8px] shrink-0">{statusConfig.emoji}</span>
              <span
                className={`text-[11px] sm:text-xs flex-1 truncate ${
                  isEliminated ? 'text-slate-600 line-through' : 'text-slate-300'
                }`}
              >
                {player.name}
              </span>
              <span className="text-[10px] shrink-0">
                {player.role === 'leader'
                  ? '👑'
                  : player.role === 'deputy'
                  ? '⭐'
                  : player.role === 'guest'
                  ? '👁️'
                  : ''}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
