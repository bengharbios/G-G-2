'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Star,
  Shield,
  User,
  Users,
  Trophy,
  Sparkles,
  Heart,
  ArrowLeft,
  Camera,
} from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import {
  TUI,
  ROLE_LABELS,
  ROLE_LEVELS,
  ROLE_COLORS,
  type VoiceRoom,
  type VoiceRoomParticipant,
} from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

interface TopGiftItem {
  giftName: string;
  giftEmoji: string;
  gems: number;
  senderName: string;
  senderAvatar: string;
  receiverName: string;
  receiverAvatar: string;
  createdAt: string;
}

interface PersistentMember {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  grantedAt: string;
}

export interface RoomInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: VoiceRoom;
  participantCount: number;
  participants?: VoiceRoomParticipant[];
  weeklyGems?: number;
  topGifts?: TopGiftItem[];
  onFollow?: () => void;
  isFollowing?: boolean;
  onJoin?: () => void;
  isJoined?: boolean;
  isOwner?: boolean;
  onUpdateAvatar?: (avatarBase64: string) => void;
}

type TabKey = 'info' | 'members' | 'moments';

/* ═══════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════ */

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'معلومات' },
  { key: 'members', label: 'الأعضاء' },
  { key: 'moments', label: 'اللحظات' },
];

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

function getInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() || '?';
}

function daysSince(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'منذ أسبوع' : `منذ ${weeks} أسابيع`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? 'منذ شهر' : `منذ ${months} أشهر`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? 'منذ سنة' : `منذ ${years} سنوات`;
}

function formatGems(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en');
}

