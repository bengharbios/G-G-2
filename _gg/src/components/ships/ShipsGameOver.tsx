'use client';
import { useShipsStore } from '@/lib/ships-store';
import { useGameRewards } from '@/lib/yalla-game-helpers';

export default function ShipsGameOver() {
  const { playerScore, aiScore, playerHits, aiHits, resetGame } = useShipsStore();
  const won = playerScore > aiScore;
  const { rewards } = useGameRewards(true, 'ships', won ? 'win' : 'loss', 1);

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: 'url(/img/ship/themes/theme1/background.png) center / cover, #0a0b10',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: 'sans-serif',
    }}>
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>{won ? '🏆' : '💀'}</div>
      <h1 style={{ fontSize: '32px', fontWeight: 900, color: won ? '#fbbf24' : '#f87171', marginBottom: '16px' }}>
        {won ? 'فزت!' : 'خسرت'}
      </h1>
      <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#86efac' }}>أنت</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#fbbf24' }}>{playerScore}</p>
          <p style={{ fontSize: '11px', color: '#9fc4b4' }}>{playerHits} إصابات</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#f87171' }}>الخصم</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#f87171' }}>{aiScore}</p>
          <p style={{ fontSize: '11px', color: '#9fc4b4' }}>{aiHits} إصابات</p>
        </div>
      </div>
      {rewards && (
        <div style={{
          background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)',
          borderRadius: '10px', padding: '10px 20px', marginBottom: '20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: '#fbbf24' }}>🎁 المكافآت</p>
          <p style={{ fontSize: '12px', color: '#feef91' }}>+{rewards.xp} خبرة • +{rewards.gold} ذهب</p>
          {rewards.leveledUp && rewards.newLevel && (
            <p style={{ fontSize: '12px', color: '#86efac' }}>🎉 ترقية للمستوى {rewards.newLevel}!</p>
          )}
        </div>
      )}
      <button onClick={() => { resetGame(); window.location.href = '/ships'; }} style={{
        background: 'linear-gradient(135deg, #6366f1, #4338ca)',
        color: '#fff', border: 'none', borderRadius: '10px',
        padding: '12px 24px', fontSize: '14px', fontWeight: 800,
        cursor: 'pointer',
      }}>العب مرة أخرى</button>
      <button onClick={() => { resetGame(); window.location.href = '/'; }} style={{
        background: 'none', border: 'none', color: '#9fc4b4',
        fontSize: '12px', cursor: 'pointer', marginTop: '10px',
      }}>← الرئيسية</button>
    </div>
  );
}
