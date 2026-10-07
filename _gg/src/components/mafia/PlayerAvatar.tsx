'use client';

import { cn } from '@/lib/utils';
import { ROLE_CONFIGS, RoleType } from '@/lib/game-types';

interface PlayerAvatarProps {
  name: string;
  isAlive: boolean;
  isSilenced?: boolean;
  role?: RoleType | null;
  isRevealed?: boolean;
  showRole?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-xs',
  md: 'w-14 h-14 text-base',
  lg: 'w-20 h-20 text-xl',
};

const iconSizeClasses = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-3xl',
};

export default function PlayerAvatar({
  name,
  isAlive,
  isSilenced = false,
  role,
  isRevealed = false,
  showRole = false,
  size = 'md',
  isSelected = false,
  onClick,
  disabled = false,
  className,
}: PlayerAvatarProps) {
  const initials = name.trim().charAt(0);
  const roleConfig = role ? ROLE_CONFIGS[role] : null;
  const isMafia = roleConfig?.team === 'mafia';

  const bgColor = !isAlive
    ? 'bg-gray-800/50 border-gray-700/30'
    : isSelected
    ? 'bg-yellow-900/60 border-yellow-500 ring-2 ring-yellow-500/50'
    : isMafia && (showRole || isRevealed)
    ? 'bg-red-950/80 border-red-500/50'
    : isSilenced
    ? 'bg-purple-950/60 border-purple-500/50'
    : 'bg-slate-800/80 border-slate-600/50';

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <button
        onClick={onClick}
        disabled={disabled || !isAlive}
        className={cn(
          'relative rounded-full border-2 flex items-center justify-center font-bold transition-all duration-200',
          sizeClasses[size],
          bgColor,
          !isAlive && 'opacity-40 grayscale',
          isAlive && onClick && !disabled && 'hover:scale-110 cursor-pointer active:scale-95',
          isSilenced && isAlive && 'animate-pulse',
          className
        )}
      >
        {showRole || isRevealed ? (
          <span className={iconSizeClasses[size]}>
            {roleConfig?.icon || initials}
          </span>
        ) : (
          <span
            className={cn(
              !isAlive ? 'text-gray-500' : 'text-slate-200'
            )}
          >
            {initials}
          </span>
        )}

        {/* Silence indicator */}
        {isSilenced && isAlive && (
          <div className="absolute -top-1 -left-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-[10px]">
            🤫
          </div>
        )}

        {/* Dead indicator */}
        {!isAlive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <span className="text-red-500 text-lg">✕</span>
          </div>
        )}
      </button>

      <span
        className={cn(
          'text-center text-xs leading-tight max-w-[4rem] truncate',
          !isAlive ? 'text-gray-600 line-through' : 'text-slate-300'
        )}
      >
        {name}
      </span>

      {/* Show role name if revealed */}
      {(showRole || isRevealed) && roleConfig && (
        <span
          className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            isMafia ? 'bg-red-900/80 text-red-200' : 'bg-blue-900/80 text-blue-200'
          )}
        >
          {roleConfig.nameAr}
        </span>
      )}
    </div>
  );
}
