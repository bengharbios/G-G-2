'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFoodWarStore } from '@/lib/foodwar-store';
import { PLAYER_COLORS } from '@/lib/foodwar-types';
import { playClickSound, playBombSound, playWinSound, isMusicEnabled, setMusicEnabled, isSoundEnabled, setSoundEnabled } from '@/lib/sounds';

const STROKE_STYLE: React.CSSProperties = { color: '#feef91', paintOrder: 'stroke fill', WebkitTextStroke: '1px #aa6e1f' };

export default function GameBoard() {
  const router = useRouter();
  const { phase, turnPhase, players, currentRoundData, currentSelectorId, scores, winnerId, gameLog, lastAction, currentRound, totalRounds, spinWheel, selectFood, nextTurn, resetGame, gameMode, roomCode } = useFoodWarStore();
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => { setMusicOn(isMusicEnabled()); setSoundOn(isSoundEnabled()); }, []);
  useEffect(() => { document.body.classList.add('in-game-setup'); return () => { document.body.classList.remove('in-game-setup'); }; }, []);

  const toggleMusic = () => { const n = !musicOn; setMusicOn(n); setMusicEnabled(n); };

  const handleSpin = () => {
    if (soundOn) playClickSound();
    setSpinning(true);
    setTimeout(() => { setSpinning(false); spinWheel(); }, 1500);
  };

  const handleSelectFood = (foodId: number) => {
    if (soundOn) playClickSound();
    selectFood(foodId);
    setTimeout(() => { if (soundOn) playBombSound(); }, 300);
  };

  const handleQuit = () => {
    const st = useFoodWarStore.getState();
    if (st.gameMode === 'diwaniya' && st.roomCode) { try { fetch(`/api/foodwar-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch {} }
    try { if (typeof window !== 'undefined') { localStorage.removeItem('foodwar-game-storage'); localStorage.removeItem('foodwar-game-storage__disconnect_ts'); } } catch {}
    setShowQuitDialog(false);
    window.location.href = '/#game-foodwar';
  };

  const alivePlayers = players.filter(p => p.isAlive);
  const selector = currentSelectorId !== null ? players[currentSelectorId] : null;
  const foodItems = currentRoundData?.foodItems || [];

  return (
    <div dir="rtl" className="tobol-bg" style={{ position: 'relative', minHeight: 'calc(100vh - 56px)', background: 'url(/battle/game_bg.webp) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px 100px', gap: '8px', overflowY: 'auto', fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif' }}>
      {/* Header */}
      <div className="tobol-header-actions">
        <button type="button" className={`tobol-header-btn ${musicOn ? 'active' : ''}`} onClick={toggleMusic} aria-label="الصوت"><img src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sound" style={{ width: '26px', height: '26px' }} /></button>
        <button type="button" className="tobol-header-btn" onClick={() => setShowQuitDialog(true)} aria-label="خروج"><img src="/battle/btn_exit.webp" alt="exit" style={{ width: '26px', height: '26px' }} /></button>
      </div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '44px', padding: '4px 12px', borderRadius: '14px', background: 'rgba(6,42,32,.45)', border: '1px solid rgba(254,239,145,.12)' }}>
        <div style={{ fontSize: '24px' }}>🍕</div>
        <div><h1 style={{ ...STROKE_STYLE, fontSize: '16px', fontWeight: 900, margin: 0, lineHeight: 1.1 }}>حرب الاكلات</h1><div style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 700 }}>الجولة {currentRound + 1}/{totalRounds}</div></div>
      </motion.div>

      {/* Alive players */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '380px', padding: '6px 10px', borderRadius: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {players.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '999px', background: p.isAlive ? `${p.color}20` : 'rgba(0,0,0,.3)', border: `1px solid ${p.isAlive ? p.color + '60' : '#333'}`, opacity: p.isAlive ? 1 : 0.4 }}>
            <span style={{ fontSize: '10px' }}>{p.emoji}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: p.isAlive ? '#fff' : '#666' }}>{p.name}</span>
            {p.isAlive && <span style={{ fontSize: '9px', color: p.color }}>●</span>}
          </div>
        ))}
      </motion.div>

      {/* Last action */}
      {lastAction && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>{lastAction}</motion.p>
      )}

      {/* Game area */}
      {turnPhase === 'spinning' && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
          <motion.div animate={spinning ? { rotate: 360 } : {}} transition={spinning ? { duration: 0.3, repeat: 5, ease: 'linear' } : {}} style={{ fontSize: '60px' }}>🎡</motion.div>
          <p style={{ color: '#9fc4b4', fontSize: '12px', textAlign: 'center' }}>اضغط للدوران واختيار لاعب عشوائي</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSpin} disabled={spinning} className="tobol-start-btn" style={{ padding: '14px 30px', border: 'none', color: '#feef91', fontSize: '17px', fontWeight: 900, cursor: spinning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', paintOrder: 'stroke fill', WebkitTextStroke: '0.5px #aa6e1f', textShadow: '0 2px 6px rgba(0,0,0,.6)' }}>
            <span style={{ fontSize: '18px' }}>{spinning ? '⏳' : '🎡'}</span>
            <span>{spinning ? 'دوران...' : 'اسبين!'}</span>
          </motion.button>
        </motion.div>
      )}

      {turnPhase === 'selecting' && selector && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '380px' }}>
          <div style={{ ...STROKE_STYLE, fontSize: '14px', fontWeight: 800, textAlign: 'center', marginBottom: '4px' }}>
            {selector.emoji} {selector.name} — اختر طعاماً!
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%' }}>
            {foodItems.map(food => (
              <motion.button key={food.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSelectFood(food.id)} disabled={food.revealed} style={{ aspectRatio: '1/1', borderRadius: '12px', border: `2px solid ${food.revealed ? 'rgba(239,68,68,.5)' : 'rgba(254,239,145,.3)'}`, background: food.revealed ? 'rgba(239,68,68,.15)' : 'linear-gradient(135deg, rgba(254,239,145,.15), rgba(170,110,31,.08))', cursor: food.revealed ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', overflow: 'hidden' }}>
                {food.revealed ? (
                  <>
                    <span style={{ fontSize: '20px' }}>❌</span>
                    {food.hiddenPlayerId !== null && players[food.hiddenPlayerId] && (
                      <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>{players[food.hiddenPlayerId].name} خرج!</span>
                    )}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '28px' }}>{food.emoji}</span>
                    <span style={{ fontSize: '9px', color: '#9fc4b4', fontWeight: 600 }}>{food.name}</span>
                  </>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {turnPhase === 'revealing' && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
          {currentRoundData?.eliminatedPlayerId !== null && currentRoundData?.eliminatedPlayerId !== undefined && players[currentRoundData.eliminatedPlayerId] ? (
            <>
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }} style={{ fontSize: '48px' }}>💥</motion.div>
              <p style={{ color: '#f87171', fontSize: '16px', fontWeight: 900 }}>{players[currentRoundData.eliminatedPlayerId].name} خرج!</p>
            </>
          ) : (
            <>
              <motion.div initial={{ scale: 0, rotate: 180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }} style={{ fontSize: '48px' }}>🎉</motion.div>
              <p style={{ color: '#86efac', fontSize: '16px', fontWeight: 900 }}>لا أحد! آمن</p>
            </>
          )}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextTurn} className="tobol-start-btn" style={{ padding: '12px 24px', border: 'none', color: '#feef91', fontSize: '15px', fontWeight: 900, cursor: 'pointer', paintOrder: 'stroke fill', WebkitTextStroke: '0.5px #aa6e1f', textShadow: '0 2px 6px rgba(0,0,0,.6)' }}>
            التالي ←
          </motion.button>
        </motion.div>
      )}

      {/* Game log */}
      {gameLog.length > 0 && (
        <div style={{ width: '100%', maxWidth: '380px', marginTop: '4px' }}>
          <p style={{ fontSize: '10px', color: '#9fc4b4', fontWeight: 700, marginBottom: '4px' }}>📜 السجل:</p>
          <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
            {gameLog.slice(-5).map((entry, i) => (
              <div key={i} style={{ fontSize: '10px', padding: '2px 6px', marginBottom: '2px', borderRadius: '4px', background: entry.type === 'success' ? 'rgba(34,197,94,.1)' : entry.type === 'danger' ? 'rgba(239,68,68,.1)' : entry.type === 'system' ? 'rgba(254,239,145,.1)' : 'rgba(159,196,180,.05)', color: entry.type === 'success' ? '#86efac' : entry.type === 'danger' ? '#f87171' : entry.type === 'system' ? '#feef91' : '#9fc4b4' }}>{entry.message}</div>
            ))}
          </div>
        </div>
      )}

      {/* Quit dialog */}
      {showQuitDialog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowQuitDialog(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.32 }} onClick={(e) => e.stopPropagation()} className="tobol-team-card" style={{ padding: '20px', width: '100%', maxWidth: '300px', textAlign: 'center', borderRadius: '18px' }}>
            <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
            <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>الخروج من اللعبة؟</h3>
            <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>سيتم إنهاء اللعبة نهائياً.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowQuitDialog(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(80,80,80,.3)', color: '#cbd5e1', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
              <button onClick={handleQuit} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,.35)' }}>نعم، اخرج</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
