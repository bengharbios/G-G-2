'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRisk2Store } from '@/lib/risk2-store';
import { useRouter } from 'next/navigation';
import { useInGameSetupMode, useGameRewards } from '@/lib/yalla-game-helpers';

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

export default function Risk2GameOver() {
  const router = useRouter();
  const {
    players, gameLog, winner, winReason, config,
    resetGame, gameMode, setGameMode, setPhase,
  } = useRisk2Store();

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winnerPlayer = sortedPlayers[0];
  const isDraw = !winner && sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;

  // Stats from game log
  const totalSaves = gameLog.filter(e => e.action.includes('حفظ')).length;
  const totalBombs = gameLog.filter(e => e.action.includes('قنبلة')).length;
  const totalSkips = gameLog.filter(e => e.action.includes('تخطي')).length;
  const totalMatches = gameLog.filter(e => e.action.includes('تطابق') || e.action.includes('خسر')).length;
  const totalPoints = players.reduce((sum, p) => sum + p.score, 0);

  const playerCount = players.length || 2;
  const outcome = winner ? 'win' : isDraw ? 'play' : 'win';
  const { godfather, rewards } = useGameRewards(true, 'risk2', outcome, playerCount);

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

  // Winner & runner-up data
  const topPlayer = sortedPlayers[0];
  const runnerUp = sortedPlayers[1];
  const topScore = topPlayer?.score ?? 0;
  const runnerScore = runnerUp?.score ?? 0;

  return (
    <div className="tobol-gameover-v2-root">
      {winner && <Confetti />}

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
          {winner ? 'تهانينا!' : isDraw ? 'تعادل!' : 'انتهت اللعبة!'}
        </h1>

        {/* Description */}
        <p className="tobol-gameover-desc-v2">
          {winner
            ? `${winner.name} وصل للهدف (${config.targetScore}) أولاً!`
            : isDraw
              ? `تعادل بـ ${topScore} نقطة`
              : winReason || `${winnerPlayer?.name ?? ''} تصدر القائمة بـ ${topScore} نقطة`}
        </p>

        {/* Godfather row */}
        <div className="tobol-gameover-godfather">
          <div className="tobol-gameover-godfather-avatar">
            <span className="tobol-gameover-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '18px' }}>🎴</span>
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

        {/* Teams comparison row — show winner + runner-up */}
        <div className="tobol-gameover-teams-row">
          {sortedPlayers.slice(0, 2).map((player, idx) => (
            <div
              key={player.id}
              className={`tobol-team-result-card ${idx === 0 ? 'team-red winner' : 'team-blue loser'}`}
            >
              <div className="tobol-team-result-rank">
                {idx === 0 ? '🏆' : '🥈'}
              </div>
              <div className="tobol-team-result-name">
                {player.name}
              </div>
              <div className="tobol-team-result-score">{player.score}</div>
              <div className="tobol-team-result-label">نقطة</div>
            </div>
          ))}
        </div>

        {/* Stats card */}
        <div className="tobol-gameover-stats-card">
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>🏆</span></div>
            <div className="tobol-gameover-stat-label">الهدف</div>
            <div className="tobol-gameover-stat-value">{config.targetScore}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>💎</span></div>
            <div className="tobol-gameover-stat-label">مجموع النقاط</div>
            <div className="tobol-gameover-stat-value">{totalPoints}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>💰</span></div>
            <div className="tobol-gameover-stat-label">حفظ</div>
            <div className="tobol-gameover-stat-value">{totalSaves}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>💣</span></div>
            <div className="tobol-gameover-stat-label">قنابل</div>
            <div className="tobol-gameover-stat-value">{totalBombs}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon"><span style={{ fontSize: '14px' }}>😱</span></div>
            <div className="tobol-gameover-stat-label">خسائر (تخطي + تطابق)</div>
            <div className="tobol-gameover-stat-value">{totalSkips + totalMatches}</div>
          </div>
        </div>

        {/* All players ranking — for games with more than 2 players */}
        {sortedPlayers.length > 2 && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sortedPlayers.slice(2).map((player, idx) => (
              <div
                key={player.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 12px', borderRadius: '8px',
                  background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.05)',
                }}
              >
                <span style={{ fontSize: '12px', color: '#9fc4b4', width: '20px' }}>#{idx + 3}</span>
                <span style={{ fontSize: '12px' }}>🎴</span>
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.name}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>{player.score}</span>
              </div>
            ))}
          </div>
        )}

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
