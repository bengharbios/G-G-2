'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Crown, Shield } from 'lucide-react';
import { TUI, getAvatarColorFromPalette, ROLE_LABELS } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   UserSearchBar — Search participants within a voice room

   Layout: panel with search input + scrollable filtered list
   RTL compatible, inline styles only, teal-green dark theme
   ═══════════════════════════════════════════════════════════════════════ */

interface ParticipantItem {
  userId: string;
  displayName: string;
  avatar?: string;
  role?: string;
}

interface UserSearchBarProps {
  participants: ParticipantItem[];
  onUserSelect: (userId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_BADGE_COLORS: Record<string, { bg: string; text: string; icon: typeof Crown | typeof Shield | null }> = {
  owner:   { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', icon: Crown },
  admin:   { bg: 'rgba(33, 150, 243, 0.15)',  text: '#60a5fa', icon: Shield },
  coowner: { bg: 'rgba(123, 97, 255, 0.15)',  text: '#a78bfa', icon: null },
};

export function UserSearchBar({
  participants,
  onUserSelect,
  isOpen,
  onClose,
}: UserSearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Filter participants by displayName
  const filtered = useMemo(() => {
    if (!query.trim()) return participants;
    const lower = query.trim().toLowerCase();
    return participants.filter(p =>
      p.displayName.toLowerCase().includes(lower),
    );
  }, [participants, query]);

  const handleSelect = (userId: string) => {
    onUserSelect(userId);
    onClose();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        backgroundColor: TUI.colors.G2,
        borderBottomLeftRadius: TUI.radius.lg,
        borderBottomRightRadius: TUI.radius.lg,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        direction: 'rtl',
      }}
    >
      {/* ── Search Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: `1px solid ${TUI.colors.strokePrimary}`,
        }}
      >
        {/* Search Icon */}
        <Search size={18} color={TUI.colors.G5} style={{ flexShrink: 0 }} />

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث عن مستخدم..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: TUI.colors.white,
            fontFamily: 'inherit',
            padding: 0,
            minWidth: 0,
          }}
        />

        {/* Clear / Close Button */}
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: TUI.radius.circle,
              color: TUI.colors.G5,
            }}
            aria-label="مسح البحث"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: TUI.radius.circle,
              color: TUI.colors.G5,
            }}
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Results List ── */}
      <div
        style={{
          maxHeight: 320,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `${TUI.colors.G3} transparent`,
        }}
      >
        <style>{`
          .user-search-scroll::-webkit-scrollbar { width: 4px; }
          .user-search-scroll::-webkit-scrollbar-track { background: transparent; }
          .user-search-scroll::-webkit-scrollbar-thumb { background: ${TUI.colors.G3}; border-radius: 4px; }
        `}</style>
        <div className="user-search-scroll" style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            /* ── No Results ── */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
              }}
            >
              <span style={{ fontSize: 13, color: TUI.colors.G5 }}>
                لا توجد نتائج مطابقة
              </span>
            </div>
          ) : (
            filtered.map(user => {
              const avatarPalette = getAvatarColorFromPalette(user.userId);
              const badge = user.role ? ROLE_BADGE_COLORS[user.role] : undefined;
              const BadgeIcon = badge?.icon ?? null;
              const roleLabel = user.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] : null;
              const initials = user.displayName.slice(0, 2);

              return (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => handleSelect(user.userId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'inherit',
                    direction: 'rtl',
                    transition: `background ${TUI.anim.fast}`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = TUI.colors.bgInput;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: TUI.radius.circle,
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: avatarPalette.bg,
                      color: avatarPalette.text,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: TUI.radius.circle,
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Name */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: TUI.colors.G7,
                      fontWeight: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'right',
                    }}
                  >
                    {user.displayName}
                  </span>

                  {/* Role Badge */}
                  {badge && roleLabel && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '2px 8px',
                        borderRadius: TUI.radius.pill,
                        backgroundColor: badge.bg,
                        flexShrink: 0,
                      }}
                    >
                      {BadgeIcon && (
                        <BadgeIcon
                          size={12}
                          color={badge.text}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: badge.text,
                          lineHeight: '18px',
                          fontFamily: 'inherit',
                        }}
                      >
                        {roleLabel}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
