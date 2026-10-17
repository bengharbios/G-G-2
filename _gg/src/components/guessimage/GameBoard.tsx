'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGuessImageStore } from '@/lib/guessimage-store';
import { DIFFICULTY_CONFIG } from '@/lib/guessimage-types';
import {
  buildGuessCardBackUrl,
  buildGuessThemeUrl,
} from '@/lib/flashi_guess_images';
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

interface ChatMsg {
  id: number;
  sender: string;
  text: string;
}

const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👏', '🙏', '🔥', '🎯', '🧩', '💡', '⭐', '✓', '✗', '🏆', '🎉', '💯', '❤️', '👀', '⏱️'];

// ============================================================
// Header chat button (same as spotdiff — uses G-G tobol chat panel)
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
// MAIN GAME BOARD — Memory match-2 logic
// Player flips 2 cards per turn; if image IDs match → stays revealed (+score)
// else → flips back (-penalty). Round ends when all pairs matched OR time runs out.
// ════════════════════════════════════════════════════════════════════════
export default function GameBoard() {
  const router = useRouter();
  const {
    phase, currentRound, currentRoundData,
    cards, flippedCardIds, matchedPairs,
    score, timeLeft, totalRounds,
    totalFound, totalDifferences, totalMisses,
    flipCard, checkMatch, nextRound, resetGame, difficulty,
    themeId, gridRows, pairsCount,
    timerValueSec, newImage,
  } = useGuessImageStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);

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

  // Timer tick
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      // tickTimer via store directly (we have it via useGuessImageStore.getState)
      useGuessImageStore.getState().tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const handleQuitGame = () => {
    resetGame();
    router.push('/guessimage');
  };

  const handleCardClick = (cardId: number) => {
    if (soundOn) playClickSound();
    flipCard(cardId);
    // If 2 cards flipped, checkMatch fires after 800ms (via store setTimeout)
    // But also play sound after match check
    setTimeout(() => {
      const state = useGuessImageStore.getState();
      const lastLog = state.gameLog[state.gameLog.length - 1];
      if (lastLog?.message.includes('تطابق')) {
        if (soundOn) playCorrectSound();
      } else if (lastLog?.message.includes('خطأ')) {
        if (soundOn) playWrongSound();
      }
    }, 850);
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
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🧩</div>
          <p>جاري تحميل الجولة...</p>
        </div>
      </div>
    );
  }

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const foundCount = matchedPairs.length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerDisplay = `${mins}:${String(secs).padStart(2, '0')}`;
  const timeColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 30 ? '#fbbf24' : '#feef91';

  // Compact action button (Tobol style)
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
        background: `url(${buildGuessThemeUrl(themeId)}) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)`,
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
          src="/yalla-games/guessimage.png"
          alt="خمن الصورة"
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
            خمن الصورة
          </h1>
          <div style={{
            color: '#9fc4b4',
            fontSize: '10px',
            fontWeight: 700,
            marginTop: '1px',
          }}>
            جولة {currentRound + 1}/{totalRounds} • {pairsCount} أزواج
          </div>
        </div>
      </motion.div>

      {/* ══════════ Stats row: matched pairs + score + timer ══════════ */}
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
        {/* Matched pairs counter */}
        <div style={{
          ...STROKE_STYLE,
          fontSize: '14px',
          fontWeight: 800,
          textAlign: 'center',
          padding: '6px 10px',
          border: '1px solid rgba(254,239,145,.3)',
          borderRadius: '8px',
          background: 'rgba(0,0,0,.4)',
          minWidth: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '16px' }}>🎯</span>
          <span style={{ color: '#86efac', fontSize: '16px', fontWeight: 900 }}>
            {foundCount}
          </span>
          <span style={{ fontSize: '11px', color: '#9fc4b4' }}>/ {pairsCount}</span>
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

        {/* Timer */}
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

      {/* ══════════ Action buttons row (single row) ══════════ */}
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
          label="صور جديدة"
          accentColor="#22c55e"
          icon="🔄"
          onClick={() => {
            if (soundOn) playClickSound();
            newImage();
          }}
        />
        <CompactBtn
          label="بدء اللعبة"
          accentColor="#fbbf24"
          icon="▶️"
          onClick={() => {
            if (soundOn) playClickSound();
            router.push('/guessimage');
          }}
        />
        <CompactBtn
          label="إظهار السكور"
          accentColor="#3b82f6"
          icon="📊"
          onClick={() => {
            if (soundOn) playClickSound();
            // Scroll to bottom (score table is implicit in stats row already)
          }}
        />
      </motion.div>

      {/* ══════════ Memory grid (cards) ══════════ */}
      <motion.div
        key={currentRoundData.id}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="tobol-team-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '10px',
          borderRadius: '12px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridRows}, 1fr)`,
            gap: '4px',
            width: '100%',
          }}
        >
          {cards.map(card => {
            const showFace = card.flipped || card.matched;
            const cardBack = buildGuessCardBackUrl(themeId);
            return (
              <motion.div
                key={card.id}
                onClick={() => !card.matched && !card.flipped && handleCardClick(card.id)}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: showFace ? 180 : 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  aspectRatio: '1 / 1',
                  position: 'relative',
                  cursor: (card.matched || card.flipped) ? 'default' : 'pointer',
                  transformStyle: 'preserve-3d',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: card.matched
                    ? '2px solid #22c55e'
                    : card.flipped
                      ? '2px solid #fbbf24'
                      : '1px solid rgba(254,239,145,.2)',
                  background: card.matched ? 'rgba(34,197,94,.15)' : 'rgba(0,0,0,.4)',
                }}
              >
                {/* Card back (face-down) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    backgroundImage: `url(${cardBack})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: 'rotateY(0deg)',
                    opacity: showFace ? 0 : 1,
                  }}
                />
                {/* Card face (image) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: showFace ? 1 : 0,
                  }}
                >
                  <img
                    src={card.imageUrl}
                    alt={`بطاقة ${card.id}`}
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitUserDrag: 'none',
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ══════════ Stats footer ══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'rgba(0,0,0,.4)',
          border: '1px solid rgba(254,239,145,.15)',
          fontSize: '11px',
          fontWeight: 700,
          color: '#9fc4b4',
        }}
      >
        <span>🎯 إجمالي التطابقات: {totalFound}/{totalDifferences}</span>
        <span>✗ أخطاء: {totalMisses}</span>
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
