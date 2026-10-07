// ============================================================
// GAME TYPES - Arabic Mafia Card Game
// ============================================================

export type RoleType =
  | 'mafia_boss'
  | 'mafia_silencer'
  | 'mafia_regular'
  | 'mayor'
  | 'good_son'
  | 'medic'
  | 'sniper'
  | 'citizen';

export type Team = 'mafia' | 'citizen';

export type GamePhase =
  | 'setup'
  | 'card_distribution'
  | 'night_start'
  | 'night_mafia_wake'
  | 'night_boss_kill'
  | 'night_silencer'
  | 'night_mafia_sleep'
  | 'night_medic'
  | 'night_sniper'
  | 'night_end'
  | 'day_announcements'
  | 'day_mayor_reveal'
  | 'day_discussion'
  | 'day_voting'
  | 'day_elimination'
  | 'good_son_revenge'
  | 'game_over';

export interface RoleConfig {
  type: RoleType;
  nameAr: string;
  team: Team;
  icon: string;
  description: string;
  gradient: string;
  borderColor: string;
  textColor: string;
}

export interface Player {
  id: string;
  name: string;
  role: RoleType | null;
  isAlive: boolean;
  isSilenced: boolean;
  hasSeenCard: boolean;
  hasRevealedMayor: boolean;
  sniperBulletUsed: boolean;
  eliminatedByVote: boolean;
  eliminatedByMafia: boolean;
  eliminatedBySniper: boolean;
}

export interface NightActions {
  bossTarget: string | null;      // player id
  silencerTarget: string | null;  // player id
  medicTarget: string | null;     // player id
  sniperTarget: string | null;    // player id
  sniperShooting: boolean;
}

export interface Vote {
  voterId: string;
  targetId: string | null; // null = skip vote
}

export interface EliminationEvent {
  playerId: string;
  playerName: string;
  role: RoleType;
  reason: 'vote' | 'mafia' | 'sniper' | 'good_son' | 'sniper_miss';
  round: number;
}

export interface GameLogEntry {
  round: number;
  phase: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  phase: GamePhase;
  round: number;
  nightActions: NightActions;
  votes: Vote[];
  eliminatedPlayers: EliminationEvent[];
  revealedCards: Record<string, RoleType>;
  gameWinner: 'mafia' | 'citizen' | null;
  gameLog: GameLogEntry[];
  currentMafiaViewIndex: number;
  currentDistributionIndex: number;
  showCard: boolean;
  selectedTarget: string | null;
  discussionTimeLeft: number;
  goodSonTarget: string | null;
}

// ============================================================
// ROLE CONFIGURATIONS
// ============================================================

export const ROLE_CONFIGS: Record<RoleType, RoleConfig> = {
  mafia_boss: {
    type: 'mafia_boss',
    nameAr: 'شيخ المافيا',
    team: 'mafia',
    icon: '🕴️',
    description: 'كل ليلة، تختار شخصاً لاغتياله',
    gradient: 'from-red-900 via-red-950 to-black',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-100',
  },
  mafia_silencer: {
    type: 'mafia_silencer',
    nameAr: 'مافيا التسكيت',
    team: 'mafia',
    icon: '🤫',
    description: 'كل ليلة، تختار شخصاً لا يستطيع التحدث في الجولة التالية',
    gradient: 'from-purple-900 via-purple-950 to-black',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-100',
  },
  mafia_regular: {
    type: 'mafia_regular',
    nameAr: 'مافيا عادي',
    team: 'mafia',
    icon: '🔪',
    description: 'لا تملك قدرة خاصة، تشارك في قرارات المافيا',
    gradient: 'from-gray-800 via-gray-900 to-black',
    borderColor: 'border-gray-500/50',
    textColor: 'text-gray-200',
  },
  mayor: {
    type: 'mayor',
    nameAr: 'عمده الصالحين',
    team: 'citizen',
    icon: '🏛️',
    description: 'يمكنك كشف بطاقتك أثناء النهار بدون إقصاء. صوتك يساوي ٣ أصوات بعد الكشف',
    gradient: 'from-blue-700 via-blue-900 to-indigo-950',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-100',
  },
  good_son: {
    type: 'good_son',
    nameAr: 'الولد الصالح',
    team: 'citizen',
    icon: '👦',
    description: 'عند إقصائك، يمكنك إخراج أي شخص معك (مواطن أو مافيا)',
    gradient: 'from-green-700 via-green-900 to-emerald-950',
    borderColor: 'border-green-400/50',
    textColor: 'text-green-100',
  },
  medic: {
    type: 'medic',
    nameAr: 'الطبيب',
    team: 'citizen',
    icon: '🏥',
    description: 'كل ليلة، تخمّن من قتله شيخ المافيا لإنقاذه',
    gradient: 'from-cyan-700 via-teal-800 to-slate-900',
    borderColor: 'border-cyan-400/50',
    textColor: 'text-cyan-100',
  },
  sniper: {
    type: 'sniper',
    nameAr: 'قناص الصالحين',
    team: 'citizen',
    icon: '🎯',
    description: 'لديك رصاصة واحدة فقط طوال اللعبة. إذا قتلت مواطناً، تموت أنت أيضاً',
    gradient: 'from-amber-600 via-orange-800 to-red-950',
    borderColor: 'border-amber-400/50',
    textColor: 'text-amber-100',
  },
  citizen: {
    type: 'citizen',
    nameAr: 'مواطن صالح',
    team: 'citizen',
    icon: '👤',
    description: 'لا تملك قدرة خاصة. صوّت بحكمة!',
    gradient: 'from-sky-600 via-sky-800 to-slate-900',
    borderColor: 'border-sky-400/50',
    textColor: 'text-sky-100',
  },
};

