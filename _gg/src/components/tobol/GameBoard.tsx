'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTobolStore } from '@/lib/tobol-store';
import {
  RIGHT_COL1, RIGHT_COL2, LEFT_COL1, LEFT_COL2,
  BOTTOM_ROW1, BOTTOM_ROW2, BOTTOM_ROW3,
  IMG_BASE,
} from '@/lib/tobol-types';
import type { BoardButton, Team } from '@/lib/tobol-types';
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

// ============================================================
// Render a single button cell (preserves original logic)
// ============================================================
function renderBtnTable(
  btn: BoardButton,
  colSpan: number,
  clickedBtns: Set<string>,
  onClick: (id: string) => void
) {
  return (
    <td
      key={btn.id}
      colSpan={colSpan}
      className={btn.color}
      onClick={() => onClick(btn.id)}
      style={{ padding: '0.2vmin', textAlign: 'center', verticalAlign: 'middle' }}
    >
      <img
        src={`${IMG_BASE}${btn.icon}.png`}
        className="block hover:brightness-110 active:scale-95 transition-all mx-auto"
        style={{
          width: '100%',
          height: 'auto',
          opacity: clickedBtns.has(btn.id) ? 0 : 1,
        }}
        alt={btn.icon}
        draggable={false}
      />
    </td>
  );
}

