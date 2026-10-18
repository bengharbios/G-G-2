// ════════════════════════════════════════════════════════════════════════
// سفن (Ships / Battleship) — Zustand Store
// Full Battleship game logic: ship placement + attack + hit/miss + win
// ════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GamePhase,
  GameMode,
  Difficulty,
  ShipsRound,
  GridCell,
  PlacedShip,
  ShipType,
  GameLogEntry,
  DIFFICULTY_CONFIG,
  ROUND_COUNT_OPTIONS,
  SHIP_TYPES_THEME_1,
  SHIP_TYPES_THEME_2,
  GRID_SIZE,
  CellState,
} from './ships-types';

export interface ShipsState {
  phase: GamePhase;
  gameMode: GameMode;
  difficulty: Difficulty;
  totalRounds: number;
  roomCode: string | null;
  hostName: string | null;
  playerName: string | null;

  themeId: number;  // 1 (navy) or 2 (air)

  currentRound: number;
  currentRoundData: ShipsRound | null;
  playerGrid: GridCell[][];
  aiGrid: GridCell[][];

  // Ship placement phase
  shipsToPlace: ShipType[];           // remaining ships to place
  currentShipIndex: number;            // index in shipsToPlace
  currentOrientation: 'horizontal' | 'vertical';

  // Game state
  currentTurn: 'player' | 'ai';
  playerScore: number;
  aiScore: number;
  playerHits: number;
  playerMisses: number;
  aiHits: number;
  aiMisses: number;

  // Ship sunk tracking (flashi pattern: model1Sunk, model2Sunk, ...)
  playerShipsSunk: boolean[];  // [false, false, false, false, false] — which of player's ships are sunk
  aiShipsSunk: boolean[];     // [false, false, false, false, false] — which of AI's ships are sunk

  // Two-team + message support
  playMode: 'ai' | 'teams' | 'watch';
  placingTeam: 'team1' | 'team2' | null;
  currentTeam: 'team1' | 'team2';
  hideHands: boolean;
  message: 'explosion' | 'win' | 'sunk' | null;
  sunkShipName: string | null;
  winner: 'team1' | 'team2' | null;

  gameLog: GameLogEntry[];
  lastAction: string | null;
  lastActionAt: number | null;

  // Two-team + message actions
  setPlayMode: (mode: 'ai' | 'teams' | 'watch') => void;
  startPlacingTeam: (team: 'team1' | 'team2') => void;
  confirmPlacement: () => void;  // team finished placing → next team or start attack
  toggleHideHands: () => void;
  showMessage: (type: 'explosion' | 'win' | 'sunk', shipName?: string) => void;
  hideMessage: () => void;
  switchTurn: () => void;  // switch between team1/team2 (or player/AI)

  // Actions
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
  setTotalRounds: (n: number) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;
  setPlayerName: (name: string | null) => void;
  setThemeId: (n: number) => void;

  startGame: () => void;
  toggleOrientation: () => void;
  placeShip: (row: number, col: number) => void;
  canPlaceShip: (row: number, col: number) => boolean;
  startAttacking: () => void;
  attackCell: (row: number, col: number) => void;  // player attacks AI grid
  aiAttack: () => void;  // AI attacks player grid (random)
  checkWin: () => 'player' | 'ai' | null;
  nextRound: () => void;
  resetGame: () => void;

  syncToRoom: () => void;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function makeLog(round: number, message: string, type: GameLogEntry['type'] = 'info'): GameLogEntry {
  return { round, message, type, timestamp: Date.now() };
}

// Create empty 10×10 grid
function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push({ row: r, col: c, state: 'empty' as CellState });
    }
    grid.push(row);
  }
  return grid;
}

// Check if ship placement is valid (no overlap, within bounds)
function isValidPlacement(
  grid: GridCell[][],
  row: number,
  col: number,
  length: number,
  orientation: 'horizontal' | 'vertical'
): boolean {
  if (orientation === 'horizontal') {
    if (col + length > GRID_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (grid[row][col + i].state !== 'empty') return false;
    }
  } else {
    if (row + length > GRID_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (grid[row + i][col].state !== 'empty') return false;
    }
  }
  return true;
}

