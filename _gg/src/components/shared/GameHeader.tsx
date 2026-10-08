'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, User, Wrench, Zap } from 'lucide-react';
import { memo } from 'react';
import { formatCompact } from '@/lib/format';

// ─── Types ───────────────────────────────────────────────────────────

export interface GameHeaderProps {
  gameName: string;
  gameEmoji?: string;
  accentColor?: 'red' | 'orange' | 'amber' | 'purple' | 'violet' | 'teal' | 'rose' | 'emerald';
  phaseLabel?: string;
  phaseLabelVariant?: 'amber' | 'rose' | 'gold';
  showScoreBar?: boolean;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  team1Emoji?: string;
  team2Emoji?: string;
  questionNumber?: number;
  totalQuestions?: number;
  showFastMoneyBtn?: boolean;
  onFastMoney?: () => void;
  onExit?: () => void;
  onProfileToggle?: () => void;
  onUtilityToggle?: () => void;
  onStoreToggle?: () => void;
  subscriberName?: string;
  gemsBalance?: number;
}

// ─── Color mappings ──────────────────────────────────────────────────

const accentGradients: Record<string, string> = {
  red: 'from-red-500 to-rose-600',
  orange: 'from-orange-500 to-red-600',
  amber: 'from-amber-500 to-rose-600',
  purple: 'from-purple-500 to-violet-600',
  violet: 'from-violet-500 to-purple-600',
  teal: 'from-teal-500 to-cyan-600',
  rose: 'from-rose-500 to-pink-600',
  emerald: 'from-emerald-500 to-green-600',
};

const accentTexts: Record<string, string> = {
  red: 'from-red-400 via-rose-300 to-red-400',
  orange: 'from-orange-400 via-amber-300 to-orange-400',
  amber: 'from-amber-400 via-rose-300 to-amber-400',
  purple: 'from-purple-400 via-violet-300 to-purple-400',
  violet: 'from-violet-400 via-purple-300 to-violet-400',
  teal: 'from-teal-400 via-cyan-300 to-teal-400',
  rose: 'from-rose-400 via-pink-300 to-rose-400',
  emerald: 'from-emerald-400 via-green-300 to-emerald-400',
};

const accentShadows: Record<string, string> = {
  red: 'shadow-red-500/20',
  orange: 'shadow-orange-500/20',
  amber: 'shadow-amber-500/20',
  purple: 'shadow-purple-500/20',
  violet: 'shadow-violet-500/20',
  teal: 'shadow-teal-500/20',
  rose: 'shadow-rose-500/20',
  emerald: 'shadow-emerald-500/20',
};

// ─── Component ──────────────────────────────────────────────────────

function GameHeader({
  gameName,
  gameEmoji = '🎮',
  accentColor = 'amber',
  phaseLabel,
  phaseLabelVariant = 'amber',
  showScoreBar = false,
  team1Name = '',
  team2Name = '',
  team1Score = 0,
  team2Score = 0,
  team1Emoji = '👑',
  team2Emoji = '🏛️',
  questionNumber,
  totalQuestions,
  showFastMoneyBtn = false,
  onFastMoney,
  onExit,
  onProfileToggle,
  onUtilityToggle,
  onStoreToggle,
  subscriberName,
  gemsBalance = 0,
}: GameHeaderProps) {
  const gradient = accentGradients[accentColor] || accentGradients.amber;
  const textGradient = accentTexts[accentColor] || accentTexts.amber;
  const shadow = accentShadows[accentColor] || accentShadows.amber;

  const badgeStyles = {
    amber: 'border-amber-500/50 text-amber-400',
    rose: 'border-rose-500/50 text-rose-400 animate-pulse',
    gold: 'bg-gradient-to-l from-amber-600 to-yellow-600 text-white border-0',
  };

  return (
    <div data-gg-hide="header" className="sticky top-0 z-40 border-b border-slate-800/30 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-12 px-4">
        {/* Logo + Game Name */}
        <div className="flex items-center gap-2 min-w-0">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
              <img
                src="/platform-logo.png"
                alt="ألعاب الغريب"
                className="w-6 h-6 rounded-lg object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = "<span class='text-white text-xs font-black'>غ</span>";
                }}
              />
            </div>
          </a>
          <span className="text-sm font-black bg-gradient-to-l bg-clip-text text-transparent hidden sm:inline" style={{ backgroundImage: `linear-gradient(to left, var(--tw-gradient-stops))` }}>
            <span className={textGradient.replace('bg-gradient-to-l ', 'bg-gradient-to-l ').split(' ').join(' ')}>
              <style>{`.gh-${accentColor} { background: linear-gradient(to left, var(--tw-gradient-stops)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }`}</style>
              <span className={`gh-${accentColor} hidden sm:inline text-sm font-black`}>
                ألعاب الغريب
              </span>
            </span>
          </span>
          {phaseLabel && (
            <>
              <span className="text-slate-600 text-xs">›</span>
              <span className="text-xs font-bold text-slate-300 truncate">
                {gameEmoji} {gameName}
              </span>
            </>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Utility panel toggle */}
          {onUtilityToggle && (
            <Button
              onClick={onUtilityToggle}
              variant="ghost"
              className="text-slate-500 hover:text-amber-400 hover:bg-amber-950/30 h-8 w-8 p-0"
            >
              <Wrench className="w-4 h-4" />
            </Button>
          )}

          {/* Fast Money button */}
          {showFastMoneyBtn && onFastMoney && (
            <Button
              onClick={onFastMoney}
              variant="ghost"
              className="text-slate-500 hover:text-yellow-400 hover:bg-yellow-950/30 gap-1 text-[10px] h-8 px-2"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">المال السريع</span>
            </Button>
          )}

          {/* Phase badge */}
          {phaseLabel && (
            <Badge variant="outline" className={`${badgeStyles[phaseLabelVariant]} text-[10px] px-2`}>
              {phaseLabel}
            </Badge>
          )}

          {/* Profile button */}
          {onProfileToggle && (
            <Button
              onClick={onProfileToggle}
              variant="ghost"
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 gap-1.5 text-xs h-8 px-2"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline max-w-[80px] truncate">
                {subscriberName || 'الملف'}
              </span>
            </Button>
          )}

          {/* Gems pill + Store toggle */}
          {onStoreToggle && (
            <button
              onClick={onStoreToggle}
              className="flex items-center gap-1 bg-gradient-to-l from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 rounded-full px-2.5 py-1 text-[11px] font-black text-white shadow-lg shadow-amber-500/15 transition-all hover:shadow-amber-500/25"
            >
              <span>💎</span>
              <span className="tabular-nums">{formatCompact(gemsBalance)}</span>
            </button>
          )}

          {/* Exit button */}
          {onExit && (
            <Button
              onClick={onExit}
              variant="ghost"
              className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Button>
          )}
        </div>
      </div>

      {/* Score bar */}
      {showScoreBar && (
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1 border-t border-slate-800/30">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-amber-400">{team1Emoji} {team1Name}</span>
            <motion.span
              key={team1Score}
              initial={{ scale: 1.3, color: '#fbbf24' }}
              animate={{ scale: 1 }}
              className="text-xs font-black tabular-nums"
            >
              {team1Score}
            </motion.span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-slate-600 text-[10px] font-bold">VS</span>
            {questionNumber != null && totalQuestions != null && (
              <span className="text-[9px] font-bold text-slate-500">📋 السؤال {questionNumber} من {totalQuestions}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span
              key={team2Score}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-xs font-black tabular-nums"
            >
              {team2Score}
            </motion.span>
            <span className="text-xs font-black text-rose-400">{team2Name} {team2Emoji}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(GameHeader);
