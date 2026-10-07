'use client';

import { motion } from 'framer-motion';
import { Trophy, Home, RotateCcw, BarChart3, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShifaratStore } from '@/lib/shifarat-store';
import type { BoardCard } from '@/lib/shifarat-types';

// ============================================================
// CONFETTI PARTICLES
// ============================================================

function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 2,
    size: Math.random() * 6 + 4,
    color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'][
      Math.floor(Math.random() * 6)
    ],
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 1,
            y: -20,
            x: `${p.x}%`,
            rotate: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            y: ['0vh', '110vh'],
            rotate: [0, p.rotation * 2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
            ease: 'easeIn',
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// REVEALED BOARD
// ============================================================

function RevealedBoard({ board }: { board: BoardCard[] }) {
  const getCardStyle = (card: BoardCard) => {
    // Correctly revealed cards
    if (card.isRevealed) {
      switch (card.color) {
        case 'red':
          return 'bg-red-500/80 border-red-400/60';
        case 'blue':
          return 'bg-blue-500/80 border-blue-400/60';
        case 'neutral':
          return 'bg-slate-600/50 border-slate-500/40';
        case 'assassin':
          return 'bg-gray-900 border-gray-500/60';
      }
    }
    // Wrongly guessed but not revealed (color hidden during game)
    if (card.guessedBy && !card.isRevealed) {
      switch (card.color) {
        case 'red':
          return 'bg-red-500/40 border-red-400/30';
        case 'blue':
          return 'bg-blue-500/40 border-blue-400/30';
        case 'neutral':
          return 'bg-slate-600/25 border-slate-500/20';
        case 'assassin':
          return 'bg-gray-900/60 border-gray-500/30';
      }
    }
    // Untouched cards
    switch (card.color) {
      case 'red':
        return 'bg-red-500/50 border-red-400/30';
      case 'blue':
        return 'bg-blue-500/50 border-blue-400/30';
      case 'neutral':
        return 'bg-slate-600/30 border-slate-500/20';
      case 'assassin':
        return 'bg-gray-900/80 border-gray-500/40';
    }
  };

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {board.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03, duration: 0.3 }}
          className={`
            relative aspect-square rounded-lg sm:rounded-xl border-2
            flex items-center justify-center p-1 sm:p-2
            ${getCardStyle(card)}
            ${card.guessedBy && !card.isRevealed ? 'opacity-60' : card.isRevealed ? '' : 'opacity-70'}
          `}
        >
          {card.isRevealed && (
            <Check className="absolute top-0.5 right-0.5 z-10 w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
          )}
          {/* Wrongly guessed card: show ✕ without revealing color during game */}
          {card.guessedBy && !card.isRevealed && (
            <span className="absolute top-0.5 right-0.5 z-10 text-[10px] sm:text-xs font-bold text-red-400/70">✕</span>
          )}
          {!card.isRevealed && !card.guessedBy && card.color === 'assassin' && (
            <span className="absolute top-0 left-0 text-[8px] sm:text-[10px]">💀</span>
          )}
          <span className="text-[9px] sm:text-xs md:text-sm font-bold text-white/90 text-center leading-tight break-words line-clamp-2">
            {card.word}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// WIN REASON DISPLAY
// ============================================================

function WinReason({ reason, winner }: { reason: string | null; winner: 'red' | 'blue' | null }) {
  const reasons: Record<string, { emoji: string; text: string }> = {
    'all_found': { emoji: '🎯', text: 'وجد جميع كلماته!' },
    'assassin': {
      emoji: '💀',
      text: `${winner === 'red' ? 'الفريق الأزرق' : 'الفريق الأحمر'} كشف القاتل!`,
    },
    'opponent_finished': { emoji: '⚡', text: 'الخصم وجد كلماته بالخطأ!' },
  };

  const r = reason ? reasons[reason] : null;
  if (!r) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="flex items-center justify-center gap-2 text-sm text-slate-400"
    >
      <span>{r.emoji}</span>
      <span>{r.text}</span>
    </motion.div>
  );
}

// ============================================================
// MAIN GAME OVER COMPONENT
// ============================================================

