---
Task ID: 1
Agent: main
Task: Build Prison (السجن) Game UI Components

Work Log:
- Read worklog.md and all reference files (prison-types.ts, prison-store.ts, Tobol components)
- Created 7 files for the Prison game following Tobol design patterns
- Fixed all ESLint errors (unused eslint-disable directives, setState in effect, unused imports)
- All files compile cleanly with zero lint errors in the prison module

Files Created:
1. `src/components/prison/LandingPage.tsx` - Dark prison-themed landing with mode selection (العراب/الديوانية) and spectator join section
2. `src/components/prison/GameSetup.tsx` - Team names, grid size (9/16/20), player management (add/remove per team), start button
3. `src/components/prison/GameBoard.tsx` - Main game board with stats bar, team indicator, player panels, responsive grid, interaction overlays (player/cell selection, result modal, opponent jail/teammate free selection), game log
4. `src/components/prison/PrisonGameOver.tsx` - Winner display, confetti animation, team stats, game log, play again/home buttons
5. `src/app/prison/page.tsx` - Main page with BrandedHeader/Footer, GameTopBar (home, viewers modal, room code, reset, exit dialog), phase routing, host heartbeat hook
6. `src/components/prison/PrisonSpectatorView.tsx` - Read-only spectator view with polling, grid display, player panels, interaction text, revealed cell modal, game over overlay, expired room handling
7. `src/app/join/prison/[code]/page.tsx` - Spectator join page with room code display, name input, POST to spectator API, retry logic, error handling

Design:
- RTL Arabic layout throughout
- Dark theme: bg-slate-950/900 backgrounds
- Prison colors: amber (alpha team), cyan (beta team), orange/red (danger), yellow (keys)
- shadcn/ui components (Button, Input, Card, Badge)
- Lucide icons (Lock, Key, Skull, Eye, Users, etc.)
- framer-motion animations (AnimatePresence, motion.div, spring transitions)
- Responsive: mobile-first with sm:/md: breakpoints
- Grid cells: aspect-ratio 1/1, dark gradient, rounded corners, scale animation on reveal

Stage Summary:
- All 7 files created and lint-clean
- Follows existing Tobol component patterns closely
- Uses usePrisonStore() for state management
- Supports both classic and diwaniya modes
- Ready for API integration (prison-room routes)
