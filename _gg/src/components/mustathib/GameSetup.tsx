'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMustathibStore } from '@/lib/mustathib-store';
import { distributeRoles, ROLE_CONFIG, Role } from '@/lib/mustathib-types';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
} from '@/lib/sounds';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

const MIN_PLAYERS = 6;
const MAX_PLAYERS = 16;

export default function GameSetup() {
  const router = useRouter();
  const { setPlayers, assignRoles, resetGame, gameMode, setRoomCode } = useMustathibStore();

  const [playerInputs, setPlayerInputs] = useState<string[]>(['', '', '', '', '', '']);
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

  // Compute role distribution preview
  const filledNames = playerInputs.map(n => n.trim()).filter(n => n.length > 0);
  const playerCount = filledNames.length;
  const rolePreview = playerCount >= MIN_PLAYERS ? distributeRoles(playerCount) : null;

  const roleCounts: Record<Role, number> = {
    owl: 0, crow: 0, fortuneTeller: 0, werewolf: 0, villager: 0, doctor: 0,
  };
  if (rolePreview) {
    rolePreview.forEach(r => { roleCounts[r] += 1; });
  }

  const updateName = (index: number, value: string) => {
    const next = [...playerInputs];
    next[index] = value;
    // Auto-grow if editing last input and there's content
    if (index === next.length - 1 && value.trim() && next.length < MAX_PLAYERS) {
      next.push('');
    }
    // Auto-shrink if last two are empty (keep at least one trailing slot)
    while (next.length > MIN_PLAYERS && !next[next.length - 1]?.trim() && !next[next.length - 2]?.trim()) {
      next.pop();
    }
    setPlayerInputs(next);
  };

  const handleStart = () => {
    if (playerCount < MIN_PLAYERS) return;
    setPlayers(filledNames);
    assignRoles();
  };

  const handleExit = () => {
    // [UNIFIED EXIT] Preserve state for resume. End diwaniya room + go home.
    const st = useMustathibStore.getState();
    if (st.gameMode === 'diwaniya' && st.roomCode) {
      try { fetch(`/api/mustathib-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
    }
    try { if (typeof window !== 'undefined') { localStorage.removeItem('mustathib-game-storage'); localStorage.removeItem('mustathib-game-storage__disconnect_ts'); } } catch { /* ignore */ }
try { useMustathibStore.getState().resetGame(); } catch { /* ignore */ }
setShowExitDialog
    router.push('/#games');
  };

  // For diwaniya mode: create room on start
  useEffect(() => {
    if (gameMode !== 'diwaniya') return;
    // Generate a code lazily when component mounts (so deep link can be shared)
    if (!useMustathibStore.getState().roomCode) {
      const code = generateRoomCode();
      // Pre-create room via API (fire-and-forget)
      fetch('/api/mustathib-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, hostName: 'العراب' }),
      }).catch(() => {});
      setRoomCode(code);
    }
  }, [gameMode, setRoomCode]);

  const isValid = playerCount >= MIN_PLAYERS && playerCount <= MAX_PLAYERS;
  const hasDuplicateNames = filledNames.length !== new Set(filledNames).size;

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
          <img
            src="/yalla-games/mustathib.png"
            alt="المستئذب"
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
          المستئذب
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Mustathib — Werewolf 🐺
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
        <span style={{ fontSize: '13px' }}>🐺</span>
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

      {/* ══════════ Role preview ══════════ */}
      {rolePreview && (
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
            flexWrap: 'wrap' as const,
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#feef91', whiteSpace: 'nowrap' }}>
            توزيع الأدوار ({playerCount}):
          </span>
          {(['werewolf', 'crow', 'owl', 'fortuneTeller', 'doctor', 'villager'] as Role[]).map(r => {
            const cfg = ROLE_CONFIG[r];
            const count = roleCounts[r];
            if (count === 0) return null;
            return (
              <span
                key={r}
                style={{
                  fontSize: '11px', fontWeight: 700, color: cfg.team === 'evil' ? '#f87171' : '#9fc4b4',
                  background: cfg.team === 'evil' ? 'rgba(248,113,113,.1)' : 'rgba(159,196,180,.1)',
                  border: `1px solid ${cfg.team === 'evil' ? 'rgba(248,113,113,.3)' : 'rgba(159,196,180,.3)'}`,
                  padding: '3px 7px', borderRadius: '999px',
                  whiteSpace: 'nowrap',
                }}
              >
                {cfg.emoji} {count}
              </span>
            );
          })}
        </motion.div>
      )}

      {/* ══════════ Player inputs grid ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'rgba(6,42,32,.55)',
          border: '1px solid rgba(254,239,145,.15)',
          borderRadius: '14px',
          padding: '10px',
          maxHeight: 'calc(100vh - 360px)',
          overflowY: 'auto',
        }}
        className="tobol-scrollbar"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {playerInputs.map((name, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,0,0,.35)',
                border: `1px solid ${name.trim() ? 'rgba(254,239,145,.25)' : 'rgba(255,255,255,.08)'}`,
                borderRadius: '8px',
                padding: '4px 8px',
              }}
            >
              <span style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'rgba(254,239,145,.15)',
                color: '#feef91', fontSize: '10px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{i + 1}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`اللاعب ${i + 1}`}
                maxLength={20}
                dir="rtl"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '12px', fontWeight: 600,
                  padding: '4px 0', textAlign: 'right',
                }}
              />
            </div>
          ))}
        </div>
        {hasDuplicateNames && (
          <p style={{ color: '#ef4444', fontSize: '11px', textAlign: 'center', marginTop: '6px' }}>⚠️ أسماء مكررة</p>
        )}
        {playerCount > 0 && playerCount < MIN_PLAYERS && (
          <p style={{ color: '#fbbf24', fontSize: '11px', textAlign: 'center', marginTop: '6px' }}>
            اكمل {MIN_PLAYERS - playerCount} لاعبين آخرين
          </p>
        )}
      </motion.div>

      {/* ══════════ Start button ══════════ */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.3 }}
        whileHover={isValid && !hasDuplicateNames ? { scale: 1.02 } : {}}
        whileTap={isValid && !hasDuplicateNames ? { scale: 0.97 } : {}}
        onClick={handleStart}
        disabled={!isValid || hasDuplicateNames}
        className="tobol-start-btn"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '14px 16px',
          border: 'none',
          color: '#feef91',
          fontSize: '17px',
          fontWeight: 900,
          cursor: isValid && !hasDuplicateNames ? 'pointer' : 'not-allowed',
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
          <span style={{ fontSize: '18px' }}>🐺</span>
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

// ============================================================
// Helper: generate room code (mirrors store)
// ============================================================
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
