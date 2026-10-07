'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTabotStore } from '@/lib/tabot-store';
import { TabotTeam, PlayerRole, TEAM_CONFIG } from '@/lib/tabot-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronLeft, Flag } from 'lucide-react';

interface TeamPlayer {
  name: string;
  role: PlayerRole;
}

interface TeamSetupData {
  name: string;
  players: TeamPlayer[];
}

const ROLE_OPTIONS: { value: PlayerRole; label: string; emoji: string }[] = [
  { value: 'leader', label: 'قائد', emoji: '👑' },
  { value: 'deputy', label: 'نائب', emoji: '⭐' },
  { value: 'member', label: 'عضو', emoji: '🛡️' },
  { value: 'guest', label: 'ضيف', emoji: '👁️' },
];

function TeamPanel({
  team,
  data,
  onChange,
}: {
  team: TabotTeam;
  data: TeamSetupData;
  onChange: (data: TeamSetupData) => void;
}) {
  const config = TEAM_CONFIG[team];
  const [nameInput, setNameInput] = useState('');

  const addPlayer = () => {
    if (!nameInput.trim()) return;
    if (data.players.length >= 10) return;

    // Auto-assign role: first = leader, second = deputy, rest = member
    let role: PlayerRole = 'member';
    if (data.players.length === 0) role = 'leader';
    else if (data.players.length === 1) role = 'deputy';

    onChange({
      ...data,
      players: [...data.players, { name: nameInput.trim(), role }],
    });
    setNameInput('');
  };

  const removePlayer = (index: number) => {
    const newPlayers = data.players.filter((_, i) => i !== index);
    // Re-assign roles if leader/deputy removed
    if (index === 0 && newPlayers.length > 0) newPlayers[0].role = 'leader';
    else if (index === 1 && newPlayers.length > 1 && !newPlayers.some(p => p.role === 'deputy')) {
      newPlayers[1].role = 'deputy';
    }
    onChange({ ...data, players: newPlayers });
  };

  const changeRole = (index: number, newRole: PlayerRole) => {
    const newPlayers = [...data.players];
    // If setting as leader, demote current leader
    if (newRole === 'leader') {
      newPlayers.forEach((p, i) => {
        if (i !== index && p.role === 'leader') p.role = 'member';
      });
    }
    // If setting as deputy, demote current deputy
    if (newRole === 'deputy') {
      newPlayers.forEach((p, i) => {
        if (i !== index && p.role === 'deputy') p.role = 'member';
      });
    }
    // Don't allow removing leader if there are other players and this is the only leader
    if (newPlayers[index].role === 'leader' && newRole !== 'leader') {
      const hasOtherLeader = newPlayers.some((p, i) => i !== index && p.role === 'leader');
      if (!hasOtherLeader && newPlayers.length > 1) return; // Keep current leader
    }
    newPlayers[index] = { ...newPlayers[index], role: newRole };
    onChange({ ...data, players: newPlayers });
  };

  return (
    <div className="min-w-0 flex-1">
      <Card className={`bg-gradient-to-bl ${config.gradient} border ${config.borderColor}`}>
        <CardContent className="pt-4 pb-4 p-3 sm:p-4">
          {/* Team header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{config.icon}</span>
            <Input
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              placeholder={config.defaultName}
              className="bg-black/30 border-white/10 text-white placeholder:text-slate-500 text-sm font-bold h-8 text-right"
              dir="rtl"
            />
          </div>

          {/* Players list */}
          <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto mafia-scrollbar">
            <AnimatePresence>
              {data.players.map((player, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex items-center gap-1.5 bg-black/20 rounded-lg p-1.5"
                >
                  <select
                    value={player.role}
                    onChange={(e) => changeRole(i, e.target.value as PlayerRole)}
                    className="bg-transparent border border-white/10 rounded px-1 py-0.5 text-xs text-white cursor-pointer appearance-none w-8 text-center"
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value} className="bg-slate-900 text-white text-xs">
                        {r.emoji}
                      </option>
                    ))}
                  </select>
                  <span className="flex-1 text-xs sm:text-sm text-slate-200 truncate">{player.name}</span>
                  <button
                    onClick={() => removePlayer(i)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add player */}
          <div className="flex gap-1.5">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="اسم اللاعب..."
              className="flex-1 bg-black/30 border-white/10 text-white placeholder:text-slate-500 text-xs h-8 text-right"
              dir="rtl"
              maxLength={20}
            />
            <Button
              onClick={addPlayer}
              disabled={!nameInput.trim() || data.players.length >= 10}
              className="h-8 px-2 bg-white/10 hover:bg-white/20 text-white"
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-[10px] text-slate-500 mt-1.5 text-center">
            {data.players.length}/10 لاعبين
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeamSetup() {
  const { setupTeams, setPhase } = useTabotStore();

  const [alpha, setAlpha] = useState<TeamSetupData>({
    name: TEAM_CONFIG.alpha.defaultName,
    players: [],
  });

  const [beta, setBeta] = useState<TeamSetupData>({
    name: TEAM_CONFIG.beta.defaultName,
    players: [],
  });

  const [selectedFirstTeam, setSelectedFirstTeam] = useState<TabotTeam | null>(null);
  const [error, setError] = useState('');

  const validate = (): string => {
    if (alpha.players.length < 2) return 'يجب أن يضم فريق الرعب لاعبين على الأقل';
    if (beta.players.length < 2) return 'يجب أن يضم فريق الظلام لاعبين على الأقل';

    // Check each team has a leader
    if (!alpha.players.some(p => p.role === 'leader')) return 'فريق الرعب يحتاج قائد 👑';
    if (!beta.players.some(p => p.role === 'leader')) return 'فريق الظلام يحتاج قائد 👑';

    // Check for duplicate names
    const allNames = [...alpha.players.map(p => p.name), ...beta.players.map(p => p.name)];
    const duplicates = allNames.filter((name, i) => allNames.indexOf(name) !== i);
    if (duplicates.length > 0) return `أسماء مكررة: ${duplicates[0]}`;

    if (!selectedFirstTeam) return 'اختر الفريق الذي يبدأ أولاً';

    return '';
  };

  const handleStart = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setupTeams(
      alpha.name || TEAM_CONFIG.alpha.defaultName,
      beta.name || TEAM_CONFIG.beta.defaultName,
      alpha.players.map(p => ({ name: p.name, role: p.role })),
      beta.players.map(p => ({ name: p.name, role: p.role })),
      selectedFirstTeam
    );
  };

  const totalPlayers = alpha.players.length + beta.players.length;

  return (
    <div className="flex flex-col items-center py-6 px-3 sm:px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto"
      >
        {/* Title */}
        <div className="text-center mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-purple-300 mb-1">⚔️ إعداد الفرق</h2>
          <p className="text-xs text-slate-400">أضف لاعبين لكل فريق واختر من يبدأ أولاً</p>
        </div>

        {/* Team panels */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <TeamPanel team="alpha" data={alpha} onChange={setAlpha} />

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl font-black text-slate-500 my-2 sm:my-0"
            >
              ⚔️
            </motion.div>
          </div>

          <TeamPanel team="beta" data={beta} onChange={setBeta} />
        </div>

        {/* First team selection */}
        <Card className="bg-slate-900/80 border-purple-700/30 mb-5">
          <CardContent className="pt-4 pb-4 p-4">
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flag className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300">اختر الفريق البادئ</h3>
              </div>
              <p className="text-[10px] text-slate-500">أي فريق يبدأ بفتح الباب الأول؟</p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedFirstTeam('alpha')}
                className={`flex-1 rounded-xl p-3 border-2 text-center transition-all cursor-pointer ${
                  selectedFirstTeam === 'alpha'
                    ? 'border-red-500 bg-red-950/50 shadow-lg shadow-red-500/20'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-500'
                }`}
              >
                <span className="text-xl block mb-1">👹</span>
                <span className={`text-xs font-bold ${selectedFirstTeam === 'alpha' ? 'text-red-300' : 'text-slate-400'}`}>
                  {alpha.name || TEAM_CONFIG.alpha.defaultName}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedFirstTeam('beta')}
                className={`flex-1 rounded-xl p-3 border-2 text-center transition-all cursor-pointer ${
                  selectedFirstTeam === 'beta'
                    ? 'border-blue-500 bg-blue-950/50 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-500'
                }`}
              >
                <span className="text-xl block mb-1">🦇</span>
                <span className={`text-xs font-bold ${selectedFirstTeam === 'beta' ? 'text-blue-300' : 'text-slate-400'}`}>
                  {beta.name || TEAM_CONFIG.beta.defaultName}
                </span>
              </motion.button>
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-400 text-xs text-center mb-3 bg-red-950/30 rounded-lg py-2 px-3"
            >
              ⚠️ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setPhase('landing')}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-4 text-sm"
          >
            رجوع
            <ChevronLeft className="w-4 h-4 mr-2" />
          </Button>
          <Button
            onClick={handleStart}
            className="flex-1 font-bold text-base sm:text-lg py-5 bg-gradient-to-l from-purple-600 to-amber-700 hover:from-purple-500 hover:to-amber-600 text-white transition-all duration-300 pulse-glow-purple"
          >
            🚪 ابدأ اللعبة
          </Button>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mt-4 text-[10px] text-slate-500">
          <span>👥 {totalPlayers} لاعب</span>
          <span>👹 {alpha.players.length}</span>
          <span>🦇 {beta.players.length}</span>
        </div>
      </motion.div>
    </div>
  );
}
