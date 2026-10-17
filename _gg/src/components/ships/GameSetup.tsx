'use client';
import { useShipsStore } from '@/lib/ships-store';

export default function GameSetup() {
  const { themeId, setThemeId, startGame, resetGame } = useShipsStore();
  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center tobol-bg" style={{ background: `url(/img/ship/themes/theme${themeId}/background.png) center / cover, #0a0b10` }}>
      <h1 style={{ color: '#feef91', fontSize: '24px', fontWeight: 900, marginBottom: '20px' }}>تجهيز المعركة</h1>
      <p style={{ color: '#9fc4b4', fontSize: '13px', marginBottom: '20px' }}>اختر الثيم:</p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {[1, 2].map(t => (
          <button key={t} onClick={() => setThemeId(t)} style={{
            width: '120px', height: '80px', borderRadius: '10px',
            border: themeId === t ? '3px solid #fbbf24' : '1px solid rgba(255,255,255,.2)',
            background: `url(/img/ship/themes/theme${t}/board_background.png) center / cover`,
            cursor: 'pointer', overflow: 'hidden',
          }}>
            <div style={{
              background: themeId === t ? 'rgba(251,191,36,.2)' : 'rgba(0,0,0,.5)',
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '14px', fontWeight: 800,
            }}>
              {t === 1 ? 'بحري' : 'جوي'}
            </div>
          </button>
        ))}
      </div>
      <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '8px' }}>
        {themeId === 1 ? 'حاملة طائرات + غواصة + مدمرة + بارجة + زورق' : 'مقاتلة + مروحية + دبابة + معسكر + مصفحة'}
      </p>
      <button onClick={startGame} style={{
        background: 'linear-gradient(135deg, #fbbf24, #aa6e1f)',
        color: '#000', border: 'none', borderRadius: '12px',
        padding: '14px 30px', fontSize: '18px', fontWeight: 900,
        cursor: 'pointer', width: '250px',
      }}>⚔️ ابدأ المعركة</button>
      <button onClick={() => { resetGame(); window.location.href = '/ships'; }} style={{
        background: 'none', border: 'none', color: '#9fc4b4',
        fontSize: '12px', cursor: 'pointer', marginTop: '20px',
      }}>← العودة</button>
    </div>
  );
}
