'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useGameStore } from '@/lib/game-store';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Wifi,
  Globe,
  Play,
  LogIn,
  Users,
  Gamepad2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { t } from '@/lib/i18n';

export default function LobbyPage() {
  const lang = useGameStore((s) => s.lang);
  const setLang = useGameStore((s) => s.setLang);
  const tr = useMemo(() => t(lang), [lang]);
  const router = useRouter();

  const [joinCode, setJoinCode] = useState('');
  const [showModeOptions, setShowModeOptions] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<'start' | 'join' | null>(null);

  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');

  // العراب mode - narrator enters names, goes to setup with diwaniyaMode=false
  const handleGodfatherMode = () => {
    useGameStore.getState().setDiwaniyaMode(false);
    useGameStore.getState().setDiwaniyaRoom('', '');
    useGameStore.getState().setPhase('setup');
  };

  // الديوانية mode - goes to setup with diwaniyaMode=true
  const handleDiwaniyaMode = () => {
    useGameStore.getState().setDiwaniyaMode(true);
    useGameStore.getState().setPhase('setup');
  };

  // Join game with code
  const handleJoinGame = () => {
    if (joinCode.trim().length >= 3) {
      router.push(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  // Deterministic stars
  const stars = useMemo(() => Array.from({ length: 30 }).map((_, i) => {
    const s1 = ((i * 9301 + 49297) % 233280) / 233280;
    const s2 = ((i * 4127 + 7919) % 233280) / 233280;
    const s3 = ((i * 6271 + 3571) % 233280) / 233280;
    const s4 = ((i * 7549 + 9341) % 233280) / 233280;
    const s5 = ((i * 5381 + 6689) % 233280) / 233280;
    return { w: s1 * 3 + 1, h: s2 * 3 + 1, t: s3 * 100, l: s4 * 100, d: s5 * 3, dur: s1 * 3 + 2 };
  }), []);

  const embers = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
    left: 10 + (((i * 9301 + 49297) % 233280) / 233280) * 80,
    bottom: (((i * 4127 + 7919) % 233280) / 233280) * 20,
    delay: (((i * 6271 + 3571) % 233280) / 233280) * 5,
    duration: 4 + (((i * 7549 + 9341) % 233280) / 233280) * 6,
  })), []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-night gradient-mesh relative overflow-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              width: star.w + 'px',
              height: star.h + 'px',
              top: star.t + '%',
              left: star.l + '%',
              animationDelay: star.d + 's',
              animationDuration: star.dur + 's',
            }}
          />
        ))}
        {embers.map((ember, i) => (
          <div
            key={`ember-${i}`}
            className="ember"
            style={{
              left: `${ember.left}%`,
              bottom: `${ember.bottom}%`,
              animationDelay: `${ember.delay}s`,
              animationDuration: `${ember.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Language toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleLang}
        className="fixed top-4 right-4 z-50 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:text-sky-400 glass-subtle transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        {lang === 'ar' ? 'EN' : 'عربي'}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto"
      >
        {/* Game Logo & Title */}
        <div className="text-center mb-8 sm:mb-10 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-72 sm:h-72 morph-blob bg-gradient-to-br from-red-900/20 via-purple-900/15 to-blue-900/20 -z-10" />

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', bounce: 0.4 }}
            className="text-7xl sm:text-8xl mb-4 sm:mb-5"
          >
            🕴️
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-5xl sm:text-7xl font-black text-gradient-fire mb-3 neon-red text-glow-pulse"
          >
            {tr.gameTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-slate-400 text-sm sm:text-base font-bold tracking-wide"
          >
            {tr.lobbySubtitle}
          </motion.p>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-4">
          {/* === START GAME BUTTON === */}
          <motion.div
            initial={{ opacity: 0, x: lang === 'ar' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onMouseEnter={() => setHoveredBtn('start')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Card
              className={`glass glow-soft rounded-2xl cursor-pointer hover:neon-border transition-all duration-300 ${showModeOptions ? 'neon-border' : ''}`}
              onClick={() => setShowModeOptions(!showModeOptions)}
            >
              <CardContent className="pt-5 pb-5 sm:pt-6 sm:pb-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={hoveredBtn === 'start' ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 border border-red-500/40 flex items-center justify-center shrink-0 pulse-glow-red"
                  >
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </motion.div>

                  <div className="flex-1 text-center sm:text-start">
                    <h2 className="text-lg sm:text-xl font-black text-slate-100">
                      {tr.createGame}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      {tr.createGameDesc}
                    </p>
                  </div>

                  <motion.div
                    animate={{ rotate: showModeOptions ? (lang === 'ar' ? -90 : 90) : 0 }}
                    className="text-slate-500 shrink-0"
                  >
                    <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </motion.div>
                </div>

                {/* Sub-options: العراب / الديوانية */}
                <AnimatePresence>
                  {showModeOptions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-slate-700/40 space-y-3">
                        {/* العراب (Narrator) Mode */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGodfatherMode();
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-red-950/40 to-red-900/20 border border-red-500/20 hover:border-red-500/50 hover:from-red-950/60 hover:to-red-900/30 transition-all cursor-pointer group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-700 to-red-900 border border-red-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <span className="text-xl">🦉</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-slate-100">
                                {tr.godfatherMode}
                              </h3>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                {tr.narratorLabel}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                              {tr.godfatherDesc}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-600 shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                        </motion.div>

                        {/* الديوانية (Diwaniya) Mode */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDiwaniyaMode();
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-950/40 to-purple-900/20 border border-purple-500/20 hover:border-purple-500/50 hover:from-purple-950/60 hover:to-purple-900/30 transition-all cursor-pointer group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-700 to-purple-900 border border-purple-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Wifi className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-slate-100">
                                {tr.diwaniyaMode}
                              </h3>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                Online
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                              {tr.diwaniyaLobbyDesc}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-600 shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* === JOIN GAME BUTTON === */}
          <motion.div
            initial={{ opacity: 0, x: lang === 'ar' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            onMouseEnter={() => setHoveredBtn('join')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Card
              className={`glass glow-soft rounded-2xl cursor-pointer hover:neon-border transition-all duration-300 ${showJoinInput ? 'neon-border' : ''}`}
              onClick={() => setShowJoinInput(!showJoinInput)}
            >
              <CardContent className="pt-5 pb-5 sm:pt-6 sm:pb-6">
                {!showJoinInput ? (
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={hoveredBtn === 'join' ? { scale: 1.1, rotate: -5 } : { scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 border border-purple-500/40 flex items-center justify-center shrink-0 pulse-glow-purple"
                    >
                      <LogIn className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </motion.div>

                    <div className="flex-1 text-center sm:text-start">
                      <h2 className="text-lg sm:text-xl font-black text-slate-100">
                        {tr.joinGame}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                        {tr.joinGameDesc}
                      </p>
                    </div>

                    <motion.div
                      animate={{ rotate: showJoinInput ? (lang === 'ar' ? -90 : 90) : 0 }}
                      className="text-slate-500 shrink-0"
                    >
                      <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 border border-purple-500/40 flex items-center justify-center shrink-0">
                        <LogIn className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-black text-slate-100">
                        {tr.joinGame}
                      </h2>
                    </div>

                    {/* Info about Diwaniya */}
                    <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 mb-3">
                      <p className="text-xs text-purple-300/80 text-center">
                        {tr.diwaniyaLobbyInfo}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                        placeholder={tr.enterRoomCode}
                        className="modern-input text-slate-200 placeholder:text-slate-500 text-sm h-12 rounded-xl flex-1 tracking-widest text-center font-bold text-lg"
                        dir="ltr"
                        maxLength={6}
                        autoFocus
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinGame();
                        }}
                        disabled={joinCode.trim().length < 3}
                        className="bg-gradient-to-l from-purple-700 via-purple-800 to-purple-900 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white font-bold px-5 rounded-xl pulse-glow-purple h-12 transition-all disabled:opacity-50"
                      >
                        {lang === 'ar' ? (
                          <ChevronRight className="w-5 h-5 rotate-180" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 sm:mt-8 flex justify-center gap-6 sm:gap-8 text-center"
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500">{tr.featurePlayers}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500">{tr.featureDiwaniya}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-blue-900/30 border border-blue-500/20 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500">{tr.featureRoles}</span>
          </div>
        </motion.div>

        {/* Footer branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center mt-8 pb-4"
        >
          <span className="text-[10px] sm:text-xs font-bold text-gradient-gold">
            {tr.branding}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
