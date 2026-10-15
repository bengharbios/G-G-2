'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Check,
  Hand,
  Send,
  Lightbulb,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  Shield,
  Zap,
  Eye,
  X,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useShifaratStore } from '@/lib/shifarat-store';
import type { BoardCard, TeamColor } from '@/lib/shifarat-types';
import {
  STROKE_STYLE,
  useInGameSetupMode,
  useYallaSoundState,
  useHostHeartbeat,
  useViewerCount,
  useShareLinks,
} from '@/lib/yalla-game-helpers';
import { generateClueSuggestions, type ClueSuggestion } from '@/lib/shifarat-clue-engine';
import {
  playCardFlipSound,
  playAssassinateSound,
  playSpymasterSound,
  playClickSound,
} from '@/lib/sounds';

// ============================================================
// SOUND SYSTEM — Web Audio API (preserved)
// ============================================================

function playSound(type: 'correct' | 'wrong' | 'assassin' | 'tick' | 'win') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'correct':
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        break;
      case 'wrong':
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;
      case 'assassin':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.setValueAtTime(80, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        break;
      case 'tick':
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
        break;
      case 'win':
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
        osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        break;
    }
  } catch {
    // audio not supported
  }
}

// ============================================================
// GUESS TOAST (preserved)
// ============================================================

interface GuessToastProps {
  result: 'correct' | 'wrong' | 'neutral' | 'assassin';
  word: string;
  remainingGuesses: number;
  onDismiss: () => void;
  errorMessage?: string;
}

