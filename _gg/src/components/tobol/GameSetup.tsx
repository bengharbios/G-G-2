'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTobolStore } from '@/lib/tobol-store';
import type { Team } from '@/lib/tobol-types';

export default function GameSetup() {
  const { setTeamNames, setScores, startGame } = useTobolStore();

  const [redName, setRedName] = useState('');
  const [blueName, setBlueName] = useState('');
  const [score, setScore] = useState('350');
  const [firstTeam, setFirstTeam] = useState<Team>('red');

  const handleStart = () => {
    const t1 = redName.trim() || 'الجيش الأحمر';
    const t2 = blueName.trim() || 'الجيش الأزرق';
    const s = parseInt(score) || 350;
    setTeamNames(t1, t2);
    setScores(s, s);
    startGame(firstTeam);
  };

  const isValid = redName.trim() && blueName.trim() && parseInt(score) > 0;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 130px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 16px 120px',
        gap: '12px',
      }}
    >
      {/* عنوان صغير */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          fontSize: '18px', fontWeight: 900, color: '#feef91',
          paintOrder: 'stroke fill',
          WebkitTextStroke: '1px #aa6e1f',
          marginBottom: '4px',
        }}
      >⚔️ تجهيز المعركة</motion.h2>

      {/* مقعدان متجاوران (مثل مقاعد yalla) */}
      <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '360px' }}>
        {/* الفريق الأحمر */}
        <TeamSeat
          color="red"
          name={redName}
          setName={setRedName}
          selected={firstTeam === 'red'}
          onSelect={() => setFirstTeam('red')}
          delay="0.08s"
        />
        {/* الفريق الأزرق */}
        <TeamSeat
          color="blue"
          name={blueName}
          setName={setBlueName}
          selected={firstTeam === 'blue'}
          onSelect={() => setFirstTeam('blue')}
          delay="0.16s"
        />
      </div>

      {/* النقاط الأولية (مشتركة) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(6,42,32,.6)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,.08)', padding: '8px 12px',
          width: '100%', maxWidth: '360px',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#9fc4b4', whiteSpace: 'nowrap' }}>🎯 النقاط:</span>
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          min={1}
          max={9999}
          dir="ltr"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: '16px', fontWeight: 'bold', textAlign: 'center',
            width: '60px',
          }}
        />
      </motion.div>

      {/* تنبيه: من يبدأ */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ fontSize: '11px', color: '#9fc4b4', textAlign: 'center' }}
      >
        {firstTeam === 'red' ? '🔴 الفريق الأحمر يبدأ أولاً' : '🔵 الفريق الأزرق يبدأ أولاً'}
      </motion.p>

      {/* زر البدء (btn_yes_big style) */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        whileHover={isValid ? { scale: 1.02 } : {}}
        whileTap={isValid ? { scale: 0.96 } : {}}
        onClick={handleStart}
        disabled={!isValid}
        style={{
          width: '100%', maxWidth: '360px',
          padding: '14px', borderRadius: '12px', border: 'none',
          background: isValid
            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
            : 'rgba(100,100,100,.3)',
          color: isValid ? '#fff' : '#64748b',
          fontSize: '18px', fontWeight: 900, cursor: isValid ? 'pointer' : 'not-allowed',
          boxShadow: isValid ? '0 6px 20px rgba(245,158,11,.35)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          paintOrder: 'stroke fill',
          WebkitTextStroke: isValid ? '0.5px #feef91' : 'none',
        }}
      >
        <span>⚔️</span>
        بدء المعركة
      </motion.button>
    </div>
  );
}

// ===== مقعد فريق (مثل bg_associate_seat من yalla) =====
function TeamSeat({
  color, name, setName, selected, onSelect, delay,
}: {
  color: 'red' | 'blue';
  name: string;
  setName: (v: string) => void;
  selected: boolean;
  onSelect: () => void;
  delay: string;
}) {
  const isRed = color === 'red';
  const accent = isRed ? '#ef4444' : '#3b82f6';
  const bg = isRed ? 'rgba(239,68,68,.1)' : 'rgba(59,130,246,.1)';
  const borderColor = selected ? accent : `${accent}40`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: parseFloat(delay) }}
      onClick={onSelect}
      style={{
        flex: 1, borderRadius: '14px', overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        background: bg,
        padding: '10px', cursor: 'pointer',
        transition: 'border-color .15s',
      }}
    >
      {/* رأس المقعد */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
      }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: `${accent}30`, border: `1px solid ${accent}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '12px' }}>{isRed ? '🔴' : '🔵'}</span>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: accent }}>{isRed ? 'الأحمر' : 'الأزرق'}</span>
        {selected && (
          <span style={{ fontSize: '10px', color: '#fbbf24', marginRight: 'auto' }}>⬅ يبدأ</span>
        )}
      </div>
      {/* اسم الفريق */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={isRed ? 'الجيش الأحمر' : 'الجيش الأزرق'}
        maxLength={20}
        dir="rtl"
        style={{
          width: '100%', background: 'rgba(0,0,0,.3)',
          border: `1px solid ${accent}20`, borderRadius: '8px',
          color: '#fff', fontSize: '13px', padding: '8px 10px',
          outline: 'none', textAlign: 'center',
        }}
      />
    </motion.div>
  );
}
