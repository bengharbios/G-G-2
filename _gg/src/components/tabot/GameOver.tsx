'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTabotStore } from '@/lib/tabot-store';
import {
  getTeamInfo,
  TEAM_CONFIG,
  ROLE_CONFIG,
} from '@/lib/tabot-types';
import { useGameRewards } from '@/lib/yalla-game-helpers';
import { useGameOverSounds } from '@/lib/game-sound-hooks';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

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

export default function GameOver() {
  const router = useRouter();
  const {
    winner, winReason, players,
    teamAlphaName, teamBetaName,
    currentRound,
    roundLog,
    gameMode,
    resetGame,
    setPhase,
  } = useTabotStore();

  const alphaInfo = getTeamInfo(players, 'alpha', teamAlphaName);
  const betaInfo = getTeamInfo(players, 'beta', teamBetaName);
  const isDraw = winner === 'draw';
  const winnerTeam = winner === 'alpha' ? alphaInfo : winner === 'beta' ? betaInfo : null;
  const loserTeam = winner === 'alpha' ? betaInfo : winner === 'beta' ? alphaInfo : null;

  // Player count for reward
  const playerCount = players.length || 4;

  // Apply body class
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => {
      document.body.classList.remove('in-game-setup');
    };
  }, []);

  // Godfather info + rewards
  const { godfather, rewards } = useGameRewards(
    true,
    'tabot',
    winner !== 'draw' ? 'win' : 'play',
    playerCount
  );

  // Play end-of-game sounds
  useGameOverSounds({
    trigger: !!rewards,
    playerWon: winner === 'draw' ? null : true,
    isDraw,
    rewards,
  });

  // Stats from round log
  const kills = roundLog.filter(e => e.message.includes('قَتَل') || e.message.includes('قتل') || e.message.includes('قُتِل') || e.message.includes('انتحر')).length;
  const imprisonments = roundLog.filter(e => e.message.includes('حبس')).length;
  const frees = roundLog.filter(e => e.message.includes('حرر')).length;
  const totalActions = roundLog.length;

  const handlePlayAgain = () => {
    resetGame();
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
          {isDraw ? 'تعادل! 🤝' : 'تهانينا!'}
        </h1>

        {/* Description */}
        <p className="tobol-gameover-desc-v2">
          {isDraw
            ? winReason
            : winnerTeam
              ? `فريق ${winnerTeam.name} فاز باللعبة`
              : winReason}
        </p>

        {/* Godfather row */}
        <div className="tobol-gameover-godfather">
          <div className="tobol-gameover-godfather-avatar">
            <span className="tobol-gameover-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '18px' }}>⚰️</span>
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
          {!isDraw && winnerTeam && loserTeam ? (
            <>
              <div className={`tobol-team-result-card ${winner === 'alpha' ? 'team-red' : 'team-blue'} winner`}>
                <div className="tobol-team-result-rank">🏆</div>
                <div className="tobol-team-result-name">
                  {TEAM_CONFIG[winner as 'alpha' | 'beta'].icon} {winnerTeam.name}
                </div>
                <div className="tobol-team-result-score">{winnerTeam.activeCount}</div>
                <div className="tobol-team-result-label">أحياء</div>
              </div>
              <div className={`tobol-team-result-card ${winner === 'alpha' ? 'team-blue' : 'team-red'} loser`}>
                <div className="tobol-team-result-rank">💀</div>
                <div className="tobol-team-result-name">
                  {TEAM_CONFIG[winner === 'alpha' ? 'beta' : 'alpha'].icon} {loserTeam.name}
                </div>
                <div className="tobol-team-result-score">{loserTeam.activeCount}</div>
                <div className="tobol-team-result-label">أحياء</div>
              </div>
            </>
          ) : (
            <>
              <div className="tobol-team-result-card team-red">
                <div className="tobol-team-result-rank">🤝</div>
                <div className="tobol-team-result-name">
                  {TEAM_CONFIG.alpha.icon} {alphaInfo.name}
                </div>
                <div className="tobol-team-result-score">{alphaInfo.activeCount}</div>
                <div className="tobol-team-result-label">أحياء</div>
              </div>
              <div className="tobol-team-result-card team-blue">
                <div className="tobol-team-result-rank">🤝</div>
                <div className="tobol-team-result-name">
                  {TEAM_CONFIG.beta.icon} {betaInfo.name}
                </div>
                <div className="tobol-team-result-score">{betaInfo.activeCount}</div>
                <div className="tobol-team-result-label">أحياء</div>
              </div>
            </>
          )}
        </div>

        {/* Stats card */}
        <div className="tobol-gameover-stats-card">
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>📋</span>
            </div>
            <div className="tobol-gameover-stat-label">إجمالي التحركات</div>
            <div className="tobol-gameover-stat-value">{totalActions}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>💀</span>
            </div>
            <div className="tobol-gameover-stat-label">قتلى</div>
            <div className="tobol-gameover-stat-value">{kills}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>⛓️</span>
            </div>
            <div className="tobol-gameover-stat-label">حبسات</div>
            <div className="tobol-gameover-stat-value">{imprisonments}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>🔑</span>
            </div>
            <div className="tobol-gameover-stat-label">تحريرات</div>
            <div className="tobol-gameover-stat-value">{frees}</div>
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
