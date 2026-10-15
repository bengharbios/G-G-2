'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRisk2Store } from '@/lib/risk2-store';
import { TARGET_SCORE_OPTIONS } from '@/lib/risk2-types';
import type { Risk2Player } from '@/lib/risk2-types';
import { useInGameSetupMode, useYallaSoundState, STROKE_STYLE } from '@/lib/yalla-game-helpers';

// ============================================================
// Counter Stepper — for adjusting card counts
// ============================================================
function CounterStepper({
  label, emoji, value, min, max, onChange, color,
}: {
  label: string;
  emoji: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 10px', borderRadius: '8px',
      border: `1px solid ${color}33`,
      background: `${color}10`,
    }}>
      <span style={{ fontSize: '14px' }}>{emoji}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', flex: 1 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.15)',
            color: '#cbd5e1', fontWeight: 700, fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: value <= min ? 'not-allowed' : 'pointer',
            opacity: value <= min ? 0.3 : 1, padding: 0,
          }}
        >−</motion.button>
        <span style={{ width: '22px', textAlign: 'center', fontSize: '12px', fontWeight: 900, color: '#fff' }}>{value}</span>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.15)',
            color: '#cbd5e1', fontWeight: 700, fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: value >= max ? 'not-allowed' : 'pointer',
            opacity: value >= max ? 0.3 : 1, padding: 0,
          }}
        >+</motion.button>
      </div>
    </div>
  );
}

