'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTabotStore } from '@/lib/tabot-store';
import { UserPlus, UserMinus, Play, Users, Crown } from 'lucide-react';
import { TEAM_CONFIG, TabotTeam } from '@/lib/tabot-types';

// ─── Animation variants ─────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

// ─── Team Setup Panel ──────────────────────────────────────────────────

interface TeamPanelProps {
  teamId: TabotTeam;
  defaultName: string;
  players: string[];
  onNameChange: (name: string) => void;
  onPlayersChange: (players: string[]) => void;
}

function TeamPanel({ teamId, defaultName, players, onNameChange, onPlayersChange }: TeamPanelProps) {
  const config = TEAM_CONFIG[teamId];

  const addPlayer = () => {
    if (players.length < 8) {
      onPlayersChange([...players, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      onPlayersChange(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...players];
    updated[index] = name;
    onPlayersChange(updated);
  };

  return (
    <motion.div
      custom={teamId === 'alpha' ? 0 : 1}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={`flex-1 rounded-2xl border ${config.borderColor} bg-gradient-to-b ${config.bgGradient} p-4`}
    >
      {/* Team Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{config.icon}</span>
        <input
          type="text"
          defaultValue={defaultName}
          onChange={(e) => onNameChange(e.target.value)}
          className={`flex-1 bg-transparent ${config.color} font-black text-lg outline-none border-b border-transparent focus:border-current/30 pb-0.5 placeholder:text-current/30`}
          placeholder={config.defaultName}
        />
      </div>

      {/* Players */}
      <div className="space-y-2">
        {players.map((name, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full bg-slate-800 border ${config.borderColor} flex items-center justify-center text-xs ${config.color} font-bold`}>
              {index + 1}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => updatePlayerName(index, e.target.value)}
              placeholder={`لاعب ${index + 1}`}
              className="flex-1 bg-slate-900/60 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-red-500/40"
            />
            {players.length > 2 && (
              <button
                onClick={() => removePlayer(index)}
                className="text-red-500/60 hover:text-red-400 transition-colors p-1"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add player button */}
      {players.length < 8 && (
        <button
          onClick={addPlayer}
          className={`w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed ${config.borderColor} ${config.color}/50 hover:${config.color}/80 text-xs font-bold transition-colors`}
        >
          <UserPlus className="w-4 h-4" />
          إضافة لاعب
        </button>
      )}

      <div className="mt-2 text-center">
        <span className="text-xs text-slate-500">
          <Users className="w-3 h-3 inline-block ml-1" />
          {players.length} لاعبين
        </span>
      </div>
    </motion.div>
  );
}

// ─── Setup Page ────────────────────────────────────────────────────────

export default function TabotSetup() {
  const { setupTeams, setPhase } = useTabotStore();
  const [alphaName, setAlphaName] = useState('');
  const [betaName, setBetaName] = useState('');
  const [alphaPlayers, setAlphaPlayers] = useState<string[]>(['', '']);
  const [betaPlayers, setBetaPlayers] = useState<string[]>(['', '']);

  const totalPlayers = alphaPlayers.length + betaPlayers.length;

  const canStart = useMemo(() => {
    const allNames = [...alphaPlayers, ...betaPlayers];
    const allFilled = allNames.every(n => n.trim().length > 0);
    const noDuplicates = new Set(allNames.map(n => n.trim().toLowerCase())).size === allNames.length;
    const minPlayers = totalPlayers >= 4;
    return allFilled && noDuplicates && minPlayers;
  }, [alphaPlayers, betaPlayers, totalPlayers]);

  const handleStart = () => {
    if (!canStart) return;
    setupTeams(
      alphaName || 'فريق الرعب',
      betaName || 'فريق الظلام',
      alphaPlayers,
      betaPlayers
    );
  };

  const validationMessage = useMemo(() => {
    const allNames = [...alphaPlayers, ...betaPlayers];
    if (allNames.some(n => n.trim().length === 0)) return 'يجب ملء جميع أسماء اللاعبين';
    if (new Set(allNames.map(n => n.trim().toLowerCase())).size !== allNames.length) return 'يوجد أسماء مكررة!';
    if (totalPlayers < 4) return 'يجب أن يكون 4 لاعبين على الأقل';
    return '';
  }, [alphaPlayers, betaPlayers, totalPlayers]);

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center px-4 py-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg flex flex-col gap-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
            ⚰️ إعداد الفرق
          </h2>
          <p className="text-xs text-slate-500">
            أضف لاعبين لكل فريق (4 لاعبين على الأقل)
          </p>
        </motion.div>

        {/* Teams */}
        <div className="flex gap-3 items-stretch">
          <TeamPanel
            teamId="alpha"
            defaultName="فريق الرعب"
            players={alphaPlayers}
            onNameChange={setAlphaName}
            onPlayersChange={setAlphaPlayers}
          />

          {/* VS divider */}
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-2xl font-black text-red-500/60"
            >
              VS
            </motion.div>
          </div>

          <TeamPanel
            teamId="beta"
            defaultName="فريق الظلام"
            players={betaPlayers}
            onNameChange={setBetaName}
            onPlayersChange={setBetaPlayers}
          />
        </div>

        {/* Validation message */}
        <AnimatePresence>
          {!canStart && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center"
            >
              <span className="text-xs text-red-400/80">{validationMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-3 mt-2">
          <Button
            variant="ghost"
            onClick={() => setPhase('landing')}
            className="flex-1 text-slate-500 hover:text-slate-300 border border-slate-800/50 hover:border-slate-700/50"
          >
            رجوع
          </Button>

          <Button
            onClick={handleStart}
            disabled={!canStart}
            className={`flex-1 font-bold text-base py-6 transition-all ${
              canStart
                ? 'bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white shadow-lg shadow-red-900/40'
                : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 ml-2" />
            ابدأ اللعبة
          </Button>
        </div>
      </div>
    </div>
  );
}
