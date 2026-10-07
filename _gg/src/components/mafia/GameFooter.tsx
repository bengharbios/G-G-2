'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/game-store';
import { GamePhase, ROLE_CONFIGS } from '@/lib/game-types';
import type { RoleType } from '@/lib/game-types';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';

const PHASE_LABELS: Record<string, string> = {
  setup: '🔧 الإعداد',
  card_distribution: '🃏 توزيع البطاقات',
  night_start: '🌙 التغميضة',
  night_mafia_wake: '👾 المافيا تستيقظ',
  night_boss_kill: '🔪 شيخ المافيا',
  night_silencer: '🤫 التسكيت',
  night_mafia_sleep: '😴 المافيا تنام',
  night_medic: '🏥 الطبيب',
  night_sniper: '🎯 القناص',
  night_end: '🌅 انتهت الليل',
  day_announcements: '📢 أحداث الليل',
  day_mayor_reveal: '🏛️ كشف العمده',
  day_discussion: '💬 النقاش',
  day_voting: '🗳️ التصويت',
  day_elimination: '⚔️ الإقصاء',
  good_son_revenge: '👦 انتقام الولد الصالح',
  game_over: '🏁 انتهت اللعبة',
};

const PRESENTER_COMMENTARY: Partial<Record<GamePhase, string>> = {
  setup: '🔥يا شباب، هادي اللعبة مش عادية... القوي بيعيش والضعيف بيموت! هل أنتم مستعدين للمغامرة؟🔥',
  card_distribution: '🕵️‍♂️ المافيا الثلاثة... إياكم تفتحوا عيونكم! المرة الجاية اللي بيفتح رح يكشف نفسه! 🕵️‍♂️',
  night_start: '🌙 أغمضوا أعينكم يا جماعة! مين اللي بيخاف من الظلام؟ الليلة رح تكون طويلة... 🌙',
  night_mafia_wake: '👾 المافيا... المافيا يفتحوا! افتحوا واختبوا بالظلام واتخابثوا على ضحيتكم! 👾',
  night_boss_kill: '🔪 شيخ المافيا... اختر بحكمة! صباحك بدم أو صباحك بابتسامة! 🔪',
  night_silencer: '🤫 مافيا التسكيت... وين بده يطنش؟ انطر وأنت صامت! 🤫',
  night_mafia_sleep: '😴 المافيا تنام... حلوين حلموا بصباح سعيد! 😴',
  night_medic: '🏥 الطبيب... وين بده يضحي؟ خمن صح وتنقذ حياة! أو تخطئ وتخسر كل شي! 🏥',
  night_sniper: '🎯 القناص... عندك رصاصة وحدة بس! لا تخطئ وإلا رح تموت معاه! 🎯',
  night_end: '🌅 افتحوا أعينكم يا جماعة! شوفوا إذا في دم هالليل أو لا! 🌅',
  day_announcements: '☀️ صباح الخير يا صالحين! أو مساء الخير... على حسب اللي صار بالليل! ☀️',
  day_mayor_reveal: '🏛️ العمده... هل بده يكشف نفسه؟ إذا كشف بصوته بيساوي ٣ أصوات! خطوة جريئة! 🏛️',
  day_discussion: '💬 وقت النقاش يا جماعة! كلموا وتكلموا واعرفوا وين المافيا! كل كلمة ممكن تكون سلاح! 💬',
  day_voting: '🗳️ حان وقت الحقيقة! صوّتوا بذكاء! حد بده يغير؟ الكل عنده فرصة يغير رأيه! 🗳️',
  day_elimination: '⚔️ تم الكشف! هل هو صالح ولا مافيا؟ شوفوا وين المصلحة! ⚔️',
  good_son_revenge: '👦 الولد الصالح ما بينموت لحاله! رح ياخد واحد معو للقبر! 👦',
  game_over: '🏁 انتهت اللعبة! من الفائز؟ المافيا ولا الصالحين؟ الجواب رح يصدمكم! 🏁',
};

