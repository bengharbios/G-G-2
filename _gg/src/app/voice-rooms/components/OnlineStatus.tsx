'use client';

import React, { useRef, useCallback } from 'react';
import { TUI } from '../types';

// ─── Pulse Animation Keyframes ─────────────────────────────────────────────

const pulseKeyframes = `
@keyframes onlineStatusPulse {
  0% { box-shadow: 0 0 0 0 ${TUI.colors.green}66; }
  70% { box-shadow: 0 0 0 4px ${TUI.colors.green}00; }
  100% { box-shadow: 0 0 0 0 ${TUI.colors.green}00; }
}
`;

// ─── Online Status Badge ───────────────────────────────────────────────────

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  showText?: boolean;
  size?: 'sm' | 'md';
}

export function OnlineStatusBadge({ isOnline, showText = false, size = 'sm' }: OnlineStatusBadgeProps) {
  const dotSize = size === 'md' ? 12 : 8;
  const fontSize = size === 'md' ? 12 : 10;
  const dotColor = isOnline ? TUI.colors.green : TUI.colors.G4;

  return (
    <>
      <style>{pulseKeyframes}</style>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
            ...(isOnline
              ? { animation: 'onlineStatusPulse 2s ease-in-out infinite' }
              : {}),
          }}
        />
        {showText && (
          <span
            style={{
              fontSize,
              color: dotColor,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {isOnline ? 'متصل' : 'غير متصل'}
          </span>
        )}
      </span>
    </>
  );
}

// ─── useOnlineStatus Hook ──────────────────────────────────────────────────

const onlineMapRef = new Map<string, boolean>();

function setOnline(userId: string, online: boolean) {
  onlineMapRef.set(userId, online);
}

function setOffline(userId: string) {
  onlineMapRef.set(userId, false);
}

export function useOnlineStatus(_userId: string): { isOnline: boolean } {
  // For now, always returns online — real presence detection
  // would be driven by socket events in production.
  return { isOnline: true };
}

useOnlineStatus.setOnline = setOnline;
useOnlineStatus.setOffline = setOffline;
