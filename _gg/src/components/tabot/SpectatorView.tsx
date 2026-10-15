'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  getTeamInfo,
  TEAM_CONFIG,
  ROLE_CONFIG,
  Player,
} from '@/lib/tabot-types';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

interface SpectatorViewProps {
  /** Optional initial state (used by the join page for instant render before the first poll) */
  stateJson?: string;
  roomCode: string;
  hostName?: string;
}

export default function SpectatorView({ stateJson, roomCode, hostName }: SpectatorViewProps) {
  const [state, setState] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(!stateJson);
  const [error, setError] = useState<string>('');
  const pollFailCount = useRef(0);

  // Hydrate from the optional initial stateJson prop (if provided)
  useEffect(() => {
    if (!stateJson) return;
    try {
      setState(JSON.parse(stateJson));
    } catch {
      /* ignore */
    }
  }, [stateJson]);

  // Self-poll /api/tabot-room/[code] every 2s — same pattern as TobolSpectatorView
  const pollRoom = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/tabot-room/${roomCode}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('الغرفة غير موجودة أو انتهت صلاحيتها');
          setLoading(false);
          return;
        }
        pollFailCount.current += 1;
        if (pollFailCount.current > 5) {
          setError('تعذر تحميل بيانات الغرفة');
          setLoading(false);
        }
        return;
      }
      const data = await res.json();
      if (data?.success && data?.room) {
        // The room stateJson is merged with the row-level fields in the store,
        // so we can use it directly.
        setState(data.room);
        setLoading(false);
        setError('');
        pollFailCount.current = 0;
      }
    } catch {
      pollFailCount.current += 1;
      if (pollFailCount.current > 5) {
        setError('تعذر الاتصال بالخادم');
        setLoading(false);
      }
    }
  }, [roomCode]);

  useEffect(() => {
    pollRoom();
    const iv = setInterval(pollRoom, 2000);
    return () => clearInterval(iv);
  }, [pollRoom]);

  if (loading && !state?.players) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: '48px', marginBottom: '12px' }}
          >⚰️</motion.div>
          <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري تحميل الغرفة...</p>
          {roomCode && (
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>
              كود: <span style={{ fontFamily: 'monospace', color: '#fff' }}>{roomCode}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💔</div>
          <p style={{ color: '#f87171', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{error}</p>
          {roomCode && (
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>
              كود: <span style={{ fontFamily: 'monospace', color: '#fff' }}>{roomCode}</span>
            </p>
          )}
          <a
            href="/tabot"
            className="inline-block text-sm text-amber-400 hover:text-amber-300 underline"
          >
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    );
  }

  const players: Player[] = state?.players || [];
  const teamAlphaName: string = state?.teamAlphaName || TEAM_CONFIG.alpha.defaultName;
  const teamBetaName: string = state?.teamBetaName || TEAM_CONFIG.beta.defaultName;
  const currentTeam: 'alpha' | 'beta' = state?.currentTeam || 'alpha';
  const phase: string = state?.phase || 'playing';
  const currentRound: number = state?.currentRound || 1;
  const winner: 'alpha' | 'beta' | 'draw' | null = state?.winner || null;
  const winReason: string = state?.winReason || '';
  const interactionState: string = state?.interactionState || 'none';

  const alphaInfo = getTeamInfo(players, 'alpha', teamAlphaName);
  const betaInfo = getTeamInfo(players, 'beta', teamBetaName);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '8px 12px 12px',
      }}
    >
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,42,32,.9)', backdropFilter: 'blur(8px)',
        borderRadius: '12px', padding: '8px 12px',
        border: '1px solid rgba(254,239,145,.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⚰️</span>
          <div>
            <p style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 900 }}>
              الهروب من التابوت
            </p>
            <p style={{ fontSize: '9px', color: '#9fc4b4' }}>
              👁 وضع المشاهدة • غرفة {roomCode}
            </p>
          </div>
        </div>
        <div style={{
          padding: '4px 8px', borderRadius: '999px',
          background: 'rgba(254,239,145,.1)',
          border: '1px solid rgba(254,239,145,.25)',
        }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#feef91' }}>
            جولة {currentRound}
          </p>
        </div>
      </div>

      {/* Phase banner */}
      {phase === 'game_over' ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px', borderRadius: '12px', textAlign: 'center',
            background: 'linear-gradient(180deg, rgba(254,239,145,.15), rgba(254,239,145,.05))',
            border: '1.5px solid rgba(254,239,145,.35)',
            marginBottom: '12px',
          }}
        >
          <p style={{ fontSize: '32px', marginBottom: '4px' }}>🏆</p>
          <h2 style={{ ...STROKE_STYLE, fontSize: '18px', fontWeight: 900 }}>
            {winner === 'draw' ? 'تعادل!' : `فاز ${winner === 'alpha' ? teamAlphaName : teamBetaName}`}
          </h2>
          <p style={{ fontSize: '11px', color: '#9fc4b4', marginTop: '4px' }}>{winReason}</p>
        </motion.div>
      ) : (
        <motion.div
          key={`${currentTeam}-${currentRound}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`tobol-notice-pill ${currentTeam === 'alpha' ? 'team-red' : 'team-blue'}`}
          style={{ marginBottom: '8px' }}
        >
          <span className="notice-dot" />
          <span style={{ fontSize: '13px' }}>{TEAM_CONFIG[currentTeam].icon}</span>
          <span style={{ fontSize: '12px' }}>
            دور {currentTeam === 'alpha' ? teamAlphaName : teamBetaName}
            {interactionState === 'waiting_for_leader' ? ' — القائد يختار' : ''}
            {interactionState === 'waiting_for_player' ? ' — اختيار باب' : ''}
            {interactionState === 'showing_result' ? ' — نتيجة' : ''}
            {interactionState.startsWith('picking') || interactionState.startsWith('voting') ? ' — اختيار هدف' : ''}
          </span>
        </motion.div>
      )}

      {/* Team panels */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <TeamSpectatorPanel team="alpha" name={teamAlphaName} players={players} isWinner={winner === 'alpha'} />
        <TeamSpectatorPanel team="beta" name={teamBetaName} players={players} isWinner={winner === 'beta'} />
      </div>

      {/* Doors summary */}
      <DoorsSummary state={state} />

      {/* Round log */}
      <RoundLog state={state} />

      {/* Spectator notice */}
      <div style={{
        marginTop: '8px', padding: '8px 12px', borderRadius: '10px',
        background: 'rgba(6,42,32,.6)',
        border: '1px solid rgba(255,255,255,.08)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '10px', color: '#9fc4b4' }}>
          👁 أنت تشاهد فقط — لا يمكن التدخل في اللعبة
        </p>
      </div>
    </div>
  );
}

function TeamSpectatorPanel({
  team,
  name,
  players,
  isWinner,
}: {
  team: 'alpha' | 'beta';
  name: string;
  players: Player[];
  isWinner: boolean;
}) {
  const config = TEAM_CONFIG[team];
  const info = getTeamInfo(players, team, name);
  const accent = team === 'alpha' ? '#ef4444' : '#3b82f6';

  return (
    <div style={{
      flex: 1, borderRadius: '12px', overflow: 'hidden',
      border: `1px solid ${accent}${isWinner ? 'aa' : '40'}`,
      background: `linear-gradient(180deg, ${accent}1a, rgba(8,28,22,.7))`,
      boxShadow: isWinner ? `0 0 12px ${accent}55` : 'none',
    }}>
      <div style={{
        padding: '6px 8px',
        background: `linear-gradient(90deg, ${accent}33, transparent)`,
        borderBottom: `1px solid ${accent}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '13px' }}>{config.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: accent === '#ef4444' ? '#fca5a5' : '#93c5fd' }}>
            {info.name}
          </span>
          {isWinner && <span style={{ fontSize: '11px' }}>🏆</span>}
        </div>
        <div style={{ display: 'flex', gap: '4px', fontSize: '8px' }}>
          <span style={{ color: '#34d399' }}>{info.activeCount}●</span>
          <span style={{ color: '#fbbf24' }}>{info.imprisonedCount}⛓</span>
          <span style={{ color: '#f87171' }}>{info.killedCount}💀</span>
        </div>
      </div>
      <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {info.players.map((p) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 5px', borderRadius: '6px',
            background: p.status === 'active' ? 'rgba(255,255,255,.03)' : 'transparent',
            opacity: p.status === 'active' ? 1 : p.status === 'imprisoned' ? 0.55 : 0.3,
          }}>
            <span style={{ fontSize: '11px' }}>{p.avatar}</span>
            <span style={{
              fontSize: '10px', color: '#cbd5e1', flex: 1,
              textDecoration: p.status === 'killed' ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {p.name}
            </span>
            {p.role === 'leader' && <span style={{ fontSize: '8px' }}>👑</span>}
            {p.role === 'deputy' && <span style={{ fontSize: '8px' }}>⭐</span>}
            {p.status === 'imprisoned' && <span style={{ fontSize: '8px' }}>⛓️</span>}
            {p.status === 'killed' && <span style={{ fontSize: '8px' }}>💀</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DoorsSummary({ state }: { state: any }) {
  const doors: any[] = state?.doors || [];
  const opened = doors.filter((d: any) => d.isRevealed).length;

  return (
    <div style={{
      padding: '8px 10px', borderRadius: '10px',
      background: 'rgba(6,42,32,.6)',
      border: '1px solid rgba(254,239,145,.15)',
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#9fc4b4' }}>🚪 الأبواب</span>
        <span style={{
          fontSize: '10px', color: '#feef91',
          background: 'rgba(254,239,145,.1)', padding: '1px 6px',
          borderRadius: '8px', border: '1px solid rgba(254,239,145,.25)',
        }}>
          {opened}/16
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '3px' }}>
        {doors.map((door: any) => (
          <div
            key={door.id}
            style={{
              aspectRatio: '1', borderRadius: '4px',
              background: door.isRevealed
                ? 'linear-gradient(135deg, rgba(168,85,247,.3), rgba(168,85,247,.1))'
                : 'rgba(168,85,247,.08)',
              border: '1px solid rgba(168,85,247,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px',
            }}
          >
            {door.isRevealed ? '⚰️' : door.id}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundLog({ state }: { state: any }) {
  const log: any[] = state?.roundLog || [];

  if (log.length === 0) {
    return (
      <div style={{
        padding: '8px', borderRadius: '10px',
        background: 'rgba(6,42,32,.6)',
        border: '1px solid rgba(254,239,145,.15)',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9fc4b4', textAlign: 'center' }}>
          📋 لا توجد أحداث بعد
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '8px 10px', borderRadius: '10px',
      background: 'rgba(6,42,32,.6)',
      border: '1px solid rgba(254,239,145,.15)',
      flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      minHeight: '100px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#9fc4b4', marginBottom: '4px' }}>
        📋 سجل الأحداث ({log.length})
      </p>
      <div style={{ flex: 1, overflowY: 'auto' }} className="tobol-scrollbar">
        {log.slice(-15).map((entry: any, i: number) => (
          <div
            key={i}
            style={{
              fontSize: '10px', padding: '3px 6px', borderRadius: '6px', marginBottom: '2px',
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
    </div>
  );
}