// placeShipOnGrid removed — ship placement now done inline in placeShip()
// AI randomly places all ships (with model + segment info)
function aiPlaceShips(shipTypes: ShipType[], modelNumMap: Record<string, number>): { grid: GridCell[][]; ships: PlacedShip[] } {
  const grid = createEmptyGrid();
  const ships: PlacedShip[] = [];
  for (const st of shipTypes) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const orientation: 'horizontal' | 'vertical' = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (isValidPlacement(grid, row, col, st.length, orientation)) {
        const cells: Array<{ row: number; col: number }> = [];
        const modelNum = modelNumMap[st.id] || 1;
        for (let i = 0; i < st.length; i++) {
          const cellRow = orientation === 'horizontal' ? row : row + i;
          const cellCol = orientation === 'horizontal' ? col + i : col;
          cells.push({ row: cellRow, col: cellCol });
          grid[cellRow][cellCol] = {
            row: cellRow,
            col: cellCol,
            state: 'ship' as CellState,
            shipId: st.id,
            shipModelNum: modelNum,
            shipOrientation: orientation,
            shipSegment: i + 1,
          };
        }
        const ship: PlacedShip = {
          shipTypeId: st.id,
          row, col, orientation,
          cells,
          hits: 0,
          sunk: false,
        };
        ships.push(ship);
        placed = true;
      }
      attempts++;
    }
  }
  return { grid, ships };
}

// Check if all ships of one side are sunk
function allShipsSunk(ships: PlacedShip[]): boolean {
  return ships.every(s => s.sunk);
}

const initialState = {
  phase: 'landing' as GamePhase,
  gameMode: 'classic' as GameMode,
  difficulty: 'medium' as Difficulty,
  totalRounds: 1,
  roomCode: null as string | null,
  hostName: null as string | null,
  playerName: null as string | null,
  themeId: 1,
  currentRound: 0,
  currentRoundData: null as ShipsRound | null,
  playerGrid: createEmptyGrid(),
  aiGrid: createEmptyGrid(),
  shipsToPlace: [] as ShipType[],
  currentShipIndex: 0,
  currentOrientation: 'horizontal' as 'horizontal' | 'vertical',
  currentTurn: 'player' as 'player' | 'ai',
  playMode: 'ai' as 'ai' | 'teams' | 'watch',
  placingTeam: null as 'team1' | 'team2' | null,
  currentTeam: 'team1' as 'team1' | 'team2',
  hideHands: false,
  message: null as 'explosion' | 'win' | 'sunk' | null,
  sunkShipName: null as string | null,
  winner: null as 'team1' | 'team2' | null,
  aiLastHit: null as { row: number; col: number } | null,
  aiHuntMode: false,
  playerShipsSunk: [false, false, false, false, false] as boolean[],
  aiShipsSunk: [false, false, false, false, false] as boolean[],
  playerScore: 0,
  aiScore: 0,
  playerHits: 0,
  playerMisses: 0,
  aiHits: 0,
  aiMisses: 0,
  gameLog: [] as GameLogEntry[],
  lastAction: null as string | null,
  lastActionAt: null as number | null,
};

