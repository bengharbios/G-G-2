'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useBaharHarbStore, type PlayMode } from '@/lib/baharharb-store';
import {
  useInGameSetupMode,
  useYallaSoundState,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';

const QUESTION_OPTIONS = [10, 15, 20, 30];

export default function GameSetup() {
  const router = useRouter();
  const { startGame, resetGame } = useBaharHarbStore();

  const [team1Name, setTeam1Name] = useState('الفريق الأول');
  const [team2Name, setTeam2Name] = useState('الفريق الثاني');
  const [playMode, setPlayMode] = useState<PlayMode>('teams');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const { musicOn, soundOn, toggleMusic, toggleSound } = useYallaSoundState();
  useInGameSetupMode();

  const canStart = playMode === 'individuals' || (team1Name.trim() && team2Name.trim());

  const handleStart = () => {
    const t1 = team1Name.trim() || 'الفريق الأول';
    const t2 = team2Name.trim() || 'الفريق الثاني';
    startGame(t1, t2, playMode, totalQuestions);
  };

  const handleExit = () => {
    // [UNIFIED EXIT] Preserve state for resume. End diwaniya room + go home.
    const st = useBaharHarbStore.getState();
    if (st.gameMode === 'diwaniya' && st.roomCode) {
      try { fetch(`/api/baharharb-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
    }
    try { if (typeof window !== 'undefined') { localStorage.removeItem('baharharb-game-storage'); localStorage.removeItem('baharharb-game-storage__disconnect_ts'); } } catch { /* ignore */ }
try { useBaharHarbStore.getState().resetGame(); } catch { /* ignore */ }
setShowExitDialog
    window.location.href = '/#game-baharharb';
  };

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 100px',
        gap: '10px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ أيقونات الهيدر — صوت + خروج ══════════ */}
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

      {/* ══════════ العنوان ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ fontSize: '40px', marginBottom: '2px' }}>🌊⚔️</div>
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
          بحر و حرب
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          BaharHarb — Sea & War ⚓
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
        <span style={{ fontSize: '13px' }}>⚓</span>
        <span
          style={{
            ...STROKE_STYLE,
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.4px',
          }}
        >
          تجهيز المعركة
        </span>
      </motion.div>

      {/* ══════════ بطاقتا الفريقين + VS ══════════ */}
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
        <TeamCard
          color="red"
          accent="#22d3ee"
          accentLight="#67e8f9"
          emoji="🌊"
          label="بحر"
          name={team1Name}
          setName={setTeam1Name}
          placeholder="اسم فريق البحر"
          delay={0.22}
          disabled={playMode === 'individuals'}
        />

        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <TeamCard
          color="blue"
          accent="#f43f5e"
          accentLight="#fda4af"
          emoji="⚔️"
          label="حرب"
          name={team2Name}
          setName={setTeam2Name}
          placeholder="اسم فريق الحرب"
          delay={0.32}
          disabled={playMode === 'individuals'}
        />
      </div>

      {/* ══════════ تبديل نوع اللعب ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '8px',
          padding: '6px',
          background: 'rgba(6,40,32,.65)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <button
          onClick={() => setPlayMode('teams')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: playMode === 'teams' ? '1px solid rgba(254,239,145,.4)' : '1px solid transparent',
            background: playMode === 'teams' ? 'rgba(254,239,145,.12)' : 'transparent',
            color: playMode === 'teams' ? '#feef91' : '#9fc4b4',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          👥 فرق
        </button>
        <button
          onClick={() => setPlayMode('individuals')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: playMode === 'individuals' ? '1px solid rgba(254,239,145,.4)' : '1px solid transparent',
            background: playMode === 'individuals' ? 'rgba(254,239,145,.12)' : 'transparent',
            color: playMode === 'individuals' ? '#feef91' : '#9fc4b4',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          🧑 أفراد
        </button>
      </motion.div>

      {/* ══════════ اختيار عدد الأسئلة ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="tobol-score-frame"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
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
          <span style={{ fontSize: '14px' }}>🌊</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>
          عدد الأسئلة
        </span>
        <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
          {QUESTION_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setTotalQuestions(n)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: totalQuestions === n
                  ? '1px solid rgba(254,239,145,.5)'
                  : '1px solid rgba(255,255,255,.1)',
                background: totalQuestions === n ? 'rgba(254,239,145,.18)' : 'rgba(0,0,0,.25)',
                color: totalQuestions === n ? '#feef91' : '#9fc4b4',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ══════════ زر بدء المعركة ══════════ */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.3 }}
        whileHover={canStart ? { scale: 1.02 } : {}}
        whileTap={canStart ? { scale: 0.97 } : {}}
        onClick={handleStart}
        disabled={!canStart}
        className="tobol-start-btn"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '14px 16px',
          border: 'none',
          color: '#feef91',
          fontSize: '17px',
          fontWeight: 900,
          cursor: canStart ? 'pointer' : 'not-allowed',
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
          <span style={{ fontSize: '18px' }}>⚓</span>
        </span>
        <span>ابدأ المعركة</span>
      </motion.button>

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
                الخروج من المعركة؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء الجلسة وعدم حفظ أي تقدم. هل أنت متأكد؟
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowExitDialog(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)',
                    background: 'rgba(80,80,80,.3)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleExit}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
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

// ===== Team Card =====
function TeamCard({
  color,
  accent,
  accentLight,
  emoji,
  label,
  name,
  setName,
  placeholder,
  delay,
  disabled,
}: {
  color: 'red' | 'blue';
  accent: string;
  accentLight: string;
  emoji: string;
  label: string;
  name: string;
  setName: (v: string) => void;
  placeholder: string;
  delay: number;
  disabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="tobol-team-card"
      style={
        {
          flex: 1,
          padding: '10px 8px',
          '--card-border': `linear-gradient(180deg, ${accentLight}, ${accent})`,
          '--card-border-selected': `linear-gradient(180deg, ${accentLight}, ${accent})`,
          background: `linear-gradient(180deg, ${accent}26, ${accent}0d 80%)`,
          opacity: disabled ? 0.55 : 1,
        } as React.CSSProperties
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}55, ${accent}22)`,
            border: `1.5px solid ${accent}80`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 8px ${accent}55`,
          }}
        >
          <span style={{ fontSize: '13px' }}>{emoji}</span>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: accent,
            textShadow: `0 1px 2px rgba(0,0,0,.6)`,
          }}
        >
          {label}
        </span>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        maxLength={20}
        dir="rtl"
        disabled={disabled}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,.35)',
          border: `1px solid ${accent}55`,
          borderRadius: '10px',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          padding: '7px 8px',
          outline: 'none',
          textAlign: 'center',
          transition: 'border-color .15s',
        }}
      />

      <div
        style={{
          marginTop: '8px',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`,
          opacity: 1,
        }}
      />
    </motion.div>
  );
}
