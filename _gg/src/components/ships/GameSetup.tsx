'use client';
import { useState, useEffect } from 'react';
import { useShipsStore } from '@/lib/ships-store';
import { SHIP_TYPES_THEME_1, SHIP_TYPES_THEME_2 } from '@/lib/ships-types';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

export default function GameSetup() {
  const router = useRouter();
  const { themeId, setThemeId, startGame, resetGame, roomCode, gameMode, setRoomCode, playMode, setPlayMode } = useShipsStore();
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && roomCode) {
      setShareLink(`${window.location.origin}/r/ships/${roomCode}`);
    }
  }, [roomCode]);

  useEffect(() => {
    if (gameMode === 'diwaniya' && !roomCode) {
      const code = Array.from('ABCDEFGHJKLMNPQRSTUVWXYZ23456789').sort(() => Math.random() - 0.5).slice(0, 6).join('');
      fetch('/api/ships-room', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, hostName: 'العراب' }) }).catch(() => {});
      setRoomCode(code);
    }
  }, [gameMode, roomCode, setRoomCode]);

  const handleCopy = async () => {
    if (!shareLink) return;
    try { await navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  useEffect(() => { if (gameMode === 'diwaniya') setPlayMode('teams'); }, [gameMode, setPlayMode]);

  const themeShips = themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2;

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: `url(/img/ship/themes/theme${themeId}/background.png) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 30px',
        gap: '8px',
        overflowY: 'auto',
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
      }}
    >
      {/* Header */}
      <div className="tobol-header-actions">
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => { resetGame(); router.push('/ships'); }}
          aria-label="خروج"
          title="خروج"
        >
          <img src="/battle/btn_exit.webp" alt="exit" style={{ width: '26px', height: '26px' }} />
        </button>
      </div>

      {/* Title + image */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '50px', marginBottom: '4px' }}
      >
        <img
          src="/yalla-games/ships.png"
          alt="سفن"
          draggable={false}
          style={{ width: '140px', height: '112px', objectFit: 'contain', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.5))', marginBottom: '6px' }}
        />
        <h1 style={{ ...STROKE_STYLE, fontSize: '22px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: '2px 0 0', lineHeight: 1 }}>
          سفن
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Battleship — ضع أسطولك وقصف سفن الخصم
        </p>
      </motion.div>

      {/* "تجهيز المعركة" pill */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '4px 14px', borderRadius: '999px',
          background: 'rgba(6,42,32,.65)', border: '1px solid rgba(254,239,145,.18)',
        }}
      >
        <span style={{ fontSize: '13px' }}>🚢</span>
        <span style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px' }}>
          تجهيز المعركة
        </span>
      </motion.div>

      {/* Theme selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="tobol-team-card"
        style={{ width: '100%', maxWidth: '380px', padding: '12px', borderRadius: '12px' }}
      >
        <div style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 800, textAlign: 'center', marginBottom: '10px' }}>
          🎨 اختر الثيم
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {[1, 2].map(t => (
            <button
              key={t}
              onClick={() => setThemeId(t)}
              style={{
                width: '130px', height: '80px', borderRadius: '10px',
                border: themeId === t ? '3px solid #fbbf24' : '1px solid rgba(255,255,255,.2)',
                background: `url(/img/ship/themes/theme${t}/board_background.png) center / cover`,
                cursor: 'pointer', overflow: 'hidden', padding: 0,
                boxShadow: themeId === t ? '0 0 16px rgba(251,191,36,.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                background: themeId === t ? 'rgba(251,191,36,.15)' : 'rgba(0,0,0,.5)',
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#feef91', fontSize: '14px', fontWeight: 900,
                paintOrder: 'stroke fill',
                WebkitTextStroke: '1px #aa6e1f',
              }}>
                {t === 1 ? '⚓ بحري' : '✈️ جوي'}
              </div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(0,0,0,.4)', borderRadius: '8px', border: '1px solid rgba(254,239,145,.15)' }}>
          <p style={{ ...STROKE_STYLE, fontSize: '11px', fontWeight: 700, textAlign: 'center', marginBottom: '6px' }}>
            أسطولك ({themeShips.length} سفن):
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
            {themeShips.map(s => (
              <span key={s.id} style={{
                background: 'rgba(99,102,241,.2)', border: '1px solid rgba(99,102,241,.4)',
                borderRadius: '4px', padding: '2px 6px', fontSize: '9px',
                color: '#a5b4fc', fontWeight: 700,
              }}>
                {s.name} ({s.length})
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Diwaniya share card */}
      {gameMode === 'diwaniya' && roomCode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="tobol-team-card"
          style={{ width: '100%', maxWidth: '380px', padding: '10px 14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <div style={{ color: '#feef91', paintOrder: 'stroke fill', WebkitTextStroke: '1px #aa6e1f', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
            📡 شارك الغرفة مع أصدقائك
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,.4)', border: '1px solid rgba(254,239,145,.3)', borderRadius: '8px', padding: '8px 12px' }}>
            <span style={{ color: '#feef91', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>كود:</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '20px', fontWeight: 900, color: '#feef91', letterSpacing: '3px', flex: 1, textAlign: 'center' }}>{roomCode}</span>
          </div>
          <button onClick={handleCopy} style={{
            width: '100%', background: 'rgba(8,28,22,.85)', border: '1px solid rgba(254,239,145,.25)',
            borderRadius: '6px', padding: '8px 10px', color: copied ? '#86efac' : '#feef91',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer', textAlign: 'center',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }} title={shareLink}>
            {copied ? '✓ تم نسخ الرابط' : '🔗 نسخ رابط المشاهدة'}
          </button>
          <p style={{ fontSize: '10px', color: '#9fc4b4', textAlign: 'center', fontWeight: 600 }}>
            💡 من يفتح الرابط يشاهد المعركة مباشرة
          </p>
        </motion.div>
      )}

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={startGame}
        className="tobol-start-btn"
        style={{
          width: '100%', maxWidth: '380px', padding: '14px 16px', border: 'none',
          color: '#feef91', fontSize: '17px', fontWeight: 900, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          paintOrder: 'stroke fill', WebkitTextStroke: '0.5px #aa6e1f',
          textShadow: '0 2px 6px rgba(0,0,0,.6)', marginTop: '6px',
        }}
      >
        <span style={{ fontSize: '18px' }}>⚔️</span>
        <span>ابدأ المعركة</span>
      </motion.button>
    </div>
  );
}
