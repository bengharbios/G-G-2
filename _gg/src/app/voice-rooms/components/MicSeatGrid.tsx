'use client';

import { Mic } from 'lucide-react';
import type { SeatData, RoomRole } from '../types';
import { TUI } from '../types';
import MicSeat from './MicSeat';

/* ═══════════════════════════════════════════════════════════════════════
   MicSeatGrid — Old-style 5-column grid with section header

   Layout: section with border-b, flex-shrink-0
   Header: "المنابر الصوتية" label + "N مايك" badge
   Grid: CSS grid, 5 columns, responsive gap
   ═══════════════════════════════════════════════════════════════════════ */

interface MicSeatGridProps {
  seats: SeatData[];
  currentUserId: string;
  myRole: RoomRole;
  hostId: string;
  onSeatClick: (seatIndex: number) => void;
}

export default function MicSeatGrid({
  seats,
  currentUserId,
  myRole,
  hostId,
  onSeatClick,
}: MicSeatGridProps) {
  const isOwner = myRole === 'owner';
  const activeSeatCount = seats.filter(s => s.participant !== null).length;

  return (
    <section
      className="w-full flex-shrink-0"
      style={{
        padding: '12px 12px 8px',
        borderBottom: `1px solid ${TUI.colors.G3Divider}`,
      }}
    >
      {/* ── Section Header ── */}
      <div
        className="flex items-center mb-2.5"
        style={{ gap: 8 }}
      >
        <div className="flex items-center" style={{ gap: 6 }}>
          <Mic size={14} style={{ color: TUI.colors.G5 }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: TUI.colors.G7,
            }}
          >
            المنابر الصوتية
          </span>
        </div>

        {/* Seat count badge */}
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            minWidth: 20,
            height: 18,
            padding: '0 6px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            fontSize: 11,
            fontWeight: 500,
            color: TUI.colors.G6,
          }}
        >
          {activeSeatCount} مايك
        </span>
      </div>

      {/* ── 5-Column Grid ── */}
      <div
        className="grid w-full justify-items-center"
        style={{
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px 6px',
        }}
      >
        {seats.map((seat) => {
          const isSeatOwner =
            seat.participant !== null && seat.participant.userId === currentUserId && isOwner;

          return (
            <MicSeat
              key={seat.seatIndex}
              seatData={seat}
              isOwner={isSeatOwner}
              isSpeaking={false}
              onClick={() => onSeatClick(seat.seatIndex)}
            />
          );
        })}
      </div>
    </section>
  );
}
