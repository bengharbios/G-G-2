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
  FLASHI_CATEGORY_LABELS,
} from '@/lib/spotdiff-types';
import type { FlashiCategory } from '@/lib/flashi_images';
import SvgaOrImg from '@/components/shared/SvgaOrImg';

// Minimal authUser shape (subset of AppShellUser) — we fetch it directly
// from /api/auth/me because /spotdiff is NOT in SHELL_ROUTES, so the
// AppShellContext.Provider doesn't wrap this page (AppShell early-returns
// <>{children}</> for non-shell routes).
interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  frame?: string;
}

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

// Frame asset path helper (matching SiteHeader logic)
function frameSrcFallback(frameId?: string | null): string | null {
  const id = (frameId || '').trim();
  if (!id) return null;
  return /^\d+$/.test(id) ? `/yalla-frames/${id}.png` : null;
}

function avatarSrc(avatar?: string, id?: string): string {
  if (avatar) return avatar;
  const seed = (parseInt(id || '', 10) || 0) % 12 + 1;
  return `/yalla-avatars/defaultPhoto_${seed}.png`;
}

export default function GameSetup() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Fetch authed user directly — AppShellContext.Provider doesn't wrap
  // /spotdiff (it's not in SHELL_ROUTES), so useAppShell() returns null.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.user) setAuthUser(data.user as AuthUser);
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);
  const {
    setPlayerName, setDifficulty, setTotalRounds,
    startGame, resetGame, gameMode, setRoomCode,
    difficulty, totalRounds,
    loadFlashiCatalog,
    flashiCategory, setFlashiCategory,
    fastestFinish, wrongCount,
  } = useSpotDiffStore();

  const [playerName, setPlayerNameState] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [frameImg, setFrameImg] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

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

  // Preload flashi catalog
  useEffect(() => {
    loadFlashiCatalog().catch(() => {});
  }, [loadFlashiCatalog]);

  // Load frame for authed user
  useEffect(() => {
    if (!authUser?.frame) { setFrameImg(null); return; }
    let cancelled = false;
    fetch('/api/store/frames-catalog')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled || !d?.success || !Array.isArray(d.frames)) return;
        const m = new Map<string, string>();
        for (const f of d.frames) {
          if (f.imageUrl) m.set(String(f.id), String(f.imageUrl));
        }
        if (!cancelled) setFrameImg(m.get(String(authUser.frame)) || frameSrcFallback(authUser.frame));
      })
      .catch(() => {
        if (!cancelled) setFrameImg(frameSrcFallback(authUser.frame));
      });
    return () => { cancelled = true; };
  }, [authUser?.frame]);

  // Pre-fill player name from authUser if logged in
  useEffect(() => {
    if (authUser?.displayName) {
      setPlayerNameState(authUser.displayName);
      setPlayerName(authUser.displayName);
    }
  }, [authUser?.displayName, setPlayerName]);

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
        body: JSON.stringify({ code, hostName: playerName || authUser?.displayName || 'العراب' }),
      }).catch(() => {});
      setRoomCode(code);
    }
  }, [gameMode, setRoomCode, playerName, authUser?.displayName]);

  const handleStart = async () => {
    const name = playerName.trim() || authUser?.displayName || 'اللاعب';
    setPlayerName(name);
    setDifficulty(difficulty);
    setTotalRounds(totalRounds);
    // Persist settings via setState (Difficulty selector owns the time)
    useSpotDiffStore.setState({
      fastestFinish,
      wrongCount,
    });
    setCatalogLoading(true);
    try { await loadFlashiCatalog(); } catch (e) { /* ignore — fallback to SVG */ }
    setCatalogLoading(false);
    startGame();
  };

  const handleExit = () => {
    resetGame();
    router.push('/');
  };

  const isValid = !!authUser || playerName.trim().length > 0;

  // Helper: small section header
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      ...STROKE_STYLE,
      fontSize: '11px',
      fontWeight: 800,
      letterSpacing: '0.3px',
      marginBottom: '4px',
      marginTop: '8px',
    }}>{children}</div>
  );

  // Helper: Tobol-style select
  const TobolSelect = ({
    value, onChange, options, ariaLabel,
  }: {
    value: string | number;
    onChange: (v: string) => void;
    options: Array<{ value: string | number; label: string }>;
    ariaLabel: string;
  }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        background: 'rgba(8,28,22,.85)',
        color: '#feef91',
        border: '1px solid rgba(254,239,145,.3)',
        borderRadius: '8px',
        padding: '8px 10px',
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

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
        padding: '8px 14px 30px',
        gap: '8px',
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
            style={{ width: '26px', height: '26px' }}
          />
        </button>
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowExitDialog(true)}
          aria-label="خروج"
          title="خروج"
        >
          <img src="/battle/btn_exit.webp" alt="exit" style={{ width: '26px', height: '26px' }} />
        </button>
      </div>

      {/* ══════════ Title + game image (Tobol style) ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '50px', marginBottom: '4px' }}
      >
        {/* Game cover image (transparent PNG, no white bg) */}
        <img
          src="/yalla-games/spotdiff.png"
          alt="اختلاف الصور"
          draggable={false}
          style={{
            width: '140px',
            height: '112px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.5))',
            marginBottom: '6px',
          }}
        />
        <h1 style={{
          ...STROKE_STYLE,
          fontSize: '22px',
          fontWeight: 900,
          textShadow: '0 2px 4px rgba(0,0,0,.85)',
          margin: '2px 0 0',
          lineHeight: 1,
        }}>
          اختلاف الصور
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Spot the Difference
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
        <span style={{
          ...STROKE_STYLE,
          fontSize: '13px',
          fontWeight: 800,
          letterSpacing: '0.4px',
        }}>
          تجهيز اللعبة
        </span>
      </motion.div>

      {/* ══════════ Player info (avatar + name + frame if authed) ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="tobol-team-card"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '4px',
          borderRadius: '12px',
        }}
      >
        {authUser ? (
          // Logged-in: show avatar + frame (no input)
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              flexShrink: 0,
            }}>
              <span className="avatar-frame-wrap" style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
                <img
                  src={avatarSrc(authUser.avatar, authUser.id)}
                  alt={authUser.displayName || 'اللاعب'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    if (!t.src.includes('defaultPhoto_')) {
                      t.src = '/yalla-avatars/defaultPhoto_1.png';
                    }
                  }}
                />
                {frameImg && (
                  <SvgaOrImg src={frameImg} alt="" />
                )}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                ...STROKE_STYLE,
                fontSize: '13px',
                fontWeight: 800,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {authUser.displayName || authUser.username || 'العراب'}
              </div>
              <div style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
                ✓ أنت العرّاب — تم تسجيل الدخول
              </div>
            </div>
          </div>
        ) : (
          // Not logged in: show input
          <>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254,239,145,.22), rgba(170,110,31,.08))',
              border: '1px solid rgba(254,239,145,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '18px' }}>🧑</span>
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
          </>
        )}
      </motion.div>

      {/* ══════════ Settings grid (نوع الصور + عدد الأخطائ + الأسرع (الوقت عبر Difficulty)) ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.3 }}
        className="tobol-team-card"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '10px 12px',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <SectionLabel>نوع الصور</SectionLabel>
            <TobolSelect
              value={flashiCategory}
              onChange={(v) => setFlashiCategory(v as FlashiCategory | 'random')}
              options={Object.entries(FLASHI_CATEGORY_LABELS).map(([val, label]) => ({ value: val, label }))}
              ariaLabel="نوع الصور"
            />
          </div>
          <div>
            <SectionLabel>عدد الأخطائ</SectionLabel>
            <TobolSelect
              value={wrongCount}
              onChange={(v) => useSpotDiffStore.setState({ wrongCount: parseInt(v) })}
              options={[1,2,3,4,5,6,7,8,9,10].map(n => ({ value: n, label: String(n) }))}
              ariaLabel="عدد الأخطائ"
            />
          </div>
          <div>
            <SectionLabel>الأسرع</SectionLabel>
            <TobolSelect
              value={fastestFinish ? 'yes' : 'no'}
              onChange={(v) => useSpotDiffStore.setState({ fastestFinish: v === 'yes' })}
              options={[{ value: 'yes', label: 'نعم' }, { value: 'no', label: 'لا' }]}
              ariaLabel="الأسرع"
            />
          </div>
        </div>
      </motion.div>

      {/* ══════════ Round count selector ══════════ */}
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
        {ROUND_COUNT_OPTIONS.map((opt) => {
          const selected = totalRounds === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTotalRounds(opt.value)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: '10px',
                border: `1.5px solid ${selected ? 'rgba(254,239,145,.65)' : 'rgba(255,255,255,.12)'}`,
                background: selected
                  ? 'linear-gradient(135deg, rgba(254,239,145,.18), rgba(170,110,31,.08))'
                  : 'rgba(6,42,32,.55)',
                color: selected ? '#feef91' : '#9fc4b4',
                fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                boxShadow: selected ? '0 0 10px rgba(254,239,145,.2)' : 'none',
              }}
            >
              <span style={{ fontSize: '15px' }}>{opt.value === 3 ? '🎯' : opt.value === 5 ? '🔥' : '🏆'}</span>
              {opt.label}
            </button>
          );
        })}
      </motion.div>

      {/* ══════════ Difficulty selector ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.3 }}
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
                flex: 1, padding: '8px 4px', borderRadius: '10px',
                border: `1.5px solid ${selected ? color + 'AA' : 'rgba(255,255,255,.12)'}`,
                background: selected
                  ? `linear-gradient(135deg, ${color}26, ${color}0d)`
                  : 'rgba(6,42,32,.55)',
                color: selected ? color : '#9fc4b4',
                fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                boxShadow: selected ? `0 0 10px ${color}33` : 'none',
              }}
            >
              <span style={{ fontSize: '13px' }}>{cfg.timePerRoundSec}s</span>
              {cfg.label}
            </button>
          );
        })}
      </motion.div>

      {/* ══════════ Start button ══════════ */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.3 }}
        whileHover={isValid ? { scale: 1.02 } : {}}
        whileTap={isValid ? { scale: 0.97 } : {}}
        onClick={handleStart}
        disabled={!isValid || catalogLoading}
        className="tobol-start-btn"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '14px 16px',
          border: 'none',
          color: '#feef91',
          fontSize: '17px',
          fontWeight: 900,
          cursor: isValid && !catalogLoading ? 'pointer' : 'not-allowed',
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
          <span style={{ fontSize: '18px' }}>{catalogLoading ? '⏳' : '🔍'}</span>
        </span>
        <span>{catalogLoading ? 'جاري تحميل الصور...' : 'ابدأ اللعبة'}</span>
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
              className="tobol-team-card"
              style={{
                padding: '20px', width: '100%', maxWidth: '300px',
                textAlign: 'center', borderRadius: '18px',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{
                ...STROKE_STYLE,
                fontSize: '17px',
                fontWeight: 900,
                marginBottom: '6px',
              }}>
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
