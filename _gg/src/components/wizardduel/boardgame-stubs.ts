// ============================================================
// boardgame-stubs.ts — Local stub replacing boardgame.io
// Prevents webpack from needing to resolve the actual package
// ============================================================

import React, { useState, useCallback } from 'react';

export type PlayerID = string;
export type Ctx = {
  turn: number;
  currentPlayer: PlayerID;
  numPlayers: number;
  playOrder: PlayerID[];
};
export type Game = {
  name?: string;
  setup?: (ctx: Ctx) => any;
  moves?: Record<string, (args: { G: any; ctx: Ctx; playerID: PlayerID }, ...rest: any[]) => any>;
  turn?: { minMoves?: number; maxMoves?: number };
};
export type Move = (args: { G: any; ctx: Ctx; playerID: PlayerID }, ...rest: any[]) => any;
export type BoardProps<G = any> = {
  G: G;
  ctx: Ctx;
  moves: Record<string, (...args: any[]) => void>;
  playerID: PlayerID;
  isActive: boolean;
  isMultiplayer: boolean;
  log: any[];
  matchID: string;
  matchData: any[];
  sendChatMessage: (msg: any) => void;
  chatMessages: any[];
  reset: () => void;
  undo: () => void;
  redo: () => void;
  credentials?: string;
};

// Client — replaces boardgame.io's React Client wrapper
// Creates a React component that manages game state locally
export function Client(opts: { game: Game; board: React.ComponentType<any>; debug?: any }) {
  const { game, board: Board } = opts;

  return function ClientComponent(props: any) {
    const [G, setG] = useState<any>(() => {
      if (game.setup) {
        const ctx: Ctx = { turn: 0, currentPlayer: '0', numPlayers: 2, playOrder: ['0', '1'] };
        return game.setup(ctx);
      }
      return {};
    });
    const [turn, setTurn] = useState(0);
    const [log, setLog] = useState<any[]>([]);

    const ctx: Ctx = {
      turn,
      currentPlayer: '0',
      numPlayers: 2,
      playOrder: ['0', '1'],
    };

    // Create move functions that update state
    const moves: Record<string, (...args: any[]) => void> = {};
    if (game.moves) {
      for (const [moveName, moveFn] of Object.entries(game.moves)) {
        moves[moveName] = (...args: any[]) => {
          setG((prevG: any) => {
            const moveCtx: Ctx = { ...ctx, turn };
            const result = moveFn({ G: prevG, ctx: moveCtx, playerID: '0' }, ...args);
            setLog((prev) => [...prev, { action: moveName, args }]);
            return result !== undefined ? prevG : prevG; // boardgame.io moves mutate G
          });
        };
      }
    }

    const boardProps: BoardProps = {
      G,
      ctx,
      moves,
      playerID: '0',
      isActive: true,
      isMultiplayer: false,
      log,
      matchID: 'local',
      matchData: [],
      sendChatMessage: () => {},
      chatMessages: [],
      reset: () => {
        if (game.setup) {
          const freshCtx: Ctx = { turn: 0, currentPlayer: '0', numPlayers: 2, playOrder: ['0', '1'] };
          setG(game.setup(freshCtx));
          setTurn(0);
          setLog([]);
        }
      },
      undo: () => {},
      redo: () => {},
    };

    return React.createElement(Board, { ...boardProps, ...props });
  };
}
