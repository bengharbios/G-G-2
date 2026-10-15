'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTobolStore } from '@/lib/tobol-store';
import { useRouter } from 'next/navigation';
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

export default function TobolGameOver() {
  const router = useRouter();
  const {
    redName, blueName, redScore, blueScore,
    resetGame, gameMode, setGameMode, setPhase,
    battleLog,
  } = useTobolStore();

  // Godfather (host) info + rewards
  const [godfather, setGodfather] = useState<{ name: string; avatar: string } | null>(null);
  const [rewards, setRewards] = useState<{ xp: number; gold: number; leveledUp: boolean; newLevel: number | null } | null>(null);

  // Determine winner
  const winner: 'red' | 'blue' | 'draw' = redScore > blueScore ? 'red' : blueScore > redScore ? 'blue' : 'draw';
  const winnerName = winner === 'red' ? redName : winner === 'blue' ? blueName : '';
  const loserName = winner === 'red' ? blueName : winner === 'blue' ? redName : '';
  const winnerScore = winner === 'red' ? redScore : winner === 'blue' ? blueScore : 0;
  const loserScore = winner === 'red' ? blueScore : winner === 'blue' ? redScore : 0;
  const scoreDiff = Math.abs(redScore - blueScore);

  // Stats from battle log
  const totalClicks = battleLog.length;
  const attacks = battleLog.filter(e => e.message.includes('هجوم')).length;
  const traps = battleLog.filter(e => e.message.includes('فخ')).length;
  const emptyCards = battleLog.filter(e => e.message.includes('فارغة')).length;

  // Apply body.in-game-setup so header chrome + bottom nav stay hidden
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => {
      document.body.classList.remove('in-game-setup');
    };
  }, []);

  // Fetch godfather info + award rewards
  useEffect(() => {
    let cancelled = false;
    async function fetchGodfatherAndReward() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (cancelled) return;
        if (meData.success && meData.user) {
          const u = meData.user;
          const avatarUrl = u.avatar || `/yalla-avatars/defaultPhoto_${((parseInt(u.id || '0', 10) || 0) % 12) + 1}.png`;
          setGodfather({ name: u.displayName || u.username || 'العراب', avatar: avatarUrl });
        }

        // Award rewards — outcome='win' for clear winner, 'play' for draw
        const outcome = winner !== 'draw' ? 'win' : 'play';
        try {
          const rewardRes = await fetch('/api/game/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameSlug: 'tobol',
              outcome,
              playerCount: 2,
            }),
          });
          const rewardData = await rewardRes.json();
          if (cancelled) return;
          if (rewardData.success) {
            setRewards({
              xp: rewardData.xpAwarded || 0,
              gold: rewardData.goldAwarded || 0,
              leveledUp: !!rewardData.leveledUp,
              newLevel: rewardData.newLevel ?? null,
            });
          } else {
            setRewards({ xp: 0, gold: 0, leveledUp: false, newLevel: null });
          }
        } catch {
          if (!cancelled) setRewards({ xp: 0, gold: 0, leveledUp: false, newLevel: null });
        }
      } catch {
        // silent
      }
    }
    fetchGodfatherAndReward();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play end-of-game sounds (win / tie / levelup / coin)
  useGameOverSounds({
    trigger: !!rewards,
    playerWon: winner === 'draw' ? null : true,
    isDraw: winner === 'draw',
    rewards,
  });

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
      {/* Confetti for clear winner */}
      {winner !== 'draw' && <Confetti />}

      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="tobol-gameover-card-v2"
      >
        {/* Trophy at top (segment_award.webp from yalla source — golden trophy with star) */}
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

        {/* Title — gold gradient stroke text */}
        <h1 className="tobol-gameover-title-v2">
          {winner === 'draw' ? 'تعادل!' : 'تهانينا!'}
        </h1>

        {/* Description */}
        <p className="tobol-gameover-desc-v2">
          {winner === 'draw'
            ? `الفريقان متعادلان بالنقاط (${redScore} - ${blueScore})`
            : `الفريق ${winnerName} فاز بفارق ${scoreDiff} نقطة`}
        </p>

        {/* Godfather row with avatar + name + reward chips */}
        <div className="tobol-gameover-godfather">
          <div className="tobol-gameover-godfather-avatar">
            <span className="tobol-gameover-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '18px' }}>🥁</span>
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
              <div className={`tobol-team-result-card team-${winner} winner`}>
                <div className="tobol-team-result-rank">🏆</div>
                <div className="tobol-team-result-name">{winnerName}</div>
                <div className="tobol-team-result-score">{winnerScore}</div>
                <div className="tobol-team-result-label">فائز</div>
              </div>
              <div className={`tobol-team-result-card team-${winner === 'red' ? 'blue' : 'red'} loser`}>
                <div className="tobol-team-result-rank">💀</div>
                <div className="tobol-team-result-name">{loserName}</div>
                <div className="tobol-team-result-score">{loserScore}</div>
                <div className="tobol-team-result-label">خاسر</div>
              </div>
            </>
          ) : (
            <>
              <div className="tobol-team-result-card team-red">
                <div className="tobol-team-result-rank">🤝</div>
                <div className="tobol-team-result-name">{redName}</div>
                <div className="tobol-team-result-score">{redScore}</div>
                <div className="tobol-team-result-label">نقطة</div>
              </div>
              <div className="tobol-team-result-card team-blue">
                <div className="tobol-team-result-rank">🤝</div>
                <div className="tobol-team-result-name">{blueName}</div>
                <div className="tobol-team-result-score">{blueScore}</div>
                <div className="tobol-team-result-label">نقطة</div>
              </div>
            </>
          )}
        </div>

        {/* Stats card (Yalla associate_reward_result style) */}
        <div className="tobol-gameover-stats-card">
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>🎯</span>
            </div>
            <div className="tobol-gameover-stat-label">إجمالي التحركات</div>
            <div className="tobol-gameover-stat-value">{totalClicks}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>⚔️</span>
            </div>
            <div className="tobol-gameover-stat-label">هجمات</div>
            <div className="tobol-gameover-stat-value">{attacks}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>💣</span>
            </div>
            <div className="tobol-gameover-stat-label">فخاخ</div>
            <div className="tobol-gameover-stat-value">{traps}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>◍</span>
            </div>
            <div className="tobol-gameover-stat-label">بطاقات فارغة</div>
            <div className="tobol-gameover-stat-value">{emptyCards}</div>
          </div>
        </div>

        {/* Two-button row — Play Again (btn_yes) + Close Game (btn_no) */}
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
