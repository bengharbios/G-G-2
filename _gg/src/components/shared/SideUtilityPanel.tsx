'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Volume1, VolumeX, Music, Wrench, Palette, BarChart3, HelpCircle, Settings } from 'lucide-react';
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

// ─── Props ───────────────────────────────────────────────────────────

interface SideUtilityPanelProps {
  open: boolean;
  onToggle: () => void;
}

// ─── Component ──────────────────────────────────────────────────────

export default function SideUtilityPanel({ open, onToggle }: SideUtilityPanelProps) {
  const [volume, setVolumeState] = useState(0.5);
  const [muted, setMutedState] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ── Initialize on mount ──────────────────────────────────────────
  useEffect(() => {
    initVolumeFromStorage();
    enableBgMusicAutoStart();
    const vol = getVolume();
    const mut = getMuted();
    setTimeout(() => {
      setVolumeState(vol);
      setMutedState(mut);
      setInitialized(true);
    }, 0);
  }, []);

  // ── Sync music playing state periodically ────────────────────────
  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(() => {
      setMusicPlaying(isBgMusicPlaying());
    }, 1500);
    return () => clearInterval(interval);
  }, [initialized]);

  // ── Subscribe to volume changes ──────────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    const unsub = onVolumeChange((vol, mut) => {
      setVolumeState(vol);
      setMutedState(mut);
    });
    return unsub;
  }, [initialized]);

  // ── Handlers ─────────────────────────────────────────────────────
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

  // Compute volume icon inline (not a component) to avoid render-time creation
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.4 ? Volume1 : Volume2;

  // ── Placeholder menu items ──────────────────────────────────────
  const placeholderItems = [
    { icon: Palette, label: 'المظهر', emoji: '🎨', disabled: true },
    { icon: BarChart3, label: 'الإحصائيات', emoji: '📊', disabled: true },
    { icon: HelpCircle, label: 'المساعدة', emoji: '❓', disabled: true },
    { icon: Settings, label: 'الإعدادات', emoji: '⚙️', disabled: true },
  ];

  return (
    <>
      {/* Semi-transparent backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            data-gg-hide="panel-backdrop"
            className="fixed inset-0 bg-black/40 z-50"
          />
        )}
      </AnimatePresence>

      {/* Slide-out panel — RTL: slides from left edge */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            data-gg-hide="side-panel"
            className="fixed top-0 left-0 z-50 h-full w-[200px] sm:w-[220px] bg-slate-900/95 backdrop-blur-xl border-r border-white/[0.08] shadow-2xl shadow-black/60 flex flex-col"
            dir="rtl"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-slate-300">الأدوات</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <span className="text-sm leading-none">✕</span>
              </motion.button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
              {/* ── Sound control section ─────────────────────────── */}
              <div className="mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">
                  🔊 الصوت
                </p>

                {/* Mute toggle row */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToggleMute}
                  className={`w-full flex items-center gap-2.5 rounded-xl py-2.5 px-3 text-sm transition-all duration-200 cursor-pointer ${
                    muted
                      ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                      : 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-300'
                  }`}
                >
                  <VolumeIcon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold flex-1 text-right">
                    {muted ? 'مكتوم' : 'مشغّل'}
                  </span>
                  {/* Toggle indicator */}
                  <div className={`w-8 h-[18px] rounded-full relative transition-colors duration-200 ${
                    muted ? 'bg-red-500/30' : 'bg-emerald-500/30'
                  }`}>
                    <motion.div
                      animate={{ x: muted ? 0 : 14 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-[2px] w-[14px] h-[14px] rounded-full ${
                        muted ? 'bg-red-400' : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                </motion.button>

                {/* Volume slider row */}
                <div className="px-1 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">مستوى الصوت</span>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                      {muted ? 'كتم' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                  <div className="relative w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
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

                {/* Background music toggle */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToggleMusic}
                  className={`w-full flex items-center gap-2.5 rounded-xl py-2.5 px-3 text-sm transition-all duration-200 cursor-pointer ${
                    musicPlaying
                      ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300'
                      : 'bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Music className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold flex-1 text-right">
                    {musicPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
                  </span>
                  {/* Toggle indicator */}
                  <div className={`w-8 h-[18px] rounded-full relative transition-colors duration-200 ${
                    musicPlaying ? 'bg-amber-500/30' : 'bg-slate-600/30'
                  }`}>
                    <motion.div
                      animate={{ x: musicPlaying ? 14 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-[2px] w-[14px] h-[14px] rounded-full ${
                        musicPlaying ? 'bg-amber-400' : 'bg-slate-500'
                      }`}
                    />
                  </div>
                </motion.button>
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06] my-2" />

              {/* ── Placeholder items ──────────────────────────────── */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">
                  ⚡ المزيد
                </p>

                {placeholderItems.map((item) => (
                  <motion.div
                    key={item.label}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center gap-2.5 rounded-xl py-2.5 px-3 text-sm bg-slate-800/20 border border-slate-700/20 text-slate-500 cursor-not-allowed opacity-60"
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold flex-1 text-right">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-600">قريباً</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Panel footer */}
            <div className="px-4 py-2.5 border-t border-white/[0.06]">
              <p className="text-[9px] text-slate-600 text-center">
                ألعاب الغريب v1.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle pill button (visible when closed) — RTL: on left edge */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            data-gg-hide="panel-toggle"
            className="fixed top-1/2 -translate-y-1/2 left-0 z-50 w-10 h-16 rounded-l-xl rounded-r-none bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] border-r-0 shadow-lg shadow-black/30 flex items-center justify-center hover:bg-slate-800/90 transition-colors cursor-pointer group"
          >
            <Wrench className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
