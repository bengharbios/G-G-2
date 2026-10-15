'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWizardDuelStore } from '@/lib/wizardduel-store';
import {
  useInGameSetupMode,
  useYallaSoundState,
  useViewerCount,
  useShareLinks,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';
import type { Card, Effect, Player } from '@/lib/wizardduel-types';

const MOVES_PER_TURN = 2;

// Card color by keyword
function cardBorder(card: Card): string {
  if (card.keywords.includes('damage') && card.keywords.includes('sustain')) return '#a855f7';
  if (card.keywords.includes('damage')) return '#ef4444';
  if (card.keywords.includes('sustain')) return '#22c55e';
  return '#3b82f6';
}
function cardGradient(card: Card): string {
  if (card.keywords.includes('damage') && card.keywords.includes('sustain')) return 'linear-gradient(135deg, rgba(168,85,247,.25), rgba(126,34,206,.1))';
  if (card.keywords.includes('damage')) return 'linear-gradient(135deg, rgba(239,68,68,.25), rgba(127,29,29,.1))';
  if (card.keywords.includes('sustain')) return 'linear-gradient(135deg, rgba(34,197,94,.25), rgba(20,83,45,.1))';
  return 'linear-gradient(135deg, rgba(59,130,246,.25), rgba(30,58,138,.1))';
}

// ============================================================
// HP Bar — animated health bar with color and percentage
// ============================================================
function HpBar({ player, isCurrent }: { player: Player; isCurrent: boolean }) {
  const pct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const color = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444';
  return (
    <div
      style={{
        width: '100%',
        height: '18px',
        background: 'rgba(0,0,0,.5)',
        borderRadius: '999px',
        overflow: 'hidden',
        border: `1.5px solid ${color}50`,
        position: 'relative',
        boxShadow: isCurrent ? `0 0 8px ${color}40` : 'none',
      }}
    >
      <motion.div
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: '999px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 800,
          textShadow: '0 1px 2px rgba(0,0,0,.9)',
        }}
      >
        {player.hp} / {player.maxHp}
      </div>
    </div>
  );
}

// ============================================================
// Active Effects display — chips under each player
// ============================================================
function ActiveEffects({ effects }: { effects: Effect[] }) {
  if (effects.length === 0) return null;
  const effectLabels: Record<string, { label: string; color: string; icon: string }> = {
    poison: { label: 'سم', color: '#22c55e', icon: '☠️' },
    freeze: { label: 'مجمد', color: '#3b82f6', icon: '❄️' },
    aura: { label: 'هالة', color: '#a855f7', icon: '🌀' },
    buffAtk: { label: 'تضاعف ضرر', color: '#ef4444', icon: '⚔️' },
    buffDef: { label: 'دفاع', color: '#22c55e', icon: '🛡️' },
    debuffAtk: { label: 'إضعاف هجوم', color: '#f59e0b', icon: '⬇️' },
    debuffDef: { label: 'لعنة دفاع', color: '#f59e0b', icon: '⬇️' },
    preventDmg: { label: 'درع', color: '#3b82f6', icon: '🛡️' },
    resurrect: { label: 'إحياء', color: '#22c55e', icon: '♻️' },
    counterAttack: { label: 'كمين', color: '#a855f7', icon: '🎯' },
    doubleDmg: { label: 'ضرر مضاعف', color: '#ef4444', icon: '⚡' },
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px', justifyContent: 'center' }}>
      {effects.map((e, i) => {
        const meta = effectLabels[e.type] || { label: e.type, color: '#9fc4b4', icon: '✨' };
        return (
          <span
            key={`${e.type}-${i}`}
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: meta.color,
              background: `${meta.color}15`,
              border: `1px solid ${meta.color}40`,
              padding: '1px 5px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            {meta.icon} {meta.label}{e.value ? `: ${e.value}` : ''}
          </span>
        );
      })}
    </div>
  );
}

