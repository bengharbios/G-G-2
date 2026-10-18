'use client';

// ════════════════════════════════════════════════════════════════
// سفن (Ships / Battleship) — Game Setup
// Pattern-matches spotdiff/GameSetup exactly via the shared kit.
// All structure/buttons/responsiveness come from GameSetupKit.
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShipsStore } from '@/lib/ships-store';
import {
  SHIP_TYPES_THEME_1,
  SHIP_TYPES_THEME_2,
  DIFFICULTY_CONFIG,
  ROUND_COUNT_OPTIONS,
  type Difficulty,
} from '@/lib/ships-types';
import {
  GameSetupShell,
  GameSetupTitle,
  PlayerInfoCard,
  DiwaniyaShareCard,
  SettingsCard,
  SectionLabel,
  TobolSelect,
  ChoiceButtonRow,
  StartButton,
  GenericCard,
} from '@/components/shared/gamesetup/GameSetupKit';

export default function GameSetup() {
  const router = useRouter();
  const {
    themeId, setThemeId,
    difficulty, setDifficulty,
    totalRounds, setTotalRounds,
    startGame,
    gameMode, roomCode, setRoomCode,
    playMode, setPlayMode,
    setPlayerName,
    playerName,
  } = useShipsStore();

  // Diwaniya: create room on mount if not already
  useEffect(() => {
    if (gameMode !== 'diwaniya') return;
    if (!useShipsStore.getState().roomCode) {
      const code = Array.from('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .join('');
      fetch('/api/ships-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, hostName: 'العراب' }),
      }).catch(() => {});
      setRoomCode(code);
    }
  }, [gameMode, roomCode, setRoomCode]);

  // In diwaniya mode, switch to teams play mode automatically
  useEffect(() => {
    if (gameMode === 'diwaniya') setPlayMode('teams');
  }, [gameMode, setPlayMode]);

  const handleStart = () => {
    startGame();
  };

  // Background per theme
  const bgImage = `/img/ship/themes/theme${themeId}/background.png`;
  const themeShips = themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2;

  // Difficulty options
  const difficultyOptions = (Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => ({
    value: d,
    label: DIFFICULTY_CONFIG[d].label,
  }));

  // Theme options
  const themeOptions = [
    { value: '1', label: '⚓ بحري' },
    { value: '2', label: '✈️ جوي' },
  ];

  return (
    <GameSetupShell
      gameSlug="ships"
      gameName="سفن"
      gameImage="/yalla-games/ships.png"
      backgroundImage={bgImage}
      roomCode={gameMode === 'diwaniya' ? roomCode : null}
      roomApiPrefix="/api/ships-room"
      exitDialogText={
        gameMode === 'diwaniya'
          ? 'سيتم إنهاء جلسة الديوانية وإخراج جميع المشاهدين، مع حفظ تقدمك للعودة لاحقاً.'
          : 'سيتم حفظ تقدمك تلقائياً — يمكنك العودة لاحقاً من مكانك.'
      }
    >
      <GameSetupTitle
        gameImage="/yalla-games/ships.png"
        gameName="سفن"
        gameNameEn="Battleship — ضع أسطولك وقصف سفن الخصم"
        pillLabel="تجهيز المعركة"
        pillEmoji="🚢"
      />

      <PlayerInfoCard
        initialName={playerName || ''}
        onNameChange={(name) => setPlayerName(name)}
        nameLabel="اسمك"
        namePlaceholder="اكتب اسمك هنا..."
      />

      {gameMode === 'diwaniya' && roomCode && (
        <DiwaniyaShareCard
          roomCode={roomCode}
          deepLinkBase="/r/ships"
          hint="💡 من يفتح الرابط يشاهد المعركة مباشرة"
        />
      )}

      {/* ══ Settings card (theme + difficulty) ══ */}
      <SettingsCard columns={2}>
        <div>
          <SectionLabel>الثيم</SectionLabel>
          <TobolSelect
            value={String(themeId)}
            onChange={(v) => setThemeId(parseInt(v))}
            options={themeOptions}
            ariaLabel="الثيم"
          />
        </div>
        <div>
          <SectionLabel>الصعوبة</SectionLabel>
          <TobolSelect
            value={difficulty}
            onChange={(v) => setDifficulty(v as Difficulty)}
            options={difficultyOptions}
            ariaLabel="الصعوبة"
          />
        </div>
      </SettingsCard>

      {/* ══ Fleet preview (ships of the selected theme) ══ */}
      <GenericCard delay={0.34}>
        <div style={{
          padding: '8px 10px',
          background: 'rgba(0,0,0,.4)',
          borderRadius: '8px',
          border: '1px solid rgba(254,239,145,.15)',
        }}>
          <div style={{
            color: '#feef91',
            paintOrder: 'stroke fill',
            WebkitTextStroke: '1px #aa6e1f',
            fontSize: '11px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '6px',
          }}>
            🚢 أسطولك ({themeShips.length} سفن)
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            justifyContent: 'center',
          }}>
            {themeShips.map(s => (
              <span key={s.id} style={{
                background: 'rgba(99,102,241,.2)',
                border: '1px solid rgba(99,102,241,.4)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '9px',
                color: '#a5b4fc',
                fontWeight: 700,
              }}>
                {s.name} ({s.length})
              </span>
            ))}
          </div>
        </div>
      </GenericCard>

      {/* ══ Round count selector ══ */}
      <ChoiceButtonRow
        options={ROUND_COUNT_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
          emoji: opt.value === 1 ? '🎯' : opt.value === 3 ? '🔥' : '🏆',
        }))}
        value={totalRounds}
        onChange={(v) => setTotalRounds(Number(v))}
      />

      <StartButton
        onClick={handleStart}
        label="ابدأ المعركة"
        emoji="⚔️"
      />
    </GameSetupShell>
  );
}
