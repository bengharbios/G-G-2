'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useShipsStore } from '@/lib/ships-store';
import {
  GRID_SIZE, SHIP_TYPES_THEME_1, SHIP_TYPES_THEME_2,
  DIFFICULTY_CONFIG, type GridCell,
} from '@/lib/ships-types';
import {
  isMusicEnabled, setMusicEnabled,
  isSoundEnabled, setSoundEnabled,
  playClickSound, playCorrectSound, playWrongSound,
} from '@/lib/sounds';

const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

function HeaderChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: number; sender: string; text: string }>>([]);
  const [input, setInput] = useState('');
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'لاعب', text }]);
    setInput('');
  };

  return (
    <>
      <button
        type="button"
        className={`tobol-header-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="دردشة"
        style={{ position: 'relative' }}
      >
        <img src="/battle/icon_chat.webp" alt="chat" style={{ width: '26px', height: '26px' }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="tobol-chat-panel-overlay"
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-chat-panel"
            >
              <div className="tobol-chat-panel-header">
                <span className="tobol-chat-panel-title">دردشة الطاولة</span>
                <button onClick={() => setIsOpen(false)} className="tobol-chat-panel-close" aria-label="إغلاق">×</button>
              </div>
              <div className="tobol-chat-panel-body">
                {messages.length === 0 ? <p className="tobol-chat-empty">لا رسائل بعد</p> :
                  messages.map(m => <div key={m.id} className="tobol-chat-msg me"><span className="msg-bubble">{m.text}</span></div>)}
                <div ref={msgEndRef} />
              </div>
              <div className="tobol-chat-panel-input-row">
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="أرسل رسالة..." maxLength={200} dir="rtl" />
                <button onClick={handleSend} disabled={!input.trim()}>إرسال</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function GameBoard() {
  const router = useRouter();
  const {
    phase, themeId, playerGrid, aiGrid, shipsToPlace,
    currentShipIndex, currentOrientation, toggleOrientation,
    canPlaceShip, placeShip, attackCell, currentTurn,
    playerScore, aiScore, playerHits, playerMisses,
    aiHits, aiMisses, gameLog, lastAction, resetGame,
  } = useShipsStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('in-game-setup');
      return () => { document.body.classList.remove('in-game-setup'); };
    }
  }, []);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const handleQuit = () => {
    resetGame();
    router.push('/ships');
  };

  const shipTypes = themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2;
  const currentShip = currentShipIndex < shipsToPlace.length ? shipsToPlace[currentShipIndex] : null;

  // Preview cells for ship placement
  const previewCells = useMemo(() => {
    if (!hoverCell || !currentShip || phase !== 'placing') return new Set<string>();
    const cells = new Set<string>();
    const len = currentShip.length;
    for (let i = 0; i < len; i++) {
      if (currentOrientation === 'horizontal') {
        if (hoverCell.col + i < GRID_SIZE) cells.add(`${hoverCell.row}-${hoverCell.col + i}`);
      } else {
        if (hoverCell.row + i < GRID_SIZE) cells.add(`${hoverCell.row + i}-${hoverCell.col}`);
      }
    }
    return cells;
  }, [hoverCell, currentShip, currentOrientation, phase]);

  const canPlace = hoverCell ? canPlaceShip(hoverCell.row, hoverCell.col) : false;

  const renderGrid = (grid: GridCell[][], isPlayer: boolean) => {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: '1px',
        width: '100%',
        aspectRatio: '1 / 1',
        background: `url(/img/ship/themes/theme${themeId}/board_background.png) center / cover`,
        borderRadius: '8px',
        padding: '4px',
        overflow: 'hidden',
        border: '2px solid rgba(254,239,145,.2)',
      }}>
        {grid.map((row, r) => row.map((cell, c) => {
          const key = `${r}-${c}`;
          const isPreview = !isPlayer && false || (isPlayer && previewCells.has(key));
          let bg = 'rgba(0,0,0,.15)';
          let cursor = 'default';
          let onClick = () => {};
          let content = '';

          if (isPlayer) {
            if (cell.state === 'ship') { bg = 'rgba(99,102,241,.5)'; content = '⬛'; }
            else if (cell.state === 'hit') { bg = 'rgba(239,68,68,.8)'; content = '💥'; }
            else if (cell.state === 'miss') { bg = 'rgba(255,255,255,.15)'; content = '•'; }

            if (phase === 'placing' && currentShip) {
              cursor = canPlace && isPreview ? 'pointer' : (canPlaceShip(r, c) ? 'pointer' : 'not-allowed');
              onClick = () => placeShip(r, c);
              if (isPreview && canPlace) bg = 'rgba(34,197,94,.4)';
              else if (isPreview && !canPlace) bg = 'rgba(239,68,68,.3)';
            }
          } else {
            // AI grid
            if (cell.state === 'hit') { bg = 'rgba(239,68,68,.8)'; content = '💥'; }
            else if (cell.state === 'miss') { bg = 'rgba(255,255,255,.15)'; content = '•'; }
            else { bg = 'rgba(0,30,60,.3)'; }

            if (phase === 'attacking' && currentTurn === 'player' && cell.state !== 'hit' && cell.state !== 'miss') {
              cursor = 'crosshair';
              onClick = () => {
                if (soundOn) playClickSound();
                attackCell(r, c);
                // Play sound after AI responds
                setTimeout(() => {
                  const lastLog = useShipsStore.getState().gameLog[useShipsStore.getState().gameLog.length - 1];
                  if (lastLog?.message.includes('إصابة')) {
                    if (soundOn) playCorrectSound();
                  } else if (lastLog?.message.includes('خطأ')) {
                    if (soundOn) playWrongSound();
                  }
                }, 1100);
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
                fontSize: '8px',
                color: '#fff',
                transition: 'background 0.15s ease',
                borderRadius: '1px',
                userSelect: 'none',
              }}
            >
              {content}
            </div>
          );
        }))}
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
        background: `url(/img/ship/themes/theme${themeId}/background.png) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)`,
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
        <HeaderChatButton />
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
            {phase === 'placing' ? 'وضع السفن' : phase === 'attacking' ? 'المعركة' : 'انتهت'}
          </div>
        </div>
      </motion.div>

      {/* Placement phase: current ship info + orientation toggle */}
      {phase === 'placing' && currentShip && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="tobol-team-card"
          style={{ width: '100%', maxWidth: '460px', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
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
      )}

      {/* Attacking phase: stats + turn indicator */}
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

      {/* Game grids */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="tobol-team-card"
        style={{ width: '100%', maxWidth: '460px', padding: '10px', borderRadius: '12px' }}
      >
        {phase === 'placing' ? (
          // Placement: only player grid
          <div>
            <p style={{ ...STROKE_STYLE, fontSize: '12px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
              شبكتك — اضغط لوضع السفينة
            </p>
            {renderGrid(playerGrid, true)}
          </div>
        ) : (
          // Attacking: both grids side by side
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ flex: '1 1 200px', maxWidth: '220px' }}>
              <p style={{ fontSize: '11px', color: '#86efac', textAlign: 'center', marginBottom: '4px', fontWeight: 700 }}>
                أسطولك
              </p>
              {renderGrid(playerGrid, true)}
            </div>
            <div style={{ flex: '1 1 200px', maxWidth: '220px' }}>
              <p style={{ fontSize: '11px', color: '#fbbf24', textAlign: 'center', marginBottom: '4px', fontWeight: 700 }}>
                خصمك — اضغط للهجوم
              </p>
              {renderGrid(aiGrid, false)}
            </div>
          </div>
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
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>إنهاء اللعبة؟</h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                نقاطك: {playerScore} — سيتم إعادة التعيين.
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
