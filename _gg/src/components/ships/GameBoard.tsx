'use client';
import { useShipsStore } from '@/lib/ships-store';
import { GRID_SIZE, SHIP_TYPES_THEME_1, SHIP_TYPES_THEME_2 } from '@/lib/ships-types';

export default function GameBoard() {
  const {
    phase, themeId, playerGrid, aiGrid, shipsToPlace,
    currentShipIndex, currentOrientation, toggleOrientation,
    canPlaceShip, placeShip, attackCell, currentTurn,
    playerScore, aiScore, playerHits, playerMisses,
    aiHits, aiMisses, gameLog, lastAction,
  } = useShipsStore();

  const shipTypes = themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2;
  const currentShip = currentShipIndex < shipsToPlace.length ? shipsToPlace[currentShipIndex] : null;

  const renderGrid = (grid: typeof playerGrid, isPlayerGrid: boolean) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
      gap: '1px',
      width: '100%',
      maxWidth: '350px',
      aspectRatio: '1 / 1',
    }}>
      {grid.map((row, r) => row.map((cell, c) => {
        let bg = 'rgba(0,0,0,.3)';
        let cursor = 'default';
        let onClick = () => {};

        if (isPlayerGrid) {
          // Player grid: show ships
          if (cell.state === 'ship') bg = 'rgba(100,150,255,.5)';
          else if (cell.state === 'hit') bg = 'rgba(239,68,68,.8)';
          else if (cell.state === 'miss') bg = 'rgba(255,255,255,.15)';

          // During placement phase: allow placing
          if (phase === 'placing' && currentShip) {
            const canPlace = canPlaceShip(r, c);
            cursor = canPlace ? 'pointer' : 'not-allowed';
            // Preview
            if (canPlace) {
              const shipLen = currentShip.length;
              const horiz = currentOrientation === 'horizontal';
              let isPreview = false;
              for (let i = 0; i < shipLen; i++) {
                if ((horiz && c + i === cell.col && r === cell.row) ||
                    (!horiz && r + i === cell.row && c === cell.col)) {
                  // This cell is part of preview
                }
              }
            }
            onClick = () => placeShip(r, c);
          }
        } else {
          // AI grid: hidden ships, show hit/miss
          if (cell.state === 'hit') bg = 'rgba(239,68,68,.8)';
          else if (cell.state === 'miss') bg = 'rgba(255,255,255,.15)';
          else { bg = 'rgba(0,50,100,.4)'; cursor = 'crosshair'; }
          if (phase === 'attacking' && currentTurn === 'player' && cell.state !== 'hit' && cell.state !== 'miss') {
            onClick = () => attackCell(r, c);
            cursor = 'crosshair';
          }
        }

        return (
          <div
            key={`${r}-${c}`}
            onClick={onClick}
            style={{
              background: bg,
              cursor,
              borderRadius: '2px',
              border: '1px solid rgba(255,255,255,.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#fff',
              transition: 'background 0.15s ease',
            }}
          >
            {cell.state === 'hit' && '💥'}
            {cell.state === 'miss' && '•'}
            {isPlayerGrid && cell.state === 'ship' && '⬛'}
          </div>
        );
      }))}
    </div>
  );

  return (
    <div dir="rtl" style={{
      minHeight: 'calc(100vh - 56px)',
      background: `url(/img/ship/themes/theme${themeId}/background.png) center / cover, #0a0b10`,
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'sans-serif',
      color: '#fff',
      overflowY: 'auto',
    }}>
      <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#feef91', marginTop: '50px' }}>
        {phase === 'placing' ? '🚢 ضع سفنك' : '⚔️ المعركة'}
      </h1>

      {/* Ship placement phase */}
      {phase === 'placing' && currentShip && (
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '14px', color: '#fbbf24' }}>
            ضع: {currentShip.name} ({currentShip.length} خلايا)
          </p>
          <p style={{ fontSize: '11px', color: '#9fc4b4' }}>
            المتبقي: {shipsToPlace.length - currentShipIndex} سفن
          </p>
          <button onClick={toggleOrientation} style={{
            background: 'rgba(99,102,241,.5)',
            border: '1px solid rgba(255,255,255,.2)',
            borderRadius: '6px', padding: '6px 12px',
            color: '#fff', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', marginTop: '6px',
          }}>
            ↻ {currentOrientation === 'horizontal' ? 'أفقي' : 'عمودي'}
          </button>
        </div>
      )}

      {/* Attacking phase: show both grids */}
      {phase === 'attacking' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#86efac', textAlign: 'center', marginBottom: '4px' }}>
              شبكتك ({playerHits} إصابات عليك)
            </p>
            {renderGrid(playerGrid, true)}
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#fbbf24', textAlign: 'center', marginBottom: '4px' }}>
              شبكة الخصم (اضغط للهجوم)
            </p>
            {renderGrid(aiGrid, false)}
          </div>
        </div>
      )}

      {/* Placing phase: only show player grid */}
      {phase === 'placing' && (
        <div>
          <p style={{ fontSize: '12px', color: '#86efac', textAlign: 'center', marginBottom: '4px' }}>
            شبكتك — اضغط لوضع السفينة
          </p>
          {renderGrid(playerGrid, true)}
        </div>
      )}

      {/* Stats */}
      {(phase === 'attacking' || phase === 'game_over') && (
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', fontWeight: 700 }}>
          <span style={{ color: '#86efac' }}>أنت: {playerScore} نقطة ({playerHits} إصابات)</span>
          <span style={{ color: '#f87171' }}>الخصم: {aiScore} نقطة ({aiHits} إصابات)</span>
        </div>
      )}

      {/* Last action */}
      {lastAction && (
        <p style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 700, textAlign: 'center' }}>
          {lastAction}
        </p>
      )}

      {/* Turn indicator */}
      {phase === 'attacking' && (
        <p style={{ fontSize: '14px', fontWeight: 800, color: currentTurn === 'player' ? '#86efac' : '#f87171' }}>
          {currentTurn === 'player' ? '🎮 دورك — اضغط على شبكة الخصم' : '⏳ دور الخصم...'}
        </p>
      )}

      {/* Game log (last 5) */}
      {gameLog.length > 0 && (
        <div style={{ maxWidth: '400px', width: '100%', marginTop: '10px' }}>
          <p style={{ fontSize: '11px', color: '#9fc4b4', fontWeight: 700, marginBottom: '4px' }}>📜 السجل:</p>
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
      )}
    </div>
  );
}
