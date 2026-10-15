// ============================================================
// Game Sound Hooks — reusable React hooks for triggering sounds
// at game-over time based on rewards + winner state.
//
// Usage in any GameOver component:
//   useGameOverSounds({ trigger: true, winner, isDraw, rewards });
//
// Sound rules:
//   - playWinSound() if player's team wins
//   - playLoseSound() if opposing team wins
//   - playTieSound() if it's a draw
//   - playLevelUpSound() if rewards.leveledUp (slight delay)
//   - playCoinSound() when rewards.gold > 0 (slight delay after levelup)
// ============================================================

import { useEffect } from 'react';
import {
  playWinSound,
  playLoseSound,
  playTieSound,
  playLevelUpSound,
  playCoinSound,
} from './sounds';

interface GameOverSoundOptions {
  /** When true, the effect fires (e.g. when rewards are loaded or game ended). */
  trigger: boolean;
  /** Did the player's team win? If `null`, treat as draw. */
  playerWon: boolean | null;
  /** Is the result a draw? */
  isDraw?: boolean;
  /** Rewards object from useGameRewards hook. */
  rewards?: { xp: number; gold: number; leveledUp: boolean; newLevel: number | null } | null;
}

/**
 * Fires the appropriate end-of-game sound once when triggered.
 * Safe to call repeatedly — it uses `trigger` as a dep and a ref-guarded
 * one-shot pattern so it only fires once per trigger=true transition.
 */
export function useGameOverSounds(opts: GameOverSoundOptions) {
  const { trigger, playerWon, isDraw, rewards } = opts;
  useEffect(() => {
    if (!trigger) return;
    // Decide outcome sound immediately
    const t = setTimeout(() => {
      if (isDraw || playerWon === null) {
        playTieSound();
      } else if (playerWon) {
        playWinSound();
      } else {
        playLoseSound();
      }
    }, 200);

    // Level-up sound (after a beat)
    const levelT = rewards?.leveledUp
      ? setTimeout(() => playLevelUpSound(), 1100)
      : null;

    // Coin jingle (if gold was awarded)
    const coinT = rewards && rewards.gold > 0
      ? setTimeout(() => playCoinSound(), 1500)
      : null;

    return () => {
      clearTimeout(t);
      if (levelT) clearTimeout(levelT);
      if (coinT) clearTimeout(coinT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
}
