// ============================================================
// GAME LOGIC - Arabic Mafia Card Game
// ============================================================

import {
  Player,
  RoleType,
  CARD_DECK,
  generateCardDeck,
  NightActions,
  EliminationEvent,
  GameLogEntry,
  ROLE_CONFIGS,
  Vote,
} from './game-types';

// Fisher-Yates shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create players from names and assign roles
export function createPlayersWithRoles(names: string[], customMafiaCount?: number): Player[] {
  const deck = generateCardDeck(names.length, customMafiaCount);
  const roles = shuffleArray([...deck]);
  return names.map((name, index) => ({
    id: `player-${index}`,
    name: name.trim(),
    role: roles[index] || null,
    isAlive: true,
    isSilenced: false,
    hasSeenCard: false,
    hasRevealedMayor: false,
    sniperBulletUsed: false,
    eliminatedByVote: false,
    eliminatedByMafia: false,
    eliminatedBySniper: false,
  }));
}

// Get alive players
export function getAlivePlayers(players: Player[]): Player[] {
  return players.filter((p) => p.isAlive);
}

// Get alive mafia players
export function getAliveMafia(players: Player[]): Player[] {
  return players.filter(
    (p) => p.isAlive && p.role && ROLE_CONFIGS[p.role].team === 'mafia'
  );
}

// Get alive citizen players
export function getAliveCitizens(players: Player[]): Player[] {
  return players.filter(
    (p) => p.isAlive && p.role && ROLE_CONFIGS[p.role].team === 'citizen'
  );
}

// Check win conditions - mafia wins when citizens count <= mafia count
export function checkWinCondition(players: Player[]): 'mafia' | 'citizen' | null {
  const aliveMafia = getAliveMafia(players);
  const aliveCitizens = getAliveCitizens(players);

  if (aliveMafia.length === 0) return 'citizen';
  // Mafia wins only when they strictly outnumber alive citizens
  if (aliveMafia.length > aliveCitizens.length) return 'mafia';
  return null;
}

// Process night actions and return events
export function processNightActions(
  players: Player[],
  nightActions: NightActions,
  round: number
): {
  updatedPlayers: Player[];
  events: EliminationEvent[];
  log: GameLogEntry[];
  medicSaved: boolean;
  sniperSelfKill: boolean;
} {
  const updatedPlayers = players.map((p) => ({
    ...p,
    isSilenced: false, // Reset silence from previous round
  }));

  const events: EliminationEvent[] = [];
  const log: GameLogEntry[] = [];
  let medicSaved = false;
  let sniperSelfKill = false;

  // Apply silencer
  if (nightActions.silencerTarget) {
    const silencedPlayer = updatedPlayers.find(
      (p) => p.id === nightActions.silencerTarget
    );
    if (silencedPlayer) {
      silencedPlayer.isSilenced = true;
      log.push({
        round,
        phase: 'night',
        message: `تم تسكيت ${silencedPlayer.name}`,
        timestamp: Date.now(),
      });
    }
  }

  // Boss kills
  const bossTarget = nightActions.bossTarget;
  const medicTarget = nightActions.medicTarget;

  if (bossTarget) {
    const bossTargetPlayer = updatedPlayers.find((p) => p.id === bossTarget);

    // Check if medic saved
    if (medicTarget && medicTarget === bossTarget) {
      // Medic saved the target!
      medicSaved = true;
      log.push({
        round,
        phase: 'night',
        message: `أنقذ الطبيب ${bossTargetPlayer?.name || 'الهدف'}`,
        timestamp: Date.now(),
      });
    } else if (bossTargetPlayer && bossTargetPlayer.isAlive) {
      // Target dies
      bossTargetPlayer.isAlive = false;
      bossTargetPlayer.eliminatedByMafia = true;
      events.push({
        playerId: bossTargetPlayer.id,
        playerName: bossTargetPlayer.name,
        role: bossTargetPlayer.role!,
        reason: 'mafia',
        round,
      });
      log.push({
        round,
        phase: 'night',
        message: `قتل شيخ المافيا ${bossTargetPlayer.name}`,
        timestamp: Date.now(),
      });
    }
  }

  // Sniper shoots
  if (nightActions.sniperShooting && nightActions.sniperTarget) {
    const sniperTargetPlayer = updatedPlayers.find(
      (p) => p.id === nightActions.sniperTarget
    );
    const sniperPlayer = updatedPlayers.find((p) => p.role === 'sniper');

    if (sniperTargetPlayer && sniperTargetPlayer.isAlive) {
      const targetRole = sniperTargetPlayer.role
        ? ROLE_CONFIGS[sniperTargetPlayer.role].team
        : 'citizen';

      sniperTargetPlayer.isAlive = false;
      sniperTargetPlayer.eliminatedBySniper = true;

      if (sniperPlayer) {
        sniperPlayer.sniperBulletUsed = true;
      }

      if (targetRole === 'mafia') {
        // Sniper hit mafia - good!
        events.push({
          playerId: sniperTargetPlayer.id,
          playerName: sniperTargetPlayer.name,
          role: sniperTargetPlayer.role!,
          reason: 'sniper',
          round,
        });
        log.push({
          round,
          phase: 'night',
          message: `القناص قتل ${sniperTargetPlayer.name} (مافيا!)`,
          timestamp: Date.now(),
        });
      } else {
        // Sniper hit citizen - both die
        events.push({
          playerId: sniperTargetPlayer.id,
          playerName: sniperTargetPlayer.name,
          role: sniperTargetPlayer.role!,
          reason: 'sniper_miss',
          round,
        });

        if (sniperPlayer && sniperPlayer.isAlive) {
          sniperPlayer.isAlive = false;
          sniperSelfKill = true;
          events.push({
            playerId: sniperPlayer.id,
            playerName: sniperPlayer.name,
            role: sniperPlayer.role!,
            reason: 'sniper_miss',
            round,
          });
        }

        log.push({
          round,
          phase: 'night',
          message: `القناص أخطأ وقتل ${sniperTargetPlayer.name} (مواطن!) ومات أيضاً`,
          timestamp: Date.now(),
        });
      }
    }
  }

  return { updatedPlayers, events, log, medicSaved, sniperSelfKill };
}

