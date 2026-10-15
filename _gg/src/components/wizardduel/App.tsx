'use client';

import { Client } from 'boardgame.io';
import { MainMenu } from './board/MainMenu';
import { WizardDuelBoard } from './board/WizardDuelBoard';
import { WizardDuel } from './core/game/game';

const WizardDuelClient = Client({
  game: WizardDuel,
  board: WizardDuelBoard,
  debug: { collapseOnLoad: true, hideToggleButton: true },
});

// Export a component that renders the game without react-router-dom
// Next.js handles routing, so we just render the game directly
export const WizardDuelApp = () => {
  return (
    <>
      <WizardDuelClient />
    </>
  );
};
