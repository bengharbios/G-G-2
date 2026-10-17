'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSpotDiffStore } from '@/lib/spotdiff-store';
import { DIFFICULTY_CONFIG, FLASHI_HIT_RADIUS_VMIN } from '@/lib/spotdiff-types';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
  playClickSound,
  playCorrectSound,
  playWrongSound,
} from '@/lib/sounds';

// G-G Tobol style: gold stroke text
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

interface MissMarker {
  id: number;
  topVmin: number;
  leftVmin: number;
}

interface ClickFeedbackItem {
  id: number;
  kind: 'hit' | 'miss';
  topVmin: number;
  leftVmin: number;
}

interface ChatMsg {
  id: number;
  sender: string;
  text: string;
}

const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👏', '🙏', '🔥', '🎯', '🔍', '💡', '⭐', '✓', '✗', '🏆', '🎉', '💯', '❤️', '🖼️', '👀', '⏱️'];

function vminPx(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.innerWidth, window.innerHeight) / 100;
}

// ============================================================
// Click feedback floating text
// ============================================================
function ClickFeedback({ item, onDone }: { item: ClickFeedbackItem; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 1, scale: 0.6, y: 0 }}
      animate={{ opacity: 0, scale: 1.4, y: -30 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: `${item.topVmin}vmin`,
        left: `${item.leftVmin}vmin`,
        transform: 'translate(-50%, -50%)',
        color: item.kind === 'hit' ? '#86efac' : '#f87171',
        fontSize: '5vmin',
        fontWeight: 900,
        textShadow: '0 1px 4px rgba(0,0,0,.85), 0 0 12px rgba(0,0,0,.6)',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {item.kind === 'hit' ? '✓ +100' : '✗'}
    </motion.div>
  );
}

// ============================================================
// Header chat button — G-G tobol chat panel
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

  const handleEmojiClick = (emoji: string) => {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
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
        <img src="/battle/icon_chat.webp" alt="chat" style={{ width: '26px', height: '26px' }} />
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
}