function GuessToast({ result, word, remainingGuesses, onDismiss, errorMessage }: GuessToastProps) {
  useEffect(() => {
    const delay = errorMessage ? 4000 : result === 'correct' ? 1200 : result === 'assassin' ? 5000 : 2000;
    const timer = setTimeout(onDismiss, delay);
    return () => clearTimeout(timer);
  }, [result, onDismiss, errorMessage]);

  const toastConfig = errorMessage ? {
    emoji: '⚠️',
    title: 'خطأ تقني!',
    extra: errorMessage,
    bg: 'bg-amber-700/95',
    border: 'border-amber-400',
    shadow: 'shadow-lg shadow-amber-500/30',
  } : {
    correct: {
      emoji: '✅',
      title: 'صحيح!',
      extra: remainingGuesses > 0
        ? `${remainingGuesses} تخمين${remainingGuesses === 1 ? '' : 'ات'} متبقي${remainingGuesses === 1 ? '' : 'ة'}`
        : 'تم استنفاد التخمينات!',
      bg: 'bg-emerald-600/95',
      border: 'border-emerald-400',
      shadow: 'shadow-lg shadow-emerald-500/30',
    },
    wrong: {
      emoji: '❌',
      title: 'خطأ!',
      extra: 'الكلمة لا تخص فريقك — تم تحويل الدور',
      bg: 'bg-red-700/95',
      border: 'border-red-400',
      shadow: 'shadow-lg shadow-red-500/30',
    },
    neutral: {
      emoji: '❌',
      title: 'خطأ!',
      extra: 'الكلمة لا تخص فريقك — تم تحويل الدور',
      bg: 'bg-red-700/95',
      border: 'border-red-400',
      shadow: 'shadow-lg shadow-red-500/30',
    },
    assassin: {
      emoji: '💀',
      title: 'القاتل!',
      extra: 'خسارة فورية!',
      bg: 'bg-gray-900/95',
      border: 'border-red-500',
      shadow: 'shadow-lg shadow-red-900/50',
    },
  }[result]!;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`fixed top-4 left-4 right-4 z-50 flex flex-col gap-1 px-4 py-3 rounded-xl border ${toastConfig.bg} ${toastConfig.border} ${toastConfig.shadow} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{toastConfig.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white">{toastConfig.title}</span>
            {!errorMessage && <span className="text-xs font-bold text-white/80 truncate">— {word}</span>}
          </div>
          <p className="text-[10px] text-white/70 mt-0.5">{toastConfig.extra}</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// CARD GRID (preserved)
// ============================================================

interface CardGridProps {
  board: BoardCard[];
  showColors: boolean;
  onCardClick?: (cardId: number) => void;
  disabled?: boolean;
}

function CardGrid({ board, showColors, onCardClick, disabled }: CardGridProps) {
  const getCardStyle = (card: BoardCard, canClick: boolean) => {
    if (card.isRevealed) {
      switch (card.color) {
        case 'red': return 'bg-red-600 border-red-400 shadow-md shadow-red-500/30';
        case 'blue': return 'bg-blue-600 border-blue-400 shadow-md shadow-blue-500/30';
        case 'neutral': return 'bg-slate-500/70 border-slate-400 shadow-md shadow-slate-500/20';
        case 'assassin': return 'bg-gray-900 border-red-500/60 shadow-md shadow-red-900/30';
      }
    }
    if (card.guessedBy && !card.isRevealed) {
      if (showColors) {
        switch (card.color) {
          case 'red': return 'bg-red-500/40 border-red-400/50 opacity-50';
          case 'blue': return 'bg-blue-500/40 border-blue-400/50 opacity-50';
          case 'neutral': return 'bg-slate-600/30 border-slate-500/40 opacity-50';
          case 'assassin': return 'bg-gray-900 border-gray-400/50 opacity-50';
        }
      }
      return 'bg-slate-800/60 border-slate-600/50 opacity-50';
    }
    if (showColors) {
      switch (card.color) {
        case 'red': return 'bg-red-500/80 border-red-400';
        case 'blue': return 'bg-blue-500/80 border-blue-400';
        case 'neutral': return 'bg-slate-600/50 border-slate-500';
        case 'assassin': return 'bg-gray-900 border-gray-400';
      }
    }
    if (canClick) {
      return 'bg-slate-800 border-amber-500/40 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 hover:border-amber-400 hover:bg-slate-700';
    }
    return 'bg-slate-800 border-slate-600';
  };

  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-2">
      {board.map((card, index) => {
        const canClick = !!(onCardClick && !disabled && !card.isRevealed && !card.guessedBy);
        return (
        <motion.button
          key={card.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={card.isRevealed ? { opacity: 0.85, scale: 1 } : (card.guessedBy && !card.isRevealed) ? { opacity: 0.5, scale: 0.95 } : canClick ? {
            opacity: 1, scale: 1,
            boxShadow: [
              '0 0 0px rgba(245, 158, 11, 0)',
              '0 0 8px rgba(245, 158, 11, 0.15)',
              '0 0 0px rgba(245, 158, 11, 0)',
            ],
          } : { opacity: 1, scale: 1 }}
          transition={canClick ?
            { delay: index * 0.03, duration: 0.3,
              boxShadow: { repeat: Infinity, duration: 2, delay: index * 0.1 },
            } : { delay: index * 0.03, duration: 0.3 }}
          whileHover={canClick ? { scale: 1.08, y: -3 } : {}}
          whileTap={canClick ? { scale: 0.9 } : {}}
          onClick={() => {
            if (canClick) onCardClick!(card.id);
          }}
          disabled={!!disabled || card.isRevealed || !!card.guessedBy}
          className={`
            relative aspect-square rounded-md sm:rounded-lg border-2
            flex flex-col items-center justify-center p-1
            transition-all duration-200 select-none min-h-[48px] sm:min-h-[52px]
            ${getCardStyle(card, canClick)}
            ${canClick ? 'cursor-pointer active:scale-90' : ''}
          `}
        >
          {card.isRevealed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="absolute top-0.5 right-0.5 z-10"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow-lg" />
            </motion.div>
          )}

          {card.isRevealed && card.color === 'assassin' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className="absolute bottom-0.5 left-0.5 text-[10px] sm:text-xs"
            >
              💀
            </motion.span>
          )}

          {showColors && !card.isRevealed && card.color === 'assassin' && (
            <span className="absolute top-0 left-0 text-[8px] sm:text-[10px]">💀</span>
          )}

          {card.guessedBy && !card.isRevealed && (
            <span className="absolute top-0.5 right-0.5 z-10 text-slate-500 text-[10px] sm:text-xs font-bold">✕</span>
          )}

          <span
            className={`
              text-[9px] sm:text-xs md:text-sm font-bold text-center
              leading-tight break-words line-clamp-2
              ${card.isRevealed ? 'text-white' : showColors ? 'text-white' : 'text-slate-100'}
              ${card.guessedBy && !card.isRevealed ? 'line-through opacity-60' : ''}
            `}
          >
            {card.word}
          </span>
        </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================
// TIMER BAR (preserved)
// ============================================================

function TimerBar({ remaining, duration }: { remaining: number; duration: number }) {
  const percent = duration > 0 ? (remaining / duration) * 100 : 0;
  const getTimerColor = () => {
    if (percent > 60) return { bar: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', text: '#6ee7b7' };
    if (percent > 30) return { bar: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' };
    return { bar: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' };
  };
  const colors = getTimerColor();
  if (duration <= 0) return null;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" style={{ color: colors.text }} />
          <span className="text-[10px] font-bold" style={{ color: colors.text }}>
            {remaining}ث
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: colors.bg }}>
        <motion.div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ background: colors.bar }}
          animate={{ width: `${Math.max(percent, 0)}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// CLUE DISPLAY (preserved)
// ============================================================

function ClueDisplay() {
  const { currentClue, currentTeam, redTeam, blueTeam } = useShifaratStore();
  if (!currentClue) return null;

  const teamName = currentTeam === 'red' ? redTeam.name : blueTeam.name;
  const teamColor = currentTeam === 'red' ? 'text-red-400' : 'text-blue-400';
  const teamBorder = currentTeam === 'red' ? 'border-red-500/40' : 'border-blue-500/40';
  const teamBg = currentTeam === 'red' ? 'bg-red-950/30' : 'bg-blue-950/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-2 p-2 sm:p-3 rounded-xl border ${teamBg} ${teamBorder} text-center`}
    >
      <p className={`text-[10px] font-bold ${teamColor} mb-1`}>
        فريق {teamName}
      </p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-2xl font-black text-white">{currentClue.word}</span>
        <span className="text-xl sm:text-2xl font-black text-slate-500">—</span>
        <span className="text-lg sm:text-2xl font-black text-amber-400">{currentClue.number}</span>
      </div>
    </motion.div>
  );
}