// ============================================================
// DYNAMIC CARD DECK GENERATOR
// ============================================================

export const MIN_PLAYERS = 6;
export const MAX_PLAYERS = 20;

// Mafia count table based on total players (balanced gameplay)
export function getMafiaCount(totalPlayers: number, customCount?: number): number {
  if (customCount !== undefined && customCount >= 1) return Math.min(customCount, Math.floor(totalPlayers / 2));
  if (totalPlayers <= 7) return 2;
  if (totalPlayers <= 14) return 3;
  return 4;
}

// Special citizen roles (always present if enough players)
export function getSpecialCitizenRoles(totalPlayers: number): RoleType[] {
  const roles: RoleType[] = ['mayor', 'medic']; // Always present
  if (totalPlayers >= 8) {
    roles.push('good_son', 'sniper');
  }
  return roles;
}

// Generate card deck dynamically based on player count
export function generateCardDeck(totalPlayers: number, customMafiaCount?: number): RoleType[] {
  const mafiaCount = getMafiaCount(totalPlayers, customMafiaCount);
  const specialCitizens = getSpecialCitizenRoles(totalPlayers);

  // Build mafia roles
  const mafiaRoles: RoleType[] = ['mafia_boss'];
  if (mafiaCount >= 2) mafiaRoles.push('mafia_silencer');
  for (let i = mafiaRoles.length; i < mafiaCount; i++) {
    mafiaRoles.push('mafia_regular');
  }

  // Fill remaining with plain citizens
  const citizenCount = totalPlayers - mafiaRoles.length - specialCitizens.length;
  const plainCitizens: RoleType[] = [];
  for (let i = 0; i < citizenCount; i++) {
    plainCitizens.push('citizen');
  }

  return [...mafiaRoles, ...specialCitizens, ...plainCitizens];
}

// Get team composition info for display
export interface TeamComposition {
  totalPlayers: number;
  mafiaCount: number;
  citizenCount: number;
  mafiaRoles: { type: RoleType; name: string }[];
  citizenSpecialRoles: { type: RoleType; name: string }[];
  plainCitizens: number;
}

export function getTeamComposition(totalPlayers: number, customMafiaCount?: number): TeamComposition {
  const deck = generateCardDeck(totalPlayers, customMafiaCount);
  const mafiaCount = getMafiaCount(totalPlayers, customMafiaCount);
  const specialCitizens = getSpecialCitizenRoles(totalPlayers);
  const citizenCount = totalPlayers - mafiaCount;
  const plainCitizens = citizenCount - specialCitizens.length;

  const mafiaRoles = deck
    .filter((r) => ROLE_CONFIGS[r].team === 'mafia')
    .map((r) => ({ type: r, name: ROLE_CONFIGS[r].nameAr }));

  const citizenSpecialRoles = deck
    .filter((r) => ROLE_CONFIGS[r].team === 'citizen' && r !== 'citizen')
    .map((r) => ({ type: r, name: ROLE_CONFIGS[r].nameAr }));

  return {
    totalPlayers,
    mafiaCount,
    citizenCount,
    mafiaRoles,
    citizenSpecialRoles,
    plainCitizens,
  };
}

// Legacy: keep original 14-player deck as default
export const CARD_DECK: RoleType[] = generateCardDeck(14);
export const TOTAL_PLAYERS = 14;
