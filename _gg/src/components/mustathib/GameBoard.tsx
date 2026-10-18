'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMustathibStore, NIGHT_SEQUENCE } from '@/lib/mustathib-store';
import { ROLE_CONFIG, Player, Role, Team } from '@/lib/mustathib-types';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
  playRoleSound,
  playNightSound,
  playDaySound,
  playVoteSound,
  playRevealSound,
  playDeathSound,
  playClickSound,
  playCardFlipSound,
  playNotifySound,
} from '@/lib/sounds';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👏', '🙏', '🔥', '🐺', '🦉', '🐦‍⬛', '🔮', '🌙', '⭐', '💀', '🏆', '🎉', '💯', '❤️', '⚖️', '⚰️', '👁', '🤝'];

// ============================================================
// Helper: compute who's voting, who's already voted, etc.
// ============================================================
function getActiveRolePlayers(players: Player[], role: Role): Player[] {
  return players.filter(p => p.isAlive && p.role === role);
}

// ============================================================
// Notification Pill — Yalla Ludo style notice
// ============================================================
function NotificationPill() {
  const { lastAction, phase, currentRound, players } = useMustathibStore();
  const aliveCount = players.filter(p => p.isAlive).length;
  const evilCount = players.filter(p => p.isAlive && ROLE_CONFIG[p.role].team === 'evil').length;
  const goodCount = aliveCount - evilCount;

  let displayText = '';
  let containerClass = 'tobol-board-notice-v3 team-red';
  if (phase === 'roleReveal') {
    displayText = '🌙 استعراض الأدوار';
  } else if (phase === 'night') {
    displayText = `🌙 الليل ${currentRound}`;
  } else if (phase === 'day') {
    displayText = `☀️ النهار ${currentRound}`;
  } else if (phase === 'vote') {
    displayText = `🗳️ التصويت`;
  } else if (lastAction) {
    displayText = lastAction;
  } else {
    displayText = `اللاعبون الأحياء: ${aliveCount}`;
  }

  return (
    <div
      key={displayText + phase}
      className={containerClass}
      style={{ animation: 'tobolNoticeSlide 0.32s cubic-bezier(.34,1.56,.64,1)' }}
    >
      <span className="tobol-notice-team-chip team-red">
        😇 {goodCount}
      </span>
      <span className="notice-dot" />
      <span className="tobol-notice-text">{displayText}</span>
      <span className="tobol-notice-team-chip team-blue">
        😈 {evilCount}
      </span>
    </div>
  );
}

// ============================================================
// Compact Team Panel — alive count display
// ============================================================
function TeamPanel({ team }: { team: Team }) {
  const { players } = useMustathibStore();
  const alive = players.filter(p => p.isAlive && ROLE_CONFIG[p.role].team === team);
  const dead = players.filter(p => !p.isAlive && ROLE_CONFIG[p.role].team === team);

  return (
    <div className={`tobol-team-panel-compact team-${team === 'good' ? 'red' : 'blue'}`}>
      <div className="tobol-team-name-display">
        {team === 'good' ? '😇 الخير' : '😈 الشر'}
      </div>
      <div className="tobol-team-divider-compact" />
      <div className="tobol-team-score-compact">{alive.length}</div>
      <span style={{ fontSize: '9px', color: '#9fc4b4' }}>
        💀 {dead.length}
      </span>
    </div>
  );
}

