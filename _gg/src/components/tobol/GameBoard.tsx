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
// Battle Log Modal — button + modal window (replaces always-visible log)
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
// Notification Pill — turn indicator + last action
// Uses the same notice-pill styling as GameSetup
// ============================================================
function NotificationPill() {
  const { lastAction, currentTurn, redName, blueName } = useTobolStore();

  const isAttack = lastAction?.includes('هجوم');
  const isTrap = lastAction?.includes('الفخ');
  const turnName = currentTurn === 'red' ? redName : blueName;
  const isRedTurn = currentTurn === 'red';

  // Determine display text + style
  let displayText = '';
  let className = `tobol-board-notice team-${currentTurn}`;

  if (!lastAction) {
    // Waiting — show turn indicator
    displayText = `🎯 دور الفريق ${turnName}`;
  } else {
    displayText = lastAction;
    if (isAttack) className = 'tobol-board-notice attack';
    else if (isTrap) className = 'tobol-board-notice trap';
  }

  return (
    <div
      key={displayText + currentTurn}
      className={className}
      style={{ animation: 'tobolNoticeSlide 0.32s cubic-bezier(.34,1.56,.64,1)' }}
    >
      <span className="notice-dot" />
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '260px',
      }}>
        {displayText}
      </span>
      {/* show which team's turn as a chip */}
      <span style={{
        fontSize: '10px',
        fontWeight: 800,
        padding: '2px 8px',
        borderRadius: '999px',
        background: isRedTurn ? 'rgba(239,68,68,.18)' : 'rgba(59,130,246,.18)',
        border: `1px solid ${isRedTurn ? 'rgba(239,68,68,.45)' : 'rgba(59,130,246,.45)'}`,
        color: isRedTurn ? '#fca5a5' : '#93c5fd',
        marginLeft: '4px',
        flexShrink: 0,
      }}>
        {isRedTurn ? '🔴 أحمر' : '🔵 أزرق'}
      </span>
    </div>
  );
}

// ============================================================
// Team Panel — modern card with team name + score
// Uses same visual language as GameSetup team cards
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
    <div
      className={`tobol-team-panel team-${team} ${isActive ? 'active-turn' : ''}`}
      style={{ padding: '8px 10px' }}
    >
      {/* Header row: emoji + label + active chip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px',
      }}>
        <span style={{ fontSize: '14px' }}>{teamEmoji}</span>
        <span style={{
          fontSize: '11px',
          fontWeight: 800,
          color: accent,
          textShadow: '0 1px 2px rgba(0,0,0,.6)',
        }}>
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
      {/* Team name input */}
      {isSpectator ? (
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,.7)',
          padding: '2px 4px',
          textAlign: 'center',
        }}>
          {name}
        </div>
      ) : (
        <input
          className="w-full bg-transparent border-none text-white text-center outline-none"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '2px 4px',
            textShadow: '0 1px 2px rgba(0,0,0,.7)',
          }}
          value={name}
          onChange={(e) => isRed ? setTeamNames(e.target.value, blueName) : setTeamNames(redName, e.target.value)}
          maxLength={20}
          dir="rtl"
        />
      )}
      {/* Score */}
      <div
        className="tobol-score-number"
        style={{ color: isActive ? accentLight : '#fff' }}
      >
        {score}
      </div>
    </div>
  );
}

