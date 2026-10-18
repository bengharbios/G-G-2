'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useShipsStore } from '@/lib/ships-store';
import {
  GRID_SIZE, SHIP_TYPES_THEME_1, SHIP_TYPES_THEME_2,
  DIFFICULTY_CONFIG, type GridCell, type CellState,
} from '@/lib/ships-types';
import {
  isMusicEnabled, setMusicEnabled,
  playClickSound, playCorrectSound, playWrongSound,
  playBombSound, playSparkleSound, playWinSound, playLoseSound,
} from '@/lib/sounds';

const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

// Build URL for a ship model segment image
function shipModelUrl(themeId: number, modelNum: number, orientation: 'horizontal' | 'vertical', segment: number): string {
  return `/img/ship/themes/theme${themeId}/model${modelNum}/${orientation}/${segment}.png`;
}

// Build URL for hit/miss markers
function hitUrl(themeId: number) { return `/img/ship/themes/theme${themeId}/hit.png`; }
function hitBlackUrl(themeId: number) { return `/img/ship/themes/theme${themeId}/hit_black.png`; }
function missUrl(themeId: number) { return `/img/ship/themes/theme${themeId}/miss.png`; }

// Build URL for legend image
function legendEmptyUrl(themeId: number, length: number) { return `/img/ship/themes/theme${themeId}/legend/empty/${length}.png`; }

// Map shipTypeId to model number (1-5)
function shipTypeToModelNum(shipTypeId: string): number {
  const map: Record<string, number> = {
    carrier: 1, submarine: 2, destroyer: 3, battleship: 4, patrol: 5,
    fighter: 1, helicopter: 2, tank: 3, camp: 4, armored: 5,
  };
  return map[shipTypeId] || 1;
}

// Letters for row headers (A-J)
const ROW_LETTERS = ['A','B','C','D','E','F','G','H','I','J'];

