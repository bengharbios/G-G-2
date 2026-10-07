'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Volume1, VolumeX, Music } from 'lucide-react';
import {
  getVolume,
  getMuted,
  setVolume,
  toggleMuted,
  onVolumeChange,
  initVolumeFromStorage,
  playBgMusic,
  pauseBgMusic,
  isBgMusicPlaying,
  enableBgMusicAutoStart,
} from '@/lib/sounds';

export default function VolumeControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [muted, setMutedState] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize volume from localStorage and auto-start background music
  useEffect(() => {
    initVolumeFromStorage();
    setVolumeState(getVolume());
    setMutedState(getMuted());
    setInitialized(true);
    // Auto-start background music on first user interaction
    enableBgMusicAutoStart();
  }, []);

  // Sync music playing state periodically
  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(() => {
      setMusicPlaying(isBgMusicPlaying());
    }, 1000);
    return () => clearInterval(interval);
  }, [initialized]);

  // Subscribe to volume changes
  useEffect(() => {
    if (!initialized) return;
    const unsub = onVolumeChange((vol, mut) => {
      setVolumeState(vol);
      setMutedState(mut);
    });
    return unsub;
  }, [initialized]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleMute = useCallback(() => {
    const newMuted = toggleMuted();
    setMutedState(newMuted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    setVolume(val);
  }, []);

  const handleToggleMusic = useCallback(() => {
    if (isBgMusicPlaying()) {
      pauseBgMusic();
      setMusicPlaying(false);
    } else {
      playBgMusic();
      setMusicPlaying(true);
    }
  }, []);

  const getIcon = () => {
    if (muted || volume === 0) return VolumeX;
    if (volume < 0.4) return Volume1;
    return Volume2;
  };

  const IconComponent = getIcon();

  return (
    <div className="fixed top-16 right-5 z-[100]" dir="ltr">
      {/* Volume panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 350, damping: 30 }}
            className="absolute top-16 right-0 bg-slate-900/95 backdrop-blur-md border border-slate-600/40 rounded-2xl p-4 shadow-2xl w-56"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">🔊 التحكم بالصوت</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {muted ? 'كتم' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* Mute toggle button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleMute}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 mb-3 text-sm font-bold transition-all duration-200 cursor-pointer ${
                muted
                  ? 'bg-red-950/60 border border-red-500/40 text-red-300'
                  : 'bg-green-950/40 border border-green-500/30 text-green-300'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {muted ? 'مكتوم' : 'مشغّل'}
            </motion.button>

            {/* Volume slider */}
            <div className="mb-3">
              <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    width: `${volume * 100}%`,
                    background: muted
                      ? '#ef4444'
                      : 'linear-gradient(to right, #22c55e, #eab308, #ef4444)',
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex justify-between mb-3">
              {[
                { label: 'كتم', value: 0 },
                { label: 'منخفض', value: 0.25 },
                { label: 'متوسط', value: 0.5 },
                { label: 'عالي', value: 0.75 },
                { label: 'أقصى', value: 1 },
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setVolumeState(preset.value);
                    setVolume(preset.value);
                  }}
                  className={`text-[9px] px-2 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
                    Math.abs(volume - preset.value) < 0.05
                      ? 'bg-amber-500/80 text-black font-bold'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Background music toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleMusic}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs transition-all duration-200 cursor-pointer ${
                musicPlaying
                  ? 'bg-purple-950/60 border border-purple-500/40 text-purple-300'
                  : 'bg-slate-800/50 border border-slate-600/30 text-slate-400'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              {musicPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
          muted
            ? 'bg-red-950/80 border-2 border-red-500/50 hover:bg-red-900/80'
            : isOpen
              ? 'bg-slate-700/90 border-2 border-slate-500/50 hover:bg-slate-600/90'
              : 'bg-slate-800/90 border-2 border-slate-600/40 hover:bg-slate-700/90'
        }`}
      >
        <IconComponent
          className={`w-5.5 h-5.5 transition-colors duration-200 ${
            muted ? 'text-red-400' : 'text-slate-200'
          }`}
        />

        {/* Sound wave pulse when active */}
        {!muted && volume > 0 && !isOpen && (
          <>
            <motion.div
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.3, 0.1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full border border-slate-400/30"
            />
            <motion.div
              animate={{
                scale: [1, 1.7, 2.4],
                opacity: [0.2, 0.08, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.4,
              }}
              className="absolute inset-0 rounded-full border border-slate-400/20"
            />
          </>
        )}

        {/* Muted badge */}
        {muted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-900"
          >
            <span className="text-[9px] text-white font-bold">×</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