// ============================================================
// SPYMASTER VIEW (preserved)
// ============================================================

function SpymasterView() {
  const { board, giveClue, currentTeam, gameMode, redTeam, blueTeam, currentClue } = useShifaratStore();
  const [clueWord, setClueWord] = useState('');
  const [clueNumber, setClueNumber] = useState(1);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const clueGiven = !!currentClue;
  const teamName = currentTeam === 'red' ? redTeam.name : blueTeam.name;
  const teamColor = currentTeam === 'red' ? 'text-red-400' : 'text-blue-400';

  const suggestions = useMemo(() => {
    return generateClueSuggestions(board, currentTeam, 10);
  }, [board, currentTeam]);

  const multiWordSuggestions = suggestions.filter((s) => s.connectedWords.length >= 2);
  const singleWordSuggestions = suggestions.filter((s) => s.connectedWords.length === 1);

  const handleGiveClue = useCallback(() => {
    if (!clueWord.trim()) {
      setError('أدخل كلمة الدليل');
      return;
    }
    const err = giveClue(clueWord.trim(), clueNumber);
    if (err) {
      setError(err);
    } else {
      // Spymaster clue sound — a soft chime to announce the clue has been given.
      playSpymasterSound();
      setClueWord('');
      setClueNumber(1);
      setError('');
    }
  }, [clueWord, clueNumber, giveClue]);

  const handleSuggestionClick = useCallback((suggestion: ClueSuggestion) => {
    setClueWord(suggestion.word);
    setClueNumber(suggestion.suggestedNumber);
    setError('');
    setShowSuggestions(true);
  }, []);

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'safe': return <Shield className="w-3 h-3 text-emerald-400" />;
      case 'moderate': return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      default: return <Zap className="w-3 h-3 text-red-400" />;
    }
  };

  const getRiskBg = (risk: string, isSelected: boolean) => {
    if (isSelected) return 'bg-amber-500/20 border-amber-500/50';
    switch (risk) {
      case 'safe': return 'bg-emerald-950/20 border-emerald-500/20 hover:bg-emerald-950/40';
      case 'moderate': return 'bg-amber-950/20 border-amber-500/20 hover:bg-amber-950/40';
      default: return 'bg-red-950/20 border-red-500/20 hover:bg-red-950/40';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 min-h-0"
    >
      <div className="text-center mb-2">
        <Badge className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 border-purple-500/30 mb-1">
          👁️ رؤية الجاسوس
        </Badge>
        <p className={`text-[11px] font-bold ${teamColor}`}>
          {teamName} — أعطِ دليلك
        </p>
      </div>

      {/* 5x5 Grid with colors */}
      <div className="mb-2 flex-1 min-h-0 overflow-y-auto">
        <CardGrid board={board} showColors={true} />
      </div>

      {/* Clue confirmation (shown after giving clue) */}
      <AnimatePresence>
        {clueGiven && currentClue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2 p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Check className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            </motion.div>
            <p className="text-[10px] text-amber-300 mb-1">تم! الدليل:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-base font-black text-white">{currentClue.word}</span>
              <span className="text-base font-black text-slate-500">—</span>
              <span className="text-base font-black text-amber-400">{currentClue.number}</span>
            </div>
            {gameMode === 'godfather' && (
              <p className="text-[9px] text-slate-400 mt-1">مرر الجهاز للفريق</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clue Suggestions Panel */}
      {suggestions.length > 0 && !clueGiven && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-2 rounded-xl bg-slate-900/60 border border-purple-500/20 overflow-hidden"
        >
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full flex items-center justify-between p-2 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-bold text-purple-300">
                إيحاءات ذكية ({suggestions.length})
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden max-h-32 overflow-y-auto"
              >
                <div className="px-2 pb-2">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-300">
                      أفضل الإيحاءات
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {multiWordSuggestions.slice(0, 6).map((suggestion, i) => (
                      <motion.button
                        key={suggestion.word}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg border-2 transition-all ${getRiskBg(suggestion.risk, clueWord === suggestion.word)}`}
                      >
                        {getRiskIcon(suggestion.risk)}
                        <span className="text-[11px] font-bold text-white">{suggestion.word}</span>
                        <span className="text-[9px] font-black text-amber-400">{suggestion.suggestedNumber}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Clue Input Form (hidden after clue given) */}
      {!clueGiven && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/50"
        >
          <div className="flex gap-2 mb-2">
            <Input
              value={clueWord}
              onChange={(e) => {
                setClueWord(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleGiveClue()}
              placeholder="كلمة الدليل..."
              className="flex-1 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 text-center h-9 text-sm"
              dir="rtl"
              maxLength={20}
            />
          </div>

          <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
            <span className="text-[9px] text-slate-400 ml-1">عدد:</span>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.9 }}
                onClick={() => setClueNumber(num)}
                className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center ${
                  clueNumber === num
                    ? 'bg-amber-500/30 border-2 border-amber-500/60 text-amber-300'
                    : 'bg-slate-800/60 border-2 border-slate-700/40 text-slate-400 hover:bg-slate-700/60'
                }`}
              >
                {num}
              </motion.button>
            ))}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-[10px] text-center mb-1"
            >
              ⚠️ {error}
            </motion.p>
          )}

          <Button
            onClick={handleGiveClue}
            disabled={!clueWord.trim()}
            className="w-full font-bold text-sm py-3 text-white"
            style={{
              background: !clueWord.trim()
                ? 'rgba(30, 41, 59, 0.5)'
                : 'linear-gradient(to left, #f59e0b, #d97706)',
              borderRadius: '0.5rem',
              boxShadow: clueWord.trim() ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none',
            }}
          >
            <Send className="w-3.5 h-3.5 ml-1.5" />
            إعطاء الدليل
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================
// TRANSITION VIEW (preserved)
// ============================================================

function TransitionView({ onReady }: { onReady: () => void }) {
  const { currentClue, currentTeam, redTeam, blueTeam } = useShifaratStore();
  const teamName = currentTeam === 'red' ? redTeam.name : blueTeam.name;
  const teamColor = currentTeam === 'red' ? 'text-red-400' : 'text-blue-400';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center flex-1 p-4"
    >
      <div className="text-4xl mb-3">📱</div>

      <h2 style={{
        ...STROKE_STYLE,
        fontSize: '18px', fontWeight: 900,
        marginBottom: '4px',
      }}>
        مرر الجهاز إلى الفريق
      </h2>
      <p className={`text-sm font-bold ${teamColor} mb-4`}>
        {teamName}
      </p>

      {currentClue && (
        <div className="mb-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50 text-center">
          <p className="text-[10px] text-slate-400 mb-1">الدليل</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl font-black text-white">{currentClue.word}</span>
            <span className="text-xl font-black text-slate-500">—</span>
            <span className="text-xl font-black text-amber-400">{currentClue.number}</span>
          </div>
        </div>
      )}

      <Button
        onClick={onReady}
        className="font-bold text-sm py-3 px-6 text-white"
        style={{
          background: 'linear-gradient(to left, #f59e0b, #d97706)',
          borderRadius: '0.5rem',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
        }}
      >
        جاهز للتخمين
      </Button>
    </motion.div>
  );
}

// ============================================================
// TEAM GUESSING VIEW (preserved)
// ============================================================

function TeamGuessingView() {
  const {
    board,
    selectCard,
    currentClue,
    currentTeam,
    guessesThisTurn,
    guessesAllowed,
    passTurn,
    timerRemaining,
    timerDuration,
    redTeam,
    blueTeam,
    phase,
  } = useShifaratStore();

  const remainingGuesses = guessesAllowed - guessesThisTurn;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const [toast, setToast] = useState<{
    result: 'correct' | 'wrong' | 'neutral' | 'assassin';
    word: string;
    remaining: number;
    errorMessage?: string;
  } | null>(null);

  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const dismissToast = useCallback(() => {
    setToast(null);
    isProcessingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const store = useShifaratStore.getState();
    if (store.isTimerActive && store.timerRemaining > 0) {
      intervalRef.current = setInterval(() => {
        const currentState = useShifaratStore.getState();
        currentState.tickTimer();
        if (currentState.timerRemaining <= 10 && currentState.timerRemaining > 0) {
          playSound('tick');
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'clue_given' && phase !== 'team_guessing') {
      isProcessingRef.current = false;
    }
  }, [phase]);

  const handleCardClick = useCallback((cardId: number) => {
    if (isProcessingRef.current) return;
    if (toastRef.current) return;

    const currentState = useShifaratStore.getState();

    if (currentState.phase !== 'clue_given' && currentState.phase !== 'team_guessing') {
      return;
    }

    const card = currentState.board.find((c) => c.id === cardId);
    if (!card || card.isRevealed || card.guessedBy) {
      return;
    }

    if (currentState.guessesThisTurn >= currentState.guessesAllowed) {
      return;
    }

    isProcessingRef.current = true;

    // Card flip sound for the word-card tap (in addition to the existing
    // result-specific sounds below).
    playCardFlipSound();

    try {
      const guessResponse = currentState.selectCard(cardId);
      const { result, gameEnded, error } = guessResponse;

      if (result === 'correct') {
        playSound('correct');
      } else if (result === 'wrong' || result === 'neutral') {
        playSound('wrong');
      } else if (result === 'assassin') {
        playSound('assassin');
        playAssassinateSound();
      }
      if (gameEnded) {
        setTimeout(() => playSound('win'), 500);
      }

      const afterState = useShifaratStore.getState();
      const newRemaining = Math.max(0, afterState.guessesAllowed - afterState.guessesThisTurn);

      setToast({
        result,
        word: card.word,
        remaining: newRemaining,
        errorMessage: error,
      });
    } catch (err) {
      console.error('[TeamGuessingView] Error in handleCardClick:', err);
      isProcessingRef.current = false;
    }
  }, []);

  const handlePass = useCallback(() => {
    playClickSound();
    passTurn();
  }, [passTurn]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 min-h-0"
    >
      {/* Clue Display */}
      <ClueDisplay />

      {/* Timer */}
      <TimerBar remaining={timerRemaining} duration={timerDuration} />

      {/* Remaining guesses */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">التخمينات:</span>
          <div className="flex gap-1">
            {Array.from({ length: guessesAllowed }, (_, i) => (
              <motion.div
                key={i}
                animate={i < remainingGuesses ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: i === remainingGuesses - 1 ? Infinity : 0, duration: 1 }}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all"
                style={{
                  background: i < remainingGuesses
                    ? (currentTeam === 'red' ? '#ef4444' : '#3b82f6')
                    : 'rgba(51, 65, 85, 0.3)',
                  boxShadow: i < remainingGuesses
                    ? `0 0 6px ${currentTeam === 'red' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`
                    : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <Badge className="text-[10px] px-2 bg-slate-800/60 text-slate-400 border-slate-700/40">
          {guessesThisTurn}/{guessesAllowed}
        </Badge>
      </div>

      {/* 5x5 Grid */}
      <div className="mb-2 flex-1 min-h-0 overflow-y-auto">
        <CardGrid
          board={board}
          showColors={false}
          onCardClick={handleCardClick}
          disabled={!!toast}
        />
      </div>

      {/* Pass button */}
      <motion.div>
        <Button
          onClick={handlePass}
          disabled={!!toast}
          variant="ghost"
          size="sm"
          className="w-full font-medium text-[11px] py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 disabled:opacity-40"
        >
          <Hand className="w-3 h-3 ml-1.5" />
          تنازل عن الدور
        </Button>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <GuessToast
            result={toast.result}
            word={toast.word}
            remainingGuesses={toast.remaining}
            onDismiss={dismissToast}
            errorMessage={toast.errorMessage}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// TURN RESULT VIEW (preserved)
// ============================================================

function TurnResultView({ onNext }: { onNext: () => void }) {
  const { board, lastGuessResult } = useShifaratStore();

  const lastRevealed = [...board].reverse().find((c) => c.isRevealed);

  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (lastGuessResult === 'wrong' || lastGuessResult === 'neutral') {
      autoAdvanceRef.current = setTimeout(() => {
        onNext();
      }, 2000);
    }
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [lastGuessResult, onNext]);

  const isWrongGuess = lastGuessResult === 'wrong' || lastGuessResult === 'neutral';

  const getResultDisplay = () => {
    switch (lastGuessResult) {
      case 'correct':
        return {
          emoji: '✅',
          title: 'تم استنفاد التخمينات!',
          subtitle: `${lastRevealed ? lastRevealed.word : ''} — الدور ينتهي`,
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/30',
          border: 'border-emerald-500/30',
        };
      case 'wrong':
      case 'neutral':
        return {
          emoji: '❌',
          title: 'خطأ!',
          subtitle: 'الكلمة لا تخص فريقك — تم تحويل الدور',
          color: 'text-red-400',
          bg: 'bg-red-950/30',
          border: 'border-red-500/30',
        };
      default:
        return {
          emoji: '❓',
          title: 'نتيجة',
          subtitle: '',
          color: 'text-slate-400',
          bg: 'bg-slate-900/30',
          border: 'border-slate-700/30',
        };
    }
  };

  const result = getResultDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center flex-1 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1, duration: 0.4 }}
        className={`w-full max-w-sm p-4 rounded-2xl border text-center mb-4 ${result.bg} ${result.border}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="text-4xl mb-2"
        >
          {result.emoji}
        </motion.div>

        <h2 className={`text-lg font-black ${result.color} mb-1`}>
          {result.title}
        </h2>
        {result.subtitle && (
          <p className="text-xs text-slate-400 mb-2">{result.subtitle}</p>
        )}

        {lastGuessResult === 'correct' && lastRevealed && (
          <div className="mt-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
            <p className="text-sm font-bold text-white">{lastRevealed.word}</p>
          </div>
        )}

        {isWrongGuess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-3"
          >
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] text-slate-500">جاري التحويل...</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {!isWrongGuess && (
        <Button
          onClick={onNext}
          className="font-bold text-sm py-3 px-6 text-white"
          style={{
            background: 'linear-gradient(to left, #f59e0b, #d97706)',
            borderRadius: '0.5rem',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
          }}
        >
          التالي
        </Button>
      )}
    </motion.div>
  );
}

// ============================================================
// TURN SWITCH VIEW (preserved)
// ============================================================

function TurnSwitchView({ onContinue }: { onContinue: () => void }) {
  const { currentTeam, redTeam, blueTeam, gameMode } = useShifaratStore();

  const nextTeam: TeamColor = currentTeam === 'red' ? 'blue' : 'red';
  const teamName = nextTeam === 'red' ? redTeam.name : blueTeam.name;
  const teamColor = nextTeam === 'red' ? 'text-red-400' : 'text-blue-400';
  const teamBg = nextTeam === 'red' ? 'bg-red-950/30' : 'bg-blue-950/30';
  const teamBorder = nextTeam === 'red' ? 'border-red-500/40' : 'border-blue-500/40';
  const teamEmoji = nextTeam === 'red' ? '🔴' : '🔵';
  const teamGlow = nextTeam === 'red' ? 'shadow-lg shadow-red-500/10' : 'shadow-lg shadow-blue-500/10';
  const isGodfather = gameMode === 'godfather';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center flex-1 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
        className={`w-full max-w-sm p-5 rounded-2xl border text-center mb-4 ${teamBg} ${teamBorder} ${teamGlow}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
          className="text-5xl mb-3"
        >
          {teamEmoji}
        </motion.div>

        <p className="text-xs text-slate-400 mb-1">الدور الآن لـ</p>
        <h2 className={`text-xl font-black ${teamColor} mb-1`}>
          {teamName}
        </h2>

        <p className={`text-xs font-bold ${teamColor} mt-2`}>
          👁️ جاسوس {teamName}: أعد دليلك
        </p>

        {isGodfather && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] text-slate-500 mt-3 mb-1"
          >
            مرر الجهاز إلى جاسوس الفريق
          </motion.p>
        )}
      </motion.div>

      <Button
        onClick={onContinue}
        className="font-bold text-sm py-3 px-6 text-white"
        style={{
          background: 'linear-gradient(to left, #f59e0b, #d97706)',
          borderRadius: '0.5rem',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
        }}
      >
        متابعة
      </Button>
    </motion.div>
  );
}

// ============================================================
// MAIN PLAYING PHASE — Yalla Ludo Shell + preserved views
// ============================================================

export default function PlayingPhase() {
  const {
    phase,
    viewMode,
    gameMode,
    confirmTurnSwitch,
    setViewMode,
    currentTeam,
    redTeam,
    blueTeam,
    roundNumber,
    board,
    guessesAllowed,
    guessesThisTurn,
    clues,
    gameLog,
    currentClue,
    resetGame,
    roomCode,
    lastGuessResult,
  } = useShifaratStore();

  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();
  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;
  useHostHeartbeat('shifarat', gameMode ?? undefined, roomCode);
  const { viewerCount, viewers } = useViewerCount('shifarat', isDiwaniyaHost, roomCode);
  const { shareLink, directLink, shareCopied, copyShareLink, shareExternally } = useShareLinks('shifarat', isDiwaniyaHost, roomCode);

  const [showLog, setShowLog] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showShareBox, setShowShareBox] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Safety guard
  const isInvalidState = !board || board.length === 0;

  useEffect(() => {
    if (isInvalidState && phase !== 'setup') {
      resetGame();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTransitionReady = useCallback(() => {
    setViewMode('team');
  }, [setViewMode]);

  const handleTurnResultNext = useCallback(() => {
    confirmTurnSwitch();
  }, [confirmTurnSwitch]);

  const handleTurnSwitchContinue = useCallback(() => {
    confirmTurnSwitch();
  }, [confirmTurnSwitch]);

  // Determine the active team for panel highlight + notice
  const activeTeam = currentTeam;
  const redTotal = (redTeam.wordsRemaining + redTeam.score) || 9;
  const blueTotal = (blueTeam.wordsRemaining + blueTeam.score) || 8;

  // Notice text per phase
  const getNoticeText = () => {
    if (phase === 'spymaster_view') {
      const teamName = activeTeam === 'red' ? redTeam.name : blueTeam.name;
      return `👁️ جاسوس ${teamName} — أعطِ دليلك`;
    }
    if (phase === 'clue_given' || phase === 'team_guessing') {
      const teamName = activeTeam === 'red' ? redTeam.name : blueTeam.name;
      const remaining = guessesAllowed - guessesThisTurn;
      return `🎯 ${teamName} — خمن الكلمات (${remaining} متبقي)`;
    }
    if (phase === 'turn_result') {
      if (lastGuessResult === 'correct') return '✅ تم استنفاد التخمينات';
      if (lastGuessResult === 'wrong' || lastGuessResult === 'neutral') return '❌ خطأ — تحويل الدور';
      if (lastGuessResult === 'assassin') return '💀 القاتل!';
      return '📋 نتيجة التخمين';
    }
    if (phase === 'turn_switch') {
      const nextTeam: TeamColor = activeTeam === 'red' ? 'blue' : 'red';
      const nextTeamName = nextTeam === 'red' ? redTeam.name : blueTeam.name;
      return `🔄 الدور لـ ${nextTeamName}`;
    }
    return '';
  };
  const noticeText = getNoticeText();
  const noticeClass = activeTeam === 'red' ? 'team-red' : 'team-blue';

  if (isInvalidState) {
    return (
      <div className="flex flex-col min-h-screen py-2 px-3" dir="rtl">
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6"
          >
            <div className="text-4xl mb-3">⚠️</div>
            <h2 style={{ ...STROKE_STYLE, fontSize: '18px', fontWeight: 900 }} className="mb-2">
              حالة اللعبة غير صالحة
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              سيتم إعادة التعيين تلقائيًا...
            </p>
            <Button
              onClick={resetGame}
              className="font-bold text-sm"
              style={{
                background: 'linear-gradient(to left, #f59e0b, #d97706)',
                borderRadius: '0.5rem',
              }}
            >
              <RotateCcw className="w-4 h-4 ml-2" />
              إعادة تعيين
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (phase === 'game_over') return null;

    if (phase === 'spymaster_view') {
      if (viewMode === 'spymaster') {
        return <SpymasterView key="spymaster-view" />;
      }
      if (gameMode === 'godfather') {
        return (
          <TransitionView key="transition-to-spymaster" onReady={() => setViewMode('spymaster')} />
        );
      }
      return <SpymasterView key="spymaster-view" />;
    }

    if (phase === 'clue_given' || phase === 'team_guessing') {
      if (viewMode === 'transition') {
        return <TransitionView key={`transition-${phase}`} onReady={handleTransitionReady} />;
      }
      return <TeamGuessingView key="team-guessing" />;
    }

    if (phase === 'turn_result') {
      return <TurnResultView key="turn-result" onNext={handleTurnResultNext} />;
    }

    if (phase === 'turn_switch') {
      return <TurnSwitchView key="turn-switch" onContinue={handleTurnSwitchContinue} />;
    }

    return null;
  };

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 12px 100px',
        gap: '6px',
        overflowY: 'auto',
      }}
    >
      {/* ═══ Header: sound + log + quit (+ diwaniya eye + share) ═══ */}
      <div className="tobol-header-actions">
        <button
          type="button"
          className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
          onClick={toggleMusic}
          aria-label="sound"
          title="الصوت"
        >
          <img
            src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'}
            alt="sound"
          />
        </button>
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowLog(true)}
          aria-label="battle log"
          title="سجل المعركة"
        >
          <img src="/battle/icon_chat.webp" alt="log" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
        </button>
        {isDiwaniyaHost && (
          <button
            type="button"
            className="tobol-eye-btn"
            onClick={() => setShowViewers(true)}
            aria-label="viewers"
            title="المشاهدون"
            style={{ position: 'relative' }}
          >
            <img src="/battle/icon_eye.webp" alt="viewers" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <span className="tobol-eye-count">{viewerCount}</span>
          </button>
        )}
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowExitDialog(true)}
          aria-label="خروج"
          title="خروج"
        >
          <img src="/battle/btn_exit.webp" alt="exit" />
        </button>
      </div>

      {/* ═══ Title + round ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/shifarat.png"
            alt="الشيفرات"
            style={{ width: '38px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))' }}
          />
        </div>
        <h1 style={{ ...STROKE_STYLE, fontSize: '16px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: 0 }}>
          الشيفرات
        </h1>
        <span style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 700 }}>جولة {roundNumber}</span>
      </motion.div>

      {/* ═══ Team panels + VS ═══ */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px', width: '100%' }}>
        <div className={`tobol-team-panel-compact team-red ${activeTeam === 'red' ? 'active-turn' : ''}`}>
          <div className="tobol-team-name-display" style={{ fontSize: '11px' }}>{redTeam.name}</div>
          <div className="tobol-team-divider-compact" />
          <div className="tobol-team-score-compact" style={{ fontSize: '20px' }}>
            {redTeam.score}
            <span style={{ fontSize: '10px', color: '#9fc4b4', marginRight: '2px' }}>/{redTotal}</span>
          </div>
        </div>

        <div className="tobol-vs-badge" style={{ width: '32px', height: '32px', alignSelf: 'center' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div className={`tobol-team-panel-compact team-blue ${activeTeam === 'blue' ? 'active-turn' : ''}`}>
          <div className="tobol-team-name-display" style={{ fontSize: '11px' }}>{blueTeam.name}</div>
          <div className="tobol-team-divider-compact" />
          <div className="tobol-team-score-compact" style={{ fontSize: '20px' }}>
            {blueTeam.score}
            <span style={{ fontSize: '10px', color: '#9fc4b4', marginRight: '2px' }}>/{blueTotal}</span>
          </div>
        </div>
      </div>

      {/* ═══ Notification pill ═══ */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${phase}-${activeTeam}-${lastGuessResult ?? ''}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.25 }}
            className={`tobol-board-notice-v3 ${noticeClass}`}
          >
            <span className="tobol-notice-dot" />
            <span className="tobol-notice-text">{noticeText}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ Clue Display (during clue_given/team_guessing) ═══ */}
      {(phase === 'clue_given' || phase === 'team_guessing') && currentClue && (
        <ClueDisplay />
      )}

      {/* ═══ GAME PLAY AREA ═══ */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      {/* ═══ Diwaniya share box ═══ */}
      {isDiwaniyaHost && (
        <AnimatePresence>
          {showShareBox && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="tobol-share-box"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tobol-share-code-value">{roomCode}</div>
              <input
                type="text"
                readOnly
                value={shareLink}
                className="tobol-share-link-input"
                dir="ltr"
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button onClick={copyShareLink} className="tobol-share-btn" style={{ flex: 1 }}>
                  <img src="/battle/iv_team_share.webp" alt="" style={{ width: '16px', height: '16px' }} />
                  {shareCopied ? 'تم النسخ!' : 'نسخ'}
                </button>
                <button onClick={shareExternally} className="tobol-share-direct-btn" style={{ flex: 1 }}>
                  <img src="/battle/iv_team_share.webp" alt="" style={{ width: '16px', height: '16px' }} />
                  مشاركة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ═══ Bottom row: log button + diwaniya share trigger ═══ */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
        <button
          type="button"
          className="tobol-log-btn"
          onClick={() => setShowLog(true)}
        >
          <span>📜</span>
          <span>السجل</span>
          <span className="log-count">{gameLog.length}</span>
        </button>
        {isDiwaniyaHost && (
          <button
            type="button"
            className="tobol-log-btn"
            onClick={() => setShowShareBox(!showShareBox)}
          >
            <img src="/battle/iv_team_share.webp" alt="" style={{ width: '16px', height: '16px' }} />
            <span>مشاركة</span>
          </button>
        )}
      </div>

      {/* ═══ Battle log modal ═══ */}
      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLog(false)}
            className="tobol-log-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-log-modal"
            >
              <div className="tobol-log-modal-header">
                <div className="tobol-log-modal-title">📜 سجل المعركة</div>
                <button
                  onClick={() => setShowLog(false)}
                  style={{ background: 'none', border: 'none', color: '#9fc4b4', fontSize: '20px', cursor: 'pointer' }}
                >×</button>
              </div>
              <div className="tobol-log-modal-body">
                {gameLog.length === 0 ? (
                  <div className="tobol-chat-empty">لا توجد أحداث بعد</div>
                ) : (
                  [...gameLog].reverse().map((entry, i) => (
                    <div
                      key={i}
                      className={`tobol-log-entry ${entry.team ? `team-${entry.team}` : ''}`}
                    >
                      <span className="entry-num">{gameLog.length - i}</span>
                      <span className="entry-msg">{entry.message}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Viewers modal ═══ */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowViewers(false)}
            className="tobol-viewers-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-viewers-modal"
            >
              <div className="tobol-log-modal-header">
                <div className="tobol-log-modal-title">👥 المشاهدون ({viewerCount})</div>
                <button
                  onClick={() => setShowViewers(false)}
                  style={{ background: 'none', border: 'none', color: '#9fc4b4', fontSize: '20px', cursor: 'pointer' }}
                >×</button>
              </div>
              <div className="tobol-log-modal-body">
                {viewers.length === 0 ? (
                  <div className="tobol-chat-empty">لا يوجد مشاهدون بعد</div>
                ) : (
                  viewers.map((v) => (
                    <div key={v.id} className="tobol-viewer-row">
                      <span style={{ fontSize: '14px' }}>👤</span>
                      <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 700 }}>{v.name}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Exit dialog ═══ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.72)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #0e2a22, #061812)',
                border: '1.5px solid rgba(254,239,145,.25)',
                borderRadius: '18px',
                padding: '20px',
                width: '100%',
                maxWidth: '300px',
                textAlign: 'center',
                boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                الخروج من المعركة؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء الجلسة وعدم حفظ أي تقدم. هل أنت متأكد؟
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowExitDialog(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)',
                    background: 'rgba(80,80,80,.3)', color: '#cbd5e1',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  }}
                >إلغاء</button>
                <button
                  onClick={() => { resetGame(); window.location.href = '/'; }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,.35)',
                  }}
                >نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
