'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Door, OUTCOME_CONFIG } from '@/lib/tabot-types';

interface DoorCardProps {
  door: Door;
  index: number;
  isSelectable: boolean;
  onSelect: (doorId: number) => void;
}

export default function DoorCard({ door, index, isSelectable, onSelect }: DoorCardProps) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const config = door.isRevealed ? OUTCOME_CONFIG[door.outcome] : null;
  const isDisabled = door.isRevealed || !isSelectable;

  const handleClick = () => {
    if (isDisabled) return;
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setIsRevealing(true);
      setTimeout(() => {
        onSelect(door.id);
      }, 600);
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="relative"
    >
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          relative w-full aspect-square rounded-xl border-2 overflow-hidden
          transition-all duration-300 cursor-pointer
          ${isDisabled && !isRevealing ? 'opacity-40 cursor-not-allowed' : ''}
          ${isShaking ? 'door-shake' : ''}
          ${isSelectable && !door.isRevealed ? 'hover:scale-105 hover:z-10' : ''}
          ${isRevealing ? 'scale-in' : ''}
        `}
        style={{
          borderColor: door.isRevealed && config
            ? config.borderColor.replace('border-', '').replace('/50', '').replace('/30', '')
            : 'rgba(168, 85, 247, 0.3)',
        }}
      >
        {/* Unrevealed door */}
        {!door.isRevealed && !isRevealing && (
          <div
            className={`
              absolute inset-0 flex flex-col items-center justify-center
              bg-gradient-to-b from-slate-800 via-purple-950 to-slate-900
              ${isSelectable ? 'hover:from-slate-700 hover:via-purple-900 hover:to-slate-800' : ''}
            `}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 shimmer opacity-30" />

            {/* Door number */}
            <span className="text-[10px] sm:text-xs font-bold text-purple-400/60 mb-0.5 relative z-10">
              #{door.id}
            </span>

            {/* Coffin icon */}
            <span className="text-2xl sm:text-3xl md:text-4xl relative z-10">
              ⚰️
            </span>

            {/* Mystery glow at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-purple-500/20 to-transparent"
              style={{ 
                boxShadow: isSelectable ? '0 0 15px rgba(168, 85, 247, 0.15)' : 'none',
              }}
            />

            {/* Selectable indicator */}
            {isSelectable && (
              <motion.div
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-xl border-2 border-purple-400/40"
              />
            )}
          </div>
        )}

        {/* Revealing animation */}
        {isRevealing && !door.isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-3xl"
            >
              ⚰️
            </motion.span>
          </div>
        )}

        {/* Revealed door */}
        {door.isRevealed && config && (
          <div
            className={`
              absolute inset-0 flex flex-col items-center justify-center
              ${config.bgColor}
            `}
          >
            {/* Colored top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(to left, ${
                  config.type === 'safe' ? '#06b6d4, #22d3ee' :
                  config.type === 'attack' ? '#f59e0b, #ef4444' :
                  config.type === 'defense' ? '#10b981, #34d399' :
                  config.type === 'team_damage' ? '#f97316, #eab308' :
                  '#ef4444, #dc2626'
                })`,
              }}
            />

            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5">{config.emoji}</span>
            <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-center px-1 leading-tight"
              style={{ color: config.color.includes('cyan') ? '#22d3ee' : 
                              config.color.includes('amber') ? '#fbbf24' :
                              config.color.includes('emerald') ? '#34d399' :
                              config.color.includes('red') ? '#f87171' :
                              config.color.includes('rose') ? '#fb7185' :
                              config.color.includes('orange') ? '#fb923c' :
                              config.color.includes('yellow') ? '#facc15' :
                              config.color.includes('purple') ? '#c084fc' :
                              '#cbd5e1' }}
            >
              {config.label}
            </span>
          </div>
        )}
      </button>
    </motion.div>
  );
}
