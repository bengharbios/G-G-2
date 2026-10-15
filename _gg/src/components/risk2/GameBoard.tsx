'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRisk2Store } from '@/lib/risk2-store';
import { CARD_COLORS, SPECIAL_CARD_INFO, getCardStats, getGridCols } from '@/lib/risk2-types';
import type { Risk2Card, Risk2Player, CardColor } from '@/lib/risk2-types';
import {
  useInGameSetupMode,
  useYallaSoundState,
  useViewerCount,
  useShareLinks,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';

// Common emojis for chat picker
const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👎', '👏', '🙏', '💪', '🔥', '🎴', '🎰', '🌈', '⭐', '💫', '🃏', '🎉', '💯', '❤️', '✨', '⚡', '👑', '🤝', '🫡', '😤', '🤯'];

// Player color palette for inline accent — applied by joinOrder
const PLAYER_PALETTE: { hex: string; emoji: string }[] = [
  { hex: '#a855f7', emoji: '🟣' },
  { hex: '#34d399', emoji: '🟢' },
  { hex: '#fbbf24', emoji: '🟡' },
  { hex: '#fb7185', emoji: '🔴' },
  { hex: '#22d3ee', emoji: '🔵' },
  { hex: '#fb923c', emoji: '🟠' },
  { hex: '#f472b6', emoji: '🌸' },
  { hex: '#2dd4bf', emoji: '🌊' },
];

function getPlayerStyle(p: Risk2Player) {
  return PLAYER_PALETTE[p.joinOrder % PLAYER_PALETTE.length];
}

// Local hex map for card colors
const CARD_COLOR_HEX: Record<CardColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  purple: '#8b5cf6',
};

