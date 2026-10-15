'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSpotDiffStore } from '@/lib/spotdiff-store';
import { DIFFICULTY_CONFIG } from '@/lib/spotdiff-types';
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

interface MissMarker {
  id: number;
  x: number; y: number; // normalized 0..1
}

interface ChatMsg {
  id: number;
  sender: string;
  text: string;
}

const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👏', '🙏', '🔥', '🎯', '🔍', '💡', '⭐', '✓', '✗', '🏆', '🎉', '💯', '❤️', '🖼️', '👀', '⏱️'];

// ============================================================
// Click result feedback (✓ hit, ✗ miss) — small floating animation
// ============================================================
function ClickFeedback({ id, kind, x, y, onDone }: {
  id: number;
  kind: 'hit' | 'miss';
  x: number; y: number;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      key={id}
      initial={{ opacity: 1, scale: 0.6, y: 0 }}
      animate={{ opacity: 0, scale: 1.4, y: -30 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)',
        color: kind === 'hit' ? '#86efac' : '#f87171',
        fontSize: '20px',
        fontWeight: 900,
        textShadow: '0 1px 4px rgba(0,0,0,.8)',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {kind === 'hit' ? '✓ +100' : '✗'}
    </motion.div>
  );
}

// ============================================================
// Header Chat Button (table-side chat for diwaniya)
// ============================================================
function HeaderChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setShowEmojis(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg: ChatMsg = { id: Date.now(), sender: 'لاعب', text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setShowEmojis(false);
  };

  return (
    <>
      <button
        type="button"
        className={`tobol-header-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="دردشة الطاولة"
        title="دردشة الطاولة"
        style={{ position: 'relative' }}
      >
        <img src="/battle/icon_chat.webp" alt="chat" />
        {unread > 0 && <span className="chat-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="tobol-chat-panel-overlay"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-chat-panel"
            >
              <div className="tobol-chat-panel-header">
                <span className="tobol-chat-panel-title">
                  <img src="/battle/icon_chat.webp" alt="" style={{ width: '16px', height: '16px' }} />
                  دردشة الطاولة
                </span>
                <button onClick={() => setIsOpen(false)} className="tobol-chat-panel-close" aria-label="إغلاق">×</button>
              </div>
              <div className="tobol-chat-panel-body">
                {messages.length === 0 ? (
                  <p className="tobol-chat-empty">
                    لا رسائل بعد — أرسل أول رسالة.
                    <br />
                    (الدردشة مؤقتة، تُحذف عند إغلاق اللعبة)
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="tobol-chat-msg me">
                      <span className="msg-sender">{m.sender}</span>
                      <span className="msg-bubble">{m.text}</span>
                    </div>
                  ))
                )}
                <div ref={msgEndRef} />
              </div>
              <AnimatePresence>
                {showEmojis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="tobol-emoji-picker">
                      {EMOJIS.map((e, i) => (
                        <button key={i} type="button" onClick={() => handleEmojiClick(e)} aria-label={`emoji ${e}`}>{e}</button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="tobol-chat-panel-input-row">
                <button
                  type="button"
                  className="tobol-emoji-btn"
                  onClick={() => setShowEmojis(p => !p)}
                  aria-label="إيموجي"
                  title="إيموجي"
                >
                  <img src="/battle/icon_chat_emoji.webp" alt="emoji" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="أرسل رسالة..."
                  maxLength={200}
                  dir="rtl"
                />
                <button onClick={handleSend} disabled={!input.trim()}>إرسال</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  function handleEmojiClick(emoji: string) {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  }
}

// ============================================================
// MAIN GAME BOARD
// ============================================================
export default function GameBoard() {
  const router = useRouter();
  const {
    phase, gameMode, roomCode, currentRound, currentRoundData,
    foundDifferences, differences, score, timeLeft, totalRounds,
    totalFound, totalDifferences, findDifference, registerMiss,
    tickTimer, resetGame,
  } = useSpotDiffStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Array<{ id: number; kind: 'hit' | 'miss'; x: number; y: number }>>([]);
  const [misses, setMisses] = useState<MissMarker[]>([]);
  const imgBRef = useRef<HTMLImageElement>(null);
  const imgBWrapperRef = useRef<HTMLDivElement>(null);
  const nextFeedbackId = useRef(0);
  const nextMissId = useRef(0);

  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;

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

  // Timer tick — call store's tickTimer every 1 second
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, tickTimer]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const handleQuitGame = () => {
    resetGame();
    router.push('/spotdiff');
  };

  const handleImageBClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!currentRoundData) return;
    const img = imgBRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    // Compute click position relative to image bounds (in pixels)
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Normalize to 0..1
    const nx = px / rect.width;
    const ny = py / rect.height;

    // Check if click hits any unfound difference (distance from center ≤ radius)
    // Note: x is in 0..1 normalized coords, radius is relative to image width
    // For "distance" comparison, we need to consider aspect ratio:
    // distance² in pixels = (dx * width)² + (dy * height)²
    // For "in radius" check, radius is relative to width: r_px = r * width
    // So the test is: (dx * width)² + (dy * height)² ≤ (r * width)²
    // Simplify: dx² + (dy * (height/width))² ≤ r²
    const aspectRatio = rect.height / rect.width;

    let hitSpot: { id: string } | null = null;
    for (const d of differences) {
      if (d.found) continue;
      const dx = nx - d.x;
      const dy = ny - d.y;
      const distSqNorm = dx * dx + (dy * aspectRatio) * (dy * aspectRatio);
      if (distSqNorm <= d.radius * d.radius) {
        hitSpot = d;
        break;
      }
    }

    const fbId = nextFeedbackId.current++;
    if (hitSpot) {
      const ok = findDifference(hitSpot.id);
      if (ok) {
        setFeedbacks(prev => [...prev, { id: fbId, kind: 'hit', x: nx, y: ny }]);
      }
    } else {
      registerMiss();
      const missId = nextMissId.current++;
      setMisses(prev => [...prev, { id: missId, x: nx, y: ny }]);
      setFeedbacks(prev => [...prev, { id: fbId, kind: 'miss', x: nx, y: ny }]);
      // Remove miss marker after 1.5s
      setTimeout(() => {
        setMisses(prev => prev.filter(m => m.id !== missId));
      }, 1500);
    }
  };

  if (!currentRoundData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9fc4b4' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔍</div>
        <p>جاري تحميل الجولة...</p>
      </div>
    );
  }

  const cfg = DIFFICULTY_CONFIG[useSpotDiffStore.getState().difficulty];
  const foundCount = foundDifferences.length;
  const totalForRound = currentRoundData.differences.length;
  const timeColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 30 ? '#fbbf24' : '#feef91';

  return (
    <div
      dir="rtl"
      style={{
        position: 'relative',
        height: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 16px',
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ Header actions ══════════ */}
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
        <HeaderChatButton />
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowQuitDialog(true)}
          aria-label="إنهاء اللعبة بدون حفظ"
          title="إنهاء اللعبة بدون حفظ"
        >
          <img src="/battle/btn_quit_game.webp" alt="quit" />
        </button>
      </div>

      {/* ══════════ Title ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ fontSize: '28px' }}>🔍</div>
        <h1 style={{
          ...STROKE_STYLE, fontSize: '18px', fontWeight: 900,
          textShadow: '0 2px 4px rgba(0,0,0,.85)',
          margin: '2px 0 0', lineHeight: 1,
        }}>اختلاف الصور</h1>
      </motion.div>

      {/* ══════════ Stats row: Round + Score + Timer ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          width: '100%', maxWidth: '440px',
          display: 'flex', gap: '6px', alignItems: 'stretch',
        }}
      >
        {/* Round counter */}
        <div className="tobol-team-panel-compact team-red" style={{ flex: 1 }}>
          <div className="tobol-team-name-display">الجولة</div>
          <div className="tobol-team-divider-compact" />
          <div className="tobol-team-score-compact">{currentRound + 1}/{totalRounds}</div>
        </div>
        {/* Score */}
        <div className="tobol-team-panel-compact team-blue" style={{ flex: 1 }}>
          <div className="tobol-team-name-display">نقاطك</div>
          <div className="tobol-team-divider-compact" />
          <div className="tobol-team-score-compact">{score}</div>
        </div>
        {/* Timer */}
        <div
          className="tobol-team-panel-compact team-red"
          style={{ flex: 1, borderColor: timeColor + '55' }}
        >
          <div className="tobol-team-name-display">الوقت</div>
          <div className="tobol-team-divider-compact" />
          <div className="tobol-team-score-compact" style={{ color: timeColor }}>{timeLeft}s</div>
        </div>
      </motion.div>

      {/* ══════════ Round title + found progress ══════════ */}
      <motion.div
        key={currentRoundData.id + String(currentRound)}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', gap: '10px', alignItems: 'center',
          padding: '4px 14px', borderRadius: '999px',
          background: 'rgba(6,42,32,.65)',
          border: '1px solid rgba(254,239,145,.18)',
        }}
      >
        <span style={{ fontSize: '13px' }}>🖼️</span>
        <span style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 800 }}>
          {currentRoundData.title}
        </span>
        <span style={{ color: '#86efac', fontSize: '11px', fontWeight: 700 }}>
          {foundCount}/{totalForRound}
        </span>
      </motion.div>

      {/* ══════════ Two side-by-side images ══════════ */}
      <motion.div
        key={currentRoundData.id + '-images'}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%', maxWidth: '440px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
          marginTop: '4px',
        }}
      >
        {/* Image A */}
        <div
          style={{
            position: 'relative',
            border: '2px solid rgba(254,239,145,.3)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#000',
          }}
        >
          <img
            src={currentRoundData.imageA}
            alt="صورة A"
            draggable={false}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              userSelect: 'none',
            }}
          />
          <div style={{
            position: 'absolute', top: '4px', right: '4px',
            background: 'rgba(0,0,0,.6)',
            color: '#9fc4b4', fontSize: '10px', fontWeight: 800,
            padding: '2px 6px', borderRadius: '4px',
          }}>A</div>
        </div>

        {/* Image B (clickable) */}
        <div
          ref={imgBWrapperRef}
          style={{
            position: 'relative',
            border: '2px solid rgba(254,239,145,.5)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#000',
            cursor: 'crosshair',
          }}
        >
          <img
            ref={imgBRef}
            src={currentRoundData.imageB}
            alt="صورة B — اضغط على الفروقات"
            draggable={false}
            onClick={handleImageBClick}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
            }}
          />
          {/* Found differences markers (green circle) */}
          {differences.filter(d => d.found).map(d => (
            <motion.div
              key={d.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={{
                position: 'absolute',
                left: `${d.x * 100}%`,
                top: `${d.y * 100}%`,
                width: `${d.radius * 200}%`,  // diameter = 2 * radius, in % of image width
                aspectRatio: '1 / 1',  // square (height auto-matches width)
                transform: 'translate(-50%, -50%)',
                border: '3px solid #22c55e',
                borderRadius: '50%',
                background: 'rgba(34,197,94,.18)',
                boxShadow: '0 0 12px rgba(34,197,94,.6)',
                pointerEvents: 'none',
              }}
            />
          ))}
          {/* Miss markers (red X) */}
          {misses.map(m => (
            <motion.div
              key={m.id}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 1, opacity: 0.4 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                left: `${m.x * 100}%`,
                top: `${m.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                color: '#ef4444',
                fontSize: '20px',
                fontWeight: 900,
                textShadow: '0 0 8px rgba(239,68,68,.8), 0 1px 4px rgba(0,0,0,.8)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >✗</motion.div>
          ))}
          {/* Click feedback animations */}
          {feedbacks.map(fb => (
            <ClickFeedback
              key={fb.id}
              id={fb.id}
              kind={fb.kind}
              x={fb.x}
              y={fb.y}
              onDone={() => setFeedbacks(prev => prev.filter(f => f.id !== fb.id))}
            />
          ))}
          <div style={{
            position: 'absolute', top: '4px', right: '4px',
            background: 'rgba(0,0,0,.6)',
            color: '#feef91', fontSize: '10px', fontWeight: 800,
            padding: '2px 6px', borderRadius: '4px',
          }}>B — اضغط</div>
        </div>
      </motion.div>

      {/* ══════════ Hint: differences found this round + total ══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          width: '100%', maxWidth: '440px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 12px', borderRadius: '10px',
          background: 'rgba(6,42,32,.55)',
          border: '1px solid rgba(254,239,145,.15)',
          fontSize: '11px', fontWeight: 700, color: '#9fc4b4',
        }}
      >
        <span>🎯 إجمالي الفروق: {totalFound}/{totalDifferences}</span>
        <span>💡 صعوبة: {cfg.label}</span>
      </motion.div>

      {/* ══════════ Quit dialog ══════════ */}
      <AnimatePresence>
        {showQuitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuitDialog(false)}
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
                إنهاء اللعبة؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                {isDiwaniyaHost
                  ? 'سيتم إنهاء الجلسة وسيخرج جميع المشاهدين.'
                  : `نقاطك: ${score} — سيتم إعادة تعيين اللعبة.`}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowQuitDialog(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)',
                    background: 'rgba(80,80,80,.3)', color: '#cbd5e1',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  }}
                >إلغاء</button>
                <button
                  onClick={handleQuitGame}
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
