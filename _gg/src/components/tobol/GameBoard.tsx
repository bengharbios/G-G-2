'use client';

import { useState, useRef, useEffect } from 'react';
import { useTobolStore } from '@/lib/tobol-store';
import {
  RIGHT_COL1, RIGHT_COL2, LEFT_COL1, LEFT_COL2,
  BOTTOM_ROW1, BOTTOM_ROW2, BOTTOM_ROW3,
  IMG_BASE, VS_BASE, RANDOM_BASE,
} from '@/lib/tobol-types';
import type { BoardButton } from '@/lib/tobol-types';

// ============================================================
// Render a single button cell inside a table (exact original logic)
// ============================================================
function renderBtnTable(
  btn: BoardButton,
  colSpan: number,
  clickedBtns: Set<string>,
  onClick: (id: string) => void
) {
  return (
    <td
      key={btn.id}
      colSpan={colSpan}
      className={btn.color}
      onClick={() => onClick(btn.id)}
      style={{ padding: '0.2vmin', textAlign: 'center', verticalAlign: 'middle' }}
    >
      <img
        src={`${IMG_BASE}${btn.icon}.png`}
        className="block hover:brightness-110 active:scale-95 transition-all mx-auto"
        style={{
          width: '100%',
          height: 'auto',
          opacity: clickedBtns.has(btn.id) ? 0 : 1,
        }}
        alt={btn.icon}
        draggable={false}
      />
    </td>
  );
}

