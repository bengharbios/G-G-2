'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFoodWarStore } from '@/lib/foodwar-store';
import { useGameRewards } from '@/lib/yalla-game-helpers';

const STROKE_STYLE: React.CSSProperties = { color: '#feef91', paintOrder: 'stroke fill', WebkitTextStroke: '1px #aa6e1f' };

export default function FoodWarGameOver() {
  const router = useRouter();
  const { players, winnerId, scores, resetGame, gameMode, roomCode } = useFoodWarStore();
  const { godfather, rewards } = useGameRewards(true, 'foodwar', 'win', 1);

  useEffect(() => {
    document.body.classList.add('in-game-setup');
    return () => { document.body.classList.remove('in-game-setup'); };
  }, []);

  const winner = winnerId !== null ? players[winnerId] : null;
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  const handlePlayAgain = () => { resetGame(); };
  const handleCloseGame = () => {
    try { localStorage.removeItem('foodwar-game-storage'); } catch {}
    resetGame();
    window.location.href = '/#game-foodwar';
  };

  return (
    <div dir="rtl" className="tobol-bg" style={{ minHeight: 'calc(100vh - 56px)', background: 'url(/battle/game_bg.webp) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '16px' }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} style={{ fontSize: '60px' }}>🏆</motion.div>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...STROKE_STYLE, fontSize: '24px', fontWeight: 900, textAlign: 'center' }}>
        {winner ? `🎉 فاز ${winner.name}!` : '🎉 انتهت اللعبة!'}
      </motion.h1>
      {rewards && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: 'flex', gap: '12px' }}>
          {rewards.xp > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)' }}><span style={{ fontSize: '14px' }}>⚡</span><span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 800 }}>+{rewards.xp} XP</span></div>}
          {rewards.gold > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)' }}><span style={{ fontSize: '14px' }}>🪙</span><span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 800 }}>+{rewards.gold}</span></div>}
        </motion.div>
      )}
      {/* Score table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '300px', padding: '12px', borderRadius: '12px' }}>
        {sorted.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
            <span style={{ fontSize: '12px', color: i === 0 ? '#fbbf24' : '#9fc4b4', fontWeight: 900 }}>#{i + 1}</span>
            <span style={{ fontSize: '12px' }}>{p.emoji}</span>
            <span style={{ flex: 1, fontSize: '12px', color: p.isAlive ? '#fff' : '#666', fontWeight: 700 }}>{p.name}</span>
            <span style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 900 }}>{scores[p.id] || 0}</span>
          </div>
        ))}
      </motion.div>
      {/* Buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handlePlayAgain} className="tobol-start-btn" style={{ padding: '12px 20px', border: 'none', color: '#feef91', fontSize: '15px', fontWeight: 900, cursor: 'pointer', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', paintOrder: 'stroke fill', WebkitTextStroke: '0.5px #aa6e1f', textShadow: '0 2px 6px rgba(0,0,0,.6)' }}>🔄 إعادة</button>
        <button onClick={handleCloseGame} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(80,80,80,.3)', color: '#cbd5e1', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>✕ إغلاق</button>
      </motion.div>
    </div>
  );
}
