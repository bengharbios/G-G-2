// ============================================================
// DIWANIYA NOTIFICATIONS - Send game event notifications to players
// ============================================================

import { useGameStore } from './game-store';
import { getAlivePlayers } from './game-logic';
import { ROLE_CONFIGS } from './game-types';

interface NotificationPayload {
  playerName?: string;
  messageAr: string;
  messageEn: string;
  emoji: string;
  type: 'kill' | 'silence' | 'save' | 'eliminate' | 'mayor_reveal' | 'good_son_revenge' | 'sniper_kill' | 'info' | 'phase_change' | 'vote_results' | 'game_over' | 'round_start';
  data?: Record<string, unknown>;
}

/**
 * Send night result notifications to affected players via the room API.
 * Fire-and-forget — does not block the game flow.
 */
export function sendNightResultNotifications() {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  const results = state.dayResults;
  if (!results) return;

  const nightActions = state.nightActions;
  const notifications: NotificationPayload[] = [];

  // Medic save notification — send to the mafia's target (who was saved)
  if (results.medicSaved && nightActions.bossTarget && nightActions.medicTarget) {
    const savedPlayer = state.players.find(p => p.id === nightActions.bossTarget);
    if (savedPlayer) {
      notifications.push({
        playerName: savedPlayer.name,
        messageAr: 'أنقذك الطبيب الليلة! 🏥',
        messageEn: 'The Medic saved you tonight! 🏥',
        emoji: '🏥',
        type: 'save',
      });
    }
  }

  // Mafia kill notification
  if (results.killedByMafia) {
    notifications.push({
      playerName: results.killedByMafia.name,
      messageAr: 'لقد قُتلت على يد المافيا! 💀',
      messageEn: 'You were killed by the Mafia! 💀',
      emoji: '💀',
      type: 'kill',
    });
  }

  // Sniper kill notification (if different from mafia target and not self-kill)
  if (results.killedBySniper && results.killedBySniper.id !== results.killedByMafia?.id) {
    notifications.push({
      playerName: results.killedBySniper.name,
      messageAr: 'لقد قتلك القناص! 🎯',
      messageEn: 'You were killed by the Sniper! 🎯',
      emoji: '🎯',
      type: 'sniper_kill',
    });
  }

  // Sniper self-kill notification
  if (results.sniperSelfKilled) {
    notifications.push({
      playerName: results.sniperSelfKilled.name,
      messageAr: 'لقد قتلت نفسك بالخطأ! 💀',
      messageEn: 'You accidentally killed yourself! 💀',
      emoji: '💀',
      type: 'sniper_kill',
    });
  }

  // Silenced player notification
  if (results.silencedPlayer) {
    notifications.push({
      playerName: results.silencedPlayer.name,
      messageAr: 'لقد تم إسكاتك هذه الجولة! 🤫',
      messageEn: "You've been silenced this round! 🤫",
      emoji: '🤫',
      type: 'silence',
    });
  }

  if (notifications.length > 0) {
    sendNotifications(state.diwaniyaCode, notifications);
  }
}

/**
 * Send vote elimination notification to the eliminated player.
 */
export function sendEliminationNotification() {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  const results = state.dayResults;
  if (!results?.voteEliminated) return;

  const eliminated = results.voteEliminated;
  const notifications: NotificationPayload[] = [
    {
      playerName: eliminated.name,
      messageAr: 'لقد أُقصيت من اللعبة! 💀',
      messageEn: "You've been eliminated from the game! 💀",
      emoji: '💀',
      type: 'eliminate',
    },
  ];

  sendNotifications(state.diwaniyaCode, notifications);
}

/**
 * Send mayor reveal notification to the mayor player.
 */
export function sendMayorRevealNotification(playerName: string) {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  const notifications: NotificationPayload[] = [
    {
      playerName,
      messageAr: 'تم الكشف عن هويتك كعمدة! 🏛️',
      messageEn: 'Your identity as Mayor has been revealed! 🏛️',
      emoji: '🏛️',
      type: 'mayor_reveal',
    },
  ];

  sendNotifications(state.diwaniyaCode, notifications);
}

/**
 * Send good son revenge notification.
 */
export function sendGoodSonRevengeNotification(targetName: string) {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  const notifications: NotificationPayload[] = [
    {
      playerName: targetName,
      messageAr: 'لقد قتلك الابن الصالح انتقاماً! ⚔️',
      messageEn: 'You were killed by the Good Son in revenge! ⚔️',
      emoji: '⚔️',
      type: 'good_son_revenge',
    },
  ];

  sendNotifications(state.diwaniyaCode, notifications);
}

