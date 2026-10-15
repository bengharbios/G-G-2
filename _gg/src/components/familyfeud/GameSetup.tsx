'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFamilyFeudStore, type DifficultyFilter } from '@/lib/familyfeud-store';
import {
  useInGameSetupMode,
  useYallaSoundState,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';

const EMOJI_OPTIONS = ['👑', '🏛️', '⭐', '🔥', '💎', '🏆', '⚡', '🦁', '🦅', '🐉'];
const ROUND_OPTIONS = [3, 5, 7, 10];
const STEAL_TIMER_OPTIONS = [
  { label: 'إيقاف', value: 0 },
  { label: '10 ث', value: 10 },
  { label: '15 ث', value: 15 },
  { label: '20 ث', value: 20 },
];
const ROUND_TIMER_OPTIONS = [
  { label: 'إيقاف', value: 0 },
  { label: '30 ث', value: 30 },
  { label: '45 ث', value: 45 },
  { label: '60 ث', value: 60 },
];

export default function GameSetup() {
  const router = useRouter();
  const {
    setTeam1Name: setStoreT1,
    setTeam2Name: setStoreT2,
    setTeam1Emoji: setStoreE1,
    setTeam2Emoji: setStoreE2,
    setTotalRounds: setStoreTotal,
    setStealTimerDuration: setStoreStealTimer,
    setRoundTimerDuration: setStoreRoundTimer,
    setDifficultyFilter: setStoreDiff,
    handleStartGame,
    handleReset: storeReset,
  } = useFamilyFeudStore();

  const [team1Name, setTeam1Name] = useState('فريق 1');
  const [team2Name, setTeam2Name] = useState('فريق 2');
  const [team1Emoji, setTeam1Emoji] = useState('👑');
  const [team2Emoji, setTeam2Emoji] = useState('🏛️');
  const [totalRounds, setTotalRounds] = useState(5);
  const [stealTimer, setStealTimer] = useState(0);
  const [roundTimer, setRoundTimer] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [showExitDialog, setShowExitDialog] = useState(false);

  const { musicOn, toggleMusic } = useYallaSoundState();
  useInGameSetupMode();

  const canStart = team1Name.trim() && team2Name.trim();

  const handleStart = () => {
    if (!canStart) return;
    setStoreT1(team1Name.trim());
    setStoreT2(team2Name.trim());
    setStoreE1(team1Emoji);
    setStoreE2(team2Emoji);
    setStoreTotal(totalRounds);
    setStoreStealTimer(stealTimer);
    setStoreRoundTimer(roundTimer);
    setStoreDiff(difficulty);
    handleStartGame({
      team1Name: team1Name.trim(),
      team2Name: team2Name.trim(),
      team1Emoji,
      team2Emoji,
      totalRounds,
      stealTimer,
      roundTimer,
      difficultyFilter: difficulty,
    });
  };

  const handleExit = () => {
    storeReset();
    router.push('/');
  };

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        height: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 14px 12px',
        gap: '8px',
        overflow: 'hidden',
      }}
    >
      {/* ══════════ أيقونات الهيدر ══════════ */}
      <div className="tobol-header-actions">
        <button
          type="button"
          className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
          onClick={toggleMusic}
          aria-label={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          title={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
        >
          <img src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sound" />
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

      {/* ══════════ العنوان ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.32 }}
        style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}
      >
        <div style={{ fontSize: '36px', marginBottom: '2px' }}>🏆👨‍👩‍👧‍👦</div>
        <h1 style={{ ...STROKE_STYLE, fontSize: '22px', fontWeight: 900, margin: '2px 0 0', lineHeight: 1 }}>
          فاميلي فيود
        </h1>
        <p style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          Family Feud — Survey Says! 📺
        </p>
      </motion.div>

      {/* ══════════ عنوان "تجهيز المعركة" ══════════ */}
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
        <span style={{ fontSize: '13px' }}>📺</span>
        <span style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px' }}>
          تجهيز المعركة
        </span>
      </motion.div>

      {/* ══════════ بطاقتا الفريقين + VS ══════════ */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '380px',
        display: 'flex', gap: '8px', alignItems: 'stretch', marginTop: '4px',
      }}>
        <TeamSetupCard
          accent="#fbbf24"
          accentLight="#fde68a"
          emoji={team1Emoji}
          setEmoji={setTeam1Emoji}
          label="الفريق الأول"
          name={team1Name}
          setName={setTeam1Name}
          placeholder="اسم الفريق الأول"
          delay={0.22}
        />

        <div className="tobol-vs-badge" style={{ width: '46px', height: '46px' }}>
          <img src="/battle/vs_pk.webp" alt="VS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <TeamSetupCard
          accent="#f43f5e"
          accentLight="#fda4af"
          emoji={team2Emoji}
          setEmoji={setTeam2Emoji}
          label="الفريق الثاني"
          name={team2Name}
          setName={setTeam2Name}
          placeholder="اسم الفريق الثاني"
          delay={0.32}
        />
      </div>

      {/* ══════════ إعدادات الجولة ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.3 }}
        className="tobol-score-frame"
        style={{
          width: '100%', maxWidth: '380px',
          padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}
      >
        <SettingRow icon="🎯" label="عدد الجولات">
          {ROUND_OPTIONS.map((n) => (
            <SmallToggle key={n} active={totalRounds === n} onClick={() => setTotalRounds(n)}>{n}</SmallToggle>
          ))}
        </SettingRow>
        <SettingRow icon="⚡" label="مؤقت السرقة">
          {STEAL_TIMER_OPTIONS.map((o) => (
            <SmallToggle key={o.value} active={stealTimer === o.value} onClick={() => setStealTimer(o.value)}>{o.label}</SmallToggle>
          ))}
        </SettingRow>
        <SettingRow icon="⏱️" label="مؤقت الجولة">
          {ROUND_TIMER_OPTIONS.map((o) => (
            <SmallToggle key={o.value} active={roundTimer === o.value} onClick={() => setRoundTimer(o.value)}>{o.label}</SmallToggle>
          ))}
        </SettingRow>
        <SettingRow icon="🎚️" label="الصعوبة">
          {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map((d) => (
            <SmallToggle key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
              {d === 'all' ? 'الكل' : d === 'easy' ? 'سهل' : d === 'medium' ? 'متوسط' : 'صعب'}
            </SmallToggle>
          ))}
        </SettingRow>
      </motion.div>

      {/* ══════════ زر بدء المعركة ══════════ */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.3 }}
        whileHover={canStart ? { scale: 1.02 } : {}}
        whileTap={canStart ? { scale: 0.97 } : {}}
        onClick={handleStart}
        disabled={!canStart}
        className="tobol-start-btn"
        style={{
          width: '100%', maxWidth: '380px', padding: '14px 16px', border: 'none',
          color: '#feef91', fontSize: '17px', fontWeight: 900,
          cursor: canStart ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          paintOrder: 'stroke fill', WebkitTextStroke: '0.5px #aa6e1f',
          textShadow: '0 2px 6px rgba(0,0,0,.6)', marginTop: '4px',
        }}
      >
        <span className="tobol-start-icon"><span style={{ fontSize: '18px' }}>📺</span></span>
        <span>ابدأ العرض</span>
      </motion.button>

      {/* ══════════ حوار الخروج ══════════ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #0e2a22, #061812)',
                border: '1.5px solid rgba(254,239,145,.25)',
                borderRadius: '18px', padding: '20px', width: '100%', maxWidth: '300px',
                textAlign: 'center', boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                الخروج من المعركة؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء الجلسة وعدم حفظ أي تقدم. هل أنت متأكد؟
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowExitDialog(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)', background: 'rgba(80,80,80,.3)',
                    color: '#cbd5e1', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >إلغاء</button>
                <button onClick={handleExit}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,.35)' }}
                >نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#feef91', whiteSpace: 'nowrap', minWidth: '76px' }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px', flex: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {children}
      </div>
    </div>
  );
}

function SmallToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 9px', borderRadius: '7px', border: active
          ? '1px solid rgba(254,239,145,.55)'
          : '1px solid rgba(255,255,255,.1)',
        background: active ? 'rgba(254,239,145,.18)' : 'rgba(0,0,0,.25)',
        color: active ? '#feef91' : '#9fc4b4',
        fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
      }}
    >{children}</button>
  );
}

function TeamSetupCard({
  accent, accentLight, emoji, setEmoji, label, name, setName, placeholder, delay,
}: {
  accent: string; accentLight: string; emoji: string; setEmoji: (e: string) => void;
  label: string; name: string; setName: (v: string) => void; placeholder: string; delay: number;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}
      className="tobol-team-card"
      style={{
        flex: 1, padding: '10px 8px',
        '--card-border': `linear-gradient(180deg, ${accentLight}, ${accent})`,
        '--card-border-selected': `linear-gradient(180deg, ${accentLight}, ${accent})`,
        background: `linear-gradient(180deg, ${accent}26, ${accent}0d 80%)`,
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}55, ${accent}22)`,
            border: `1.5px solid ${accent}80`, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
          }}
        >{emoji}</button>
        <span style={{ fontSize: '12px', fontWeight: 800, color: accent, textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>{label}</span>
      </div>

      {showEmojiPicker && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '6px' }}>
          {EMOJI_OPTIONS.map((em) => (
            <button key={em} onClick={() => { setEmoji(em); setShowEmojiPicker(false); }}
              style={{ fontSize: '14px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            >{em}</button>
          ))}
        </div>
      )}

      <input
        type="text" value={name} onChange={(e) => setName(e.target.value)}
        placeholder={placeholder} maxLength={20} dir="rtl"
        style={{
          width: '100%', background: 'rgba(0,0,0,.35)', border: `1px solid ${accent}55`,
          borderRadius: '10px', color: '#fff', fontSize: '12px', fontWeight: 600,
          padding: '7px 8px', outline: 'none', textAlign: 'center',
        }}
      />

      <div style={{
        marginTop: '8px', height: '2px',
        background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`,
      }} />
    </motion.div>
  );
}
