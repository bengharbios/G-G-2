'use client';

import { Circle, StopCircle } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface RecordingIndicatorProps {
  isRecording: boolean;
  onToggle: () => void;
  isAdmin: boolean;
}

export function RecordingIndicator({ isRecording, onToggle, isAdmin }: RecordingIndicatorProps) {
  const [elapsed, setElapsed] = useState('00:00');
  const startTimeRef = useRef<number | null>(null);

  // Start/stop timer based on recording state — setState is inside setInterval callback (not synchronous)
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      const interval = setInterval(() => {
        if (!startTimeRef.current) return;
        const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setElapsed(`${mins}:${secs}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      startTimeRef.current = null;
    }
  }, [isRecording]);

  // Derive elapsed display: show "00:00" when not recording
  const displayElapsed = isRecording ? elapsed : '00:00';

  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  if (!isAdmin) return null;

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 cursor-pointer touch-manipulation bg-transparent border-none"
      style={{
        padding: '3px 10px',
        borderRadius: 20,
        backgroundColor: isRecording ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.06)',
        border: isRecording ? '1px solid rgba(252, 85, 85, 0.2)' : '1px solid rgba(255,255,255,0.05)',
      }}
      aria-label={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
    >
      {isRecording ? (
        <>
          <Circle size={8} fill="#fc5555" style={{ color: '#fc5555', animation: 'recordPulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, color: '#fc5555', fontWeight: 600, fontFamily: 'monospace' }}>{displayElapsed}</span>
          <span style={{ fontSize: 10, color: 'rgba(252, 85, 85, 0.7)' }}>REC</span>
        </>
      ) : (
        <>
          <StopCircle size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>تسجيل</span>
        </>
      )}
      <style>{`
        @keyframes recordPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </button>
  );
}