// Process votes and eliminate player with most votes
export function processVotes(
  players: Player[],
  votes: Vote[],
  round: number
): {
  eliminatedPlayer: Player | null;
  updatedPlayers: Player[];
  event: EliminationEvent | null;
  log: GameLogEntry;
  voteResults: Record<string, number>;
} {
  // Count votes (mayor vote counts as 3 if revealed)
  const voteCounts: Record<string, number> = {};
  const alivePlayers = getAlivePlayers(players);

  for (const player of alivePlayers) {
    voteCounts[player.id] = 0;
  }

  for (const vote of votes) {
    if (vote.targetId) {
      const voter = players.find((p) => p.id === vote.voterId);
      let voteWeight = 1;
      if (voter?.hasRevealedMayor) {
        voteWeight = 3;
      }
      voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + voteWeight;
    }
  }

  // Find player with most votes
  let maxVotes = 0;
  let eliminatedId: string | null = null;
  let isTie = false;

  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = playerId;
      isTie = false;
    } else if (count === maxVotes && count > 0) {
      isTie = true;
    }
  }

  const updatedPlayers = players.map((p) => ({ ...p }));

  if (isTie || maxVotes === 0) {
    // Tie or no votes - no elimination
    const log: GameLogEntry = {
      round,
      phase: 'day',
      message: 'تعادل في الأصوات! لم يتم إقصاء أحد',
      timestamp: Date.now(),
    };
    return {
      eliminatedPlayer: null,
      updatedPlayers,
      event: null,
      log,
      voteResults: voteCounts,
    };
  }

  const eliminatedPlayer = updatedPlayers.find((p) => p.id === eliminatedId)!;
  eliminatedPlayer.isAlive = false;
  eliminatedPlayer.eliminatedByVote = true;

  const event: EliminationEvent = {
    playerId: eliminatedPlayer.id,
    playerName: eliminatedPlayer.name,
    role: eliminatedPlayer.role!,
    reason: 'vote',
    round,
  };

  const log: GameLogEntry = {
    round,
    phase: 'day',
    message: `تم إقصاء ${eliminatedPlayer.name} بالتصويت (${maxVotes} أصوات)`,
    timestamp: Date.now(),
  };

  return {
    eliminatedPlayer,
    updatedPlayers,
    event,
    log,
    voteResults: voteCounts,
  };
}

// Get player names for selection (exclude certain players)
export function getSelectableTargets(
  players: Player[],
  excludeIds: string[] = [],
  includeDead: boolean = false
): Player[] {
  return players.filter(
    (p) => (!excludeIds.includes(p.id)) && (includeDead || p.isAlive)
  );
}

// Check if a player role is mafia
export function isMafia(role: RoleType | null): boolean {
  if (!role) return false;
  return ROLE_CONFIGS[role].team === 'mafia';
}

// Get the Mafia Boss player
export function getMafiaBoss(players: Player[]): Player | undefined {
  return players.find((p) => p.role === 'mafia_boss' && p.isAlive);
}

// Get the Silencer player
export function getSilencer(players: Player[]): Player | undefined {
  return players.find((p) => p.role === 'mafia_silencer' && p.isAlive);
}

// Get the Medic player
export function getMedic(players: Player[]): Player | undefined {
  return players.find((p) => p.role === 'medic' && p.isAlive);
}

// Get the Sniper player
export function getSniper(players: Player[]): Player | undefined {
  return players.find((p) => p.role === 'sniper' && p.isAlive);
}

// Generate unique ID
export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Default empty night actions
export function getDefaultNightActions(): NightActions {
  return {
    bossTarget: null,
    silencerTarget: null,
    medicTarget: null,
    sniperTarget: null,
    sniperShooting: false,
  };
}
