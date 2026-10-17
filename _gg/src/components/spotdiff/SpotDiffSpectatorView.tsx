'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SPOTDIFF_ROUNDS } from '@/lib/spotdiff-rounds';

// Minimal auth user shape (passed from join page when viewer is authed)
interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  frame?: string;
}

// ============================================================
// SpotDiffSpectatorView — shown to viewers joining via deep-link
// Polls the host's room state and renders the current round read-only.
// If the viewer is authed, their avatar/frame/name are passed in.
// If guest, results still display but with a "register to earn gold/xp" CTA.
// ============================================================

interface SpotDiffRoomData {
  code: string;
  hostName: string;
  phase: string;
  round: number;
  difficulty: string;
  totalRounds: number;
  currentRoundId: string | null;
  foundDifferences: string[];
  score: number;
  timeLeft: number;
  totalDifferences: number;
  totalFound: number;
  totalMisses: number;
  roundsPlayed: number;
  gameLog: Array<{ round: number; message: string; type: string; timestamp: number }>;
  lastAction: string | null;
  playerName: string | null;
  spectators: Array<{ id: string; name: string; joinedAt: number; lastSeen: number }>;
}

const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

function Confetti() {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    size: 4 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

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

export default function SpotDiffSpectatorView({ roomCode, spectatorAuthUser }: { roomCode: string; spectatorAuthUser?: AuthUser | null }) {
  const [room, setRoom] = useState<SpotDiffRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLog, setShowLog] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Poll room state every 2 seconds
  useEffect(() => {
    let mounted = true;
    const fetchRoom = () => {
      fetch(`/api/spotdiff-room/${roomCode}`)
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
            style={{ fontSize: '48px', marginBottom: '8px' }}>🔍</motion.div>
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
          🏆
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
          انتهت اللعبة!
        </motion.h1>
        <p style={{ color: '#feef91', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
          النتيجة النهائية: {room.score} نقطة
        </p>
        <p style={{ color: '#9fc4b4', fontSize: '13px' }}>
          الفروقات: {room.totalFound}/{room.totalDifferences}
        </p>

        {/* Auth-status message: authed → earns gold/xp; guest → CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: '16px',
            padding: '10px 16px',
            borderRadius: '12px',
            background: spectatorAuthUser
              ? 'linear-gradient(135deg, rgba(251,191,36,.18), rgba(170,110,31,.08))'
              : 'rgba(0,0,0,.45)',
            border: spectatorAuthUser
              ? '1px solid rgba(251,191,36,.4)'
              : '1px solid rgba(254,239,145,.2)',
            maxWidth: '380px',
            textAlign: 'center',
          }}
        >
          {spectatorAuthUser ? (
            <>
              <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 800 }}>
                🎁 أنت مسجّل دخول —
              </p>
              <p style={{ color: '#feef91', fontSize: '11px', fontWeight: 700, marginTop: '4px' }}>
                ستُحتسب لك الذهب والخبرة تلقائياً عند الفوز بالمركز الأول
              </p>
            </>
          ) : (
            <>
              <p style={{ color: '#9fc4b4', fontSize: '12px', fontWeight: 700 }}>
                💡 سجّل دخولك لربح الذهب والخبرة عند الفوز
              </p>
              <a
                href="/login"
                style={{
                  display: 'inline-block',
                  marginTop: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #fbbf24, #aa6e1f)',
                  color: '#000',
                  fontSize: '12px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                🔑 سجّل دخولك الآن
              </a>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // Look up the current round's images from the static SPOTDIFF_ROUNDS list
  const currentRound = room.currentRoundId
    ? SPOTDIFF_ROUNDS.find(r => r.id === room.currentRoundId)
    : null;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover, #041F18',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 14px', gap: '10px', overflowY: 'auto',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '40px' }}>🔍</div>
        <h1 style={{
          ...STROKE_STYLE,
          fontSize: '22px', fontWeight: 900,
        }}>اختلاف الصور</h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600 }}>
          مشاهد • غرفة {roomCode}
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        width: '100%', maxWidth: '440px',
        display: 'flex', gap: '6px', alignItems: 'stretch',
      }}>
        <div className="tobol-team-panel-compact team-red" style={{ flex: 1 }}>
          <div className="tobol-team-name-display">الجولة</div>
          <div className="tobol-team-divider-compact" />
          <div className="tobol-team-score-compact">{room.round + 1}/{room.totalRounds}</div>
        </div>
        <div className="tobol-team-panel-compact team-blue" style={{ flex: 1 }}>
          <div className="tobol-team-name-display">نقاط اللاعب</div>
          <div className="tobol-team-divider-compact" />
          <div className="tobol-team-score-compact">{room.score}</div>
        </div>
        <div className="tobol-team-panel-compact team-red" style={{ flex: 1 }}>
          <div className="tobol-team-name-display">الوقت</div>
          <div className="tobol-team-divider-compact" />
          <div className="tobol-team-score-compact">{room.timeLeft}s</div>
        </div>
      </div>

      {/* Last action notification */}
      {room.lastAction && (
        <motion.div
          key={room.lastAction + (room.lastAction ? Math.random() : '')}
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

      {/* Show images if a round is active */}
      {currentRound ? (
        <motion.div
          key={currentRound.id + String(room.round)}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: '100%', maxWidth: '440px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            marginTop: '4px',
          }}
        >
          {/* Image A */}
          <div style={{
            position: 'relative',
            border: '2px solid rgba(254,239,145,.3)',
            borderRadius: '12px', overflow: 'hidden', background: '#000',
          }}>
            <img src={currentRound.imageA} alt="A" draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }} />
            <div style={{
              position: 'absolute', top: '4px', right: '4px',
              background: 'rgba(0,0,0,.6)', color: '#9fc4b4',
              fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
            }}>A</div>
          </div>
          {/* Image B — read-only for spectators */}
          <div style={{
            position: 'relative',
            border: '2px solid rgba(254,239,145,.5)',
            borderRadius: '12px', overflow: 'hidden', background: '#000',
          }}>
            <img src={currentRound.imageB} alt="B" draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }} />
            {/* Overlay found-difference markers */}
            {currentRound.differences.filter(d => room.foundDifferences.includes(d.id)).map(d => (
              <div
                key={d.id}
                style={{
                  position: 'absolute',
                  left: `${d.x * 100}%`,
                  top: `${d.y * 100}%`,
                  width: `${d.radius * 200}%`,
                  aspectRatio: '1 / 1',
                  transform: 'translate(-50%, -50%)',
                  border: '3px solid #22c55e',
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,.18)',
                  boxShadow: '0 0 12px rgba(34,197,94,.6)',
                  pointerEvents: 'none',
                }}
              />
            ))}
            <div style={{
              position: 'absolute', top: '4px', right: '4px',
              background: 'rgba(0,0,0,.6)', color: '#feef91',
              fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
            }}>B</div>
          </div>
        </motion.div>
      ) : (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9fc4b4' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>⏳</div>
          <p>بانتظار بدء الجولة...</p>
        </div>
      )}

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
            width: '100%', maxWidth: '440px', overflow: 'hidden',
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
