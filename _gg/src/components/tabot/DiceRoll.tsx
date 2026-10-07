'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

interface DiceRollProps {
  onRoll: (value: number) => void;
}

export default function DiceRoll({ onRoll }: DiceRollProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentFace, setCurrentFace] = useState(0);

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);

    let count = 0;
    const maxCount = 18;
    const interval = setInterval(() => {
      setCurrentFace(Math.floor(Math.random() * 6));
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setCurrentFace(finalValue - 1);
        setIsRolling(false);
        onRoll(finalValue);
      }
    }, 70);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D Dice */}
      <motion.div
        animate={isRolling ? {
          rotateX: [0, 360, 720],
          rotateY: [0, 180, 360],
          rotateZ: [0, 90, 180],
        } : { rotateX: 0, rotateY: 0, rotateZ: 0 }}
        transition={isRolling ? {
          duration: 1.2,
          repeat: Infinity,
          ease: 'linear',
        } : { duration: 0.5, type: 'spring' }}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-white via-gray-100 to-gray-300 border-4 border-gray-300 shadow-xl flex items-center justify-center select-none"
        style={{
          perspective: '600px',
          transformStyle: 'preserve-3d',
          boxShadow: isRolling
            ? '0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(168, 85, 247, 0.2), 0 20px 40px rgba(0,0,0,0.3)'
            : '0 10px 30px rgba(0,0,0,0.3)',
        }}
        onClick={handleRoll}
      >
        <span className="text-4xl sm:text-5xl select-none">{DICE_FACES[currentFace]}</span>
      </motion.div>

      {/* Roll button or rolling indicator */}
      {!isRolling && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRoll}
          className="px-8 py-2.5 rounded-xl bg-gradient-to-l from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold text-sm transition-all shadow-lg shadow-purple-900/30"
        >
          🎲 ارمي النرد
        </motion.button>
      )}

      {isRolling && (
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-purple-400 text-xs font-bold"
        >
          جاري الرمي...
        </motion.p>
      )}
    </div>
  );
}
