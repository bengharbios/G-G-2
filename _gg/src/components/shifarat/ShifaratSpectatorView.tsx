'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BoardCard, TeamColor, GamePhase, Clue } from '@/lib/shifarat-types';

interface SpectatorState {
  board: BoardCard[];
  redTeam: { name: string; score: number; wordsRemaining: number };
  blueTeam: { name: string; score: number; wordsRemaining: number };
  currentTeam: TeamColor;
  phase: GamePhase;
  currentClue: Clue | null;
  guessesThisTurn: number;
  guessesAllowed: number;
  lastGuessResult: string | null;
  timerRemaining: number;
  roundNumber: number;
  clues: Clue[];
  gameLog: Array<{
    type: string;
    team?: TeamColor;
    word?: string;
    message: string;
    timestamp: number;
  }>;
  winner: TeamColor | null;
  winReason: string | null;
  startingTeam: TeamColor;
}

interface ShifaratSpectatorViewProps {
  stateJson: string;
  roomCode: string;
  hostName: string;
  playerName?: string;
}

// ============================================================
// READ-ONLY CARD GRID FOR SPECTATOR
// ============================================================

function SpectatorCardGrid({ board }: { board: BoardCard[] }) {
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
            select-none
            ${card.isRevealed ? getRevealedStyle(card.color) : 'bg-slate-800 border-slate-700'}
            ${!card.isRevealed ? 'cursor-default' : ''}
          `}
        >
          {card.isRevealed && (
            <Check className="absolute top-0.5 right-0.5 z-10 w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
          )}
          <span className="text-[9px] sm:text-xs md:text-sm font-bold text-center leading-tight break-words line-clamp-2 text-slate-200">
            {card.word}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function getRevealedStyle(color: string) {
  switch (color) {
    case 'red':
      return 'bg-red-500/80 border-red-400/60';
    case 'blue':
      return 'bg-blue-500/80 border-blue-400/60';
    case 'neutral':
      return 'bg-slate-600/50 border-slate-500/40';
    case 'assassin':
      return 'bg-gray-900 border-gray-500/60';
    default:
      return 'bg-slate-800 border-slate-700';
  }
}

// ============================================================
// MAIN SPECTATOR VIEW
// ============================================================

export default function ShifaratSpectatorView({
  stateJson,
  roomCode,
  hostName,
  playerName,
}: ShifaratSpectatorViewProps) {
  const [state, setState] = useState<SpectatorState | null>(null);

  // Parse initial state
  const parsedState = useMemo(() => {
    try {
      return JSON.parse(stateJson) as SpectatorState;
    } catch {
      return null;
    }
  }, [stateJson]);

  useEffect(() => {
    setState(parsedState);
  }, [parsedState]);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/room/${roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.stateJson) {
            try {
              setState(JSON.parse(data.stateJson));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // silent
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎯</div>
          <p className="text-slate-400">جاري تحميل اللعبة...</p>
        </div>
      </div>
    );
  }

  const isGameOver = state.phase === 'game_over';
  const winnerTeam = state.winner;
  const winnerName = winnerTeam === 'red' ? state.redTeam.name : winnerTeam === 'blue' ? state.blueTeam.name : null;

  const redTotal = state.startingTeam === 'red' ? 9 : 8;
  const blueTotal = state.startingTeam === 'blue' ? 9 : 8;

  const isRedActive = state.currentTeam === 'red' && !isGameOver;
  const isBlueActive = state.currentTeam === 'blue' && !isGameOver;

  const timerDuration = state.timerRemaining > 0 ? 60 : 0;
  const timerPercent = timerDuration > 0 ? (state.timerRemaining / timerDuration) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 to-slate-900" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">🎯 الشيفرات</span>
            <Badge className="text-[8px] px-1.5 bg-amber-500/20 text-amber-300 border-amber-500/30">
              مشاهد
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {playerName && (
              <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2 py-1">
                <span className="text-xs">🎮</span>
                <span className="text-[10px] font-bold text-emerald-300">{playerName}</span>
              </div>
            )}
            <span className="text-xs text-slate-500">جولة {state.roundNumber}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-4">
        {/* Team Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Red Team */}
          <motion.div
            animate={{ scale: isRedActive ? 1.02 : 1 }}
            className={`rounded-xl p-3 sm:p-4 text-center transition-all ${
              isRedActive
                ? 'bg-red-950/30 border-2 border-red-500/50 shadow-lg shadow-red-500/10'
                : 'bg-slate-800/50 border border-slate-700/50'
            }`}
          >
            <p className="text-[10px] text-slate-400 mb-1">الفريق الأحمر</p>
            <p className="text-xs font-bold text-white mb-2 truncate">{state.redTeam.name}</p>
            <div className="text-2xl font-bold text-red-400">{state.redTeam.score}</div>
            <div className="w-full h-1 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                animate={{ width: `${Math.min((state.redTeam.score / redTotal) * 100, 100)}%` }}
                className="h-full bg-red-500 rounded-full"
              />
            </div>
            <p className="text-[9px] text-slate-500 mt-0.5">{state.redTeam.score}/{redTotal}</p>
          </motion.div>

          {/* Blue Team */}
          <motion.div
            animate={{ scale: isBlueActive ? 1.02 : 1 }}
            className={`rounded-xl p-3 sm:p-4 text-center transition-all ${
              isBlueActive
                ? 'bg-blue-950/30 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10'
                : 'bg-slate-800/50 border border-slate-700/50'
            }`}
          >
            <p className="text-[10px] text-slate-400 mb-1">الفريق الأزرق</p>
            <p className="text-xs font-bold text-white mb-2 truncate">{state.blueTeam.name}</p>
            <div className="text-2xl font-bold text-blue-400">{state.blueTeam.score}</div>
            <div className="w-full h-1 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                animate={{ width: `${Math.min((state.blueTeam.score / blueTotal) * 100, 100)}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <p className="text-[9px] text-slate-500 mt-0.5">{state.blueTeam.score}/{blueTotal}</p>
          </motion.div>
        </div>

        {/* Current clue */}
        {state.currentClue && !isGameOver && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50 text-center"
          >
            <p className="text-[10px] text-slate-500 mb-1">الدليل الحالي</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-white">{state.currentClue.word}</span>
              <span className="text-lg font-bold text-slate-500">—</span>
              <span className="text-lg font-bold text-emerald-400">{state.currentClue.number}</span>
            </div>
          </motion.div>
        )}

        {/* Turn Info */}
        {!isGameOver && (
          <div className="text-center mb-3">
            <p className="text-xs text-slate-400">
              دور:{' '}
              <span className={`font-bold ${state.currentTeam === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                {state.currentTeam === 'red' ? state.redTeam.name : state.blueTeam.name}
              </span>
            </p>
            {state.guessesAllowed > 0 && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                التخمينات: {state.guessesThisTurn}/{state.guessesAllowed}
              </p>
            )}
          </div>
        )}

        {/* Game Over Banner */}
        {isGameOver && winnerName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center"
          >
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-xl font-bold text-amber-400">{winnerName}</p>
            <p className="text-sm text-slate-400 mt-1">فاز باللعبة!</p>
            {state.winReason && (
              <p className="text-xs text-slate-500 mt-1">
                {state.winReason === 'all_found' && 'وجد جميع كلماته'}
                {state.winReason === 'assassin' && 'الخصم كشف القاتل!'}
                {state.winReason === 'opponent_finished' && 'الخصم وجد كلماته بالخطأ'}
              </p>
            )}
          </motion.div>
        )}

        {/* Timer Bar */}
        {!isGameOver && timerDuration > 0 && (
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
            <motion.div
              animate={{ width: `${timerPercent}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${
                timerPercent <= 20 ? 'bg-red-500' : timerPercent <= 40 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
        )}

        {/* Board */}
        <div className="mb-4 p-3 rounded-xl bg-slate-900/30 border border-slate-800/40">
          <SpectatorCardGrid board={state.board} />
        </div>

        {/* Game Log */}
        {state.gameLog.length > 0 && (
          <div className="rounded-xl bg-slate-900/30 border border-slate-800/40 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-500 font-bold">سجل اللعبة</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {[...state.gameLog].reverse().map((entry, i) => (
                <motion.div
                  key={`${entry.timestamp}-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] px-2 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    color:
                      entry.type === 'correct'
                        ? '#6ee7b7'
                        : entry.type === 'wrong' || entry.type === 'assassin'
                        ? '#fca5a5'
                        : entry.type === 'clue'
                        ? '#c4b5fd'
                        : '#94a3b8',
                  }}
                >
                  {entry.message}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