// ============================================================
// Game Setup — المجازفة 2
// ============================================================
export default function GameSetup() {
  const router = useRouter();
  const { startGame, gameMode, setPhase, resetGame } = useRisk2Store();

  const [targetScore, setTargetScore] = useState(50);
  const [bombCount, setBombCount] = useState(2);
  const [skipCount, setSkipCount] = useState(1);
  const [doubleCount, setDoubleCount] = useState(1);
  const [tripleCount, setTripleCount] = useState(1);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [error, setError] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);

  const totalSpecialCards = bombCount + skipCount + doubleCount + tripleCount;
  const totalCards = 45 + totalSpecialCards;

  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();

  const addPlayer = () => {
    if (playerNames.length >= 20) return;
    setPlayerNames([...playerNames, '']);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length <= 2) return;
    setPlayerNames(playerNames.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    setError('');
    const validNames = playerNames.map(n => n.trim()).filter(n => n.length > 0);
    if (validNames.length < 2) {
      setError('يجب إدخال اسمين على الأقل');
      return;
    }
    const uniqueNames = new Set(validNames);
    if (uniqueNames.size !== validNames.length) {
      setError('الأسماء يجب أن تكون مختلفة');
      return;
    }

    const players: Risk2Player[] = validNames.map((name, i) => ({
      id: `player_${i}`,
      name,
      score: 0,
      roundScore: 0,
      multiplier: 1,
      joinOrder: i,
    }));

    startGame(
      { targetScore, bombCount, skipCount, doubleCount, tripleCount },
      players,
    );
  };

  const handleExit = () => {
    resetGame();
    router.push('/');
  };

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
      {/* ══════════ Header ══════════ */}
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
          <img
            src="/yalla-games/risk2.png"
            alt="المجازفة 2"
            style={{
              width: '76px', height: '64px', objectFit: 'contain',
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.55))',
            }}
          />
          <div style={{
            position: 'absolute', inset: '-12px',
            background: 'radial-gradient(circle, rgba(254,239,145,.22), transparent 65%)',
            filter: 'blur(6px)', zIndex: -1, borderRadius: '50%',
          }} />
        </div>
        <h1 style={{ ...STROKE_STYLE, fontSize: '22px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: '2px 0 0', lineHeight: 1 }}>
          المجازفة 2
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Risk 2 — Color & multiplier cards 🎰
        </p>
      </motion.div>

      {/* ══════════ "تجهيز المعركة" pill ══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '4px 14px', borderRadius: '999px',
          background: 'rgba(6,42,32,.65)',
          border: '1px solid rgba(254,239,145,.18)',
        }}
      >
        <span style={{ fontSize: '13px' }}>🎴</span>
        <span style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px' }}>
          تجهيز المجازفة
        </span>
        <span style={{ fontSize: '9px', color: '#9fc4b4' }}>
          ({gameMode === 'diwaniya' ? 'ديوانية' : 'عراب'})
        </span>
      </motion.div>

      {/* ══════════ Target Score frame ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.3 }}
        className="tobol-score-frame"
        style={{
          width: '100%', maxWidth: '380px',
          padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: '10px',
          marginTop: '4px',
        }}
      >
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(254,239,145,.22), rgba(170,110,31,.08))',
          border: '1px solid rgba(254,239,145,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '14px' }}>🏆</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>
          الهدف
        </span>
        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
          {TARGET_SCORE_OPTIONS.map((score) => (
            <button
              key={score}
              onClick={() => setTargetScore(score)}
              style={{
                flex: 1, padding: '5px 4px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '11px', fontWeight: 800,
                border: targetScore === score
                  ? '1px solid rgba(254,239,145,.55)'
                  : '1px solid rgba(255,255,255,.1)',
                background: targetScore === score ? 'rgba(254,239,145,.12)' : 'rgba(0,0,0,.25)',
                color: targetScore === score ? '#feef91' : '#9fc4b4',
              }}
            >{score}</button>
          ))}
        </div>
      </motion.div>

      {/* ══════════ Special card counts frame ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="tobol-score-frame"
        style={{
          width: '100%', maxWidth: '380px',
          padding: '8px 14px',
          display: 'flex', flexDirection: 'column', gap: '6px',
          marginTop: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(254,239,145,.22), rgba(170,110,31,.08))',
            border: '1px solid rgba(254,239,145,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px' }}>🃏</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>
            البطاقات الخاصة
          </span>
          <span style={{ fontSize: '10px', color: '#9fc4b4', marginRight: 'auto' }}>
            {totalSpecialCards} خاصة / 45 رقم
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <CounterStepper label="قنبلة" emoji="💣" value={bombCount} min={0} max={5} onChange={setBombCount} color="#ef4444" />
          <CounterStepper label="تخطي" emoji="⏭️" value={skipCount} min={0} max={5} onChange={setSkipCount} color="#94a3b8" />
          <CounterStepper label="مضاعف ×2" emoji="✨" value={doubleCount} min={0} max={5} onChange={setDoubleCount} color="#fcd34d" />
          <CounterStepper label="مضاعف ×3" emoji="🔥" value={tripleCount} min={0} max={5} onChange={setTripleCount} color="#fbbf24" />
        </div>
        <p style={{ fontSize: '10px', color: '#9fc4b4', textAlign: 'center', marginTop: '4px' }}>
          إجمالي البطاقات: {totalCards}
        </p>
      </motion.div>

      {/* ══════════ Players list ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.3 }}
        style={{
          width: '100%', maxWidth: '380px',
          display: 'flex', flexDirection: 'column', gap: '4px',
          marginTop: '2px', maxHeight: '160px', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontSize: '12px' }}>👥</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9fc4b4' }}>
            اللاعبون ({playerNames.length})
          </span>
        </div>
        {playerNames.map((name, index) => (
          <div key={index} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#9fc4b4', width: '16px', textAlign: 'center' }}>
              {index + 1}
            </span>
            <input
              type="text"
              placeholder={`اسم اللاعب ${index + 1}`}
              value={name}
              onChange={(e) => updateName(index, e.target.value)}
              maxLength={20}
              dir="rtl"
              style={{
                flex: 1,
                background: 'rgba(0,0,0,.35)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 8px',
                outline: 'none',
                textAlign: 'center',
              }}
            />
            {playerNames.length > 2 && (
              <button
                onClick={() => removePlayer(index)}
                aria-label="حذف"
                style={{
                  width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                  border: '1px solid rgba(239,68,68,.4)',
                  background: 'rgba(239,68,68,.15)',
                  color: '#fca5a5', cursor: 'pointer',
                  fontSize: '14px', lineHeight: 1, padding: 0,
                }}
              >×</button>
            )}
          </div>
        ))}
        {playerNames.length < 20 && (
          <button
            onClick={addPlayer}
            style={{
              width: '100%', marginTop: '2px',
              padding: '5px', borderRadius: '8px',
              border: '1px dashed rgba(254,239,145,.2)',
              background: 'transparent',
              color: '#fbbf24', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
            }}
          >+ إضافة لاعب</button>
        )}
      </motion.div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>⚠ {error}</p>
      )}

      {/* ══════════ Buttons row ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.3 }}
        style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '380px', marginTop: '4px' }}
      >
        <button
          onClick={() => setPhase('landing')}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,.12)',
            background: 'rgba(80,80,80,.3)', color: '#cbd5e1',
            fontSize: '13px', fontWeight: 700,
          }}
        >رجوع</button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className="tobol-start-btn"
          style={{
            flex: 1.5, padding: '12px 16px', border: 'none',
            color: '#feef91', fontSize: '17px', fontWeight: 900,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '10px',
            paintOrder: 'stroke fill',
            WebkitTextStroke: '0.5px #aa6e1f',
            textShadow: '0 2px 6px rgba(0,0,0,.6)',
          }}
        >
          <span className="tobol-start-icon">
            <span style={{ fontSize: '18px' }}>🎴</span>
          </span>
          <span>ابدأ اللعب</span>
        </motion.button>
      </motion.div>

      {/* ══════════ Exit Dialog ══════════ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
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
                borderRadius: '18px', padding: '20px',
                maxWidth: '300px', width: '100%', textAlign: 'center',
                boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                الخروج من المجازفة؟
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
