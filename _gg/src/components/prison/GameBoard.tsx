'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePrisonStore } from '@/lib/prison-store';
import { CELL_ITEMS, getRemainingItems, GRID_CONFIGS } from '@/lib/prison-types';
import type { CellItemType, PrisonTeam, PrisonPlayer, GridCell } from '@/lib/prison-types';
import {
  useInGameSetupMode,
  useYallaSoundState,
  useViewerCount,
  useShareLinks,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';
import {
  playClickSound,
  playCellOpenSound,
  playImprisonSound,
  playFreeSound,
  playNotifySound,
  playErrorSound,
} from '@/lib/sounds';

// Common emojis for chat picker
const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👎', '👏', '🙏', '💪', '🔥', '🔒', '⛓️', '🔑', '💀', '🏆', '🎉', '💯', '❤️', '✨', '⚡', '👑', '🤝', '🫡', '😤', '🤯'];

// ============================================================
// Battle Log Modal — button + modal window
// ============================================================
function BattleLogButton() {
  const { gameLog } = usePrisonStore();
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [gameLog, isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="tobol-log-btn"
        aria-label="سجل اللعبة"
      >
        <span style={{ fontSize: '13px' }}>📜</span>
        <span>سجل اللعبة</span>
        <span className="log-count">{gameLog.length}</span>
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
                <span className="tobol-log-modal-title">📜 سجل اللعبة</span>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="إغلاق"
                  style={{
                    background: 'none', border: 'none', color: '#9fc4b4',
                    fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: 0,
                  }}
                >×</button>
              </div>
              <div className="tobol-log-modal-body">
                {gameLog.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px 0' }}>
                    لا تحركات بعد...
                  </p>
                ) : (
                  gameLog.map((entry) => (
                    <div key={entry.id} className={`tobol-log-entry team-${entry.team}`}>
                      <span className="entry-num">{entry.id}.</span>
                      <span className="entry-msg">{entry.action}</span>
                      <span className="entry-delta neutral">{CELL_ITEMS[entry.itemType].emoji}</span>
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
// Notification Pill v3 — team info + current action
// ============================================================
function NotificationPill() {
  const { interactionState, currentTeam, alphaName, betaName, currentPlayerId, players } = usePrisonStore();

  const isAlphaTurn = currentTeam === 'alpha';
  const turnName = isAlphaTurn ? alphaName : betaName;
  const teamChipLabel = isAlphaTurn ? '🟡 أ' : '🔵 ب';
  const teamChipClass = isAlphaTurn ? 'team-red' : 'team-blue';
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  let displayText = '';
  let containerClass = `tobol-board-notice-v3 team-${isAlphaTurn ? 'red' : 'blue'}`;

  if (interactionState === 'waiting_for_player') {
    displayText = `اختر لاعب من فريق ${turnName}`;
  } else if (interactionState === 'waiting_for_cell' && currentPlayer) {
    displayText = `🔓 ${currentPlayer.name} — اختر زنزانة`;
    containerClass = 'tobol-board-notice-v3 attack';
  } else if (interactionState === 'picking_opponent_jail') {
    displayText = '🏚️ اختر لاعب الخصم للسجن';
    containerClass = 'tobol-board-notice-v3 trap';
  } else if (interactionState === 'picking_teammate_free') {
    displayText = '🔑 اختر سجين فريقك لتحريره';
    containerClass = 'tobol-board-notice-v3 attack';
  } else if (interactionState === 'showing_result') {
    displayText = 'متابعة';
  } else {
    displayText = `دور فريق ${turnName}`;
  }

  return (
    <div
      key={displayText + currentTeam}
      className={containerClass}
      style={{ animation: 'tobolNoticeSlide 0.32s cubic-bezier(.34,1.56,.64,1)' }}
    >
      <span className={`tobol-notice-team-chip ${teamChipClass}`}>{teamChipLabel}</span>
      <span className="notice-dot" />
      <span className="tobol-notice-text">{displayText}</span>
    </div>
  );
}

// ============================================================
// Compact Team Panel
// ============================================================
function TeamPanel({ team }: { team: PrisonTeam }) {
  const { alphaName, betaName, currentTeam, players } = usePrisonStore();

  const isAlpha = team === 'alpha';
  const name = isAlpha ? alphaName : betaName;
  const isActive = currentTeam === team;
  const teamPlayers = players.filter((p) => p.team === team);
  const alive = teamPlayers.filter((p) => p.status !== 'executed').length;
  const active = teamPlayers.filter((p) => p.status === 'active').length;
  const imprisoned = teamPlayers.filter((p) => p.status === 'imprisoned').length;

  return (
    <div
      className={`tobol-team-panel-compact team-${isAlpha ? 'red' : 'blue'} ${isActive ? 'active-turn' : ''}`}
    >
      <div className="tobol-team-name-display">{name}</div>
      <div className="tobol-team-divider-compact" />
      <div style={{ display: 'flex', justifyContent: 'space-around', gap: '4px', marginTop: '4px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#34d399' }}>{active}</div>
          <div style={{ fontSize: '8px', color: '#6b7280' }}>أحرار</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#fb923c' }}>{imprisoned}</div>
          <div style={{ fontSize: '8px', color: '#6b7280' }}>سجناء</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#9fc4b4' }}>{alive}</div>
          <div style={{ fontSize: '8px', color: '#6b7280' }}>أحياء</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Header Chat Button + Panel
// ============================================================
interface ChatMsg {
  id: number;
  team: PrisonTeam;
  text: string;
}

function HeaderChatButton() {
  const { currentTeam, alphaName, betaName } = usePrisonStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const senderTeam = currentTeam;
  const senderName = senderTeam === 'alpha' ? alphaName : betaName;

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

  const lastMsgTeam = messages.length > 0 ? messages[messages.length - 1].team : null;
  useEffect(() => {
    if (!isOpen && lastMsgTeam && lastMsgTeam !== senderTeam) {
      setUnread((u) => u + 1);
    }
  }, [lastMsgTeam, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg: ChatMsg = { id: Date.now(), team: senderTeam, text };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setShowEmojis(false);
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
                <button onClick={() => setIsOpen(false)} className="tobol-chat-panel-close" aria-label="إغلاق">×</button>
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
                    const mSender = m.team === 'alpha' ? alphaName : betaName;
                    return (
                      <div key={m.id} className={`tobol-chat-msg ${isMine ? 'me' : 'other'}`}>
                        <span className="msg-sender">
                          {m.team === 'alpha' ? '🟡' : '🔵'} {mSender}
                        </span>
                        <span className="msg-bubble">{m.text}</span>
                      </div>
                    );
                  })
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
                        <button key={i} type="button" onClick={() => handleEmojiClick(e)} aria-label={`emoji ${e}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="tobol-chat-panel-input-row">
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
                <button onClick={handleSend} disabled={!input.trim()}>إرسال</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Stats Bar — Yalla compact pills
// ============================================================
function StatsBar({ grid }: { grid: GridCell[] }) {
  const remaining = getRemainingItems(grid);
  const items: { type: CellItemType; emoji: string; label: string; color: string }[] = [
    { type: 'skull', emoji: '💀', label: 'إعدام', color: '#f87171' },
    { type: 'open', emoji: '🔓', label: 'فارغة', color: '#22d3ee' },
    { type: 'uniform', emoji: '🏚️', label: 'ملابس', color: '#fb923c' },
    { type: 'key', emoji: '🔑', label: 'مفتاح', color: '#fbbf24' },
    { type: 'skip', emoji: '✋', label: 'ممتلئة', color: '#9ca3af' },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div
          key={item.type}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '8px',
            background: 'rgba(6,42,32,.6)',
            border: `1px solid ${item.color}33`,
          }}
        >
          <span style={{ fontSize: '12px' }}>{item.emoji}</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: item.color }}>{remaining[item.type]}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Player Panel — team players with status
// ============================================================
function PlayerPanel({
  team,
  teamName,
  players,
  currentPlayerId,
  interactionState,
  onSelectPlayer,
}: {
  team: PrisonTeam;
  teamName: string;
  players: PrisonPlayer[];
  currentPlayerId: string | null;
  interactionState: string;
  onSelectPlayer: (id: string) => void;
}) {
  const isAlpha = team === 'alpha';
  const teamPlayers = players.filter((p) => p.team === team);
  const accent = isAlpha ? '#ef4444' : '#3b82f6';

  return (
    <div
      className="tobol-team-card"
      style={
        {
          flex: 1,
          padding: '8px 8px 10px',
          '--card-border': `linear-gradient(180deg, ${accent}80, ${accent}20)`,
          background: `linear-gradient(180deg, ${accent}14, ${accent}05 80%)`,
        } as React.CSSProperties
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px' }}>{isAlpha ? '🟡' : '🔵'}</span>
        <span style={{ fontSize: '11px', fontWeight: 800, color: accent, textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
          {teamName}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b', marginRight: 'auto' }}>
          ({teamPlayers.filter((p) => p.status !== 'executed').length} حي)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {teamPlayers.map((player) => {
          const isActive = player.status === 'active';
          const isImprisoned = player.status === 'imprisoned';
          const isExecuted = player.status === 'executed';
          const isCurrentPlayer = player.id === currentPlayerId;
          const canSelect = interactionState === 'waiting_for_player' && isActive && player.team === team;

          return (
            <motion.button
              key={player.id}
              whileTap={canSelect ? { scale: 0.97 } : undefined}
              onClick={() => canSelect && onSelectPlayer(player.id)}
              disabled={!canSelect}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 8px', borderRadius: '8px',
                cursor: canSelect ? 'pointer' : 'default',
                border: isCurrentPlayer
                  ? `1px solid ${accent}80`
                  : isExecuted
                    ? '1px solid rgba(239,68,68,.15)'
                    : isImprisoned
                      ? '1px solid rgba(251,146,60,.25)'
                      : canSelect
                        ? '1px solid rgba(255,255,255,.12)'
                        : '1px solid rgba(255,255,255,.05)',
                background: isCurrentPlayer
                  ? `${accent}26`
                  : isExecuted
                    ? 'rgba(127,29,29,.15)'
                    : isImprisoned
                      ? 'rgba(124,45,18,.18)'
                      : canSelect
                        ? 'rgba(0,0,0,.35)'
                        : 'rgba(0,0,0,.2)',
                opacity: isExecuted ? 0.55 : 1,
                textDecoration: isExecuted ? 'line-through' : 'none',
              }}
            >
              <span style={{ fontSize: '12px' }}>
                {isExecuted ? '💀' : isImprisoned ? '🏚️' : isActive ? '✅' : ''}
              </span>
              <span style={{
                flex: 1, fontSize: '11px', fontWeight: 600, color: '#e2e8f0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{player.name}</span>
              {isImprisoned && (
                <span style={{ fontSize: '8px', padding: '2px 4px', borderRadius: '4px', background: 'rgba(251,146,60,.2)', color: '#fdba74' }}>
                  {player.uniformCount}×
                </span>
              )}
              {isCurrentPlayer && (
                <span style={{ fontSize: '8px', padding: '2px 4px', borderRadius: '4px', background: `${accent}33`, color: accent }}>
                  اللعب
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Grid Cell Component
// ============================================================
function GridCellComponent({
  cell,
  cols,
  onClick,
}: {
  cell: GridCell;
  cols: number;
  onClick?: () => void;
}) {
  const item = CELL_ITEMS[cell.type];

  return (
    <motion.button
      whileTap={cell.status === 'hidden' && onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={!onClick}
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        aspectRatio: '1/1',
        cursor: cell.status === 'hidden' && onClick ? 'pointer' : 'default',
        transition: 'all .15s',
      }}
    >
      {cell.status === 'hidden' ? (
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, rgba(30,41,59,.9), rgba(15,23,42,.95))',
          border: '1.5px solid rgba(100,116,139,.4)',
          borderRadius: '12px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '2px',
        }}>
          <span style={{ fontSize: '14px', opacity: 0.5 }}>🔒</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
            {cell.index + 1}
          </span>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, rgba(15,23,42,.95), rgba(2,6,23,.95))',
            border: `1.5px solid ${item.color}66`,
            borderRadius: '12px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div style={{ width: '70%', height: '70%' }}>
            <img
              src={item.img}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              draggable={false}
            />
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '2px 0', textAlign: 'center',
            fontSize: '8px', fontWeight: 700,
            background: `${item.color}30`, color: item.color,
            borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px',
          }}>
            {item.label}
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

// ============================================================
// Result Modal — shows what was revealed
// ============================================================
function ResultModal({
  cell,
  interactionState,
  currentPlayerName,
  selectedTargetName,
  onAction,
  onClose,
}: {
  cell: GridCell;
  interactionState: string;
  currentPlayerName: string;
  selectedTargetName: string | null;
  onAction: () => void;
  onClose: () => void;
}) {
  const item = CELL_ITEMS[cell.type];

  const allowBackdropClose = interactionState === 'showing_result';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={allowBackdropClose ? onClose : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,.8)', padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #0e2a22, #061812)',
          border: `1.5px solid ${item.color}55`,
          borderRadius: '18px', padding: '24px',
          maxWidth: '300px', width: '100%', textAlign: 'center',
          boxShadow: '0 14px 36px rgba(0,0,0,.55)',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.1 }}
          style={{ width: '88px', height: '88px', margin: '0 auto 12px' }}
        >
          <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
        </motion.div>

        <h3 style={{ ...STROKE_STYLE, fontSize: '18px', fontWeight: 900, marginBottom: '6px', color: item.color }}>
          {item.emoji} {item.title}
        </h3>

        <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>{item.desc}</p>

        <p style={{ color: '#9fc4b4', fontSize: '11px', marginBottom: '12px' }}>
          {currentPlayerName}
        </p>

        {selectedTargetName && interactionState === 'showing_result' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}
          >
            {cell.type === 'open' && `🏚️ تم سجن ${selectedTargetName}!`}
            {cell.type === 'key' && `🔓 تم تحرير ${selectedTargetName}!`}
          </motion.p>
        )}

        {interactionState === 'showing_result' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAction}
            style={{
              width: '100%', padding: '10px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #4a8d7a, #3a7d6a)',
              color: '#feef91', fontSize: '14px', fontWeight: 800,
              boxShadow: '0 4px 12px rgba(74,141,122,.35)',
            }}
          >متابعة ▶</motion.button>
        ) : (
          <p style={{ color: '#9fc4b4', fontSize: '13px', fontWeight: 700, padding: '8px' }}>
            {cell.type === 'open' ? 'اختر لاعب للسجن' : 'اختر سجين للتحرير'}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Player Selection Overlay
// ============================================================
function PlayerSelectionOverlay({
  title, players, onSelect, icon,
}: {
  title: string;
  players: PrisonPlayer[];
  onSelect: (id: string) => void;
  icon: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,.8)', padding: '20px',
      }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{
          background: 'linear-gradient(180deg, #0e2a22, #061812)',
          border: '1.5px solid rgba(254,239,145,.25)',
          borderRadius: '18px', padding: '20px',
          maxWidth: '300px', width: '100%',
          boxShadow: '0 14px 36px rgba(0,0,0,.55)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>{icon}</div>
          <h3 style={{ ...STROKE_STYLE, fontSize: '15px', fontWeight: 800 }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
          {players.map((player) => (
            <motion.button
              key={player.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(player.id)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                background: 'rgba(0,0,0,.35)',
                border: '1px solid rgba(254,239,145,.15)',
              }}
            >
              <span style={{ fontSize: '16px' }}>👤</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{player.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Main GameBoard
// ============================================================
export default function GameBoard() {
  const router = useRouter();
  const {
    grid,
    gridSize,
    currentTeam,
    alphaName,
    betaName,
    players,
    currentPlayerId,
    interactionState,
    revealedCell,
    selectedTargetId,
    gameMode,
    roomCode,
    selectPlayer,
    revealCell,
    imprisonOpponent,
    freeTeammate,
    advanceTurn,
    closeModal,
    resetGame,
  } = usePrisonStore();

  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);

  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();
  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;
  const { viewerCount, viewers } = useViewerCount('prison', isDiwaniyaHost, roomCode);
  const { shareLink, shareCopied, copyShareLink, shareExternally } = useShareLinks('prison', isDiwaniyaHost, roomCode);

  const config = GRID_CONFIGS[gridSize];
  const cols = config?.cols ?? 4;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const selectedTarget = players.find((p) => p.id === selectedTargetId);
  const opponentTeam: PrisonTeam = currentTeam === 'alpha' ? 'beta' : 'alpha';

  const activeOpponents = players.filter((p) => p.team === opponentTeam && p.status === 'active');
  const imprisonedTeammates = players.filter((p) => p.team === currentTeam && p.status === 'imprisoned');
  const activeCurrentTeamPlayers = players.filter((p) => p.team === currentTeam && p.status === 'active');

  // Suppress unused warnings — these come from store but are referenced via store actions
  void activeCurrentTeamPlayers;

  // ── Sound effects ───────────────────────────────────────────
  // Wrap cell reveal so a click + cell-open sound plays on every tap.
  const handleRevealCell = (cellId: string) => {
    playClickSound();
    playCellOpenSound();
    revealCell(cellId);
  };

  // Wrap selectPlayer — plays a click on every selection.
  const handleSelectPlayer = (id: string) => {
    playClickSound();
    selectPlayer(id);
  };

  // Wrap imprisonOpponent — low ominous tone when a player gets sent to prison.
  const handleImprison = (id: string) => {
    playImprisonSound();
    imprisonOpponent(id);
  };

  // Wrap freeTeammate — high bright tone when a prisoner is freed.
  const handleFree = (id: string) => {
    playFreeSound();
    freeTeammate(id);
  };

  // Wrap advanceTurn — plays error buzz when called on an invalid action,
  // otherwise plays a notify bell so players know it's the other team's turn.
  const handleAdvanceTurn = () => {
    playNotifySound();
    advanceTurn();
  };

  // Play a soft notify bell whenever the active team swaps.
  const prevTeamRef = useRef<PrisonTeam | undefined>(undefined);
  useEffect(() => {
    if (prevTeamRef.current !== undefined && prevTeamRef.current !== currentTeam) {
      playNotifySound();
    }
    prevTeamRef.current = currentTeam;
  }, [currentTeam]);

  // Define handleQuitGame BEFORE it's used (so we can also play a click on quit).
  const handleQuitGame = () => {
    // [UNIFIED EXIT] Preserve state for resume. End diwaniya room + go home.
    const st = usePrisonStore.getState();
    if (st.gameMode === 'diwaniya' && st.roomCode) {
      try { fetch(`/api/prison-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
    }
    try { if (typeof window !== 'undefined') { localStorage.removeItem('prison-game-storage'); localStorage.removeItem('prison-game-storage__disconnect_ts'); } } catch { /* ignore */ }
try { usePrisonStore.getState().resetGame(); } catch { /* ignore */ }
setShowQuitDialog
    router.push('/#games');
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
        padding: '8px 14px 100px',
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ Header — sound + chat + quit ══════════ */}
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

      {/* ══════════ Title ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/prison.png"
            alt="السجن"
            style={{ width: '76px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.55))' }}
          />
          <div style={{
            position: 'absolute', inset: '-12px',
            background: 'radial-gradient(circle, rgba(254,239,145,.22), transparent 65%)',
            filter: 'blur(6px)', zIndex: -1, borderRadius: '50%',
          }} />
        </div>
        <h1 style={{ ...STROKE_STYLE, fontSize: '22px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: '2px 0 0', lineHeight: 1 }}>
          السجن
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Prison — Escape the cell 🔑
        </p>
      </motion.div>

      {/* ══════════ Stats Bar ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <StatsBar grid={grid} />
      </div>

      {/* ══════════ Compact team panels + VS ══════════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '8px',
          alignItems: 'stretch',
          marginTop: '2px',
        }}
      >
        <TeamPanel team="alpha" />
        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img src="/battle/vs_pk.webp" alt="VS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <TeamPanel team="beta" />
      </div>

      {/* ══════════ Notification pill ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', justifyContent: 'center' }}>
        <NotificationPill />
      </div>

      {/* ══════════ Player panels (alpha/beta) ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', gap: '8px' }}>
        <PlayerPanel
          team="alpha"
          teamName={alphaName}
          players={players}
          currentPlayerId={currentPlayerId}
          interactionState={interactionState}
          onSelectPlayer={handleSelectPlayer}
        />
        <PlayerPanel
          team="beta"
          teamName={betaName}
          players={players}
          currentPlayerId={currentPlayerId}
          interactionState={interactionState}
          onSelectPlayer={handleSelectPlayer}
        />
      </div>

      {/* ══════════ Grid ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div
          style={{
            display: 'grid',
            gap: '6px',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {grid.map((cell) => (
            <GridCellComponent
              key={cell.id}
              cell={cell}
              cols={cols}
              onClick={
                interactionState === 'waiting_for_cell' && cell.status === 'hidden'
                  ? () => handleRevealCell(cell.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* ══════════ Battle log button ══════════ */}
      <div style={{ marginTop: '4px' }}>
        <BattleLogButton />
      </div>

      {/* ══════════ Diwaniya share box ══════════ */}
      {isDiwaniyaHost && (
        <div className="tobol-share-box">
          <div className="tobol-share-title">🔗 شارك مشاهدة اللعبة</div>
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

      {/* ══════════ Viewers modal ══════════ */}
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
                >×</button>
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
                      <div className="tobol-viewer-avatar">{spec.name.charAt(0)}</div>
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

      {/* ══════════ Result modal ══════════ */}
      <AnimatePresence>
        {interactionState === 'showing_result' && revealedCell && (
          <ResultModal
            cell={revealedCell}
            interactionState={interactionState}
            currentPlayerName={currentPlayer?.name ?? ''}
            selectedTargetName={selectedTarget?.name ?? null}
            onAction={handleAdvanceTurn}
            onClose={closeModal}
          />
        )}
        {interactionState === 'picking_opponent_jail' && revealedCell && (
          <ResultModal
            cell={revealedCell}
            interactionState={interactionState}
            currentPlayerName={currentPlayer?.name ?? ''}
            selectedTargetName={null}
            onAction={handleAdvanceTurn}
            onClose={closeModal}
          />
        )}
        {interactionState === 'picking_teammate_free' && revealedCell && (
          <ResultModal
            cell={revealedCell}
            interactionState={interactionState}
            currentPlayerName={currentPlayer?.name ?? ''}
            selectedTargetName={null}
            onAction={handleAdvanceTurn}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* ══════════ Player Selection ══════════ */}
      <AnimatePresence>
        {interactionState === 'picking_opponent_jail' && activeOpponents.length > 0 && (
          <PlayerSelectionOverlay
            title={`اختر لاعب من فريق ${opponentTeam === 'alpha' ? alphaName : betaName} للسجن`}
            players={activeOpponents}
            onSelect={handleImprison}
            icon="🏚️"
          />
        )}
        {interactionState === 'picking_teammate_free' && imprisonedTeammates.length > 0 && (
          <PlayerSelectionOverlay
            title={`اختر سجين من فريق ${currentTeam === 'alpha' ? alphaName : betaName} للتحرير`}
            players={imprisonedTeammates}
            onSelect={handleFree}
            icon="🔓"
          />
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
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
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
                borderRadius: '18px', padding: '20px',
                maxWidth: '300px', width: '100%', textAlign: 'center',
                boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>⏻</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                إنهاء اللعبة بدون حفظ؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء اللعبة الحالية دون حفظ التقدم، وستبدأ من الصفر.
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
                >نعم، أنهِ</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