/** Returns the correct lucide icon for a given room role */
function RoleIcon({ role, size = 10 }: { role: string; size?: number }) {
  switch (role) {
    case 'owner':
      return <Crown size={size} color={ROLE_COLORS.owner} />;
    case 'coowner':
      return <Star size={size} color={ROLE_COLORS.coowner} />;
    case 'admin':
      return <Shield size={size} color={ROLE_COLORS.admin} />;
    default:
      return <User size={size} color={ROLE_COLORS.member} />;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function RoomInfoSheet({
  isOpen,
  onClose,
  room,
  participantCount,
  participants,
  weeklyGems = 0,
  topGifts = [],
  onFollow,
  isFollowing = false,
  onJoin,
  isJoined = false,
  isOwner = false,
  onUpdateAvatar,
}: RoomInfoSheetProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [persistentMembers, setPersistentMembers] = useState<PersistentMember[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const tabIndex = TABS.findIndex((t) => t.key === activeTab);

  /* ── Fetch persistent room members ── */
  useEffect(() => {
    if (!isOpen || !room.id) return;
    fetch(`/api/voice-rooms/${room.id}?action=room-members`)
      .then(r => r.json())
      .then(d => { if (d.success) setPersistentMembers(d.members || []); })
      .catch(() => {});
  }, [isOpen, room.id]);

  /* ── Derived data ── */

  // Merge persistent members (RoomMember) with current participants
  // Persistent members always show, even when offline
  const sortedMembers = useMemo(() => {
    // Map of current participants by userId for quick lookup
    const onlineMap = new Map<string, VoiceRoomParticipant>();
    if (participants) {
      participants.forEach(p => onlineMap.set(p.userId, p));
    }

    // Build merged list from persistent members
    const merged: Array<{
      id: string;
      userId: string;
      displayName: string;
      avatar: string;
      role: string;
      joinedAt: string;
      isOnline: boolean;
      seatIndex: number;
    }> = [];

    const seen = new Set<string>();

    // Add all persistent members
    for (const m of persistentMembers) {
      if (seen.has(m.userId)) continue;
      seen.add(m.userId);
      const online = onlineMap.get(m.userId);
      merged.push({
        id: online?.id || m.userId,
        userId: m.userId,
        displayName: online?.displayName || m.displayName || m.username,
        avatar: online?.avatar || m.avatar,
        role: online?.role || m.role,
        joinedAt: online?.joinedAt || m.grantedAt,
        isOnline: !!online,
        seatIndex: online?.seatIndex ?? -1,
      });
    }

    // Add online participants who are owner/admin but not in persistent list
    if (participants) {
      for (const p of participants) {
        if (p.role !== 'visitor' && !seen.has(p.userId)) {
          seen.add(p.userId);
          merged.push({
            id: p.id,
            userId: p.userId,
            displayName: p.displayName,
            avatar: p.avatar,
            role: p.role,
            joinedAt: p.joinedAt,
            isOnline: true,
            seatIndex: p.seatIndex,
          });
        }
      }
    }

    // Sort by role hierarchy
    return merged.sort((a, b) => (ROLE_LEVELS[b.role] || 0) - (ROLE_LEVELS[a.role] || 0));
  }, [participants, persistentMembers]);

  const sortedGifts = useMemo(() => {
    return [...topGifts].sort((a, b) => b.gems - a.gems);
  }, [topGifts]);

  /* ── Tab‑content transition variants ── */

  const tabVariants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height="75%"
      title="معلومات الغرفة"
    >
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ══════════════════════════════════════════════════════════════
            Tab Bar — 3 tabs with animated underline indicator
            ══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            marginBottom: 16,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  height: 38,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? TUI.colors.white : TUI.colors.G5,
                  transition: 'color 0.2s ease',
                  paddingBottom: 6,
                  paddingTop: 6,
                }}
              >
                {tab.key === 'info' && (
                  <Sparkles size={13} style={{ opacity: isActive ? 1 : 0.5 }} />
                )}
                {tab.key === 'members' && (
                  <Users size={13} style={{ opacity: isActive ? 1 : 0.5 }} />
                )}
                {tab.key === 'moments' && (
                  <Trophy size={13} style={{ opacity: isActive ? 1 : 0.5 }} />
                )}
                {tab.label}
              </button>
            );
          })}

          {/* ── Animated underline (layoutId) ── */}
          <motion.div
            layoutId="room-info-tab-underline"
            style={{
              position: 'absolute',
              bottom: 0,
              height: 2.5,
              borderRadius: 2,
              backgroundColor: TUI.colors.B1,
              /* Position based on active tab index */
              width: `${100 / TABS.length}%`,
              right: `${tabIndex * (100 / TABS.length)}%`,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            Tab Content — animated transitions
            ══════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {/* ──────────────────────────────────────────────────────────
              TAB 1 — معلومات (Info)
              ────────────────────────────────────────────────────────── */}
          {activeTab === 'info' && (
            <motion.div
              key="tab-info"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* ── Room Avatar (owner only) ── */}
              {isOwner && onUpdateAvatar && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: `2px solid ${TUI.colors.strokePrimary}`,
                      background: TUI.colors.bgInput,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {room.roomAvatar ? (
                      <img
                        src={room.roomAvatar}
                        alt="صورة الغرفة"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Camera size={20} style={{ color: TUI.colors.G5 }} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      fontSize: '13px',
                      color: TUI.colors.B1,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    تغيير صورة الغرفة
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const img = new window.Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const max = 200;
                          let w = img.width;
                          let h = img.height;
                          if (w > max || h > max) {
                            if (w > h) { h = Math.round((h / w) * max); w = max; }
                            else { w = Math.round((w / h) * max); h = max; }
                          }
                          canvas.width = w;
                          canvas.height = h;
                          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                          onUpdateAvatar(canvas.toDataURL('image/jpeg', 0.8));
                        };
                        img.src = ev.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              )}

              {/* ── Room Banner Image ── */}
              {room.roomImage && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 140,
                    borderRadius: TUI.radius.lg,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={room.roomImage}
                    alt={room.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                  {/* Gradient overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(15,16,20,0) 30%, rgba(15,16,20,0.85) 100%)',
                    }}
                  />
                  {/* Room‑Level Badge */}
                  {room.roomLevel > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        padding: '3px 10px',
                        borderRadius: TUI.radius.pill,
                        fontSize: '11px',
                        fontWeight: 600,
                        color: TUI.colors.white,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={11} color="#f59e0b" />
                      Lv.{room.roomLevel}
                    </div>
                  )}
                </div>
              )}

              {/* ── Room Name + Description ── */}
              <div>
                <p
                  style={{
                    fontSize: TUI.font.title20.size,
                    fontWeight: 600,
                    color: TUI.colors.white,
                    lineHeight: 1.4,
                    marginBottom: 4,
                  }}
                >
                  {room.name}
                </p>
                {room.description && (
                  <p
                    style={{
                      fontSize: TUI.font.body14.size,
                      color: TUI.colors.G7,
                      lineHeight: 1.6,
                    }}
                  >
                    {room.description}
                  </p>
                )}
              </div>

              {/* ── Host Card ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: TUI.radius.lg,
                  background: TUI.colors.blue30,
                }}
              >
                {/* Avatar + crown badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${ROLE_COLORS.owner}, #b45309)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 17,
                      fontWeight: 700,
                    }}
                  >
                    {getInitial(room.hostName)}
                  </div>
                  {/* Crown badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: TUI.colors.G1,
                      border: `1.5px solid ${TUI.colors.G2}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Crown size={9} color={ROLE_COLORS.owner} />
                  </div>
                </div>
                {/* Host info */}
                <div>
                  <p
                    style={{
                      fontSize: TUI.font.body14.size,
                      fontWeight: 500,
                      color: TUI.colors.white,
                    }}
                  >
                    {room.hostName}
                  </p>
                  <p
                    style={{
                      fontSize: TUI.font.captionG5.size,
                      color: TUI.colors.G5,
                    }}
                  >
                    مالك الغرفة
                  </p>
                </div>
              </div>

              {/* ── Stats Grid (2 cols) ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                {/* Participants */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: TUI.radius.lg,
                    background: TUI.colors.bgInput,
                    textAlign: 'center',
                  }}
                >
                  <Users size={18} color={TUI.colors.B1d} />
                  <p
                    style={{
                      fontSize: TUI.font.title16.size,
                      fontWeight: 600,
                      color: TUI.colors.white,
                      marginTop: 4,
                    }}
                  >
                    {participantCount}
                  </p>
                  <p
                    style={{
                      fontSize: TUI.font.captionG5.size,
                      color: TUI.colors.G5,
                      marginTop: 2,
                    }}
                  >
                    مشارك
                  </p>
                </div>
                {/* Weekly Gems */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: TUI.radius.lg,
                    background: TUI.colors.bgInput,
                    textAlign: 'center',
                  }}
                >
                  <Heart size={18} color={TUI.colors.likeRed} />
                  <p
                    style={{
                      fontSize: TUI.font.title16.size,
                      fontWeight: 600,
                      color: TUI.colors.white,
                      marginTop: 4,
                    }}
                  >
                    {formatGems(weeklyGems)}
                  </p>
                  <p
                    style={{
                      fontSize: TUI.font.captionG5.size,
                      color: TUI.colors.G5,
                      marginTop: 2,
                    }}
                  >
                    جواهر هذا الأسبوع
                  </p>
                </div>
              </div>

              {/* ── Room Details List ── */}
              <div>
                <p
                  style={{
                    fontSize: TUI.font.body14.size,
                    fontWeight: 500,
                    color: TUI.colors.G7,
                    marginBottom: 8,
                  }}
                >
                  تفاصيل الغرفة
                </p>

                {[
                  { label: 'مقاعد الميكروفون', value: `${room.micSeatCount} مقعد` },
                  { label: 'الحد الأقصى', value: `${room.maxParticipants} مشارك` },
                  {
                    label: 'وضع المقاعد',
                    value: room.isAutoMode ? 'جلوس حر' : 'يحتاج موافقة',
                  },
                  { label: 'المعرف', value: room.id, dir: 'ltr' as const },
                ].map((item, i, arr) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom:
                        i < arr.length - 1
                          ? `1px solid ${TUI.colors.G3Divider}`
                          : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: TUI.font.captionG6.size,
                        color: TUI.colors.G6,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: TUI.font.captionG6.size,
                        color: TUI.colors.G7,
                        direction: item.dir || 'rtl',
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 2 — الأعضاء (Members)
              ────────────────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <motion.div
              key="tab-members"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {sortedMembers.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 0',
                  }}
                >
                  <Users size={36} color={TUI.colors.G5} />
                  <p
                    style={{
                      fontSize: TUI.font.captionG5.size,
                      color: TUI.colors.G5,
                      marginTop: 10,
                    }}
                  >
                    لا يوجد أعضاء بعد
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'clamp(200px, 42vh, 380px)',
                    overflowY: 'auto',
                  }}
                >
                  {sortedMembers.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: idx * 0.03,
                        duration: 0.18,
                        ease: 'easeOut',
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom: `1px solid ${TUI.colors.G3Divider}`,
                      }}
                    >
                      {/* ── Avatar with role‑icon overlay ── */}
                      <div
                        style={{ position: 'relative', flexShrink: 0 }}
                      >
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.displayName}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              background: TUI.colors.seatGray,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: TUI.colors.seatGray,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: TUI.colors.G6,
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            {getInitial(p.displayName)}
                          </div>
                        )}
                        {/* Role icon badge (bottom‑right) */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -1,
                            right: -1,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: TUI.colors.G1,
                            border: `1.5px solid ${TUI.colors.G2}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <RoleIcon role={p.role} size={9} />
                        </div>
                      </div>

                      {/* ── Name + Role Badge + Days Since ── */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: TUI.font.body14.size,
                              fontWeight: 500,
                              color: TUI.colors.white,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.displayName}
                          </span>
                          {/* Role label badge */}
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 500,
                              lineHeight: 1.4,
                              padding: '1px 6px',
                              borderRadius: TUI.radius.sm,
                              whiteSpace: 'nowrap',
                              color: ROLE_COLORS[p.role],
                              backgroundColor: ROLE_COLORS[p.role] + '1a',
                            }}
                          >
                            {ROLE_LABELS[p.role]}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: TUI.font.captionG5.size,
                            color: TUI.colors.G5,
                            marginTop: 2,
                          }}
                        >
                          {p.isOnline ? '🟢 متصل الآن' : `⚫ ${daysSince(p.joinedAt)}`}
                        </p>
                      </div>

                      {/* ── Seat indicator ── */}
                      <span
                        style={{
                          fontSize: TUI.font.captionG5.size,
                          color: TUI.colors.G5,
                          flexShrink: 0,
                        }}
                      >
                        {p.seatIndex >= 0
                          ? `مقعد ${p.seatIndex + 1}`
                          : 'مستمع'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 3 — اللحظات (Moments / Top Gifts)
              ────────────────────────────────────────────────────────── */}
          {activeTab === 'moments' && (
            <motion.div
              key="tab-moments"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {sortedGifts.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 0',
                  }}
                >
                  <Trophy size={36} color={TUI.colors.G5} />
                  <p
                    style={{
                      fontSize: TUI.font.captionG5.size,
                      color: TUI.colors.G5,
                      marginTop: 10,
                    }}
                  >
                    لا توجد لحظات بعد
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'clamp(200px, 42vh, 380px)',
                    overflowY: 'auto',
                  }}
                >
                  {sortedGifts.map((gift, idx) => {
                    const rankBg =
                      idx === 0
                        ? 'linear-gradient(135deg, #f59e0b, #b45309)'
                        : idx === 1
                          ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                          : idx === 2
                            ? 'linear-gradient(135deg, #cd7f32, #a0522d)'
                            : TUI.colors.bgInput;

                    return (
                      <motion.div
                        key={`gift-${idx}-${gift.senderName}-${gift.receiverName}`}
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: idx * 0.04,
                          duration: 0.18,
                          ease: 'easeOut',
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 0',
                          borderBottom: `1px solid ${TUI.colors.G3Divider}`,
                        }}
                      >
                        {/* ── Rank Circle ── */}
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: rankBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {idx === 0 ? (
                            <Crown size={13} color="#fff" />
                          ) : idx === 1 ? (
                            <Star size={13} color="#fff" />
                          ) : idx === 2 ? (
                            <Heart size={13} color="#fff" />
                          ) : (
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: TUI.colors.G6,
                              }}
                            >
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        {/* ── Gift Emoji ── */}
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: TUI.radius.md,
                            background: TUI.colors.bgInput,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                        >
                          {gift.giftEmoji}
                        </div>

                        {/* ── Sender → Receiver Flow ── */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {/* Sender avatar + name */}
                            <img
                              src={gift.senderAvatar}
                              alt={gift.senderName}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                background: TUI.colors.seatGray,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: TUI.font.captionG6.size,
                                fontWeight: 500,
                                color: TUI.colors.G7,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 64,
                              }}
                            >
                              {gift.senderName}
                            </span>

                            {/* Arrow */}
                            <ArrowLeft
                              size={11}
                              color={TUI.colors.G5}
                              style={{ flexShrink: 0 }}
                            />

                            {/* Receiver avatar + name */}
                            <img
                              src={gift.receiverAvatar}
                              alt={gift.receiverName}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                background: TUI.colors.seatGray,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: TUI.font.captionG6.size,
                                fontWeight: 500,
                                color: TUI.colors.G7,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 64,
                              }}
                            >
                              {gift.receiverName}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: '11px',
                              color: TUI.colors.G5,
                              marginTop: 2,
                            }}
                          >
                            {gift.giftName}
                          </p>
                        </div>

                        {/* ── Gem Count ── */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            flexShrink: 0,
                          }}
                        >
                          <Sparkles size={12} color="#f59e0b" />
                          <span
                            style={{
                              fontSize: TUI.font.captionG6.size,
                              fontWeight: 600,
                              color: '#f59e0b',
                            }}
                          >
                            {formatGems(gift.gems)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════
            Bottom Action Buttons — Follow + Join
            ══════════════════════════════════════════════════════════════ */}
        {(onFollow || onJoin) && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 20,
              paddingTop: 16,
              borderTop: `1px solid ${TUI.colors.G3Divider}`,
            }}
          >
            {/* Follow Button */}
            {onFollow && (
              <button
                onClick={onFollow}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: TUI.radius.pill,
                  border: `1.5px solid ${
                    isFollowing ? TUI.colors.B1 : TUI.colors.G3
                  }`,
                  background: isFollowing
                    ? TUI.colors.B1
                    : 'transparent',
                  color: isFollowing
                    ? TUI.colors.white
                    : TUI.colors.G6,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Heart
                  size={15}
                  fill={isFollowing ? '#fff' : 'none'}
                  stroke={isFollowing ? '#fff' : TUI.colors.G6}
                />
                {isFollowing ? 'متابَع' : 'متابعة'}
              </button>
            )}

            {/* Join Button */}
            {onJoin && (
              <button
                onClick={onJoin}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: TUI.radius.pill,
                  border: 'none',
                  background: isJoined
                    ? TUI.colors.green
                    : TUI.colors.B1,
                  color: TUI.colors.white,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {isJoined ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✓
                    </span>
                    في الغرفة
                  </>
                ) : (
                  'انضم'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </BottomSheetOverlay>
  );
}