// ============================================================
// Battle Log Panel — collapsible log of all moves
// ============================================================
function BattleLogPanel() {
  const { battleLog } = useTobolStore();
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleLog, isOpen]);

  return (
    <div className="w-full max-w-md mx-auto mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700/80 transition-all cursor-pointer"
      >
        <span>📜 سجل المعركة ({battleLog.length})</span>
        <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-1 max-h-[40vh] overflow-y-auto tobol-scrollbar bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1">
          {battleLog.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4">لا تتحركات بعد...</p>
          ) : (
            battleLog.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg ${
                  entry.team === 'red'
                    ? 'bg-red-950/30 text-red-300'
                    : 'bg-blue-950/30 text-blue-300'
                }`}
              >
                <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
                <span className="flex-1">{entry.message}</span>
                {entry.valueChange !== 0 && (
                  <span className={`font-black text-[10px] ${entry.valueChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {entry.valueChange > 0 ? '+' : ''}{entry.valueChange}
                  </span>
                )}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Notification / Turn Bar — single bar spanning full width
// Shows turn when waiting, action when happened
// ============================================================
function NotificationBar() {
  const { lastAction, currentTurn, redName, blueName } = useTobolStore();

  const isAttack = lastAction?.includes('هجوم');
  const isTrap = lastAction?.includes('الفخ');
  const turnName = currentTurn === 'red' ? redName : blueName;
  const isRedTurn = currentTurn === 'red';

  // Determine what to show
  let bgColor = 'bg-slate-800/60';
  let borderColor = 'border-slate-600/30';
  let textColor = 'text-slate-300';
  let displayText = '';

  if (!lastAction) {
    // Waiting — show turn indicator in the notification bar
    displayText = `🎯 دور الفريق ${turnName}`;
    bgColor = isRedTurn ? 'bg-red-950/30' : 'bg-blue-950/30';
    borderColor = isRedTurn ? 'border-red-500/30' : 'border-blue-500/30';
    textColor = isRedTurn ? 'text-red-300' : 'text-blue-300';
  } else {
    displayText = lastAction;
    if (isAttack) {
      bgColor = 'bg-red-950/40';
      borderColor = 'border-red-500/40';
      textColor = 'text-red-300';
    } else if (isTrap) {
      bgColor = 'bg-orange-950/40';
      borderColor = 'border-orange-500/40';
      textColor = 'text-orange-300';
    }
  }

  return (
    <div
      className={`w-full px-4 py-1.5 rounded-lg border ${bgColor} ${borderColor}`}
      style={{ animation: 'fadeInUp 0.3s ease-out' }}
    >
      <p className={`text-[2.2vmin] font-bold text-center truncate ${textColor}`}>{displayText}</p>
    </div>
  );
}

// ============================================================
// Main GameBoard — exact table layout from original project
// ============================================================
export default function GameBoard() {
  const {
    redName,
    blueName,
    redScore,
    blueScore,
    currentTurn,
    clickedBtns,
    mainBgId,
    modalData,
    lastAction,
    handleButtonClick,
    closeModal,
    changeMainImage,
    setTeamNames,
    gameMode,
    roomCode,
  } = useTobolStore();

  const isSpectator = gameMode === 'diwaniya' && typeof window !== 'undefined' && !window.location.pathname.startsWith('/tobol');

  return (
    <div
      className="w-full flex flex-col justify-center items-center p-4"
      dir="rtl"
      style={{ fontFamily: "'titri', 'Cairo', sans-serif" }}
    >
      {/* Game Title & Subtitle */}
      <div className="text-center mb-1">
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-blue-400">
          🥁 طبول الحرب
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-400 mt-0.5">
          إنها الحرب ⚔️
        </p>
      </div>

      {/* Notification Bar — FULL WIDTH matching gameDiv */}
      <div className="w-[95vw] max-w-[100vmin] mx-auto mb-1">
        <NotificationBar />
      </div>

      <div className="gameDiv" style={{ paddingBottom: '1vh' }}>
        <table className="gameTable">
          <tbody>
            {/* ===== ROW 1: Score Panels + VS ===== */}
            <tr>
              <td rowSpan={1} colSpan={2}></td>
              {/* Red Score */}
              <td rowSpan={1} colSpan={33} className={isSpectator ? '' : 'cursor-pointer'}>
                <table className={`scoreTable score-red-bg ${currentTurn === 'red' ? 'active-turn-red' : 'inactive-turn'}`}>
                  <tbody>
                    <tr>
                      <td className="teamName">
                        {isSpectator ? (
                          <span className="text-white">{redName}</span>
                        ) : (
                          <input
                            className="w-full bg-transparent border-none text-white text-center outline-none"
                            value={redName}
                            onChange={(e) => setTeamNames(e.target.value, blueName)}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="teamScore">
                        <input
                          type="number"
                          className="w-full bg-transparent border-none text-white text-center outline-none font-bold"
                          value={redScore}
                          readOnly
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              {/* VS Image */}
              <td rowSpan={1} colSpan={50} style={{ position: 'relative', textAlign: 'center' }}>
                <img
                  src={`${VS_BASE}${((mainBgId % 5) + 1)}.png`}
                  className="inline-block"
                  style={{ width: 'auto', height: '20vmin', paddingTop: '0.5vmin' }}
                  alt="VS"
                  draggable={false}
                />
              </td>
              {/* Blue Score */}
              <td rowSpan={1} colSpan={33} className={isSpectator ? '' : 'cursor-pointer'}>
                <table className={`scoreTable score-blue-bg ${currentTurn === 'blue' ? 'active-turn-blue' : 'inactive-turn'}`}>
                  <tbody>
                    <tr>
                      <td className="teamName">
                        {isSpectator ? (
                          <span className="text-white">{blueName}</span>
                        ) : (
                          <input
                            className="w-full bg-transparent border-none text-white text-center outline-none"
                            value={blueName}
                            onChange={(e) => setTeamNames(redName, e.target.value)}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="teamScore">
                        <input
                          type="number"
                          className="w-full bg-transparent border-none text-white text-center outline-none font-bold"
                          value={blueScore}
                          readOnly
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td rowSpan={1} colSpan={2}></td>
            </tr>

            {/* ===== ROW 2: Side Columns + Center Image ===== */}
            <tr>
              <td colSpan={1}></td>
              {/* Right Col 1 */}
              <td colSpan={12}>
                <table className="btnTable">
                  <tbody>
                    {RIGHT_COL1.map((btn) => (
                      <tr key={btn.id}>{renderBtnTable(btn, 1, clickedBtns, isSpectator ? () => {} : handleButtonClick)}</tr>
                    ))}
                  </tbody>
                </table>
              </td>
              {/* Right Col 2 */}
              <td colSpan={12}>
                <table className="btnTable">
                  <tbody>
                    {RIGHT_COL2.map((btn) => (
                      <tr key={btn.id}>{renderBtnTable(btn, 1, clickedBtns, isSpectator ? () => {} : handleButtonClick)}</tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td colSpan={3}></td>
              {/* CENTER: Waiting image or weapon card */}
              <td colSpan={64} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                {!modalData ? (
                  <img
                    className="w-[90%] mx-auto rounded-[7%] inline-block"
                    src={`/img/war/waiting/${((mainBgId % 3) + 1)}.png`}
                    alt="Waiting"
                    draggable={false}
                  />
                ) : (
                  <img
                    src={modalData.cardImg}
                    alt="Card"
                    draggable={false}
                    onClick={isSpectator ? undefined : closeModal}
                    style={{ width: '100%', display: 'block', cursor: isSpectator ? 'default' : 'pointer', borderRadius: '4%' }}
                  />
                )}
              </td>
              <td colSpan={3}></td>
              {/* Left Col 1 */}
              <td colSpan={12}>
                <table className="btnTable">
                  <tbody>
                    {LEFT_COL1.map((btn) => (
                      <tr key={btn.id}>{renderBtnTable(btn, 1, clickedBtns, isSpectator ? () => {} : handleButtonClick)}</tr>
                    ))}
                  </tbody>
                </table>
              </td>
              {/* Left Col 2 */}
              <td colSpan={12}>
                <table className="btnTable">
                  <tbody>
                    {LEFT_COL2.map((btn) => (
                      <tr key={btn.id}>{renderBtnTable(btn, 1, clickedBtns, isSpectator ? () => {} : handleButtonClick)}</tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td colSpan={1}></td>
            </tr>

            {/* ===== ROW 3: Bottom Row 1 ===== */}
            <tr>
              <td colSpan={120}>
                <table className="btnTable2">
                  <tbody>
                    <tr>
                      {BOTTOM_ROW1.map((btn) => renderBtnTable(btn, 6, clickedBtns, isSpectator ? () => {} : handleButtonClick))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ===== ROW 4: Bottom Row 2 ===== */}
            <tr>
              <td colSpan={120}>
                <table className="btnTable2">
                  <tbody>
                    <tr>
                      {BOTTOM_ROW2.map((btn) => renderBtnTable(btn, 6, clickedBtns, isSpectator ? () => {} : handleButtonClick))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ===== ROW 5: Bottom Row 3 ===== */}
            <tr>
              <td colSpan={120}>
                <table className="btnTable2">
                  <tbody>
                    <tr>
                      {BOTTOM_ROW3.map((btn) => renderBtnTable(btn, 6, clickedBtns, isSpectator ? () => {} : handleButtonClick))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <BattleLogPanel />
    </div>
  );
}
