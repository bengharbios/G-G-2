'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useBaharHarbStore } from '@/lib/baharharb-store';
import {
  useInGameSetupMode,
  useGameRewards,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';
import { useGameOverSounds } from '@/lib/game-sound-hooks';

// Confetti particles for the winner (Yalla celebration style)
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#22d3ee', '#f43f5e', '#fbbf24', '#34d399', '#feef91', '#67e8f9', '#fda4af'];
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

export default function BaharHarbGameOver() {
  const router = useRouter();
  const {
    team1Name,
    team2Name,
    team1Score,
    team2Score,
    playMode,
    resetGame,
    gameMode,
    setGameMode,
    setPhase,
    battleLog,
  } = useBaharHarbStore();

  useInGameSetupMode();

  // Determine winner
  const winner: 'team1' | 'team2' | 'draw' = team1Score > team2Score ? 'team1' : team2Score > team1Score ? 'team2' : 'draw';
  const winnerName = winner === 'team1' ? team1Name : winner === 'team2' ? team2Name : '';
  const loserName = winner === 'team1' ? team2Name : winner === 'team2' ? team1Name : '';
  const winnerScore = winner === 'team1' ? team1Score : winner === 'team2' ? team2Score : 0;
  const loserScore = winner === 'team1' ? team2Score : winner === 'team2' ? team1Score : 0;
  const scoreDiff = Math.abs(team1Score - team2Score);

  // Stats from battle log
  const totalCorrect = battleLog.length;

  // Godfather + rewards (Yalla Ludo style)
  const playerCount = playMode === 'individuals' ? 2 : 2;
  const outcome = winner !== 'draw' ? 'win' : 'play';
  const { godfather, rewards } = useGameRewards(true, 'baharharb', outcome, playerCount);

  // Play end-of-game sounds
  useGameOverSounds({
    trigger: !!rewards,
    playerWon: winner === 'draw' ? null : true,
    isDraw: winner === 'draw',
    rewards,
  });

  // Play Again: reset + restore gameMode + go directly to setup
  const handlePlayAgain = () => {
    const prevMode = gameMode;
    resetGame();
    setGameMode(prevMode);
    setPhase('setup');
  };

  // Close Game: reset + go to home page
  const handleCloseGame = () => {
    resetGame();
    router.push('/');
  };

  return (
    <div className="tobol-gameover-v2-root">
      {/* Confetti for clear winner */}
      {winner !== 'draw' && <Confetti />}

      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="tobol-gameover-card-v2"
      >
        {/* Trophy at top */}
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
          {winner === 'draw' ? 'تعادل!' : 'تهانينا!'}
        </h1>

        {/* Description */}
        <p className="tobol-gameover-desc-v2">
          {winner === 'draw'
            ? `الفريقان متعادلان بالنقاط (${team1Score} - ${team2Score})`
            : `الفريق ${winnerName} فاز بفارق ${scoreDiff} نقطة`}
        </p>

        {/* Godfather row with avatar + name + reward chips */}
        <div className="tobol-gameover-godfather">
          <div className="tobol-gameover-godfather-avatar">
            <span className="tobol-gameover-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '18px' }}>🌊</span>
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

        {/* Level-up badge */}
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
          {winner !== 'draw' ? (
            <>
              <div className={`tobol-team-result-card team-${winner === 'team1' ? 'red' : 'blue'} winner`}>
                <div className="tobol-team-result-rank">🏆</div>
                <div className="tobol-team-result-name">{winnerName}</div>
                <div className="tobol-team-result-score">{winnerScore}</div>
                <div className="tobol-team-result-label">فائز</div>
              </div>
              <div className={`tobol-team-result-card team-${winner === 'team1' ? 'blue' : 'red'} loser`}>
                <div className="tobol-team-result-rank">💀</div>
                <div className="tobol-team-result-name">{loserName}</div>
                <div className="tobol-team-result-score">{loserScore}</div>
                <div className="tobol-team-result-label">خاسر</div>
              </div>
            </>
          ) : (
            <>
              <div className="tobol-team-result-card team-red">
                <div className="tobol-team-result-rank">🌊</div>
                <div className="tobol-team-result-name">{team1Name}</div>
                <div className="tobol-team-result-score">{team1Score}</div>
                <div className="tobol-team-result-label">نقطة</div>
              </div>
              <div className="tobol-team-result-card team-blue">
                <div className="tobol-team-result-rank">⚔️</div>
                <div className="tobol-team-result-name">{team2Name}</div>
                <div className="tobol-team-result-score">{team2Score}</div>
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
            <div className="tobol-gameover-stat-label">إجمالي الإجابات الصحيحة</div>
            <div className="tobol-gameover-stat-value">{totalCorrect}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>🌊</span>
            </div>
            <div className="tobol-gameover-stat-label">فريق البحر</div>
            <div className="tobol-gameover-stat-value">{team1Score}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>⚔️</span>
            </div>
            <div className="tobol-gameover-stat-label">فريق الحرب</div>
            <div className="tobol-gameover-stat-value">{team2Score}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>⚓</span>
            </div>
            <div className="tobol-gameover-stat-label">الفارق</div>
            <div className="tobol-gameover-stat-value">{scoreDiff}</div>
          </div>
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