// ════════════════════════════════════════════════════════════════════════
// MAIN GAME BOARD — Tobol style + flashi logic
// Compact single-screen layout:
//   [header actions]
//   [game image (transparent PNG) + title]    <- مهمة 2: صورة اللعبة فوق الاسم
//   [timer + diff counter in one row]         <- مهمة 3: المؤقت فقط بستايل ممتاز
//   [4 action buttons in single row]         <- مهمة 3: 4 أزرار في صف واحد
//   [flashi image (A above B) with circles]
//   [score compact bottom row]
// ════════════════════════════════════════════════════════════════════════
export default function GameBoard() {
  const router = useRouter();
  const {
    phase, currentRound, currentRoundData,
    foundDifferences, differences, score, timeLeft, totalRounds,
    totalFound, totalDifferences, findDifference, registerMiss,
    tickTimer, resetGame, difficulty,
    flashiCatalog,
    loadFlashiCatalog,
    loadNewImage,
  } = useSpotDiffStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [feedbacks, setFeedbacks] = useState<ClickFeedbackItem[]>([]);
  const [misses, setMisses] = useState<MissMarker[]>([]);
  const nextFeedbackId = useRef(0);
  const nextMissId = useRef(0);
  const circleDivRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadFlashiCatalog();
  }, [loadFlashiCatalog]);

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

  // Click handler — convert pixel coords → vmin, compare to flashi diffs
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!currentRoundData || !currentRoundData.flashiDiffs) return;
    const img = imgRef.current;
    if (!img) return;
    const cdiv = circleDivRef.current;
    if (!cdiv) return;
    const rect = cdiv.getBoundingClientRect();
    const vmin = vminPx();
    const clickTopVmin = (e.clientY - rect.top) / vmin;
    const clickLeftVmin = (e.clientX - rect.left) / vmin;
    const imageShift = currentRoundData.imageShift ?? 53.5;

    let hitIdx = -1;
    for (let i = 0; i < currentRoundData.flashiDiffs.length; i++) {
      const d = currentRoundData.flashiDiffs[i];
      const bTop = d.topVmin + imageShift;
      const bLeft = d.leftVmin;
      const distSq = (clickTopVmin - bTop) ** 2 + (clickLeftVmin - bLeft) ** 2;
      if (Math.sqrt(distSq) <= FLASHI_HIT_RADIUS_VMIN) {
        const diffId = `flashi-diff-${currentRound}-${i}`;
        if (!foundDifferences.includes(diffId)) {
          hitIdx = i;
          break;
        }
      }
    }

    const fbId = nextFeedbackId.current++;
    if (hitIdx >= 0) {
      const diffId = `flashi-diff-${currentRound}-${hitIdx}`;
      const d = currentRoundData.flashiDiffs[hitIdx];
      const ok = findDifference(diffId);
      if (ok) {
        if (soundOn) playCorrectSound();
        setFeedbacks(prev => [...prev, {
          id: fbId,
          kind: 'hit',
          topVmin: d.topVmin + imageShift,
          leftVmin: d.leftVmin,
        }]);
      }
    } else {
      if (soundOn) playWrongSound();
      registerMiss();
      const missId = nextMissId.current++;
      setMisses(prev => [...prev, { id: missId, topVmin: clickTopVmin, leftVmin: clickLeftVmin }]);
      setFeedbacks(prev => [...prev, {
        id: fbId,
        kind: 'miss',
        topVmin: clickTopVmin,
        leftVmin: clickLeftVmin,
      }]);
      setTimeout(() => {
        setMisses(prev => prev.filter(m => m.id !== missId));
      }, 1500);
    }
  };

  if (!currentRoundData) {
    return (
      <div
        dir="rtl"
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 56px)',
          background: 'url(/battle/game_bg.webp) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9fc4b4',
          fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔍</div>
          <p>جاري تحميل الجولة...</p>
          {!flashiCatalog && <p style={{ fontSize: '11px', marginTop: '8px' }}>تحميل مكتبة 7005 صورة...</p>}
        </div>
      </div>
    );
  }

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const foundCount = foundDifferences.length;
  const totalForRound = currentRoundData.differences.length;
  const remainingDiffs = Math.max(0, totalForRound - foundCount);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerDisplay = `${mins}:${String(secs).padStart(2, '0')}`;
  const imageShift = currentRoundData.imageShift ?? 53.5;
  const timeColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 30 ? '#fbbf24' : '#feef91';

  const diffMarkers = useMemo(() => {
    if (!currentRoundData.flashiDiffs) return [];
    return currentRoundData.flashiDiffs.map((d, i) => {
      const diffId = `flashi-diff-${currentRound}-${i}`;
      return {
        id: diffId,
        idx: i,
        found: foundDifferences.includes(diffId),
        topVmin: d.topVmin + imageShift,
        leftVmin: d.leftVmin,
      };
    });
  }, [currentRoundData, foundDifferences, currentRound, imageShift]);

  // Compact Tobol-styled action button (smaller for single-row layout)
  const CompactBtn = ({
    label, accentColor, icon, onClick,
  }: {
    label: string;
    accentColor: string;
    icon: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'linear-gradient(180deg, rgba(254,239,145,.18) 0%, rgba(170,110,31,.08) 50%, rgba(8,28,22,.85) 100%)',
        color: '#feef91',
        border: `1px solid ${accentColor}aa`,
        borderTop: `2px solid ${accentColor}`,
        borderRadius: '8px',
        padding: '8px 6px',
        textAlign: 'center',
        cursor: 'pointer',
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
        fontWeight: 'bold',
        fontSize: '11px',
        lineHeight: '1.3',
        boxShadow: `0 2px 8px rgba(0,0,0,.4), inset 0 1px 0 ${accentColor}33`,
        transition: 'all .15s ease',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '2px',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = 'brightness(1.15)';
        e.currentTarget.style.boxShadow = `0 4px 14px rgba(0,0,0,.5), inset 0 1px 0 ${accentColor}55, 0 0 12px ${accentColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'brightness(1)';
        e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,.4), inset 0 1px 0 ${accentColor}33`;
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div
      dir="rtl"
      className="tobol-bg"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 12px 16px',
        gap: '6px',
        overflowY: 'auto',
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
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
            style={{ width: '26px', height: '26px' }}
          />
        </button>
        <HeaderChatButton />
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowQuitDialog(true)}
          aria-label="إنهاء اللعبة"
          title="إنهاء اللعبة"
        >
          <img src="/battle/btn_quit_game.webp" alt="quit" style={{ width: '26px', height: '26px' }} />
        </button>
      </div>

      {/* ══════════ Game image + title (compact header) ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '44px',
          padding: '4px 12px',
          borderRadius: '14px',
          background: 'rgba(6,42,32,.45)',
          border: '1px solid rgba(254,239,145,.12)',
        }}
      >
        <img
          src="/yalla-games/spotdiff.png"
          alt="اختلاف الصور"
          draggable={false}
          style={{
            width: '48px',
            height: '40px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))',
          }}
        />
        <div>
          <h1 style={{
            ...STROKE_STYLE,
            fontSize: '16px',
            fontWeight: 900,
            textShadow: '0 2px 4px rgba(0,0,0,.85)',
            margin: 0,
            lineHeight: 1.1,
          }}>
            اختلاف الصور
          </h1>
          <div style={{
            color: '#9fc4b4',
            fontSize: '10px',
            fontWeight: 700,
            marginTop: '1px',
          }}>
            جولة {currentRound + 1}/{totalRounds}
            {flashiCatalog && <span style={{ color: '#fbbf24' }}> • {flashiCatalog.length.toLocaleString('en')} صورة</span>}
          </div>
        </div>
      </motion.div>

      {/* ══════════ Timer + Diff counter (single elegant row) ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="tobol-team-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '8px 12px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Diff counter */}
        <div style={{
          ...STROKE_STYLE,
          fontSize: '14px',
          fontWeight: 800,
          color: '#feef91',
          textAlign: 'center',
          padding: '6px 10px',
          border: '1px solid rgba(254,239,145,.3)',
          borderRadius: '8px',
          background: 'rgba(0,0,0,.4)',
          minWidth: '70px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '16px' }}>🎯</span>
          <span style={{ color: '#86efac', fontSize: '16px', fontWeight: 900 }}>
            {remainingDiffs}
          </span>
          <span style={{ fontSize: '11px', color: '#9fc4b4' }}>/ {totalForRound}</span>
        </div>

        {/* Score */}
        <div style={{
          ...STROKE_STYLE,
          fontSize: '14px',
          fontWeight: 800,
          textAlign: 'center',
          padding: '6px 10px',
          border: '1px solid rgba(254,239,145,.3)',
          borderRadius: '8px',
          background: 'rgba(0,0,0,.4)',
          minWidth: '70px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '16px' }}>🏆</span>
          <span style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 900 }}>
            {score}
          </span>
        </div>

        {/* Timer (large, prominent) */}
        <div style={{
          flex: 1,
          padding: '6px 12px',
          border: `1px solid ${timeColor}55`,
          borderRadius: '8px',
          background: 'rgba(0,0,0,.55)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center',
          boxShadow: `0 0 16px ${timeColor}22, inset 0 0 8px ${timeColor}11`,
        }}>
          <span style={{ fontSize: '20px' }}>⏱️</span>
          <span style={{
            fontSize: '28px',
            fontWeight: 900,
            color: timeColor,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 8px ${timeColor}44, 0 2px 4px rgba(0,0,0,.85)`,
            fontFamily: 'ltBukraBold, Noto Sans Arabic, monospace',
          }}>
            {timerDisplay}
          </span>
        </div>
      </motion.div>

      {/* ══════════ 4 action buttons in single row ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          gap: '6px',
        }}
      >
        <CompactBtn
          label="صورة جديدة"
          accentColor="#22c55e"
          icon="🖼️"
          onClick={() => {
            if (soundOn) playClickSound();
            loadNewImage();
          }}
        />
        <CompactBtn
          label="بدء اللعبة"
          accentColor="#fbbf24"
          icon="▶️"
          onClick={() => {
            if (soundOn) playClickSound();
            router.push('/spotdiff');
          }}
        />
        <CompactBtn
          label={showAnswers ? 'إخفاء الأجوبة' : 'إظهار الأجوبة'}
          accentColor="#a855f7"
          icon="💡"
          onClick={() => {
            if (soundOn) playClickSound();
            setShowAnswers(s => !s);
          }}
        />
        <CompactBtn
          label={showScore ? 'إخفاء السكور' : 'إظهار السكور'}
          accentColor="#3b82f6"
          icon="📊"
          onClick={() => {
            if (soundOn) playClickSound();
            setShowScore(s => !s);
          }}
        />
      </motion.div>

      {/* ══════════ Game Image Area (flashi image with circles) ══════════ */}
      <motion.div
        key={currentRoundData.id + String(currentRound)}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="tobol-team-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '6px',
          borderRadius: '12px',
          position: 'relative',
        }}
      >
        <div
          ref={circleDivRef}
          style={{
            position: 'relative',
            width: '100%',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <img
            ref={imgRef}
            src={currentRoundData.imageUrl || currentRoundData.imageA}
            alt="اختلاف الصور — اضغط على الفروقات"
            draggable={false}
            onClick={handleImageClick}
            style={{
              width: '90%',
              maxWidth: '90%',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              cursor: 'crosshair',
              borderRadius: '8px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitUserDrag: 'none',
            }}
          />

          {/* B-side circle markers */}
          {diffMarkers.map((m) => (
            (m.found || showAnswers) && (
              <motion.div
                key={m.id + (m.found ? '-found' : '-answer')}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                style={{
                  position: 'absolute',
                  top: `${m.topVmin}vmin`,
                  left: `${m.leftVmin}vmin`,
                  width: '9.5vmin',
                  height: '9.5vmin',
                  transform: 'translate(-50%, -50%)',
                  border: m.found ? '3px solid #22c55e' : '3px solid #fbbf24',
                  borderRadius: '50%',
                  background: m.found
                    ? 'rgba(34,197,94,.18)'
                    : 'rgba(251,191,36,.15)',
                  boxShadow: m.found
                    ? '0 0 12px rgba(34,197,94,.6)'
                    : '0 0 12px rgba(251,191,36,.5)',
                  pointerEvents: 'none',
                  zIndex: 9,
                }}
              />
            )
          ))}

          {/* A-side faint dashed markers (when answers shown) */}
          {showAnswers && currentRoundData.flashiDiffs?.map((d, i) => (
            <motion.div
              key={`a-marker-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={{
                position: 'absolute',
                top: `${d.topVmin}vmin`,
                left: `${d.leftVmin}vmin`,
                width: '9.5vmin',
                height: '9.5vmin',
                transform: 'translate(-50%, -50%)',
                border: '2px dashed rgba(254,239,145,.5)',
                borderRadius: '50%',
                background: 'transparent',
                pointerEvents: 'none',
                zIndex: 8,
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
                top: `${m.topVmin}vmin`,
                left: `${m.leftVmin}vmin`,
                transform: 'translate(-50%, -50%)',
                color: '#ef4444',
                fontSize: '5vmin',
                fontWeight: 900,
                textShadow: '0 0 8px rgba(239,68,68,.8), 0 1px 4px rgba(0,0,0,.8)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >✗</motion.div>
          ))}

          {/* Click feedback floating text */}
          {feedbacks.map(fb => (
            <ClickFeedback
              key={fb.id}
              item={fb}
              onDone={() => setFeedbacks(prev => prev.filter(f => f.id !== fb.id))}
            />
          ))}

          {/* B-side label badge */}
          <div style={{
            position: 'absolute',
            top: `${imageShift + 1}vmin`,
            right: '5%',
            background: 'rgba(0,0,0,.7)',
            color: '#fbbf24',
            fontSize: '2vmin',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
            zIndex: 12,
            border: '1px solid rgba(254,239,145,.3)',
          }}>B — اضغط هنا</div>
        </div>
      </motion.div>

      {/* ══════════ Score table (toggleable) ══════════ */}
      <AnimatePresence>
        {showScore && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="tobol-team-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '12px',
              borderRadius: '12px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid rgba(254,239,145,.2)' }}>
                    <span style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 700 }}>النقاط</span>
                  </td>
                  <td style={{ padding: '6px', borderBottom: '1px solid rgba(254,239,145,.2)', textAlign: 'left' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 900 }}>{score}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid rgba(254,239,145,.2)' }}>
                    <span style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 700 }}>الفروق المكتشفة</span>
                  </td>
                  <td style={{ padding: '6px', borderBottom: '1px solid rgba(254,239,145,.2)', textAlign: 'left' }}>
                    <span style={{ color: '#86efac', fontWeight: 900 }}>{foundCount}/{totalForRound}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid rgba(254,239,145,.2)' }}>
                    <span style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 700 }}>إجمالي الفروق</span>
                  </td>
                  <td style={{ padding: '6px', borderBottom: '1px solid rgba(254,239,145,.2)', textAlign: 'left' }}>
                    <span style={{ color: '#9fc4b4', fontWeight: 900 }}>{totalFound}/{totalDifferences}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid rgba(254,239,145,.2)' }}>
                    <span style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 700 }}>الصعوبة</span>
                  </td>
                  <td style={{ padding: '6px', borderBottom: '1px solid rgba(254,239,145,.2)', textAlign: 'left' }}>
                    <span style={{ color: '#9fc4b4', fontWeight: 900 }}>{cfg.label}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px' }}>
                    <span style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 700 }}>الجولة</span>
                  </td>
                  <td style={{ padding: '6px', textAlign: 'left' }}>
                    <span style={{ color: '#9fc4b4', fontWeight: 900 }}>{currentRound + 1}/{totalRounds}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ Quit dialog ══════════ */}
      <AnimatePresence>
        {showQuitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuitDialog(false)}
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
              className="tobol-team-card"
              style={{
                padding: '20px',
                width: '100%',
                maxWidth: '300px',
                textAlign: 'center',
                borderRadius: '18px',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{
                ...STROKE_STYLE,
                fontSize: '17px',
                fontWeight: 900,
                marginBottom: '6px',
              }}>
                إنهاء اللعبة؟
              </h3>
              <p style={{
                color: '#9fc4b4',
                fontSize: '12px',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}>
                نقاطك: {score} — سيتم إعادة تعيين اللعبة.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowQuitDialog(false)}
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
                >إلغاء</button>
                <button
                  onClick={handleQuitGame}
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
                >نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