// ============================================================
// Player Panel — name + HP bar + active effects + hand count
// ============================================================
function PlayerPanel({ player, isCurrent }: { player: Player; isCurrent: boolean }) {
  const accent = player.isWizard ? '#a855f7' : '#ef4444';
  return (
    <div
      className={`tobol-team-panel-compact ${player.isWizard ? 'team-red' : 'team-blue'} ${isCurrent ? 'active-turn' : ''}`}
      style={{
        flex: 1,
        '--card-border-selected': `linear-gradient(180deg, ${accent}cc, ${accent})`,
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
        <span style={{ fontSize: '20px' }}>{player.isWizard ? '🔮' : '💀'}</span>
        <span style={{
          fontSize: '14px', fontWeight: 800, color: accent,
          textShadow: '0 1px 3px rgba(0,0,0,.7)',
        }}>
          {player.name}
        </span>
      </div>
      <div className="tobol-team-divider-compact" />
      <div style={{ marginTop: '4px' }}>
        <HpBar player={player} isCurrent={isCurrent} />
      </div>
      <ActiveEffects effects={player.activeEffects} />
      <div style={{ marginTop: '6px', fontSize: '12px', color: '#9fc4b4', fontWeight: 700 }}>
        🃏 {player.hand.length} بطاقة
      </div>
    </div>
  );
}

// ============================================================
// Hand card — clickable card showing name + text
// ============================================================
function HandCard({
  card,
  index,
  onPlay,
  disabled,
}: {
  card: Card;
  index: number;
  onPlay: (idx: number) => void;
  disabled: boolean;
}) {
  const border = cardBorder(card);
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      whileHover={!disabled ? { scale: 1.04, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      onClick={() => !disabled && onPlay(index)}
      disabled={disabled}
      style={{
        flex: '0 0 130px',
        width: '130px',
        height: '190px',
        background: cardGradient(card),
        border: `2px solid ${disabled ? `${border}40` : border}`,
        borderRadius: '12px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        boxShadow: disabled ? 'none' : `0 0 14px ${border}40, inset 0 1px 0 rgba(255,255,255,.08)`,
        transition: 'all .15s',
      }}
    >
      {card.artPath && (
        <img
          src={card.artPath}
          alt={card.name}
          style={{
            width: '56px', height: '56px', objectFit: 'contain',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.6))',
          }}
        />
      )}
      {!card.artPath && (
        <div style={{ fontSize: '36px', marginTop: '6px' }}>🪄</div>
      )}
      <div style={{
        fontSize: '13px', fontWeight: 800, color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,.9)', textAlign: 'center',
        lineHeight: 1.15,
      }}>
        {card.name}
      </div>
      <div style={{
        fontSize: '10px', color: '#cbd5e1', textAlign: 'center',
        lineHeight: 1.25, overflow: 'hidden', flex: 1,
        textShadow: '0 1px 2px rgba(0,0,0,.7)',
      }}>
        {card.text.slice(0, 80)}{card.text.length > 80 ? '…' : ''}
      </div>
      <div style={{
        fontSize: '9px', fontWeight: 700, color: border,
        background: `${border}15`, padding: '2px 6px', borderRadius: '999px',
        border: `1px solid ${border}40`,
      }}>
        {card.keywords.join(' · ')}
      </div>
    </motion.button>
  );
}

