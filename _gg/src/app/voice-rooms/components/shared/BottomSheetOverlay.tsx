'use client';

import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { TUI } from '../../types';

interface BottomSheetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  height?: string;
  title?: string;
  zIndex?: number;
  children?: ReactNode;
  showClose?: boolean;
}

export default function BottomSheetOverlay({
  isOpen,
  onClose,
  height = '60%',
  title,
  zIndex = 50,
  children,
  showClose = true,
}: BottomSheetOverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close when clicking the overlay itself, not the sheet content
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop Overlay ── */}
          <motion.div
            className="fixed inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleOverlayClick}
          />

          {/* ── Sheet Panel ── */}
          <motion.div
            className="fixed left-0 right-0 flex flex-col"
            style={{
              bottom: 0,
              height,
              zIndex: zIndex + 1,
              backgroundColor: TUI.colors.G2,
              borderTopLeftRadius: TUI.radius.xl,
              borderTopRightRadius: TUI.radius.xl,
              boxShadow: TUI.shadow.drawer,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'tween',
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1], // cubic-bezier(.4,0,.2,1)
            }}
          >
            {/* ── Drag Indicator ── */}
            <div
              className="flex justify-center pt-2 pb-1"
              style={{ flexShrink: 0 }}
            >
              <div
                className="rounded-full"
                style={{
                  width: 36,
                  height: 4,
                  background: TUI.colors.G5,
                }}
              />
            </div>

            {/* ── Header (48px) ── */}
            <div
              className="flex items-center justify-center relative"
              style={{
                height: 48,
                flexShrink: 0,
                borderBottom: title
                  ? `1px solid ${TUI.colors.strokePrimary}`
                  : 'none',
              }}
            >
              {/* Title — centered */}
              {title && (
                <span
                  className="absolute inset-x-0 text-center"
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: TUI.colors.white,
                  }}
                >
                  {title}
                </span>
              )}

              {/* Close Button — right side */}
              {showClose && (
              <button
                onClick={onClose}
                className="absolute right-4 flex items-center justify-center rounded-full transition-colors"
                style={{
                  width: 32,
                  height: 32,
                  color: TUI.colors.G6,
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
              )}
            </div>

            {/* ── Scrollable Content Area ── */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto tuilivekit-scroll"
              style={{ padding: 24 }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
