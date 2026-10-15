'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useShifaratStore } from '@/lib/shifarat-store';
import type { BoardCard } from '@/lib/shifarat-types';
import {
  useInGameSetupMode,
  useGameRewards,
} from '@/lib/yalla-game-helpers';

// Confetti particles for the winner (Yalla celebration style)
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#feef91'];
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.8,
      duration: 2 + Math.random() * 3.5,
      size: 4 + Math.random() * 9,
      rotate: Math.random() * 1080,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

function RevealedBoard({ board }: { board: BoardCard[] }) {
  const getCardStyle = (card: BoardCard) => {
    if (card.isRevealed) {
      switch (card.color) {
        case 'red': return 'bg-red-500/80 border-red-400/60';
        case 'blue': return 'bg-blue-500/80 border-blue-400/60';
        case 'neutral': return 'bg-slate-600/50 border-slate-500/40';
        case 'assassin': return 'bg-gray-900 border-gray-500/60';
      }
    }
    if (card.guessedBy && !card.isRevealed) {
      switch (card.color) {
        case 'red': return 'bg-red-500/40 border-red-400/30';
        case 'blue': return 'bg-blue-500/40 border-blue-400/30';
        case 'neutral': return 'bg-slate-600/25 border-slate-500/20';
        case 'assassin': return 'bg-gray-900/60 border-gray-500/30';
      }
    }
    switch (card.color) {
      case 'red': return 'bg-red-500/50 border-red-400/30';
      case 'blue': return 'bg-blue-500/50 border-blue-400/30';
      case 'neutral': return 'bg-slate-600/30 border-slate-500/20';
      case 'assassin': return 'bg-gray-900/80 border-gray-500/40';
    }
  };

  return (
    <div className="grid grid-cols-5 gap-1">
      {board.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02, duration: 0.2 }}
          className={`relative aspect-square rounded-md border-2 flex items-center justify-center p-1 ${getCardStyle(card)} ${card.guessedBy && !card.isRevealed ? 'opacity-60' : card.isRevealed ? '' : 'opacity-70'}`}
        >
          {card.isRevealed && (
            <span className="absolute top-0.5 right-0.5 z-10 text-[8px] font-bold text-white/80">✓</span>
          )}
          {card.guessedBy && !card.isRevealed && (
            <span className="absolute top-0.5 right-0.5 z-10 text-[8px] font-bold text-red-400/70">✕</span>
          )}
          {!card.isRevealed && !card.guessedBy && card.color === 'assassin' && (
            <span className="absolute top-0 left-0 text-[7px]">💀</span>
          )}
          <span className="text-[7px] sm:text-[9px] font-bold text-white/90 text-center leading-tight break-words line-clamp-2">
            {card.word}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export default function GameOver() {
  const {
    winner,
    winReason,
    redTeam,
    blueTeam,
    startingTeam,
    roundNumber,
    clues,
    board,
    resetGame,
  } = useShifaratStore();

  useInGameSetupMode();

  const isAssassin = winReason === 'assassin';
  const outcome = winner !== null ? 'win' : 'play';
  const playerCount = 2;
  const { godfather, rewards } = useGameRewards(true, 'shifarat', outcome, playerCount);

  const winnerName = winner === 'red' ? redTeam.name : winner === 'blue' ? blueTeam.name : 'تعادل';
  const loserName = winner === 'red' ? blueTeam.name : winner === 'blue' ? redTeam.name : '';
  const winnerScore = winner === 'red' ? redTeam.score : winner === 'blue' ? blueTeam.score : 0;
  const loserScore = winner === 'red' ? blueTeam.score : winner === 'blue' ? redTeam.score : 0;

  const redTotal = startingTeam === 'red' ? 9 : 8;
  const blueTotal = startingTeam === 'blue' ? 9 : 8;
  const totalGuesses = board.filter(c => c.isRevealed).length;

  const handlePlayAgain = () => {
    resetGame();
  };

  const handleCloseGame = () => {
    resetGame();
    window.location.href = '/';
  };

  return (
    <div className="tobol-gameover-v2-root">
      {/* Confetti only when not assassin and clear winner */}
      {!isAssassin && winner !== null && <Confetti />}

      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="tobol-gameover-card-v2"
      >
        {/* Trophy */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '100px', height: '100px', marginTop: '-20px' }}
        >
          <img
            src="/battle/segment_award.webp"
            alt="trophy"
            className="tobol-gameover-trophy-v2"
          />
        </motion.div>

        {/* Title */}
        <h1 className="tobol-gameover-title-v2">
          {isAssassin ? '💀 القاتل!' : winner !== null ? 'تهانينا!' : 'تعادل!'}
        </h1>

        {/* Description */}
        <p className="tobol-gameover-desc-v2">
          {isAssassin
            ? `فريق ${loserName} كشف القاتل — خسارة فورية!`
            : winner !== null
            ? `الفريق ${winnerName} فاز بكشف ${winnerScore} كلمات`
            : `الفريقان متعادلان (${redTeam.score} - ${blueTeam.score})`}
        </p>

        {/* Godfather row */}
        <div className="tobol-gameover-godfather">
          <div className="tobol-gameover-godfather-avatar">
            <span className="tobol-gameover-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '18px' }}>🎯</span>
            )}
          </div>
          <div className="tobol-gameover-godfather-info">
            <div className="tobol-gameover-godfather-name">
              {godfather?.name || 'العراب'}
            </div>
            <span className="tobol-gameover-godfather-tag">العراب</span>
          </div>
          <div className="tobol-gameover-godfather-rewards">
            <div className="tobol-gameover-reward-chip">
              <img src="/yalla-ui/exp.png" alt="xp" />
              <span className="reward-amount">{rewards ? `+${rewards.xp}` : '...'}</span>
            </div>
            <div className="tobol-gameover-reward-chip">
              <img src="/yalla-ui/coin.webp" alt="gold" />
              <span className="reward-amount">{rewards ? `+${rewards.gold}` : '...'}</span>
            </div>
          </div>
        </div>

        {/* Level-up */}
        {rewards?.leveledUp && rewards.newLevel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="tobol-gameover-levelup"
          >
            🎉 ترقية للمستوى {rewards.newLevel}!
          </motion.div>
        )}

        {/* Teams comparison row */}
        <div className="tobol-gameover-teams-row">
          {winner !== null ? (
            <>
              <div className={`tobol-team-result-card team-${winner} winner`}>
                <div className="tobol-team-result-rank">🏆</div>
                <div className="tobol-team-result-name">{winnerName}</div>
                <div className="tobol-team-result-score">{winnerScore}/{winner === 'red' ? redTotal : blueTotal}</div>
                <div className="tobol-team-result-label">فائز</div>
              </div>
              <div className={`tobol-team-result-card team-${winner === 'red' ? 'blue' : 'red'} loser`}>
                <div className="tobol-team-result-rank">{isAssassin ? '💀' : '🤝'}</div>
                <div className="tobol-team-result-name">{loserName}</div>
                <div className="tobol-team-result-score">{loserScore}/{winner === 'red' ? blueTotal : redTotal}</div>
                <div className="tobol-team-result-label">خاسر</div>
              </div>
            </>
          ) : (
            <>
              <div className="tobol-team-result-card team-red">
                <div className="tobol-team-result-rank">🤝</div>
                <div className="tobol-team-result-name">{redTeam.name}</div>
                <div className="tobol-team-result-score">{redTeam.score}/{redTotal}</div>
                <div className="tobol-team-result-label">نقطة</div>
              </div>
              <div className="tobol-team-result-card team-blue">
                <div className="tobol-team-result-rank">🤝</div>
                <div className="tobol-team-result-name">{blueTeam.name}</div>
                <div className="tobol-team-result-score">{blueTeam.score}/{blueTotal}</div>
                <div className="tobol-team-result-label">نقطة</div>
              </div>
            </>
          )}
        </div>

        {/* Stats card */}
        <div className="tobol-gameover-stats-card">
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>🎯</span>
            </div>
            <div className="tobol-gameover-stat-label">الجولات</div>
            <div className="tobol-gameover-stat-value">{roundNumber}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>💡</span>
            </div>
            <div className="tobol-gameover-stat-label">الأدلة المعطاة</div>
            <div className="tobol-gameover-stat-value">{clues.length}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>✓</span>
            </div>
            <div className="tobol-gameover-stat-label">كلمات مكشوفة</div>
            <div className="tobol-gameover-stat-value">{totalGuesses}</div>
          </div>
        </div>

        {/* Revealed board preview */}
        <div style={{
          background: 'rgba(6,42,32,.6)',
          border: '1px solid rgba(254,239,145,.15)',
          borderRadius: '12px',
          padding: '10px',
          marginTop: '10px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#feef91', fontSize: '12px', fontWeight: 700 }}>👁️ كشف اللوحة</span>
          </div>
          <RevealedBoard board={board} />
        </div>

        {/* Two-button row */}
        <div className="tobol-gameover-buttons-row">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={handlePlayAgain}
            className="tobol-gameover-btn btn-yes"
          >
            <span style={{ fontSize: '14px' }}>🔄</span>
            <span>إعادة اللعبة</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleCloseGame}
            className="tobol-gameover-btn btn-no"
          >
            <span style={{ fontSize: '14px' }}>✕</span>
            <span>إغلاق اللعبة</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