// ============================================================
// Battle Log Modal
// ============================================================
function BattleLogButton() {
  const { battleLog } = useWizardDuelStore();
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
        <span>سجل المبارزة</span>
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
                <span className="tobol-log-modal-title">📜 سجل المبارزة</span>
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
                {battleLog.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px 0' }}>
                    لا توجد حركات بعد...
                  </p>
                ) : (
                  battleLog.map((entry) => (
                    <div key={entry.id} className="tobol-log-entry">
                      <span className="entry-num">{entry.id}.</span>
                      <span className="entry-msg">{entry.message}</span>
                      {entry.valueChange !== undefined && entry.valueChange !== 0 ? (
                        <span className={`entry-delta ${entry.valueChange > 0 ? '' : 'negative'}`}>
                          {entry.valueChange > 0 ? '+' : ''}{entry.valueChange}
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
// Chat button + simple panel (Yalla-style)
// ============================================================
interface ChatMsg {
  id: number;
  text: string;
}
function HeaderChatButton() {
  const { players, currentTurn } = useWizardDuelStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), text }]);
    setInput('');
  };

  return (
    <>
      <button
        type="button"
        className={`tobol-header-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="دردشة"
        title="دردشة"
      >
        <img src="/battle/icon_chat.webp" alt="chat" />
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
                  دردشة المبارزة
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="tobol-chat-panel-close"
                  aria-label="إغلاق"
                >×</button>
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
                      <span className="msg-sender">
                        🔮 {currentTurn === '0' ? players[0].name : 'أنت'}
                      </span>
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

// ============================================================
// Main GameBoard
// ============================================================
export default function GameBoard() {
  useInGameSetupMode();
  const router = useRouter();
  const {
    players,
    currentTurn,
    movesThisTurn,
    turnCount,
    battleLog,
    winner,
    gameMode,
    roomCode,
    lastAction,
    drawCard,
    playCard,
    endTurn,
    resetGame,
  } = useWizardDuelStore();

  const { musicOn, toggleMusic } = useYallaSoundState();
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;
  const { viewerCount, viewers } = useViewerCount('wizardduel', isDiwaniyaHost, roomCode);
  const { shareLink, directLink, shareCopied, copyShareLink, shareExternally } = useShareLinks('wizardduel', isDiwaniyaHost, roomCode);
  const [showViewersModal, setShowViewersModal] = useState(false);

  const isWizardTurn = currentTurn === '0';
  const movesLeft = Math.max(0, MOVES_PER_TURN - movesThisTurn);
  const wizardPlayer = players[0];
  const aiPlayer = players[1];

  // Spectator-style read-only mode (when on /r/wizardduel/...)
  const isSpectator = typeof window !== 'undefined' && !window.location.pathname.startsWith('/wizardduel');

  const handlePlayCard = (idx: number) => {
    if (isSpectator || !isWizardTurn || movesLeft === 0) return;
    playCard('0', idx);
  };

  const handleDraw = () => {
    if (isSpectator || !isWizardTurn || movesLeft === 0) return;
    drawCard('0');
  };

  const handleEndTurn = () => {
    if (isSpectator || !isWizardTurn) return;
    endTurn();
  };

  const handleQuitGame = () => {
    resetGame();
    router.push('/wizardduel');
  };

  const noticeText = !lastAction
    ? (isWizardTurn ? 'دورك — العب بطاقة أو اسحب' : 'دور الخصم...')
    : lastAction;

  return (
    <div
      dir="rtl"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'linear-gradient(180deg, rgba(26,8,51,.85) 0%, rgba(10,4,20,.95) 100%), url(/battle/game_bg.webp) center / cover no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 8px 16px',
        gap: '4px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ Header icons ══════════ */}
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
          aria-label="إنهاء اللعبة"
          title="إنهاء اللعبة"
        >
          <img src="/battle/btn_quit_game.webp" alt="quit" />
        </button>
      </div>

      {/* ══════════ ENEMY at TOP — full width ══════════ */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          background: 'rgba(80,10,10,.4)',
          border: '1.5px solid rgba(239,68,68,.3)',
          borderRadius: '14px',
          marginTop: '4px',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444, #991b1b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', flexShrink: 0,
          border: '2px solid rgba(239,68,68,.5)',
          boxShadow: !isWizardTurn ? '0 0 12px rgba(239,68,68,.4)' : 'none',
        }}>💀</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px', fontWeight: 800, color: '#fca5a5',
            textShadow: '0 1px 2px rgba(0,0,0,.7)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {aiPlayer.name}
            {!isWizardTurn && (
              <span style={{
                fontSize: '9px', color: '#fbbf24', background: 'rgba(251,191,36,.15)',
                border: '1px solid rgba(251,191,36,.4)', padding: '1px 6px', borderRadius: '999px',
              }}>دوره الآن</span>
            )}
          </div>
          <div style={{ marginTop: '3px' }}>
            <HpBar player={aiPlayer} isCurrent={!isWizardTurn} />
          </div>
          <ActiveEffects effects={aiPlayer.activeEffects} />
        </div>
        <div style={{
          fontSize: '11px', color: '#fca5a5', fontWeight: 700,
          background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
          padding: '3px 8px', borderRadius: '999px', flexShrink: 0,
        }}>🃏 {aiPlayer.hand.length}</div>
      </div>

      {/* ══════════ BATTLEFIELD CENTER — notification + last action ══════════ */}
      <div style={{
        width: '100%', maxWidth: '400px',
        display: 'flex', justifyContent: 'center',
        padding: '4px 0',
      }}>
        <div
          className={`tobol-board-notice-v3 ${isWizardTurn ? 'team-red' : 'team-blue'}`}
          style={{ animation: 'tobolNoticeSlide 0.32s cubic-bezier(.34,1.56,.64,1)' }}
        >
          <span className={`tobol-notice-team-chip ${isWizardTurn ? 'team-red' : 'team-blue'}`}>
            {isWizardTurn ? '🔮 دورك' : '💀 الخصم'}
          </span>
          <span className="notice-dot" />
          <span className="tobol-notice-text">
            {noticeText}{isWizardTurn ? ` — ${movesLeft} حركات متبقية` : ''}
          </span>
        </div>
      </div>

      {/* ══════════ Action buttons ══════════ */}
      <div style={{
        width: '100%', maxWidth: '400px',
        display: 'flex', gap: '8px',
      }}>
        <button
          type="button"
          onClick={handleDraw}
          disabled={isSpectator || !isWizardTurn || movesLeft === 0}
          style={{
            flex: 1, padding: '12px', borderRadius: '12px',
            border: `2px solid ${isWizardTurn && movesLeft > 0 ? '#a855f7' : 'rgba(255,255,255,.08)'}`,
            background: isWizardTurn && movesLeft > 0
              ? 'linear-gradient(135deg, rgba(168,85,247,.25), rgba(126,34,206,.1))'
              : 'rgba(0,0,0,.3)',
            color: isWizardTurn && movesLeft > 0 ? '#c4a3e8' : '#6b7280',
            fontSize: '14px', fontWeight: 800,
            cursor: isWizardTurn && movesLeft > 0 && !isSpectator ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🃏</span>
          اسحب بطاقة
        </button>
        <button
          type="button"
          onClick={handleEndTurn}
          disabled={isSpectator || !isWizardTurn || movesLeft === MOVES_PER_TURN}
          style={{
            flex: 1, padding: '12px', borderRadius: '12px',
            border: `2px solid ${isWizardTurn ? '#f59e0b' : 'rgba(255,255,255,.08)'}`,
            background: isWizardTurn
              ? 'linear-gradient(135deg, rgba(245,158,11,.25), rgba(217,119,6,.1))'
              : 'rgba(0,0,0,.3)',
            color: isWizardTurn ? '#fbbf24' : '#6b7280',
            fontSize: '14px', fontWeight: 800,
            cursor: isWizardTurn && !isSpectator ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>⏭️</span>
          إنهاء الدور
        </button>
      </div>

      {/* ══════════ PLAYER at BOTTOM — info + hand ══════════ */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        background: 'rgba(40,10,80,.4)',
        border: '1.5px solid rgba(168,85,247,.3)',
        borderRadius: '14px',
        marginTop: '4px',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', flexShrink: 0,
          border: '2px solid rgba(168,85,247,.5)',
          boxShadow: isWizardTurn ? '0 0 12px rgba(168,85,247,.4)' : 'none',
        }}>🔮</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px', fontWeight: 800, color: '#c4a3e8',
            textShadow: '0 1px 2px rgba(0,0,0,.7)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {wizardPlayer.name}
            {isWizardTurn && (
              <span style={{
                fontSize: '9px', color: '#fbbf24', background: 'rgba(251,191,36,.15)',
                border: '1px solid rgba(251,191,36,.4)', padding: '1px 6px', borderRadius: '999px',
              }}>دورك الآن</span>
            )}
          </div>
          <div style={{ marginTop: '3px' }}>
            <HpBar player={wizardPlayer} isCurrent={isWizardTurn} />
          </div>
          <ActiveEffects effects={wizardPlayer.activeEffects} />
        </div>
        <div style={{
          fontSize: '11px', color: '#c4a3e8', fontWeight: 700,
          background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.3)',
          padding: '3px 8px', borderRadius: '999px', flexShrink: 0,
        }}>🃏 {wizardPlayer.hand.length}</div>
      </div>

      {/* ══════════ HAND — large cards, horizontal, at the very bottom ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '6px',
          background: 'rgba(26,8,51,.6)',
          border: '1.5px solid rgba(168,85,247,.25)',
          borderRadius: '14px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '200px',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '4px', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '13px', color: '#c4a3e8', fontWeight: 800 }}>
            🃏 يدك — {wizardPlayer.hand.length} بطاقة
          </span>
          <BattleLogButton />
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '6px 4px',
          flex: 1,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(168,85,247,.4) transparent',
          WebkitOverflowScrolling: 'touch',
          justifyContent: wizardPlayer.hand.length <= 3 ? 'center' : 'flex-start',
        }}>
          {wizardPlayer.hand.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6b7280', fontSize: '14px',
            }}>
              يدك فارغة — اسحب بطاقة
            </div>
          ) : (
            wizardPlayer.hand.map((card, idx) => (
              <HandCard
                key={`${card.id}-${idx}`}
                card={card}
                index={idx}
                onPlay={handlePlayCard}
                disabled={isSpectator || !isWizardTurn || movesLeft === 0}
              />
            ))
          )}
        </div>
      </motion.div>

      {/* ══════════ Diwaniya share box ══════════ */}
      {isDiwaniyaHost && (
        <div className="tobol-share-box">
          <div className="tobol-share-title">🔗 شارك مشاهدة المبارزة</div>
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
            الرابط المباشر يفتح المبارزة فوراً للأصدقاء المسجلين.
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
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #1a0833, #0a0418)',
                border: '1.5px solid rgba(168,85,247,.25)',
                borderRadius: '18px', padding: '20px',
                width: '100%', maxWidth: '300px',
                textAlign: 'center',
                boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>⏻</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                إنهاء المبارزة بدون حفظ؟
              </h3>
              <p style={{ color: '#c4a3e8', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء المبارزة الحالية دون حفظ التقدم، وستبدأ مبارزة جديدة من الصفر.
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