// ============================================================
// Main GameBoard — restyled to match setup page
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

  // Header button states
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [chatOn, setChatOn] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const isSpectator = gameMode === 'diwaniya' && typeof window !== 'undefined' && !window.location.pathname.startsWith('/tobol');

  // ── apply body.in-game-setup class to hide chrome + bottom nav + side panel
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => {
      document.body.classList.remove('in-game-setup');
    };
  }, []);

  // sync sound preferences
  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  // ── BUG FIX: auto-close card modal after 2.5s so the game doesn't freeze
  // The original code blocked all button clicks while modalData was set,
  // which made the game appear "frozen" if the user didn't tap the card.
  useEffect(() => {
    if (!modalData) return;
    const t = setTimeout(() => {
      closeModal();
    }, 2500);
    return () => clearTimeout(t);
  }, [modalData, closeModal]);

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

  const toggleChat = () => setChatOn((p) => !p);

  // Quit game without saving — reset everything and go to landing
  const handleQuitGame = () => {
    resetGame();
    router.push('/tobol');
  };

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
        padding: '8px 12px 16px',
        gap: '8px',
        overflow: 'hidden',
      }}
    >
      {/* ══════════ Header bar (top-left) — sound + chat + quit-game ══════════ */}
      <div className="tobol-header-actions">
        {/* Sound toggle */}
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

        {/* Chat toggle (chat is inside the game, per user request) */}
        <button
          type="button"
          className={`tobol-header-btn ${chatOn ? 'active' : ''}`}
          onClick={toggleChat}
          aria-label={chatOn ? 'إغلاق الدردشة' : 'تفعيل الدردشة'}
          title={chatOn ? 'إغلاق الدردشة' : 'تفعيل الدردشة'}
        >
          <img src="/battle/icon_chat.webp" alt="chat" />
        </button>

        {/* Quit game (exit without saving) — power-button icon */}
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

      {/* ══════════ Title (matches setup page) ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/tobol.png"
            alt="طبول الحرب"
            style={{
              width: '48px',
              height: '40px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.5))',
              margin: '0 auto',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: '-8px',
            background: 'radial-gradient(circle, rgba(254,239,145,.2), transparent 65%)',
            filter: 'blur(4px)',
            zIndex: -1,
            borderRadius: '50%',
          }} />
        </div>
        <h1
          className="tobol-board-title"
          style={{ fontSize: '18px', margin: '2px 0 0', lineHeight: 1 }}
        >
          🥁 طبول الحرب
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '9px', fontWeight: 600, marginTop: '1px' }}>
          إنها الحرب ⚔️
        </p>
      </motion.div>

      {/* ══════════ Team panels + VS ══════════ */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '6px',
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
        <div style={{ flex: 1 }}>
          <TeamPanel team="red" />
        </div>

        {/* VS badge in middle */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '46px',
            flexShrink: 0,
          }}
        >
          <div className="tobol-vs-badge" style={{ width: '38px', height: '38px', position: 'relative' }}>
            <img
              src="/battle/vs_pk.webp"
              alt="VS"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <TeamPanel team="blue" />
        </div>
      </div>

      {/* ══════════ Notification pill (turn/action) ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', justifyContent: 'center' }}>
        <NotificationPill />
      </div>

      {/* ══════════ Game board (table layout) ══════════ */}
      <div className="gameDiv" style={{ paddingBottom: '0', width: '95vw', maxWidth: '100vmin', margin: 0, padding: '4px 0 0' }}>
        <table className="gameTable">
          <tbody>
            {/* ===== ROW 2: Side Columns + Center Image (no more score row, replaced above) ===== */}
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
              {/* CENTER: Waiting image or weapon card */}
              <td colSpan={64} style={{ textAlign: 'center', verticalAlign: 'middle', position: 'relative' }}>
                {!modalData ? (
                  <img
                    className="w-[90%] mx-auto rounded-[7%] inline-block"
                    src={`/img/war/waiting/${((mainBgId % 3) + 1)}.png`}
                    alt="Waiting"
                    draggable={false}
                  />
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block', width: '90%' }}>
                    <img
                      src={modalData.cardImg}
                      alt="Card"
                      draggable={false}
                      onClick={isSpectator ? undefined : closeModal}
                      style={{ width: '100%', display: 'block', cursor: isSpectator ? 'default' : 'pointer', borderRadius: '4%' }}
                    />
                    {/* Points badge */}
                    <div className={`tobol-card-points ${modalData.points > 0 ? 'attack' : ''}`}>
                      {modalData.points > 0 ? `💥 ${modalData.points}` : '◍ فارغة'}
                    </div>
                    {/* Continue overlay — makes it clear the user should tap */}
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
