'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabotStore } from '@/lib/tabot-store';
import {
  getTeamInfo,
  getActiveMembers,
  TEAM_CONFIG,
  ROLE_CONFIG,
  TabotTeam,
  Player,
} from '@/lib/tabot-types';
import DoorCard from './DoorCard';
import PenaltyDialog from './PenaltyDialog';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
  playNotifySound,
} from '@/lib/sounds';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

// ============================================================
// Player Row — Display-only
// ============================================================
function PlayerRow({ player }: { player: Player }) {
  return (
    <motion.div
      layout
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 8px', borderRadius: '8px',
        background: player.status === 'active' ? 'rgba(255,255,255,.04)' : 'transparent',
        opacity: player.status === 'active' ? 1 : player.status === 'imprisoned' ? 0.6 : 0.3,
        transition: 'opacity .3s',
      }}
    >
      <span style={{ fontSize: '15px' }}>{player.avatar}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, color: '#cbd5e1',
            textDecoration: player.status === 'killed' ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {player.name}
          </span>
          {player.role === 'leader' && (
            <span style={{ fontSize: '9px' }}>👑</span>
          )}
          {player.role === 'deputy' && (
            <span style={{ fontSize: '9px' }}>⭐</span>
          )}
        </div>
      </div>
      {player.status === 'imprisoned' && (
        <span style={{ fontSize: '10px' }}>⛓️</span>
      )}
      {player.status === 'killed' && (
        <span style={{ fontSize: '10px' }}>💀</span>
      )}
    </motion.div>
  );
}

