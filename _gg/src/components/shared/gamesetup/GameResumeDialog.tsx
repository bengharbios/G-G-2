'use client';

// ════════════════════════════════════════════════════════════════
// GameResumeDialog — shown when a user returns to a game page within
// the 2-minute grace window after a disconnect (pagehide/unload).
// Asks: "متابعة اللعبة أم إنهاء نهائي؟" → resume or forfeit.
// ════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { STROKE_STYLE } from '@/components/shared/gamesetup/GameSetupKit';

interface GameResumeDialogProps {
  open: boolean;
  ageMs: number;
  onResume: () => void;
  onForfeit: () => void;
  gameName: string;
}

function formatAge(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} ثانية`;
  const min = Math.floor(sec / 60);
  return `${min} دقيقة`;
}

export function GameResumeDialog({
  open,
  ageMs,
  onResume,
  onForfeit,
  gameName,
}: GameResumeDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 20 }}
            transition={{ type: 'spring', bounce: 0.32 }}
            className="tobol-team-card"
            style={{
              padding: '24px', width: '100%', maxWidth: '340px',
              textAlign: 'center', borderRadius: '20px',
            }}
          >
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>🎮</div>
            <h3 style={{
              ...STROKE_STYLE,
              fontSize: '18px', fontWeight: 900, marginBottom: '8px',
            }}>
              لديك جلسة لعبة محفوظة
            </h3>
            <p style={{
              color: '#9fc4b4', fontSize: '13px',
              marginBottom: '18px', lineHeight: 1.5,
            }}>
              انقطعت جلستك في <strong style={{ color: '#feef91' }}>{gameName}</strong>
              {' '}منذ <strong style={{ color: '#fbbf24' }}>{formatAge(ageMs)}</strong>.
              <br />
              هل تريد المتابعة من حيث توقفت أم إنهاء اللعبة نهائياً؟
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={onResume}
                style={{
                  padding: '12px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #22c55e, #15803d)',
                  color: '#fff', fontSize: '15px', fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(34,197,94,.35)',
                }}
              >
                ✓ متابعة اللعبة
              </button>
              <button
                onClick={onForfeit}
                style={{
                  padding: '12px', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,.12)',
                  background: 'rgba(80,80,80,.3)',
                  color: '#cbd5e1', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                إنهاء نهائي — خسارة الجولة
              </button>
            </div>
            <p style={{
              fontSize: '10px', color: '#64748b', marginTop: '12px',
              fontWeight: 600,
            }}>
              💡 المتابعة ممكنة فقط ضمن نافذة دقيقتين من الانقطاع
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
