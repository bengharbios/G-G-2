'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/game-store';
import PlayerAvatar from './PlayerAvatar';
import { ROLE_CONFIGS, RoleType } from '@/lib/game-types';
import {
  useInGameSetupMode,
  useGameRewards,
} from '@/lib/yalla-game-helpers';

// Confetti particles
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#feef91'];
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.8,
      duration: 2 + Math.random() * 3.5,
      size: 4 + Math.random() * 9,
      rotate: Math.random() * 1080,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

export default function GameOver() {
  const { players, gameWinner, round, eliminatedPlayers, gameLog, resetGame } = useGameStore();

  useInGameSetupMode();

  const isCitizensWin = gameWinner === 'citizen';
  const playerCount = players.length;
  const outcome = isCitizensWin ? 'win' : 'loss';
  const { godfather, rewards } = useGameRewards(true, 'mafia', outcome, playerCount);

  const alivePlayers = players.filter((p) => p.isAlive);
  const mafiaPlayers = players.filter(
    (p) => p.role && ROLE_CONFIGS[p.role].team === 'mafia'
  );
  const citizenPlayers = players.filter(
    (p) => p.role && ROLE_CONFIGS[p.role].team === 'citizen'
  );

  const handlePlayAgain = () => {
    resetGame();
  };

  const handleCloseGame = () => {
    resetGame();
    window.location.href = '/';
  };

  return (
    <div className="tobol-gameover-v2-root">
      {/* Confetti for citizen win */}
      {isCitizensWin && <Confetti />}

      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="tobol-gameover-card-v2"
      >
        {/* Trophy */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '100px', height: '100px', marginTop: '-20px' }}
        >
          <img
            src="/battle/segment_award.webp"
            alt="trophy"
            className="tobol-gameover-trophy-v2"
          />
        </motion.div>

        {/* Title */}
        <h1 className="tobol-gameover-title-v2">
          {isCitizensWin ? 'الصالحون فازوا!' : 'المافيا فازت!'}
        </h1>

        {/* Description */}
        <p className="tobol-gameover-desc-v2">
          الجولة {round} • {eliminatedPlayers.length} إقصاءات
        </p>

        {/* Godfather row */}
        <div className="tobol-gameover-godfather">
          <div className="tobol-gameover-godfather-avatar">
            <span className="tobol-gameover-godfather-crown">👑</span>
            {godfather ? (
              <img src={godfather.avatar} alt={godfather.name} />
            ) : (
              <span style={{ fontSize: '18px' }}>🕵️</span>
            )}
          </div>
          <div className="tobol-gameover-godfather-info">
            <div className="tobol-gameover-godfather-name">
              {godfather?.name || 'العراب'}
            </div>
            <span className="tobol-gameover-godfather-tag">العراب</span>
          </div>
          <div className="tobol-gameover-godfather-rewards">
            <div className="tobol-gameover-reward-chip">
              <img src="/yalla-ui/exp.png" alt="xp" />
              <span className="reward-amount">{rewards ? `+${rewards.xp}` : '...'}</span>
            </div>
            <div className="tobol-gameover-reward-chip">
              <img src="/yalla-ui/coin.webp" alt="gold" />
              <span className="reward-amount">{rewards ? `+${rewards.gold}` : '...'}</span>
            </div>
          </div>
        </div>

        {/* Level-up */}
        {rewards?.leveledUp && rewards.newLevel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="tobol-gameover-levelup"
          >
            🎉 ترقية للمستوى {rewards.newLevel}!
          </motion.div>
        )}

        {/* Teams comparison row */}
        <div className="tobol-gameover-teams-row">
          <div className={`tobol-team-result-card team-red ${isCitizensWin ? 'loser' : 'winner'}`}>
            <div className="tobol-team-result-rank">{isCitizensWin ? '💀' : '🏆'}</div>
            <div className="tobol-team-result-name">المافيا</div>
            <div className="tobol-team-result-score">{mafiaPlayers.filter(p => p.isAlive).length}/{mafiaPlayers.length}</div>
            <div className="tobol-team-result-label">{isCitizensWin ? 'خاسر' : 'فائز'}</div>
          </div>
          <div className={`tobol-team-result-card team-blue ${isCitizensWin ? 'winner' : 'loser'}`}>
            <div className="tobol-team-result-rank">{isCitizensWin ? '🏆' : '💀'}</div>
            <div className="tobol-team-result-name">الصالحون</div>
            <div className="tobol-team-result-score">{alivePlayers.length}/{citizenPlayers.length}</div>
            <div className="tobol-team-result-label">{isCitizensWin ? 'فائز' : 'خاسر'}</div>
          </div>
        </div>

        {/* Stats card */}
        <div className="tobol-gameover-stats-card">
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>👥</span>
            </div>
            <div className="tobol-gameover-stat-label">نجوا</div>
            <div className="tobol-gameover-stat-value">{alivePlayers.length}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>💀</span>
            </div>
            <div className="tobol-gameover-stat-label">أُقصوا</div>
            <div className="tobol-gameover-stat-value">{eliminatedPlayers.length}</div>
          </div>
          <div className="tobol-gameover-stat-row">
            <div className="tobol-gameover-stat-icon">
              <span style={{ fontSize: '14px' }}>🌙</span>
            </div>
            <div className="tobol-gameover-stat-label">الجولات</div>
            <div className="tobol-gameover-stat-value">{round}</div>
          </div>
        </div>

        {/* Players reveal */}
        <div style={{
          background: 'rgba(6,42,32,.6)',
          border: '1px solid rgba(254,239,145,.15)',
          borderRadius: '12px',
          padding: '10px',
          marginTop: '10px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#feef91', fontSize: '12px', fontWeight: 700 }}>🔍 كشف جميع البطاقات</span>
          </div>
          {/* Mafia team */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '999px',
              background: 'rgba(239,68,68,.18)', border: '1px solid rgba(239,68,68,.5)',
              color: '#fca5a5', fontSize: '10px', fontWeight: 800, marginBottom: '6px',
            }}>
              👿 فريق المافيا
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
              {mafiaPlayers.map((player) => (
                <PlayerAvatar
                  key={player.id}
                  name={player.name}
                  isAlive={player.isAlive}
                  role={player.role as RoleType}
                  showRole={true}
                  size="sm"
                />
              ))}
            </div>
          </div>
          {/* Citizen team */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '999px',
              background: 'rgba(59,130,246,.18)', border: '1px solid rgba(59,130,246,.5)',
              color: '#93c5fd', fontSize: '10px', fontWeight: 800, marginBottom: '6px',
            }}>
              🛡️ فريق الصالحين
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
              {citizenPlayers.map((player) => (
                <PlayerAvatar
                  key={player.id}
                  name={player.name}
                  isAlive={player.isAlive}
                  role={(player.role ?? 'citizen') as RoleType}
                  showRole={true}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Game log preview */}
        {gameLog.length > 0 && (
          <div style={{
            background: 'rgba(6,42,32,.6)',
            border: '1px solid rgba(254,239,145,.15)',
            borderRadius: '12px',
            padding: '10px',
            marginTop: '10px',
            maxHeight: '120px',
            overflowY: 'auto',
          }}>
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <span style={{ color: '#feef91', fontSize: '12px', fontWeight: 700 }}>📜 سجل اللعبة</span>
          </div>
          {gameLog.slice(-10).reverse().map((entry, i) => (
            <div key={i} style={{
              display: 'flex', gap: '6px', fontSize: '10px', padding: '2px 0',
            }}>
              <span style={{ color: '#6b7280', fontSize: '9px', flexShrink: 0, width: '18px' }}>
                {entry.round}
              </span>
              <span style={{
                color: entry.phase === 'night' ? '#a78bfa' :
                  (entry.message.includes('إقصاء') || entry.message.includes('قتل')) ? '#fca5a5' : '#cbd5e1',
              }}>
                {entry.message}
              </span>
            </div>
          ))}
        </div>
        )}

        {/* Two-button row */}
        <div className="tobol-gameover-buttons-row">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={handlePlayAgain}
            className="tobol-gameover-btn btn-yes"
          >
            <span style={{ fontSize: '14px' }}>🔄</span>
            <span>إعادة اللعبة</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleCloseGame}
            className="tobol-gameover-btn btn-no"
          >
            <span style={{ fontSize: '14px' }}>✕</span>
            <span>إغلاق اللعبة</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
