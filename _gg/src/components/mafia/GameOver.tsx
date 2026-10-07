'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/game-store';
import PlayerAvatar from './PlayerAvatar';
import { ROLE_CONFIGS, RoleType } from '@/lib/game-types';
import {
  Trophy,
  RotateCcw,
  Skull,
  Users,
  Shield,
  Crown,
} from 'lucide-react';

export default function GameOver() {
  const { players, gameWinner, round, eliminatedPlayers, gameLog, resetGame } =
    useGameStore();

  const alivePlayers = players.filter((p) => p.isAlive);
  const mafiaPlayers = players.filter(
    (p) => p.role && ROLE_CONFIGS[p.role].team === 'mafia'
  );
  const citizenPlayers = players.filter(
    (p) => p.role && ROLE_CONFIGS[p.role].team === 'citizen'
  );

  const isCitizensWin = gameWinner === 'citizen';

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 mafia-bg-night">
      {/* Confetti-like particles for winner */}
      {isCitizensWin && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute confetti-piece"
              style={{
                backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'][
                  i % 5
                ],
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto py-6 sm:py-8">
        {/* Winner banner */}
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
            {isCitizensWin ? '🏆' : '💀'}
          </motion.div>
          <h1
            className={`text-3xl sm:text-4xl font-black mb-2 ${
              isCitizensWin
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-yellow-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500'
            }`}
          >
            {isCitizensWin ? 'الصالحون فازوا! 🎉' : 'المافيا فازت! 😈'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            الجولة {round} • {eliminatedPlayers.length} إقصاءات
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{alivePlayers.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">نجوا</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{eliminatedPlayers.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">أُقصوا</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{round}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">جولات</p>
            </CardContent>
          </Card>
        </div>

        {/* All players revealed */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-3 sm:mb-4">
          <CardContent className="pt-3 sm:pt-4">
            <h3 className="text-slate-200 font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              كشف جميع البطاقات
            </h3>

            {/* Mafia team */}
            <div className="mb-3 sm:mb-4">
              <Badge className="bg-red-900/50 text-red-300 border-red-500/30 mb-2 text-xs">
                👿 فريق المافيا
              </Badge>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 mt-2">
                {mafiaPlayers.map((player) => (
                  <PlayerAvatar
                    key={player.id}
                    name={player.name}
                    isAlive={player.isAlive}
                    role={player.role as RoleType}
                    showRole={true}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            {/* Citizen team */}
            <div>
              <Badge className="bg-blue-900/50 text-blue-300 border-blue-500/30 mb-2 text-xs">
                🛡️ فريق الصالحين
              </Badge>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 mt-2">
                {citizenPlayers.map((player) => (
                  <PlayerAvatar
                    key={player.id}
                    name={player.name}
                    isAlive={player.isAlive}
                    role={player.role as RoleType}
                    showRole={true}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Log */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-4 sm:mb-6">
          <CardContent className="pt-3 sm:pt-4">
            <h3 className="text-slate-200 font-bold mb-2 sm:mb-3 text-xs sm:text-sm">
              📜 سجل اللعبة
            </h3>
            <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto mafia-scrollbar">
              {gameLog.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-xs sm:text-sm"
                >
                  <span className="text-slate-600 text-[10px] sm:text-xs mt-0.5 shrink-0 w-5 sm:w-6">
                    {entry.round}
                  </span>
                  <span
                    className={
                      entry.phase === 'night'
                        ? 'text-indigo-400'
                        : entry.message.includes('إقصاء') || entry.message.includes('قتل')
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }
                  >
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Play again */}
        <Button
          onClick={resetGame}
          className="w-full bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6 pulse-glow-gold"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          العب مرة أخرى
        </Button>
      </div>
    </div>
  );
}
