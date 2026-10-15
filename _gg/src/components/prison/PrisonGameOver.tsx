'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePrisonStore } from '@/lib/prison-store';
import { useRouter } from 'next/navigation';
import { useInGameSetupMode, useGameRewards } from '@/lib/yalla-game-helpers';
import type { PrisonTeam } from '@/lib/prison-types';

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
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute', top: '-10px', left: `${p.x}%`,
            width: p.size, height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

export default function PrisonGameOver() {
  const router = useRouter();
  const {
    alphaName, betaName, players, gameLog, winner, winReason,
    resetGame, gameMode, setGameMode, setPhase,
  } = usePrisonStore();

  const isDraw = winner === 'draw';
  const winnerTeam = winner as PrisonTeam | null;
  const winnerName = isDraw ? '' : winnerTeam === 'alpha' ? alphaName : betaName;
  const loserName = isDraw ? '' : winnerTeam === 'alpha' ? betaName : alphaName;

  // Stats
  const totalMoves = gameLog.length;
  const skullMoves = gameLog.filter((e) => e.itemType === 'skull').length;
  const openMoves = gameLog.filter((e) => e.itemType === 'open').length;
  const keyMoves = gameLog.filter((e) => e.itemType === 'key').length;
  const uniformMoves = gameLog.filter((e) => e.itemType === 'uniform').length;

  const alphaActive = players.filter((p) => p.team === 'alpha' && p.status === 'active').length;
  const betaActive = players.filter((p) => p.team === 'beta' && p.status === 'active').length;
  const winnerActive = winnerTeam === 'alpha' ? alphaActive : betaActive;
  const loserActive = winnerTeam === 'alpha' ? betaActive : alphaActive;

  const playerCount = players.length || 4;
  const outcome = isDraw ? 'play' : 'win';
  const { godfather, rewards } = useGameRewards(true, 'prison', outcome, playerCount);

  useInGameSetupMode();

  const handlePlayAgain = () => {
    const prevMode = gameMode;
    resetGame();
    setGameMode(prevMode);
    setPhase('setup');
  };

  const handleCloseGame = () => {
    resetGame();
    router.push('/');
  };

  return (
    <div className="tobol-gameover-v2-root">
      {!isDraw && <Confetti />}

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
          {isDraw ? 'تعادل!' : 'تهانينا!'}
        </h1>

        {/* Description */}
        <p className="tobol-gameover-desc-v2">
          {isDraw ? winReason : `فريق ${winnerName} فاز — ${winReason}`}
        </p>

        {/* Godfather row */}
        <div className="tobol-gameover-godfather">
          <div className="tobol-gameover-godfather-avatar">
            <span className="tobol-gameover-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '18px' }}>🔒</span>
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
          {!isDraw ? (
            <>
              <div className={`tobol-team-result-card team-${winnerTeam === 'alpha' ? 'red' : 'blue'} winner`}>
                <div className="tobol-team-result-rank">🏆</div>
                <div className="tobol-team-result-name">{winnerName}</div>
                <div className="tobol-team-result-score">{winnerActive}</div>
                <div className="tobol-team-result-label">أحرار</div>
              </div>
              <div className={`tobol-team-result-card team-${winnerTeam === 'alpha' ? 'blue' : 'red'} loser`}>
                <div className="tobol-team-result-rank">💀</div>
                <div className="tobol-team-result-name">{loserName}</div>
                <div className="tobol-team-result-score">{loserActive}</div>
                <div className="tobol-team-result-label">أحرار</div>
              </div>
            </>
          ) : (
            <>
              <div className="tobol-team-result-card team-red">
                <div className="tobol-team-result-rank">🤝</div>
                <div className="tobol-team-result-name">{alphaName}</div>
                <div className="tobol-team-result-score">{alphaActive}</div>
                <div className="tobol-team-result-label">أحرار</div>
              </div>
              <div className="tobol-team-result-card team-blue">
                <div className="tobol-team-result-rank">🤝</div>
                <div className="tobol-team-result-name">{betaName}</div>
                <div className="tobol-team-result-score">{betaActive}</div>
                <div className="tobol-team-result-label">أحرار</div>
              </div>
            </>
          )}
        </div>

        {/* Stats card */}
        <div className="tobol-gameover-stats-card">
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>📜</span></div>
            <div className="tobol-gameover-stat-label">إجمالي التحركات</div>
            <div className="tobol-gameover-stat-value">{totalMoves}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>💀</span></div>
            <div className="tobol-gameover-stat-label">إعدام</div>
            <div className="tobol-gameover-stat-value">{skullMoves}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>🔓</span></div>
            <div className="tobol-gameover-stat-label">سجن</div>
            <div className="tobol-gameover-stat-value">{openMoves}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>🔑</span></div>
            <div className="tobol-gameover-stat-label">تحرير</div>
            <div className="tobol-gameover-stat-value">{keyMoves}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>🏚️</span></div>
            <div className="tobol-gameover-stat-label">ملابس</div>
            <div className="tobol-gameover-stat-value">{uniformMoves}</div>
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