export default function GameFooter() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.round);
  const resetGame = useGameStore((s) => s.resetGame);
  const showRolesToHost = useGameStore((s) => s.showRolesToHost);
  const toggleRolesToHost = useGameStore((s) => s.toggleRolesToHost);
  const hostName = useGameStore((s) => s.hostName);
  const players = useGameStore((s) => s.players);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHostRole, setShowHostRole] = useState(false);

  const phaseLabel = PHASE_LABELS[phase] || '';
  const commentary = PRESENTER_COMMENTARY[phase] || '';

  const isNight = phase.startsWith('night');
  const isGameOver = phase === 'game_over';
  const isInGame = phase !== 'setup';

  // Find the host's player data (host is a player too in Diwaniya mode)
  const hostPlayer = hostName
    ? players.find((p) => p.name === hostName)
    : null;
  const hostRole = hostPlayer?.role as RoleType | undefined;
  const hostRoleConfig = hostRole ? ROLE_CONFIGS[hostRole] : null;

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  return (
    <footer className="w-full border-t border-slate-700/50 bg-slate-950/80 backdrop-blur-sm">
      {/* Host role card (shown when game is active and host has a role) */}
      {isInGame && hostName && hostRoleConfig && phase !== 'card_distribution' && (
        <div className="px-3 pt-2 pb-1">
          <div className="max-w-md mx-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHostRole(!showHostRole)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border transition-colors ${
                showHostRole
                  ? hostRoleConfig.team === 'mafia'
                    ? 'bg-red-950/40 border-red-500/30'
                    : 'bg-blue-950/40 border-blue-500/30'
                  : 'bg-slate-900/60 border-slate-700/40 hover:border-slate-600/60'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                hostRoleConfig.team === 'mafia'
                  ? 'bg-red-900/60 border border-red-500/40 text-red-200'
                  : 'bg-blue-900/60 border border-blue-500/40 text-blue-200'
              }`}>
                {hostName.charAt(0)}
              </div>

              {/* Name and role */}
              <div className="flex-1 text-right min-w-0">
                <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                  المستضيف: <span className="font-bold text-slate-100">{hostName}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{hostRoleConfig.icon}</span>
                  <p className={`text-[10px] font-bold ${hostRoleConfig.textColor}`}>
                    {hostRoleConfig.nameAr}
                  </p>
                  <span className={`text-[9px] ${
                    hostRoleConfig.team === 'mafia' ? 'text-red-400/70' : 'text-blue-400/70'
                  }`}>
                    ({hostRoleConfig.team === 'mafia' ? 'مافيا' : 'صالح'})
                  </span>
                </div>
              </div>

              {/* Expand indicator */}
              <motion.span
                animate={{ rotate: showHostRole ? 180 : 0 }}
                className="text-slate-500 text-xs"
              >
                ▼
              </motion.span>
            </motion.button>

            {/* Expanded role details */}
            <AnimatePresence>
              {showHostRole && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`mt-1 p-3 rounded-lg border ${
                    hostRoleConfig.team === 'mafia'
                      ? 'bg-red-950/20 border-red-500/20'
                      : 'bg-blue-950/20 border-blue-500/20'
                  }`}>
                    {/* Mafia team members */}
                    {hostRoleConfig.team === 'mafia' && (
                      <div className="mb-2">
                        <p className="text-[10px] text-red-400 font-bold mb-1.5">🔴 زميلائك في المافيا:</p>
                        <div className="flex flex-wrap gap-1">
                          {players
                            .filter((p) =>
                              p.name !== hostName &&
                              ['mafia_boss', 'mafia_silencer', 'mafia_regular'].includes(p.role || '')
                            )
                            .map((p) => (
                              <span
                                key={p.id}
                                className="bg-red-900/40 text-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              >
                                {p.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Role description */}
                    <p className={`text-[10px] ${hostRoleConfig.textColor} opacity-80 leading-relaxed`}>
                      {hostRoleConfig.description}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Phase indicator bar */}
      <div className="flex items-center justify-between py-1.5 px-3 border-t border-slate-800/50">
        <Badge
          variant="outline"
          className={`text-[10px] sm:text-xs px-2 py-0.5 ${
            isNight
              ? 'border-indigo-500/50 text-indigo-300'
              : isGameOver
              ? 'border-yellow-500/50 text-yellow-300'
              : 'border-yellow-500/50 text-yellow-400'
          }`}
        >
          {phaseLabel}
        </Badge>

        {/* Round number */}
        {isInGame && !isGameOver && (
          <Badge
            variant="outline"
            className="text-[10px] sm:text-xs px-2 py-0.5 border-slate-600/50 text-slate-400"
          >
            📋 الجولة {round}
          </Badge>
        )}

        {/* Reset button - only during gameplay */}
        {isInGame && !isGameOver && (
          <div className="flex items-center gap-2">
            {/* Host role view toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleRolesToHost}
              className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-lg transition-colors ${
                showRolesToHost
                  ? 'text-amber-400 bg-amber-950/30 hover:bg-amber-950/50'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              title={showRolesToHost ? 'إخفاء الشخصيات' : 'عرض الشخصيات للمدير'}
            >
              {showRolesToHost ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">
                {showRolesToHost ? 'إخفاء' : 'المدير'}
              </span>
            </motion.button>

            <div className="relative">
            {!showResetConfirm ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">إعادة</span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-[10px] sm:text-xs text-red-400 font-bold">
                  متأكد؟
                </span>
                <button
                  onClick={handleReset}
                  className="text-[10px] sm:text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded font-bold hover:bg-red-800/60 transition-colors"
                >
                  نعم
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[10px] sm:text-xs bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded font-bold hover:bg-slate-700/60 transition-colors"
                >
                  لا
                </button>
              </motion.div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Presenter commentary */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="text-center py-2 px-3"
        >
          {commentary && (
            <p className="text-xs sm:text-sm text-slate-400 italic leading-relaxed">
              🎙️ الغريب: &ldquo;{commentary}&rdquo;
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Branding */}
      <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 border-t border-slate-800/30">
        <span className="text-xs sm:text-sm">🕵️</span>
        <span className="text-[10px] sm:text-xs font-bold bg-gradient-to-l from-yellow-400 to-amber-500 bg-clip-text text-transparent">
          لعبة المافيا | الديوانية
        </span>
        <span className="text-xs sm:text-sm">🕵️</span>
      </div>
    </footer>
  );
}
