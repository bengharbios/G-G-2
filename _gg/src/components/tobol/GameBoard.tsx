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

// Common emojis for the chat emoji picker
const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👎', '👏', '🙏', '💪', '🔥', '⚔️', '🛡️', '🎯', '💀', '🏆', '🥇', '🥁', '🎉', '💯', '❤️', '💔', '✨', '⚡', '🌟', '👑', '🤝', '🫡', '😤', '🤯'];

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

  let displayText = '';
  let containerClass = `tobol-board-notice-v3 team-${currentTurn}`;

  if (!lastAction) {
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
      <span className={`tobol-notice-team-chip ${teamChipClass}`}>
        {teamChipLabel}
      </span>
      <span className="notice-dot" />
      <span className="tobol-notice-text">{displayText}</span>
    </div>
  );
}

// ============================================================
// Compact Team Panel — name display only + score (no input, no label)
// ============================================================
function TeamPanel({ team }: { team: Team }) {
  const { redName, blueName, redScore, blueScore, currentTurn } = useTobolStore();

  const isRed = team === 'red';
  const name = isRed ? redName : blueName;
  const score = isRed ? redScore : blueScore;
  const isActive = currentTurn === team;

  return (
    <div
      className={`tobol-team-panel-compact team-${team} ${isActive ? 'active-turn' : ''}`}
    >
      {/* Team name — read-only, just display what was chosen in setup */}
      <div className="tobol-team-name-display">{name}</div>
      {/* Divider under name */}
      <div className="tobol-team-divider-compact" />
      {/* Score below */}
      <div className="tobol-team-score-compact">{score}</div>
    </div>
  );
}

// ============================================================
// Header Chat Button + Panel — functional, no bot, with emoji picker
// Red badge shows unread messages count
// ============================================================
interface ChatMsg {
  id: number;
  team: Team; // team that sent the message (current turn at the time)
  text: string;
}

