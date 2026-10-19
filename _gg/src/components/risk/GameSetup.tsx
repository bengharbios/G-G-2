'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRiskStore } from '@/lib/risk-store';
import { DEFAULT_PLAYER_NAMES, TARGET_SCORE_OPTIONS, PLAYER_COLORS } from '@/lib/risk-types';
import type { RiskGameConfig } from '@/lib/risk-types';
import { useInGameSetupMode, useYallaSoundState, STROKE_STYLE, useShareLinks } from '@/lib/yalla-game-helpers';

const PLAYER_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

// Local PLAYER_COLORS with hex for inline styles
const PLAYER_HEX = ['#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee', '#fb923c', '#f472b6', '#2dd4bf'];

export default function GameSetup() {
  const router = useRouter();
  const { startGame, resetGame, gameMode, roomCode } = useRiskStore();

  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_PLAYER_NAMES);
  const [targetScore, setTargetScore] = useState(50);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const handleStart = () => {
    const config: RiskGameConfig = {
      targetScore,
      playerNames: playerNames.slice(0, playerCount),
    };
    startGame(config);
  };

  const playerNamesValid = playerNames.slice(0, playerCount).every(n => n.trim().length > 0);

  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;
  const { shareLink, shareCopied, copyShareLink, shareExternally } = useShareLinks('risk', isDiwaniyaHost, roomCode);
  const [copiedCode, setCopiedCode] = useState(false);
  const handleCopyCode = async () => {
    if (!roomCode) return;
    try { await navigator.clipboard.writeText(roomCode); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1800); } catch {}
  };


  const handleExit = () => {
    // [UNIFIED EXIT] Preserve state for resume. End diwaniya room + go home.
    const st = useRiskStore.getState();
    if (st.gameMode === 'diwaniya' && st.roomCode) {
      try { fetch(`/api/risk-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
    }
    try { if (typeof window !== 'undefined') { localStorage.removeItem('risk-game-storage-v2'); localStorage.removeItem('risk-game-storage-v2__disconnect_ts'); } } catch { /* ignore */ }
try { useRiskStore.getState().resetGame(); } catch { /* ignore */ }
setShowExitDialog
    window.location.href = '/#game-risk';
  };

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 100px',
        gap: '10px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ 1) أيقونات الهيدر — صوت + خروج ══════════ */}
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

      {/* ══════════ صورة اللعبة + اسمها ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/risk.png"
            alt="المجازفة"
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
          المجازفة
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Risk — Push your luck 🃏
        </p>
      </motion.div>

      {/* ══════════ عنوان "تجهيز المعركة" ══════════ */}
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
        <span style={{ fontSize: '13px' }}>💣</span>
        <span
          style={{
            ...STROKE_STYLE,
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.4px',
          }}
        >
          تجهيز المجازفة
        </span>
      </motion.div>

      {/* ══════════ إطار الهدف ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.3 }}
        className="tobol-score-frame"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '8px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254,239,145,.22), rgba(170,110,31,.08))',
              border: '1px solid rgba(254,239,145,.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
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
                  flex: 1,
                  padding: '5px 4px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 800,
                  border: targetScore === score
                    ? '1px solid rgba(254,239,145,.55)'
                    : '1px solid rgba(255,255,255,.1)',
                  background: targetScore === score
                    ? 'rgba(254,239,145,.12)'
                    : 'rgba(0,0,0,.25)',
                  color: targetScore === score ? '#feef91' : '#9fc4b4',
                }}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: '10px', color: '#9fc4b4', textAlign: 'center' }}>
          أول لاعب يصل إلى {targetScore} نقطة يفوز 🏆
        </p>
      </motion.div>

      {/* ══════════ عدد اللاعبين ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
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
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(254,239,145,.22), rgba(170,110,31,.08))',
            border: '1px solid rgba(254,239,145,.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '14px' }}>👥</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>
          اللاعبون
        </span>
        <div style={{ flex: 1, display: 'flex', gap: '4px', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {PLAYER_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => setPlayerCount(count)}
              style={{
                flex: '1 1 32px',
                padding: '5px 4px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 800,
                border: playerCount === count
                  ? '1px solid rgba(254,239,145,.55)'
                  : '1px solid rgba(255,255,255,.1)',
                background: playerCount === count
                  ? 'rgba(254,239,145,.12)'
                  : 'rgba(0,0,0,.25)',
                color: playerCount === count ? '#feef91' : '#9fc4b4',
              }}
            >
              {count}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ══════════ قائمة أسماء اللاعبين ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.3 }}
        style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', maxHeight: '180px', overflowY: 'auto' }}
      >
        {Array.from({ length: playerCount }).map((_, idx) => {
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          const hex = PLAYER_HEX[idx % PLAYER_HEX.length];
          return (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 8px', borderRadius: '10px',
                background: `${hex}10`,
                border: `1px solid ${hex}40`,
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: `${hex}40`, border: `1px solid ${hex}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '10px' }}>{color.emoji}</span>
              </div>
              <input
                type="text"
                value={playerNames[idx]}
                onChange={(e) => updatePlayerName(idx, e.target.value)}
                placeholder={DEFAULT_PLAYER_NAMES[idx]}
                maxLength={20}
                dir="rtl"
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,.35)',
                  border: `1px solid ${hex}33`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 8px',
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
            </div>
          );
        })}
      </motion.div>

      {/* ══════════ معلومات مجموعة البطاقات ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.3 }}
        style={{
          width: '100%', maxWidth: '380px',
          display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center',
          marginTop: '2px',
        }}
      >
        <span style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '6px', background: 'rgba(34,211,238,.1)', border: '1px solid rgba(34,211,238,.3)', color: '#22d3ee' }}>٤٥ رقم</span>
        <span style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '6px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171' }}>💣 ×٢</span>
        <span style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '6px', background: 'rgba(148,163,184,.1)', border: '1px solid rgba(148,163,184,.3)', color: '#94a3b8' }}>⏭️ ×١</span>
        <span style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '6px', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: '#fbbf24' }}>✨ ×١</span>
        <span style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '6px', background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.3)', color: '#a855f7' }}>🔥 ×١</span>
      </motion.div>

      {/* ══════════ زر بدء المعركة ══════════ */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.3 }}
        whileHover={playerNamesValid ? { scale: 1.02 } : {}}
        whileTap={playerNamesValid ? { scale: 0.97 } : {}}
        onClick={handleStart}
        disabled={!playerNamesValid}
        className="tobol-start-btn"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '14px 16px',
          border: 'none',
          color: '#feef91',
          fontSize: '17px',
          fontWeight: 900,
          cursor: playerNamesValid ? 'pointer' : 'not-allowed',
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
          <span style={{ fontSize: '18px' }}>💣</span>
        </span>
        <span>ابدأ المجازفة</span>
      </motion.button>

      {!playerNamesValid && (
        <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
          ⚠ تأكد من إدخال أسماء جميع اللاعبين
        </p>
      )}

      {/* Diwaniya share card */}
      {gameMode === 'diwaniya' && !roomCode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '380px', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '20px' }}>📡</motion.div>
          <span style={{ color: '#9fc4b4', fontSize: '12px', fontWeight: 700 }}>جاري إنشاء غرفة الديوانية...</span>
        </motion.div>
      )}
      {gameMode === 'diwaniya' && roomCode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.3 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '380px', padding: '10px 14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>📡 شارك الغرفة مع أصدقائك</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,.4)', border: '1px solid rgba(254,239,145,.3)', borderRadius: '8px', padding: '8px 12px' }}>
            <span style={{ ...STROKE_STYLE, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>كود:</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '20px', fontWeight: 900, color: '#feef91', letterSpacing: '3px', flex: 1, textAlign: 'center' }}>{roomCode}</span>
            <button onClick={handleCopyCode} style={{ background: copiedCode ? 'linear-gradient(135deg, #22c55e, #15803d)' : 'linear-gradient(135deg, #fbbf24, #aa6e1f)', color: copiedCode ? '#fff' : '#000', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>{copiedCode ? '✓ تم' : 'نسخ'}</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={copyShareLink} style={{ flex: 1, background: 'rgba(8,28,22,.85)', border: '1px solid rgba(254,239,145,.25)', borderRadius: '6px', padding: '8px 10px', color: shareCopied ? '#86efac' : '#feef91', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={shareLink}>{shareCopied ? '✓ تم نسخ الرابط' : '🔗 نسخ رابط المشاهدة'}</button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button onClick={shareExternally} style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)', border: 'none', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>مشاركة</button>
            )}
          </div>
          <p style={{ fontSize: '10px', color: '#9fc4b4', textAlign: 'center', fontWeight: 600 }}>💡 من يفتح الرابط يشاهد المعركة مباشرة</p>
        </motion.div>
      )}

      {/* ══════════ حوار الخروج ══════════ */}
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
                background: 'linear-gradient(180deg, #0e2a22, #061812)',
                border: '1.5px solid rgba(254,239,145,.25)',
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
