'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ROLE_CONFIG } from '@/lib/mustathib-types';
import type { Player, Role } from '@/lib/mustathib-types';

// ============================================================
// Types matching MustathibRoomState from server
// ============================================================
interface MustathibRoomData {
  code: string;
  hostName: string;
  phase: string;
  round: number;
  players: Array<{ id: string; name: string; role: string; isAlive: boolean }>;
  roleRevealIndex: number;
  nightActions: Array<{ actorId: string; role: string; targetId: string | null; action: string }>;
  nightStep: number;
  lastNightDeathId: string | null;
  dayVotes: Array<{ voterId: string; targetId: string }>;
  gameLog: Array<{ round: number; message: string; type: string; timestamp: number }>;
  winner: string | null;
  lastAction: string | null;
  totalKills: number;
  totalSaves: number;
  spectators: Array<{ id: string; name: string; joinedAt: number; lastSeen: number }>;
}

function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{
            width: p.size, height: p.size, backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function MustathibSpectatorView({ roomCode }: { roomCode: string }) {
  const [room, setRoom] = useState<MustathibRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);
  const [showLog, setShowLog] = useState(false);

  // Poll room state every 2 seconds
  useEffect(() => {
    let mounted = true;
    const fetchRoom = () => {
      fetch(`/api/mustathib-room/${roomCode}`)
        .then(r => {
          if (!r.ok) throw new Error('not found');
          return r.json();
        })
        .then(d => {
          if (!mounted) return;
          if (d?.room) {
            setRoom(d.room);
            setError('');
          }
          setLoading(false);
        })
        .catch(() => {
          if (!mounted) return;
          setError('فشل في جلب حالة الغرفة');
          setLoading(false);
        });
    };
    fetchRoom();
    const iv = setInterval(fetchRoom, 2000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [roomCode]);

  // Auto-scroll log
  useEffect(() => {
    if (showLog && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [room?.gameLog, showLog]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl"
        style={{ background: 'url(/battle/game_bg.webp) center / cover, #041F18' }}>
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '48px', marginBottom: '8px' }}>🐺</motion.div>
          <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl"
        style={{ background: 'url(/battle/game_bg.webp) center / cover, #041F18' }}>
        <div className="text-center">
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>💔</div>
          <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!room) return null;

  // Game over → show celebratory end screen
  if (room.phase === 'game_over') {
    const isGoodWin = room.winner === 'good';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" dir="rtl"
        style={{ background: 'url(/battle/game_bg.webp) center / cover, #041F18' }}>
        <Confetti />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          style={{ fontSize: '80px', marginBottom: '12px' }}
        >
          {isGoodWin ? '😇' : '😈'}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            color: '#feef91', fontSize: '28px', fontWeight: 900,
            textShadow: '0 2px 4px rgba(0,0,0,.8)',
            paintOrder: 'stroke fill',
            WebkitTextStroke: '1px #aa6e1f',
            marginBottom: '12px',
          }}
        >
          {isGoodWin ? 'فاز فريق الخير' : 'فاز فريق الشر'}
        </motion.h1>
        <p style={{ color: '#9fc4b4', fontSize: '13px' }}>
          القتلى: {room.totalKills} • الإنقاذات: {room.totalSaves}
        </p>
      </div>
    );
  }

  // During play: render a spectator view of the game state
  const aliveCount = room.players.filter(p => p.isAlive).length;
  const evilCount = room.players.filter(p => p.isAlive && ROLE_CONFIG[p.role as Role].team === 'evil').length;
  const goodCount = aliveCount - evilCount;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover, #041F18',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 14px', gap: '10px', overflow: 'hidden',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <img
          src="/yalla-games/mustathib.png"
          alt="المستئذب"
          style={{
            width: '76px', height: '64px', objectFit: 'contain',
            filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.55))',
          }}
        />
        <h1 style={{
          color: '#feef91', fontSize: '22px', fontWeight: 900,
          textShadow: '0 2px 4px rgba(0,0,0,.85)',
          paintOrder: 'stroke fill',
          WebkitTextStroke: '1px #aa6e1f',
        }}>المستئذب</h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600 }}>
          مشاهد • غرفة {roomCode}
        </p>
      </div>

      {/* Phase indicator */}
      <motion.div
        key={room.phase + room.round}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px', borderRadius: '999px',
          background: 'rgba(6,42,32,.65)',
          border: '1px solid rgba(254,239,145,.18)',
        }}
      >
        <span style={{ fontSize: '14px' }}>
          {room.phase === 'roleReveal' ? '🌙' :
            room.phase === 'night' ? '🌙' :
            room.phase === 'day' ? '☀️' :
            room.phase === 'vote' ? '🗳️' : '⏳'}
        </span>
        <span style={{ color: '#feef91', fontSize: '13px', fontWeight: 800 }}>
          {room.phase === 'roleReveal' ? 'استعراض الأدوار' :
            room.phase === 'night' ? `الليلة ${room.round}` :
            room.phase === 'day' ? `النهار ${room.round}` :
            room.phase === 'vote' ? 'التصويت' : 'بانتظار البدء'}
        </span>
      </motion.div>

      {/* Last action notification */}
      {room.lastAction && (
        <motion.div
          key={room.lastAction}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '6px 12px', borderRadius: '999px',
            background: 'rgba(6,42,32,.55)',
            border: '1px solid rgba(254,239,145,.15)',
            color: '#cbd5e1', fontSize: '12px', fontWeight: 600,
          }}
        >
          {room.lastAction}
        </motion.div>
      )}

      {/* Players grid */}
      <div style={{
        width: '100%', maxWidth: '380px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px',
        marginTop: '4px',
      }}>
        {room.players.map(p => {
          const cfg = ROLE_CONFIG[p.role as Role];
          const isEvil = cfg?.team === 'evil';
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '6px 4px', borderRadius: '8px',
                background: p.isAlive
                  ? (isEvil ? 'rgba(248,113,113,.08)' : 'rgba(34,197,94,.08)')
                  : 'rgba(0,0,0,.4)',
                border: `1px solid ${
                  p.isAlive
                    ? (isEvil ? 'rgba(248,113,113,.3)' : 'rgba(34,197,94,.3)')
                    : 'rgba(220,38,38,.3)'
                }`,
                textAlign: 'center',
                opacity: p.isAlive ? 1 : 0.5,
                textDecoration: p.isAlive ? 'none' : 'line-through',
              }}
            >
              <div style={{ fontSize: '18px' }}>{cfg?.emoji || '🧑'}</div>
              <div style={{ fontSize: '11px', color: p.isAlive ? '#cbd5e1' : '#9fc4b4', fontWeight: 700 }}>
                {p.name}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Team counts */}
      <div style={{
        width: '100%', maxWidth: '380px',
        display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center',
        marginTop: '4px',
      }}>
        <span style={{
          padding: '4px 10px', borderRadius: '999px',
          background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)',
          color: '#86efac', fontSize: '11px', fontWeight: 800,
        }}>😇 الخير: {goodCount}</span>
        <span style={{
          padding: '4px 10px', borderRadius: '999px',
          background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)',
          color: '#f87171', fontSize: '11px', fontWeight: 800,
        }}>😈 الشر: {evilCount}</span>
      </div>

      {/* Game log toggle */}
      <button
        onClick={() => setShowLog(s => !s)}
        style={{
          padding: '6px 14px', borderRadius: '999px',
          background: 'rgba(6,42,32,.6)',
          border: '1px solid rgba(254,239,145,.25)',
          color: '#feef91', fontSize: '11px', fontWeight: 700,
          cursor: 'pointer', marginTop: '4px',
        }}
      >
        📜 السجل ({room.gameLog.length})
      </button>

      {showLog && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          style={{
            width: '100%', maxWidth: '380px', overflow: 'hidden',
            background: 'rgba(0,0,0,.4)', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,.1)',
          }}
        >
          <div style={{
            maxHeight: '200px', overflowY: 'auto', padding: '8px',
          }} className="tobol-scrollbar">
            {room.gameLog.map((entry, i) => (
              <div key={i} style={{
                padding: '4px 8px', marginBottom: '2px', borderRadius: '6px',
                background:
                  entry.type === 'danger' ? 'rgba(248,113,113,.08)' :
                  entry.type === 'success' ? 'rgba(110,231,183,.08)' :
                  entry.type === 'system' ? 'rgba(254,239,145,.08)' :
                  'rgba(159,196,180,.05)',
                fontSize: '11px', color: '#cbd5e1',
              }}>
                <span style={{ color: '#6b7280', marginLeft: '4px' }}>R{entry.round}</span>
                {entry.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
