'use client';

import { useCallback, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Gift, Send, Headphones } from 'lucide-react';
import { TUI } from '../types';
import type { AuthUser, RoomRole } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   BottomBar — Footer bar with mic, speaker, chat, and gift

   Layout: fixed bottom, full-width
   Items: Mute room (admin+) | Mic (on seat) | Speaker (all users) |
          Chat input (flex-1) | Gift button
   ═══════════════════════════════════════════════════════════════════════ */

interface BottomBarProps {
  myRole: RoomRole;
  isOnSeat: boolean;
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  isRoomMuted: boolean;
  authUser: AuthUser | null;
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendChat: () => void;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onToggleRoomMute: () => void;
  onGiftOpen: () => void;
}

export default function BottomBar({
  myRole,
  isOnSeat,
  isMicMuted,
  isSpeakerMuted,
  isRoomMuted,
  authUser,
  chatInput,
  setChatInput,
  onSendChat,
  onToggleMic,
  onToggleSpeaker,
  onToggleRoomMute,
  onGiftOpen,
}: BottomBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = myRole === 'owner' || myRole === 'coowner' || myRole === 'admin';

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSendChat();
      }
    },
    [onSendChat],
  );

  const handleSend = useCallback(() => {
    onSendChat();
    inputRef.current?.focus();
  }, [onSendChat]);

  const isDisabled = isRoomMuted || !authUser;

  return (
    <footer
      className="flex-shrink-0 w-full"
      style={{
        borderTop: `1px solid ${TUI.colors.G3Divider}`,
        padding: '8px 12px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        backgroundColor: TUI.colors.G1,
      }}
    >
      <div className="flex items-center w-full" style={{ gap: 6 }}>
        {/* ── Mute Room button (admin+ only) ── */}
        {isAdmin && (
          <button
            onClick={onToggleRoomMute}
            className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
            style={{
              width: 38,
              height: 38,
              minWidth: 44,
              minHeight: 44,
              backgroundColor: isRoomMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.08)',
              transition: TUI.anim.fast,
            }}
            aria-label={isRoomMuted ? 'إلغاء كتم الغرفة' : 'كتم الغرفة'}
          >
            {isRoomMuted ? (
              <VolumeX size={18} style={{ color: TUI.colors.red }} />
            ) : (
              <Volume2 size={18} style={{ color: TUI.colors.G7 }} />
            )}
          </button>
        )}

        {/* ── Mic toggle (only when on seat) ── */}
        {isOnSeat && (
          <button
            onClick={onToggleMic}
            className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
            style={{
              width: 38,
              height: 38,
              minWidth: 44,
              minHeight: 44,
              backgroundColor: isMicMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.08)',
              transition: TUI.anim.fast,
            }}
            aria-label={isMicMuted ? 'فتح المايك' : 'كتم المايك'}
          >
            {isMicMuted ? (
              <MicOff size={18} style={{ color: TUI.colors.red }} />
            ) : (
              <Mic size={18} style={{ color: TUI.colors.G7 }} />
            )}
          </button>
        )}

        {/* ── Speaker toggle (ALL users — mute/unmute all remote audio) ── */}
        <button
          onClick={onToggleSpeaker}
          className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
          style={{
            width: 38,
            height: 38,
            minWidth: 44,
            minHeight: 44,
            backgroundColor: isSpeakerMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.08)',
            transition: TUI.anim.fast,
          }}
          aria-label={isSpeakerMuted ? 'فتح السماعة' : 'كتم السماعة'}
        >
          <Headphones size={18} style={{ color: isSpeakerMuted ? TUI.colors.red : TUI.colors.G7 }} />
        </button>

        {/* ── Chat Input (always visible, flex-1) ── */}
        <div
          className="flex items-center flex-1 min-w-0"
          style={{
            height: 38,
            backgroundColor: TUI.colors.bgInput,
            borderRadius: '9999px',
            padding: '0 12px',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRoomMuted
                ? 'الغرفة مكتومة'
                : !authUser
                  ? 'سجل دخولك للمشاركة'
                  : 'اكتب رسالة...'
            }
            disabled={isDisabled}
            maxLength={200}
            dir="rtl"
            className="flex-1 min-w-0 bg-transparent outline-none"
            style={{
              fontSize: 13,
              color: TUI.colors.white,
              caretColor: TUI.colors.B1,
            }}
          />

          {chatInput.trim() && !isDisabled && (
            <button
              onClick={handleSend}
              className="flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
              style={{
                width: 28,
                height: 28,
                color: TUI.colors.B1,
                transition: TUI.anim.fast,
              }}
              aria-label="إرسال"
            >
              <Send size={14} />
            </button>
          )}
        </div>

        {/* ── Gift button (auth user only) ── */}
        {authUser && (
          <button
            onClick={onGiftOpen}
            className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
            style={{
              width: 38,
              height: 38,
              minWidth: 44,
              minHeight: 44,
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              transition: TUI.anim.fast,
            }}
            aria-label="إرسال هدية"
          >
            <Gift size={18} fill={TUI.colors.white} style={{ color: TUI.colors.white }} />
          </button>
        )}
      </div>
    </footer>
  );
}
