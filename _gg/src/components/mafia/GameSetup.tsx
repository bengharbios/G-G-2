'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useGameStore } from '@/lib/game-store';
import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  getTeamComposition,
} from '@/lib/game-types';
import {
  STROKE_STYLE,
  useInGameSetupMode,
  useYallaSoundState,
} from '@/lib/yalla-game-helpers';

interface GameSetupProps {
  onStartGame: () => void;
}

export default function GameSetup({ onStartGame }: GameSetupProps) {
  const router = useRouter();
  const startGame = useGameStore((s) => s.startGame);
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: MIN_PLAYERS }, (_, i) => `اللاعب ${i + 1}`)
  );
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');
  const [customMafiaCount, setCustomMafiaCount] = useState<number | undefined>(undefined);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();

  const composition = useMemo(
    () => getTeamComposition(playerCount, customMafiaCount),
    [playerCount, customMafiaCount]
  );

  const handleCountChange = (newCount: number) => {
    const clamped = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, newCount));
    setPlayerCount(clamped);
    setPlayerNames((prev) => {
      if (clamped > prev.length) {
        return [
          ...prev,
          ...Array.from(
            { length: clamped - prev.length },
            (_, i) => `اللاعب ${prev.length + i + 1}`
          ),
        ];
      }
      return prev.slice(0, clamped);
    });
    setError('');
  };

  const handleNameChange = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
    setError('');
  };

  const handleStart = () => {
    const trimmed = playerNames.map((n) => n.trim());

    if (trimmed.some((n) => n.length === 0)) {
      setError('يجب إدخال أسماء جميع اللاعبين');
      return;
    }

    const uniqueNames = new Set(trimmed);
    if (uniqueNames.size !== trimmed.length) {
      setError('يجب أن تكون الأسماء مختلفة');
      return;
    }

    startGame(trimmed, customMafiaCount);
    onStartGame();
  };

  const handleExit = () => {
    useGameStore.getState().resetGame();
    router.push('/');
  };

  const isValid = playerNames.every((n) => n.trim().length > 0);

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
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      {/* ═══ header actions ═══ */}
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

      {/* ═══ logo + title ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/mafia.png"
            alt="المافيا"
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
          المافيا
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Mafia — {playerCount} لاعب • {composition.mafiaCount} مافيا • {composition.citizenCount} صالح
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
        <span style={{ fontSize: '13px' }}>🕵️</span>
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

      {/* ═══ player count + composition ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.3 }}
        className="tobol-score-frame"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '4px',
        }}
      >
        {/* player count row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <button
            onClick={() => handleCountChange(playerCount - 1)}
            disabled={playerCount <= MIN_PLAYERS}
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'rgba(220,38,38,.2)', border: '1px solid rgba(239,68,68,.5)',
              color: '#fca5a5', fontSize: '18px', fontWeight: 900, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: playerCount <= MIN_PLAYERS ? 0.4 : 1,
            }}
          >−</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...STROKE_STYLE, fontSize: '24px', fontWeight: 900, lineHeight: 1,
            }}>{playerCount}</div>
            <div style={{ fontSize: '10px', color: '#9fc4b4', fontWeight: 700 }}>عدد اللاعبين</div>
          </div>
          <button
            onClick={() => handleCountChange(playerCount + 1)}
            disabled={playerCount >= MAX_PLAYERS}
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'rgba(16,185,129,.2)', border: '1px solid rgba(16,185,129,.5)',
              color: '#6ee7b7', fontSize: '18px', fontWeight: 900, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: playerCount >= MAX_PLAYERS ? 0.4 : 1,
            }}
          >+</button>
        </div>

        {/* custom mafia count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: '#9fc4b4' }}>عدد المافيا:</span>
          {([undefined, 2, 3, 4] as const).map((count) => (
            <button
              key={count ?? 'auto'}
              onClick={() => { setCustomMafiaCount(count); setError(''); }}
              style={{
                padding: '4px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800,
                border: customMafiaCount === count
                  ? '1px solid rgba(254,239,145,.55)'
                  : '1px solid rgba(255,255,255,.12)',
                background: customMafiaCount === count ? 'rgba(254,239,145,.18)' : 'rgba(0,0,0,.35)',
                color: customMafiaCount === count ? '#feef91' : '#9fc4b4',
                cursor: 'pointer',
              }}
            >
              {count === undefined ? 'تلقائي' : `${count} مافيا`}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ team composition cards (mafia vs citizens) ═══ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '8px',
          alignItems: 'stretch',
        }}
      >
        <div
          className="tobol-team-card selected"
          style={{
            flex: 1,
            padding: '8px',
            '--card-border': 'linear-gradient(180deg, #fca5a5, #ef4444)',
            '--card-border-selected': 'linear-gradient(180deg, #fca5a5, #ef4444)',
            background: 'linear-gradient(180deg, rgba(239,68,68,.18), rgba(239,68,68,.05) 80%)',
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(239,68,68,.4), rgba(239,68,68,.15))',
              border: '1.5px solid rgba(239,68,68,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px' }}>👿</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
              المافيا ({composition.mafiaCount})
            </span>
          </div>
          <div style={{ fontSize: '9px', color: '#9fc4b4', lineHeight: 1.4 }}>
            {composition.mafiaRoles.map((role, i) => (
              <div key={`${role.type}-${i}`}>{role.name}</div>
            ))}
          </div>
        </div>

        <div className="tobol-vs-badge" style={{ width: '32px', height: '32px', alignSelf: 'center' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div
          className="tobol-team-card selected"
          style={{
            flex: 1,
            padding: '8px',
            '--card-border': 'linear-gradient(180deg, #93c5fd, #3b82f6)',
            '--card-border-selected': 'linear-gradient(180deg, #93c5fd, #3b82f6)',
            background: 'linear-gradient(180deg, rgba(59,130,246,.18), rgba(59,130,246,.05) 80%)',
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,.4), rgba(59,130,246,.15))',
              border: '1.5px solid rgba(59,130,246,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px' }}>🛡️</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
              الصالحون ({composition.citizenCount})
            </span>
          </div>
          <div style={{ fontSize: '9px', color: '#9fc4b4', lineHeight: 1.4 }}>
            {composition.citizenSpecialRoles.map((role) => (
              <div key={role.type}>{role.name}</div>
            ))}
            {composition.plainCitizens > 0 && (
              <div>👤 مواطن عادي ×{composition.plainCitizens}</div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ player names scrollable ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        style={{
          width: '100%', maxWidth: '380px', flex: 1, minHeight: 0,
          background: 'rgba(6,42,32,.6)',
          border: '1px solid rgba(254,239,145,.15)',
          borderRadius: '12px',
          padding: '8px',
          overflowY: 'auto',
        }}
      >
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
        }}>
          {playerNames.map((name, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.5) }}
              className="flex items-center gap-2"
            >
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'rgba(0,0,0,.4)', border: '1px solid rgba(254,239,145,.3)',
                color: '#9fc4b4', fontSize: '10px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {index + 1}
              </span>
              <Input
                value={name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder={`لاعب ${index + 1}`}
                className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right text-xs h-9"
                dir="rtl"
                maxLength={20}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '11px', textAlign: 'center' }}>⚠️ {error}</p>
      )}

      {/* ═══ rules toggle + start button ═══ */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '380px', alignItems: 'center' }}>
        <button
          onClick={() => setShowRules(!showRules)}
          style={{
            padding: '10px 12px', borderRadius: '10px',
            border: '1px solid rgba(254,239,145,.3)',
            background: 'rgba(254,239,145,.08)', color: '#feef91',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {showRules ? 'إخفاء' : '📜'} القوانين
        </button>
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
            flex: 1,
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
          }}
        >
          <span className="tobol-start-icon">
            <span style={{ fontSize: '18px' }}>🕵️</span>
          </span>
          <span>ابدأ اللعبة</span>
        </motion.button>
      </div>

      {/* ═══ rules panel ═══ */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden', width: '100%', maxWidth: '380px' }}
          >
            <div style={{
              background: 'rgba(6,42,32,.85)', borderRadius: '10px',
              border: '1px solid rgba(254,239,145,.18)', padding: '12px',
              fontSize: '11px', color: '#cbd5e1',
            }}>
              <h4 style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '4px' }}>👿 فريق المافيا:</h4>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '8px', color: '#9fc4b4' }}>
                <li>• 🕴️ <strong>شيخ المافيا:</strong> يختار ضحية كل ليلة</li>
                <li>• 🤫 <strong>مافيا التسكيت:</strong> يسكت شخصاً كل ليلة</li>
                <li>• 🔪 <strong>مافيا عادي:</strong> يشارك القرارات</li>
              </ul>
              <h4 style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>🛡️ فريق الصالحين:</h4>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '8px', color: '#9fc4b4' }}>
                <li>• 🏛️ <strong>العمده:</strong> يكشف بطاقته بأمان، صوته ٣ أصوات</li>
                {composition.citizenSpecialRoles.some(r => r.type === 'good_son') && (
                  <li>• 👦 <strong>الولد الصالح:</strong> يُخرج أحداً معه عند الإقصاء</li>
                )}
                <li>• 🏥 <strong>الطبيب:</strong> ينقذ الضحية إذا خمّن صح</li>
                {composition.citizenSpecialRoles.some(r => r.type === 'sniper') && (
                  <li>• 🎯 <strong>القناص:</strong> رصاصة واحدة، يقتل معه إذا أخطأ</li>
                )}
              </ul>
              <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '6px' }}>
                <p style={{ color: '#fbbf24' }}>🏆 المواطنون يفوزون بإقصاء كل المافيا</p>
                <p style={{ color: '#ef4444' }}>💀 المافيا تفوز بتفوق عددي على المواطنين</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
