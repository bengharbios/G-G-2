'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Gem, Sparkles, UsersRound, Mic, UserCheck } from 'lucide-react';
import { TUI, GIFT_CATEGORIES, DEFAULT_GIFTS, GIFT_GRADES, type Gift } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   GiftSheet — 17ae.com Professional Gift Store Design
   
   Dark background (#10111A), 4-column gift grid, horizontal category tabs,
   quantity selector, grade badges, NEW/FX badges.
   
   NO BottomSheetOverlay — uses AnimatePresence directly (matching SettingsSheet pattern).
   ═══════════════════════════════════════════════════════════════════════ */

interface GiftSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (giftId: string, quantity: number, recipient: { type: 'everyone' | 'mic' | 'specific', userId?: string }) => void;
  gems: number;
  preselectedRecipient?: { type: 'everyone' | 'mic' | 'specific', userId?: string; displayName?: string } | null;
  micParticipants?: Array<{ userId: string; displayName: string; avatar?: string }>;
}

// Quantity options
const QUANTITY_OPTIONS = [1, 10, 66, 99];

// Format price display
function formatPrice(price: number): string {
  if (price >= 10000) return `${(price / 1000).toFixed(0)}K`;
  if (price >= 1000) return `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}K`;
  return String(price);
}

// Get grade color for badge
function getGradeColor(grade: number): string {
  const g = GIFT_GRADES[grade as keyof typeof GIFT_GRADES];
  return g?.color || '#8F9AB2';
}

