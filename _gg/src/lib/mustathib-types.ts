// ============================================================
// المستئذب (Mustathib) — Werewolf-style social deduction
// Game Types & Configuration
// ============================================================

export type Role =
  | 'owl'           // البومة — seer-like, sees one player's role each night
  | 'crow'          // الغراب — killer at night (Mafia equivalent)
  | 'fortuneTeller' // العرافة — sees alignment (good/evil) of one player per night
  | 'werewolf'      // المستذئب — main killer (alias of crow, alternate name)
  | 'villager'      // القروي — basic townsperson, votes during day
  | 'doctor';       // الطبيب — protects one player from being killed each night

export type Team = 'good' | 'evil';

export type GamePhase =
  | 'landing'
  | 'setup'
  | 'roleReveal'
  | 'night'
  | 'day'
  | 'vote'
  | 'game_over';

export type GameMode = 'classic' | 'diwaniya';

export interface Player {
  id: string;
  name: string;
  role: Role;
  isAlive: boolean;
}

export type NightActionType = 'see' | 'kill' | 'protect';

export interface NightAction {
  actorId: string;
  role: Role;
  targetId: string | null;
  action: NightActionType;
}

export interface DayVote {
  voterId: string;
  targetId: string;
}

export interface GameLogEntry {
  round: number;
  message: string;
  type: 'info' | 'action' | 'danger' | 'success' | 'system';
  timestamp: number;
}

// ============================================================
// ROLE CONFIGURATION
// ============================================================

export const ROLE_CONFIG: Record<Role, {
  label: string;
  emoji: string;
  team: Team;
  description: string;
  nightActionLabel: string;
  nightPrompt: string;
  canSelfTarget: boolean;
}> = {
  owl: {
    label: 'البومة',
    emoji: '🦉',
    team: 'good',
    description: 'ترى دور لاعب واحد كل ليلة',
    nightActionLabel: 'اختاري لاعباً لرؤية دوره',
    nightPrompt: 'البومة — استيقظي واختاري لاعباً لرؤية دوره',
    canSelfTarget: false,
  },
  crow: {
    label: 'الغراب',
    emoji: '🐦‍⬛',
    team: 'evil',
    description: 'يقتل لاعباً واحداً كل ليلة',
    nightActionLabel: 'اختاروا ضحية',
    nightPrompt: 'الغراب — استيقظوا واختاروا ضحية',
    canSelfTarget: false,
  },
  fortuneTeller: {
    label: 'العرافة',
    emoji: '🔮',
    team: 'good',
    description: 'ترى انتماء لاعب (خير/شر) كل ليلة',
    nightActionLabel: 'اختاري لاعباً لمعرفة انتمائه',
    nightPrompt: 'العرافة — استيقظي واختاري لاعباً لمعرفة انتمائه',
    canSelfTarget: false,
  },
  werewolf: {
    label: 'المستذئب',
    emoji: '🐺',
    team: 'evil',
    description: 'يقتل لاعباً واحداً كل ليلة',
    nightActionLabel: 'اختاروا ضحية',
    nightPrompt: 'المستذئب — استيقظوا واختاروا ضحية',
    canSelfTarget: false,
  },
  villager: {
    label: 'القروي',
    emoji: '👨‍🌾',
    team: 'good',
    description: 'ليس لديه قدرة ليلية، يصوت نهاراً',
    nightActionLabel: '',
    nightPrompt: '',
    canSelfTarget: false,
  },
  doctor: {
    label: 'الطبيب',
    emoji: '⚕️',
    team: 'good',
    description: 'يحمي لاعباً واحداً من القتل كل ليلة',
    nightActionLabel: 'اختر من تحميه',
    nightPrompt: 'الطبيب — استيقظ واختر من تحميه',
    canSelfTarget: true,
  },
};

// ============================================================
// ROLE DISTRIBUTION (balanced — werewolf-style)
// ============================================================
// Target: ~1 killer per 4-5 players; 1 owl, 1 fortune teller, 1 doctor; rest villagers
// Crow + Werewolf are both killers (one of each in larger games)

export function distributeRoles(playerCount: number): Role[] {
  const roles: Role[] = [];

  // Killers (crow + werewolf together)
  const killerCount = playerCount <= 7 ? 1 : playerCount <= 11 ? 2 : 3;

  // First killer is werewolf (المستذئب — the title role)
  roles.push('werewolf');

  // Additional killers alternate crow/werewolf
  for (let i = 1; i < killerCount; i++) {
    roles.push(i % 2 === 0 ? 'werewolf' : 'crow');
  }

  // Special good roles
  roles.push('owl');
  roles.push('fortuneTeller');

  // Doctor only when >= 8 players (so kills aren't too easy)
  if (playerCount >= 8) {
    roles.push('doctor');
  }

  // Fill the rest with villagers
  while (roles.length < playerCount) {
    roles.push('villager');
  }

  // Shuffle the result so assignments are random
  return shuffleArray(roles);
}

// ============================================================
// WIN CONDITION
// ============================================================

export function checkWinCondition(players: Player[]): Team | null {
  const alive = players.filter(p => p.isAlive);
  const aliveEvil = alive.filter(p => ROLE_CONFIG[p.role].team === 'evil').length;
  const aliveGood = alive.filter(p => ROLE_CONFIG[p.role].team === 'good').length;

  // Evil wins if evil outnumbers good (or equals good and at least 1 evil alive)
  if (aliveEvil === 0) return 'good';
  if (aliveGood === 0) return 'evil';
  if (aliveEvil >= aliveGood) return 'evil';
  return null;
}

// ============================================================
// HELPERS
// ============================================================

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shuffleRoles(roles: Role[]): Role[] {
  return shuffleArray(roles);
}

export function makeLog(round: number, message: string, type: GameLogEntry['type'] = 'info'): GameLogEntry {
  return { round, message, type, timestamp: Date.now() };
}
