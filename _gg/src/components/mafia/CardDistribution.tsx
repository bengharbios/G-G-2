'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/game-store';
import RoleCard from './RoleCard';
import { Eye, EyeOff } from 'lucide-react';

export default function CardDistribution() {
  const {
    players,
    currentDistributionIndex,
    showCard,
    setDistributionIndex,
    setShowCard,
    markCardSeen,
    setPhase,
  } = useGameStore();

  const currentPlayer = players[currentDistributionIndex];
  const isLastPlayer = currentDistributionIndex >= players.length - 1;

  const handleConfirm = () => {
    if (currentPlayer) {
      markCardSeen(currentPlayer.id);
    }
    if (isLastPlayer) {
      setPhase('night_start');
    } else {
      setDistributionIndex(currentDistributionIndex + 1);
      setShowCard(false);
    }
  };

  const handleShowCard = () => {
    setShowCard(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-night">
      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
        {/* Progress */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs sm:text-sm">
              توزيع البطاقات
            </span>
            <span className="text-yellow-400 font-bold text-xs sm:text-sm">
              {currentDistributionIndex + 1} / {players.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-yellow-500 to-amber-600 rounded-full"
              animate={{
                width: `${((currentDistributionIndex + 1) / players.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentDistributionIndex}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            {/* Player name banner */}
            {!showCard && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-center mb-6 sm:mb-8"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border-2 border-yellow-500/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-yellow-400">
                    {currentPlayer?.name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
                  أنا {currentPlayer?.name}
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  اضغط لرؤية بطاقتك - لا يراك أحد!
                </p>
              </motion.div>
            )}

            {/* Card */}
            {currentPlayer?.role && (
              <div className="mb-6 sm:mb-8">
                <RoleCard
                  role={currentPlayer.role}
                  playerName={showCard ? currentPlayer.name : undefined}
                  showCard={showCard}
                  size="md"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {!showCard ? (
                <Button
                  onClick={handleShowCard}
                  className="bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6 pulse-glow-gold"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  أرى بطاقتي
                </Button>
              ) : (
                <>
                  {/* Show team members for mafia */}
                  {currentPlayer?.role && (
                    ['mafia_boss', 'mafia_silencer', 'mafia_regular'].includes(currentPlayer.role) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-950/50 border border-red-500/30 rounded-xl p-3 sm:p-4 mb-2"
                      >
                        <p className="text-red-300 text-xs sm:text-sm font-bold mb-2">
                          🔴 زميلائك في المافيا:
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                          {players
                            .filter(
                              (p) =>
                                p.id !== currentPlayer.id &&
                                ['mafia_boss', 'mafia_silencer', 'mafia_regular'].includes(p.role || '')
                            )
                            .map((p) => (
                              <span
                                key={p.id}
                                className="bg-red-900/50 text-red-200 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold"
                              >
                                {p.name}
                              </span>
                            ))}
                        </div>
                      </motion.div>
                    )
                  )}

                  <Button
                    onClick={handleConfirm}
                    className="bg-gradient-to-l from-emerald-700 to-green-900 hover:from-emerald-600 hover:to-green-800 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
                  >
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    {isLastPlayer ? 'جميع اللاعبين رأوا بطاقاتهم ✅' : 'رأيت كرتي - التالي'}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