export const useShipsStore = create<ShipsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),
      setGameMode: (gameMode) => set({ gameMode }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setTotalRounds: (totalRounds) => set({ totalRounds }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),
      setPlayerName: (playerName) => set({ playerName }),
      setThemeId: (themeId) => set({ themeId }),

      setPlayMode: (mode) => set({ playMode: mode }),

      startPlacingTeam: (team) => {
        const state = get();
        const shipTypes = state.themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2;
        // Reset the grid for this team
        const emptyGrid = createEmptyGrid();
        set({
          phase: 'placing',
          placingTeam: team,
          currentTeam: team,
          playerGrid: team === 'team1' ? emptyGrid : state.playerGrid,
          aiGrid: team === 'team2' ? emptyGrid : state.aiGrid,
          shipsToPlace: shipTypes,
          currentShipIndex: 0,
          currentOrientation: 'horizontal',
          hideHands: false,
          gameLog: [...state.gameLog, makeLog(0, `🚢 ${team === 'team1' ? 'الفريق الأول' : 'الفريق الثاني'} — ضع سفنك`, 'system')],
          lastAction: `${team === 'team1' ? 'الفريق الأول' : 'الفريق الثاني'} ضع سفنك`,
          lastActionAt: Date.now(),
        });
      },

      confirmPlacement: () => {
        const state = get();
        if (state.placingTeam === 'team1') {
          // Team 1 done → Team 2 places
          set({
            phase: 'pass_phone',
            placingTeam: 'team2',
            hideHands: true,
            message: null,
            gameLog: [...state.gameLog, makeLog(0, '📱 مرر الهاتف للفريق الثاني', 'system')],
            lastAction: '📱 مرر الهاتف للفريق الثاني',
          });
        } else if (state.placingTeam === 'team2') {
          // Both teams done → start attacking
          get().startAttacking();
        }
      },

      toggleHideHands: () => set({ hideHands: !get().hideHands }),

      showMessage: (type, shipName) => set({
        message: type,
        sunkShipName: shipName || null,
      }),

      hideMessage: () => set({ message: null, sunkShipName: null }),

      switchTurn: () => {
        const state = get();
        if (state.playMode === 'ai') {
          // AI mode: toggle player/AI
          set({ currentTurn: state.currentTurn === 'player' ? 'ai' : 'player' });
        } else if (state.playMode === 'teams') {
          // Teams mode: show pass phone overlay then switch
          set({
            phase: 'pass_phone',
            hideHands: true,
            currentTeam: state.currentTeam === 'team1' ? 'team2' : 'team1',
            currentTurn: state.currentTurn === 'player' ? 'ai' : 'player',
            message: null,
          });
        }
      },

      startGame: () => {
        const state = get();
        const shipTypes = state.themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2;
        if (state.playMode === 'teams') {
          // Two-team mode: team 1 places first
          get().startPlacingTeam('team1');
        } else {
          // AI mode (عرّاب): single player places ships
          set({
            phase: 'placing',
            currentRound: 0,
            playerGrid: createEmptyGrid(),
            aiGrid: createEmptyGrid(),
            shipsToPlace: shipTypes,
            currentShipIndex: 0,
            currentOrientation: 'horizontal',
            currentTeam: 'team1',
            placingTeam: 'team1',
            playerScore: 0,
            aiScore: 0,
            playerHits: 0,
            playerMisses: 0,
            aiHits: 0,
            aiMisses: 0,
            hideHands: false,
            message: null,
            sunkShipName: null,
            winner: null,
            gameLog: [makeLog(0, `🎯 بدأت اللعبة — ضع سفنك على الشبكة`, 'system')],
            lastAction: '🎯 ضع سفنك',
            lastActionAt: Date.now(),
          });
        }
      },

      toggleOrientation: () => {
        set({
          currentOrientation: get().currentOrientation === 'horizontal' ? 'vertical' : 'horizontal',
        });
      },

      canPlaceShip: (row, col) => {
        const state = get();
        if (state.currentShipIndex >= state.shipsToPlace.length) return false;
        const ship = state.shipsToPlace[state.currentShipIndex];
        return isValidPlacement(state.playerGrid, row, col, ship.length, state.currentOrientation);
      },

      placeShip: (row, col) => {
        const state = get();
        if (state.currentShipIndex >= state.shipsToPlace.length) return;
        const shipType = state.shipsToPlace[state.currentShipIndex];
        if (!isValidPlacement(state.playerGrid, row, col, shipType.length, state.currentOrientation)) return;

        // Map shipType.id to model number (1-5)
        const modelNumMap: Record<string, number> = {
          carrier: 1, submarine: 2, destroyer: 3, battleship: 4, patrol: 5,
          fighter: 1, helicopter: 2, tank: 3, camp: 4, armored: 5,
        };
        const modelNum = modelNumMap[shipType.id] || 1;

        // Build cells with segment info
        const cells: Array<{ row: number; col: number }> = [];
        const newGrid = state.playerGrid.map(r => r.map(c => ({ ...c })));
        for (let i = 0; i < shipType.length; i++) {
          const cellRow = state.currentOrientation === 'horizontal' ? row : row + i;
          const cellCol = state.currentOrientation === 'horizontal' ? col + i : col;
          cells.push({ row: cellRow, col: cellCol });
          // Store segment info directly on the grid cell
          newGrid[cellRow][cellCol] = {
            row: cellRow,
            col: cellCol,
            state: 'ship' as CellState,
            shipId: shipType.id,
            shipModelNum: modelNum,
            shipOrientation: state.currentOrientation,
            shipSegment: i + 1,  // 1-based segment number
          };
        }
        const placedShip: PlacedShip = {
          shipTypeId: shipType.id,
          row, col,
          orientation: state.currentOrientation,
          cells,
          hits: 0,
          sunk: false,
        };
        const newIndex = state.currentShipIndex + 1;
        const allPlaced = newIndex >= state.shipsToPlace.length;

        set({
          playerGrid: newGrid,
          currentShipIndex: newIndex,
          gameLog: [...state.gameLog, makeLog(0, `🚢 تم وضع: ${shipType.name}`, 'success')],
          lastAction: `🚢 وُضع: ${shipType.name}`,
          lastActionAt: Date.now(),
        });

        if (allPlaced) {
          if (state.playMode === 'teams' && state.placingTeam === 'team1') {
            get().confirmPlacement();
          } else {
            get().startAttacking();
          }
        }
      },

      startAttacking: () => {
        const state = get();
        const shipTypes = state.themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2;
        // In AI mode: AI places ships
        // In teams mode: both teams already placed their ships
        // AI places its ships (with model + segment info on grid cells)
        const modelNumMap: Record<string, number> = {
          carrier: 1, submarine: 2, destroyer: 3, battleship: 4, patrol: 5,
          fighter: 1, helicopter: 2, tank: 3, camp: 4, armored: 5,
        };
        const { grid: aiGrid, ships: aiShips } = aiPlaceShips(shipTypes, modelNumMap);

        set({
          phase: 'attacking',
          aiGrid,
          currentRoundData: {
            id: `round-0-${Date.now()}`,
            title: 'المعركة',
            themeId: state.themeId,
            playerGrid: state.playerGrid,
            aiGrid,
            playerShips: [],
            aiShips,
            currentTurn: 'player',
            playerScore: 0,
            aiScore: 0,
            playerHits: 0,
            playerMisses: 0,
            aiHits: 0,
            aiMisses: 0,
          },
          currentTurn: 'player',
          gameLog: [...state.gameLog, makeLog(0, `⚔️ ابدأ الهجوم! اضغط على شبكة الخصم`, 'info')],
          lastAction: '⚔️ اضغط على شبكة الخصم',
          lastActionAt: Date.now(),
        });
      },

      attackCell: (row, col) => {
        const state = get();
        if (state.phase !== 'attacking' || state.currentTurn !== 'player') return;
        if (!state.currentRoundData) return;
        const cfg = DIFFICULTY_CONFIG[state.difficulty];

        const cell = state.aiGrid[row][col];
        if (cell.state === 'hit' || cell.state === 'miss') return; // already attacked

        const isHit = cell.state === 'ship';
        const newAiGrid = state.aiGrid.map(r => r.map(c => ({ ...c })));
        newAiGrid[row][col] = {
          ...newAiGrid[row][col],
          state: isHit ? 'hit' : 'miss',
        };

        const newPlayerHits = isHit ? state.playerHits + 1 : state.playerHits;
        const newPlayerMisses = isHit ? state.playerMisses : state.playerMisses + 1;
        const newPlayerScore = isHit
          ? state.playerScore + cfg.scorePerHit
          : Math.max(0, state.playerScore - cfg.penaltyPerMiss);

        // Check if a ship was sunk
        let sunkShipName = '';
        if (isHit && state.currentRoundData.aiShips) {
          const ship = state.currentRoundData.aiShips.find(s =>
            s.cells.some(c => c.row === row && c.col === col)
          );
          if (ship) {
            ship.hits++;
            // Check if all cells of this ship are hit
            const allHit = ship.cells.every(c => newAiGrid[c.row][c.col].state === 'hit');
            if (allHit && !ship.sunk) {
              ship.sunk = true;
              sunkShipName = state.themeId === 1
                ? SHIP_TYPES_THEME_1.find(s => s.id === ship.shipTypeId)?.name || ''
                : SHIP_TYPES_THEME_2.find(s => s.id === ship.shipTypeId)?.name || '';
            }
          }
        }

        set({
          aiGrid: newAiGrid,
          playerHits: newPlayerHits,
          playerMisses: newPlayerMisses,
          playerScore: newPlayerScore,
          currentTurn: 'ai',
          gameLog: [
            ...state.gameLog,
            makeLog(0, isHit
              ? `💥 إصابة! +${cfg.scorePerHit}${sunkShipName ? ` — غرقت: ${sunkShipName}` : ''}`
              : `🌊 خطأ -${cfg.penaltyPerMiss}`,
              isHit ? 'success' : 'danger'),
          ],
          lastAction: isHit
            ? `💥 إصابة!${sunkShipName ? ` غرقت: ${sunkShipName}` : ''}`
            : `🌊 خطأ`,
          lastActionAt: Date.now(),
        });

        // Check if a ship was sunk → show explosion message
        let sunkShipName = '';
        if (isHit && state.currentRoundData?.aiShips) {
          const ship = state.currentRoundData.aiShips.find(s =>
            s.cells.some(c => c.row === row && c.col === col)
          );
          if (ship) {
            ship.hits++;
            const allHit = ship.cells.every(c => newAiGrid[c.row][c.col].state === 'hit');
            if (allHit && !ship.sunk) {
              ship.sunk = true;
              const shipType = (state.themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2).find(s => s.id === ship.shipTypeId);
              sunkShipName = shipType?.name || '';
              // Show explosion message
              set({ message: 'explosion', sunkShipName });
              setTimeout(() => set({ message: null, sunkShipName: null }), 2000);
            }
          }
        }

        // Check win
        const winner = get().checkWin();
        if (winner) {
          const winTeam = winner === 'player' ? 'team1' : 'team2';
          set({
            phase: 'game_over',
            winner: winTeam,
            message: 'win',
            gameLog: [...get().gameLog, makeLog(0, winner === 'player' ? `🏆 فزت!` : `💀 خسرت`, 'system')],
            lastAction: winner === 'player' ? '🏆 فزت!' : '💀 خسرت',
          });
          return;
        }

        // Switch turn: AI mode → AI attacks after 1s; Teams mode → pass phone
        if (state.playMode === 'ai') {
          setTimeout(() => get().aiAttack(), 1000);
        } else if (state.playMode === 'teams') {
          setTimeout(() => get().switchTurn(), 1500);
        }
      },

      aiAttack: () => {
        const state = get();
        if (state.phase !== 'attacking' || state.currentTurn !== 'ai') return;
        if (!state.currentRoundData) return;
        const cfg = DIFFICULTY_CONFIG[state.difficulty];

        // AI attack logic (flashi pattern: random + hunt mode after hit)
        let target: { row: number; col: number } | null = null;

        // Hunt mode: if last hit was successful, try adjacent cells
        if (state.aiHuntMode && state.aiLastHit) {
          const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (const [dr, dc] of directions) {
            const nr = state.aiLastHit.row + dr;
            const nc = state.aiLastHit.col + dc;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              const cell = state.playerGrid[nr][nc];
              if (cell.state === 'empty' || cell.state === 'ship') {
                target = { row: nr, col: nc };
                break;
              }
            }
          }
        }

        // If no hunt target, pick random (flashi original pattern)
        if (!target) {
          const availableCells: Array<{ row: number; col: number }> = [];
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              const cell = state.playerGrid[r][c];
              if (cell.state === 'empty' || cell.state === 'ship') {
                availableCells.push({ row: r, col: c });
              }
            }
          }
          if (availableCells.length === 0) return;
          target = availableCells[Math.floor(Math.random() * availableCells.length)];
        }

        const cell = state.playerGrid[target.row][target.col];
        const isHit = cell.state === 'ship';
        const newPlayerGrid = state.playerGrid.map(r => r.map(c => ({ ...c })));
        newPlayerGrid[target.row][target.col] = {
          ...newPlayerGrid[target.row][target.col],
          state: isHit ? 'hit' : 'miss',
        };

        const newAiHits = isHit ? state.aiHits + 1 : state.aiHits;
        const newAiMisses = isHit ? state.aiMisses : state.aiMisses + 1;
        const newAiScore = isHit
          ? state.aiScore + cfg.scorePerHit
          : Math.max(0, state.aiScore - cfg.penaltyPerMiss);

        // AI hunt mode: if hit, set hunt mode + remember position (flashi pattern)
        // If miss, clear hunt mode
        // Also check if a player's ship was sunk (flashi prepareLegend pattern)
        let playerShipSunkName = '';
        const newPlayerShipsSunk = [...(state.playerShipsSunk || [false,false,false,false,false])];
        if (isHit && state.currentRoundData?.playerShips) {
          for (const ship of state.currentRoundData.playerShips) {
            if (!ship.sunk) {
              const allHit = ship.cells.every(c => newPlayerGrid[c.row][c.col].state === 'hit');
              if (allHit) {
                ship.sunk = true;
                const shipType = (state.themeId === 1 ? SHIP_TYPES_THEME_1 : SHIP_TYPES_THEME_2).find(s => s.id === ship.shipTypeId);
                playerShipSunkName = shipType?.name || '';
                const shipIdx = state.currentRoundData.playerShips.indexOf(ship);
                if (shipIdx >= 0) newPlayerShipsSunk[shipIdx] = true;
              }
            }
          }
        }

        set({
          playerGrid: newPlayerGrid,
          aiHits: newAiHits,
          aiMisses: newAiMisses,
          aiScore: newAiScore,
          aiHuntMode: isHit,
          aiLastHit: isHit ? { row: target.row, col: target.col } : null,
          playerShipsSunk: newPlayerShipsSunk,
          currentTurn: 'player',
          gameLog: [
            ...state.gameLog,
            makeLog(0, isHit ? `💥 الخصم أصابك!` : `🌊 الخصم أخطأ`, isHit ? 'danger' : 'info'),
          ],
          lastAction: isHit ? '💥 الخصم أصابك!' : '🌊 الخصم أخطأ',
          lastActionAt: Date.now(),
        });

        // Check win
        const winner = get().checkWin();
        if (winner) {
          const winTeam = winner === 'player' ? 'team1' : 'team2';
          set({
            phase: 'game_over',
            winner: winTeam,
            message: 'win',
            gameLog: [...get().gameLog, makeLog(0, winner === 'player' ? `🏆 فزت!` : `💀 خسرت`, 'system')],
            lastAction: winner === 'player' ? '🏆 فزت!' : '💀 خسرت',
          });
        }
      },

      checkWin: () => {
        const state = get();
        if (!state.currentRoundData) return null;
        // flashi pattern: check each model array — if all cells hit → sunk
        // Check if all AI ships are sunk (player wins)
        const aiAllSunk = state.currentRoundData.aiShips.every(s => {
          return s.cells.every(c => state.aiGrid[c.row][c.col].state === 'hit');
        });
        if (aiAllSunk) return 'player';
        // Check if all player ships are sunk (AI wins)
        const playerShips = state.currentRoundData.playerShips || [];
        if (playerShips.length > 0) {
          const playerAllSunk = playerShips.every(s => {
            return s.cells.every(c => state.playerGrid[c.row][c.col].state === 'hit');
          });
          if (playerAllSunk) return 'ai';
        } else {
          // Fallback: count ship cells
          let shipCells = 0, hitCells = 0;
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              const st = state.playerGrid[r][c].state;
              if (st === 'ship' || st === 'hit') { shipCells++; if (st === 'hit') hitCells++; }
            }
          }
          if (shipCells > 0 && hitCells >= shipCells) return 'ai';
        }
        return null;
      },

      nextRound: () => {
        const state = get();
        const nextIdx = state.currentRound + 1;
        if (nextIdx >= state.totalRounds) {
          set({ phase: 'game_over' });
        } else {
          // Start new round
          get().startGame();
        }
      },

      resetGame: () => {
        set({ ...initialState, playerGrid: createEmptyGrid(), aiGrid: createEmptyGrid() });
      },

      syncToRoom: () => {
        // Placeholder for diwaniya mode
      },
    }),
    {
      name: 'ships-game-storage',
      version: 5,
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        difficulty: state.difficulty,
        totalRounds: state.totalRounds,
        roomCode: state.roomCode,
        hostName: state.hostName,
        playerName: state.playerName,
        themeId: state.themeId,
        currentRound: state.currentRound,
        currentRoundData: state.currentRoundData,
        playerGrid: state.playerGrid,
        aiGrid: state.aiGrid,
        shipsToPlace: state.shipsToPlace,
        currentShipIndex: state.currentShipIndex,
        currentOrientation: state.currentOrientation,
        currentTurn: state.currentTurn,
        playerScore: state.playerScore,
        aiScore: state.aiScore,
        playerHits: state.playerHits,
        playerMisses: state.playerMisses,
        aiHits: state.aiHits,
        aiMisses: state.aiMisses,
        gameLog: state.gameLog,
        lastAction: state.lastAction,
        lastActionAt: state.lastActionAt,
      }),
    }
  )
);

export function generateShipsRoomCode(): string {
  return generateRoomCode();
}