export default function GameBoard() {
  const router = useRouter();
  const {
    phase, themeId, playerGrid, aiGrid, shipsToPlace,
    currentShipIndex, currentOrientation, toggleOrientation,
    canPlaceShip, placeShip, attackCell, currentTurn,
    playerScore, aiScore, playerHits, playerMisses,
    aiHits, aiMisses, gameLog, lastAction, resetGame,
    playMode, placingTeam, currentTeam, hideHands,
    message, sunkShipName, winner,
    toggleHideHands, hideMessage, switchTurn,
    playerShipsSunk, aiShipsSunk,
    gameMode,
  } = useShipsStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  // Track last attack for per-cell explosion/splash overlay animation
  const [lastAttack, setLastAttack] = useState<{
    row: number; col: number; type: 'hit' | 'miss'; ts: number;
  } | null>(null);
  // Track last ship placement for "ship pop-in" animation
  const [lastPlaced, setLastPlaced] = useState<{
    row: number; col: number; ts: number;
  } | null>(null);

  useEffect(() => { setMusicOn(isMusicEnabled()); }, []);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('in-game-setup');
      return () => { document.body.classList.remove('in-game-setup'); };
    }
  }, []);

  const toggleMusic = () => { const n = !musicOn; setMusicOn(n); setMusicEnabled(n); };
  // Exit: end diwaniya room (fire-and-forget) + go to home page.
  // We DO NOT call resetGame() — zustand persist keeps the game state in
  // localStorage so the user can return later and resume from where they
  // Explicit exit: user clicked the exit button → forfeit the game.
  // - End diwaniya room (kick spectators + opponent benefits since host
  //   didn't exit voluntarily on their side).
  // - Wipe local game state (no XP/gold awarded, no resume possible).
  // - Also wipe the disconnect timestamp so the resume prompt doesn't
  //   fire on next visit (we use a separate timestamp for the disconnect
  //   detection in useGameResume; if we don't clear it, the prompt could
  //   trigger erroneously after a fresh explicit exit).
  // - Go to home page.
  // This is distinct from a DISCONNECT (pagehide/unload), where state
  // IS preserved and user can resume within a 2-minute grace window.
  const handleQuit = () => {
    const st = useShipsStore.getState();
    // End diwaniya room session so spectators are kicked immediately
    if (st.gameMode === 'diwaniya' && st.roomCode) {
      try { fetch(`/api/ships-room/${st.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
    }
    // Wipe local state — explicit exit = forfeit (no resume, no XP/gold)
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ships-game-storage');
        localStorage.removeItem('ships-game-storage__disconnect_ts');
      }
    } catch { /* ignore */ }
    // Reset in-memory state too
    useShipsStore.getState().resetGame();
    setShowQuitDialog(false);
    router.push('/');
  };

  const shipTypes = themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2;
  const currentShip = currentShipIndex < shipsToPlace.length ? shipsToPlace[currentShipIndex] : null;
  const currentModelNum = currentShip ? shipTypeToModelNum(currentShip.id) : 1;

  // Preview cells for ship placement
  const previewCells = useMemo(() => {
    if (!hoverCell || !currentShip || phase !== 'placing') return new Set<string>();
    const cells = new Set<string>();
    for (let i = 0; i < currentShip.length; i++) {
      if (currentOrientation === 'horizontal') {
        if (hoverCell.col + i < GRID_SIZE) cells.add(`${hoverCell.row}-${hoverCell.col + i}`);
      } else {
        if (hoverCell.row + i < GRID_SIZE) cells.add(`${hoverCell.row + i}-${hoverCell.col}`);
      }
    }
    return cells;
  }, [hoverCell, currentShip, currentOrientation, phase]);

  const canPlace = hoverCell ? canPlaceShip(hoverCell.row, hoverCell.col) : false;

  // Render a single grid with coordinate headers
  const renderGrid = (grid: GridCell[][], isPlayer: boolean) => {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${GRID_SIZE}, 1fr)`,
        gap: '0',
        width: '100%',
        aspectRatio: '1.05 / 1',
        background: 'linear-gradient(180deg, rgba(8,28,22,.92), rgba(4,18,14,.96))',
        borderRadius: '8px',
        padding: '2px',
        overflow: 'hidden',
        border: '2px solid rgba(254,239,145,.2)',
      }}>
        {/* Top-left corner (empty) */}
        <div style={{ width: '22px', background: 'rgba(0,0,0,.3)' }} />
        {/* Top row: numbers 1-10 */}
        {Array.from({ length: GRID_SIZE }, (_, i) => (
          <div key={`col-${i}`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 900, color: '#feef91',
            background: 'rgba(0,0,0,.3)', minHeight: '22px',
          }}>{i + 1}</div>
        ))}
        {/* Grid rows */}
        {grid.map((row, r) => (
          <div key={`row-${r}`} style={{ display: 'contents' }}>
            {/* Row header: letter A-J */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 900, color: '#feef91',
              background: 'rgba(0,0,0,.3)', width: '22px',
            }}>{ROW_LETTERS[r]}</div>
            {/* Cells */}
            {row.map((cell, c) => {
              const key = `${r}-${c}`;
              const isPreview = isPlayer && previewCells.has(key);
              let bg = 'rgba(0,0,0,.15)';
              let cursor = 'default';
              let onClick = () => {};
              let imgSrc = '';
              let imgStyle: React.CSSProperties = {};

              if (isPlayer) {
                if ((cell.state === 'ship' || cell.state === 'hit') && cell.shipModelNum && cell.shipSegment) {
                  const orientation = cell.shipOrientation || 'horizontal';
                  const segment = cell.shipSegment;
                  imgSrc = shipModelUrl(themeId, cell.shipModelNum, orientation, segment);
                  // Horizontal ships in RTL: based on VLM analysis of the
                  // actual flashi segment images, ALL segment images have
                  // the "front" (bow-facing side) on the RIGHT.
                  // For a horizontal ship placed in RTL (cells flow right-to-left):
                  //   - Segment 1 placed at RIGHTMOST cell, segment N at LEFTMOST
                  //   - The ship "faces left" in RTL (bow on right end, stern on left)
                  //   - Segment 1 should have its stern on the FAR RIGHT (away from ship)
                  //     → source has stern on LEFT → needs scaleX(-1) to move stern to RIGHT
                  //   - Segment N should have its bow on the FAR LEFT (away from ship)
                  //     → source has bow on RIGHT → needs scaleX(-1) to move bow to LEFT
                  //   - Middle segments: symmetric, flip optional — keep flipped for
                  //     consistency with the user's "middle is excellent" feedback
                  // So we FLIP ALL horizontal segments uniformly.
                  // (Previous attempt to skip the last segment caused the
                  // stern to land in the wrong position; the user reported
                  // 'first and last wrong, middle correct'. Reverting to
                  // flip-all which previously gave '3 correct + 1 wrong (last)'
                  // but with a corrected layout that fixes the last too.)
                  if (orientation === 'horizontal') {
                    imgStyle = {
                      width: '100%', height: '100%', objectFit: 'cover',
                      transform: 'scaleX(-1)',
                    };
                  } else {
                    imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
                  }
                } else if (cell.state === 'hit') {
                  imgSrc = hitUrl(themeId);
                  imgStyle = { width: '85%', height: '85%', objectFit: 'contain' };
                } else if (cell.state === 'miss') {
                  imgSrc = missUrl(themeId);
                  imgStyle = { width: '70%', height: '70%', objectFit: 'contain' };
                }

                if (phase === 'placing' && currentShip) {
                  cursor = canPlaceShip(r, c) ? 'pointer' : 'not-allowed';
                  onClick = () => {
                    if (soundOn) playClickSound();
                    if (soundOn) playSparkleSound();
                    placeShip(r, c);
                    setLastPlaced({ row: r, col: c, ts: Date.now() });
                  };
                  if (isPreview && !canPlace) bg = 'rgba(239,68,68,.2)';
                }
              } else {
                // AI / opponent grid — hide ships (state==='ship' treated as empty)
                if (cell.state === 'hit') {
                  imgSrc = hitBlackUrl(themeId);
                  imgStyle = { width: '85%', height: '85%', objectFit: 'contain' };
                } else if (cell.state === 'miss') {
                  imgSrc = missUrl(themeId);
                  imgStyle = { width: '70%', height: '70%', objectFit: 'contain' };
                } else { bg = 'rgba(0,30,60,.2)'; }

                if (phase === 'attacking' && currentTurn === 'player' && cell.state !== 'hit' && cell.state !== 'miss') {
                  cursor = 'crosshair';
                  onClick = () => {
                    if (soundOn) playClickSound();
                    attackCell(r, c);
                    setTimeout(() => {
                      const lastLog = useShipsStore.getState().gameLog[useShipsStore.getState().gameLog.length - 1];
                      if (lastLog?.message.includes('إصابة')) {
                        if (soundOn) playBombSound();
                        setLastAttack({ row: r, col: c, type: 'hit', ts: Date.now() });
                      } else if (lastLog?.message.includes('خطأ')) {
                        if (soundOn) playWrongSound();
                        setLastAttack({ row: r, col: c, type: 'miss', ts: Date.now() });
                      }
                    }, 100);
                  };
                }
              }

              return (
                <div
                  key={key}
                  onClick={onClick}
                  onMouseEnter={() => { if (isPlayer && phase === 'placing') setHoverCell({ row: r, col: c }); }}
                  onMouseLeave={() => { if (isPlayer && phase === 'placing') setHoverCell(null); }}
                  style={{
                    background: bg,
                    cursor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    transition: 'background 0.15s ease',
                    border: '0.5px solid rgba(255,255,255,.05)',
                    userSelect: 'none',
                    minHeight: '22px',
                    position: 'relative',
                  }}
                >
                  {imgSrc && (
                    <motion.img
                      src={imgSrc}
                      alt=""
                      draggable={false}
                      style={imgStyle}
                      initial={isPlayer && lastPlaced && lastPlaced.row === r && lastPlaced.col === c && (Date.now() - lastPlaced.ts < 1500) ? { scale: 0, opacity: 0 } : false}
                      animate={isPlayer && lastPlaced && lastPlaced.row === r && lastPlaced.col === c && (Date.now() - lastPlaced.ts < 1500) ? { scale: 1, opacity: 1 } : {}}
                      transition={{ type: 'spring', bounce: 0.45, duration: 0.5 }}
                    />
                  )}
                  {/* Explosion / water-splash overlay on freshly attacked AI cell */}
                  {!isPlayer && lastAttack && lastAttack.row === r && lastAttack.col === c && (Date.now() - lastAttack.ts < 1300) && (
                    <motion.div
                      key={`attack-${r}-${c}-${lastAttack.ts}`}
                      initial={{ scale: 0.1, opacity: 0, rotate: -30 }}
                      animate={{ scale: [0.1, 1.4, 1], opacity: [0, 1, 0], rotate: [-30, 30, 0] }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none',
                        zIndex: 5,
                      }}
                    >
                      {lastAttack.type === 'hit' ? (
                        <img
                          src={`/img/ship/themes/theme${themeId}/explosion_message.png`}
                          alt=""
                          style={{ width: '180%', height: '180%', objectFit: 'contain' }}
                        />
                      ) : (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0] }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{
                            width: '90%', height: '90%', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(125,211,252,.85), rgba(56,189,248,.4) 60%, transparent 80%)',
                            filter: 'blur(2px)',
                          }}
                        />
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      dir="rtl"
      className="tobol-bg"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 12px 16px',
        gap: '6px',
        overflowY: 'auto',
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
      }}
    >
      {/* Header actions */}
      <div className="tobol-header-actions">
        <button
          type="button"
          className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
          onClick={toggleMusic}
          aria-label="الصوت"
        >
          <img src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sound" style={{ width: '26px', height: '26px' }} />
        </button>
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowQuitDialog(true)}
          aria-label="إنهاء"
        >
          <img src="/battle/btn_quit_game.webp" alt="quit" style={{ width: '26px', height: '26px' }} />
        </button>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginTop: '44px', padding: '4px 12px', borderRadius: '14px',
          background: 'rgba(6,42,32,.45)', border: '1px solid rgba(254,239,145,.12)',
        }}
      >
        <img src="/yalla-games/ships.png" alt="سفن" draggable={false}
          style={{ width: '48px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }} />
        <div>
          <h1 style={{ ...STROKE_STYLE, fontSize: '16px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', margin: 0, lineHeight: 1.1 }}>
            سفن
          </h1>
          <div style={{ color: '#9fc4b4', fontSize: '10px', fontWeight: 700, marginTop: '1px' }}>
            {phase === 'placing' ? `${placingTeam === 'team2' ? 'الفريق الثاني' : 'الفريق الأول'} — وضع السفن` : phase === 'attacking' ? 'المعركة' : phase === 'pass_phone' ? 'مرر الهاتف' : 'انتهت'}
          </div>
        </div>
      </motion.div>

      {/* Placement phase: ship info + orientation + legend */}
      {phase === 'placing' && currentShip && playMode !== 'watch' && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="tobol-team-card"
            style={{ width: '100%', maxWidth: '460px', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            {/* Ship preview image */}
            <img
              src={shipModelUrl(themeId, currentModelNum, currentOrientation, 1)}
              alt={currentShip.name}
              style={{ width: '30px', height: '30px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...STROKE_STYLE, fontSize: '14px', fontWeight: 800 }}>
                🚢 {currentShip.name}
              </div>
              <div style={{ fontSize: '10px', color: '#9fc4b4', fontWeight: 600 }}>
                الطول: {currentShip.length} خلايا • المتبقي: {shipsToPlace.length - currentShipIndex} سفن
              </div>
            </div>
            <button
              onClick={() => { if (soundOn) playClickSound(); toggleOrientation(); }}
              style={{
                background: 'rgba(99,102,241,.5)',
                border: '1px solid rgba(255,255,255,.2)',
                borderRadius: '8px', padding: '8px 14px',
                color: '#fff', fontSize: '12px', fontWeight: 800,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              ↻ {currentOrientation === 'horizontal' ? 'أفقي' : 'عمودي'}
            </button>
          </motion.div>

          {/* Legend panel */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="tobol-team-card"
            style={{ width: '100%', maxWidth: '460px', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ ...STROKE_STYLE, fontSize: '11px', fontWeight: 700 }}>الأسطول:</span>
            {shipTypes.map((s, i) => {
              const modelNum = i + 1;
              const placed = i < currentShipIndex;
              // flashi prepareLegend pattern: sunk ships → greyed legend
              const isSunk = phase === 'attacking' && (
                (playMode === 'ai' && aiShipsSunk[i]) ||
                (playMode === 'teams' && currentTeam === 'team1' && aiShipsSunk[i]) ||
                (playMode === 'teams' && currentTeam === 'team2' && playerShipsSunk[i])
              );
              const isOpponentSunk = phase === 'attacking' && (
                (playMode === 'ai' && aiShipsSunk[i]) ||
                (playMode === 'teams' && currentTeam === 'team1' && aiShipsSunk[i]) ||
                (playMode === 'teams' && currentTeam === 'team2' && playerShipsSunk[i])
              );
              return (
                <img
                  key={s.id}
                  src={legendEmptyUrl(themeId, s.length)}
                  alt={s.name}
                  style={{
                    width: '24px', height: '20px', objectFit: 'contain',
                    opacity: placed || isOpponentSunk ? 0.3 : 1,
                    filter: placed || isOpponentSunk ? 'grayscale(1)' : 'none',
                    transition: 'opacity 0.3s ease, filter 0.3s ease',
                  }}
                />
              );
            })}
          </motion.div>
        </>
      )}

      {/* Attacking phase: score + turn */}
      {(phase === 'attacking' || phase === 'game_over') && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="tobol-team-card"
          style={{ width: '100%', maxWidth: '460px', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div style={{
            ...STROKE_STYLE, fontSize: '14px', fontWeight: 800, textAlign: 'center',
            padding: '6px 10px', border: '1px solid rgba(34,197,94,.3)',
            borderRadius: '8px', background: 'rgba(0,0,0,.4)', minWidth: '80px',
            display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '16px' }}>🏆</span>
            <span style={{ color: '#86efac', fontSize: '16px', fontWeight: 900 }}>{playerScore}</span>
          </div>
          <div style={{
            flex: 1, padding: '6px 12px', border: '1px solid rgba(239,68,68,.3)',
            borderRadius: '8px', background: 'rgba(0,0,0,.55)', textAlign: 'center',
            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <span style={{
              fontSize: '16px', fontWeight: 900,
              color: currentTurn === 'player' ? '#86efac' : '#f87171',
            }}>
              {currentTurn === 'player' ? '🎮 دورك' : '⏳ دور الخصم'}
            </span>
          </div>
          <div style={{
            ...STROKE_STYLE, fontSize: '14px', fontWeight: 800, textAlign: 'center',
            padding: '6px 10px', border: '1px solid rgba(239,68,68,.3)',
            borderRadius: '8px', background: 'rgba(0,0,0,.4)', minWidth: '80px',
            display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '16px' }}>💀</span>
            <span style={{ color: '#f87171', fontSize: '16px', fontWeight: 900 }}>{aiScore}</span>
          </div>
        </motion.div>
      )}


      {/* All ships placed — confirm (teams mode) */}
      {phase === 'placing' && !currentShip && playMode === 'teams' && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => useShipsStore.getState().confirmPlacement()}
          style={{
            width: '100%', maxWidth: '460px', padding: '14px 16px', border: 'none',
            background: 'linear-gradient(135deg, #22c55e, #15803d)',
            color: '#fff', fontSize: '17px', fontWeight: 900, cursor: 'pointer',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            boxShadow: '0 4px 16px rgba(34,197,94,.35)',
          }}
        >
          ✓ {placingTeam === 'team1' ? 'الفريق الأول جاهز — مرر الهاتف' : 'كلا الفريقين جاهزان — ابدأ المعركة!'}
        </motion.button>
      )}
      {/* AI opponent indicator — only in 'ai' (godfather/classic) mode */}
      {playMode === 'ai' && phase !== 'game_over' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '999px',
            background: 'rgba(99,102,241,.18)',
            border: '1px solid rgba(99,102,241,.45)',
            color: '#a5b4fc', fontSize: '11px', fontWeight: 800,
            marginTop: '2px',
          }}
        >
          <span style={{ fontSize: '14px' }}>🤖</span>
          <span>أنت تلعب ضد الهاتف (AI)</span>
        </motion.div>
      )}

      {/* Grids — VERTICAL stack on mobile, full width each */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {phase === 'placing' ? (
          <div className="tobol-team-card" style={{ padding: '10px', borderRadius: '12px' }}>
            <p style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
              شبكتك — اضغط لوضع السفينة
            </p>
            {renderGrid(playerGrid, true)}
          </div>
        ) : (
          <>
            {/* Player fleet (smaller, on top) */}
            <div className="tobol-team-card" style={{ padding: '8px', borderRadius: '12px' }}>
              <p style={{ fontSize: '11px', color: '#86efac', textAlign: 'center', marginBottom: '4px', fontWeight: 700 }}>
                {playMode === 'teams' ? (currentTeam === 'team1' ? 'أسطول الفريق الأول' : 'أسطول الفريق الثاني') : '🚢 أسطولك'}
              </p>
              {renderGrid(playerGrid, true)}
            </div>

            {/* Opponent grid (LARGER, on bottom — this is what you attack) */}
            <div className="tobol-team-card" style={{
              padding: '10px', borderRadius: '12px',
              boxShadow: '0 0 18px rgba(251,191,36,.18)',
              border: '1.5px solid rgba(251,191,36,.35)',
            }}>
              <p style={{
                ...STROKE_STYLE,
                fontSize: '13px', fontWeight: 800,
                textAlign: 'center', marginBottom: '6px',
              }}>
                🎯 {playMode === 'teams'
                  ? (currentTeam === 'team1' ? 'أسطول الفريق الثاني — اضغط للهجوم' : 'أسطول الفريق الأول — اضغط للهجوم')
                  : 'خصمك — اضغط للهجوم'}
              </p>
              {renderGrid(aiGrid, false)}
            </div>
          </>
        )}
      </motion.div>

      {/* Last action */}
      {lastAction && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ ...STROKE_STYLE, fontSize: '13px', fontWeight: 700, textAlign: 'center' }}
        >
          {lastAction}
        </motion.p>
      )}

      {/* Game log */}
      {gameLog.length > 0 && (
        <div style={{ width: '100%', maxWidth: '460px', marginTop: '4px' }}>
          <p style={{ fontSize: '10px', color: '#9fc4b4', fontWeight: 700, marginBottom: '4px' }}>📜 السجل:</p>
          <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
            {gameLog.slice(-5).map((entry, i) => (
              <div key={i} style={{
                fontSize: '10px', padding: '2px 6px', marginBottom: '2px', borderRadius: '4px',
                background: entry.type === 'success' ? 'rgba(34,197,94,.1)' :
                           entry.type === 'danger' ? 'rgba(239,68,68,.1)' :
                           entry.type === 'system' ? 'rgba(254,239,145,.1)' : 'rgba(159,196,180,.05)',
                color: entry.type === 'success' ? '#86efac' :
                       entry.type === 'danger' ? '#f87171' :
                       entry.type === 'system' ? '#feef91' : '#9fc4b4',
              }}>{entry.message}</div>
            ))}
          </div>
        </div>
      )}

      {/* Pass phone overlay (teams mode — between turns) */}
      <AnimatePresence>
        {(phase === 'pass_phone' || hideHands) && phase !== 'game_over' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.9)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 200, color: '#fff', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📱</div>
            <h2 style={{
              color: '#feef91', fontSize: '24px', fontWeight: 900,
              textShadow: '0 2px 6px rgba(0,0,0,.85)',
              marginBottom: '12px',
              paintOrder: 'stroke fill',
              WebkitTextStroke: '1px #aa6e1f',
            }}>
              مرر الهاتف
            </h2>
            <p style={{ color: '#9fc4b4', fontSize: '14px', marginBottom: '20px' }}>
              {currentTeam === 'team1' ? 'الفريق الأول' : 'الفريق الثاني'} — دورك للهجوم
            </p>
            <button
              onClick={() => {
                toggleHideHands();
                if (phase === 'pass_phone') {
                  useShipsStore.setState({ phase: 'attacking', hideHands: false });
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #aa6e1f)',
                color: '#000', border: 'none', borderRadius: '12px',
                padding: '14px 30px', fontSize: '16px', fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              ✓ جاهز — ابدأ دورك
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosion message (ship sunk) */}
      <AnimatePresence>
        {message === 'explosion' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            style={{
              position: 'fixed', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 150, pointerEvents: 'none',
            }}
          >
            <motion.img
              src={`/img/ship/themes/theme${themeId}/explosion_message.png`}
              alt="انفجار!"
              initial={{ rotate: -5 }}
              animate={{ rotate: 5 }}
              transition={{ duration: 0.3, repeat: 3, repeatType: 'reverse' }}
              style={{ maxWidth: '80vw', maxHeight: '40vh', objectFit: 'contain' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win message (game over) */}
      <AnimatePresence>
        {message === 'win' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
            style={{
              position: 'fixed', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 150, pointerEvents: 'none',
            }}
          >
            <motion.img
              src={`/img/ship/themes/theme${themeId}/win_message.png`}
              alt="فوز!"
              style={{ maxWidth: '80vw', maxHeight: '40vh', objectFit: 'contain' }}
            />
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                color: '#fbbf24', fontSize: '20px', fontWeight: 900,
                marginTop: '16px', textShadow: '0 2px 6px rgba(0,0,0,.85)',
                paintOrder: 'stroke fill',
                WebkitTextStroke: '1px #aa6e1f',
              }}
            >
              {winner === 'team1' ? '🏆 الفريق الأول فاز!' : '🏆 الفريق الثاني فاز!'}
            </motion.p>
            {/* flashi goFireworks pattern: confetti particles */}
            {message === 'win' && (
              <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 140, overflow: 'hidden' }}>
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: `${Math.random() * 100}vw`,
                      y: '-10px',
                      opacity: 1,
                      scale: Math.random() * 0.5 + 0.5,
                    }}
                    animate={{
                      y: '110vh',
                      opacity: 0,
                      rotate: Math.random() * 1080,
                    }}
                    transition={{
                      duration: Math.random() * 2 + 2,
                      delay: Math.random() * 1.5,
                      ease: 'easeIn',
                    }}
                    style={{
                      position: 'absolute',
                      width: Math.random() * 10 + 4,
                      height: Math.random() * 10 + 4,
                      background: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#feef91'][i % 7],
                      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quit dialog */}
      <AnimatePresence>
        {showQuitDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowQuitDialog(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-team-card"
              style={{ padding: '20px', width: '100%', maxWidth: '300px', textAlign: 'center', borderRadius: '18px' }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>الخروج من اللعبة؟</h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                {gameMode === 'diwaniya'
                  ? 'سيتم إنهاء جلسة الديوانية وإخراج المشاهدين. سيُحسب عليك الانسحاب — لن تحصل على نقاط خبرة أو ذهب.'
                  : `سيتم إنهاء اللعبة نهائياً — لن تحصل على نقاط خبرة أو ذهب. (نقاطك الحالية: ${playerScore})`}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowQuitDialog(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(80,80,80,.3)', color: '#cbd5e1', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
                <button onClick={handleQuit}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,.35)' }}>نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
