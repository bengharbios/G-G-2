'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/game-store';
import RoleCard from './RoleCard';
import {
  STROKE_STYLE,
  useInGameSetupMode,
  useYallaSoundState,
  useHostHeartbeat,
  useViewerCount,
  useShareLinks,
} from '@/lib/yalla-game-helpers';
import {
  playCardFlipSound,
  playClickSound,
  playRevealSound,
} from '@/lib/sounds';

export default function CardDistribution() {
  const {
    players,
    currentDistributionIndex,
    showCard,
    setDistributionIndex,
    setShowCard,
    markCardSeen,
    setPhase,
    gameMode,
    roomCode,
  } = useGameStore();

  useInGameSetupMode();
  const { musicOn, toggleMusic } = useYallaSoundState();
  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;
  useHostHeartbeat('mafia', gameMode ?? undefined, roomCode);
  const { viewerCount } = useViewerCount('mafia', isDiwaniyaHost, roomCode);

  const currentPlayer = players[currentDistributionIndex];
  const isLastPlayer = currentDistributionIndex >= players.length - 1;

  const handleConfirm = () => {
    playClickSound();
    if (currentPlayer) {
      markCardSeen(currentPlayer.id);
    }
    if (isLastPlayer) {
      setPhase('night_start');
    } else {
      setDistributionIndex(currentDistributionIndex + 1);
      setShowCard(false);
    }
  };

  const handleShowCard = () => {
    // Card flip + reveal sound for role card distribution.
    playCardFlipSound();
    playRevealSound();
    setShowCard(true);
  };

  const progress = ((currentDistributionIndex + 1) / players.length) * 100;

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
        padding: '8px 14px 100px',
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      {/* ═══ header actions ═══ */}
      <div className="tobol-header-actions">
        <button
          type="button"
          className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
          onClick={toggleMusic}
          aria-label="sound"
          title="الصوت"
        >
          <img
            src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'}
            alt="sound"
          />
        </button>
        {isDiwaniyaHost && (
          <div
            className="tobol-eye-btn"
            style={{ position: 'relative', cursor: 'default' }}
            aria-label="viewers"
            title="المشاهدون"
          >
            <img src="/battle/icon_eye.webp" alt="viewers" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <span className="tobol-eye-count">{viewerCount}</span>
          </div>
        )}
      </div>

      {/* ═══ title row ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '2px' }}
      >
        <img
          src="/yalla-games/mafia.png"
          alt="المافيا"
          style={{ width: '38px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))' }}
        />
        <h1 style={{ ...STROKE_STYLE, fontSize: '16px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: 0 }}>
          توزيع البطاقات
        </h1>
        <span style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 700 }}>
          {currentDistributionIndex + 1}/{players.length}
        </span>
      </motion.div>

      {/* ═══ notice pill ═══ */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="tobol-board-notice-v3">
          <span className="tobol-notice-dot" />
          <span className="tobol-notice-text">
            {showCard ? '👁️ احفظ دورك — لا يراك أحد' : '🕵️ اضغط لرؤية بطاقتك'}
          </span>
        </div>
      </div>

      {/* ═══ progress bar ═══ */}
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{
          width: '100%', height: '6px', borderRadius: '999px',
          background: 'rgba(0,0,0,.5)', overflow: 'hidden',
          border: '1px solid rgba(254,239,145,.15)',
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #f59e0b, #feef91)',
              borderRadius: '999px',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* ═══ main content ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDistributionIndex}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
            style={{ width: '100%', maxWidth: '320px' }}
          >
            {/* Player name banner */}
            {!showCard && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-center mb-4"
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(254,239,145,.25), rgba(170,110,31,.05))',
                  border: '2px solid rgba(254,239,145,.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 0 14px rgba(254,239,145,.25)',
                }}>
                  <span style={{
                    fontSize: '24px', fontWeight: 900, color: '#feef91',
                    textShadow: '0 2px 4px rgba(0,0,0,.7)',
                    paintOrder: 'stroke fill',
                    WebkitTextStroke: '1px #aa6e1f',
                  }}>
                    {currentPlayer?.name.charAt(0)}
                  </span>
                </div>
                <h2 style={{
                  ...STROKE_STYLE,
                  fontSize: '20px', fontWeight: 900, marginBottom: '4px',
                }}>
                  أنا {currentPlayer?.name}
                </h2>
                <p style={{ color: '#9fc4b4', fontSize: '11px' }}>
                  اضغط لرؤية بطاقتك - لا يراك أحد!
                </p>
              </motion.div>
            )}

            {/* RoleCard */}
            {currentPlayer?.role && (
              <div className="mb-4">
                <RoleCard
                  role={currentPlayer.role}
                  playerName={showCard ? currentPlayer.name : undefined}
                  showCard={showCard}
                  size="md"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {!showCard ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleShowCard}
                  className="tobol-start-btn"
                  style={{
                    padding: '14px 16px', border: 'none',
                    color: '#feef91', fontSize: '16px', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    paintOrder: 'stroke fill',
                    WebkitTextStroke: '0.5px #aa6e1f',
                    textShadow: '0 2px 6px rgba(0,0,0,.6)',
                  }}
                >
                  <span className="tobol-start-icon">
                    <span style={{ fontSize: '16px' }}>👁️</span>
                  </span>
                  <span>أرى بطاقتي</span>
                </motion.button>
              ) : (
                <>
                  {/* Show team members for mafia */}
                  {currentPlayer?.role && (
                    ['mafia_boss', 'mafia_silencer', 'mafia_regular'].includes(currentPlayer.role) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: 'rgba(127,29,29,.3)',
                          border: '1px solid rgba(239,68,68,.4)',
                          borderRadius: '12px', padding: '10px 12px',
                          marginBottom: '8px',
                        }}
                      >
                        <p style={{
                          color: '#fca5a5', fontSize: '11px', fontWeight: 800, marginBottom: '6px',
                        }}>
                          🔴 زميلائك في المافيا:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                          {players
                            .filter(
                              (p) =>
                                p.id !== currentPlayer.id &&
                                ['mafia_boss', 'mafia_silencer', 'mafia_regular'].includes(p.role || '')
                            )
                            .map((p) => (
                              <span
                                key={p.id}
                                style={{
                                  background: 'rgba(239,68,68,.3)',
                                  color: '#fca5a5',
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  fontSize: '11px', fontWeight: 700,
                                  border: '1px solid rgba(239,68,68,.5)',
                                }}
                              >
                                {p.name}
                              </span>
                            ))}
                        </div>
                      </motion.div>
                    )
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirm}
                    className="tobol-start-btn"
                    style={{
                      padding: '14px 16px', border: 'none',
                      color: '#feef91', fontSize: '15px', fontWeight: 900, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      paintOrder: 'stroke fill',
                      WebkitTextStroke: '0.5px #aa6e1f',
                      textShadow: '0 2px 6px rgba(0,0,0,.6)',
                    }}
                  >
                    <span className="tobol-start-icon">
                      <span style={{ fontSize: '14px' }}>{isLastPlayer ? '🌙' : '➡️'}</span>
                    </span>
                    <span>{isLastPlayer ? 'ابدأ الليل' : 'التالي'}</span>
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