// ============================================================
// Battle Log Modal — button + modal window
// ============================================================
function BattleLogButton() {
  const { battleLog } = useTobolStore();
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [battleLog, isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="tobol-log-btn"
        aria-label="سجل المعركة"
      >
        <span style={{ fontSize: '13px' }}>📜</span>
        <span>سجل المعركة</span>
        <span className="log-count">{battleLog.length}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="tobol-log-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-log-modal"
            >
              <div className="tobol-log-modal-header">
                <span className="tobol-log-modal-title">📜 سجل المعركة</span>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="إغلاق"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9fc4b4',
                    fontSize: '20px',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
              <div className="tobol-log-modal-body">
                {battleLog.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px 0' }}>
                    لا تتحركات بعد...
                  </p>
                ) : (
                  battleLog.map((entry) => (
                    <div
                      key={entry.id}
                      className={`tobol-log-entry team-${entry.team}`}
                    >
                      <span className="entry-num">{entry.id}.</span>
                      <span className="entry-msg">{entry.message}</span>
                      {entry.valueChange !== 0 ? (
                        <span className="entry-delta negative">
                          {entry.valueChange}
                        </span>
                      ) : (
                        <span className="entry-delta neutral">—</span>
                      )}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Notification Pill v3 — team info at START, allows wrapping
// ============================================================
function NotificationPill() {
  const { lastAction, currentTurn, redName, blueName } = useTobolStore();

  const isAttack = lastAction?.includes('هجوم');
  const isTrap = lastAction?.includes('الفخ');
  const turnName = currentTurn === 'red' ? redName : blueName;
  const isRedTurn = currentTurn === 'red';
  const teamChipLabel = isRedTurn ? '🔴 أحمر' : '🔵 أزرق';
  const teamChipClass = isRedTurn ? 'team-red' : 'team-blue';

  // Determine display text + style — team at the START
  let displayText = '';
  let containerClass = `tobol-board-notice-v3 team-${currentTurn}`;

  if (!lastAction) {
    // Waiting — show turn indicator (just say "دورك الآن")
    displayText = `دورك الآن — ${turnName}`;
  } else {
    displayText = lastAction;
    if (isAttack) containerClass = 'tobol-board-notice-v3 attack';
    else if (isTrap) containerClass = 'tobol-board-notice-v3 trap';
  }

  return (
    <div
      key={displayText + currentTurn}
      className={containerClass}
      style={{ animation: 'tobolNoticeSlide 0.32s cubic-bezier(.34,1.56,.64,1)' }}
    >
      {/* Team chip at START — so the player knows whose turn it is immediately */}
      <span className={`tobol-notice-team-chip ${teamChipClass}`}>
        {teamChipLabel}
      </span>
      <span className="notice-dot" />
      <span className="tobol-notice-text">{displayText}</span>
    </div>
  );
}

// ============================================================
// Team Panel — EXACTLY matches setup TeamCard design
// Same container, same border gradient, same header, divider under name
// + score number below
// ============================================================
function TeamPanel({ team }: { team: Team }) {
  const {
    redName, blueName, redScore, blueScore, currentTurn,
    setTeamNames, gameMode,
  } = useTobolStore();

  const isRed = team === 'red';
  const name = isRed ? redName : blueName;
  const score = isRed ? redScore : blueScore;
  const isActive = currentTurn === team;
  const accent = isRed ? '#ef4444' : '#3b82f6';
  const accentLight = isRed ? '#fca5a5' : '#93c5fd';
  const teamLabel = isRed ? 'الأحمر' : 'الأزرق';
  const teamEmoji = isRed ? '🔴' : '🔵';
  const isSpectator = gameMode === 'diwaniya' && typeof window !== 'undefined' && !window.location.pathname.startsWith('/tobol');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`tobol-team-card ${isActive ? 'selected' : ''}`}
      style={
        {
          flex: 1,
          padding: '10px 8px',
          '--card-border': isActive
            ? `linear-gradient(180deg, ${accentLight}, ${accent})`
            : 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.02))',
          '--card-border-selected': `linear-gradient(180deg, ${accentLight}, ${accent})`,
          background: isActive
            ? `linear-gradient(180deg, ${accent}26, ${accent}0d 80%)`
            : 'linear-gradient(180deg, rgba(8,28,22,.92), rgba(4,18,14,.96))',
        } as React.CSSProperties
      }
    >
      {/* Header row: emoji + label + active chip — same as setup */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
        position: 'relative',
      }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}55, ${accent}22)`,
            border: `1.5px solid ${accent}80`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isActive ? `0 0 8px ${accent}55` : 'none',
          }}
        >
          <span style={{ fontSize: '13px' }}>{teamEmoji}</span>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: accent,
            textShadow: `0 1px 2px rgba(0,0,0,.6)`,
          }}
        >
          {teamLabel}
        </span>
        {isActive && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#feef91',
              background: 'rgba(254,239,145,.15)',
              border: '1px solid rgba(254,239,145,.4)',
              padding: '2px 6px',
              borderRadius: '999px',
              marginRight: 'auto',
            }}
          >
            دوره الآن
          </motion.span>
        )}
      </div>

      {/* Team name — editable (or read-only in spectator) */}
      {isSpectator ? (
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,.7)',
          padding: '7px 8px',
          textAlign: 'center',
          background: 'rgba(0,0,0,.35)',
          border: `1px solid ${isActive ? `${accent}55` : 'rgba(255,255,255,.08)'}`,
          borderRadius: '10px',
        }}>
          {name}
        </div>
      ) : (
        <input
          type="text"
          value={name}
          onChange={(e) => isRed ? setTeamNames(e.target.value, blueName) : setTeamNames(redName, e.target.value)}
          placeholder={isRed ? 'اسم الجيش الأحمر' : 'اسم الجيش الأزرق'}
          maxLength={20}
          dir="rtl"
          style={{
            width: '100%',
            background: 'rgba(0,0,0,.35)',
            border: `1px solid ${isActive ? `${accent}55` : 'rgba(255,255,255,.08)'}`,
            borderRadius: '10px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            padding: '7px 8px',
            outline: 'none',
            textAlign: 'center',
            transition: 'border-color .15s',
          }}
        />
      )}

      {/* فاصل تحت اسم الفريق — same as setup */}
      <div style={{
        marginTop: '8px',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`,
        opacity: isActive ? 1 : 0.4,
      }} />

      {/* Score below the divider */}
      <div
        className="tobol-score-number"
        style={{
          color: isActive ? accentLight : '#fff',
          marginTop: '6px',
          textAlign: 'center',
        }}
      >
        {score}
      </div>
    </motion.div>
  );
}

// ============================================================
// Bottom Chat FAB — fixed at bottom-center
// Ephemeral chat: messages stored in component state only, not persisted
// ============================================================
interface ChatMsg {
  id: number;
  sender: string;
  text: string;
  me: boolean;
}

function BottomChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 200);
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
    const newMsg: ChatMsg = {
      id: Date.now(),
      sender: 'أنت',
      text,
      me: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    // Simulate a system echo / opponent reply (ephemeral, no DB)
    // In Diwaniya mode, this would be wired to a real-time backend.
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        sender: 'الخصم',
        text: 'استلمت رسالتك ✓',
        me: false,
      }]);
    }, 800);
  };

  return (
    <>
      <button
        className="tobol-chat-fab"
        onClick={() => setIsOpen(true)}
        aria-label="دردشة الطاولة"
      >
        <img src="/battle/icon_chat.webp" alt="chat" />
        <span>دردشة الطاولة</span>
        {unread > 0 && <span className="chat-count">{unread}</span>}
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
                <button
                  onClick={() => setIsOpen(false)}
                  className="tobol-chat-panel-close"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>
              <div className="tobol-chat-panel-body">
                {messages.length === 0 ? (
                  <p className="tobol-chat-empty">
                    لا رسائل بعد — أرسل أول رسالة للخصم.
                    <br />
                    (الدردشة مؤقتة، تُحذف عند إغلاق الطاولة)
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`tobol-chat-msg ${m.me ? 'me' : 'other'}`}>
                      <span className="msg-sender">{m.sender}</span>
                      <span className="msg-bubble">{m.text}</span>
                    </div>
                  ))
                )}
                <div ref={msgEndRef} />
              </div>
              <div className="tobol-chat-panel-input-row">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="اكتب رسالة..."
                  maxLength={200}
                  dir="rtl"
                />
                <button onClick={handleSend} disabled={!input.trim()}>
                  إرسال
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Main GameBoard — restyled to match setup page EXACTLY
// ============================================================
export default function GameBoard() {
  const router = useRouter();
  const {
    clickedBtns,
    mainBgId,
    modalData,
    handleButtonClick,
    closeModal,
    resetGame,
    gameMode,
  } = useTobolStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const isSpectator = gameMode === 'diwaniya' && typeof window !== 'undefined' && !window.location.pathname.startsWith('/tobol');

  // Hide header chrome + bottom nav + floating panel tab
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

  // NO auto-close — card stays visible and is replaced on next click (per user request)

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const handleQuitGame = () => {
    resetGame();
    router.push('/tobol');
  };

  // Show the "waiting" image ONLY when no card has been shown yet.
  // Once a card is shown, keep it visible (replaced on next click).
  const hasAnyCardBeenShown = clickedBtns.size > 0;

  return (
    <div
      dir="rtl"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 16px',
        gap: '10px',
        overflow: 'hidden',
      }}
    >
      {/* ══════════ Header (top-left) — sound + quit-game (no chat here, moved to bottom FAB) ══════════ */}
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
          onClick={() => setShowQuitDialog(true)}
          aria-label="إنهاء اللعبة بدون حفظ"
          title="إنهاء اللعبة بدون حفظ"
        >
          <img src="/battle/btn_quit_game.webp" alt="quit" />
        </button>
      </div>

      {/* ══════════ Title (matches setup exactly: 76x64 image + 22px title) ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/tobol.png"
            alt="طبول الحرب"
            style={{
              width: '76px',
              height: '64px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.55))',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: '-12px',
            background: 'radial-gradient(circle, rgba(254,239,145,.22), transparent 65%)',
            filter: 'blur(6px)',
            zIndex: -1,
            borderRadius: '50%',
          }} />
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
          طبول الحرب
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Tobol — War Drums ⚔️
        </p>
      </motion.div>

      {/* ══════════ "تجهيز المعركة" pill ══════════ */}
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
        <span style={{ fontSize: '13px' }}>⚔️</span>
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

      {/* ══════════ Team cards + VS — EXACTLY like setup (46x46 VS, same team-card design) ══════════ */}
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
        <TeamPanel team="red" />

        {/* VS badge in middle — same as setup (46x46, pulsing glow) */}
        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <TeamPanel team="blue" />
      </div>

      {/* ══════════ Notification pill v3 — team info at START, allows wrapping ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', justifyContent: 'center' }}>
        <NotificationPill />
      </div>

      {/* ══════════ Game board (table layout) ══════════ */}
      <div className="gameDiv" style={{ paddingBottom: '0', width: '95vw', maxWidth: '100vmin', margin: 0, padding: '4px 0 0' }}>
        <table className="gameTable">
          <tbody>
            {/* ===== Side Columns + Center Image ===== */}
            <tr>
              <td colSpan={1}></td>
              <td colSpan={12}>
                <table className="btnTable">
                  <tbody>
                    {RIGHT_COL1.map((btn) => (
                      <tr key={btn.id}>{renderBtnTable(btn, 1, clickedBtns, isSpectator ? () => {} : handleButtonClick)}</tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td colSpan={12}>
                <table className="btnTable">
                  <tbody>
                    {RIGHT_COL2.map((btn) => (
                      <tr key={btn.id}>{renderBtnTable(btn, 1, clickedBtns, isSpectator ? () => {} : handleButtonClick)}</tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td colSpan={3}></td>
              {/* CENTER: Waiting image (only before any card shown) OR latest weapon card (stays visible) */}
              <td colSpan={64} style={{ textAlign: 'center', verticalAlign: 'middle', position: 'relative' }}>
                {!modalData ? (
                  // Show waiting image ONLY when no card has been clicked yet
                  hasAnyCardBeenShown ? (
                    // After cards started showing, show a placeholder (no main image, just empty)
                    <div style={{
                      width: '90%',
                      margin: '0 auto',
                      aspectRatio: '1 / 1',
                      borderRadius: '4%',
                      background: 'radial-gradient(circle, rgba(254,239,145,.05), transparent 65%), rgba(0,0,0,.2)',
                      border: '1px dashed rgba(254,239,145,.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '11px', color: '#9fc4b4', opacity: 0.5 }}>في انتظار بطاقتك...</span>
                    </div>
                  ) : (
                    <img
                      className="w-[90%] mx-auto rounded-[7%] inline-block"
                      src={`/img/war/waiting/${((mainBgId % 3) + 1)}.png`}
                      alt="Waiting"
                      draggable={false}
                    />
                  )
                ) : (
                  // Show the latest card — stays visible, replaced on next click
                  <div style={{ position: 'relative', display: 'inline-block', width: '90%' }}>
                    <img
                      src={modalData.cardImg}
                      alt="Card"
                      draggable={false}
                      onClick={isSpectator ? undefined : closeModal}
                      style={{ width: '100%', display: 'block', cursor: 'pointer', borderRadius: '4%' }}
                    />
                    {/* Points badge */}
                    <div className={`tobol-card-points ${modalData.points > 0 ? 'attack' : ''}`}>
                      {modalData.points > 0 ? `💥 ${modalData.points}` : '◍ فارغة'}
                    </div>
                    {/* Tap-to-continue overlay (still allows manual dismiss) */}
                    <div className="tobol-card-overlay">
                      <button
                        className="tobol-card-continue-pill"
                        onClick={isSpectator ? undefined : closeModal}
                      >
                        <span>اضغط للمتابعة ←</span>
                      </button>
                    </div>
                  </div>
                )}
              </td>
              <td colSpan={3}></td>
              <td colSpan={12}>
                <table className="btnTable">
                  <tbody>
                    {LEFT_COL1.map((btn) => (
                      <tr key={btn.id}>{renderBtnTable(btn, 1, clickedBtns, isSpectator ? () => {} : handleButtonClick)}</tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td colSpan={12}>
                <table className="btnTable">
                  <tbody>
                    {LEFT_COL2.map((btn) => (
                      <tr key={btn.id}>{renderBtnTable(btn, 1, clickedBtns, isSpectator ? () => {} : handleButtonClick)}</tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td colSpan={1}></td>
            </tr>

            {/* ===== Bottom rows ===== */}
            <tr>
              <td colSpan={120}>
                <table className="btnTable2">
                  <tbody>
                    <tr>
                      {BOTTOM_ROW1.map((btn) => renderBtnTable(btn, 6, clickedBtns, isSpectator ? () => {} : handleButtonClick))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td colSpan={120}>
                <table className="btnTable2">
                  <tbody>
                    <tr>
                      {BOTTOM_ROW2.map((btn) => renderBtnTable(btn, 6, clickedBtns, isSpectator ? () => {} : handleButtonClick))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td colSpan={120}>
                <table className="btnTable2">
                  <tbody>
                    <tr>
                      {BOTTOM_ROW3.map((btn) => renderBtnTable(btn, 6, clickedBtns, isSpectator ? () => {} : handleButtonClick))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ══════════ Battle log button (opens modal) ══════════ */}
      <div style={{ marginTop: '4px' }}>
        <BattleLogButton />
      </div>

      {/* ══════════ Bottom chat FAB (replaces bottom nav) ══════════ */}
      <BottomChatFAB />

      {/* ══════════ Quit game dialog ══════════ */}
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
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
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
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>⏻</div>
              <h3
                style={{
                  ...STROKE_STYLE,
                  fontSize: '17px',
                  fontWeight: 900,
                  marginBottom: '6px',
                }}
              >
                إنهاء اللعبة بدون حفظ؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء اللعبة الحالية دون حفظ التقدم، وستبدأ معركة جديدة من الصفر.
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
                >
                  إلغاء
                </button>
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
                >
                  نعم، أنهِ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
