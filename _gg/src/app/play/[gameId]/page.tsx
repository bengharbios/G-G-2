'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Crown,
  Users,
  ChevronRight,
  Home,
  ArrowRight,
  Sparkles,
  Gamepad2,
  Wifi,
  Play,
  User,
} from 'lucide-react';
import { getGameById, buildJoinUrl, type GameData } from '@/lib/games-data';

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const floatEmoji = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 5, -5, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(245, 158, 11, 0.1)',
      '0 0 40px rgba(245, 158, 11, 0.2)',
      '0 0 20px rgba(245, 158, 11, 0.1)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Theme Color Helpers ──────────────────────────────────────────────────────

function getThemeGradient(game: GameData): string {
  const colorMap: Record<string, string> = {
    'text-red-400': 'from-red-500 via-rose-500 to-red-600',
    'text-orange-400': 'from-orange-500 via-amber-500 to-orange-600',
    'text-purple-400': 'from-purple-500 via-violet-500 to-purple-600',
    'text-amber-400': 'from-amber-500 via-yellow-500 to-amber-600',
    'text-violet-400': 'from-violet-500 via-purple-500 to-violet-600',
    'text-teal-400': 'from-teal-500 via-cyan-500 to-teal-600',
    'text-blue-400': 'from-blue-500 via-indigo-500 to-blue-600',
    'text-pink-400': 'from-pink-500 via-rose-500 to-pink-600',
    'text-emerald-400': 'from-emerald-500 via-green-500 to-emerald-600',
  };
  return colorMap[game.themeColor] || 'from-amber-500 via-yellow-500 to-amber-600';
}

function getThemeGlowColor(game: GameData): string {
  const colorMap: Record<string, string> = {
    'text-red-400': 'rgba(239, 68, 68, 0.3)',
    'text-orange-400': 'rgba(249, 115, 22, 0.3)',
    'text-purple-400': 'rgba(168, 85, 247, 0.3)',
    'text-amber-400': 'rgba(245, 158, 11, 0.3)',
    'text-violet-400': 'rgba(139, 92, 246, 0.3)',
    'text-teal-400': 'rgba(20, 184, 166, 0.3)',
    'text-blue-400': 'rgba(59, 130, 246, 0.3)',
    'text-pink-400': 'rgba(236, 72, 153, 0.3)',
    'text-emerald-400': 'rgba(16, 185, 129, 0.3)',
  };
  return colorMap[game.themeColor] || 'rgba(245, 158, 11, 0.3)';
}

