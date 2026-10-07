'use client';

import { ROLE_CONFIGS, RoleType, RoleConfig } from '@/lib/game-types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RoleCardProps {
  role: RoleType;
  playerName?: string;
  showCard?: boolean;
  flipped?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-48 h-72',
  md: 'w-64 h-96',
  lg: 'w-80 h-[28rem]',
};

const iconSizeClasses = {
  sm: 'text-5xl',
  md: 'text-7xl',
  lg: 'text-8xl',
};

const titleSizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const descSizeClasses = {
  sm: 'text-[10px]',
  md: 'text-sm',
  lg: 'text-base',
};

function CardContent({ config, size }: { config: RoleConfig; size: 'sm' | 'md' | 'lg' }) {
  const isMafia = config.team === 'mafia';

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-2xl border-2 overflow-hidden',
        `bg-gradient-to-br ${config.gradient}`,
        config.borderColor
      )}
    >
      {/* Card texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,_white_1px,_transparent_1px),radial-gradient(circle_at_70%_80%,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />

      {/* Team banner */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-bold tracking-wider',
          isMafia
            ? 'bg-red-900/60 text-red-200 border-b border-red-500/30'
            : 'bg-blue-900/60 text-blue-200 border-b border-blue-500/30'
        )}
      >
        {isMafia ? '🃏 فريق المافيا' : '🛡️ فريق المواطنين'}
      </div>

      {/* Card content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 pt-10">
        {/* Icon with glow */}
        <div
          className={cn(
            'mb-4',
            isMafia ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]'
          )}
        >
          <span className={iconSizeClasses[size]}>{config.icon}</span>
        </div>

        {/* Role name */}
        <h3
          className={cn(
            'font-bold mb-3',
            titleSizeClasses[size],
            config.textColor,
            'text-center'
          )}
        >
          {config.nameAr}
        </h3>

        {/* Separator */}
        <div
          className={cn(
            'w-16 h-0.5 mb-3',
            isMafia ? 'bg-red-500/40' : 'bg-blue-400/40'
          )}
        />

        {/* Description */}
        <p
          className={cn(
            'text-center leading-relaxed max-w-[85%]',
            descSizeClasses[size],
            'text-white/70'
          )}
        >
          {config.description}
        </p>

        {/* Bottom decoration */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 opacity-30">
          {isMafia ? (
            <>
              <span className="text-xs">💀</span>
              <span className="text-xs">💀</span>
              <span className="text-xs">💀</span>
            </>
          ) : (
            <>
              <span className="text-xs">⭐</span>
              <span className="text-xs">⭐</span>
              <span className="text-xs">⭐</span>
            </>
          )}
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-lg" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
    </div>
  );
}

export default function RoleCard({
  role,
  playerName,
  showCard = true,
  flipped = false,
  size = 'md',
  className,
  onClick,
}: RoleCardProps) {
  const config = ROLE_CONFIGS[role];

  if (!showCard) {
    return (
      <div
        className={cn(
          'relative rounded-2xl border-2 overflow-hidden cursor-pointer',
          sizeClasses[size],
          'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-slate-600/50 hover:border-yellow-500/50 transition-all duration-300',
          onClick && 'hover:scale-105 active:scale-95',
          className
        )}
        onClick={onClick}
      >
        {/* Card back pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(234,179,8,0.05)_1px,_transparent_1px)] bg-[length:15px_15px]" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <span className={cn('mb-3', iconSizeClasses[size])}>🃏</span>
          <span className="text-slate-400 font-bold text-lg">لعبة المافيا</span>
          <span className="text-slate-500 text-sm mt-1">مرر الجهاز للاعب التالي</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ rotateY: flipped ? 180 : 0 }}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      style={{ perspective: 1000 }}
      className={cn('relative', sizeClasses[size], className)}
    >
      <motion.div
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={onClick}
      >
        {/* Front */}
        <div
          className={cn(
            'absolute inset-0',
            !flipped ? 'z-10' : 'hidden'
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardContent config={config} size={size} />
          {playerName && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm py-2 text-center">
              <span className="text-white font-bold text-sm">{playerName}</span>
            </div>
          )}
        </div>

        {/* Back */}
        <div
          className={cn(
            'absolute inset-0',
            flipped ? 'z-10' : 'hidden'
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <CardContent config={config} size={size} />
        </div>
      </motion.div>
    </motion.div>
  );
}