export default function GiftSheet({ isOpen, onClose, onSendGift, gems, preselectedRecipient, micParticipants }: GiftSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [recipientMode, setRecipientMode] = useState<'everyone' | 'mic' | 'specific'>(
    preselectedRecipient?.type || 'everyone',
  );
  const [selectedParticipant, setSelectedParticipant] = useState<{ userId: string; displayName: string } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeTabScroll, setActiveTabScroll] = useState(false);

  // Filtered gifts for current category
  const filteredGifts = useMemo(
    () => DEFAULT_GIFTS.filter((g) => g.category === selectedCategory),
    [selectedCategory],
  );

  // Can send check
  const canSend = selectedGift !== null && selectedGift.price * quantity <= gems;

  // Handle category change
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedGift(null);
  };

  // Handle send
  const handleSend = () => {
    if (selectedGift && canSend) {
      const specificUserId = preselectedRecipient?.userId || selectedParticipant?.userId;
      const recipient = {
        type: recipientMode,
        userId: recipientMode === 'specific' ? specificUserId : undefined,
      };
      if (recipientMode === 'specific' && !recipient.userId) return;
      onSendGift(selectedGift.id, quantity, recipient);
      setSelectedGift(null);
      setQuantity(1);
      setSelectedParticipant(null);
    }
  };

  // Handle mode change — reset participant selection when leaving 'specific' mode
  const handleRecipientModeChange = (mode: 'everyone' | 'mic' | 'specific') => {
    setRecipientMode(mode);
    if (mode !== 'specific') setSelectedParticipant(null);
  };

  // Handle close
  const handleClose = () => {
    setSelectedGift(null);
    setQuantity(1);
    setSelectedParticipant(null);
    onClose();
  };

  // Scroll detection for tabs shadow
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const handleScroll = () => {
      setActiveTabScroll(el.scrollLeft > 4);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            onClick={handleClose}
          />

          {/* Gift Panel */}
          <motion.div
            className="relative w-full flex flex-col"
            style={{
              maxHeight: '85vh',
              borderTopLeftRadius: TUI.radius.xl,
              borderTopRightRadius: TUI.radius.xl,
              overflow: 'hidden',
              zIndex: 1,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            dir="rtl"
          >
            {/* ═══════════════════════════════════════════════════════════════
                Header — Dark with teal accent
                ═══════════════════════════════════════════════════════════════ */}
            <div
              className="flex items-center justify-between shrink-0 relative"
              style={{
                height: 52,
                background: '#10111A',
                borderTopLeftRadius: TUI.radius.xl,
                borderTopRightRadius: TUI.radius.xl,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Drag indicator */}
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2"
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.15)',
                }}
              />
              {/* Title */}
              <div className="flex items-center gap-2 absolute" style={{ right: 16 }}>
                <Gem size={18} fill={TUI.colors.gold} stroke={TUI.colors.gold} />
                <span style={{ fontSize: 17, fontWeight: 700, color: TUI.colors.white }}>
                  متجر الهدايا
                </span>
              </div>
              {/* Gems balance */}
              <div
                className="flex items-center gap-1 absolute"
                style={{ left: 16 }}
              >
                <Gem size={14} fill={TUI.colors.gold} stroke={TUI.colors.gold} />
                <span style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.gold }}>
                  {gems.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                Category Tabs — Horizontal scroll with pill buttons
                ═══════════════════════════════════════════════════════════════ */}
            <div
              ref={tabsRef}
              className="flex items-center shrink-0 overflow-x-auto scrollbar-hide"
              style={{
                height: 44,
                padding: '0 12px',
                gap: 8,
                background: '#10111A',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                boxShadow: activeTabScroll ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                transition: 'box-shadow 0.2s ease',
              }}
            >
              {GIFT_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-none cursor-pointer touch-manipulation transition-all"
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? TUI.colors.white : TUI.colors.G5,
                      backgroundColor: isActive
                        ? 'rgba(13, 138, 122, 0.25)'
                        : 'rgba(255,255,255,0.04)',
                      border: isActive
                        ? '1.5px solid rgba(13, 138, 122, 0.5)'
                        : '1.5px solid transparent',
                      backdropFilter: isActive ? 'blur(4px)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{cat.icon}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                Recipient Selection Bar
                ═══════════════════════════════════════════════════════════════ */}
            <div
              className="flex items-center shrink-0"
              style={{
                height: 44,
                padding: '0 12px',
                gap: 8,
                background: '#10111A',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {(
                [
                  { key: 'everyone' as const, label: 'للجميع', icon: UsersRound },
                  { key: 'mic' as const, label: 'على المايك', icon: Mic },
                  { key: 'specific' as const, label: 'لشخص محدد', icon: UserCheck },
                ] as const
              ).map((opt) => {
                const isActive = recipientMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleRecipientModeChange(opt.key)}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-none cursor-pointer touch-manipulation transition-all"
                    style={{
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? TUI.colors.white : TUI.colors.G5,
                      backgroundColor: isActive
                        ? 'rgba(13, 138, 122, 0.25)'
                        : 'rgba(255,255,255,0.04)',
                      border: isActive
                        ? '1.5px solid rgba(13, 138, 122, 0.5)'
                        : '1.5px solid transparent',
                    }}
                  >
                    <opt.icon size={13} />
                    {opt.label}
                  </button>
                );
              })}
              {/* Selected participant name */}
              {((preselectedRecipient?.displayName && recipientMode === 'specific') || (selectedParticipant && recipientMode === 'specific')) && (
                <span
                  className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-full"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: TUI.colors.tealLight,
                    backgroundColor: 'rgba(13, 138, 122, 0.12)',
                  }}
                >
                  إرسال إلى: {preselectedRecipient?.displayName || selectedParticipant?.displayName}
                </span>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                Participant Selection List — when "لشخص محدد" without preselected
                ═══════════════════════════════════════════════════════════════ */}
            {recipientMode === 'specific' && !preselectedRecipient?.userId && (micParticipants && micParticipants.length > 0) && (
              <div
                className="shrink-0 overflow-x-auto"
                style={{
                  background: '#10111A',
                  padding: '8px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2" style={{ minWidth: 'max-content' }}>
                  {micParticipants.map((p) => {
                    const isSelected = selectedParticipant?.userId === p.userId;
                    return (
                      <button
                        key={p.userId}
                        onClick={() => setSelectedParticipant({ userId: p.userId, displayName: p.displayName })}
                        className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-full border-none cursor-pointer touch-manipulation transition-all"
                        style={{
                          fontSize: 11,
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? TUI.colors.white : TUI.colors.G5,
                          backgroundColor: isSelected
                            ? 'rgba(13, 138, 122, 0.25)'
                            : 'rgba(255,255,255,0.04)',
                          border: isSelected
                            ? '1.5px solid rgba(13, 138, 122, 0.5)'
                            : '1.5px solid transparent',
                        }}
                      >
                        <div
                          className="shrink-0 overflow-hidden rounded-full"
                          style={{ width: 20, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 9, color: TUI.colors.G5 }}>
                              {p.displayName.charAt(0)}
                            </div>
                          )}
                        </div>
                        {p.displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                Gift Grid — 4 columns, scrollable
                ═══════════════════════════════════════════════════════════════ */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                background: '#10111A',
                padding: '10px 8px',
              }}
            >
              {filteredGifts.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center"
                  style={{ padding: '40px 0', gap: 8 }}
                >
                  <span style={{ fontSize: 32 }}>🎁</span>
                  <span style={{ fontSize: 13, color: TUI.colors.G5 }}>لا توجد هدايا في هذه الفئة</span>
                </div>
              ) : (
                <div
                  className="grid grid-cols-4"
                  style={{ gap: 8 }}
                >
                  {filteredGifts.map((gift) => {
                    const isSelected = selectedGift?.id === gift.id;
                    const hasFullscreen = gift.bmType === 1;
                    return (
                      <button
                        key={gift.id}
                        onClick={() => setSelectedGift(isSelected ? null : gift)}
                        className="flex flex-col items-center justify-center relative overflow-hidden cursor-pointer touch-manipulation"
                        style={{
                          minHeight: 100,
                          padding: '8px 4px 6px',
                          backgroundColor: isSelected
                            ? 'rgba(13, 138, 122, 0.12)'
                            : 'rgba(255,255,255,0.04)',
                          border: isSelected
                            ? `2px solid ${TUI.colors.teal}`
                            : '2px solid rgba(255,255,255,0.06)',
                          borderRadius: TUI.radius.lg,
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected
                            ? `0 0 16px rgba(13, 138, 122, 0.2)`
                            : 'none',
                        }}
                      >
                        {/* Gift emoji or custom image */}
                        <div className="relative mb-1">
                          {gift.giftImageUrl ? (
                            <img
                              src={gift.giftImageUrl}
                              alt={gift.nameAr}
                              className="rounded-lg"
                              style={{ width: 48, height: 48, objectFit: 'contain' }}
                              draggable={false}
                            />
                          ) : (
                            <span style={{ fontSize: 34, lineHeight: 1 }}>{gift.emoji}</span>
                          )}

                          {/* NEW badge */}
                          {gift.isNew && (
                            <span
                              className="absolute flex items-center justify-center"
                              style={{
                                top: -6,
                                right: -10,
                                padding: '1px 4px',
                                borderRadius: 4,
                                backgroundColor: TUI.colors.red,
                                fontSize: 7,
                                fontWeight: 700,
                                color: TUI.colors.white,
                                letterSpacing: '0.5px',
                                boxShadow: `0 1px 4px ${TUI.colors.red}`,
                              }}
                            >
                              NEW
                            </span>
                          )}

                          {/* FX badge (fullscreen effect) */}
                          {hasFullscreen && (
                            <span
                              className="absolute flex items-center justify-center rounded-full"
                              style={{
                                top: -5,
                                left: -8,
                                width: 16,
                                height: 16,
                                backgroundColor: 'rgba(175, 82, 222, 0.9)',
                                fontSize: 6,
                                fontWeight: 800,
                                color: TUI.colors.white,
                                border: '1.5px solid rgba(16, 17, 26, 0.9)',
                                boxShadow: '0 1px 4px rgba(175,82,222,0.4)',
                              }}
                            >
                              FX
                            </span>
                          )}
                        </div>

                        {/* Gift name */}
                        <span
                          className="truncate w-full text-center px-0.5"
                          style={{
                            fontSize: 10,
                            color: isSelected ? TUI.colors.tealLight : TUI.colors.G6,
                            fontWeight: isSelected ? 600 : 400,
                            lineHeight: '14px',
                            marginBottom: 2,
                          }}
                        >
                          {gift.nameAr}
                        </span>

                        {/* Grade dot + price */}
                        <div className="flex items-center gap-1">
                          {/* Grade indicator dot */}
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: getGradeColor(gift.grade),
                              flexShrink: 0,
                              boxShadow: `0 0 4px ${getGradeColor(gift.grade)}40`,
                            }}
                          />
                          {/* Price in gold */}
                          <span
                            className="flex items-center gap-0.5"
                            style={{
                              fontSize: 10,
                              color: TUI.colors.gold,
                              fontWeight: 500,
                            }}
                          >
                            <Gem size={8} fill={TUI.colors.gold} stroke={TUI.colors.gold} />
                            {formatPrice(gift.price)}
                          </span>
                        </div>

                        {/* Selected overlay with "إرسال" */}
                        {isSelected && (
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                              backgroundColor: 'rgba(13, 138, 122, 0.08)',
                              borderRadius: TUI.radius.lg,
                            }}
                          >
                            <span
                              className="px-2.5 py-0.5 rounded-full"
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: TUI.colors.white,
                                backgroundColor: TUI.colors.teal,
                                boxShadow: `0 2px 8px ${TUI.colors.teal}60`,
                              }}
                            >
                              إرسال
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                Bottom Bar — Quantity selector + Send button
                ═══════════════════════════════════════════════════════════════ */}
            <div
              className="flex items-center justify-between shrink-0"
              style={{
                height: 56,
                padding: '0 12px',
                paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
                background: '#0D0E16',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                gap: 10,
              }}
            >
              {/* Quantity selector */}
              <div
                className="flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '4px',
                }}
              >
                {QUANTITY_OPTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className="flex items-center justify-center cursor-pointer touch-manipulation border-none"
                    style={{
                      width: q === 1 ? 36 : 32,
                      height: 32,
                      borderRadius: 8,
                      fontSize: q === 1 ? 13 : 11,
                      fontWeight: quantity === q ? 700 : 500,
                      color: quantity === q ? TUI.colors.white : TUI.colors.G5,
                      backgroundColor: quantity === q
                        ? 'rgba(13, 138, 122, 0.3)'
                        : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ×{q}
                  </button>
                ))}
              </div>

              {/* Send button (teal gradient) */}
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex items-center justify-center gap-2 cursor-pointer touch-manipulation border-none shrink-0"
                style={{
                  height: 40,
                  padding: '0 20px',
                  borderRadius: '12px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: TUI.colors.white,
                  background: canSend
                    ? `linear-gradient(135deg, ${TUI.colors.tealDark}, ${TUI.colors.teal}, ${TUI.colors.tealLight})`
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: canSend
                    ? `0 2px 12px ${TUI.colors.teal}50`
                    : 'none',
                  transition: 'all 0.2s ease',
                  opacity: canSend ? 1 : 0.5,
                  minWidth: 100,
                }}
              >
                <Send size={15} />
                <span>
                  {selectedGift ? `إرسال (${formatPrice(selectedGift.price * quantity)})` : 'إرسال'}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
