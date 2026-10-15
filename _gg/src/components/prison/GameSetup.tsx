'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePrisonStore } from '@/lib/prison-store';
import { useInGameSetupMode, useYallaSoundState, STROKE_STYLE } from '@/lib/yalla-game-helpers';

const GRID_OPTIONS = [
  { size: 9, label: '9 صغيرة', cols: 3, desc: 'سريعة' },
  { size: 16, label: '16 كبيرة', cols: 4, desc: 'متوسطة' },
  { size: 20, label: '20 عملاقة', cols: 5, desc: 'طويلة' },
] as const;

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function GameSetup() {
  const router = useRouter();
  const { alphaName, betaName, setTeamNames, setGridSize, setPlayers, startGame, resetGame } = usePrisonStore();

  const [localAlphaName, setLocalAlphaName] = useState(alphaName);
  const [localBetaName, setLocalBetaName] = useState(betaName);
  const [selectedGridSize, setSelectedGridSize] = useState(16);
  const [alphaPlayers, setAlphaPlayers] = useState<string[]>(['', '']);
  const [betaPlayers, setBetaPlayers] = useState<string[]>(['', '']);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // shared helpers
  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();

  const addPlayer = (team: 'alpha' | 'beta') => {
    if (team === 'alpha') {
      if (alphaPlayers.length >= 8) return;
      setAlphaPlayers([...alphaPlayers, '']);
    } else {
      if (betaPlayers.length >= 8) return;
      setBetaPlayers([...betaPlayers, '']);
    }
  };

  const removePlayer = (team: 'alpha' | 'beta', index: number) => {
    if (team === 'alpha') {
      if (alphaPlayers.length <= 2) return;
      setAlphaPlayers(alphaPlayers.filter((_, i) => i !== index));
    } else {
      if (betaPlayers.length <= 2) return;
      setBetaPlayers(betaPlayers.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (team: 'alpha' | 'beta', index: number, name: string) => {
    if (team === 'alpha') {
      const updated = [...alphaPlayers];
      updated[index] = name;
      setAlphaPlayers(updated);
    } else {
      const updated = [...betaPlayers];
      updated[index] = name;
      setBetaPlayers(updated);
    }
  };

  const handleStart = () => {
    const t1Name = localAlphaName.trim() || 'فريق أ';
    const t2Name = localBetaName.trim() || 'فريق ب';

    const players = [
      ...alphaPlayers.map((name, i) => ({
        id: generateId(),
        name: name.trim() || `لاعب ${i + 1}`,
        team: 'alpha' as const,
        status: 'active' as const,
        uniformCount: 0,
      })),
      ...betaPlayers.map((name, i) => ({
        id: generateId(),
        name: name.trim() || `لاعب ${i + 1}`,
        team: 'beta' as const,
        status: 'active' as const,
        uniformCount: 0,
      })),
    ];

    setTeamNames(t1Name, t2Name);
    setGridSize(selectedGridSize);
    setPlayers(players);
    startGame();
  };

  const allAlphaValid = alphaPlayers.every((name) => name.trim().length > 0);
  const allBetaValid = betaPlayers.every((name) => name.trim().length > 0);
  const isValid = allAlphaValid && allBetaValid;

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
            src="/yalla-games/prison.png"
            alt="السجن"
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
          السجن
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Prison — Escape the cell 🔑
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
        <span style={{ fontSize: '13px' }}>🔒</span>
        <span
          style={{
            ...STROKE_STYLE,
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.4px',
          }}
        >
          تجهيز الزنزانة
        </span>
      </motion.div>

      {/* ══════════ بطاقتان عصريتان + VS في الوسط ══════════ */}
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
          name={localAlphaName}
          setName={setLocalAlphaName}
          delay={0.22}
          placeholder="اسم فريق أ"
          label="أ"
          emoji="🟡"
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
          name={localBetaName}
          setName={setLocalBetaName}
          delay={0.32}
          placeholder="اسم فريق ب"
          label="ب"
          emoji="🔵"
        />
      </div>

      {/* ══════════ إطار حجم السجن ══════════ */}
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
            <span style={{ fontSize: '14px' }}>🏗️</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>
            حجم الزنزانة
          </span>
          <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
            {GRID_OPTIONS.map((opt) => (
              <button
                key={opt.size}
                onClick={() => setSelectedGridSize(opt.size)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: selectedGridSize === opt.size
                    ? '1px solid rgba(254,239,145,.55)'
                    : '1px solid rgba(255,255,255,.1)',
                  background: selectedGridSize === opt.size
                    ? 'rgba(254,239,145,.12)'
                    : 'rgba(0,0,0,.25)',
                  color: selectedGridSize === opt.size ? '#feef91' : '#9fc4b4',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══════════ قوائم اللاعبين ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', gap: '8px', marginTop: '4px' }}>
        <PlayerList
          color="red"
          label={localAlphaName.trim() || 'فريق أ'}
          emoji="🟡"
          players={alphaPlayers}
          onAdd={() => addPlayer('alpha')}
          onRemove={(i) => removePlayer('alpha', i)}
          onUpdate={(i, v) => updatePlayerName('alpha', i, v)}
          delay={0.4}
        />
        <PlayerList
          color="blue"
          label={localBetaName.trim() || 'فريق ب'}
          emoji="🔵"
          players={betaPlayers}
          onAdd={() => addPlayer('beta')}
          onRemove={(i) => removePlayer('beta', i)}
          onUpdate={(i, v) => updatePlayerName('beta', i, v)}
          delay={0.46}
        />
      </div>

      {/* ══════════ زر بدء المعركة ══════════ */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        whileHover={isValid ? { scale: 1.02 } : {}}
        whileTap={isValid ? { scale: 0.97 } : {}}
        onClick={handleStart}
        disabled={!isValid}
        className="tobol-start-btn"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '12px 16px',
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
          marginTop: '4px',
        }}
      >
        <span className="tobol-start-icon">
          <span style={{ fontSize: '18px' }}>🔑</span>
        </span>
        <span>ابدأ السجن</span>
      </motion.button>

      {!isValid && (
        <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
          ⚠ يجب إدخال أسماء جميع اللاعبين (2 على الأقل لكل فريق)
        </p>
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
                الخروج من السجن؟
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

// ===== بطاقة فريق =====
function TeamCard({
  color, name, setName, delay, placeholder, label, emoji,
}: {
  color: 'red' | 'blue';
  name: string;
  setName: (v: string) => void;
  delay: number;
  placeholder: string;
  label: string;
  emoji: string;
}) {
  const isRed = color === 'red';
  const accent = isRed ? '#ef4444' : '#3b82f6';
  const accentLight = isRed ? '#fca5a5' : '#93c5fd';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="tobol-team-card selected"
      style={
        {
          flex: 1,
          padding: '10px 8px',
          '--card-border': `linear-gradient(180deg, ${accentLight}, ${accent})`,
          '--card-border-selected': `linear-gradient(180deg, ${accentLight}, ${accent})`,
          background: `linear-gradient(180deg, ${accent}26, ${accent}0d 80%)`,
        } as React.CSSProperties
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <div
          style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}55, ${accent}22)`,
            border: `1.5px solid ${accent}80`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: `0 0 8px ${accent}55`,
          }}
        >
          <span style={{ fontSize: '13px' }}>{emoji}</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: accent, textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
          فريق {label}
        </span>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        maxLength={20}
        dir="rtl"
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
        }}
      />
      <div style={{ marginTop: '8px', height: '2px', background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
    </motion.div>
  );
}

// ===== قائمة لاعبي فريق =====
function PlayerList({
  color, label, emoji, players, onAdd, onRemove, onUpdate, delay,
}: {
  color: 'red' | 'blue';
  label: string;
  emoji: string;
  players: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, name: string) => void;
  delay: number;
}) {
  const isRed = color === 'red';
  const accent = isRed ? '#ef4444' : '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="tobol-team-card"
      style={
        {
          flex: 1,
          padding: '8px 8px 10px',
          '--card-border': 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.02))',
          background: 'linear-gradient(180deg, rgba(8,28,22,.92), rgba(4,18,14,.96))',
        } as React.CSSProperties
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px' }}>{emoji}</span>
        <span style={{ fontSize: '11px', fontWeight: 800, color: accent, textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
          {label}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b', marginRight: 'auto' }}>
          {players.length} لاعبين
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {players.map((name, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              type="text"
              value={name}
              onChange={(e) => onUpdate(idx, e.target.value)}
              placeholder={`لاعب ${idx + 1}`}
              maxLength={15}
              dir="rtl"
              style={{
                flex: 1,
                background: 'rgba(0,0,0,.35)',
                border: `1px solid ${accent}33`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '6px 8px',
                outline: 'none',
                textAlign: 'center',
              }}
            />
            {players.length > 2 && (
              <button
                onClick={() => onRemove(idx)}
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
      </div>

      {players.length < 8 && (
        <button
          onClick={onAdd}
          style={{
            width: '100%', marginTop: '6px',
            padding: '5px', borderRadius: '8px',
            border: `1px dashed ${accent}40`,
            background: 'transparent',
            color: accent, fontSize: '10px', fontWeight: 700, cursor: 'pointer',
          }}
        >+ إضافة لاعب</button>
      )}
    </motion.div>
  );
}