export default function GameOver() {
  const {
    winner,
    winReason,
    redTeam,
    blueTeam,
    startingTeam,
    roundNumber,
    clues,
    resetGame,
    board,
  } = useShifaratStore();

  const winnerName = winner === 'red' ? redTeam.name : winner === 'blue' ? blueTeam.name : 'لا يوجد';
  const loserTeam = winner === 'red' ? 'blue' : 'red';
  const loserName = loserTeam === 'red' ? redTeam.name : blueTeam.name;
  const winnerScore = winner === 'red' ? redTeam.score : winner === 'blue' ? blueTeam.score : 0;
  const loserScore = loserTeam === 'red' ? redTeam.score : blueTeam.score;
  const winnerColor = winner === 'red' ? 'text-red-400' : 'text-blue-400';

  const isAssassin = winReason === 'assassin';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-4 sm:px-6"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      {/* Confetti (only if not assassin) */}
      {!isAssassin && <Confetti />}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
          className="mb-4 text-center"
        >
          <div
            className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full mb-2"
            style={{
              background: isAssassin
                ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.2), rgba(75, 85, 99, 0.15))'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(245, 158, 11, 0.15))',
              border: `2px solid ${isAssassin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              boxShadow: isAssassin
                ? '0 0 40px rgba(239, 68, 68, 0.2)'
                : '0 0 40px rgba(16, 185, 129, 0.2), 0 0 80px rgba(16, 185, 129, 0.1)',
            }}
          >
            <span className="text-5xl sm:text-6xl">{isAssassin ? '💀' : '🏆'}</span>
          </div>
        </motion.div>

        {/* Winner Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className={`text-2xl sm:text-3xl font-black mb-1 text-center ${winnerColor}`}
        >
          {winnerName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-slate-400 text-sm mb-2 text-center"
        >
          {isAssassin ? 'فاز بسبب خطأ الخصم!' : 'فاز باللعبة! 🎉'}
        </motion.p>

        {/* Win Reason */}
        <div className="text-center mb-4">
          <WinReason reason={winReason} winner={winner} />
        </div>

        {/* Score Cards */}
        <div className="flex gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.4 }}
            className={`flex-1 p-4 rounded-xl ${
              winner === 'red'
                ? 'bg-red-950/40 border-2 border-red-500/50'
                : 'bg-blue-950/40 border-2 border-blue-500/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">الفائز</span>
            </div>
            <div className="text-3xl font-black text-white">{winnerScore}</div>
            <div className="text-xs text-slate-400 mt-1">{winnerName}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            className="flex-1 p-4 rounded-xl bg-slate-900/40 border-2 border-slate-800/50 opacity-70"
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500">الثاني</span>
            </div>
            <div className="text-3xl font-black text-slate-300">{loserScore}</div>
            <div className="text-xs text-slate-500 mt-1">{loserName}</div>
          </motion.div>
        </div>

        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="mb-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/50"
        >
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">إحصائيات اللعبة</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xl font-black text-white">{roundNumber}</div>
              <div className="text-[10px] text-slate-500">الجولات</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-emerald-400">{clues.length}</div>
              <div className="text-[10px] text-slate-500">الأدلة</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-amber-400">
                {winnerScore - loserScore}
              </div>
              <div className="text-[10px] text-slate-500">الفارق</div>
            </div>
          </div>
        </motion.div>

        {/* Board Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="mb-6 p-3 sm:p-4 rounded-xl bg-slate-900/40 border border-slate-800/50"
        >
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="text-xs">👁️</span>
            <span className="text-xs font-bold text-slate-300">كشف اللوحة</span>
          </div>
          <RevealedBoard board={board} />

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-500/80" />
              <span className="text-[9px] text-slate-500">أحمر</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-blue-500/80" />
              <span className="text-[9px] text-slate-500">أزرق</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-600/50" />
              <span className="text-[9px] text-slate-500">محايد</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-900" />
              <span className="text-[9px] text-slate-500">💀</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.4 }}
          className="space-y-3"
        >
          <Button
            onClick={resetGame}
            className="w-full py-5 font-bold text-base text-white"
            style={{
              background: 'linear-gradient(to left, #059669, #10b981)',
              borderRadius: '1rem',
              minHeight: '52px',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
            }}
          >
            <RotateCcw className="w-5 h-5 ml-2" />
            العب مرة أخرى 🔥
          </Button>

          <Button
            onClick={resetGame}
            variant="ghost"
            className="w-full py-4 text-slate-400 hover:text-slate-300 gap-2 text-sm"
            style={{ borderRadius: '1rem' }}
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