// ============================================================
// Compact Team Panel — Shows only the current team (compact, no scroll)
// ============================================================
function CurrentTeamPanel({
  teamId,
  teamName,
}: {
  teamId: TabotTeam;
  teamName: string;
}) {
  const { players } = useTabotStore();
  const teamInfo = getTeamInfo(players, teamId, teamName);
  const config = TEAM_CONFIG[teamId];
  const accent = teamId === 'alpha' ? '#ef4444' : '#3b82f6';
  const accentLight = teamId === 'alpha' ? '#fca5a5' : '#93c5fd';

  return (
    <motion.div
      key={teamId}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${accent}40`,
        background: `linear-gradient(180deg, ${accent}1a, rgba(8,28,22,.7))`,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '6px 10px',
        background: `linear-gradient(90deg, ${accent}33, transparent)`,
        borderBottom: `1px solid ${accent}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px' }}>{config.icon}</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: accentLight, textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
            {teamInfo.name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '9px' }}>
          <span style={{ color: '#34d399' }}>نشط {teamInfo.activeCount}</span>
          <span style={{ color: '#fbbf24' }}>حبس {teamInfo.imprisonedCount}</span>
          <span style={{ color: '#f87171' }}>قتل {teamInfo.killedCount}</span>
        </div>
      </div>
      {/* Players — display only */}
      <div style={{ padding: '4px', maxHeight: '100px', overflowY: 'auto' }} className="tobol-scrollbar">
        {teamInfo.players.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Leader Picker Dialog
// ============================================================
function LeaderPickerDialog() {
  const { players, currentTeam, teamAlphaName, teamBetaName, selectPicker } = useTabotStore();
  const teamName = currentTeam === 'alpha' ? teamAlphaName : teamBetaName;
  const config = TEAM_CONFIG[currentTeam];
  const teamMembers = players.filter(
    p => p.team === currentTeam && p.status === 'active' && p.role !== 'guest'
  );
  const leader = players.find(p => p.team === currentTeam && p.role === 'leader');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        style={{
          background: 'linear-gradient(180deg, #0e2a22, #061812)',
          border: '1.5px solid rgba(254,239,145,.25)',
          borderRadius: '18px',
          padding: '16px',
          width: '100%', maxWidth: '300px',
          boxShadow: '0 14px 36px rgba(0,0,0,.55)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: '32px', marginBottom: '4px' }}
          >👑</motion.div>
          <h3 style={{ ...STROKE_STYLE, fontSize: '15px', fontWeight: 900 }}>القائد يختار</h3>
          <p style={{ fontSize: '11px', color: '#9fc4b4', marginTop: '2px' }}>
            {config.icon} {teamName} — اختر من يفتح الباب
          </p>
          {leader && (
            <p style={{ fontSize: '10px', color: '#fbbf24', marginTop: '2px' }}>
              القائد: {leader.name}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }} className="tobol-scrollbar">
          {teamMembers.map((player, i) => (
            <motion.button
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => selectPicker(player.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px', borderRadius: '10px', cursor: 'pointer',
                background: 'rgba(0,0,0,.35)', border: '1px solid rgba(254,239,145,.2)',
              }}
            >
              <span style={{ fontSize: '18px' }}>{player.avatar}</span>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>
                  {player.name}
                </span>
                <span style={{ fontSize: '9px', color: '#9fc4b4', display: 'block' }}>
                  {ROLE_CONFIG[player.role].emoji} {ROLE_CONFIG[player.role].label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Game Log — collapsible
// ============================================================
function GameLog() {
  const { roundLog } = useTabotStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current && isExpanded) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [roundLog, isExpanded]);

  return (
    <div style={{
      borderTop: '1px solid rgba(168,85,247,.25)',
      background: 'rgba(0,0,0,.3)',
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#9fc4b4' }}>
          📋 سجل الأحداث ({roundLog.length})
        </span>
        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} style={{ fontSize: '10px', color: '#9fc4b4' }}>
          ▼
        </motion.span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 140 }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              ref={logRef}
              className="tobol-scrollbar"
              style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', maxHeight: '130px' }}
            >
              {roundLog.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '10px', padding: '3px 6px', borderRadius: '6px',
                    color: entry.type === 'danger' ? '#fca5a5' :
                      entry.type === 'success' ? '#86efac' :
                      entry.type === 'system' ? '#fbbf24' :
                      entry.type === 'action' ? '#c4b5fd' :
                      '#9fc4b4',
                    background: entry.type === 'danger' ? 'rgba(239,68,68,.15)' :
                      entry.type === 'success' ? 'rgba(34,197,94,.15)' :
                      entry.type === 'system' ? 'rgba(251,191,36,.15)' :
                      entry.type === 'action' ? 'rgba(168,85,247,.15)' :
                      'transparent',
                    fontWeight: entry.type === 'system' ? 700 : 400,
                  }}
                >
                  <span style={{ color: '#64748b', marginLeft: '4px' }}>R{entry.round}</span>
                  {entry.message}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// MAIN GAME BOARD (Yalla Ludo style — no vertical scroll)
// ============================================================
export default function GameBoard() {
  const {
    doors,
    currentTeam,
    teamAlphaName,
    teamBetaName,
    players,
    interactionState,
    revealDoor,
    advanceTurn,
    currentPlayerIndex,
    currentRound,
    gameMode,
    roomCode,
  } = useTabotStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [spectators, setSpectators] = useState<Array<{ id: string; name: string; joinedAt: number }>>([]);
  const [shareLink, setShareLink] = useState('');
  const [directLink, setDirectLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;

  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  // Play a soft notify bell whenever the active team swaps.
  const prevTeamRef = useRef<TabotTeam | undefined>(undefined);
  useEffect(() => {
    if (prevTeamRef.current !== undefined && prevTeamRef.current !== currentTeam) {
      playNotifySound();
    }
    prevTeamRef.current = currentTeam;
  }, [currentTeam]);

  // Play a soft notify bell when the round number increments.
  const prevRoundRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (prevRoundRef.current !== undefined && prevRoundRef.current !== currentRound) {
      playNotifySound();
    }
    prevRoundRef.current = currentRound;
  }, [currentRound]);

  const toggleMusic = () => { const next = !musicOn; setMusicOn(next); setMusicEnabled(next); };
  const toggleSound = () => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); };

  // Poll viewers in diwaniya mode + build share links for the host
  useEffect(() => {
    if (!isDiwaniyaHost || !roomCode) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const pkg = 'com.bengharbios.ggames';
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        const hostUserId = d?.user?.id || '';
        const fromParam = hostUserId ? `&from=${encodeURIComponent(hostUserId)}` : '';
        setShareLink(`${baseUrl}/r/tabot/${roomCode}?pkg=${pkg}${fromParam}`);
        setDirectLink(`${baseUrl}/r/tabot/${roomCode}?pkg=${pkg}${fromParam}&direct=1`);
      })
      .catch(() => {
        setShareLink(`${baseUrl}/r/tabot/${roomCode}?pkg=${pkg}`);
        setDirectLink(`${baseUrl}/r/tabot/${roomCode}?pkg=${pkg}&direct=1`);
      });
    const fetchViewers = () => {
      fetch(`/api/tabot-room/${roomCode}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.room?.spectators) {
            setSpectators(d.room.spectators);
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

  // Native Web Share API for external app sharing
  const shareExternally = async () => {
    if (!directLink) return;
    const shareData = {
      title: 'شاهد معركة الهروب من التابوت',
      text: 'انضم لمشاهدة المعركة على G-G:',
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
    } catch {
      // User cancelled — silent
    }
  };

  const isWaitingForPlayer = interactionState === 'waiting_for_player';
  const isWaitingForLeader = interactionState === 'waiting_for_leader';
  const isShowingResult = interactionState === 'showing_result';
  const isInteracting = [
    'picking_enemy_imprison',
    'picking_enemy_kill',
    'picking_teammate_free',
    'voting_teammate_imprison',
  ].includes(interactionState);

  const currentTeamName = currentTeam === 'alpha' ? teamAlphaName : teamBetaName;
  const teamConfig = TEAM_CONFIG[currentTeam];
  const openedDoors = doors.filter(d => d.isRevealed).length;
  const accent = currentTeam === 'alpha' ? '#ef4444' : '#3b82f6';

  return (
    <div
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        position: 'relative',
        paddingBottom: '100px',
      }}
    >
      {/* ══════════ 1) Yalla Ludo Header — sound + chat + quit ══════════ */}
      <div className="tobol-header-actions" style={{ justifyContent: 'space-between' }}>
        <button
          type="button"
          className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
          onClick={toggleMusic}
          aria-label="sound"
        >
          <img src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sound" />
        </button>

        {gameMode === 'diwaniya' && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowViewers(true)}
            className="tobol-header-btn"
            aria-label="viewers"
          >
            <span style={{ fontSize: '14px' }}>👁</span>
            <span style={{ fontSize: '10px', color: '#9fc4b4', fontWeight: 700 }}>{viewerCount}</span>
          </motion.button>
        )}

        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowChat(true)}
          aria-label="chat"
        >
          <img src="/battle/icon_chat.webp" alt="chat" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontSize: '12px' }}>💬</span>
        </button>

        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowExitDialog(true)}
          aria-label="exit"
        >
          <img src="/battle/btn_exit.webp" alt="exit" />
        </button>
      </div>

      {/* ══════════ 2) Notification pill — current turn ══════════ */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 12px', marginTop: '4px' }}>
        <div className={`tobol-notice-pill ${currentTeam === 'alpha' ? 'team-red' : 'team-blue'}`}>
          <span className="notice-dot" />
          <span style={{ fontSize: '12px' }}>{teamConfig.icon}</span>
          <span style={{ fontSize: '11px' }}>
            {isWaitingForLeader && '👑 القائد يختار'}
            {isWaitingForPlayer && `${players[currentPlayerIndex]?.name} — اختر باباً`}
            {isShowingResult && 'انتظر النتيجة...'}
            {isInteracting && 'اختر الهدف...'}
          </span>
          <span style={{ fontSize: '9px', color: '#9fc4b4', borderRight: '1px solid rgba(255,255,255,.1)', paddingRight: '6px', marginRight: '2px' }}>
            جولة {currentRound}
          </span>
        </div>
      </div>

      {/* ══════════ 3) Compact team panel (current team only) ══════════ */}
      <div style={{ padding: '6px 12px' }}>
        <CurrentTeamPanel teamId={currentTeam} teamName={currentTeamName} />
      </div>

      {/* ══════════ 4) Door grid (16 doors, no scroll) ══════════ */}
      <div style={{ padding: '0 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9fc4b4' }}>🚪 الأبواب</span>
          <span style={{ fontSize: '10px', color: '#9fc4b4', background: 'rgba(254,239,145,.1)', padding: '1px 6px', borderRadius: '8px', border: '1px solid rgba(254,239,145,.2)' }}>
            {openedDoors}/16
          </span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px',
          flex: 1, minHeight: 0,
        }}>
          {doors.map((door, i) => (
            <DoorCard
              key={door.id}
              door={door}
              index={i}
              isSelectable={isWaitingForPlayer}
              onSelect={revealDoor}
            />
          ))}
        </div>
      </div>

      {/* ══════════ 5) Advance button ══════════ */}
      {interactionState === 'showing_result' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 12px' }}>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.96 }}
            onClick={advanceTurn}
            className="tobol-start-btn"
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 800,
              color: '#feef91',
              paintOrder: 'stroke fill',
              WebkitTextStroke: '0.5px #aa6e1f',
              textShadow: '0 2px 6px rgba(0,0,0,.6)',
            }}
          >
            التالي ←
          </motion.button>
        </div>
      )}

      {/* ══════════ 6) Game Log ══════════ */}
      <GameLog />

      {/* ══════════ 6.5) Diwaniya share box — appears under game log ══════════ */}
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

      {/* ══════════ 7) Dialogs ══════════ */}
      <AnimatePresence>
        {isWaitingForLeader && <LeaderPickerDialog />}
        {isShowingResult && (
          <PenaltyDialog onDismiss={advanceTurn} />
        )}
        {isInteracting && (
          <PenaltyDialog onDismiss={() => {}} />
        )}
      </AnimatePresence>

      {/* ══════════ 8) Viewers Modal (Diwaniya) ══════════ */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowViewers(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #0e2a22, #061812)',
                border: '1.5px solid rgba(254,239,145,.25)',
                borderRadius: '18px', padding: '16px',
                width: '100%', maxWidth: '300px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ ...STROKE_STYLE, fontSize: '14px', fontWeight: 900 }}>
                  👁 المشاهدون
                </h3>
                <button onClick={() => setShowViewers(false)} style={{ background: 'none', border: 'none', color: '#9fc4b4', cursor: 'pointer', fontSize: '14px' }}>✕</button>
              </div>
              {spectators.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                  <p style={{ color: '#9fc4b4', fontSize: '12px' }}>لا يوجد مشاهدون حالياً</p>
                  <p style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>شارك كود الغرفة ليصلك المشاهدون</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }} className="tobol-scrollbar">
                  {spectators.map((spec, idx) => (
                    <div key={spec.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'rgba(0,0,0,.35)', border: '1px solid rgba(254,239,145,.1)',
                      borderRadius: '10px', padding: '6px 10px',
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4a8d7a, #3a7d6a)',
                        color: '#fff', fontSize: '11px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {spec.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {spec.name}
                        </p>
                        <p style={{ fontSize: '9px', color: '#64748b' }}>
                          انضم منذ {Math.floor((Date.now() - spec.joinedAt) / 60000)} دقيقة
                        </p>
                      </div>
                      <span style={{ fontSize: '9px', color: '#64748b', flexShrink: 0 }}>#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <p style={{ fontSize: '9px', color: '#64748b' }}>
                  إجمالي المشاهدين: {spectators.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ 9) Exit Dialog ══════════ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
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
                borderRadius: '18px', padding: '20px',
                width: '100%', maxWidth: '300px', textAlign: 'center',
                boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                الخروج من اللعبة؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                {gameMode === 'diwaniya'
                  ? 'سيتم إنهاء الجلسة وسيخرج جميع المشاهدين.'
                  : 'سيتم إعادة تعيين اللعبة بالكامل. هل تريد المتابعة؟'}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowExitDialog(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)',
                    background: 'rgba(80,80,80,.3)', color: '#cbd5e1',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  }}
                >إلغاء</button>
                <button
                  onClick={() => {
                    useTabotStore.getState().resetGame();
                    setShowExitDialog(false);
                  }}
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

      {/* ══════════ 10) Chat drawer ══════════ */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0 }}
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '280px',
              background: 'rgba(6,42,32,.95)', backdropFilter: 'blur(8px)',
              borderLeft: '1px solid rgba(254,239,145,.15)',
              zIndex: 90, display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(254,239,145,.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 900 }}>💬 الدردشة</h3>
              <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#9fc4b4', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }} className="tobol-scrollbar">
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', marginTop: '20px' }}>
                الدردشة غير متاحة حالياً
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