/**
 * Send a game over announcement to all players with full results.
 */
export function sendGameOverAnnouncement(winner: 'mafia' | 'citizen') {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  const messageAr = winner === 'mafia'
    ? 'انتهت اللعبة! فازت المافيا! 🎭'
    : 'انتهت اللعبة! فاز المواطنون! 🎉';
  const messageEn = winner === 'mafia'
    ? 'Game Over! The Mafia wins! 🎭'
    : 'Game Over! The Citizens win! 🎉';
  const emoji = winner === 'mafia' ? '🎭' : '🎉';

  fetch('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'announce',
      code: state.diwaniyaCode,
      messageAr,
      messageEn,
      emoji,
      type: 'game_over',
      data: { winner },
    }),
  }).catch(() => {});
}

// ============================================================
// NEW: Game State Sync Functions
// ============================================================

/**
 * Sync the current game phase to the room API so players can see it.
 */
export function syncGameStateToRoom(gameState: {
  phase: string;
  round: number;
  alivePlayers: { id: string; name: string }[];
  silencedPlayers: string[];
  eliminatedThisRound?: string;
  voteResults?: { name: string; count: number }[];
  winner?: 'mafia' | 'citizen';
  nightEvents?: { killedByMafia?: string; killedBySniper?: string; medicSaved: boolean; silencedPlayer?: string; sniperSelfKilled?: string };
  allPlayersWithRoles?: { name: string; role: string; team: string; alive: boolean; roleEmoji: string; nameAr: string; nameEn: string }[];
}) {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  fetch('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateGameState',
      code: state.diwaniyaCode,
      gameState,
    }),
  }).catch(() => {});
}

/**
 * Send a phase change announcement to all players.
 */
export function sendPhaseAnnouncement(phaseAr: string, phaseEn: string, emoji: string, phase: string, round: number) {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  fetch('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'announce',
      code: state.diwaniyaCode,
      messageAr: phaseAr,
      messageEn: phaseEn,
      emoji,
      type: 'phase_change',
      data: { phase, round },
    }),
  }).catch(() => {});
}

/**
 * Send vote results to all players after host confirms.
 */
export function sendVoteResultsAnnouncement(voteResults: { name: string; count: number }[], eliminatedName?: string) {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  const sorted = [...voteResults].sort((a, b) => b.count - a.count);
  const resultsText = sorted.map(r => `${r.name}: ${r.count}`).join(' | ');
  
  let messageAr = `📊 نتائج التصويت:\n${resultsText}`;
  let messageEn = `📊 Vote Results:\n${resultsText}`;
  
  if (eliminatedName) {
    messageAr += `\n\n💀 أُقصوا ${eliminatedName}!`;
    messageEn += `\n\n💀 ${eliminatedName} has been eliminated!`;
  }

  fetch('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'announce',
      code: state.diwaniyaCode,
      messageAr,
      messageEn,
      emoji: '📊',
      type: 'vote_results',
      data: { voteResults: sorted, eliminatedName },
    }),
  }).catch(() => {});
}

/**
 * Send full game over results with all player roles revealed.
 */
export function sendGameOverResults() {
  const state = useGameStore.getState();
  if (!state.diwaniyaMode || !state.diwaniyaCode) return;

  const allPlayersWithRoles = state.players.map(p => {
    const config = p.role ? ROLE_CONFIGS[p.role] : null;
    return {
      name: p.name,
      role: p.role || '',
      team: config ? config.team : '',
      alive: p.isAlive,
      roleEmoji: config ? config.icon : '',
      nameAr: config ? config.nameAr : '',
      nameEn: config ? config.nameEn : '',
    };
  });

  // Build game log from store (round, phase, message)
  const gameLog = state.gameLog.map(entry => ({
    round: entry.round,
    phase: entry.phase,
    message: entry.message,
  }));

  const aliveCount = state.players.filter(p => p.isAlive).length;
  const eliminatedCount = state.players.filter(p => !p.isAlive).length;

  syncGameStateToRoom({
    phase: 'game_over',
    round: state.round,
    alivePlayers: getAlivePlayers(state.players).map(p => ({ id: p.id, name: p.name })),
    silencedPlayers: [],
    winner: state.gameWinner || undefined,
    allPlayersWithRoles,
    gameLog,
    eliminatedCount,
    aliveCount,
  });
}

// ============================================================
// Internal helper
// ============================================================

function sendNotifications(code: string, notifications: NotificationPayload[]) {
  fetch('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'notify',
      code,
      notifications,
    }),
  }).catch(() => {
    // Fire-and-forget, ignore errors
  });
}
