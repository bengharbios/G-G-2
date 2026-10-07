// ════════════════════════════════════════════════════════════════
// TABOT GAME — TYPE SYSTEM (v3.0 — Clean Rebuild)
// الهروب من التابوت — نظام الأنواع الكامل
// ════════════════════════════════════════════════════════════════

// ── Phase ─────────────────────────────────────────────────────

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';

// ── Players ────────────────────────────────────────────────────

export type PlayerRole = 'leader' | 'deputy' | 'member' | 'guest';
export type PlayerStatus = 'active' | 'imprisoned' | 'killed';
export type TabotTeam = 'alpha' | 'beta';

export interface Player {
  id: string;
  name: string;
  team: TabotTeam;
  role: PlayerRole;
  status: PlayerStatus;
  avatar: string;
}

// ── Doors ──────────────────────────────────────────────────────

export type DoorOutcome =
  | 'empty'             // 4 doors — nothing happens
  | 'safe_passage'      // 2 doors — safe, continue
  | 'imprison_enemy'    // 2 doors — pick enemy to jail
  | 'imprison_teammate' // 1 door  — team votes who to jail
  | 'free_teammate'     // 2 doors — free jailed teammate
  | 'self_imprison'     // 2 doors — player gets jailed
  | 'kill_player'       // 1 door  — player killed
  | 'kill_enemy'        // 1 door  — pick enemy to kill
  | 'kill_self';        // 1 door  — suicide

export interface Door {
  id: number;
  outcome: DoorOutcome;
  isRevealed: boolean;
  revealedBy: string | null;
}

// ── Teams ──────────────────────────────────────────────────────

export interface TeamInfo {
  id: TabotTeam;
  name: string;
  icon: string;
  players: Player[];
  activeCount: number;
  imprisonedCount: number;
  killedCount: number;
  totalMembers: number;
  leader: Player | null;
  deputy: Player | null;
}

// ── Logs ───────────────────────────────────────────────────────

export interface GameLogEntry {
  round: number;
  message: string;
  timestamp: number;
  type: 'info' | 'action' | 'danger' | 'success' | 'system';
}

// ── Interaction ────────────────────────────────────────────────

export type InteractionState =
  | 'waiting_for_leader'   // Leader needs to pick who opens
  | 'waiting_for_player'   // Player needs to pick a door
  | 'showing_result'       // Result is being displayed
  | 'picking_enemy_imprison'
  | 'picking_enemy_kill'
  | 'picking_teammate_free'
  | 'voting_teammate_imprison'
  | 'none';

// ════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════

export const OUTCOME_CONFIG: Record<DoorOutcome, {
  label: string;
  description: string;
  emoji: string;
  type: 'safe' | 'attack' | 'defense' | 'self_damage' | 'team_damage';
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  needsAction: boolean;
}> = {
  empty: {
    label: 'تابوت فارغ',
    description: 'آمن... لا شيء يحدث!',
    emoji: '🪦',
    type: 'safe',
    color: 'text-slate-300',
    bgColor: 'bg-slate-800/80',
    borderColor: 'border-slate-600/50',
    glowColor: 'shadow-slate-500/20',
    needsAction: false,
  },
  safe_passage: {
    label: 'ممر آمن',
    description: 'أمان تام! واصل طريقك بحرية.',
    emoji: '✨',
    type: 'safe',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/80',
    borderColor: 'border-cyan-500/50',
    glowColor: 'shadow-cyan-500/20',
    needsAction: false,
  },
  imprison_enemy: {
    label: 'احبس عدوك',
    description: 'اختر لاعب من الفريق الخصم ليُسجن!',
    emoji: '⛓️',
    type: 'attack',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/80',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-amber-500/30',
    needsAction: true,
  },
  imprison_teammate: {
    label: 'خيانة داخلية',
    description: 'فريقك يصوّت لاختيار من يُحبس!',
    emoji: '🗡️',
    type: 'team_damage',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/80',
    borderColor: 'border-orange-500/50',
    glowColor: 'shadow-orange-500/30',
    needsAction: true,
  },
  free_teammate: {
    label: 'مفتاح الحرية',
    description: 'اختر زميلك المحبوس ليحرره!',
    emoji: '🔑',
    type: 'defense',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/80',
    borderColor: 'border-emerald-500/50',
    glowColor: 'shadow-emerald-500/20',
    needsAction: true,
  },
  self_imprison: {
    label: 'فخ التابوت',
    description: 'سقطت في الفخ! أنت الآن محبوس.',
    emoji: '🔒',
    type: 'self_damage',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950/80',
    borderColor: 'border-yellow-500/50',
    glowColor: 'shadow-yellow-500/30',
    needsAction: false,
  },
  kill_player: {
    label: 'موت محقق',
    description: 'لقد قُتلت! لا يمكنك العودة أبداً.',
    emoji: '💀',
    type: 'self_damage',
    color: 'text-red-400',
    bgColor: 'bg-red-950/80',
    borderColor: 'border-red-500/50',
    glowColor: 'shadow-red-500/30',
    needsAction: false,
  },
  kill_enemy: {
    label: 'إعدام',
    description: 'اختر لاعب من الفريق الخصم لقتله!',
    emoji: '☠️',
    type: 'attack',
    color: 'text-rose-400',
    bgColor: 'bg-rose-950/80',
    borderColor: 'border-rose-500/50',
    glowColor: 'shadow-rose-500/30',
    needsAction: true,
  },
  kill_self: {
    label: 'انتحار',
    description: 'انتحرت! لا يمكنك العودة أبداً.',
    emoji: '🎭',
    type: 'self_damage',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/80',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-purple-500/30',
    needsAction: false,
  },
};

