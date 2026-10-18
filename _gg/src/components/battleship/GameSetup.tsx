'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useBattleshipStore, generateBattleshipRoomCode } from '@/lib/battleship-store';
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
} from '@/lib/battleship-types';
import {
  GUESS_GRID_OPTIONS,
  GUESS_THEME_COUNT,
  getGuessThemeCatalog,
  buildGuessThemeUrl,
} from '@/lib/flashi_guess_images';
import SvgaOrImg from '@/components/shared/SvgaOrImg';

// Minimal authUser shape (subset of AppShellUser) — fetched directly from
// /api/auth/me because /battleship is NOT in SHELL_ROUTES.
interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  frame?: string;
}

// Timer duration options (matching flashi)
const TIMER_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 30, label: '30 ثانية' },
  { value: 60, label: 'دقيقة' },
  { value: 90, label: 'دقيقة ونصف' },
  { value: 120, label: 'دقيقتان' },
  { value: 180, label: '3 دقائق' },
  { value: 240, label: '4 دقائق' },
  { value: 300, label: '5 دقائق' },
];

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

  // Fetch authed user directly
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
    setPlayerName, setTotalRounds,
    startGame, resetGame, gameMode, setRoomCode,
    totalRounds,
    gridSquares, setGridSquares,
    themeId, setThemeId,
    timerValueSec,
    roomCode,
  } = useBattleshipStore();

  const [playerName, setPlayerNameState] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [frameImg, setFrameImg] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

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

  // For diwaniya mode: create room on mount
  useEffect(() => {
    if (gameMode !== 'diwaniya') return;
    if (!useBattleshipStore.getState().roomCode) {
      const code = generateBattleshipRoomCode();
      fetch('/api/battleship-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, hostName: playerName || authUser?.displayName || 'العراب' }),
      }).catch(() => {});
      setRoomCode(code);
    }
  }, [gameMode, setRoomCode, playerName, authUser?.displayName]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const handleStart = () => {
    const name = playerName.trim() || authUser?.displayName || 'اللاعب';
    setPlayerName(name);
    setTotalRounds(totalRounds);
    useBattleshipStore.setState({
      timerValueSec,
      gridSquares,
      themeId,
    });
    setCatalogLoading(true);
    // No async fetch needed — catalog is built statically in getBattleshipCatalog
    setTimeout(() => {
      setCatalogLoading(false);
      startGame();
    }, 100);
  };

    const handleExit = () => {
    // Explicit exit = FORFEIT
    try {
      useBattleshipStore.getState().resetGame();
    } catch { /* ignore */ }
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('battleship-game-storage');
        localStorage.removeItem('battleship-game-storage__disconnect_ts');
      }
    } catch { /* ignore */ }
    setShowExitDialog(false);
    setShowQuitDialog(false);
    router.push('/#games');
  };

  const isValid = !!authUser || playerName.trim().length > 0;

  // Build the shareable watch link (diwaniya mode)
  const watchLink = typeof window !== 'undefined' && roomCode
    ? `${window.location.origin}/r/battleship/${roomCode}`
    : '';
  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied('code');
      setTimeout(() => setCopied(null), 1800);
    } catch { /* ignore */ }
  };
  const handleCopyLink = async () => {
    if (!watchLink) return;
    try {
      await navigator.clipboard.writeText(watchLink);
      setCopied('link');
      setTimeout(() => setCopied(null), 1800);
    } catch { /* ignore */ }
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      color: '#feef91',
      paintOrder: 'stroke fill',
      WebkitTextStroke: '1px #aa6e1f',
      fontSize: '11px',
      fontWeight: 800,
      letterSpacing: '0.3px',
      marginBottom: '4px',
      marginTop: '8px',
    }}>{children}</div>
  );

  // Theme catalog (1..6)
  const themes = getGuessThemeCatalog();

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
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
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

      {/* ══════════ Title + game image ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '50px', marginBottom: '4px' }}
      >
        <img
          src="/yalla-games/battleship.png"
          alt="سفن"
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
          color: '#feef91',
          paintOrder: 'stroke fill',
          WebkitTextStroke: '1px #aa6e1f',
          fontSize: '22px',
          fontWeight: 900,
          textShadow: '0 2px 4px rgba(0,0,0,.85)',
          margin: '2px 0 0',
          lineHeight: 1,
        }}>
          سفن
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Battleship — Memory Match-2
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
        <span style={{ fontSize: '13px' }}>🚢</span>
        <span style={{
          color: '#feef91',
          paintOrder: 'stroke fill',
          WebkitTextStroke: '1px #aa6e1f',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
              <span className="avatar-frame-wrap" style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                  <img
                    src={avatarSrc(authUser.avatar, authUser.id)}
                    alt={authUser.displayName || 'اللاعب'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      if (!t.src.includes('defaultPhoto_')) t.src = '/yalla-avatars/defaultPhoto_1.png';
                    }}
                  />
                </div>
                {frameImg && <SvgaOrImg src={frameImg} alt="" />}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#feef91',
                paintOrder: 'stroke fill',
                WebkitTextStroke: '1px #aa6e1f',
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

      {/* ══════════ Diwaniya share card ══════════ */}
      {gameMode === 'diwaniya' && roomCode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.3 }}
          className="tobol-team-card"
          style={{
            width: '100%',
            maxWidth: '380px',
            padding: '10px 14px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{
            color: '#feef91',
            paintOrder: 'stroke fill',
            WebkitTextStroke: '1px #aa6e1f',
            fontSize: '12px',
            fontWeight: 800,
            textAlign: 'center',
          }}>
            📡 شارك الغرفة مع أصدقائك
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0,0,0,.4)',
            border: '1px solid rgba(254,239,145,.3)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}>
            <span style={{ color: '#feef91', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>كود:</span>
            <span style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '20px',
              fontWeight: 900,
              color: '#feef91',
              letterSpacing: '3px',
              flex: 1,
              textAlign: 'center',
            }}>{roomCode}</span>
            <button
              onClick={handleCopyCode}
              style={{
                background: copied === 'code'
                  ? 'linear-gradient(135deg, #22c55e, #15803d)'
                  : 'linear-gradient(135deg, #fbbf24, #aa6e1f)',
                color: copied === 'code' ? '#fff' : '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {copied === 'code' ? '✓ تم' : 'نسخ'}
            </button>
          </div>
          <button
            onClick={handleCopyLink}
            style={{
              width: '100%',
              background: 'rgba(8,28,22,.85)',
              border: '1px solid rgba(254,239,145,.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              color: copied === 'link' ? '#86efac' : '#feef91',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={watchLink}
          >
            {copied === 'link' ? '✓ تم نسخ الرابط' : '🔗 نسخ رابط المشاهدة'}
          </button>
          <p style={{ fontSize: '10px', color: '#9fc4b4', textAlign: 'center', fontWeight: 600, marginTop: '2px' }}>
            💡 من يفتح الرابط سيدخل تلقائياً إن كان مسجّلاً، أو سيُطلب منه إدخال اسمه
          </p>
        </motion.div>
      )}

      {/* ══════════ Grid size + theme selectors ══════════ */}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <SectionLabel>حجم الشبكة</SectionLabel>
            <select
              value={gridSquares}
              onChange={(e) => setGridSquares(parseInt(e.target.value))}
              aria-label="حجم الشبكة"
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
              {GUESS_GRID_OPTIONS.map(opt => (
                <option key={opt.squares} value={opt.squares}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <SectionLabel>الثيم</SectionLabel>
            <select
              value={themeId}
              onChange={(e) => setThemeId(parseInt(e.target.value))}
              aria-label="الثيم"
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
              {themes.map(t => (
                <option key={t.id} value={t.id}>ثيم {t.id}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* ══════════ Theme preview image ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
        }}
      >
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setThemeId(t.id)}
            style={{
              flex: '0 0 60px',
              width: '60px',
              height: '48px',
              borderRadius: '6px',
              border: themeId === t.id ? '2px solid #fbbf24' : '1px solid rgba(254,239,145,.2)',
              overflow: 'hidden',
              cursor: 'pointer',
              padding: 0,
              background: 'rgba(0,0,0,.4)',
              boxShadow: themeId === t.id ? '0 0 10px rgba(251,191,36,.4)' : 'none',
            }}
          >
            <img
              src={t.previewUrl}
              alt={`ثيم ${t.id}`}
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        ))}
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
              onClick={() => useBattleshipStore.setState({ totalRounds: opt.value })}
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
          const selected = useBattleshipStore.getState().difficulty === d;
          const color = d === 'easy' ? '#34d399' : d === 'medium' ? '#fbbf24' : '#ef4444';
          return (
            <button
              key={d}
              onClick={() => useBattleshipStore.setState({ difficulty: d })}
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
          <span style={{ fontSize: '18px' }}>{catalogLoading ? '⏳' : '🚢'}</span>
        </span>
        <span>{catalogLoading ? 'جاري تحميل...' : 'ابدأ اللعبة'}</span>
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
                color: '#feef91',
                paintOrder: 'stroke fill',
                WebkitTextStroke: '1px #aa6e1f',
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