// ============================================================
// Battle Log Modal — button + modal window
// ============================================================
function BattleLogButton() {
  const { gameLog } = useRisk2Store();
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
              <div className="tobol-log-header">
                <span className="tobol-log-title">
                  <span style={{ fontSize: '14px' }}>📜</span>
                  سجل اللعبة
                  <span style={{ fontSize: '10px', color: '#9fc4b4' }}>
                    ({gameLog.length})
                  </span>
                </span>
                <button onClick={() => setIsOpen(false)} className="tobol-log-close" aria-label="إغلاق">×</button>
              </div>
              <div className="tobol-log-body">
                {gameLog.length === 0 ? (
                  <p className="tobol-log-empty">لا تحركات بعد...</p>
                ) : (
                  gameLog.map((entry) => (
                    <div key={entry.id} className="tobol-log-entry">
                      <span className="log-id">#{entry.id}</span>
                      <span className="log-text">{entry.action}</span>
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
// Notification Pill — current turn state
// ============================================================
function NotificationPill() {
  const { turnState, players, currentPlayerIndex, config } = useRisk2Store();
  const currentPlayer = players[currentPlayerIndex];
  const playerStyle = currentPlayer ? getPlayerStyle(currentPlayer) : null;

  let displayText = '';
  let containerClass = 'tobol-board-notice-v3 team-red';

  if (turnState === 'waiting_for_draw') {
    displayText = `اختر بطاقة — ${currentPlayer?.name ?? ''}`;
  } else if (turnState === 'waiting_for_decision') {
    displayText = `استمر أو احفظ؟ (+${currentPlayer?.roundScore ?? 0})`;
    containerClass = 'tobol-board-notice-v3 attack';
  } else if (turnState === 'showing_result') {
    displayText = 'تابع';
  } else if (turnState === 'turn_lost') {
    displayText = '😱 تطابق! خسرت النقاط';
    containerClass = 'tobol-board-notice-v3 trap';
  } else if (turnState === 'bomb_exploded') {
    displayText = '💣 انفجار!';
    containerClass = 'tobol-board-notice-v3 trap';
  } else {
    displayText = `دور ${currentPlayer?.name ?? ''}`;
  }

  return (
    <div
      key={displayText + turnState}
      className={containerClass}
      style={{ animation: 'tobolNoticeSlide 0.32s cubic-bezier(.34,1.56,.64,1)' }}
    >
      <span className="tobol-notice-team-chip team-red">
        {playerStyle?.emoji ?? '🎴'}
      </span>
      <span className="notice-dot" />
      <span className="tobol-notice-text">{displayText}</span>
      <span style={{ fontSize: '10px', color: '#9fc4b4', marginLeft: '4px' }}>
        / {config.targetScore}
      </span>
    </div>
  );
}

// ============================================================
// Compact Player Score Panel
// ============================================================
function PlayerScorePanel({ player, isCurrent }: { player: Risk2Player; isCurrent: boolean }) {
  const style = getPlayerStyle(player);
  const accent = style.hex;
  return (
    <div
      className={`tobol-team-panel-compact team-${isCurrent ? 'red' : 'blue'} ${isCurrent ? 'active-turn' : ''}`}
      style={
        isCurrent
          ? ({
              '--team-accent': accent,
              borderColor: `${accent}80`,
            } as React.CSSProperties)
          : {
              borderColor: 'rgba(255,255,255,.08)',
              opacity: 0.85,
            }
      }
    >
      <div className="tobol-team-name-display" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px' }}>{style.emoji}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </span>
        {isCurrent && player.roundScore > 0 && (
          <span style={{ fontSize: '9px', color: '#34d399', marginRight: 'auto' }}>
            +{player.roundScore}
          </span>
        )}
        {player.multiplier > 1 && (
          <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 800 }}>
            ×{player.multiplier}
          </span>
        )}
      </div>
      <div className="tobol-team-divider-compact" />
      <div className="tobol-team-score-compact" style={{ color: isCurrent ? accent : '#e2e8f0' }}>
        {player.score}
      </div>
    </div>
  );
}

// ============================================================
// Header Chat Button + Panel
// ============================================================
interface ChatMsg {
  id: number;
  playerId: string;
  playerName: string;
  text: string;
}

function HeaderChatButton() {
  const { players, currentPlayerIndex } = useRisk2Store();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sender = players[currentPlayerIndex];

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

  const lastMsgPlayerId = messages.length > 0 ? messages[messages.length - 1].playerId : null;
  useEffect(() => {
    if (!isOpen && lastMsgPlayerId && sender && lastMsgPlayerId !== sender.id) {
      setUnread((u) => u + 1);
    }
  }, [lastMsgPlayerId, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !sender) return;
    const newMsg: ChatMsg = { id: Date.now(), playerId: sender.id, playerName: sender.name, text };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setShowEmojis(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  if (!sender) return null;

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
              transition={{ type: 'spring', bounce: 0.2 }}
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
                    const isMine = m.playerId === sender.id;
                    return (
                      <div key={m.id} className={`tobol-chat-msg ${isMine ? 'me' : 'other'}`}>
                        <span className="msg-sender">{m.playerName}</span>
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
                  placeholder={`أرسل كـ ${sender.name}...`}
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
// Stats Bar — remaining card counts
// ============================================================
function StatsBar({ cards }: { cards: Risk2Card[] }) {
  const stats = getCardStats(cards);
  const items: { emoji: string; count: number; color: string; label: string }[] = [
    { emoji: '🔢', count: stats.numbers, color: '#34d399', label: 'رقم' },
    { emoji: '💣', count: stats.bombs, color: '#ef4444', label: 'قنبلة' },
    { emoji: '⏭️', count: stats.skips, color: '#94a3b8', label: 'تخطي' },
    { emoji: '✨', count: stats.doubles, color: '#f59e0b', label: '×2' },
    { emoji: '🔥', count: stats.triples, color: '#fbbf24', label: '×3' },
    { emoji: '◍', count: stats.hidden, color: '#9ca3af', label: 'متبقي' },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '8px',
            background: 'rgba(6,42,32,.6)',
            border: `1px solid ${item.color}33`,
          }}
        >
          <span style={{ fontSize: '12px' }}>{item.emoji}</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: item.color }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Card Grid Component (Yalla Ludo长老 style)
// ============================================================
function GridCard({ card, onClick }: { card: Risk2Card; onClick?: () => void }) {
  const canClick = !card.revealed && onClick;
  const colorConfig = card.color ? CARD_COLORS[card.color] : null;
  const colorHex = card.color ? CARD_COLOR_HEX[card.color] : '#34d399';

  return (
    <motion.button
      whileTap={canClick ? { scale: 0.9 } : undefined}
      onClick={onClick}
      disabled={!canClick}
      style={{
        position: 'relative', borderRadius: '8px', overflow: 'hidden',
        cursor: canClick ? 'pointer' : 'default',
        transition: 'all .15s',
      }}
    >
      {card.revealed ? (
        <motion.div
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{
            width: '100%', aspectRatio: '1/1', borderRadius: '8px',
            border: `1.5px solid ${card.type === 'bomb' ? '#ef444466' : card.type === 'skip' ? '#94a3b866' : card.type === 'double' ? '#f59e0b66' : card.type === 'triple' ? '#fbbf2466' : `${colorHex}66`}`,
            background: card.type === 'bomb'
              ? 'linear-gradient(135deg, #1a0a0a, #2a1010)'
              : card.type === 'skip'
                ? 'linear-gradient(135deg, #1a1a2e, #1e1e30)'
                : card.type === 'double'
                  ? 'linear-gradient(135deg, #1a1500, #2a2010)'
                  : card.type === 'triple'
                    ? 'linear-gradient(135deg, #1a0a20, #2a1030)'
                    : colorConfig
                      ? `linear-gradient(135deg, ${colorHex}20, ${colorHex}10)`
                      : 'linear-gradient(135deg, #0a1a10, #0a2a18)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '18px', marginBottom: '2px' }}>
            {card.type === 'bomb' ? '💣'
              : card.type === 'skip' ? '⏭️'
              : card.type === 'double' ? '✨'
              : card.type === 'triple' ? '🔥'
              : (colorConfig?.emoji ?? '')}
          </div>
          {card.type === 'number' && (
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{card.number}</div>
          )}
          {(card.type === 'double' || card.type === 'triple') && (
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#fbbf24' }}>
              ×{card.type === 'double' ? 2 : 3}
            </div>
          )}
        </motion.div>
      ) : (
        <div style={{
          width: '100%', aspectRatio: '1/1',
          background: 'linear-gradient(135deg, rgba(30,41,59,.9), rgba(15,23,42,.95))',
          border: '1.5px solid rgba(100,116,139,.4)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
            {card.index + 1}
          </span>
        </div>
      )}
    </motion.button>
  );
}

// ============================================================
// Result Modal — preserve game logic, Yalla styling
// ============================================================
function ResultModal({
  card,
  currentPlayer,
  matchReason,
  turnState,
  onContinue,
  onBank,
  onAdvance,
  deckNumber,
}: {
  card: Risk2Card;
  currentPlayer: Risk2Player;
  matchReason: string;
  turnState: string;
  onContinue: () => void;
  onBank: () => void;
  onAdvance: () => void;
  deckNumber: number;
}) {
  const isGold = card.type === 'double' || card.type === 'triple';
  const colorConfig = card.color ? CARD_COLORS[card.color] : null;
  const colorHex = card.color ? CARD_COLOR_HEX[card.color] : '#34d399';

  // Determine card accent color
  const cardAccent =
    card.type === 'bomb' ? '#ef4444'
    : card.type === 'skip' ? '#94a3b8'
    : card.type === 'double' ? '#f59e0b'
    : card.type === 'triple' ? '#fbbf24'
    : colorHex;

  const cardEmoji =
    card.type === 'bomb' ? '💣'
    : card.type === 'skip' ? '⏭️'
    : card.type === 'double' ? '✨'
    : card.type === 'triple' ? '🔥'
    : (colorConfig?.emoji ?? '');

  const cardLabel =
    card.type === 'bomb' ? 'قنبلة'
    : card.type === 'skip' ? 'تخطي'
    : card.type === 'double' ? '×2 مضاعف'
    : card.type === 'triple' ? '×3 ثلاثي'
    : card.color ? `${card.number} ${colorConfig?.label ?? ''}` : `${card.number}`;

  const cardDesc =
    card.type === 'bomb' ? 'انفجار! خسرت كل رصيد الجولة!'
    : card.type === 'skip' ? 'تم تخطي دورك! خسرت رصيد الجولة!'
    : card.type === 'double' ? 'رصيد الجولة × 2!'
    : card.type === 'triple' ? 'رصيد الجولة × 3!'
    : card.color ? `${colorConfig?.label ?? ''} — آمن!` : 'آمن!';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(turnState === 'showing_result' || turnState === 'turn_lost') ? onAdvance : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
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
          border: `1.5px solid ${cardAccent}55`,
          borderRadius: '18px', padding: '24px',
          maxWidth: '300px', width: '100%', textAlign: 'center',
          boxShadow: isGold
            ? `0 14px 36px rgba(251,191,36,.25)`
            : '0 14px 36px rgba(0,0,0,.55)',
        }}
      >
        {turnState === 'turn_lost' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.1 }}
              style={{ fontSize: '48px', marginBottom: '12px' }}
            >😱</motion.div>
            <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '8px', color: '#ef4444' }}>
              تطابق!
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>
              {matchReason || 'البطاقة المربوطة تكررت!'}
            </p>
            <p style={{ color: '#f87171', fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>
              {currentPlayer.name} خسر {currentPlayer.roundScore} نقطة!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAdvance}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                color: '#fff', fontSize: '14px', fontWeight: 800,
                boxShadow: '0 4px 12px rgba(220,38,38,.35)',
              }}
            >متابعة ▶</motion.button>
          </>
        )}

        {turnState !== 'turn_lost' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.1 }}
              style={{
                fontSize: '48px', marginBottom: '12px',
                filter: isGold ? 'drop-shadow(0 0 10px rgba(251,191,36,.6))' : 'none',
              }}
            >{cardEmoji}</motion.div>

            <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '8px', color: cardAccent }}>
              {cardLabel}
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>{cardDesc}</p>

            {card.type === 'number' && (
              <p style={{ color: '#34d399', fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>
                +{card.number * currentPlayer.multiplier}
                {currentPlayer.multiplier > 1 ? ` (${card.number}×${currentPlayer.multiplier})` : ''}
              </p>
            )}
            {card.type === 'number' && colorConfig && (
              <p style={{ color: '#9fc4b4', fontSize: '11px', marginBottom: '12px' }}>
                {colorConfig.emoji} {colorConfig.label}
              </p>
            )}
            {card.type === 'bomb' && (
              <p style={{ color: '#f87171', fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>
                {currentPlayer.name} خسر {currentPlayer.roundScore} نقطة!
              </p>
            )}
            {card.type === 'skip' && (
              <p style={{ color: '#9fc4b4', fontSize: '13px', marginBottom: '12px' }}>
                تم تخطي دور {currentPlayer.name}
              </p>
            )}
            {card.type === 'double' && (
              <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>
                المضاعف الآن: ×{currentPlayer.multiplier}
              </p>
            )}
            {card.type === 'triple' && (
              <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>
                المضاعف الآن: ×{currentPlayer.multiplier}
              </p>
            )}

            {card.type === 'number' && turnState === 'waiting_for_decision' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onContinue}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#fff', fontSize: '14px', fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(22,163,74,.35)',
                  }}
                >استمر ▶</motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onBank}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    color: '#fff', fontSize: '14px', fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(217,119,6,.35)',
                  }}
                >احفظ 💰 ({currentPlayer.roundScore})</motion.button>
              </div>
            )}

            {(card.type === 'double' || card.type === 'triple') && turnState === 'waiting_for_decision' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onContinue}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#fff', fontSize: '14px', fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(22,163,74,.35)',
                  }}
                >استمر ▶</motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onBank}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    color: '#fff', fontSize: '14px', fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(217,119,6,.35)',
                  }}
                >احفظ 💰 ({currentPlayer.roundScore})</motion.button>
              </div>
            )}

            {turnState === 'showing_result' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onAdvance}
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #4a8d7a, #3a7d6a)',
                  color: '#feef91', fontSize: '4px', fontWeight: 800,
                }}
              >متابعة ▶</motion.button>
            )}
          </>
        )}
      </motion.div>
      <span style={{ position: 'absolute', bottom: '4px', right: '12px', fontSize: '9px', color: '#64748b' }}>
        مجموعة #{deckNumber}
      </span>
    </motion.div>
  );
}

