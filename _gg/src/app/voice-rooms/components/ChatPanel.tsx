'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, AuthUser, VoiceRoomParticipant } from '../types';
import { TUI, getSenderColor } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   ChatPanel — Old-style full scrollable message list

   Layout: flex-1, overflow-y-auto, scrollable
   Messages only — NO input field (input is in BottomBar)
   Clicking a username opens their profile sheet via onProfileClick
   ═══════════════════════════════════════════════════════════════════════ */

interface ChatPanelProps {
  messages: ChatMessage[];
  isRoomMuted: boolean;
  authUser: AuthUser | null;
  participants: VoiceRoomParticipant[];
  onProfileClick: (p: VoiceRoomParticipant) => void;
}

const MAX_BUFFER = 100;

export default function ChatPanel({
  messages,
  authUser,
  participants,
  onProfileClick,
}: ChatPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Keep only recent messages ──
  const visibleMessages = messages.length > MAX_BUFFER
    ? messages.slice(-MAX_BUFFER)
    : messages;

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [visibleMessages.length]);

  // ── Profile click handler: find participant by userId and open profile ──
  const handleUserClick = useCallback(
    (userId: string) => {
      const participant = participants.find(p => p.userId === userId);
      if (participant) {
        onProfileClick(participant);
      }
    },
    [participants, onProfileClick],
  );

  return (
    <section
      ref={containerRef}
      className="flex-1 overflow-y-auto min-h-0"
      style={{
        padding: '8px 12px',
        /* Custom scrollbar (webkit) */
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none', /* IE/Edge */
      }}
    >
      <style>{`
        section::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {visibleMessages.length === 0 && (
        <div
          className="flex items-center justify-center w-full h-full"
          style={{ minHeight: 80 }}
        >
          <span style={{ fontSize: 13, color: TUI.colors.G5 }}>
            لا توجد رسائل بعد...
          </span>
        </div>
      )}

      {visibleMessages.map((msg) => {
        if (msg.isSystem) {
          return (
            <div
              key={msg.id}
              className="text-center py-1"
              style={{ fontSize: 12, color: TUI.colors.G5 }}
            >
              {msg.text}
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className="py-0.5"
            style={{ fontSize: 13, lineHeight: '20px' }}
          >
            {/* Gift emoji prefix */}
            {msg.isGift && msg.giftEmoji && (
              <span className="ml-1">{msg.giftEmoji}</span>
            )}

            {/* Username (clickable → opens profile) */}
            <button
              type="button"
              onClick={() => handleUserClick(msg.userId)}
              className="font-bold bg-transparent border-none p-0 cursor-pointer touch-manipulation"
              style={{
                color: getSenderColor(msg.userId),
                fontSize: 13,
                lineHeight: '20px',
              }}
            >
              {msg.displayName}
            </button>

            {/* Colon separator */}
            <span
              style={{
                color: TUI.colors.G5,
                margin: '0 4px',
                fontSize: 13,
              }}
            >
              :
            </span>

            {/* Message body */}
            <span
              style={{
                color: TUI.colors.G7,
                wordBreak: 'break-word',
                fontSize: 13,
              }}
            >
              {msg.text}
            </span>
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={endRef} className="h-1 w-full flex-shrink-0" />
    </section>
  );
}