function HeaderChatButton() {
  const { currentTurn, redName, blueName } = useTobolStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track the team of the user currently typing — defaults to current turn's team
  const senderTeam = currentTurn;
  const senderName = senderTeam === 'red' ? redName : blueName;

  // Reset unread when panel opens
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setShowEmojis(false);
    }
  }, [isOpen]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // If panel is closed and a new message arrives from the OTHER team, increment unread
  // (In classic mode both players share the device — "unread" simulates that the other
  //  team's message arrived while the current team wasn't looking.)
  const lastMsgTeam = messages.length > 0 ? messages[messages.length - 1].team : null;
  useEffect(() => {
    if (!isOpen && lastMsgTeam && lastMsgTeam !== senderTeam) {
      setUnread((u) => u + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMsgTeam, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg: ChatMsg = {
      id: Date.now(),
      team: senderTeam,
      text,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setShowEmojis(false);
    // NO bot reply — chat is for real conversation between teams/spectators
    // (In Diwaniya mode, this would push to the room's chat backend.)
  };

  const handleEmojiClick = (emoji: string) => {
    setInput((prev) => prev + emoji);
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
                    لا رسائل بعد — أرسل أول رسالة.
                    <br />
                    (الدردشة مؤقتة، تُحذف عند إغلاق الطاولة)
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.team === senderTeam;
                    const mSender = m.team === 'red' ? redName : blueName;
                    return (
                      <div
                        key={m.id}
                        className={`tobol-chat-msg ${isMine ? 'me' : 'other'}`}
                      >
                        <span className="msg-sender">
                          {m.team === 'red' ? '🔴' : '🔵'} {mSender}
                        </span>
                        <span className="msg-bubble">{m.text}</span>
                      </div>
                    );
                  })
                )}
                <div ref={msgEndRef} />
              </div>

              {/* Emoji picker (toggleable) */}
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
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleEmojiClick(e)}
                          aria-label={`emoji ${e}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="tobol-chat-panel-input-row">
                {/* Emoji picker toggle button */}
                <button
                  type="button"
                  className="tobol-emoji-btn"
                  onClick={() => setShowEmojis((p) => !p)}
                  aria-label="إيموجي"
                  title="إيموجي"
                  style={{
                    borderColor: showEmojis ? 'rgba(254,239,145,.7)' : 'rgba(254,239,145,.25)',
                    boxShadow: showEmojis ? '0 0 10px rgba(254,239,145,.3)' : 'none',
                  }}
                >
                  <img src="/battle/icon_chat_emoji.webp" alt="emoji" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder={`أرسل كـ ${senderName}...`}
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
// Main GameBoard — compact + chat in header + clean cards
// ============================================================
export default function GameBoard() {
  const router = useRouter();
  const {
    clickedBtns,
    mainBgId,
    modalData,
    pendingGameOver,
    handleButtonClick,
    closeModal,
    resetGame,
    gameMode,
    roomCode,
  } = useTobolStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  // Diwaniya-mode viewer count + viewer modal + share link (read-only state)
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<Array<{ id: string; name: string; joinedAt: number }>>([]);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [directLink, setDirectLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const isSpectator = gameMode === 'diwaniya' && typeof window !== 'undefined' && !window.location.pathname.startsWith('/tobol');
  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;

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

  // ── Bug fix: when pendingGameOver is set (after last button click OR a team reached 0),
  // auto-close the modal after 2.2s so the game-over screen ALWAYS appears,
  // even if the user does not tap the last card to dismiss it manually.
  useEffect(() => {
    if (!pendingGameOver) return;
    const t = setTimeout(() => {
      closeModal();
    }, 2200);
    return () => clearTimeout(t);
  }, [pendingGameOver, closeModal]);

  // ── Diwaniya mode: fetch viewer count + viewer list periodically
  //    Also build the share link + direct link for the host.
  useEffect(() => {
    if (!isDiwaniyaHost || !roomCode) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const pkg = 'com.bengharbios.ggames';
    // Fetch the host's user ID for the 'from' tracking param
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        const hostUserId = d?.user?.id || '';
        // Share link: opens the /r/tobol/[code] deep-link route (like YoYo)
        // which is auto-intercepted by Android App Links (if APK has intent-filter)
        // OR shows a fallback page that tries intent:// and offers "Open in browser".
        const fromParam = hostUserId ? `&from=${encodeURIComponent(hostUserId)}` : '';
        setShareLink(`${baseUrl}/r/tobol/${roomCode}?pkg=${pkg}${fromParam}`);
        // Direct link: with ?direct=1, friends enter without typing the code
        setDirectLink(`${baseUrl}/r/tobol/${roomCode}?pkg=${pkg}${fromParam}&direct=1`);
      })
      .catch(() => {
        // Fallback: build links without 'from' param
        setShareLink(`${baseUrl}/r/tobol/${roomCode}?pkg=${pkg}`);
        setDirectLink(`${baseUrl}/r/tobol/${roomCode}?pkg=${pkg}&direct=1`);
      });
    // Fetch viewer count
    const fetchViewers = () => {
      fetch(`/api/tobol-room/${roomCode}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.room?.spectators) {
            setViewers(d.room.spectators);
            setViewerCount(d.room.spectators.length);
          }
        })
        .catch(() => {});
    };
    fetchViewers();
    const iv = setInterval(fetchViewers, 5000);
    return () => clearInterval(iv);
  }, [isDiwaniyaHost, roomCode]);

  // Copy share link to clipboard
  const copyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = shareLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  // Use native Web Share API for external app sharing (WhatsApp, Telegram, etc.)
  const shareExternally = async () => {
    if (!directLink) return;
    const shareData = {
      title: 'شاهد معركة طبول الحرب',
      text: 'انضم لمشاهدة المعركة على G-G:',
      url: directLink,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy direct link
        navigator.clipboard.writeText(directLink).then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        });
      }
    } catch {
      // User cancelled share — silent
    }
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const handleQuitGame = () => {
    resetGame();
    router.push('/tobol');
  };

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
        gap: '8px',
        overflow: 'hidden',
      }}
    >
      {/* ══════════ Header (top-left) — sound + chat + quit-game ══════════ */}
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

        {/* Eye icon — only in diwaniya mode, shows viewer count */}
        {isDiwaniyaHost && (
          <button
            type="button"
            className="tobol-eye-btn"
            onClick={() => setShowViewersModal(true)}
            aria-label="المشاهدون"
            title={`${viewerCount} مشاهد — اضغط لعرض القائمة`}
          >
            <img src="/battle/icon_eye.webp" alt="viewers" />
            {viewerCount > 0 && (
              <span className="tobol-eye-count">{viewerCount > 9 ? '9+' : viewerCount}</span>
            )}
          </button>
        )}

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

      {/* ══════════ Compact team panels + VS ══════════ */}
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

        {/* VS badge in middle */}
        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <TeamPanel team="blue" />
      </div>

      {/* ══════════ Notification pill ══════════ */}
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
              {/* CENTER: Waiting image OR latest card (clean — no overlays) */}
              <td colSpan={64} style={{ textAlign: 'center', verticalAlign: 'middle', position: 'relative' }}>
                {!modalData ? (
                  hasAnyCardBeenShown ? (
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
                  // CLEAN card — no points badge, no continue pill, just the weapon image
                  <div style={{ position: 'relative', display: 'inline-block', width: '90%' }}>
                    <img
                      src={modalData.cardImg}
                      alt="Card"
                      draggable={false}
                      onClick={isSpectator ? undefined : closeModal}
                      style={{ width: '100%', display: 'block', cursor: 'pointer', borderRadius: '4%' }}
                    />
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

      {/* ══════════ Battle log button ══════════ */}
      <div style={{ marginTop: '4px' }}>
        <BattleLogButton />
      </div>

      {/* ══════════ Diwaniya share box — appears under battle log ══════════ */}
      {isDiwaniyaHost && (
        <div className="tobol-share-box">
          <div className="tobol-share-title">🔗 شارك مشاهدة المعركة</div>
          <div className="tobol-share-code-row">
            <span className="tobol-share-code-label">كود المشاهدة:</span>
            <span className="tobol-share-code-value">{roomCode}</span>
          </div>
          <div className="tobol-share-link-row">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="tobol-share-link-input"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button type="button" className="tobol-share-btn" onClick={copyShareLink}>
              {shareCopied ? '✓ تم النسخ' : '📋 نسخ'}
            </button>
          </div>
          <div className="tobol-share-link-row">
            <button type="button" className="tobol-share-direct-btn" onClick={shareExternally}>
              <img src="/battle/iv_team_share.webp" alt="share" />
              <span>مشاركة مباشرة (دون كود)</span>
            </button>
          </div>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '9px', margin: '4px 0 0', lineHeight: 1.4 }}>
            الرابط المباشر يفتح اللعبة فوراً للأصدقاء المسجلين، أو يفتح نافذة التسجيل للسماح بالدخول.
          </p>
        </div>
      )}

      {/* ══════════ Viewers modal — diwaniya mode ══════════ */}
      <AnimatePresence>
        {showViewersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowViewersModal(false)}
            className="tobol-viewers-overlay"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-viewers-modal"
            >
              <div className="tobol-viewers-header">
                <span className="tobol-viewers-title">
                  <img src="/battle/icon_eye.webp" alt="viewers" />
                  المشاهدون ({viewerCount})
                </span>
                <button
                  onClick={() => setShowViewersModal(false)}
                  className="tobol-viewers-close"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>
              <div className="tobol-viewers-body">
                {viewers.length === 0 ? (
                  <p className="tobol-viewers-empty">
                    لا يوجد مشاهدون حالياً
                    <br />
                    شارك الكود أو الرابط المباشر لجلب المشاهدين
                  </p>
                ) : (
                  viewers.map((spec, idx) => (
                    <div key={spec.id} className="tobol-viewer-row">
                      <div className="tobol-viewer-avatar">
                        {spec.name.charAt(0)}
                      </div>
                      <div className="tobol-viewer-info">
                        <div className="tobol-viewer-name">{spec.name}</div>
                        <div className="tobol-viewer-meta">
                          انضم منذ {Math.max(0, Math.floor((Date.now() - spec.joinedAt) / 60000))} دقيقة
                        </div>
                      </div>
                      <span className="tobol-viewer-badge">#{idx + 1}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