// ============================================================
// Bomb Explosion Animation
// ============================================================
function BombExplosion({ onComplete }: { onComplete: () => void }) {
  const [particles] = useState(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      angle: (i / 20) * 360,
      distance: 50 + Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: ['#ef4444', '#f97316', '#eab308', '#dc2626'][Math.floor(Math.random() * 4)],
    }))
  );

  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 2], opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.8 }}
        style={{ position: 'absolute', width: 256, height: 256, borderRadius: '50%', background: 'rgba(239,68,68,.3)', filter: 'blur(40px)' }}
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0.5] }}
        transition={{ duration: 0.6, type: 'spring' }}
        style={{ position: 'relative', zIndex: 10, fontSize: 96 }}
      >💥</motion.div>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0, scale: 0,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: '50%', backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Main GameBoard
// ============================================================
export default function GameBoard() {
  const router = useRouter();
  const {
    players,
    currentPlayerIndex,
    cards,
    turnState,
    lastDrawnCard,
    drawnThisTurn,
    matchReason,
    deckNumber,
    config,
    gameMode,
    roomCode,
    drawCard,
    continueTurn,
    bankPoints,
    advanceTurn,
    resetGame,
  } = useRisk2Store();

  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [prevDeckNumber, setPrevDeckNumber] = useState(deckNumber);
  const [showNewDeck, setShowNewDeck] = useState(false);

  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();
  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;
  const { viewerCount, viewers } = useViewerCount('risk2', isDiwaniyaHost, roomCode);
  const { shareLink, shareCopied, copyShareLink, shareExternally } = useShareLinks('risk2', isDiwaniyaHost, roomCode);

  const cols = getGridCols(cards.length || 50);
  const currentPlayer = players[currentPlayerIndex];

  // Detect deck regeneration
  useEffect(() => {
    if (deckNumber > prevDeckNumber) {
      setShowNewDeck(true);
      const timer = setTimeout(() => setShowNewDeck(false), 3000);
      setPrevDeckNumber(deckNumber);
      return () => clearTimeout(timer);
    }
  }, [deckNumber, prevDeckNumber]);

  const showExplosion = turnState === 'bomb_exploded';
  const handleExplosionComplete = () => {
    const state = useRisk2Store.getState();
    if (state.turnState === 'bomb_exploded') {
      advanceTurn();
    }
  };

  // Auto-advance bomb after 2.5 seconds (preserve original behavior)
  useEffect(() => {
    if (turnState === 'bomb_exploded') {
      const timer = setTimeout(() => {
        advanceTurn();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [turnState, advanceTurn]);

  const shouldShowModal = (turnState === 'waiting_for_decision' || turnState === 'showing_result' || turnState === 'turn_lost') && !showExplosion && !!lastDrawnCard;

  const handleDrawCard = (cardId: string) => drawCard(cardId);
  const handleContinue = () => continueTurn();
  const handleBank = () => bankPoints();
  const handleAdvance = () => advanceTurn();

  const handleQuitGame = () => {
    resetGame();
    router.push('/risk2');
  };

  if (!currentPlayer) return null;

  // Sorted players for compact scoreboard (top 4 by score)
  const sortedTop = [...players].sort((a, b) => b.score - a.score).slice(0, 4);

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
      {/* ══════════ Header ══════════ */}
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
            src="/yalla-games/risk2.png"
            alt="المجازفة 2"
            style={{ width: '76px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.55))' }}
          />
          <div style={{
            position: 'absolute', inset: '-12px',
            background: 'radial-gradient(circle, rgba(254,239,145,.22), transparent 65%)',
            filter: 'blur(6px)', zIndex: -1, borderRadius: '50%',
          }} />
        </div>
        <h1 style={{ ...STROKE_STYLE, fontSize: '22px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: '2px 0 0', lineHeight: 1 }}>
          المجازفة 2
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Risk 2 — Color & multiplier cards 🎰
        </p>
      </motion.div>

      {/* ══════════ Stats Bar ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <StatsBar cards={cards} />
      </div>

      {/* ══════════ Current Multiplier Badge ══════════ */}
      {currentPlayer.multiplier > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 12px', borderRadius: '999px',
            background: 'rgba(245,158,11,.15)',
            border: '1px solid rgba(245,158,11,.3)',
            color: '#fbbf24', fontSize: '12px', fontWeight: 800,
          }}
        >
          {currentPlayer.multiplier >= 3 ? '🔥' : '✨'} المضاعف: ×{currentPlayer.multiplier}
        </motion.div>
      )}

      {/* ══════════ New Deck Notification ══════════ */}
      <AnimatePresence>
        {showNewDeck && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 14px', borderRadius: '999px',
              background: 'rgba(245,158,11,.12)',
              border: '1px solid rgba(245,158,11,.3)',
              color: '#fbbf24', fontSize: '11px', fontWeight: 800,
            }}
          >
            ✨ مجموعة جديدة #{deckNumber} ✨
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ Drawn this turn ══════════ */}
      {drawnThisTurn.length > 0 && (
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
          {drawnThisTurn.map((card) => {
            const colorHex = card.color ? CARD_COLOR_HEX[card.color] : '#9ca3af';
            const isGold = card.type === 'double' || card.type === 'triple';
            return (
              <motion.div
                key={card.id}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                style={{
                  width: '28px', height: '32px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${colorHex}55`,
                  background: card.type === 'number'
                    ? `${colorHex}20`
                    : card.type === 'bomb' ? 'rgba(239,68,68,.15)'
                    : card.type === 'skip' ? 'rgba(148,163,184,.15)'
                    : 'rgba(245,158,11,.15)',
                  fontSize: '14px', fontWeight: 900,
                  boxShadow: isGold ? '0 0 8px rgba(251,191,36,.4)' : 'none',
                }}
              >
                {card.type === 'number'
                  ? <span style={{ color: colorHex }}>{card.number}</span>
                  : <span>{card.type === 'bomb' ? '💣' : card.type === 'skip' ? '⏭️' : card.type === 'double' ? '✨' : '🔥'}</span>
                }
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ══════════ Compact team panels (player scores) ══════════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '8px',
          alignItems: 'stretch',
          marginTop: '2px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {sortedTop.map((player) => (
          <PlayerScorePanel
            key={player.id}
            player={player}
            isCurrent={player.id === currentPlayer.id}
          />
        ))}
      </div>

      {/* ══════════ Notification pill ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', justifyContent: 'center' }}>
        <NotificationPill />
      </div>

      {/* ══════════ Card Grid ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div
          style={{
            display: 'grid',
            gap: '6px',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {cards.map((card) => (
            <GridCard
              key={card.id}
              card={card}
              onClick={
                turnState === 'waiting_for_draw' && !card.revealed
                  ? () => handleDrawCard(card.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* ══════════ Bank button on the game board (always visible when player has round score > 0 and it's their turn) ══════════ */}
      {turnState === 'waiting_for_draw' && currentPlayer.roundScore > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleBank}
          style={{
            width: '100%', maxWidth: '380px',
            padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            color: '#fff', fontSize: '14px', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(217,119,6,.35)',
          }}
        >
          <span style={{ fontSize: '14px' }}>💰</span>
          <span>احفظ النقاط ({currentPlayer.roundScore})</span>
        </motion.button>
      )}

      {/* ══════════ Battle log button ══════════ */}
      <div style={{ marginTop: '4px' }}>
        <BattleLogButton />
      </div>

      {/* ══════════ Diwaniya share box ══════════ */}
      {isDiwaniyaHost && (
        <div className="tobol-share-box">
          <div className="tobol-share-title">🔗 شارك مشاهدة المجازفة 2</div>
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
            الرابط المباشر يفتح اللعبة فوراً للأصدقاء المسجلين.
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
                <button onClick={() => setShowViewersModal(false)} className="tobol-viewers-close" aria-label="إغلاق">×</button>
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

      {/* ══════════ Bomb Explosion ══════════ */}
      <AnimatePresence>
        {showExplosion && <BombExplosion onComplete={handleExplosionComplete} />}
      </AnimatePresence>

      {/* ══════════ Result Modal ══════════ */}
      <AnimatePresence mode="wait">
        {shouldShowModal && currentPlayer && lastDrawnCard && (
          <ResultModal
            key={`modal-${lastDrawnCard.id}-${turnState}`}
            card={lastDrawnCard}
            currentPlayer={currentPlayer}
            matchReason={matchReason}
            turnState={turnState}
            onContinue={handleContinue}
            onBank={handleBank}
            onAdvance={handleAdvance}
            deckNumber={deckNumber}
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
                سيتم إنهاء اللعبة الحالية دون حفظ التقدم.
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
