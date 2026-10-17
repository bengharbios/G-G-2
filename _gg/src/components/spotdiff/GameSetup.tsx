'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSpotDiffStore, generateSpotDiffRoomCode } from '@/lib/spotdiff-store';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
} from '@/lib/sounds';
import {
  Difficulty,
  DIFFICULTY_CONFIG,
  ROUND_COUNT_OPTIONS,
} from '@/lib/spotdiff-types';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

export default function GameSetup() {
  const router = useRouter();
  const {
    setPlayerName, setDifficulty, setTotalRounds,
    startGame, resetGame, gameMode, setRoomCode,
    difficulty, totalRounds,
    loadFlashiCatalog,
  } = useSpotDiffStore();

  const [playerName, setPlayerNameState] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => {
      document.body.classList.remove('in-game-setup');
    };
  }, []);

  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  // Preload flashi catalog in the background so startGame has it ready
  useEffect(() => {
    loadFlashiCatalog().catch(() => {});
  }, [loadFlashiCatalog]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // For diwaniya mode: create room on mount
  useEffect(() => {
    if (gameMode !== 'diwaniya') return;
    if (!useSpotDiffStore.getState().roomCode) {
      const code = generateSpotDiffRoomCode();
      fetch('/api/spotdiff-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, hostName: playerName || 'العراب' }),
      }).catch(() => {});
      setRoomCode(code);
    }
  }, [gameMode, setRoomCode, playerName]);

  const [catalogLoading, setCatalogLoading] = useState(false);
  const handleStart = async () => {
    const name = playerName.trim() || 'اللاعب';
    setPlayerName(name);
    setDifficulty(difficulty);
    setTotalRounds(totalRounds);
    // Ensure flashi catalog is loaded before generating rounds
    setCatalogLoading(true);
    try { await loadFlashiCatalog(); } catch (e) { /* ignore — fallback to SVG */ }
    setCatalogLoading(false);
    startGame();
  };

  const handleExit = () => {
    resetGame();
    router.push('/');
  };

  const isValid = (playerName.trim().length > 0);

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        height: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 16px',
        gap: '10px',
        overflow: 'hidden',
      }}
    >
      {/* ══════════ Header actions: sound + exit ══════════ */}
      <div className="tobol-header-actions">
        <button
          type="button"
          className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
          onClick={toggleMusic}
          aria-label={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          title={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
        >
          <img
            src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'}
            alt="sound"
          />
        </button>
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowExitDialog(true)}
          aria-label="خروج"
          title="خروج"
        >
          <img src="/battle/btn_exit.webp" alt="exit" />
        </button>
      </div>

      {/* ══════════ Title ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ fontSize: '40px' }}>🔍</div>
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              background: 'radial-gradient(circle, rgba(254,239,145,.22), transparent 65%)',
              filter: 'blur(6px)',
              zIndex: -1,
              borderRadius: '50%',
            }}
          />
        </div>
        <h1
          style={{
            ...STROKE_STYLE,
            fontSize: '22px',
            fontWeight: 900,
            textShadow: '0 2px 4px rgba(0,0,0,.85)',
            margin: '2px 0 0',
            lineHeight: 1,
          }}
        >
          اختلاف الصور
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Spot the Difference 🔍
        </p>
      </motion.div>

      {/* ══════════ "تجهيز اللعبة" pill ══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'rgba(6,42,32,.65)',
          border: '1px solid rgba(254,239,145,.18)',
        }}
      >
        <span style={{ fontSize: '13px' }}>🔍</span>
        <span
          style={{
            ...STROKE_STYLE,
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.4px',
          }}
        >
          تجهيز اللعبة
        </span>
      </motion.div>

      {/* ══════════ Player name input ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="tobol-score-frame"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '4px',
        }}
      >
        <div
          style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(254,239,145,.22), rgba(170,110,31,.08))',
            border: '1px solid rgba(254,239,145,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '14px' }}>🧑</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>
          اسمك
        </span>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerNameState(e.target.value)}
          placeholder="اكتب اسمك هنا..."
          maxLength={20}
          dir="rtl"
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            textAlign: 'right',
            width: '100%',
          }}
        />
      </motion.div>

      {/* ══════════ Round count selector ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '6px',
        }}
      >
        {ROUND_COUNT_OPTIONS.map((opt) => {
          const selected = totalRounds === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTotalRounds(opt.value)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: '10px',
                border: `1.5px solid ${selected ? 'rgba(254,239,145,.65)' : 'rgba(255,255,255,.12)'}`,
                background: selected
                  ? 'linear-gradient(135deg, rgba(254,239,145,.18), rgba(170,110,31,.08))'
                  : 'rgba(6,42,32,.55)',
                color: selected ? '#feef91' : '#9fc4b4',
                fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                boxShadow: selected ? '0 0 10px rgba(254,239,145,.2)' : 'none',
              }}
            >
              <span style={{ fontSize: '16px' }}>{opt.value === 3 ? '🎯' : opt.value === 5 ? '🔥' : '🏆'}</span>
              {opt.label}
            </button>
          );
        })}
      </motion.div>

      {/* ══════════ Difficulty selector ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '6px',
        }}
      >
        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
          const cfg = DIFFICULTY_CONFIG[d];
          const selected = difficulty === d;
          const color = d === 'easy' ? '#34d399' : d === 'medium' ? '#fbbf24' : '#ef4444';
          return (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: '10px',
                border: `1.5px solid ${selected ? color + 'AA' : 'rgba(255,255,255,.12)'}`,
                background: selected
                  ? `linear-gradient(135deg, ${color}26, ${color}0d)`
                  : 'rgba(6,42,32,.55)',
                color: selected ? color : '#9fc4b4',
                fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                boxShadow: selected ? `0 0 10px ${color}33` : 'none',
              }}
            >
              <span style={{ fontSize: '14px' }}>{cfg.timePerRoundSec}s</span>
              {cfg.label}
            </button>
          );
        })}
      </motion.div>

      {/* ══════════ Start button ══════════ */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.3 }}
        whileHover={isValid ? { scale: 1.02 } : {}}
        whileTap={isValid ? { scale: 0.97 } : {}}
        onClick={handleStart}
        disabled={!isValid}
        className="tobol-start-btn"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '14px 16px',
          border: 'none',
          color: '#feef91',
          fontSize: '17px',
          fontWeight: 900,
          cursor: isValid ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          paintOrder: 'stroke fill',
          WebkitTextStroke: '0.5px #aa6e1f',
          textShadow: '0 2px 6px rgba(0,0,0,.6)',
          marginTop: '6px',
        }}
      >
        <span className="tobol-start-icon">
          <span style={{ fontSize: '18px' }}>🔍</span>
        </span>
        <span>ابدأ اللعبة</span>
      </motion.button>

      {/* ══════════ Exit dialog ══════════ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #0e2a22, #061812)',
                border: '1.5px solid rgba(254,239,145,.25)',
                borderRadius: '18px', padding: '20px', width: '100%', maxWidth: '300px',
                textAlign: 'center', boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                الخروج من اللعبة؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء الجلسة وعدم حفظ أي تقدم. هل أنت متأكد؟
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowExitDialog(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)',
                    background: 'rgba(80,80,80,.3)', color: '#cbd5e1',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  }}
                >إلغاء</button>
                <button
                  onClick={handleExit}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,.35)',
                  }}
                >نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
