'use client';

import { WifiOff, Loader2 } from 'lucide-react';

interface ReconnectIndicatorProps {
  isConnected: boolean;
  reconnectAttempt?: number;
}

export function ReconnectIndicator({ isConnected, reconnectAttempt = 0 }: ReconnectIndicatorProps) {
  if (isConnected) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 w-full"
      style={{
        padding: '6px 12px',
        backgroundColor: 'rgba(252, 85, 85, 0.15)',
        borderBottom: '1px solid rgba(252, 85, 85, 0.2)',
        animation: 'notifSlideIn 0.3s ease-out',
      }}
    >
      <Loader2 size={12} className="animate-spin" style={{ color: '#fc5555' }} />
      <WifiOff size={12} style={{ color: '#fc5555' }} />
      <span style={{ fontSize: 11, color: '#fc5555', fontWeight: 500 }}>
        {reconnectAttempt > 0
          ? `جاري إعادة الاتصال... (${reconnectAttempt})`
          : 'انقطع الاتصال — جاري إعادة الاتصال...'
        }
      </span>
    </div>
  );
}
