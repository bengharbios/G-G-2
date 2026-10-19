'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTobolStore } from '@/lib/tobol-store';
import type { Team } from '@/lib/tobol-types';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
} from '@/lib/sounds';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
// textColor: #aa6e1f (ذهبي داكن), stroke_color: #feef91 (ذهبي فاتح)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

export default function GameSetup() {
  const router = useRouter();
  const { setTeamNames, setScores, startGame, resetGame } = useTobolStore();

  const [redName, setRedName] = useState('');
  const [blueName, setBlueName] = useState('');
  const [score, setScore] = useState('350');
  const [firstTeam, setFirstTeam] = useState<Team>('red');

  // حالة أيقونات الهيدر: الصوت والخروج فقط (لا دردشة هنا)
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // ─ـ هيّج وضع "تجهيز المعركة": أخفِ ذهب/جواهر/متجر/إعدادات الهيدر
  //    والقائمة السفلية وأيضاً عطّل ضغط صورة البروفايل وأخفِ الـ SideUtilityPanel
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => {
      document.body.classList.remove('in-game-setup');
    };
  }, []);

  // ─ـ مزامنة الحالة الأولية للصوت من localStorage
  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  const handleStart = () => {
    const t1 = redName.trim() || 'الجيش الأحمر';
    const t2 = blueName.trim() || 'الجيش الأزرق';
    const s = parseInt(score) || 350;
    setTeamNames(t1, t2);
    setScores(s, s);
    startGame(firstTeam);
  };

  const isValid = redName.trim() && blueName.trim() && parseInt(score) > 0;

  // اختيار الفريق — يحدّث firstTeam ويظهر الإشعار دائماً (لا يختفي)
  const handleSelectTeam = (team: Team) => {
    setFirstTeam(team);
  };

  // التبديل بين الصوت والـ BGM
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

  const handleExit = () => {
    // [UNIFIED EXIT] Preserve state for resume. End diwaniya room + go home.
    const st = useTobolStore.getState();
    if (st.gameMode === 'diwaniya' && st.roomCode) {
      try { fetch(`/api/tobol-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
    }
    try { if (typeof window !== 'undefined') { localStorage.removeItem('tobol-game-storage'); localStorage.removeItem('tobol-game-storage__disconnect_ts'); } } catch { /* ignore */ }
try { useTobolStore.getState().resetGame(); } catch { /* ignore */ }
setShowExitDialog
    window.location.href = '/#game-tobol';
  };

  // نص الإشعار: من سيبدأ أولاً (يظهر دائماً، لا يختفي)
  const noticeText =
    firstTeam === 'red' ? 'الفريق الأحمر سيبدأ أولاً' : 'الفريق الأزرق سيبدأ أولاً';
  const noticeClass = firstTeam === 'red' ? 'team-red' : 'team-blue';
  const noticeEmoji = firstTeam === 'red' ? '🔴' : '🔵';

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        // خلفية حرب دافئة — لا أزرق
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 100px',
        gap: '10px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ 1) أيقونات الهيدر — صوت + خروج ══════════ */}
      {/* تظهر مكان الأيقونات المختفية في الهيدر (يسار الشاشة لأن RTL) */}
      <div className="tobol-header-actions">
        {/* أيقونة الصوت — تشغيل/تعطيل */}
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

        {/* أيقونة الخروج */}
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

      {/* ══════════ 6) صورة اللعبة + اسمها بشكل احترافي ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/tobol.png"
            alt="طبول الحرب"
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
          طبول الحرب
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Tobol — War Drums ⚔️
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
        <span style={{ fontSize: '13px' }}>⚔️</span>
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

      {/* ══════════ 4) بطاقتان عصريتان + VS في الوسط ══════════ */}
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
          name={redName}
          setName={setRedName}
          selected={firstTeam === 'red'}
          onSelect={() => handleSelectTeam('red')}
          delay={0.22}
        />

        {/* علامة VS في الوسط */}
        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <TeamCard
          color="blue"
          name={blueName}
          setName={setBlueName}
          selected={firstTeam === 'blue'}
          onSelect={() => handleSelectTeam('blue')}
          delay={0.32}
        />
      </div>

      {/* ══════════ 3) إشعار تحت البطاقات — ثابت دائماً ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={firstTeam}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className={`tobol-notice-pill ${noticeClass}`}
          >
            <span className="notice-dot" />
            <span style={{ fontSize: '13px' }}>{noticeEmoji}</span>
            <span>{noticeText}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══════════ 5) إطار نقاط متطور ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.3 }}
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
          <span style={{ fontSize: '14px' }}>🎯</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>
          النقاط الأولية
        </span>
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          min={1}
          max={9999}
          dir="ltr"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '20px',
            fontWeight: 900,
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,.6)',
            letterSpacing: '1px',
            width: '60px',
          }}
        />
        <span style={{ fontSize: '10px', color: '#9fc4b4', whiteSpace: 'nowrap' }}>نقطة</span>
      </motion.div>

      {/* ══════════ زر بدء المعركة المعاد تصميمه ══════════ */}
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
          <span style={{ fontSize: '18px' }}>⚔️</span>
        </span>
        <span>بدء المعركة</span>
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

// ===== بطاقة فريق عصرية (modern card with VS in middle) =====
function TeamCard({
  color,
  name,
  setName,
  selected,
  onSelect,
  delay,
}: {
  color: 'red' | 'blue';
  name: string;
  setName: (v: string) => void;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const isRed = color === 'red';
  const accent = isRed ? '#ef4444' : '#3b82f6';
  const accentLight = isRed ? '#fca5a5' : '#93c5fd';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onSelect}
      className={`tobol-team-card ${selected ? 'selected' : ''}`}
      style={
        {
          flex: 1,
          padding: '10px 8px',
          cursor: 'pointer',
          '--card-border': selected
            ? `linear-gradient(180deg, ${accentLight}, ${accent})`
            : 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.02))',
          '--card-border-selected': `linear-gradient(180deg, ${accentLight}, ${accent})`,
          background: selected
            ? `linear-gradient(180deg, ${accent}26, ${accent}0d 80%)`
            : 'linear-gradient(180deg, rgba(8,28,22,.92), rgba(4,18,14,.96))',
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
            boxShadow: selected ? `0 0 8px ${accent}55` : 'none',
          }}
        >
          <span style={{ fontSize: '13px' }}>{isRed ? '🔴' : '🔵'}</span>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: accent,
            textShadow: `0 1px 2px rgba(0,0,0,.6)`,
          }}
        >
          {isRed ? 'الأحمر' : 'الأزرق'}
        </span>
        {selected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#feef91',
              background: 'rgba(254,239,145,.15)',
              border: '1px solid rgba(254,239,145,.4)',
              padding: '2px 6px',
              borderRadius: '999px',
              marginRight: 'auto',
            }}
          >
            ← يبدأ
          </motion.span>
        )}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={isRed ? 'اسم الجيش الأحمر' : 'اسم الجيش الأزرق'}
        maxLength={20}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,.35)',
          border: `1px solid ${selected ? `${accent}55` : 'rgba(255,255,255,.08)'}`,
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
          opacity: selected ? 1 : 0.4,
        }}
      />
    </motion.div>
  );
}
