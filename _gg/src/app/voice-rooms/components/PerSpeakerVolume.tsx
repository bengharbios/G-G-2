'use client';

import { useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { TUI } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   PerSpeakerVolume — VolumeSlider component & useSpeakerVolume hook

   VolumeSlider: compact vertical volume control for a single speaker,
   designed to live inside mic menu / sheet contexts.

   useSpeakerVolume: manages a Map<string, number> (userId → 0-100)
   with sensible defaults for getVolume.
   ═══════════════════════════════════════════════════════════════════════ */

// ─── VolumeSlider Component ────────────────────────────────────────────────────

interface VolumeSliderProps {
  /** Current volume level 0-100 */
  volume: number;
  /** Called when the user changes volume (0-100) */
  onChange: (vol: number) => void;
  /** Display name of the participant */
  participantName: string;
}

export function VolumeSlider({ volume, onChange, participantName }: VolumeSliderProps) {
  const isMuted = volume === 0;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  const toggleMute = useCallback(() => {
    onChange(isMuted ? 100 : 0);
  }, [isMuted, onChange]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        direction: 'rtl',
      }}
    >
      {/* Participant name (truncated) */}
      <span
        style={{
          fontSize: TUI.font.captionG5.size,
          color: isMuted ? TUI.colors.G4 : TUI.colors.G6,
          fontWeight: 500,
          maxWidth: 56,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
        title={participantName}
      >
        {participantName}
      </span>

      {/* Speaker icon + Mute button */}
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute speaker' : 'Mute speaker'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: TUI.radius.circle,
          backgroundColor: isMuted
            ? 'rgba(252, 85, 85, 0.15)'
            : 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'background-color 0.2s ease',
        }}
      >
        {isMuted ? (
          <VolumeX size={16} color={TUI.colors.red} />
        ) : (
          <Volume2 size={16} color={TUI.colors.G7} />
        )}
      </button>

      {/* Vertical slider track */}
      <div
        style={{
          position: 'relative',
          width: 4,
          height: 80,
          borderRadius: 2,
          backgroundColor: TUI.colors.sliderEmpty,
          cursor: 'pointer',
        }}
      >
        {/* Filled portion (bottom-up) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${volume}%`,
            borderRadius: 2,
            backgroundColor: isMuted ? TUI.colors.red : TUI.colors.sliderFilled,
            transition: 'height 0.1s ease, background-color 0.2s ease',
          }}
        />

        {/* Native range input overlaid for interaction (vertical via CSS) */}
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleSliderChange}
          aria-label={`Volume for ${participantName}`}
          style={{
            position: 'absolute',
            margin: 0,
            padding: 0,
            appearance: 'none' as React.CSSProperties['appearance'],
            WebkitAppearance: 'none' as React.CSSProperties['WebkitAppearance'],
            background: 'transparent',
            outline: 'none',
            cursor: 'pointer',
            /* Rotate -90deg so left→right maps to bottom→top visually */
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center',
            /* Size the rotated input to cover the track */
            width: 80,
            height: 4,
            top: '50%',
            left: '50%',
            marginLeft: -40,
            marginTop: -2,
          }}
        />
      </div>

      {/* Percentage label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: isMuted ? TUI.colors.red : TUI.colors.G6,
          direction: 'ltr',
          lineHeight: 1,
        }}
      >
        {volume}%
      </span>
    </div>
  );
}

// ─── useSpeakerVolume Hook ────────────────────────────────────────────────────

interface SpeakerVolumeState {
  /** Map of userId → volume (0-100) */
  volumes: Map<string, number>;
  /** Set volume for a specific user */
  setVolume: (userId: string, vol: number) => void;
  /** Get volume for a specific user (returns 100 if not set) */
  getVolume: (userId: string) => number;
}

export function useSpeakerVolume(): SpeakerVolumeState {
  const [volumes, setVolumes] = useState<Map<string, number>>(new Map());

  const setVolume = useCallback((userId: string, vol: number) => {
    setVolumes((prev) => {
      const next = new Map(prev);
      next.set(userId, Math.max(0, Math.min(100, vol)));
      return next;
    });
  }, []);

  const getVolume = useCallback(
    (userId: string): number => {
      return volumes.get(userId) ?? 100;
    },
    [volumes],
  );

  return { volumes, setVolume, getVolume };
}