// ── Door Distribution (16 doors) ──────────────────────────────

export const DOOR_DISTRIBUTION: DoorOutcome[] = [
  'empty', 'empty', 'empty', 'empty',
  'safe_passage', 'safe_passage',
  'imprison_enemy', 'imprison_enemy',
  'imprison_teammate',
  'free_teammate', 'free_teammate',
  'self_imprison', 'self_imprison',
  'kill_player',
  'kill_enemy',
  'kill_self',
];

// ── Roles ──────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<PlayerRole, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  leader: {
    label: 'قائد',
    emoji: '👑',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    description: 'يختار من يفتح الباب كل جولة',
  },
  deputy: {
    label: 'نائب',
    emoji: '⭐',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    description: 'يحل محل القائد',
  },
  member: {
    label: 'عضو',
    emoji: '🛡️',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    description: 'عضو فاعل',
  },
  guest: {
    label: 'ضيف',
    emoji: '👁️',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/15',
    description: 'متفرج فقط',
  },
};

// ── Teams ──────────────────────────────────────────────────────

export const TEAM_CONFIG: Record<TabotTeam, {
  id: TabotTeam;
  defaultName: string;
  icon: string;
  color: string;
  borderColor: string;
  glowClass: string;
  gradient: string;
  bgLight: string;
}> = {
  alpha: {
    id: 'alpha',
    defaultName: 'فريق الرعب',
    icon: '👹',
    color: 'text-red-400',
    borderColor: 'border-red-500/40',
    glowClass: 'shadow-red-500/20',
    gradient: 'from-red-950/50 to-red-900/20',
    bgLight: 'bg-red-500/10',
  },
  beta: {
    id: 'beta',
    defaultName: 'فريق الظلام',
    icon: '🦇',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    glowClass: 'shadow-blue-500/20',
    gradient: 'from-blue-950/50 to-blue-900/20',
    bgLight: 'bg-blue-500/10',
  },
};

// ── Avatar Pool ────────────────────────────────────────────────

export const AVATAR_POOL = [
  '🧙', '🧛', '🧟', '👻', '💀', '🤡', '🦊', '🐺', '🦁', '🐯',
  '🐻', '🦅', '🐍', '🕷️', '🦇', '🐙', '🦂', '🐉', '🦎', '🐠',
];

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createDoors(): Door[] {
  const outcomes = shuffleArray(DOOR_DISTRIBUTION);
  return outcomes.map((outcome, index) => ({
    id: index + 1,
    outcome,
    isRevealed: false,
    revealedBy: null,
  }));
}

export function createPlayer(
  name: string,
  team: TabotTeam,
  index: number,
  role: PlayerRole = 'member'
): Player {
  return {
    id: `p-${team}-${index}`,
    name,
    team,
    role,
    status: 'active',
    avatar: AVATAR_POOL[index % AVATAR_POOL.length],
  };
}

export function getTeamInfo(players: Player[], teamId: TabotTeam, teamName: string): TeamInfo {
  const teamPlayers = players.filter(p => p.team === teamId);
  const config = TEAM_CONFIG[teamId];
  const members = teamPlayers.filter(p => p.role !== 'guest');
  return {
    id: teamId,
    name: teamName || config.defaultName,
    icon: config.icon,
    players: teamPlayers,
    activeCount: members.filter(p => p.status === 'active').length,
    imprisonedCount: members.filter(p => p.status === 'imprisoned').length,
    killedCount: members.filter(p => p.status === 'killed').length,
    totalMembers: members.length,
    leader: teamPlayers.find(p => p.role === 'leader') || null,
    deputy: teamPlayers.find(p => p.role === 'deputy') || null,
  };
}

export function checkGameOver(players: Player[]): {
  over: boolean;
  winner: TabotTeam | 'draw' | null;
  reason: string;
} {
  const alphaMembers = players.filter(p => p.team === 'alpha' && p.role !== 'guest');
  const betaMembers = players.filter(p => p.team === 'beta' && p.role !== 'guest');

  const alphaDown = alphaMembers.length > 0 && alphaMembers.every(p => p.status !== 'active');
  const betaDown = betaMembers.length > 0 && betaMembers.every(p => p.status !== 'active');

  if (alphaDown && betaDown) return { over: true, winner: 'draw', reason: 'تعادل! جميع لاعبي الفريقين خُلعوا' };
  if (alphaDown) return { over: true, winner: 'beta', reason: 'تم إقصاء جميع أعضاء فريق الرعب!' };
  if (betaDown) return { over: true, winner: 'alpha', reason: 'تم إقصاء جميع أعضاء فريق الظلام!' };

  return { over: false, winner: null, reason: '' };
}

export function getOpposingTeam(team: TabotTeam): TabotTeam {
  return team === 'alpha' ? 'beta' : 'alpha';
}

export function getActiveMembers(players: Player[], team: TabotTeam): Player[] {
  return players.filter(p => p.team === team && p.status === 'active' && p.role !== 'guest');
}

export function getImprisonedMembers(players: Player[], team: TabotTeam): Player[] {
  return players.filter(p => p.team === team && p.status === 'imprisoned' && p.role !== 'guest');
}

export function hasImprisonedPlayers(players: Player[], team: TabotTeam): boolean {
  return players.some(p => p.team === team && p.status === 'imprisoned' && p.role !== 'guest');
}

export function getNextTeam(currentTeam: TabotTeam): TabotTeam {
  return currentTeam === 'alpha' ? 'beta' : 'alpha';
}
