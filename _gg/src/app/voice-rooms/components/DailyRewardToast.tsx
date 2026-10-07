'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, Sparkles, X } from 'lucide-react';

interface DailyRewardToastProps {
  userId: string | undefined;
}

export function DailyRewardToast({ userId }: DailyRewardToastProps) {
  const [show, setShow] = useState(false);
  const [reward, setReward] = useState<{ gems: number; streak: number } | null>(null);
  const [claimed, setClaimed] = useState(false);

  const checkReward = useCallback(async () => {
    if (!userId || claimed) return;
    try {
      const res = await fetch(`/api/daily-reward?userId=${userId}`);
      const data = await res.json();
      if (data.canClaim) {
        setShow(true);
      }
    } catch { /* ignore */ }
  }, [userId, claimed]);

  useEffect(() => {
    // Check on mount with a delay so it doesn't interrupt
    const timer = setTimeout(checkReward, 3000);
    return () => clearTimeout(timer);
  }, [checkReward]);

  const handleClaim = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/daily-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.isNewDay && data.gems > 0) {
        setReward({ gems: data.gems, streak: data.streak });
      }
      setClaimed(true);
      setShow(false);
    } catch { /* ignore */ }
  };

  if (!show && !reward) return null;

  return (
    <>
      {/* Reward display (after claiming) */}
      {reward && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setReward(null)}
        >
          <div
            className="flex flex-col items-center"
            style={{
              padding: '32px 40px',
              borderRadius: 24,
              backgroundColor: 'rgba(10, 40, 36, 0.95)',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 0 60px rgba(245, 158, 11, 0.2)',
              animation: 'fadeInScale 0.3s ease-out',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 48 }}>🎁</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>مكافأة اليومية!</span>
            <div className="flex items-center gap-2">
              <Gem size={20} fill="#f59e0b" stroke="#f59e0b" />
              <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>+{reward.gems}</span>
            </div>
            {reward.streak > 1 && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                🔥 سلسلة {reward.streak} أيام متتالية
              </span>
            )}
            <button
              onClick={() => setReward(null)}
              style={{
                marginTop: 8,
                padding: '8px 24px',
                borderRadius: 12,
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              رائع! ✨
            </button>
          </div>
        </div>
      )}

      {/* Claim prompt */}
      {show && (
        <div
          className="fixed left-4 right-4 z-50 flex flex-col items-center"
          style={{
            bottom: 100,
            maxWidth: 320,
            margin: '0 auto',
            padding: '14px 18px',
            borderRadius: 16,
            backgroundColor: 'rgba(10, 40, 36, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
            animation: 'notifSlideIn 0.3s ease-out',
            gap: 10,
          }}
        >
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center gap-2">
              <Gift size={16} fill="#f59e0b" stroke="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>مكافأة الدخول اليومي</span>
            </div>
            <button onClick={() => setShow(false)} className="bg-transparent border-none cursor-pointer" style={{ padding: 4 }}>
              <X size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </button>
          </div>
          <div className="flex items-center w-full justify-between">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>اجمع جواهرك المجانية!</span>
            <button
              onClick={handleClaim}
              style={{
                padding: '6px 16px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span className="flex items-center gap-1">
                <Sparkles size={12} />
                اجمع
              </span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/* Simple Gem SVG icon (inline to avoid import issues) */
function Gem(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, ...rest } = props;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </svg>
  );
}
