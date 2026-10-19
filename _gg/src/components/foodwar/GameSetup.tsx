'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFoodWarStore, generateFoodWarRoomCode } from '@/lib/foodwar-store';
import { PLAYER_COLORS, ROUND_COUNT_OPTIONS } from '@/lib/foodwar-types';
import { useInGameSetupMode, useYallaSoundState, STROKE_STYLE } from '@/lib/yalla-game-helpers';

export default function GameSetup() {
  const router = useRouter();
  const { startGame, resetGame, gameMode, roomCode, setRoomCode, setTotalRounds, totalRounds, setGameMode } = useFoodWarStore();
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(8).fill(''));
  const [musicOn, soundOn, toggleMusic, toggleSound] = useYallaSoundState();
  const [showExitDialog, setShowExitDialog] = useState(false);
  useInGameSetupMode();

  useEffect(() => { setTotalRounds(totalRounds); }, [totalRounds, setTotalRounds]);

  // Diwaniya room creation
  useEffect(() => {
    if (gameMode !== 'diwaniya') return;
    if (!useFoodWarStore.getState().roomCode) {
      const code = generateFoodWarRoomCode();
      fetch('/api/foodwar-room', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, hostName: 'العراب' }) }).catch(() => {});
      setRoomCode(code);
    }
  }, [gameMode, setRoomCode]);

  const updatePlayerName = (idx: number, name: string) => {
    const updated = [...playerNames]; updated[idx] = name; setPlayerNames(updated);
  };

  const handleStart = () => {
    const names = playerNames.slice(0, playerCount).map((n, i) => n.trim() || `لاعب ${i + 1}`);
    startGame(names, totalRounds);
  };

  const handleExit = () => {
    const st = useFoodWarStore.getState();
    if (st.gameMode === 'diwaniya' && st.roomCode) { try { fetch(`/api/foodwar-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch {} }
    try { if (typeof window !== 'undefined') { localStorage.removeItem('foodwar-game-storage'); localStorage.removeItem('foodwar-game-storage__disconnect_ts'); } } catch {}
    setShowExitDialog(false);
    window.location.href = '/#game-foodwar';
  };

  const isValid = playerNames.slice(0, playerCount).every(n => n.trim().length > 0 || true); // allow defaults

  return (
    <div dir="rtl" className="tobol-setup-root" style={{ position: 'relative', minHeight: 'calc(100vh - 56px)', background: 'url(/battle/game_bg.webp) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px 30px', gap: '8px', overflowY: 'auto', fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif' }}>
      {/* Header */}
      <div className="tobol-header-actions">
        <button type="button" className={`tobol-header-btn ${musicOn ? 'active' : ''}`} onClick={toggleMusic} aria-label="الصوت"><img src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sound" style={{ width: '26px', height: '26px' }} /></button>
        <button type="button" className="tobol-header-btn" onClick={() => setShowExitDialog(true)} aria-label="خروج"><img src="/battle/btn_exit.webp" alt="exit" style={{ width: '26px', height: '26px' }} /></button>
      </div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -12, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }} style={{ textAlign: 'center', marginTop: '50px', marginBottom: '4px' }}>
        <div style={{ fontSize: '48px', marginBottom: '6px' }}>🍕</div>
        <h1 style={{ ...STROKE_STYLE, fontSize: '22px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: '2px 0 0', lineHeight: 1 }}>حرب الاكلات</h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Food War — آخر ناجي يفوز</p>
      </motion.div>

      {/* Pill */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '999px', background: 'rgba(6,42,32,.65)', border: '1px solid rgba(254,239,145,.18)' }}>
        <span style={{ fontSize: '13px' }}>🍕</span><span style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px' }}>تجهيز المعركة</span>
      </motion.div>

      {/* Diwaniya loading */}
      {gameMode === 'diwaniya' && !roomCode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '380px', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '20px' }}>📡</motion.div>
          <span style={{ color: '#9fc4b4', fontSize: '12px', fontWeight: 700 }}>جاري إنشاء غرفة الديوانية...</span>
        </motion.div>
      )}

      {/* Diwaniya share card */}
      {gameMode === 'diwaniya' && roomCode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '380px', padding: '10px 14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>📡 شارك الغرفة مع أصدقائك</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,.4)', border: '1px solid rgba(254,239,145,.3)', borderRadius: '8px', padding: '8px 12px' }}>
            <span style={{ ...STROKE_STYLE, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>كود:</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '20px', fontWeight: 900, color: '#feef91', letterSpacing: '3px', flex: 1, textAlign: 'center' }}>{roomCode}</span>
          </div>
          <p style={{ fontSize: '10px', color: '#9fc4b4', textAlign: 'center', fontWeight: 600 }}>💡 شارك الكود مع أصدقائك للمشاهدة</p>
        </motion.div>
      )}

      {/* Player count */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '380px', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>👥</span>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>اللاعبون</span>
        <div style={{ flex: 1, display: 'flex', gap: '4px', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {[2, 3, 4, 5, 6, 7, 8].map((count) => (
            <button key={count} onClick={() => setPlayerCount(count)} style={{ flex: '1 1 32px', padding: '5px 4px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, border: playerCount === count ? '1px solid rgba(254,239,145,.55)' : '1px solid rgba(255,255,255,.1)', background: playerCount === count ? 'rgba(254,239,145,.12)' : 'rgba(0,0,0,.25)', color: playerCount === count ? '#feef91' : '#9fc4b4' }}>{count}</button>
          ))}
        </div>
      </motion.div>

      {/* Player names */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
        {Array.from({ length: playerCount }).map((_, idx) => {
          const pc = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '10px', background: `${pc.color}10`, border: `1px solid ${pc.color}40` }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `${pc.color}40`, border: `1px solid ${pc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '10px' }}>{pc.emoji}</span>
              </div>
              <input type="text" value={playerNames[idx]} onChange={(e) => updatePlayerName(idx, e.target.value)} placeholder={`لاعب ${idx + 1}`} maxLength={20} dir="rtl" style={{ flex: 1, background: 'rgba(0,0,0,.35)', border: `1px solid ${pc.color}33`, borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '6px 10px', textAlign: 'right', outline: 'none' }} />
            </div>
          );
        })}
      </motion.div>

      {/* Rounds */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ width: '100%', maxWidth: '380px', display: 'flex', gap: '6px' }}>
        {ROUND_COUNT_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setTotalRounds(opt.value)} style={{ flex: 1, padding: '8px 4px', borderRadius: '10px', border: `1.5px solid ${totalRounds === opt.value ? 'rgba(254,239,145,.65)' : 'rgba(255,255,255,.12)'}`, background: totalRounds === opt.value ? 'linear-gradient(135deg, rgba(254,239,145,.18), rgba(170,110,31,.08))' : 'rgba(6,42,32,.55)', color: totalRounds === opt.value ? '#feef91' : '#9fc4b4', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '15px' }}>{opt.value === 1 ? '🎯' : opt.value === 3 ? '🔥' : '🏆'}</span>
            {opt.label}
          </button>
        ))}
      </motion.div>

      {/* Start button */}
      <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleStart} className="tobol-start-btn" style={{ width: '100%', maxWidth: '380px', padding: '14px 16px', border: 'none', color: '#feef91', fontSize: '17px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', paintOrder: 'stroke fill', WebkitTextStroke: '0.5px #aa6e1f', textShadow: '0 2px 6px rgba(0,0,0,.6)', marginTop: '6px' }}>
        <span className="tobol-start-icon"><span style={{ fontSize: '18px' }}>🍕</span></span>
        <span>ابدأ حرب الاكلات!</span>
      </motion.button>

      {/* Exit dialog */}
      {showExitDialog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitDialog(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.32 }} onClick={(e) => e.stopPropagation()} className="tobol-team-card" style={{ padding: '20px', width: '100%', maxWidth: '300px', textAlign: 'center', borderRadius: '18px' }}>
            <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
            <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>الخروج من اللعبة؟</h3>
            <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>سيتم إنهاء اللعبة نهائياً. هل أنت متأكد؟</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowExitDialog(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(80,80,80,.3)', color: '#cbd5e1', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
              <button onClick={handleExit} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,.35)' }}>نعم، اخرج</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
