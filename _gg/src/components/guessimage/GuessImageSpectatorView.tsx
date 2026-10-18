'use client';

// ════════════════════════════════════════════════════════════════
// GuessImageSpectatorView — Read-only view for spectators who joined
// via /join/guessimage/[code]. Polls room state every 2s and renders
// the host's current image + multi-choice buttons + own reveal counter.
//
// Spectator actions:
//   - Click a covered square → POST /api/guessimage-room/[code]/reveal
//   - Click a choice → POST /api/guessimage-room/[code]/guess
//   - Wait for game_over → celebratory screen
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  isMusicEnabled, setMusicEnabled,
  isSoundEnabled, setSoundEnabled,
  playClickSound, playCorrectSound, playWrongSound,
} from '@/lib/sounds';
import { buildGuessThemeUrl, buildGuessCardBackUrl } from '@/lib/flashi_guess_images';
import type { GuessImageRoomState, GuessImageSpectatorInfo } from '@/lib/guessimage-room-store';

const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  frame?: string;
}

interface Props {
  roomCode: string;
  spectatorAuthUser?: AuthUser | null;
}

export default function GuessImageSpectatorView({ roomCode, spectatorAuthUser }: Props) {
  const [room, setRoom] = useState<GuessImageRoomState | null>(null);
  const [spectatorId, setSpectatorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => { setMusicOn(isMusicEnabled()); setSoundOn(isSoundEnabled()); }, []);

  // Poll room state every 2s
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/guessimage-room/${roomCode}`);
        if (!res.ok) {
          if (!cancelled) {
            setError('الغرفة غير موجودة أو انتهت صلاحيتها');
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.room) {
          setRoom(data.room);
          // Find this spectator's record (by auth user id or name)
          const me = (data.room.spectators as GuessImageSpectatorInfo[]).find((s) => {
            if (spectatorAuthUser?.displayName && s.displayName === spectatorAuthUser.displayName) return true;
            if (spectatorAuthUser?.id && s.authedUserId === spectatorAuthUser.id) return true;
            return false;
          });
          if (me) setSpectatorId(me.id);
          setError('');
        }
      } catch {
        // silent — keep last state
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    poll();
    const iv = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [roomCode, spectatorAuthUser]);

  // Toggle handlers
  const toggleMusic = () => { const n = !musicOn; setMusicOn(n); setMusicEnabled(n); };
  const toggleSound = () => { const n = !soundOn; setSoundOn(n); setSoundEnabled(n); };

  // Reveal a square (only if playing)
  const handleReveal = async (squareId: string) => {
    if (!spectatorId || !room) return;
    if (room.phase !== 'playing') return;
    if (soundOn) playClickSound();
    try {
      await fetch(`/api/guessimage-room/${roomCode}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spectatorId, squareId }),
      });
    } catch { /* silent */ }
  };

  // Submit a choice
  const handleGuess = async (choiceIndex: number) => {
    if (!spectatorId || !room) return;
    if (room.phase !== 'playing') return;
    if (soundOn) playClickSound();
    try {
      const me = room.spectators.find(s => s.id === spectatorId);
      const revealedCount = me?.revealedSquares.length || 0;
      const res = await fetch(`/api/guessimage-room/${roomCode}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spectatorId,
          choiceIndex,
          correctChoiceIndex: room.currentRoundCorrectChoiceIndex,
          scorePerCorrect: room.scorePerCorrect,
          penaltyPerWrong: room.penaltyPerWrong,
          revealedCount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.correct) {
          if (soundOn) playCorrectSound();
          setLastFeedback('correct');
        } else {
          if (soundOn) playWrongSound();
          setLastFeedback('wrong');
        }
        setTimeout(() => setLastFeedback(null), 1500);
      }
    } catch { /* silent */ }
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '48px', marginBottom: '12px' }}>🧩</motion.div>
        <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl" style={{ padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💔</div>
        <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  // NO ROOM
  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl">
        <p style={{ color: '#9fc4b4', fontSize: '14px' }}>في انتظار بيانات الغرفة...</p>
      </div>
    );
  }

  const me: GuessImageSpectatorInfo | undefined = room.spectators.find(s => s.id === spectatorId);
  const myStatus = me?.status || 'pending';
  const myRevealedSquares = me?.revealedSquares || [];
  const myScore = me?.score || 0;
  const myCorrect = me?.totalCorrect || 0;
  const myWrong = me?.totalWrong || 0;
  const hasFinished = me?.hasFinished || false;

  // GAME OVER
  if (room.phase === 'game_over') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl" style={{ padding: '20px', gap: '8px' }}>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} style={{ fontSize: '80px' }}>🏆</motion.div>
        <h1 style={{ ...STROKE_STYLE, fontSize: '28px', fontWeight: 900, textAlign: 'center', marginTop: '8px' }}>
          انتهت المعركة!
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '14px', textAlign: 'center' }}>
          نتيجتك: <strong style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 900 }}>{myScore}</strong>
        </p>
        <p style={{ color: '#9fc4b4', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
          إجابات صحيحة: <strong style={{ color: '#86efac' }}>{myCorrect}</strong> • أخطاء: <strong style={{ color: '#f87171' }}>{myWrong}</strong>
        </p>
        {spectatorAuthUser ? (
          <p style={{ color: '#9fc4b4', fontSize: '12px', textAlign: 'center', marginTop: '16px', padding: '8px 12px', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: '8px' }}>
            🎁 أنت مسجّل دخول — ستُحتسب لك الذهب والخبرة تلقائياً عند الفوز بالمركز الأول
          </p>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '8px' }}>💡 سجّل دخولك لربح الذهب والخبرة عند الفوز</p>
            <a href="/login" style={{ display: 'inline-block', padding: '8px 16px', background: 'linear-gradient(135deg, #fbbf24, #aa6e1f)', color: '#000', borderRadius: '8px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
              سجّل دخولك
            </a>
          </div>
        )}
      </div>
    );
  }

  // PENDING / REJECTED
  if (myStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl" style={{ padding: '20px' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</motion.div>
        <p style={{ ...STROKE_STYLE, fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>في انتظار موافقة المضيف</p>
        <p style={{ color: '#9fc4b4', fontSize: '12px', textAlign: 'center' }}>بمجرد أن يعتمدك المضيف، ستبدأ اللعب فوراً</p>
      </div>
    );
  }
  if (myStatus === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl" style={{ padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
        <p style={{ color: '#f87171', fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>تم رفض انضمامك</p>
        <p style={{ color: '#9fc4b4', fontSize: '12px', textAlign: 'center' }}>للأسف، لم يوافق المضيف على انضمامك لهذه الجلسة</p>
      </div>
    );
  }

  // PLAYING or FINISHED (still show board)
  const gridRows = Math.sqrt(room.gridSize);  // 4→16, 5→25, 6→36
  const themeId = room.themeId || 1;
  const remaining = Math.max(0, room.maxReveals - myRevealedSquares.length);

  return (
    <div
      dir="rtl"
      className="tobol-bg"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: `url(${buildGuessThemeUrl(themeId)}) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 12px 16px',
        gap: '6px',
        overflowY: 'auto',
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
      }}
    >
      {/* Header actions */}
      <div className="tobol-header-actions">
        <button type="button" className={`tobol-header-btn ${musicOn ? 'active' : ''}`} onClick={toggleMusic} aria-label="الصوت">
          <img src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sound" style={{ width: '26px', height: '26px' }} />
        </button>
        <button type="button" className={`tobol-header-btn ${soundOn ? 'active' : ''}`} onClick={toggleSound} aria-label="المؤثرات">
          <img src={soundOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sfx" style={{ width: '26px', height: '26px' }} />
        </button>
      </div>

      {/* Title + status */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '44px', padding: '4px 12px', borderRadius: '14px', background: 'rgba(6,42,32,.45)', border: '1px solid rgba(254,239,145,.12)' }}>
        <img src="/yalla-games/guessimage.png" alt="خمن الصورة" draggable={false} style={{ width: '48px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }} />
        <div>
          <h1 style={{ ...STROKE_STYLE, fontSize: '16px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: 0, lineHeight: 1.1 }}>
            خمن الصورة
          </h1>
          <div style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 700, marginTop: '1px' }}>
            {hasFinished ? '✓ انتهيت' : `🎮 مشاهد — باقي ${remaining} كشف`}
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '460px', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ ...STROKE_STYLE, fontSize: '14px', fontWeight: 800, textAlign: 'center', padding: '6px 10px', border: '1px solid rgba(34,197,94,.3)', borderRadius: '8px', background: 'rgba(0,0,0,.4)', minWidth: '80px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
          <span style={{ fontSize: '16px' }}>🏆</span>
          <span style={{ color: '#86efac', fontSize: '16px', fontWeight: 900 }}>{myScore}</span>
        </div>
        <div style={{ flex: 1, padding: '6px 12px', border: '1px solid rgba(251,191,36,.3)', borderRadius: '8px', background: 'rgba(0,0,0,.55)', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24' }}>{remaining}</span>
          <span style={{ fontSize: '11px', color: '#9fc4b4' }}>كشف متبقي</span>
        </div>
        <div style={{ ...STROKE_STYLE, fontSize: '14px', fontWeight: 800, textAlign: 'center', padding: '6px 10px', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', background: 'rgba(0,0,0,.4)', minWidth: '80px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
          <span style={{ fontSize: '16px' }}>⏱️</span>
          <span style={{ color: '#f87171', fontSize: '16px', fontWeight: 900 }}>{room.timeLeft || 0}</span>
        </div>
      </motion.div>

      {/* Image + grid overlay */}
      {room.currentRoundImageUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="tobol-team-card" style={{ width: '100%', maxWidth: '460px', padding: '10px', borderRadius: '12px' }}>
          <p style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 800, textAlign: 'center', marginBottom: '6px' }}>
            {hasFinished ? '🏆 انتهت الجولة' : '🎯 اكشف الصورة وخمّن'}
          </p>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', maxWidth: '400px', margin: '0 auto' }}>
            <img src={room.currentRoundImageUrl} alt="الصورة المخفية" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', filter: hasFinished ? 'none' : 'blur(2px)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${gridRows}, 1fr)`, gridTemplateRows: `repeat(${gridRows}, 1fr)`, gap: '1px' }}>
              {Array.from({ length: room.gridSize }).map((_, i) => {
                const row = Math.floor(i / gridRows);
                const col = i % gridRows;
                const sqId = `${row}-${col}`;
                const isRevealed = myRevealedSquares.includes(sqId);
                return (
                  <div
                    key={sqId}
                    onClick={() => !hasFinished && !isRevealed && remaining > 0 && handleReveal(sqId)}
                    style={{
                      background: isRevealed ? 'transparent' : `url(${buildGuessCardBackUrl(themeId)}) center / cover, rgba(0,0,0,.7)`,
                      cursor: !hasFinished && !isRevealed && remaining > 0 ? 'pointer' : 'default',
                      border: '1px solid rgba(254,239,145,.1)',
                      transition: 'background 0.2s ease',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Choices */}
      {!hasFinished && room.currentRoundChoices.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '460px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {room.currentRoundChoices.map((choice, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleGuess(i)}
              style={{
                padding: '14px 16px', border: '1.5px solid rgba(254,239,145,.35)',
                background: 'linear-gradient(180deg, rgba(254,239,145,.18) 0%, rgba(170,110,31,.08) 50%, rgba(8,28,22,.85) 100%)',
                color: '#feef91', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
              }}
            >
              <span style={{ fontSize: '16px' }}>{['💡','🎯','✨','⭐'][i] || '🔹'}</span>
              <span>{choice}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {lastFeedback && (
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1.4 }} exit={{ opacity: 0, scale: 1.6 }} style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '40px', zIndex: 200, pointerEvents: 'none', color: lastFeedback === 'correct' ? '#86efac' : '#f87171' }}>
            {lastFeedback === 'correct' ? '✓' : '✗'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