function getThemeSolidColor(game: GameData): string {
  const colorMap: Record<string, string> = {
    'text-red-400': 'bg-red-500',
    'text-orange-400': 'bg-orange-500',
    'text-purple-400': 'bg-purple-500',
    'text-amber-400': 'bg-amber-500',
    'text-violet-400': 'bg-violet-500',
    'text-teal-400': 'bg-teal-500',
    'text-blue-400': 'bg-blue-500',
    'text-pink-400': 'bg-pink-500',
    'text-emerald-400': 'bg-emerald-500',
  };
  return colorMap[game.themeColor] || 'bg-amber-500';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlayGamePage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const gameId = params.gameId;

  const game = useMemo(() => getGameById(gameId), [gameId]);
  const gradient = game ? getThemeGradient(game) : 'from-amber-500 via-yellow-500 to-amber-600';
  const glowColor = game ? getThemeGlowColor(game) : 'rgba(245, 158, 11, 0.3)';
  const solidColor = game ? getThemeSolidColor(game) : 'bg-amber-500';

  // ─── Form State ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'choose' | 'join'>('choose');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handlePlayAsHost = () => {
    router.push(`/${gameId}`);
  };

  const handleShowJoinForm = () => {
    setMode('join');
    setError('');
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('يرجى إدخال اسمك أولاً');
      return;
    }
    if (!roomCode.trim()) {
      setError('يرجى إدخال كود الغرفة');
      return;
    }
    const joinUrl = buildJoinUrl(gameId, roomCode.trim(), playerName.trim());
    router.push(joinUrl);
  };

  const handleBackToChoose = () => {
    setMode('choose');
    setPlayerName('');
    setRoomCode('');
    setError('');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  // ─── 404: Game Not Found ──────────────────────────────────────────────────
  if (!game) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-7xl mb-6">🎮</div>
          <h1 className="text-3xl font-black text-white mb-3">اللعبة غير موجودة</h1>
          <p className="text-slate-400 mb-8">لم نتمكن من العثور على هذه اللعبة</p>
          <Button onClick={handleGoHome} className="gap-2">
            <Home className="w-4 h-4" />
            العودة للرئيسية
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Join Mode ────────────────────────────────────────────────────────────
  if (mode === 'join') {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
            style={{ background: `radial-gradient(circle, ${glowColor}, transparent)` }}
          />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Top Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 sm:px-6 py-4"
          >
            <Button
              variant="ghost"
              onClick={handleBackToChoose}
              className="text-slate-400 hover:text-white gap-1.5"
            >
              <ChevronRight className="w-5 h-5" />
              رجوع
            </Button>
            <Button
              variant="ghost"
              onClick={handleGoHome}
              className="text-slate-500 hover:text-white gap-1.5 text-sm"
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </Button>
          </motion.div>

          {/* Join Content */}
          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-md"
            >
              {/* Game Header */}
              <motion.div variants={itemVariants} className="text-center mb-8">
                <motion.div
                  className="text-5xl sm:text-6xl mb-4 inline-block"
                  {...floatEmoji}
                >
                  {game.emoji}
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{game.title}</h1>
                <p className="text-slate-400 text-sm">انضم إلى غرفة موجودة</p>
              </motion.div>

              {/* Join Card */}
              <motion.div variants={itemVariants}>
                <Card className="bg-slate-900/90 border-slate-800/60 backdrop-blur-md overflow-hidden">
                  {/* Gradient Top Bar */}
                  <div className={`h-1.5 bg-gradient-to-l ${gradient}`} />

                  <CardContent className="p-6 sm:p-8 space-y-6">
                    {/* Player Name Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-400" />
                        اسمك
                      </label>
                      <Input
                        value={playerName}
                        onChange={(e) => {
                          setPlayerName(e.target.value);
                          setError('');
                        }}
                        placeholder="مثال: أحمد..."
                        className="bg-slate-800/80 border-slate-700/60 text-white placeholder:text-slate-500 focus:border-amber-500/50 h-12 text-base"
                        maxLength={20}
                        autoFocus
                      />
                    </div>

                    {/* Room Code Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-amber-400" />
                        كود الغرفة
                      </label>
                      <Input
                        value={roomCode}
                        onChange={(e) => {
                          setRoomCode(e.target.value);
                          setError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleJoinRoom();
                        }}
                        placeholder="أدخل كود الغرفة..."
                        className="bg-slate-800/80 border-slate-700/60 text-white placeholder:text-slate-500 focus:border-amber-500/50 h-12 text-base text-center tracking-widest font-mono"
                        maxLength={10}
                        dir="ltr"
                      />
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-red-400 text-sm text-center font-medium"
                        >
                          ⚠️ {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Join Button */}
                    <Button
                      onClick={handleJoinRoom}
                      className={`w-full h-13 text-base font-bold text-white bg-gradient-to-l ${gradient} hover:opacity-90 transition-opacity gap-2 shadow-lg`}
                      style={{ boxShadow: `0 4px 20px ${glowColor}` }}
                    >
                      <Sparkles className="w-5 h-5" />
                      انضم للغرفة
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Back to Host Option */}
              <motion.div variants={itemVariants} className="text-center mt-6">
                <button
                  onClick={handleBackToChoose}
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  أو العب كمستضيف بدلاً من ذلك ←
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Choose Mode (Default Landing) ────────────────────────────────────────
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main gradient orb */}
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-15 blur-[150px]"
          style={{ background: `radial-gradient(circle, ${glowColor}, transparent)` }}
        />
        {/* Secondary orb */}
        <div
          className="absolute bottom-[-100px] right-[-200px] w-[400px] h-[400px] rounded-full opacity-8 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${glowColor}, transparent)` }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between px-4 sm:px-6 py-4"
        >
          <Button
            variant="ghost"
            onClick={handleGoHome}
            className="text-slate-400 hover:text-white gap-1.5"
          >
            <ChevronRight className="w-5 h-5" />
            الرئيسية
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <img
                src="/platform-logo.png"
                alt="ألعاب الغريب"
                className="w-6 h-6 rounded-md object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML =
                    '<span class="text-white text-sm font-black">غ</span>';
                }}
              />
            </div>
            <span className="text-sm font-bold bg-gradient-to-l from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              ألعاب الغريب
            </span>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-lg"
          >
            {/* Game Hero */}
            <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-10">
              {/* Game Emoji */}
              <motion.div
                className="text-7xl sm:text-8xl mb-5 inline-block drop-shadow-2xl"
                {...floatEmoji}
              >
                {game.emoji}
              </motion.div>

              {/* Game Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
                {game.title}
              </h1>
              <p className={`text-sm font-medium ${game.themeColor} mb-3`}>
                {game.titleEn}
              </p>

              {/* Game Meta Badges */}
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mb-5">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {game.players}
                </span>
                <span className="text-slate-700">•</span>
                <span>{game.category}</span>
                <span className="text-slate-700">•</span>
                <Badge className={`${game.themeBadge} text-[10px]`}>
                  🟢 متاحة
                </Badge>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-sm mx-auto">
                {game.description}
              </p>
            </motion.div>

            {/* Feature Badges */}
            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10">
              {game.features.map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
                >
                  <Badge
                    className={`${game.themeBadge} text-xs px-3 py-1.5`}
                  >
                    {feature}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>

            {/* Action Cards */}
            <motion.div variants={itemVariants} className="space-y-4">
              {/* Play as Host Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                {...pulseGlow}
              >
                <Card
                  className="bg-slate-900/90 border-slate-800/60 backdrop-blur-md cursor-pointer overflow-hidden group transition-colors hover:border-amber-500/40"
                  onClick={handlePlayAsHost}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                        <Crown className="w-7 h-7 text-white" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-black text-white mb-1 flex items-center gap-2">
                          العب كمستضيف
                          <span className="text-xs font-medium text-amber-400/70">العراب</span>
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          ابدأ لعبة جديدة وتحكم بكل شيء
                        </p>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Join Room Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="bg-slate-900/90 border-slate-800/60 backdrop-blur-md cursor-pointer overflow-hidden group transition-colors hover:border-cyan-500/40"
                  onClick={handleShowJoinForm}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                        <Users className="w-7 h-7 text-white" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-black text-white mb-1 flex items-center gap-2">
                          أدخل كود الغرفة
                          <span className="text-xs font-medium text-cyan-400/70">الديوانية</span>
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          انضم إلى لعبة موجودة بكود الغرفة
                        </p>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* How It Works Section */}
            <motion.div variants={itemVariants} className="mt-8 sm:mt-10">
              <Card className="bg-slate-900/50 border-slate-800/40">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                    كيف تبدأ؟
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full ${solidColor} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                        ١
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <span className="font-bold text-white">العب كمستضيف</span> لبدء لعبة جديدة — أنت تتحكم باللعبة كالمستضيف
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                        ٢
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <span className="font-bold text-white">أدخل كود الغرفة</span> للانضمام إلى لعبة صديقك أونلاين
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center py-4 px-4"
        >
          <p className="text-xs text-slate-600">
            ألعاب الغريب — منصة الألعاب العربية
          </p>
        </motion.div>
      </div>
    </div>
  );
}
