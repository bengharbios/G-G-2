'use client';

import { motion } from 'framer-motion';
import { useRisk2Store } from '@/lib/risk2-store';
import { RotateCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================
// Game Over — المجازفة 2
// ============================================================
export default function Risk2GameOver() {
  const { winner, winReason, players, config, resetGame } = useRisk2Store();
  const router = useRouter();

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const handlePlayAgain = () => {
    resetGame();
  };

  const handleHome = () => {
    resetGame();
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 min-h-[70vh]" dir="rtl">
      {/* Winner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-6xl mb-4"
        >
          🏆
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 mb-2">
          انتهت اللعبة!
        </h1>
        {winner && (
          <>
            <p className="text-lg font-bold text-amber-300 mb-1">{winner.name}</p>
            <p className="text-sm text-slate-400">{winReason}</p>
            <div className="mt-3 inline-block px-4 py-2 rounded-xl bg-yellow-950/30 border border-yellow-500/30">
              <span className="text-2xl font-black text-yellow-400">{winner.score}</span>
              <span className="text-xs text-slate-500 mr-1">نقطة</span>
            </div>
          </>
        )}
      </motion.div>

      {/* Final Scores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md space-y-2 mb-8"
      >
        {sortedPlayers.map((player, idx) => {
          const isWinner = winner?.id === player.id;
          const medals = ['🥇', '🥈', '🥉'];
          const medal = idx < 3 ? medals[idx] : `#${idx + 1}`;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                isWinner
                  ? 'bg-yellow-950/20 border border-yellow-500/30'
                  : 'bg-slate-800/30 border border-slate-700/20'
              }`}
            >
              <span className="text-lg w-8 text-center">{medal}</span>
              <span className={`flex-1 text-sm font-bold ${isWinner ? 'text-yellow-300' : 'text-slate-300'}`}>
                {player.name}
              </span>
              <span className={`text-sm font-black ${isWinner ? 'text-yellow-400' : 'text-slate-400'}`}>
                {player.score}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3 w-full max-w-md"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleHome}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-800/60 border border-slate-700/30 text-slate-300 hover:bg-slate-700/60 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          الرئيسية
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePlayAgain}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <RotateCcw className="w-4 h-4" />
          لعب مرة أخرى
        </motion.button>
      </motion.div>
    </div>
  );
}
