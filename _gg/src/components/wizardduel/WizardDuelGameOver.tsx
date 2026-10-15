'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWizardDuelStore } from '@/lib/wizardduel-store';
import {
  useInGameSetupMode,
  useGameRewards,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';
import { useGameOverSounds } from '@/lib/game-sound-hooks';

// Confetti for winner
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
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
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

export default function WizardDuelGameOver() {
  useInGameSetupMode();
  const router = useRouter();
  const {
    players,
    winner,
    turnCount,
    battleLog,
    resetGame,
    setPhase,
    gameMode,
    setGameMode,
  } = useWizardDuelStore();

  const isWizardWinner = winner === '0';
  const wizard = players[0];
  const ai = players[1];

  // Use shared rewards hook
  const { godfather, rewards } = useGameRewards(
    true,
    'wizardduel',
    isWizardWinner ? 'win' : 'loss',
    1
  );

  // Play end-of-game sounds
  useGameOverSounds({
    trigger: !!rewards,
    playerWon: isWizardWinner,
    isDraw: false,
    rewards: rewards || undefined,
  });

  // Stats — count cards played, damage dealt, turns survived
  const cardsPlayed = battleLog.filter(e => e.message.includes('لعب') || e.message.includes('ألحق') || e.message.includes('سحب')).length;
  const damageDealt = battleLog.reduce((acc, e) => acc + Math.abs(Math.min(0, e.valueChange || 0)), 0);
  const turnsSurvived = turnCount;

  // Play Again: reset + restore gameMode + go directly to setup (skip LandingPage)
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
      {isWizardWinner && <Confetti />}

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
          {isWizardWinner ? '🏆 فزت!' : '💀 خسرت'}
        </h1>

        {/* Description */}
        <p className="tobol-gameover-desc-v2">
          {isWizardWinner
            ? `تغلبت على ${ai.name} في ${turnsSurvived} دورة`
            : `${ai.name} تغلب عليك في ${turnsSurvived} دورة`}
        </p>

        {/* Godfather row with avatar + name + reward chips */}
        <div className="tobol-gameover-godfather">
          <div className="tobol-gameover-godfather-avatar">
            <span className="tobol-gameover-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '18px' }}>🔮</span>
            )}
          </div>
          <div className="tobol-gameover-godfather-info">
            <div className="tobol-gameover-godfather-name">
              {godfather?.name || 'الساحر'}
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
          <div className={`tobol-team-result-card team-red ${isWizardWinner ? 'winner' : 'loser'}`}>
            <div className="tobol-team-result-rank">{isWizardWinner ? '🏆' : '💀'}</div>
            <div className="tobol-team-result-name">{wizard.name}</div>
            <div className="tobol-team-result-score">{wizard.hp}</div>
            <div className="tobol-team-result-label">{isWizardWinner ? 'فائز' : 'خاسر'}</div>
          </div>
          <div className={`tobol-team-result-card team-blue ${!isWizardWinner ? 'winner' : 'loser'}`}>
            <div className="tobol-team-result-rank">{!isWizardWinner ? '🏆' : '💀'}</div>
            <div className="tobol-team-result-name">{ai.name}</div>
            <div className="tobol-team-result-score">{ai.hp}</div>
            <div className="tobol-team-result-label">{!isWizardWinner ? 'فائز' : 'خاسر'}</div>
          </div>
        </div>

        {/* Stats card */}
        <div className="tobol-gameover-stats-card">
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>🃏</span>
            </div>
            <div className="tobol-gameover-stat-label">بطاقات لعبت</div>
            <div className="tobol-gameover-stat-value">{cardsPlayed}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>⚔️</span>
            </div>
            <div className="tobol-gameover-stat-label">الضرر الكلي</div>
            <div className="tobol-gameover-stat-value">{damageDealt}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>⏳</span>
            </div>
            <div className="tobol-gameover-stat-label">الدورات المتبقية</div>
            <div className="tobol-gameover-stat-value">{turnsSurvived}</div>
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
