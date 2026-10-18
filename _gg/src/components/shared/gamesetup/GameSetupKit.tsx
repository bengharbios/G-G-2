'use client';

// ════════════════════════════════════════════════════════════════
// GameSetupKit — Shared building blocks for ALL game setup pages.
// Pattern lifted from spotdiff/GameSetup (the canonical reference).
//
// Usage:
//   <GameSetupShell gameSlug="ships" gameName="سفن" gameImage="...">
//     <GameSetupTitle ... />
//     <PlayerInfoCard ... />
//     <DiwaniyaShareCard ... />
//     {settings}
//     <StartButton onClick={...} />
//   </GameSetupShell>
//
// All pieces are responsive (mobile-first), use the same .tobol-*
// classes, the same STROKE_STYLE, the same exit dialog, and the
// same sound toggle behaviour. New games just import the kit and
// pass their game-specific settings as children.
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
} from '@/lib/sounds';
import SvgaOrImg from '@/components/shared/SvgaOrImg';

// ─── Stroke text style (Yalla Ludo "StrokeTextStyle_Yes") ──────
export const STROKE_STYLE: CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

// ─── Auth user shape (subset of AppShellUser) ──────────────────
export interface SetupAuthUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  frame?: string;
}

// ─── Frame asset helpers (mirror SiteHeader logic) ────────────
export function frameSrcFallback(frameId?: string | null): string | null {
  const id = (frameId || '').trim();
  if (!id) return null;
  return /^\d+$/.test(id) ? `/yalla-frames/${id}.png` : null;
}

export function avatarSrc(avatar?: string, id?: string): string {
  if (avatar) return avatar;
  const seed = (parseInt(id || '', 10) || 0) % 12 + 1;
  return `/yalla-avatars/defaultPhoto_${seed}.png`;
}

// ════════════════════════════════════════════════════════════════
// useSetupAuth — fetches /api/auth/me + frame image
// Used by PlayerInfoCard and any game that wants the authed avatar.
// ════════════════════════════════════════════════════════════════
export function useSetupAuth(): {
  authUser: SetupAuthUser | null;
  frameImg: string | null;
} {
  const [authUser, setAuthUser] = useState<SetupAuthUser | null>(null);
  const [frameImg, setFrameImg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.user) setAuthUser(data.user as SetupAuthUser);
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

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

  return { authUser, frameImg };
}

// ════════════════════════════════════════════════════════════════
// useInGameSetupMode — adds `in-game-setup` body class to hide the
// floating SiteHeader actions + bottom nav (matches all current games)
// ════════════════════════════════════════════════════════════════
export function useInGameSetupMode(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => {
      document.body.classList.remove('in-game-setup');
    };
  }, []);
}

// ════════════════════════════════════════════════════════════════
// GameSetupShell — full-page wrapper. Renders the dark war bg,
// the fixed sound + exit header (top-left in RTL), and the scroll
// container. Children are stacked vertically, centered, 380px max.
// ════════════════════════════════════════════════════════════════
interface GameSetupShellProps {
  gameSlug: string;
  gameName: string;
  gameImage: string;
  backgroundImage?: string;          // override background URL
  children: ReactNode;
  /** Called when user confirms exit. Default: end diwaniya room (if any) + go home + PRESERVE state */
  onExit?: () => void;
  /** Diwaniya room code (if active) — used to end the room session on exit */
  roomCode?: string | null;
  /** Endpoint prefix for ending room, e.g. '/api/ships-room'. If provided + roomCode, exit will DELETE it. */
  roomApiPrefix?: string;
  /** Exit dialog body text */
  exitDialogText?: string;
  /** If false, sound button is hidden (some games have no music) */
  showSoundToggle?: boolean;
}

