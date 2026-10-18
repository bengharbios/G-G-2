'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTabotStore } from '@/lib/tabot-store';
import { TabotTeam, PlayerRole, TEAM_CONFIG } from '@/lib/tabot-types';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
} from '@/lib/sounds';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

const ROLE_OPTIONS: { value: PlayerRole; label: string; emoji: string }[] = [
  { value: 'leader', label: 'قائد', emoji: '👑' },
  { value: 'deputy', label: 'نائب', emoji: '⭐' },
  { value: 'member', label: 'عضو', emoji: '🛡️' },
  { value: 'guest', label: 'ضيف', emoji: '👁️' },
];

interface TeamPlayer { name: string; role: PlayerRole; }
interface TeamSetupData { name: string; players: TeamPlayer[]; }

export default function GameSetup() {
  const router = useRouter();
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
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => { document.body.classList.remove('in-game-setup'); };
  }, []);

  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleMusic = () => { const next = !musicOn; setMusicOn(next); setMusicEnabled(next); };
  const toggleSound = () => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); };

  const validate = (): string => {
    if (alpha.players.length < 2) return 'يجب أن يضم فريق الرعب لاعبين على الأقل';
    if (beta.players.length < 2) return 'يجب أن يضم فريق الظلام لاعبين على الأقل';
    if (!alpha.players.some(p => p.role === 'leader')) return 'فريق الرعب يحتاج قائد 👑';
    if (!beta.players.some(p => p.role === 'leader')) return 'فريق الظلام يحتاج قائد 👑';
    const allNames = [...alpha.players.map(p => p.name), ...beta.players.map(p => p.name)];
    const duplicates = allNames.filter((name, i) => allNames.indexOf(name) !== i);
    if (duplicates.length > 0) return `أسماء مكررة: ${duplicates[0]}`;
    if (!selectedFirstTeam) return 'اختر الفريق الذي يبدأ أولاً';
    return '';
  };

  const handleStart = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!selectedFirstTeam) { setError('اختر الفريق الذي يبدأ أولاً'); return; }
    setError('');
    setupTeams(
      alpha.name || TEAM_CONFIG.alpha.defaultName,
      beta.name || TEAM_CONFIG.beta.defaultName,
      alpha.players.map(p => ({ name: p.name, role: p.role })),
      beta.players.map(p => ({ name: p.name, role: p.role })),
      selectedFirstTeam
    );
  };

    const handleExit = () => {
    // Explicit exit = FORFEIT (no resume, no mode bleed)
    try {
      const st = useTabotStore.getState();
      if (st.gameMode === 'diwaniya' && st.roomCode) {
        fetch(`/api/tabot-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {});
      }
      useTabotStore.getState().resetGame();
    } catch { /* ignore */ }
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tabot-game-storage');
        localStorage.removeItem('tabot-game-storage__disconnect_ts');
      }
    } catch { /* ignore */ }
    setShowExitDialog(false);
    setShowQuitDialog(false);
    router.push('/#games');
  };

  const totalPlayers = alpha.players.length + beta.players.length;

  const noticeText = !selectedFirstTeam
    ? 'اختر الفريق البادئ'
    : selectedFirstTeam === 'alpha'
      ? `الفريق ${alpha.name || 'الرعب'} سيبدأ أولاً`
      : `الفريق ${beta.name || 'الظلام'} سيبدأ أولاً`;
  const noticeClass = !selectedFirstTeam ? '' : selectedFirstTeam === 'alpha' ? 'team-red' : 'team-blue';
  const noticeEmoji = !selectedFirstTeam ? '👇' : selectedFirstTeam === 'alpha' ? '🔴' : '🔵';

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 100px',
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ أيقونات الهيدر — صوت + خروج ══════════ */}
      <div className="tobol-header-actions">
        <button
          type="button"
          className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
          onClick={toggleMusic}
          aria-label={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          title={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
        >
          <img
            src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'}
            alt="sound"
          />
        </button>
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowExitDialog(true)}
          aria-label="خروج"
          title="خروج"
        >
          <img src="/battle/btn_exit.webp" alt="exit" />
        </button>
      </div>

      {/* ══════════ صورة اللعبة + اسمها ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="/yalla-games/tabot.png"
            alt="الهروب من التابوت"
            style={{
              width: '76px',
              height: '64px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.55))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              background: 'radial-gradient(circle, rgba(168,85,247,.22), transparent 65%)',
              filter: 'blur(6px)',
              zIndex: -1,
              borderRadius: '50%',
            }}
          />
        </div>
        <h1
          style={{
            ...STROKE_STYLE,
            fontSize: '22px',
            fontWeight: 900,
            textShadow: '0 2px 4px rgba(0,0,0,.85)',
            margin: '2px 0 0',
            lineHeight: 1,
          }}
        >
          الهروب من التابوت
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Tabot — Escape the Coffin 🦇
        </p>
      </motion.div>

      {/* ══════════ عنوان "إعداد الفرق" ══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'rgba(6,42,32,.65)',
          border: '1px solid rgba(254,239,145,.18)',
        }}
      >
        <span style={{ fontSize: '13px' }}>⚰️</span>
        <span
          style={{
            ...STROKE_STYLE,
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.4px',
          }}
        >
          إعداد الفرق
        </span>
      </motion.div>

      {/* ══════════ بطاقتا الفريقين + VS ══════════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          gap: '8px',
          alignItems: 'stretch',
          marginTop: '2px',
        }}
      >
        <TeamCard
          team="alpha"
          data={alpha}
          onChange={setAlpha}
          delay={0.22}
        />

        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img
            src="/battle/vs_pk.webp"
            alt="VS"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <TeamCard
          team="beta"
          data={beta}
          onChange={setBeta}
          delay={0.32}
        />
      </div>

      {/* ══════════ إشعار الفريق البادئ ══════════ */}
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFirstTeam || 'none'}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className={`tobol-notice-pill ${noticeClass}`}
          >
            <span className="notice-dot" />
            <span style={{ fontSize: '13px' }}>{noticeEmoji}</span>
            <span>{noticeText}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══════════ اختيار الفريق البادئ ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.3 }}
        style={{ width: '100%', maxWidth: '380px', display: 'flex', gap: '8px' }}
      >
        <FirstTeamButton
          team="alpha"
          label={alpha.name || TEAM_CONFIG.alpha.defaultName}
          selected={selectedFirstTeam === 'alpha'}
          onSelect={() => setSelectedFirstTeam('alpha')}
        />
        <FirstTeamButton
          team="beta"
          label={beta.name || TEAM_CONFIG.beta.defaultName}
          selected={selectedFirstTeam === 'beta'}
          onSelect={() => setSelectedFirstTeam('beta')}
        />
      </motion.div>

      {/* ══════════ خطأ ══════════ */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              color: '#ef4444', fontSize: '11px', textAlign: 'center',
              background: 'rgba(239,68,68,.1)', padding: '6px 10px',
              borderRadius: '8px', width: '100%', maxWidth: '380px',
            }}
          >⚠️ {error}</motion.p>
        )}
      </AnimatePresence>

      {/* ══════════ زر بدء اللعبة ══════════ */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.3 }}
        whileHover={selectedFirstTeam ? { scale: 1.02 } : {}}
        whileTap={selectedFirstTeam ? { scale: 0.97 } : {}}
        onClick={handleStart}
        disabled={!selectedFirstTeam}
        className="tobol-start-btn"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '14px 16px',
          border: 'none',
          color: '#feef91',
          fontSize: '17px',
          fontWeight: 900,
          cursor: selectedFirstTeam ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          paintOrder: 'stroke fill',
          WebkitTextStroke: '0.5px #aa6e1f',
          textShadow: '0 2px 6px rgba(0,0,0,.6)',
          marginTop: '4px',
        }}
      >
        <span className="tobol-start-icon">
          <span style={{ fontSize: '18px' }}>⚰️</span>
        </span>
        <span>ابدأ اللعبة</span>
      </motion.button>

      {/* ══════════ إحصاءات ══════════ */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '4px', fontSize: '10px', color: '#9fc4b4' }}>
        <span>👥 {totalPlayers} لاعب</span>
        <span>👹 {alpha.players.length}</span>
        <span>🦇 {beta.players.length}</span>
      </div>

      {/* ══════════ حوار الخروج ══════════ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.72)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #0e2a22, #061812)',
                border: '1.5px solid rgba(254,239,145,.25)',
                borderRadius: '18px',
                padding: '20px',
                width: '100%',
                maxWidth: '300px',
                textAlign: 'center',
                boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                الخروج من اللعبة؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء الجلسة وعدم حفظ أي تقدم. هل أنت متأكد؟
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowExitDialog(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)',
                    background: 'rgba(80,80,80,.3)', color: '#cbd5e1',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  }}
                >إلغاء</button>
                <button
                  onClick={handleExit}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,.35)',
                  }}
                >نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== بطاقة فريق (Yalla Ludo style) =====
function TeamCard({
  team,
  data,
  onChange,
  delay,
}: {
  team: TabotTeam;
  data: TeamSetupData;
  onChange: (d: TeamSetupData) => void;
  delay: number;
}) {
  const config = TEAM_CONFIG[team];
  const isRed = team === 'alpha';
  const accent = isRed ? '#ef4444' : '#3b82f6';
  const accentLight = isRed ? '#fca5a5' : '#93c5fd';
  const [nameInput, setNameInput] = useState('');

  const addPlayer = () => {
    if (!nameInput.trim()) return;
    if (data.players.length >= 10) return;
    let role: PlayerRole = 'member';
    if (data.players.length === 0) role = 'leader';
    else if (data.players.length === 1) role = 'deputy';
    onChange({ ...data, players: [...data.players, { name: nameInput.trim(), role }] });
    setNameInput('');
  };

  const removePlayer = (index: number) => {
    const newPlayers = data.players.filter((_, i) => i !== index);
    if (index === 0 && newPlayers.length > 0) newPlayers[0].role = 'leader';
    else if (index === 1 && newPlayers.length > 1 && !newPlayers.some(p => p.role === 'deputy')) {
      newPlayers[1].role = 'deputy';
    }
    onChange({ ...data, players: newPlayers });
  };

  const changeRole = (index: number, newRole: PlayerRole) => {
    const newPlayers = [...data.players];
    if (newRole === 'leader') {
      newPlayers.forEach((p, i) => { if (i !== index && p.role === 'leader') p.role = 'member'; });
    }
    if (newRole === 'deputy') {
      newPlayers.forEach((p, i) => { if (i !== index && p.role === 'deputy') p.role = 'member'; });
    }
    if (newPlayers[index].role === 'leader' && newRole !== 'leader') {
      const hasOtherLeader = newPlayers.some((p, i) => i !== index && p.role === 'leader');
      if (!hasOtherLeader && newPlayers.length > 1) return;
    }
    newPlayers[index] = { ...newPlayers[index], role: newRole };
    onChange({ ...data, players: newPlayers });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="tobol-team-card"
      style={{
        flex: 1,
        padding: '10px 8px',
        background: 'linear-gradient(180deg, rgba(8,28,22,.92), rgba(4,18,14,.96))',
        '--card-border': `linear-gradient(180deg, ${accentLight}, ${accent})`,
        '--card-border-selected': `linear-gradient(180deg, ${accentLight}, ${accent})`,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <div
          style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}55, ${accent}22)`,
            border: `1.5px solid ${accent}80`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '13px' }}>{config.icon}</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: accent, textShadow: `0 1px 2px rgba(0,0,0,.6)` }}>
          {isRed ? 'الرعب' : 'الظلام'}
        </span>
      </div>

      {/* Name input */}
      <input
        type="text"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        placeholder={config.defaultName}
        maxLength={20}
        dir="rtl"
        style={{
          width: '100%',
          background: 'rgba(0,0,0,.35)',
          border: `1px solid ${accent}55`,
          borderRadius: '10px',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          padding: '7px 8px',
          outline: 'none',
          textAlign: 'center',
          marginBottom: '8px',
          transition: 'border-color .15s',
        }}
      />

      {/* Players list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', maxHeight: '110px', overflowY: 'auto' }} className="tobol-scrollbar">
        <AnimatePresence>
          {data.players.map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'rgba(0,0,0,.25)', borderRadius: '8px', padding: '4px 6px',
              }}
            >
              <select
                value={player.role}
                onChange={(e) => changeRole(i, e.target.value as PlayerRole)}
                style={{
                  background: 'transparent', border: `1px solid ${accent}40`,
                  borderRadius: '4px', padding: '2px', fontSize: '11px',
                  color: '#fff', cursor: 'pointer', width: '28px', textAlign: 'center',
                  appearance: 'none',
                }}
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value} style={{ background: '#0e2a22', color: '#fff' }}>
                    {r.emoji}
                  </option>
                ))}
              </select>
              <span style={{ flex: 1, fontSize: '11px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {player.name}
              </span>
              <button
                onClick={() => removePlayer(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94a3b8', fontSize: '11px', padding: '2px',
                }}
                aria-label="حذف"
              >✕</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add player */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          placeholder="اسم اللاعب..."
          maxLength={20}
          dir="rtl"
          style={{
            flex: 1, background: 'rgba(0,0,0,.35)', border: `1px solid ${accent}40`,
            borderRadius: '8px', color: '#fff', fontSize: '11px',
            padding: '6px 8px', outline: 'none', textAlign: 'center',
          }}
        />
        <button
          onClick={addPlayer}
          disabled={!nameInput.trim() || data.players.length >= 10}
          style={{
            background: nameInput.trim() && data.players.length < 10
              ? `linear-gradient(135deg, ${accent}80, ${accent}40)`
              : 'rgba(100,100,100,.3)',
            border: `1px solid ${accent}55`,
            borderRadius: '8px', color: '#fff', cursor: 'pointer',
            padding: '6px 8px', fontSize: '12px', fontWeight: 700,
          }}
        >+</button>
      </div>

      <div style={{ marginTop: '6px', height: '2px', background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
      <p style={{ fontSize: '10px', color: '#9fc4b4', textAlign: 'center', marginTop: '4px' }}>
        {data.players.length}/10 لاعبين
      </p>
    </motion.div>
  );
}

// ===== زر اختيار الفريق البادئ =====
function FirstTeamButton({
  team,
  label,
  selected,
  onSelect,
}: {
  team: TabotTeam;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const isRed = team === 'alpha';
  const accent = isRed ? '#ef4444' : '#3b82f6';

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      style={{
        flex: 1, padding: '8px', borderRadius: '12px', cursor: 'pointer',
        background: selected
          ? `linear-gradient(180deg, ${accent}26, ${accent}0d 80%)`
          : 'linear-gradient(180deg, rgba(8,28,22,.6), rgba(4,18,14,.7))',
        border: selected
          ? `2px solid ${accent}`
          : '2px solid rgba(255,255,255,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        transition: 'border-color .15s',
      }}
    >
      <span style={{ fontSize: '16px' }}>{isRed ? '🔴' : '🔵'}</span>
      <span style={{
        fontSize: '11px', fontWeight: 800, color: selected ? accent : '#9fc4b4',
        textShadow: selected ? `0 1px 2px rgba(0,0,0,.6)` : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </motion.button>
  );
}
