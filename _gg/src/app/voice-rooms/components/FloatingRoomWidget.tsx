'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Headphones } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   FloatingRoomWidget — Draggable floating mini-room widget

   - Default position: center-left of the viewport
   - Fully draggable with mouse & touch
   - Position persisted in localStorage so it survives minimize/restore
   - Stays within viewport bounds after drag
   ═══════════════════════════════════════════════════════════════════════ */

interface FloatingRoomWidgetProps {
  roomName: string;
  onClick: () => void;
}

const STORAGE_KEY = 'vr_float_pos';

interface Position {
  x: number; // px from left edge
  y: number; // px from top edge
}

function loadPosition(): Position | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.x === 'number' && typeof p.y === 'number') return p;
    }
  } catch { /* ignore */ }
  return null;
}

function savePosition(pos: Position) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch { /* ignore */ }
}

function getDefaultPosition(): Position {
  // Center-left of viewport
  return {
    x: Math.max(12, window.innerWidth * 0.03),
    y: Math.round(window.innerHeight * 0.45),
  };
}

export default function FloatingRoomWidget({ roomName, onClick }: FloatingRoomWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position | null>(null);
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  }>({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false });

  /* ── Initialize position on mount ── */
  useEffect(() => {
    const saved = loadPosition();
    setPos(saved || getDefaultPosition());
  }, []);

  /* ── Drag handlers (pointer events for unified mouse+touch) ── */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't interfere with clicks on child buttons/links
    if ((e.target as HTMLElement).closest('button, a, input')) return;

    e.preventDefault();
    const widget = widgetRef.current;
    if (!widget || !pos) return;

    widget.setPointerCapture(e.pointerId);

    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    // Only count as a drag if moved more than 5px (avoids accidental click-drags)
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    d.moved = true;

    const widget = widgetRef.current;
    if (!widget) return;

    const newPosX = d.origX + dx;
    const newPosY = d.origY + dy;

    // Clamp to viewport bounds
    const w = widget.offsetWidth;
    const h = widget.offsetHeight;
    const clampedX = Math.max(4, Math.min(window.innerWidth - w - 4, newPosX));
    const clampedY = Math.max(4, Math.min(window.innerHeight - h - 4, newPosY));

    setPos({ x: clampedX, y: clampedY });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging) return;

    const widget = widgetRef.current;
    if (widget) {
      try { widget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }

    // If barely moved, treat as a click (restore room)
    if (!d.moved) {
      onClick();
      d.dragging = false;
      return;
    }

    // Save position after drag ends
    if (pos) {
      savePosition(pos);
    }

    d.dragging = false;
  }, [onClick, pos]);

  // Don't render until position is calculated
  if (!pos) return null;

  return (
    <>
      <div
        ref={widgetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className="fixed flex items-center gap-2 rounded-2xl cursor-grab active:cursor-grabbing touch-manipulation select-none"
        style={{
          left: pos.x,
          top: pos.y,
          zIndex: 100,
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #0D8A7A 0%, #0A6B5E 100%)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 16px rgba(13,138,122,0.3)',
          color: '#fff',
          maxWidth: 220,
          userSelect: 'none',
          touchAction: 'none',
          animation: 'minimizeSlideIn 0.3s ease',
        }}
        role="button"
        aria-label="فتح الغرفة - اسحب للتغيير"
        tabIndex={0}
      >
        {/* Room icon */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Headphones size={18} style={{ color: '#fff' }} />
        </div>

        {/* Room name */}
        <div className="flex flex-col items-start min-w-0" style={{ gap: 1 }}>
          <span
            className="truncate block pointer-events-none"
            style={{ fontSize: 12, fontWeight: 600, lineHeight: '16px', maxWidth: 150 }}
          >
            {roomName}
          </span>
          <span
            className="pointer-events-none"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', lineHeight: '12px' }}
          >
            اسحب للنقل • اضغط للعودة
          </span>
        </div>

        {/* Pulse indicator — room is live */}
        <span
          className="flex-shrink-0 rounded-full pointer-events-none"
          style={{
            width: 8,
            height: 8,
            backgroundColor: '#22c55e',
            boxShadow: '0 0 6px rgba(34,197,94,0.6)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes minimizeSlideIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