export function GameSetupShell({
  gameSlug,
  gameName,
  gameImage,
  backgroundImage,
  children,
  onExit,
  roomCode,
  roomApiPrefix,
  exitDialogText,
  showSoundToggle = true,
}: GameSetupShellProps) {
  const router = useRouter();
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useInGameSetupMode();

  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  }, [musicOn]);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }, [soundOn]);

  const handleExit = useCallback(() => {
    setShowExitDialog(false);
    // Default exit behaviour: end diwaniya room (fire-and-forget),
    // then go to home page. We DO NOT wipe the persisted game state —
    // zustand persist keeps it in localStorage so the user can return.
    if (roomCode && roomApiPrefix) {
      try {
        fetch(`${roomApiPrefix}/${roomCode}`, { method: 'DELETE' }).catch(() => {});
      } catch { /* ignore */ }
    }
    if (onExit) {
      onExit();
    } else {
      router.push('/');
    }
  }, [onExit, roomCode, roomApiPrefix, router]);

  const bg = backgroundImage
    ? `url(${backgroundImage}) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)`
    : `url(/battle/game_bg.webp) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)`;

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 30px',
        gap: '8px',
        overflowY: 'auto',
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
      }}
      aria-label={`${gameName} — تجهيز المعركة`}
    >
      {/* ══ Header actions: sound + exit (top-left in RTL) ══ */}
      <div className="tobol-header-actions">
        {showSoundToggle && (
          <>
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
              className={`tobol-header-btn ${soundOn ? 'active' : ''}`}
              onClick={toggleSound}
              aria-label={soundOn ? 'كتم المؤثرات' : 'تشغيل المؤثرات'}
              title={soundOn ? 'كتم المؤثرات' : 'تشغيل المؤثرات'}
            >
              <img
                src={soundOn ? '/battle/icon_sfx_on.webp' : '/battle/icon_sfx_off.webp'}
                alt="sfx"
                style={{ width: '26px', height: '26px' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </button>
          </>
        )}
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

      {children}

      {/* ══ Exit dialog (shared) ══ */}
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
              <p style={{
                color: '#9fc4b4',
                fontSize: '12px',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}>
                {exitDialogText ?? 'سيتم إنهاء الجلسة وحفظ تقدمك تلقائياً — يمكنك العودة لاحقاً من مكانك.'}
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

// ════════════════════════════════════════════════════════════════
// GameSetupTitle — image + name + "تجهيز المعركة" pill
// ════════════════════════════════════════════════════════════════
interface GameSetupTitleProps {
  gameImage: string;
  gameName: string;
  gameNameEn?: string;
  pillLabel?: string;
  pillEmoji?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export function GameSetupTitle({
  gameImage,
  gameName,
  gameNameEn,
  pillLabel = 'تجهيز المعركة',
  pillEmoji = '⚔️',
  imageWidth = 140,
  imageHeight = 112,
}: GameSetupTitleProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '50px', marginBottom: '4px' }}
      >
        <img
          src={gameImage}
          alt={gameName}
          draggable={false}
          style={{
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
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
          {gameName}
        </h1>
        {gameNameEn && (
          <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
            {gameNameEn}
          </p>
        )}
      </motion.div>

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
        <span style={{ fontSize: '13px' }}>{pillEmoji}</span>
        <span style={{
          ...STROKE_STYLE,
          fontSize: '13px',
          fontWeight: 800,
          letterSpacing: '0.4px',
        }}>
          {pillLabel}
        </span>
      </motion.div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// PlayerInfoCard — avatar + name (input if not authed, static if authed)
// Uses useSetupAuth internally so the consuming game doesn't need to.
// Calls onNameChange(name) so the game store can persist it.
// ════════════════════════════════════════════════════════════════
interface PlayerInfoCardProps {
  /** Initial player name (from store) */
  initialName?: string;
  /** Called whenever the name input changes */
  onNameChange?: (name: string) => void;
  /** Override the auth user (e.g., if the game already fetched it). If omitted, the card fetches itself. */
  authUser?: SetupAuthUser | null;
  frameImg?: string | null;
  /** Label next to the name input */
  nameLabel?: string;
  /** Placeholder for the name input */
  namePlaceholder?: string;
}

export function PlayerInfoCard({
  initialName = '',
  onNameChange,
  authUser: authUserProp,
  frameImg: frameImgProp,
  nameLabel = 'اسمك',
  namePlaceholder = 'اكتب اسمك هنا...',
}: PlayerInfoCardProps) {
  // Use provided auth user, or fetch our own
  const fetched = useSetupAuth();
  const authUser = authUserProp ?? fetched.authUser;
  const frameImg = frameImgProp ?? fetched.frameImg;

  const [playerName, setPlayerName] = useState(initialName);

  // Hold the latest onNameChange callback in a ref so the effect below
  // doesn't depend on it (it would otherwise re-run on every parent render
  // if the parent passes an inline arrow function — causing a setState
  // loop and "Maximum update depth exceeded" React error #185).
  const onNameChangeRef = useRef(onNameChange);
  useEffect(() => {
    onNameChangeRef.current = onNameChange;
  });

  // Pre-fill from authed user (only when the displayName actually changes)
  useEffect(() => {
    if (authUser?.displayName) {
      setPlayerName(authUser.displayName);
      onNameChangeRef.current?.(authUser.displayName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.displayName]);

  return (
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
                    if (!t.src.includes('defaultPhoto_')) {
                      t.src = '/yalla-avatars/defaultPhoto_1.png';
                    }
                  }}
                />
              </div>
              {frameImg && <SvgaOrImg src={frameImg} alt="" />}
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
            {nameLabel}
          </span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              onNameChange?.(e.target.value);
            }}
            placeholder={namePlaceholder}
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
  );
}

// ════════════════════════════════════════════════════════════════
// DiwaniyaShareCard — code + copy link + share button + hint
// ════════════════════════════════════════════════════════════════
interface DiwaniyaShareCardProps {
  roomCode: string;
  /** Deep-link base path, e.g., `/r/ships` — full link becomes `${origin}/r/ships/${code}` */
  deepLinkBase: string;
  /** Hint text below the share buttons */
  hint?: string;
}

export function DiwaniyaShareCard({
  roomCode,
  deepLinkBase,
  hint = '💡 من يفتح الرابط سيدخل تلقائياً إن كان مسجّلاً، أو سيُطلب منه إدخال اسمه',
}: DiwaniyaShareCardProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const watchLink = typeof window !== 'undefined' && roomCode
    ? `${window.location.origin}${deepLinkBase}/${roomCode}`
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

  const handleShareLink = async () => {
    if (!watchLink || !navigator.share) return;
    try {
      await navigator.share({
        title: 'انضم كمشاهد',
        text: `انضم لمشاهدة اللعبة في غرفتي (كود: ${roomCode})`,
        url: watchLink,
      });
    } catch { /* user cancelled */ }
  };

  return (
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
        ...STROKE_STYLE,
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
        <span style={{
          ...STROKE_STYLE,
          fontSize: '11px',
          fontWeight: 700,
          flexShrink: 0,
        }}>كود:</span>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={handleCopyLink}
          style={{
            flex: 1,
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
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={handleShareLink}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            مشاركة
          </button>
        )}
      </div>

      <p style={{
        fontSize: '10px',
        color: '#9fc4b4',
        textAlign: 'center',
        fontWeight: 600,
        marginTop: '2px',
      }}>
        {hint}
      </p>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// SectionLabel — small section heading inside a settings card
// ════════════════════════════════════════════════════════════════
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      ...STROKE_STYLE,
      fontSize: '11px',
      fontWeight: 800,
      letterSpacing: '0.3px',
      marginBottom: '4px',
      marginTop: '8px',
    }}>{children}</div>
  );
}

// ════════════════════════════════════════════════════════════════
// TobolSelect — styled dropdown matching the war theme
// ════════════════════════════════════════════════════════════════
interface TobolSelectProps {
  value: string | number;
  onChange: (v: string) => void;
  options: Array<{ value: string | number; label: string }>;
  ariaLabel: string;
}

export function TobolSelect({ value, onChange, options, ariaLabel }: TobolSelectProps) {
  return (
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
}

// ════════════════════════════════════════════════════════════════
// SettingsCard — wrapper card for select inputs grid
// ════════════════════════════════════════════════════════════════
interface SettingsCardProps {
  children: ReactNode;
  columns?: number;
}

export function SettingsCard({ children, columns = 2 }: SettingsCardProps) {
  return (
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '8px',
      }}>
        {children}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// ChoiceButtonRow — for round-count-style choices (e.g., 1/3/5 rounds)
// ════════════════════════════════════════════════════════════════
interface ChoiceOption {
  value: number | string;
  label: string;
  emoji?: string;
}

interface ChoiceButtonRowProps {
  options: ChoiceOption[];
  value: number | string;
  onChange: (v: number | string) => void;
}

export function ChoiceButtonRow({ options, value, onChange }: ChoiceButtonRowProps) {
  return (
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
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
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
            {opt.emoji && <span style={{ fontSize: '15px' }}>{opt.emoji}</span>}
            {opt.label}
          </button>
        );
      })}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// StartButton — the big "ابدأ اللعبة / ابدأ المعركة" button
// ════════════════════════════════════════════════════════════════
interface StartButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  loadingLabel?: string;
  emoji?: string;
  delay?: number;
}

export function StartButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'ابدأ المعركة',
  loadingLabel = 'جاري التحميل...',
  emoji = '⚔️',
  delay = 0.48,
}: StartButtonProps) {
  const isValid = !disabled && !loading;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={isValid ? { scale: 1.02 } : {}}
      whileTap={isValid ? { scale: 0.97 } : {}}
      onClick={onClick}
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
        <span style={{ fontSize: '18px' }}>{loading ? '⏳' : emoji}</span>
      </span>
      <span>{loading ? loadingLabel : label}</span>
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════
// GenericCard — generic .tobol-team-card wrapper for custom content
// ════════════════════════════════════════════════════════════════
interface GenericCardProps {
  children: ReactNode;
  maxWidth?: number;
  delay?: number;
}

export function GenericCard({ children, maxWidth = 380, delay = 0.3 }: GenericCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="tobol-team-card"
      style={{
        width: '100%',
        maxWidth: `${maxWidth}px`,
        padding: '12px',
        borderRadius: '12px',
      }}
    >
      {children}
    </motion.div>
  );
}
