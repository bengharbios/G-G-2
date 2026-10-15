'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useShifaratStore } from '@/lib/shifarat-store';
import { ALL_CATEGORIES } from '@/lib/shifarat-words';
import type { TeamColor } from '@/lib/shifarat-types';
import {
  STROKE_STYLE,
  useInGameSetupMode,
  useYallaSoundState,
} from '@/lib/yalla-game-helpers';

interface GameSetupProps {
  onStart: (settings: {
    team1Name: string;
    team2Name: string;
    timer: number;
    categories: string[];
    firstTeam: TeamColor;
    redSpymaster?: string;
    blueSpymaster?: string;
  }) => void;
  onBack: () => void;
}

const TIMER_OPTIONS = [30, 60, 90, 120, 0];

export default function GameSetup({ onStart, onBack }: GameSetupProps) {
  const router = useRouter();
  const { resetGame } = useShifaratStore();

  const [redName, setRedName] = useState('الفريق الأحمر');
  const [blueName, setBlueName] = useState('الفريق الأزرق');
  const [redSpymaster, setRedSpymaster] = useState('');
  const [blueSpymaster, setBlueSpymaster] = useState('');
  const [timer, setTimer] = useState(60);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    ALL_CATEGORIES.map((c) => c.id)
  );
  const [firstTeam, setFirstTeam] = useState<TeamColor>('red');
  const [error, setError] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();

  const handleSelectTeam = (team: TeamColor) => {
    setFirstTeam(team);
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length <= 1) {
          setError('يجب اختيار فئة واحدة على الأقل');
          return prev;
        }
        setError('');
        return prev.filter((id) => id !== catId);
      }
      setError('');
      return [...prev, catId];
    });
  };

  const toggleAllCategories = () => {
    if (selectedCategories.length === ALL_CATEGORIES.length) {
      setError('');
      setSelectedCategories([]);
    } else {
      setError('');
      setSelectedCategories(ALL_CATEGORIES.map((c) => c.id));
    }
  };

  const handleStart = () => {
    if (!redName.trim() || !blueName.trim()) {
      setError('يجب إدخال أسماء الفريقين');
      return;
    }
    if (redName.trim() === blueName.trim()) {
      setError('يجب أن تكون أسماء الفريقين مختلفة');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('يجب اختيار فئة واحدة على الأقل');
      return;
    }
    setError('');
    onStart({
      team1Name: redName.trim(),
      team2Name: blueName.trim(),
      timer,
      categories: selectedCategories,
      firstTeam,
      redSpymaster: redSpymaster.trim() || undefined,
      blueSpymaster: blueSpymaster.trim() || undefined,
    });
  };

  const handleExit = () => {
    resetGame();
    router.push('/');
  };

  const isValid = redName.trim() && blueName.trim() && selectedCategories.length > 0;

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
        height: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 16px',
        gap: '8px',
        overflow: 'hidden',
      }}
    >
      {/* ═══ header actions: sound + quit ═══ */}
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

      {/* ═══ game logo + title ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/shifarat.png"
            alt="الشيفرات"
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
          الشيفرات
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Shifarat — Codenames 🎯
        </p>
      </motion.div>

      {/* ═══ تجهيز المعركة pill ═══ */}
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
        <span style={{ fontSize: '13px' }}>🎯</span>
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

      {/* ═══ team cards + VS ═══ */}
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
          spymaster={redSpymaster}
          setSpymaster={setRedSpymaster}
          selected={firstTeam === 'red'}
          onSelect={() => handleSelectTeam('red')}
          delay={0.22}
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
          name={blueName}
          setName={setBlueName}
          spymaster={blueSpymaster}
          setSpymaster={setBlueSpymaster}
          selected={firstTeam === 'blue'}
          onSelect={() => handleSelectTeam('blue')}
          delay={0.32}
        />
      </div>

      {/* ═══ notice pill ═══ */}
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

      {/* ═══ timer + categories score frame ═══ */}
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
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <div
            style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254,239,145,.22), rgba(170,110,31,.08))',
              border: '1px solid rgba(254,239,145,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '12px' }}>⏱️</span>
          </div>
          {TIMER_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTimer(t)}
              style={{
                minWidth: '32px', height: '28px', padding: '0 6px', borderRadius: '8px',
                border: timer === t ? '1px solid rgba(254,239,145,.55)' : '1px solid rgba(255,255,255,.1)',
                background: timer === t ? 'rgba(254,239,145,.18)' : 'rgba(0,0,0,.35)',
                color: timer === t ? '#feef91' : '#9fc4b4',
                fontSize: '11px', fontWeight: 800, cursor: 'pointer',
              }}
            >
              {t === 0 ? '∞' : `${t}ث`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCategories(!showCategories)}
          style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: '8px',
            border: '1px solid rgba(254,239,145,.35)',
            background: 'rgba(254,239,145,.1)', color: '#feef91',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <span>🏷️</span>
          <span>الفئات ({selectedCategories.length}/{ALL_CATEGORIES.length})</span>
        </button>
      </motion.div>

      {/* categories dropdown */}
      <AnimatePresence>
        {showCategories && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', width: '100%', maxWidth: '380px' }}
          >
            <div
              style={{
                background: 'rgba(6,42,32,.85)', borderRadius: '12px',
                border: '1px solid rgba(254,239,145,.18)', padding: '10px',
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px',
                maxHeight: '160px', overflowY: 'auto',
              }}
            >
              <button
                onClick={toggleAllCategories}
                style={{
                  gridColumn: '1 / -1', padding: '6px 8px', borderRadius: '8px',
                  border: '1px solid rgba(254,239,145,.35)',
                  background: 'rgba(254,239,145,.12)', color: '#feef91',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {selectedCategories.length === ALL_CATEGORIES.length ? 'إلغاء الكل' : 'اختر الكل'}
              </button>
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      padding: '6px 8px', borderRadius: '8px',
                      border: isSelected ? '1px solid rgba(254,239,145,.55)' : '1px solid rgba(255,255,255,.1)',
                      background: isSelected ? 'rgba(254,239,145,.18)' : 'rgba(0,0,0,.35)',
                      color: isSelected ? '#feef91' : '#9fc4b4',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '11px', textAlign: 'center' }}>⚠️ {error}</p>
      )}

      {/* ═══ start button ═══ */}
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
          <span style={{ fontSize: '18px' }}>🎯</span>
        </span>
        <span>بدء المعركة</span>
      </motion.button>

      {/* ═══ exit dialog ═══ */}
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
                الخروج من اللعبة؟
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
  name,
  setName,
  spymaster,
  setSpymaster,
  selected,
  onSelect,
  delay,
}: {
  color: 'red' | 'blue';
  name: string;
  setName: (v: string) => void;
  spymaster: string;
  setSpymaster: (v: string) => void;
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
          marginBottom: '6px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '22px',
            height: '22px',
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
          <span style={{ fontSize: '11px' }}>{isRed ? '🔴' : '🔵'}</span>
        </div>
        <span
          style={{
            fontSize: '11px',
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
              fontSize: '8px',
              fontWeight: 800,
              color: '#feef91',
              background: 'rgba(254,239,145,.15)',
              border: '1px solid rgba(254,239,145,.4)',
              padding: '2px 5px',
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
        placeholder={isRed ? 'اسم الفريق الأحمر' : 'اسم الفريق الأزرق'}
        maxLength={20}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,.35)',
          border: `1px solid ${selected ? `${accent}55` : 'rgba(255,255,255,.08)'}`,
          borderRadius: '8px',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
          padding: '6px 7px',
          outline: 'none',
          textAlign: 'center',
          transition: 'border-color .15s',
          marginBottom: '4px',
        }}
      />
      <input
        type="text"
        value={spymaster}
        onChange={(e) => setSpymaster(e.target.value)}
        placeholder="👁️ الجاسوس (اختياري)"
        maxLength={20}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,.25)',
          border: `1px solid ${selected ? `${accent}35` : 'rgba(255,255,255,.06)'}`,
          borderRadius: '8px',
          color: '#cbd5e1',
          fontSize: '10px',
          fontWeight: 500,
          padding: '5px 7px',
          outline: 'none',
          textAlign: 'center',
          transition: 'border-color .15s',
        }}
      />

      <div
        style={{
          marginTop: '6px',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`,
          opacity: selected ? 1 : 0.4,
        }}
      />
    </motion.div>
  );
}