// ============================================================
// Battle Log Button + Modal — for diwaniya spectators
// ============================================================
function BattleLogButton() {
  const { gameLog } = useMustathibStore();
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
        <span>السجل</span>
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
                    لا أحداث بعد...
                  </p>
                ) : (
                  gameLog.map((entry, i) => (
                    <div
                      key={i}
                      className={`tobol-log-entry ${
                        entry.type === 'danger' ? 'team-red' :
                        entry.type === 'success' ? 'team-blue' :
                        'team-red'
                      }`}
                      style={{
                        background:
                          entry.type === 'danger' ? 'rgba(248,113,113,.08)' :
                          entry.type === 'success' ? 'rgba(110,231,183,.08)' :
                          entry.type === 'system' ? 'rgba(254,239,145,.08)' :
                          'rgba(159,196,180,.05)',
                      }}
                    >
                      <span className="entry-num">{entry.round}.</span>
                      <span className="entry-msg">{entry.message}</span>
                      <span className="entry-delta neutral">—</span>
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
// Phase: roleReveal — pass-the-device style reveal
// ============================================================
function RoleRevealPhase() {
  const { players, roleRevealIndex, advanceRoleReveal } = useMustathibStore();
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const currentPlayer = players[roleRevealIndex];

  useEffect(() => {
    setFlipped(false);
    setRevealed(false);
  }, [roleRevealIndex]);

  if (!currentPlayer) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: '#9fc4b4', fontSize: '14px' }}>اكتمل استعراض الأدوار</p>
      </div>
    );
  }

  const cfg = ROLE_CONFIG[currentPlayer.role];

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        padding: '16px', textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ color: '#9fc4b4', fontSize: '13px', fontWeight: 700 }}
      >
        📱 مرّر الجهاز إلى اللاعب:
      </motion.div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{
          fontSize: '32px', fontWeight: 900, color: '#feef91',
          ...STROKE_STYLE,
        }}
      >
        {currentPlayer.name}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ color: '#9fc4b4', fontSize: '11px' }}
      >
        الدور رقم {roleRevealIndex + 1} من {players.length}
      </motion.p>

      {/* Card with flip animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => {
          playCardFlipSound();
          setFlipped(f => !f);
        }}
        style={{
          width: '220px', height: '300px', position: 'relative', cursor: 'pointer',
          perspective: '1000px',
        }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
          }}
        >
          {/* Back of card */}
          <div
            style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #1a3a30, #0a1f18)',
              border: '2px solid rgba(254,239,145,.4)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px',
            }}
          >
            <span style={{ fontSize: '60px' }}>❓</span>
            <span style={{ color: '#feef91', fontSize: '14px', fontWeight: 800 }}>اضغط للكشف</span>
          </div>
          {/* Front of card */}
          <div
            style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: cfg.team === 'evil'
                ? 'linear-gradient(135deg, #3a1212, #1a0606)'
                : 'linear-gradient(135deg, #1a3a30, #0a2a1f)',
              border: `2px solid ${cfg.team === 'evil' ? 'rgba(248,113,113,.5)' : 'rgba(254,239,145,.5)'}`,
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px', padding: '16px',
            }}
          >
            <span style={{ fontSize: '70px' }}>{cfg.emoji}</span>
            <span style={{
              color: cfg.team === 'evil' ? '#f87171' : '#feef91',
              fontSize: '22px', fontWeight: 900,
            }}>{cfg.label}</span>
            <span style={{
              color: cfg.team === 'evil' ? '#fca5a5' : '#9fc4b4',
              fontSize: '11px', textAlign: 'center', lineHeight: 1.4,
            }}>{cfg.description}</span>
            <span style={{
              fontSize: '10px', fontWeight: 800, color: cfg.team === 'evil' ? '#ef4444' : '#22c55e',
              padding: '2px 8px', borderRadius: '999px',
              background: cfg.team === 'evil' ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)',
              border: `1px solid ${cfg.team === 'evil' ? 'rgba(239,68,68,.4)' : 'rgba(34,197,94,.4)'}`,
            }}>
              {cfg.team === 'evil' ? '😈 فريق الشر' : '😇 فريق الخير'}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Action button */}
      {flipped && !revealed && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            playClickSound();
            playRevealSound();
            setRevealed(true);
          }}
          style={{
            padding: '10px 20px', borderRadius: '10px',
            border: '1px solid rgba(254,239,145,.3)',
            background: 'rgba(254,239,145,.15)', color: '#feef91',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          ✓ رأيت دوري
        </motion.button>
      )}

      {revealed && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => {
            playClickSound();
            playNotifySound();
            advanceRoleReveal();
          }}
          className="tobol-start-btn"
          style={{
            padding: '12px 24px', border: 'none', color: '#feef91',
            fontSize: '15px', fontWeight: 900, cursor: 'pointer',
            paintOrder: 'stroke fill',
            WebkitTextStroke: '0.5px #aa6e1f',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <span>التالي ←</span>
        </motion.button>
      )}
    </div>
  );
}

