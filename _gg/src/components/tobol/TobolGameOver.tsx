'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTobolStore } from '@/lib/tobol-store';
import { useRouter } from 'next/navigation';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

// Confetti particles for the winner
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#feef91'];
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      rotate: Math.random() * 720,
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
          className="tobol-confetti-piece"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            left: `${p.x}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function TobolGameOver() {
  const router = useRouter();
  const { redName, blueName, redScore, blueScore, resetGame, gameMode, roomCode } = useTobolStore();

  // Godfather (host) info + rewards
  const [godfather, setGodfather] = useState<{ name: string; avatar: string } | null>(null);
  const [rewards, setRewards] = useState<{ xp: number; gold: number; leveledUp: boolean; newLevel: number | null } | null>(null);
  const [rewardLoading, setRewardLoading] = useState(false);

  // Determine winner
  const winner: 'red' | 'blue' | 'draw' = redScore > blueScore ? 'red' : blueScore > redScore ? 'blue' : 'draw';
  const winnerName = winner === 'red' ? redName : winner === 'blue' ? blueName : 'تعادل!';
  const loserName = winner === 'red' ? blueName : winner === 'blue' ? redName : '';
  const winnerScore = winner === 'red' ? redScore : winner === 'blue' ? blueScore : 0;
  const loserScore = winner === 'red' ? blueScore : winner === 'blue' ? redScore : 0;
  const scoreDiff = Math.abs(redScore - blueScore);

  // Apply body.in-game-setup so header chrome + bottom nav stay hidden on game over too
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
        // 1) Get user info (avatar + displayName)
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (cancelled) return;
        if (meData.success && meData.user) {
          const u = meData.user;
          const avatarUrl = u.avatar || `/yalla-avatars/defaultPhoto_${((parseInt(u.id || '0', 10) || 0) % 12) + 1}.png`;
          setGodfather({ name: u.displayName || u.username || 'العراب', avatar: avatarUrl });
        }

        // 2) Award rewards — only when there is a clear winner (not draw)
        if (winner !== 'draw' && !rewardLoading) {
          setRewardLoading(true);
          try {
            const rewardRes = await fetch('/api/game/reward', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameSlug: 'tobol',
                outcome: 'win',
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
              // Reason: not_logged_in, daily_limit_reached, etc. — show 0 / no rewards
              setRewards({ xp: 0, gold: 0, leveledUp: false, newLevel: null });
            }
          } catch {
            if (!cancelled) setRewards({ xp: 0, gold: 0, leveledUp: false, newLevel: null });
          } finally {
            if (!cancelled) setRewardLoading(false);
          }
        } else if (winner === 'draw') {
          // Draw — still award play XP
          try {
            const rewardRes = await fetch('/api/game/reward', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameSlug: 'tobol',
                outcome: 'play',
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
        }
      } catch {
        // silent
      }
    }
    fetchGodfatherAndReward();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    router.push('/tobol');
  };

  return (
    <div className="tobol-gameover-root">
      {/* Confetti for clear winner */}
      {winner !== 'draw' && <Confetti />}

      {/* Trophy / Result card */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="tobol-gameover-trophy-card"
      >
        {/* Trophy image (shield + crossed swords from yalla source) */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img
            src="/battle/btn_winner_rewards.webp"
            alt="winner"
            className="tobol-gameover-trophy-img"
          />
        </motion.div>

        {/* Title — winner or draw */}
        <h1 className="tobol-gameover-title">
          {winner === 'draw' ? '🤝 تعادل!' : `🏆 الفائز: ${winnerName}`}
        </h1>
        <p className="tobol-gameover-subtitle">
          {winner === 'draw'
            ? 'الفرقان متعادلان بالنقاط'
            : `فاز بفارق ${scoreDiff} نقطة`}
        </p>

        {/* Godfather row */}
        <div className="tobol-godfather-row">
          <div className="tobol-godfather-avatar">
            <span className="tobol-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '20px' }}>🥁</span>
            )}
          </div>
          <div className="tobol-godfather-info">
            <div className="tobol-godfather-name">
              {godfather?.name || 'العراب'}
            </div>
            <span className="tobol-godfather-tag">العراب</span>
          </div>
        </div>

        {/* Reward chips: XP + Gold */}
        <div className="tobol-reward-row">
          <div className="tobol-reward-chip">
            <img src="/yalla-ui/exp.png" alt="xp" />
            <span className="reward-amount">
              {rewards ? `+${rewards.xp}` : '...'}
            </span>
            <span>XP</span>
          </div>
          <div className="tobol-reward-chip">
            <img src="/yalla-ui/coin.webp" alt="gold" />
            <span className="reward-amount">
              {rewards ? `+${rewards.gold}` : '...'}
            </span>
            <span>ذهب</span>
          </div>
        </div>

        {rewards?.leveledUp && rewards.newLevel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              marginTop: '8px',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 800,
              textShadow: '0 1px 2px rgba(0,0,0,.6)',
            }}
          >
            🎉 ترقية للمستوى {rewards.newLevel}!
          </motion.div>
        )}
      </motion.div>

      {/* Teams comparison */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="tobol-teams-row"
        >
          {/* Winner (left side) */}
          {winner !== 'draw' && (
            <>
              <div className={`tobol-team-result-card team-${winner} winner`}>
                <div className="tobol-team-result-rank">🏆</div>
                <div className="tobol-team-result-name">{winnerName}</div>
                <div className="tobol-team-result-score">{winnerScore}</div>
                <div className="tobol-team-result-label">نقطة — فائز</div>
              </div>
              <div className={`tobol-team-result-card team-${winner === 'red' ? 'blue' : 'red'} loser`}>
                <div className="tobol-team-result-rank">💀</div>
                <div className="tobol-team-result-name">{loserName}</div>
                <div className="tobol-team-result-score">{loserScore}</div>
                <div className="tobol-team-result-label">نقطة — خاسر</div>
              </div>
            </>
          )}
          {winner === 'draw' && (
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
        </motion.div>
      </AnimatePresence>

      {/* Play again button — Yalla style */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handlePlayAgain}
        className="tobol-play-again-btn"
      >
        <span style={{ fontSize: '16px' }}>🔄</span>
        <span>العب مرة أخرى</span>
      </motion.button>
    </div>
  );
}
