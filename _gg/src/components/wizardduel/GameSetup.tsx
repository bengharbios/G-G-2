'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWizardDuelStore } from '@/lib/wizardduel-store';
import { useInGameSetupMode, useYallaSoundState, STROKE_STYLE } from '@/lib/yalla-game-helpers';
import { getDeckForLevel, UNIQUE_CARDS, EFFECT_TYPES } from '@/lib/wizardduel-cards';

// Yalla Ludo style — Wizard Duel setup: name + level select + deck preview
export default function GameSetup() {
  useInGameSetupMode();
  const router = useRouter();
  const { startGame, resetGame, gameMode } = useWizardDuelStore();
  const { musicOn, toggleMusic } = useYallaSoundState();

  const [playerName, setPlayerName] = useState('');
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const deck = useMemo(() => getDeckForLevel(level), [level]);
  const deckCount = deck.length;

  const aiName = level === 1 ? 'ساحر الظلام' : level === 2 ? 'ساحر العواصف' : 'الساحر الأعظم';

  const handleStart = () => {
    const name = playerName.trim() || 'الساحر';
    startGame(name, level);
  };

  const isValid = playerName.trim().length >= 2;

  const handleExit = () => {
    resetGame();
    router.push('/wizardduel');
  };

  const levelMeta: Record<1 | 2 | 3, { color: string; bg: string; emoji: string; subtitle: string }> = {
    1: { color: '#22c55e', bg: 'rgba(34,197,94,.15)', emoji: '🌱', subtitle: 'مبتدئ — العدو ضعيف' },
    2: { color: '#f59e0b', bg: 'rgba(245,158,11,.15)', emoji: '⚡', subtitle: 'متوسط — العدو أذكى' },
    3: { color: '#ef4444', bg: 'rgba(239,68,68,.15)', emoji: '💀', subtitle: 'صعب — العدو شرس' },
  };

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #1a0833',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 100px',
        gap: '10px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ 1) Header icons — sound + exit ══════════ */}
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

      {/* ══════════ Logo + title ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/wizardduel.png"
            alt="مبارزة السحرة"
            style={{
              width: '76px',
              height: '64px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.55))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              background: 'radial-gradient(circle, rgba(168,85,247,.22), transparent 65%)',
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
          مبارزة السحرة
        </h1>
        <p style={{ color: '#c4a3e8', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Wizard Duel — {UNIQUE_CARDS} بطاقة و {EFFECT_TYPES} تأثير ⚡
        </p>
      </motion.div>

      {/* ══════════ "تجهيز المبارزة" pill ══════════ */}
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
          background: 'rgba(26,8,51,.65)',
          border: '1px solid rgba(168,85,247,.18)',
        }}
      >
        <span style={{ fontSize: '13px' }}>🔮</span>
        <span style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px' }}>
          تجهيز المبارزة
        </span>
      </motion.div>

      {/* ══════════ Player + AI cards (vs badge in middle) ══════════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '8px',
          alignItems: 'stretch',
          marginTop: '4px',
        }}
      >
        {/* Wizard card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.3 }}
          className="tobol-team-card selected"
          style={{
            flex: 1,
            padding: '10px 8px',
            cursor: 'default',
            '--card-border': 'linear-gradient(180deg, #c4a3e8, #a855f7)',
            '--card-border-selected': 'linear-gradient(180deg, #c4a3e8, #a855f7)',
            background: 'linear-gradient(180deg, rgba(168,85,247,.18), rgba(126,34,206,.08))',
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div
              style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'radial-gradient(circle, #a855f755, #a855f722)',
                border: '1.5px solid #a855f780',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 8px #a855f755',
              }}
            >
              <span style={{ fontSize: '13px' }}>🔮</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#a855f7', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
              أنت
            </span>
          </div>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="اسمك أيها الساحر"
            maxLength={20}
            dir="rtl"
            style={{
              width: '100%',
              background: 'rgba(0,0,0,.35)',
              border: '1px solid #a855f755',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              padding: '7px 8px',
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <div style={{
            marginTop: '8px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #a855f780, transparent)',
          }} />
        </motion.div>

        {/* VS badge */}
        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* AI enemy card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.3 }}
          className="tobol-team-card"
          style={{
            flex: 1,
            padding: '10px 8px',
            cursor: 'default',
            '--card-border': 'linear-gradient(180deg, #fca5a5, #ef4444)',
            '--card-border-selected': 'linear-gradient(180deg, #fca5a5, #ef4444)',
            background: 'linear-gradient(180deg, rgba(239,68,68,.18), rgba(127,29,29,.08))',
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div
              style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'radial-gradient(circle, #ef444455, #ef444422)',
                border: '1.5px solid #ef444480',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '13px' }}>💀</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
              الخصم
            </span>
          </div>
          <div
            style={{
              width: '100%',
              background: 'rgba(0,0,0,.35)',
              border: '1px solid #ef444455',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              padding: '7px 8px',
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(0,0,0,.6)',
            }}
          >
            {aiName}
          </div>
          <div style={{
            marginTop: '8px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ef444480, transparent)',
            opacity: 0.5,
          }} />
        </motion.div>
      </div>

      {/* ══════════ Level selector ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.3 }}
        className="tobol-score-frame"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,.22), rgba(126,34,206,.08))',
              border: '1px solid rgba(168,85,247,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '14px' }}>⚡</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#c4a3e8', whiteSpace: 'nowrap' }}>
            اختر المستوى
          </span>
          <div style={{ flex: 1, textAlign: 'left', color: '#9fc4b4', fontSize: '10px', fontWeight: 700 }}>
            {deckCount} بطاقة في المستوى
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {([1, 2, 3] as const).map((lv) => {
            const meta = levelMeta[lv];
            const selected = level === lv;
            return (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: `1.5px solid ${selected ? meta.color : 'rgba(255,255,255,.08)'}`,
                  background: selected ? meta.bg : 'rgba(0,0,0,.3)',
                  color: selected ? meta.color : '#9fc4b4',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'all .15s',
                  boxShadow: selected ? `0 0 10px ${meta.color}30` : 'none',
                }}
              >
                <span style={{ fontSize: '18px' }}>{meta.emoji}</span>
                <span style={{ fontSize: '11px' }}>المستوى {lv}</span>
                <span style={{ fontSize: '9px', fontWeight: 600, opacity: 0.85 }}>
                  {lv === 1 ? 'مبتدئ' : lv === 2 ? 'متوسط' : 'صعب'}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ══════════ Deck preview ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '8px 12px',
          background: 'rgba(26,8,51,.5)',
          border: '1px solid rgba(168,85,247,.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🎴</span>
          <span style={{ fontSize: '11px', color: '#c4a3e8', fontWeight: 700 }}>
            معاينة المجموعة
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#9fc4b4', fontWeight: 700 }}>
          {deckCount} بطاقة في المستوى {level}
        </span>
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
          <span style={{ fontSize: '18px' }}>🔮</span>
        </span>
        <span>ابدأ المبارزة</span>
      </motion.button>

      {/* ══════════ Game mode badge (under start button) ══════════ */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: gameMode === 'diwaniya' ? '#34d399' : '#fbbf24',
            background: gameMode === 'diwaniya' ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)',
            border: `1px solid ${gameMode === 'diwaniya' ? 'rgba(16,185,129,.3)' : 'rgba(245,158,11,.3)'}`,
            padding: '3px 10px',
            borderRadius: '999px',
          }}
        >
          {gameMode === 'diwaniya' ? '🏛️ وضع الديوانية' : '👑 وضع العراب'}
        </span>
      </div>

      {/* ══════════ Exit dialog ══════════ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.72)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #1a0833, #0a0418)',
                border: '1.5px solid rgba(168,85,247,.25)',
                borderRadius: '18px',
                padding: '20px',
                width: '100%',
                maxWidth: '300px',
                textAlign: 'center',
                boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3
                style={{
                  ...STROKE_STYLE,
                  fontSize: '17px',
                  fontWeight: 900,
                  marginBottom: '6px',
                }}
              >
                الخروج من المبارزة؟
              </h3>
              <p style={{ color: '#c4a3e8', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
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
                >
                  إلغاء
                </button>
                <button
                  onClick={handleExit}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,.35)',
                  }}
                >
                  نعم، اخرج
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