// ============================================================
// Phase: night — sequential prompts for each role
// ============================================================
function NightPhase() {
  const {
    players, nightStep, currentRound,
    submitNightAction, advanceNightStep,
  } = useMustathibStore();

  const role = NIGHT_SEQUENCE[nightStep];
  const activePlayers = role ? getActiveRolePlayers(players, role) : [];

  // Reveal result modal for 'see' actions (owl + fortune teller)
  // Stores: { targetId, title, info, color, emoji }
  const [reveal, setReveal] = useState<null | {
    targetId: string;
    title: string;
    info: string;
    color: string;
    bg: string;
    emoji: string;
  }>(null);

  // Play role sound whenever nightStep changes
  useEffect(() => {
    if (role) {
      // Small delay so the wake-up sound plays after the previous modal closes
      const t = setTimeout(() => playRoleSound(role), 250);
      return () => clearTimeout(t);
    }
  }, [role, nightStep]);

  // If no one has this role (e.g., no doctor with 6 players), auto-advance
  useEffect(() => {
    if (role && activePlayers.length === 0 && !reveal) {
      const t = setTimeout(() => advanceNightStep(), 800);
      return () => clearTimeout(t);
    }
  }, [role, activePlayers.length, advanceNightStep, reveal]);

  // Clear reveal modal when nightStep changes
  useEffect(() => {
    setReveal(null);
  }, [nightStep]);

  if (!role) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: '48px', marginBottom: '12px' }}
        >🌙</motion.div>
        <p style={{ color: '#feef91', fontSize: '14px', fontWeight: 700 }}>يُحل الليل...</p>
      </div>
    );
  }

  const cfg = ROLE_CONFIG[role];
  const actors = activePlayers;
  const targets = players.filter(p => p.isAlive); // can target any alive (incl. self if allowed)
  const isSeeAction = role === 'owl' || role === 'fortuneTeller';

  const handleSelectTarget = (targetId: string) => {
    if (actors.length === 0) return;
    const actor = actors[0];
    submitNightAction(actor.id, targetId);

    if (isSeeAction) {
      const target = players.find(p => p.id === targetId);
      if (!target) {
        setTimeout(() => advanceNightStep(), 300);
        return;
      }
      const targetCfg = ROLE_CONFIG[target.role];
      if (role === 'owl') {
        // Owl sees the player's exact role
        setReveal({
          targetId,
          title: 'رأت البومة',
          info: `${target.name} — دوره: ${targetCfg.emoji} ${targetCfg.label}`,
          color: targetCfg.team === 'evil' ? '#f87171' : '#86efac',
          bg: targetCfg.team === 'evil' ? 'rgba(248,113,113,.12)' : 'rgba(134,239,163,.12)',
          emoji: targetCfg.emoji,
        });
      } else {
        // Fortune teller sees the player's alignment
        const teamLabel = targetCfg.team === 'evil' ? '😈 من فريق الشر' : '😇 من فريق الخير';
        setReveal({
          targetId,
          title: 'رأت العرافة',
          info: `${target.name} — ${teamLabel}`,
          color: targetCfg.team === 'evil' ? '#f87171' : '#86efac',
          bg: targetCfg.team === 'evil' ? 'rgba(248,113,113,.12)' : 'rgba(134,239,163,.12)',
          emoji: targetCfg.team === 'evil' ? '😈' : '😇',
        });
      }
    } else {
      // Kill/protect actions just advance
      setTimeout(() => advanceNightStep(), 600);
    }
  };

  const handleSkip = () => {
    if (actors.length > 0) {
      submitNightAction(actors[0].id, null);
    }
    setTimeout(() => advanceNightStep(), 300);
  };

  const handleAcknowledgeReveal = () => {
    setReveal(null);
    setTimeout(() => advanceNightStep(), 300);
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '12px', padding: '12px', textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          fontSize: '64px',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.5))',
        }}
      >
        {cfg.emoji}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          ...STROKE_STYLE,
          fontSize: '22px', fontWeight: 900,
        }}
      >
        {cfg.label}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ color: '#9fc4b4', fontSize: '13px', fontWeight: 600 }}
      >
        {cfg.nightPrompt}
      </motion.p>

      {/* Show all actors in this role */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
        {actors.map(a => (
          <span
            key={a.id}
            style={{
              padding: '4px 10px', borderRadius: '999px',
              background: cfg.team === 'evil' ? 'rgba(248,113,113,.15)' : 'rgba(254,239,145,.15)',
              border: `1px solid ${cfg.team === 'evil' ? 'rgba(248,113,113,.4)' : 'rgba(254,239,145,.4)'}`,
              color: cfg.team === 'evil' ? '#fca5a5' : '#feef91',
              fontSize: '11px', fontWeight: 700,
            }}
          >
            {cfg.emoji} {a.name}
          </span>
        ))}
      </div>

      {/* Target picker — targets are all alive players (excluding the actor if role can't self-target) */}
      <div style={{
        width: '100%', maxWidth: '380px', marginTop: '12px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px',
        maxHeight: '300px', overflowY: 'auto',
      }} className="tobol-scrollbar">
        {targets.map(t => {
          // The first actor of this role can pick for everyone (we treat night actions as group vote)
          const isSelf = actors.length > 0 && actors[0]?.id === t.id;
          const isForbiddenSelf = !cfg.canSelfTarget && isSelf;
          const hasVoted = useMustathibStore.getState().nightActions.some(
            a => a.role === role && a.targetId === t.id
          );

          return (
            <motion.button
              key={t.id}
              whileHover={!isForbiddenSelf ? { scale: 1.04 } : {}}
              whileTap={!isForbiddenSelf ? { scale: 0.96 } : {}}
              onClick={() => {
                if (isForbiddenSelf) return;
                playClickSound();
                playVoteSound();
                handleSelectTarget(t.id);
              }}
              disabled={isForbiddenSelf || !!reveal}
              style={{
                padding: '8px 4px', borderRadius: '8px', cursor: isForbiddenSelf ? 'not-allowed' : 'pointer',
                background: hasVoted
                  ? (cfg.team === 'evil' ? 'rgba(248,113,113,.25)' : 'rgba(254,239,145,.25)')
                  : 'rgba(6,42,32,.55)',
                border: `1px solid ${
                  hasVoted ? (cfg.team === 'evil' ? 'rgba(248,113,113,.6)' : 'rgba(254,239,145,.6)')
                  : isForbiddenSelf ? 'rgba(100,100,100,.2)'
                  : 'rgba(255,255,255,.12)'
                }`,
                color: isForbiddenSelf ? '#6b7280' : '#cbd5e1',
                fontSize: '11px', fontWeight: 700, opacity: isForbiddenSelf ? 0.4 : 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              }}
            >
              <span style={{ fontSize: '16px' }}>🧑</span>
              <span style={{ fontSize: '10px', color: '#9fc4b4' }}>{t.name}</span>
              {hasVoted && <span style={{ fontSize: '10px', color: cfg.team === 'evil' ? '#f87171' : '#feef91' }}>✓</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Skip button (e.g., no kill target) */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => {
          playClickSound();
          handleSkip();
        }}
        disabled={!!reveal}
        style={{
          marginTop: '8px', padding: '8px 14px', borderRadius: '8px', border: 'none',
          background: 'rgba(100,100,100,.25)', color: '#9fc4b4',
          fontSize: '11px', fontWeight: 700, cursor: reveal ? 'not-allowed' : 'pointer',
        }}
      >تخطّي ←</motion.button>

      {/* Reveal modal for owl/fortune teller see actions */}
      <AnimatePresence>
        {reveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 200, padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: `linear-gradient(180deg, #0e2a22, #061812)`,
                border: `1.5px solid ${reveal.color}`,
                borderRadius: '18px', padding: '20px', width: '100%', maxWidth: '300px',
                textAlign: 'center', boxShadow: `0 14px 36px rgba(0,0,0,.6), 0 0 20px ${reveal.color}30`,
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {reveal.emoji}
              </div>
              <div style={{
                ...STROKE_STYLE,
                fontSize: '16px', fontWeight: 900, marginBottom: '8px',
              }}>
                {reveal.title}
              </div>
              <div style={{
                padding: '10px 12px', borderRadius: '12px',
                background: reveal.bg,
                border: `1px solid ${reveal.color}55`,
                color: reveal.color, fontSize: '13px', fontWeight: 800,
                marginBottom: '14px',
              }}>
                {reveal.info}
              </div>
              <p style={{ color: '#9fc4b4', fontSize: '11px', marginBottom: '14px', lineHeight: 1.5 }}>
                🔮 احفظ هذه المعلومة لنفسك — مرّر الجهاز للاعب التالي
              </p>
              <button
                onClick={() => {
                  playClickSound();
                  handleAcknowledgeReveal();
                }}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                  background: `linear-gradient(135deg, ${reveal.color}, ${reveal.color}cc)`,
                  color: '#041F18', fontSize: '14px', fontWeight: 900, cursor: 'pointer',
                  boxShadow: `0 4px 12px ${reveal.color}55`,
                }}
              >
                ✓ رأيت — التالي
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Phase: day — announce death + discuss
// ============================================================
function DayPhase() {
  const { players, lastNightDeathId, currentRound, startVote } = useMustathibStore();
  const dead = lastNightDeathId ? players.find(p => p.id === lastNightDeathId) : null;

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '14px', padding: '20px', textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        style={{ fontSize: '64px' }}
      >
        ☀️
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...STROKE_STYLE, fontSize: '22px', fontWeight: 900 }}
      >
        يحل النهار — الجولة {currentRound}
      </motion.div>

      {dead ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            width: '100%', maxWidth: '320px',
            padding: '14px', borderRadius: '12px',
            background: 'rgba(220,38,38,.1)',
            border: '1px solid rgba(220,38,38,.4)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '6px' }}>💀</div>
          <p style={{ color: '#f87171', fontSize: '14px', fontWeight: 800 }}>
            وُجد {dead.name} ميتاً عند الفجر
          </p>
          <p style={{ color: '#9fc4b4', fontSize: '11px', marginTop: '4px' }}>
            كان دوره: {ROLE_CONFIG[dead.role].emoji} {ROLE_CONFIG[dead.role].label}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            width: '100%', maxWidth: '320px',
            padding: '14px', borderRadius: '12px',
            background: 'rgba(34,197,94,.08)',
            border: '1px solid rgba(34,197,94,.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '6px' }}>🌙</div>
          <p style={{ color: '#86efac', fontSize: '14px', fontWeight: 800 }}>
            ليلة هادئة — لا أحد مات
          </p>
          <p style={{ color: '#9fc4b4', fontSize: '11px', marginTop: '4px' }}>
            ربما نجح الطبيب في الإنقاذ
          </p>
        </motion.div>
      )}

      {/* Alive players list */}
      <div style={{
        width: '100%', maxWidth: '320px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px',
        marginTop: '4px',
      }}>
        {players.map(p => (
          <div
            key={p.id}
            style={{
              padding: '4px 6px', borderRadius: '6px', fontSize: '10px',
              background: p.isAlive ? 'rgba(34,197,94,.08)' : 'rgba(220,38,38,.08)',
              border: `1px solid ${p.isAlive ? 'rgba(34,197,94,.25)' : 'rgba(220,38,38,.25)'}`,
              color: p.isAlive ? '#86efac' : '#f87171',
              fontWeight: 700, textAlign: 'center',
              opacity: p.isAlive ? 1 : 0.5,
              textDecoration: p.isAlive ? 'none' : 'line-through',
            }}
          >
            {p.name}
          </div>
        ))}
      </div>

      {/* Go to vote button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          playClickSound();
          startVote();
        }}
        className="tobol-start-btn"
        style={{
          marginTop: '8px', padding: '14px 28px', border: 'none',
          color: '#feef91', fontSize: '17px', fontWeight: 900, cursor: 'pointer',
          paintOrder: 'stroke fill', WebkitTextStroke: '0.5px #aa6e1f',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        🗳️ ابدأ التصويت
      </motion.button>
    </div>
  );
}

// ============================================================
// Phase: vote — each alive player votes for who to lynch
// ============================================================
function VotePhase() {
  const { players, dayVotes, submitDayVote, resolveDayVote } = useMustathibStore();
  const aliveVoters = players.filter(p => p.isAlive);
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);

  const currentVoter = aliveVoters[currentVoterIdx];
  const hasVoted = currentVoter && dayVotes.some(v => v.voterId === currentVoter.id);

  // If current voter already voted, advance
  useEffect(() => {
    if (currentVoter && hasVoted && currentVoterIdx < aliveVoters.length - 1) {
      const t = setTimeout(() => setCurrentVoterIdx(i => i + 1), 500);
      return () => clearTimeout(t);
    }
  }, [currentVoter, hasVoted, currentVoterIdx, aliveVoters.length]);

  if (aliveVoters.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9fc4b4' }}>لا يوجد لاعبون أحياء</div>;
  }

  // All voted → show tally + resolve
  const allVoted = aliveVoters.every(v => dayVotes.some(dv => dv.voterId === v.id));

  if (allVoted) {
    // Tally
    const counts: Record<string, number> = {};
    dayVotes.forEach(v => {
      counts[v.targetId] = (counts[v.targetId] || 0) + 1;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '16px' }}>
        <motion.div style={{ ...STROKE_STYLE, fontSize: '22px', fontWeight: 900 }}>🗳️ نتيجة التصويت</motion.div>
        <div style={{ width: '100%', maxWidth: '320px' }}>
          {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, count]) => {
            const target = players.find(p => p.id === id);
            if (!target) return null;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 10px', borderRadius: '8px', marginBottom: '4px',
                  background: 'rgba(6,42,32,.5)',
                  border: '1px solid rgba(254,239,145,.2)',
                }}
              >
                <span style={{ flex: 1, color: '#cbd5e1', fontSize: '12px', fontWeight: 700 }}>{target.name}</span>
                <span style={{ color: '#feef91', fontSize: '12px', fontWeight: 800 }}>{count} 🗳️</span>
              </motion.div>
            );
          })}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            playClickSound();
            resolveDayVote();
          }}
          className="tobol-start-btn"
          style={{
            padding: '12px 24px', border: 'none', color: '#feef91',
            fontSize: '15px', fontWeight: 900, cursor: 'pointer',
            paintOrder: 'stroke fill', WebkitTextStroke: '0.5px #aa6e1f',
          }}
        >
          ⚖️ تنفيذ الحكم
        </motion.button>
      </div>
    );
  }

  if (!currentVoter) return null;

  const candidates = players.filter(p => p.isAlive && p.id !== currentVoter.id);

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '12px', padding: '16px', textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ fontSize: '64px' }}
      >🗳️</motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ color: '#9fc4b4', fontSize: '12px', fontWeight: 600 }}
      >
        الناخب {currentVoterIdx + 1} من {aliveVoters.length}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{ ...STROKE_STYLE, fontSize: '24px', fontWeight: 900 }}
      >
        {currentVoter.name}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ color: '#9fc4b4', fontSize: '11px' }}
      >
        مرّر الجهاز إلى {currentVoter.name} — اختر من تشتبه به
      </motion.p>

      {/* Candidates grid */}
      <div style={{
        width: '100%', maxWidth: '320px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px',
      }}>
        {candidates.map(c => {
          const votedFor = dayVotes.some(v => v.voterId === currentVoter.id && v.targetId === c.id);
          return (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                playVoteSound();
                playClickSound();
                submitDayVote(currentVoter.id, c.id);
              }}
              style={{
                padding: '10px 4px', borderRadius: '8px', cursor: 'pointer',
                background: votedFor ? 'rgba(248,113,113,.25)' : 'rgba(6,42,32,.55)',
                border: `1px solid ${votedFor ? 'rgba(248,113,113,.6)' : 'rgba(255,255,255,.12)'}`,
                color: '#cbd5e1', fontSize: '11px', fontWeight: 700,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              }}
            >
              <span style={{ fontSize: '18px' }}>🧑</span>
              <span>{c.name}</span>
            </motion.button>
          );
        })}
      </div>

      {hasVoted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: '#feef91', fontSize: '12px', fontWeight: 700 }}
        >
          ✓ تم — مرّر الجهاز للاعب التالي
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Chat button — for table-side chat (header)
// ============================================================
interface ChatMsg {
  id: number;
  sender: string;
  text: string;
}

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
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleEmojiClick(e)}
                          aria-label={`emoji ${e}`}
                        >{e}</button>
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
// MAIN GAME BOARD
// ============================================================
export default function GameBoard() {
  const router = useRouter();
  const {
    phase, gameMode, roomCode, players, resetGame,
  } = useMustathibStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<Array<{ id: string; name: string; joinedAt: number }>>([]);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [directLink, setDirectLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

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

  // Play phase-based ambient sound when phase changes
  // roleReveal → flip sound, night → night owl, day → day rooster, vote → vote ding
  useEffect(() => {
    if (phase === 'roleReveal') playRevealSound();
    else if (phase === 'night') playNightSound();
    else if (phase === 'day') {
      // If there's a death, play death sound; otherwise play day rooster
      const { lastNightDeathId } = useMustathibStore.getState();
      if (lastNightDeathId) playDeathSound();
      else playDaySound();
    } else if (phase === 'vote') playVoteSound();
  }, [phase]);

  // Diwaniya: fetch viewer count + build share link
  useEffect(() => {
    if (!isDiwaniyaHost || !roomCode) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const pkg = 'com.bengharbios.ggames';
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        const hostUserId = d?.user?.id || '';
        const fromParam = hostUserId ? `&from=${encodeURIComponent(hostUserId)}` : '';
        setShareLink(`${baseUrl}/r/mustathib/${roomCode}?pkg=${pkg}${fromParam}`);
        setDirectLink(`${baseUrl}/r/mustathib/${roomCode}?pkg=${pkg}${fromParam}&direct=1`);
      })
      .catch(() => {
        setShareLink(`${baseUrl}/r/mustathib/${roomCode}?pkg=${pkg}`);
        setDirectLink(`${baseUrl}/r/mustathib/${roomCode}?pkg=${pkg}&direct=1`);
      });

    const fetchViewers = () => {
      fetch(`/api/mustathib-room/${roomCode}`)
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

  const copyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
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

  const shareExternally = async () => {
    if (!directLink) return;
    const shareData = {
      title: 'شاهد لعبة المستئذب',
      text: 'انضم لمشاهدة المستئذب على G-G:',
      url: directLink,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(directLink).then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        });
      }
    } catch { /* user cancelled */ }
  };

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

  const handleQuitGame = () => {
      // [UNIFIED EXIT] Preserve state for resume. End diwaniya room + go home.
      const st = useMustathibStore.getState();
      if (st.gameMode === 'diwaniya' && st.roomCode) {
        try { fetch(`/api/mustathib-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
      }
      try { if (typeof window !== 'undefined') { localStorage.removeItem('mustathib-game-storage'); localStorage.removeItem('mustathib-game-storage__disconnect_ts'); } } catch { /* ignore */ }
try { useMustathibStore.getState().resetGame(); } catch { /* ignore */ }
setShowQuitDialog
      router.push('/#games');
    };

  const aliveCount = players.filter(p => p.isAlive).length;

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
            src="/yalla-games/mustathib.png"
            alt="المستئذب"
            style={{
              width: '60px',
              height: '50px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.55))',
            }}
          />
          <div style={{
            position: 'absolute', inset: '-12px',
            background: 'radial-gradient(circle, rgba(254,239,145,.22), transparent 65%)',
            filter: 'blur(6px)', zIndex: -1, borderRadius: '50%',
          }} />
        </div>
        <h1 style={{
          ...STROKE_STYLE, fontSize: '18px', fontWeight: 900,
          textShadow: '0 2px 4px rgba(0,0,0,.85)',
          margin: '2px 0 0', lineHeight: 1,
        }}>المستئذب</h1>
      </motion.div>

      {/* ══════════ Compact team panels + VS ══════════ */}
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: '380px',
          display: 'flex', gap: '8px', alignItems: 'stretch', marginTop: '4px',
        }}
      >
        <TeamPanel team="good" />
        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <TeamPanel team="evil" />
      </div>

      {/* ══════════ Notification pill ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', justifyContent: 'center' }}>
        <NotificationPill />
      </div>

      {/* ══════════ Phase content ══════════ */}
      <div style={{
        flex: 1, width: '100%', maxWidth: '420px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflowY: 'auto', overflowX: 'hidden',
      }} className="tobol-scrollbar">
        {phase === 'roleReveal' && <RoleRevealPhase />}
        {phase === 'night' && <NightPhase />}
        {phase === 'day' && <DayPhase />}
        {phase === 'vote' && <VotePhase />}
      </div>

      {/* ══════════ Bottom action bar — Battle Log + (Share Box for diwaniya) ══════════ */}
      <div style={{
        width: '100%', maxWidth: '420px',
        display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center',
        marginTop: '4px',
      }}>
        <BattleLogButton />
        {isDiwaniyaHost && (
          <button
            onClick={copyShareLink}
            className="tobol-share-btn"
            aria-label="نسخ رابط المشاركة"
            title="نسخ رابط المشاركة"
          >
            <img src="/battle/iv_team_share.webp" alt="share" />
            <span>{shareCopied ? 'تم!' : 'مشاركة'}</span>
          </button>
        )}
        {isDiwaniyaHost && (
          <button
            onClick={shareExternally}
            className="tobol-share-direct-btn"
            aria-label="مشاركة خارجية"
            title="مشاركة عبر واتساب/تيليجرام"
          >
            <img src="/battle/icon_share.webp" alt="external" />
          </button>
        )}
      </div>

      {/* ══════════ Viewers modal (diwaniya) ══════════ */}
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
              onClick={(e) => e.stopPropagation()}
              className="tobol-viewers-modal"
            >
              <div className="tobol-viewers-header">
                <span className="tobol-viewers-title">
                  <img src="/battle/icon_eye.webp" alt="" />
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
                  <div className="tobol-viewers-empty">
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>👥</div>
                    <p>لا يوجد مشاهدون حالياً</p>
                    <p style={{ fontSize: '11px', marginTop: '4px' }}>شارك كود الغرفة ليصلك المشاهدون</p>
                  </div>
                ) : (
                  viewers.map((spec, idx) => (
                    <div key={spec.id} className="tobol-viewer-row">
                      <div className="tobol-viewer-avatar">{spec.name.charAt(0)}</div>
                      <div className="tobol-viewer-info">
                        <span className="tobol-viewer-name">{spec.name}</span>
                        <span className="tobol-viewer-meta">
                          انضم منذ {Math.floor((Date.now() - spec.joinedAt) / 60000)} دقيقة
                        </span>
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
                  : `الأحياء: ${aliveCount} — سيتم إعادة تعيين اللعبة.`}
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
