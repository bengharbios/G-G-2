'use client';

import { useTabotStore } from '@/lib/tabot-store';
import { getTeamInfo, TEAM_CONFIG, ROLE_CONFIG, TabotTeam } from '@/lib/tabot-types';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, RotateCcw, Trophy, ChevronDown } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';

function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
  const style = useMemo(() => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${delay}s`,
    backgroundColor: color,
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
  }), [delay, color]);

  return (
    <div
      className="confetti-piece absolute top-0"
      style={style}
    />
  );
}

// ============================================================
// Game Log — Reusable component
// ============================================================

function GameOverLog() {
  const { roundLog } = useTabotStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current && isExpanded) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [roundLog, isExpanded]);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-bold text-slate-300">📋 سجل الأحداث ({roundLog.length})</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 250 }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div
              ref={logRef}
              className="px-4 pb-4 space-y-1 overflow-y-auto max-h-60 mafia-scrollbar"
            >
              {roundLog.map((entry, i) => (
                <div
                  key={i}
                  className={`text-xs px-2 py-1.5 rounded ${
                    entry.type === 'danger' ? 'text-red-300/80 bg-red-950/20' :
                    entry.type === 'success' ? 'text-emerald-300/80 bg-emerald-950/20' :
                    entry.type === 'system' ? 'text-amber-300/80 bg-amber-950/30 font-bold' :
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

export default function GameOver() {
  const { winner, winReason, players, teamAlphaName, teamBetaName, resetGame, setPhase } = useTabotStore();

  const alphaInfo = getTeamInfo(players, 'alpha', teamAlphaName);
  const betaInfo = getTeamInfo(players, 'beta', teamBetaName);

  const isDraw = winner === 'draw';
  const winnerTeam = winner === 'alpha' ? alphaInfo : winner === 'beta' ? betaInfo : null;
  const loserTeam = winner === 'alpha' ? betaInfo : winner === 'beta' ? alphaInfo : null;

  const confettiColors = ['#f59e0b', '#a855f7', '#ef4444', '#22c55e', '#3b82f6', '#ec4899', '#f97316'];

  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4 relative overflow-hidden" dir="rtl">
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {confettiColors.map((color, i) => (
          <ConfettiPiece key={i} delay={i * 0.15} color={color} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', damping: 15 }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', damping: 12 }}
          className="text-center mb-6"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-3"
          >
            🏆
          </motion.div>
        </motion.div>

        {/* Winner announcement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-6"
        >
          {isDraw ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-2">
                تعادل! 🤝
              </h1>
              <p className="text-sm text-slate-400">{winReason}</p>
            </>
          ) : winnerTeam ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl">{TEAM_CONFIG[winner].icon}</span>
                <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-amber-300 to-purple-400">
                  {winnerTeam.name}
                </h1>
              </div>
              <p className="text-sm text-slate-400">{winReason}</p>
            </>
          ) : null}
        </motion.div>

        {/* Team stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3 mb-6"
        >
          {/* Alpha team card */}
          <div className={`rounded-xl border p-3 ${
            winner === 'alpha'
              ? 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-500/10'
              : 'border-slate-700/50 bg-slate-900/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{TEAM_CONFIG.alpha.icon}</span>
                <span className="text-sm font-bold text-red-400">{alphaInfo.name}</span>
                {winner === 'alpha' && <Trophy className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="flex gap-3 text-[10px]">
                <span className="text-emerald-400">نشط {alphaInfo.activeCount}</span>
                <span className="text-amber-400">حبس {alphaInfo.imprisonedCount}</span>
                <span className="text-red-400">قتل {alphaInfo.killedCount}</span>
              </div>
            </div>
            <div className="space-y-0.5">
              {alphaInfo.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                    player.status === 'active' ? 'text-slate-300' :
                    player.status === 'imprisoned' ? 'text-slate-400 opacity-60' :
                    'text-red-300/50 line-through opacity-30'
                  }`}
                >
                  <span>{player.avatar}</span>
                  <span className="flex-1">{player.name}</span>
                  {player.role === 'leader' && <span className="text-amber-400 text-[10px]">👑</span>}
                  {player.role === 'deputy' && <span className="text-blue-400 text-[10px]">⭐</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Beta team card */}
          <div className={`rounded-xl border p-3 ${
            winner === 'beta'
              ? 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-500/10'
              : 'border-slate-700/50 bg-slate-900/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{TEAM_CONFIG.beta.icon}</span>
                <span className="text-sm font-bold text-blue-400">{betaInfo.name}</span>
                {winner === 'beta' && <Trophy className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="flex gap-3 text-[10px]">
                <span className="text-emerald-400">نشط {betaInfo.activeCount}</span>
                <span className="text-amber-400">حبس {betaInfo.imprisonedCount}</span>
                <span className="text-red-400">قتل {betaInfo.killedCount}</span>
              </div>
            </div>
            <div className="space-y-0.5">
              {betaInfo.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                    player.status === 'active' ? 'text-slate-300' :
                    player.status === 'imprisoned' ? 'text-slate-400 opacity-60' :
                    'text-red-300/50 line-through opacity-30'
                  }`}
                >
                  <span>{player.avatar}</span>
                  <span className="flex-1">{player.name}</span>
                  {player.role === 'leader' && <span className="text-amber-400 text-[10px]">👑</span>}
                  {player.role === 'deputy' && <span className="text-blue-400 text-[10px]">⭐</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Game Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="mb-6"
        >
          <GameOverLog />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
          className="flex gap-3 pb-8"
        >
          <Button
            onClick={() => setPhase('landing')}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-4"
          >
            <Home className="w-4 h-4 ml-2" />
            الرئيسية
          </Button>
          <Button
            onClick={resetGame}
            className="flex-1 font-bold py-4 bg-gradient-to-l from-purple-600 to-amber-700 hover:from-purple-500 hover:to-amber-600 text-white pulse-glow-purple"
          >
            <RotateCcw className="w-4 h-4 ml-2" />
            العب مرة أخرى
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
