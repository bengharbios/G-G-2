import { createClient, Client } from '@libsql/client';

// ─── Types ────────────────────────────────────────────────────────────

export interface GameConfig {
  id: string;
  gameSlug: string;
  gameName: string;
  isEnabled: boolean;
  order: number;
  playerRange: string;
  description: string;
  icon: string;
  color: string;
  isComingSoon: boolean;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegram: string;
  subscriptionCode: string;
  plan: string; // 'free' | 'trial' | 'paid'
  isActive: boolean;
  allowedGames: string[]; // parsed from JSON
  startDate: string;
  endDate: string | null;
  startedAt: string;
  expiresAt: string | null;
  createdAt: string;
  // Trial-specific fields
  isTrial: boolean;
  trialSessionsUsed: number;
  trialExpiresAt: string | null;
  gemsBalance: number;
  // Level/XP system fields
  level: number;
  xp: number;
  playerId: string | null;
  purchasedItems: string[];
}

export interface XPRecord {
  id: string;
  subscriptionId: string;
  subscriptionCode: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export type XPReason = 'game_play' | 'game_win' | 'event_complete' | 'purchase' | 'invite' | 'daily_login';

export const MAX_LEVEL = 100;

export interface GameSession {
  id: string;
  gameSlug: string;
  hostName: string;
  playersCount: number;
  duration: number | null;
  createdAt: string;
}

export interface SiteConfig {
  id: string;
  allowDirectRegistration: boolean;
  telegramLink: string;
  whatsappLink: string;
  subscriptionPrice: string;
  contactMessage: string;
  updatedAt: string;
  // Trial settings
  trialGameSlugs: string[];
  maxTrialSessions: number;
  trialDurationDays: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  eventType: 'promotion' | 'tournament' | 'seasonal' | 'special';
  gameSlug: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
  badge: string;
  badgeColor: 'amber' | 'rose' | 'emerald' | 'blue' | 'purple';
  rewardType?: string; // 'xp', 'gems', 'frame', 'cover', 'dice', 'none'
  rewardAmount?: number;
  rewardDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GemChargeRequest {
  id: string;
  subscriptionCode: string;
  subscriberName: string;
  gemsAmount: number;
  packageType: 'small' | 'medium' | 'large' | 'mega';
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  createdAt: string;
}

// ─── Client singleton ─────────────────────────────────────────────────

let _client: Client | null = null;
let _tablesReady = false;

function getClient(): Client {
  if (_client) return _client;

  const dbUrl =
    process.env.TURSO_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'file:db/data.db';

  const isRemote = dbUrl.startsWith('libsql://');

  _client = createClient({
    url: dbUrl,
    ...(isRemote ? { authToken: process.env.TURSO_AUTH_TOKEN || '' } : {}),
  });

  return _client;
}

// ─── SQL value converter ──────────────────────────────────────────────

function sqlVal(val: unknown): unknown {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

// ─── Table creation + seeding ─────────────────────────────────────────

async function ensureAdminTables(): Promise<void> {
  if (_tablesReady) return;
  const c = getClient();

  await c.execute(`
    CREATE TABLE IF NOT EXISTS GameConfig (
      id TEXT PRIMARY KEY,
      gameSlug TEXT UNIQUE NOT NULL,
      gameName TEXT NOT NULL,
      isEnabled INTEGER DEFAULT 1,
      "order" INTEGER DEFAULT 0,
      playerRange TEXT DEFAULT '',
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      color TEXT DEFAULT '',
      isComingSoon INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add isFree column if it doesn't exist
  try {
    const cols = await c.execute("PRAGMA table_info(GameConfig)");
    const hasIsFree = cols.rows.some((r) => r.name === 'isFree');
    if (!hasIsFree) {
      await c.execute('ALTER TABLE GameConfig ADD COLUMN isFree INTEGER DEFAULT 0');
    }
  } catch {
    // Column may already exist, ignore
  }

  // Subscription table - use CREATE IF NOT EXISTS + migrations (never DROP in production)
  await c.execute(`
    CREATE TABLE IF NOT EXISTS Subscription (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      telegram TEXT DEFAULT '',
      subscriptionCode TEXT UNIQUE NOT NULL,
      plan TEXT DEFAULT 'free',
      isActive INTEGER DEFAULT 1,
      allowedGames TEXT DEFAULT '[]',
      startDate TEXT NOT NULL,
      endDate TEXT,
      startedAt TEXT DEFAULT (datetime('now')),
      expiresAt TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add missing columns to Subscription table
  try {
    const subCols = await c.execute('PRAGMA table_info(Subscription)');
    const subColNames = subCols.rows.map((r) => r.name);
    if (!subColNames.includes('telegram')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN telegram TEXT DEFAULT ""');
    }
    if (!subColNames.includes('expiresAt')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN expiresAt TEXT');
    }
    if (!subColNames.includes('startedAt')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN startedAt TEXT DEFAULT (datetime(\'now\'))');
    }
    if (!subColNames.includes('isTrial')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN isTrial INTEGER DEFAULT 0');
    }
    if (!subColNames.includes('trialSessionsUsed')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN trialSessionsUsed INTEGER DEFAULT 0');
    }
    if (!subColNames.includes('trialExpiresAt')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN trialExpiresAt TEXT');
    }
  } catch {
    // Columns may already exist, ignore
  }

  // Migration: add trial columns to SiteConfig table
  try {
    const scCols = await c.execute('PRAGMA table_info(SiteConfig)');
    const scColNames = scCols.rows.map((r) => r.name);
    if (!scColNames.includes('trialGameSlugs')) {
      await c.execute('ALTER TABLE SiteConfig ADD COLUMN trialGameSlugs TEXT DEFAULT "[]"');
    }
    if (!scColNames.includes('maxTrialSessions')) {
      await c.execute('ALTER TABLE SiteConfig ADD COLUMN maxTrialSessions INTEGER DEFAULT 1');
    }
    if (!scColNames.includes('trialDurationDays')) {
      await c.execute('ALTER TABLE SiteConfig ADD COLUMN trialDurationDays INTEGER DEFAULT 3');
    }
  } catch {
    // Columns may already exist, ignore
  }

  await c.execute(`
    CREATE TABLE IF NOT EXISTS GameSession (
      id TEXT PRIMARY KEY,
      gameSlug TEXT NOT NULL,
      hostName TEXT NOT NULL,
      playersCount INTEGER DEFAULT 0,
      duration INTEGER,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS ContactMessage (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS SiteConfig (
      id TEXT PRIMARY KEY DEFAULT 'main',
      allowDirectRegistration INTEGER DEFAULT 1,
      telegramLink TEXT DEFAULT '',
      whatsappLink TEXT DEFAULT '',
      subscriptionPrice TEXT DEFAULT '',
      contactMessage TEXT DEFAULT '',
      trialGameSlugs TEXT DEFAULT '[]',
      maxTrialSessions INTEGER DEFAULT 1,
      trialDurationDays INTEGER DEFAULT 3,
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Event table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS Event (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      imageUrl TEXT DEFAULT '',
      eventType TEXT DEFAULT 'promotion',
      gameSlug TEXT DEFAULT '',
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      badge TEXT DEFAULT '🔥',
      badgeColor TEXT DEFAULT 'amber',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add gemsBalance column to Subscription
  try {
    const subCols2 = await c.execute('PRAGMA table_info(Subscription)');
    const subColNames2 = subCols2.rows.map((r) => r.name);
    if (!subColNames2.includes('gemsBalance')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN gemsBalance INTEGER DEFAULT 0');
    }
  } catch {
    // Column may already exist, ignore
  }

  // Migration: add reward columns to Event table
  try {
    const evtCols = await c.execute('PRAGMA table_info(Event)');
    const evtColNames = evtCols.rows.map((r) => r.name);
    if (!evtColNames.includes('rewardType')) {
      await c.execute("ALTER TABLE Event ADD COLUMN rewardType TEXT DEFAULT 'none'");
    }
    if (!evtColNames.includes('rewardAmount')) {
      await c.execute('ALTER TABLE Event ADD COLUMN rewardAmount INTEGER DEFAULT 0');
    }
    if (!evtColNames.includes('rewardDescription')) {
      await c.execute("ALTER TABLE Event ADD COLUMN rewardDescription TEXT DEFAULT ''");
    }
  } catch {
    // Columns may already exist, ignore
  }

  // Migration: add Level/XP columns to Subscription
  try {
    const lvlCols = await c.execute('PRAGMA table_info(Subscription)');
    const lvlColNames = lvlCols.rows.map((r) => r.name);
    if (!lvlColNames.includes('level')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN level INTEGER DEFAULT 1');
    }
    if (!lvlColNames.includes('xp')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN xp INTEGER DEFAULT 0');
    }
    if (!lvlColNames.includes('playerId')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN playerId TEXT');
    }
    if (!lvlColNames.includes('purchasedItems')) {
      await c.execute("ALTER TABLE Subscription ADD COLUMN purchasedItems TEXT DEFAULT '[]'");
    }
  } catch {
    // Columns may already exist, ignore
  }

  // XPHistory table for tracking XP awards
  await c.execute(`
    CREATE TABLE IF NOT EXISTS XPHistory (
      id TEXT PRIMARY KEY,
      subscriptionId TEXT NOT NULL,
      subscriptionCode TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // GemChargeRequest table for gem charging/purchase requests
  await c.execute(`
    CREATE TABLE IF NOT EXISTS GemChargeRequest (
      id TEXT PRIMARY KEY,
      subscriptionCode TEXT NOT NULL,
      subscriberName TEXT DEFAULT '',
      gemsAmount INTEGER NOT NULL,
      packageType TEXT DEFAULT 'small',
      status TEXT DEFAULT 'pending',
      paymentMethod TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  _tablesReady = true;
}

// ─── Seed data ────────────────────────────────────────────────────────

const defaultGames: Omit<GameConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    gameSlug: 'mafia',
    gameName: 'المافيا',
    isEnabled: true,
    order: 0,
    playerRange: '4-14',
    description: 'لعبة المافيا الكلاسيكية مع أدوار متعددة! اكتشف من هو المافيا قبل أن يسيطروا على المدينة.',
    icon: '🕵️',
    color: 'red',
    isComingSoon: false,
  },
  {
    gameSlug: 'tobol',
    gameName: 'طبول الحرب',
    isEnabled: true,
    order: 1,
    playerRange: '2-8',
    description: 'حرب استراتيجية حقيقية مع 64 سلاح و60 زر هجوم! خطط واستولِ على أراضي العدو.',
    icon: '🥁',
    color: 'orange',
    isComingSoon: false,
  },
  {
    gameSlug: 'tabot',
    gameName: 'الهروب من التابوت',
    isEnabled: true,
    order: 2,
    playerRange: '4-16',
    description: 'هل تستطيع الهروب من التابوت قبل فوات الأوان؟ لعبة مليئة بالمفاجآت والرعب!',
    icon: '🪦',
    color: 'purple',
    isComingSoon: false,
  },
  {
    gameSlug: 'prison',
    gameName: 'السجن',
    isEnabled: true,
    order: 3,
    playerRange: '4-16',
    description: 'سجن مليء بالمفاجآت! حبس خصومك، حرر أصدقائك، وتجنب الإعدام في لعبة الاستراتيجية والحظ.',
    icon: '🔒',
    color: 'amber',
    isComingSoon: false,
  },
  {
    gameSlug: 'risk',
    gameName: 'المجازفة',
    isEnabled: true,
    order: 4,
    playerRange: '2-8',
    description: 'ادفع حظك! اسحب البطاقات واجمع النقاط، لكن احذر القنابل! لعبة استراتيجية ومجازفة ممتعة.',
    icon: '💣',
    color: 'violet',
    isComingSoon: false,
  },
  {
    gameSlug: 'risk2',
    gameName: 'المجازفة 2',
    isEnabled: true,
    order: 5,
    playerRange: '2-10',
    description: 'كاشف البطاقات! اختر أرقام مختلفة واحفظ نقاطك. 50 بطاقة و5 بطاقات خاصة ذهبية مضاعفة.',
    icon: '🎴',
    color: 'orange',
    isComingSoon: false,
  },
  {
    gameSlug: 'familyfeud',
    gameName: 'فاميلي فيود',
    isEnabled: true,
    order: 6,
    playerRange: '2-10',
    description: 'لعبة فاميلي فيود الكلاسيكية! المستضيف يتحكم باللعبة ويرى الإجابات.',
    icon: '🏆',
    color: 'amber',
    isComingSoon: false,
  },
  {
    gameSlug: 'baharharb',
    gameName: 'بحر و حرب',
    isEnabled: true,
    order: 7,
    playerRange: '2-20',
    description: 'لعبة ذكاء وكلمات عربية! أجب على الأسئلة واكشف الكلمات المشتركة.',
    icon: '🌊⚔️',
    color: 'teal',
    isComingSoon: false,
  },
];

export async function seedGameConfigs(): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute('SELECT COUNT(*) as count FROM GameConfig');
  const count = Number(result.rows[0]?.count ?? 0);

  if (count === 0) {
    for (const game of defaultGames) {
      await c.execute({
        sql: `INSERT INTO GameConfig (id, gameSlug, gameName, isEnabled, "order", playerRange, description, icon, color, isComingSoon)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          game.gameSlug,
          game.gameName,
          game.isEnabled ? 1 : 0,
          game.order,
          game.playerRange,
          game.description,
          game.icon,
          game.color,
          game.isComingSoon ? 1 : 0,
        ],
      });
    }
  }
}

// ─── Row mappers ──────────────────────────────────────────────────────

function toGameConfig(row: Record<string, unknown>): GameConfig {
  return {
    id: row.id as string,
    gameSlug: row.gameSlug as string,
    gameName: row.gameName as string,
    isEnabled: !!(row.isEnabled && row.isEnabled !== 0),
    order: (row.order as number) ?? 0,
    playerRange: (row.playerRange as string) ?? '',
    description: (row.description as string) ?? '',
    icon: (row.icon as string) ?? '',
    color: (row.color as string) ?? '',
    isComingSoon: !!(row.isComingSoon && row.isComingSoon !== 0),
    isFree: !!(row.isFree && row.isFree !== 0),
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

function parseAllowedGames(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  try {
    const parsed = JSON.parse(val as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parsePurchasedItems(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  try {
    const parsed = JSON.parse(val as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    telegram: (row.telegram as string) ?? '',
    subscriptionCode: (row.subscriptionCode as string) ?? '',
    plan: (row.plan as string) ?? 'free',
    isActive: !!(row.isActive && row.isActive !== 0),
    allowedGames: parseAllowedGames(row.allowedGames),
    startDate: (row.startDate as string) ?? new Date().toISOString(),
    endDate: (row.endDate as string) ?? null,
    startedAt: (row.startedAt as string) ?? new Date().toISOString(),
    expiresAt: (row.expiresAt as string) ?? null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    isTrial: !!(row.isTrial && row.isTrial !== 0),
    trialSessionsUsed: Number(row.trialSessionsUsed ?? 0),
    trialExpiresAt: (row.trialExpiresAt as string) ?? null,
    gemsBalance: Number(row.gemsBalance ?? 0),
    level: Number(row.level ?? 1),
    xp: Number(row.xp ?? 0),
    playerId: (row.playerId as string) ?? null,
    purchasedItems: parsePurchasedItems(row.purchasedItems),
  };
}

function toGameSession(row: Record<string, unknown>): GameSession {
  return {
    id: row.id as string,
    gameSlug: row.gameSlug as string,
    hostName: row.hostName as string,
    playersCount: (row.playersCount as number) ?? 0,
    duration: row.duration != null ? (row.duration as number) : null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };
}

function toContactMessage(row: Record<string, unknown>): ContactMessage {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    message: row.message as string,
    isRead: !!(row.isRead && row.isRead !== 0),
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };
}

function toEvent(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    title: (row.title as string) ?? '',
    description: (row.description as string) ?? '',
    imageUrl: (row.imageUrl as string) ?? '',
    eventType: (row.eventType as Event['eventType']) ?? 'promotion',
    gameSlug: (row.gameSlug as string) ?? '',
    startDate: (row.startDate as string) ?? '',
    endDate: (row.endDate as string) ?? '',
    isActive: !!(row.isActive && row.isActive !== 0),
    sortOrder: (row.sortOrder as number) ?? 0,
    badge: (row.badge as string) ?? '🔥',
    badgeColor: (row.badgeColor as Event['badgeColor']) ?? 'amber',
    rewardType: (row.rewardType as string) ?? 'none',
    rewardAmount: row.rewardAmount != null ? Number(row.rewardAmount) : undefined,
    rewardDescription: (row.rewardDescription as string) ?? undefined,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

// ─── GameConfig operations ────────────────────────────────────────────

export async function getAllGames(): Promise<GameConfig[]> {
  await ensureAdminTables();
  await seedGameConfigs();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameConfig ORDER BY "order" ASC',
    args: [],
  });

  return result.rows.map((r) => toGameConfig(r as Record<string, unknown>));
}

export async function getEnabledGames(): Promise<GameConfig[]> {
  await ensureAdminTables();
  await seedGameConfigs();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameConfig WHERE isEnabled = 1 ORDER BY "order" ASC',
    args: [],
  });

  return result.rows.map((r) => toGameConfig(r as Record<string, unknown>));
}

export async function getGameBySlug(slug: string): Promise<GameConfig | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameConfig WHERE gameSlug = ?',
    args: [slug],
  });

  if (result.rows.length === 0) return null;
  return toGameConfig(result.rows[0] as Record<string, unknown>);
}

export async function updateGameConfig(
  slug: string,
  data: Partial<Omit<GameConfig, 'id' | 'createdAt'>>
): Promise<GameConfig | null> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getGameBySlug(slug);

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    // Map isEnabled/isComingSoon to integers
    if (key === 'isEnabled' || key === 'isComingSoon') {
      setClauses.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'order') {
      setClauses.push(`"order" = ?`);
      values.push(val);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(slug);

  await c.execute({
    sql: `UPDATE GameConfig SET ${setClauses.join(', ')} WHERE gameSlug = ?`,
    args: values,
  });

  return getGameBySlug(slug);
}

function toSiteConfig(row: Record<string, unknown>): SiteConfig {
  return {
    id: (row.id as string) ?? 'main',
    allowDirectRegistration: !!(row.allowDirectRegistration && row.allowDirectRegistration !== 0),
    telegramLink: (row.telegramLink as string) ?? '',
    whatsappLink: (row.whatsappLink as string) ?? '',
    subscriptionPrice: (row.subscriptionPrice as string) ?? '',
    contactMessage: (row.contactMessage as string) ?? '',
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
    trialGameSlugs: parseAllowedGames(row.trialGameSlugs),
    maxTrialSessions: Number(row.maxTrialSessions ?? 1),
    trialDurationDays: Number(row.trialDurationDays ?? 3),
  };
}

// ─── Subscription operations ──────────────────────────────────────────

export async function generateSubscriptionCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GG-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createSubscriber(data: {
  name: string;
  email: string;
  phone?: string;
  telegram?: string;
  plan?: string;
  allowedGames?: string[];
  startDate?: string;
  endDate?: string;
  isTrial?: boolean;
  trialSessionsUsed?: number;
  trialExpiresAt?: string;
}): Promise<Subscription> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();
  let code = await generateSubscriptionCode();

  // Ensure uniqueness
  for (let attempts = 0; attempts < 10; attempts++) {
    const existing = await c.execute({
      sql: 'SELECT id FROM Subscription WHERE subscriptionCode = ?',
      args: [code],
    });
    if (existing.rows.length === 0) break;
    code = await generateSubscriptionCode();
  }

  const startDate = data.startDate || new Date().toISOString();

  await c.execute({
    sql: `INSERT INTO Subscription (id, name, email, phone, telegram, subscriptionCode, plan, allowedGames, startDate, endDate, isTrial, trialSessionsUsed, trialExpiresAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.name,
      data.email,
      data.phone ?? '',
      data.telegram ?? '',
      code,
      data.plan ?? 'free',
      JSON.stringify(data.allowedGames ?? []),
      startDate,
      data.endDate ?? null,
      data.isTrial ? 1 : 0,
      data.trialSessionsUsed ?? 0,
      data.trialExpiresAt ?? null,
    ],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE id = ?',
    args: [id],
  });

  return toSubscription(result.rows[0] as Record<string, unknown>);
}

export async function validateSubscriptionCode(code: string): Promise<Subscription | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ?',
    args: [code],
  });

  if (result.rows.length === 0) return null;
  return toSubscription(result.rows[0] as Record<string, unknown>);
}

export async function checkGameAccess(subscriptionCode: string, gameSlug: string, options?: { incrementTrialUsage?: boolean }): Promise<{
  allowed: boolean;
  reason: string;
  subscriber?: Subscription;
  trialInfo?: { sessionsUsed: number; maxSessions: number; expiresAt: string | null; daysLeft: number };
}> {
  await ensureAdminTables();
  const c = getClient();

  // First check if the game itself is free
  const gameResult = await c.execute({
    sql: 'SELECT isFree FROM GameConfig WHERE gameSlug = ? AND isEnabled = 1',
    args: [gameSlug],
  });

  if (gameResult.rows.length === 0) {
    return { allowed: false, reason: 'game_not_found' };
  }

  const gameRow = gameResult.rows[0] as Record<string, unknown>;
  if (gameRow.isFree && gameRow.isFree !== 0) {
    return { allowed: true, reason: 'free_game' };
  }

  // Check subscription
  const subResult = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ?',
    args: [subscriptionCode],
  });

  if (subResult.rows.length === 0) {
    return { allowed: false, reason: 'not_subscribed' };
  }

  const subscriber = toSubscription(subResult.rows[0] as Record<string, unknown>);

  // Check if active
  if (!subscriber.isActive) {
    return { allowed: false, reason: 'inactive', subscriber };
  }

  // ─── Trial subscriber checks ──────────────────────────────────
  if (subscriber.isTrial) {
    // Check trial expiry
    if (subscriber.trialExpiresAt) {
      const now = new Date();
      const trialExpiry = new Date(subscriber.trialExpiresAt);
      if (now > trialExpiry) {
        return { allowed: false, reason: 'trial_expired', subscriber };
      }
    }

    // Get max trial sessions from site config
    const siteConfig = await getSiteConfig();
    const maxSessions = siteConfig.maxTrialSessions || 1;

    // Check if trial game slugs are configured
    const trialGames = siteConfig.trialGameSlugs || [];

    // Check if the requested game is in the trial games list
    if (trialGames.length > 0 && !trialGames.includes(gameSlug)) {
      return { allowed: false, reason: 'trial_game_not_included', subscriber };
    }

    // Check if trial sessions are used up
    if (subscriber.trialSessionsUsed >= maxSessions) {
      const daysLeft = subscriber.trialExpiresAt
        ? Math.max(0, Math.ceil((new Date(subscriber.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;
      return {
        allowed: false,
        reason: 'trial_sessions_exceeded',
        subscriber,
        trialInfo: {
          sessionsUsed: subscriber.trialSessionsUsed,
          maxSessions,
          expiresAt: subscriber.trialExpiresAt,
          daysLeft,
        },
      };
    }

    // Trial is valid — increment usage if requested
    if (options?.incrementTrialUsage) {
      await c.execute({
        sql: 'UPDATE Subscription SET trialSessionsUsed = trialSessionsUsed + 1 WHERE id = ?',
        args: [subscriber.id],
      });
      subscriber.trialSessionsUsed += 1;
    }

    const daysLeft = subscriber.trialExpiresAt
      ? Math.max(0, Math.ceil((new Date(subscriber.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      allowed: true,
      reason: 'trial_active',
      subscriber,
      trialInfo: {
        sessionsUsed: subscriber.trialSessionsUsed,
        maxSessions,
        expiresAt: subscriber.trialExpiresAt,
        daysLeft,
      },
    };
  }

  // ─── Paid subscriber checks ───────────────────────────────────
  // Check if expired
  if (subscriber.endDate) {
    const now = new Date();
    const endDate = new Date(subscriber.endDate);
    if (now > endDate) {
      return { allowed: false, reason: 'expired', subscriber };
    }
  }

  if (subscriber.expiresAt) {
    const now = new Date();
    const expiresAt = new Date(subscriber.expiresAt);
    if (now > expiresAt) {
      return { allowed: false, reason: 'expired', subscriber };
    }
  }

  // Check if game is in allowed list
  // - For paid subscribers: if allowedGames is non-empty, the game must be in it
  // - For paid subscribers: if allowedGames is empty, DENY access (admin must explicitly assign games)
  // - For trial subscribers: checked above using SiteConfig.trialGameSlugs
  if (subscriber.plan === 'paid') {
    if (subscriber.allowedGames.length === 0 || !subscriber.allowedGames.includes(gameSlug)) {
      return { allowed: false, reason: 'game_not_included', subscriber };
    }
  }

  // Free plan subscribers (non-trial) with no allowed games: deny access to non-free games
  if (subscriber.plan === 'free' && !subscriber.isTrial) {
    return { allowed: false, reason: 'not_subscribed', subscriber };
  }

  return { allowed: true, reason: 'subscribed', subscriber };
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription ORDER BY createdAt DESC',
    args: [],
  });

  return result.rows.map((r) => toSubscription(r as Record<string, unknown>));
}

/**
 * @deprecated Use createSubscriber instead
 */
export async function createSubscription(data: {
  email: string;
  name: string;
  plan?: string;
}): Promise<Subscription> {
  return createSubscriber({
    name: data.name,
    email: data.email,
    plan: data.plan,
  });
}

export async function toggleSubscription(id: string): Promise<Subscription | null> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'UPDATE Subscription SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END WHERE id = ?',
    args: [id],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return toSubscription(result.rows[0] as Record<string, unknown>);
}

export async function updateSubscriber(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const result = await c.execute({
      sql: 'SELECT * FROM Subscription WHERE id = ?',
      args: [id],
    });
    if (result.rows.length === 0) return null;
    return toSubscription(result.rows[0] as Record<string, unknown>);
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'isActive') {
      setClauses.push(`isActive = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'allowedGames') {
      setClauses.push(`allowedGames = ?`);
      values.push(JSON.stringify(val));
    } else if (key === 'id' || key === 'startedAt' || key === 'createdAt') {
      // Skip immutable fields
      continue;
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  if (setClauses.length === 0) {
    const result = await c.execute({
      sql: 'SELECT * FROM Subscription WHERE id = ?',
      args: [id],
    });
    if (result.rows.length === 0) return null;
    return toSubscription(result.rows[0] as Record<string, unknown>);
  }

  values.push(id);

  await c.execute({
    sql: `UPDATE Subscription SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return toSubscription(result.rows[0] as Record<string, unknown>);
}

export async function deleteSubscriber(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({
    sql: 'DELETE FROM Subscription WHERE id = ?',
    args: [id],
  });
}

// ─── SiteConfig operations ────────────────────────────────────────────

export async function getSiteConfig(): Promise<SiteConfig> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM SiteConfig WHERE id = ?',
    args: ['main'],
  });

  if (result.rows.length === 0) {
    // Insert default row
    await c.execute({
      sql: `INSERT OR IGNORE INTO SiteConfig (id) VALUES ('main')`,
      args: [],
    });
    const fresh = await c.execute({
      sql: 'SELECT * FROM SiteConfig WHERE id = ?',
      args: ['main'],
    });
    return toSiteConfig(fresh.rows[0] as Record<string, unknown>);
  }

  return toSiteConfig(result.rows[0] as Record<string, unknown>);
}

export async function updateSiteConfig(data: Partial<SiteConfig>): Promise<SiteConfig> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'id' || key === 'updatedAt') continue;
    if (key === 'allowDirectRegistration') {
      setClauses.push(`allowDirectRegistration = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'trialGameSlugs' && Array.isArray(val)) {
      setClauses.push(`trialGameSlugs = ?`);
      values.push(JSON.stringify(val));
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  // Ensure row exists
  await c.execute({ sql: `INSERT OR IGNORE INTO SiteConfig (id) VALUES ('main')`, args: [] });

  values.push('main');
  await c.execute({
    sql: `UPDATE SiteConfig SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });

  const result = await c.execute({
    sql: 'SELECT * FROM SiteConfig WHERE id = ?',
    args: ['main'],
  });

  return toSiteConfig(result.rows[0] as Record<string, unknown>);
}

// ─── Public subscriber registration (Free Trial) ─────────────────────

export async function registerSubscriber(data: {
  name: string;
  email: string;
  phone?: string;
}): Promise<Subscription> {
  const siteConfig = await getSiteConfig();
  const trialDurationDays = siteConfig.trialDurationDays || 3;
  const trialGameSlugs = siteConfig.trialGameSlugs || [];

  // Calculate trial expiry
  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() + trialDurationDays);

  return createSubscriber({
    name: data.name,
    email: data.email,
    phone: data.phone,
    plan: 'trial',
    allowedGames: trialGameSlugs,
    isTrial: true,
    trialSessionsUsed: 0,
    trialExpiresAt: trialExpiresAt.toISOString(),
    endDate: trialExpiresAt.toISOString(),
  });
}

// ─── GameSession operations ───────────────────────────────────────────

export async function getAllSessions(limit = 50): Promise<GameSession[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameSession ORDER BY createdAt DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((r) => toGameSession(r as Record<string, unknown>));
}

export async function getSessionsByGame(gameSlug: string): Promise<GameSession[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameSession WHERE gameSlug = ? ORDER BY createdAt DESC LIMIT 50',
    args: [gameSlug],
  });

  return result.rows.map((r) => toGameSession(r as Record<string, unknown>));
}

export async function createSession(data: {
  gameSlug: string;
  hostName: string;
  playersCount: number;
  duration?: number;
}): Promise<GameSession> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO GameSession (id, gameSlug, hostName, playersCount, duration)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, data.gameSlug, data.hostName, data.playersCount, data.duration ?? null],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM GameSession WHERE id = ?',
    args: [id],
  });

  return toGameSession(result.rows[0] as Record<string, unknown>);
}

// ─── ContactMessage operations ────────────────────────────────────────

export async function getAllMessages(): Promise<ContactMessage[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM ContactMessage ORDER BY createdAt DESC',
    args: [],
  });

  return result.rows.map((r) => toContactMessage(r as Record<string, unknown>));
}

export async function getUnreadMessageCount(): Promise<number> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT COUNT(*) as count FROM ContactMessage WHERE isRead = 0',
    args: [],
  });

  return Number(result.rows[0]?.count ?? 0);
}

export async function markMessageAsRead(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'UPDATE ContactMessage SET isRead = 1 WHERE id = ?',
    args: [id],
  });
}

export async function deleteMessage(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'DELETE FROM ContactMessage WHERE id = ?',
    args: [id],
  });
}

export async function createContactMessage(data: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactMessage> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO ContactMessage (id, name, email, message)
          VALUES (?, ?, ?, ?)`,
    args: [id, data.name, data.email, data.message],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM ContactMessage WHERE id = ?',
    args: [id],
  });

  return toContactMessage(result.rows[0] as Record<string, unknown>);
}

// ─── Stats ────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<{
  totalGames: number;
  enabledGames: number;
  comingSoonGames: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalSessions: number;
  sessionsToday: number;
  totalPlayers: number;
  unreadMessages: number;
  gameStats: { slug: string; name: string; sessions: number; players: number }[];
}> {
  await ensureAdminTables();
  await seedGameConfigs();
  const c = getClient();

  const totalGames = await c.execute('SELECT COUNT(*) as count FROM GameConfig');
  const enabledGames = await c.execute('SELECT COUNT(*) as count FROM GameConfig WHERE isEnabled = 1');
  const comingSoonGames = await c.execute('SELECT COUNT(*) as count FROM GameConfig WHERE isComingSoon = 1');
  const totalSubs = await c.execute('SELECT COUNT(*) as count FROM Subscription');
  const activeSubs = await c.execute('SELECT COUNT(*) as count FROM Subscription WHERE isActive = 1');
  const totalSessions = await c.execute('SELECT COUNT(*) as count FROM GameSession');
  const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00';
  const sessionsToday = await c.execute({
    sql: 'SELECT COUNT(*) as count FROM GameSession WHERE createdAt >= ?',
    args: [todayStart],
  });
  const totalPlayers = await c.execute('SELECT COALESCE(SUM(playersCount), 0) as total FROM GameSession');
  const unreadMsgs = await c.execute('SELECT COUNT(*) as count FROM ContactMessage WHERE isRead = 0');

  const gameStatsResult = await c.execute(`
    SELECT gs.gameSlug, gc.gameName, COUNT(*) as sessions, SUM(gs.playersCount) as players
    FROM GameSession gs
    JOIN GameConfig gc ON gs.gameSlug = gc.gameSlug
    GROUP BY gs.gameSlug
    ORDER BY sessions DESC
  `);

  return {
    totalGames: Number(totalGames.rows[0]?.count ?? 0),
    enabledGames: Number(enabledGames.rows[0]?.count ?? 0),
    comingSoonGames: Number(comingSoonGames.rows[0]?.count ?? 0),
    totalSubscriptions: Number(totalSubs.rows[0]?.count ?? 0),
    activeSubscriptions: Number(activeSubs.rows[0]?.count ?? 0),
    totalSessions: Number(totalSessions.rows[0]?.count ?? 0),
    sessionsToday: Number(sessionsToday.rows[0]?.count ?? 0),
    totalPlayers: Number(totalPlayers.rows[0]?.total ?? 0),
    unreadMessages: Number(unreadMsgs.rows[0]?.count ?? 0),
    gameStats: gameStatsResult.rows.map((r) => ({
      slug: r.gameSlug as string,
      name: r.gameName as string,
      sessions: Number(r.sessions ?? 0),
      players: Number(r.players ?? 0),
    })),
  };
}

// ─── Event operations ──────────────────────────────────────────────────

export async function getAllEvents(): Promise<Event[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Event ORDER BY sortOrder ASC, createdAt DESC',
    args: [],
  });

  return result.rows.map((r) => toEvent(r as Record<string, unknown>));
}

export async function getActiveEvents(): Promise<Event[]> {
  await ensureAdminTables();
  const c = getClient();
  const now = new Date().toISOString();

  const result = await c.execute({
    sql: 'SELECT * FROM Event WHERE isActive = 1 AND startDate <= ? AND endDate >= ? ORDER BY sortOrder ASC',
    args: [now, now],
  });

  return result.rows.map((r) => toEvent(r as Record<string, unknown>));
}

export async function getEventsByGame(gameSlug: string): Promise<Event[]> {
  await ensureAdminTables();
  const c = getClient();
  const now = new Date().toISOString();

  const result = await c.execute({
    sql: "SELECT * FROM Event WHERE isActive = 1 AND startDate <= ? AND endDate >= ? AND (gameSlug = ? OR gameSlug = '') ORDER BY sortOrder ASC",
    args: [now, now, gameSlug],
  });

  return result.rows.map((r) => toEvent(r as Record<string, unknown>));
}

export async function createEvent(data: {
  title: string;
  description?: string;
  imageUrl?: string;
  eventType?: string;
  gameSlug?: string;
  startDate: string;
  endDate: string;
  badge?: string;
  badgeColor?: string;
  sortOrder?: number;
  rewardType?: string;
  rewardAmount?: number;
  rewardDescription?: string;
}): Promise<Event> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO Event (id, title, description, imageUrl, eventType, gameSlug, startDate, endDate, badge, badgeColor, sortOrder, rewardType, rewardAmount, rewardDescription)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.title,
      data.description ?? '',
      data.imageUrl ?? '',
      data.eventType ?? 'promotion',
      data.gameSlug ?? '',
      data.startDate,
      data.endDate,
      data.badge ?? '🔥',
      data.badgeColor ?? 'amber',
      data.sortOrder ?? 0,
      data.rewardType ?? 'none',
      data.rewardAmount ?? 0,
      data.rewardDescription ?? '',
    ],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM Event WHERE id = ?',
    args: [id],
  });

  return toEvent(result.rows[0] as Record<string, unknown>);
}

export async function updateEvent(id: string, data: Partial<Omit<Event, 'id' | 'createdAt'>>): Promise<Event | null> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const result = await c.execute({ sql: 'SELECT * FROM Event WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    return toEvent(result.rows[0] as Record<string, unknown>);
  }

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'isActive') {
      setClauses.push('isActive = ?');
      values.push(val ? 1 : 0);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(id);
  await c.execute({ sql: `UPDATE Event SET ${setClauses.join(', ')} WHERE id = ?`, args: values });

  const result = await c.execute({ sql: 'SELECT * FROM Event WHERE id = ?', args: [id] });
  if (result.rows.length === 0) return null;
  return toEvent(result.rows[0] as Record<string, unknown>);
}

export async function deleteEvent(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM Event WHERE id = ?', args: [id] });
}

// ─── Gems operations ──────────────────────────────────────────────────

export async function deductGems(subscriptionCode: string, amount: number): Promise<{ success: boolean; newBalance: number; error?: string }> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ? AND isActive = 1',
    args: [subscriptionCode],
  });

  if (result.rows.length === 0) {
    return { success: false, newBalance: 0, error: 'كود الاشتراك غير صالح' };
  }

  const sub = toSubscription(result.rows[0] as Record<string, unknown>);

  if (sub.gemsBalance < amount) {
    return { success: false, newBalance: sub.gemsBalance, error: 'رصيد غير كافٍ' };
  }

  const newBalance = sub.gemsBalance - amount;
  await c.execute({
    sql: 'UPDATE Subscription SET gemsBalance = gemsBalance - ? WHERE id = ?',
    args: [amount, sub.id],
  });

  return { success: true, newBalance };
}

// ─── Add Gems ──────────────────────────────────────────────────────────

export async function addGems(subscriptionCode: string, amount: number): Promise<{ success: boolean; newBalance: number; error?: string }> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ? AND isActive = 1',
    args: [subscriptionCode],
  });

  if (result.rows.length === 0) {
    return { success: false, newBalance: 0, error: 'كود الاشتراك غير صالح' };
  }

  const sub = toSubscription(result.rows[0] as Record<string, unknown>);

  const newBalance = sub.gemsBalance + amount;
  await c.execute({
    sql: 'UPDATE Subscription SET gemsBalance = gemsBalance + ? WHERE id = ?',
    args: [amount, sub.id],
  });

  return { success: true, newBalance };
}

// ─── GemChargeRequest operations ────────────────────────────────────────

function toGemChargeRequest(row: Record<string, unknown>): GemChargeRequest {
  return {
    id: row.id as string,
    subscriptionCode: (row.subscriptionCode as string) ?? '',
    subscriberName: (row.subscriberName as string) ?? '',
    gemsAmount: Number(row.gemsAmount ?? 0),
    packageType: (row.packageType as GemChargeRequest['packageType']) ?? 'small',
    status: (row.status as GemChargeRequest['status']) ?? 'pending',
    paymentMethod: (row.paymentMethod as string) ?? '',
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };
}

export async function createChargeRequest(data: {
  subscriptionCode: string;
  subscriberName?: string;
  gemsAmount: number;
  packageType: 'small' | 'medium' | 'large' | 'mega';
  paymentMethod: string;
}): Promise<GemChargeRequest> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO GemChargeRequest (id, subscriptionCode, subscriberName, gemsAmount, packageType, status, paymentMethod)
          VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    args: [
      id,
      data.subscriptionCode,
      data.subscriberName ?? '',
      data.gemsAmount,
      data.packageType,
      data.paymentMethod,
    ],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM GemChargeRequest WHERE id = ?',
    args: [id],
  });

  return toGemChargeRequest(result.rows[0] as Record<string, unknown>);
}

export async function getAllChargeRequests(limit = 50): Promise<GemChargeRequest[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GemChargeRequest ORDER BY createdAt DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((r) => toGemChargeRequest(r as Record<string, unknown>));
}

export async function updateChargeRequestStatus(
  requestId: string,
  newStatus: 'pending' | 'approved' | 'rejected'
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  await ensureAdminTables();
  const c = getClient();

  // Fetch the charge request
  const reqResult = await c.execute({
    sql: 'SELECT * FROM GemChargeRequest WHERE id = ?',
    args: [requestId],
  });

  if (reqResult.rows.length === 0) {
    return { success: false, error: 'طلب الشحن غير موجود' };
  }

  const request = toGemChargeRequest(reqResult.rows[0] as Record<string, unknown>);

  if (request.status === 'approved') {
    return { success: false, error: 'تم الموافقة على هذا الطلب مسبقاً' };
  }

  // Update status
  await c.execute({
    sql: 'UPDATE GemChargeRequest SET status = ? WHERE id = ?',
    args: [newStatus, requestId],
  });

  // If approved, add gems to subscriber
  if (newStatus === 'approved') {
    const gemsResult = await addGems(request.subscriptionCode, request.gemsAmount);
    if (!gemsResult.success) {
      return { success: false, error: gemsResult.error };
    }
    return { success: true, newBalance: gemsResult.newBalance };
  }

  return { success: true };
}

// ─── Level / XP System ────────────────────────────────────────────────

/**
 * Calculate the XP needed to go from `level` to `level + 1`.
 * Formula: ((level + (level + 1)) * 1000) / 2
 */
export function calculateXPForLevel(level: number): number {
  return Math.floor(((level + (level + 1)) * 1000) / 2);
}

/**
 * Calculate total XP needed from level 1 to level `level` (exclusive).
 * This is the total XP a player would have accumulated reaching level `level`.
 */
export function calculateTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculateXPForLevel(i);
  }
  return total;
}

/**
 * Get the current level based on total accumulated XP.
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let accumulatedXP = 0;

  while (level < MAX_LEVEL) {
    const needed = calculateXPForLevel(level);
    if (accumulatedXP + needed > totalXP) {
      break;
    }
    accumulatedXP += needed;
    level++;
  }

  return level;
}

/**
 * Get detailed XP progress for a given total XP.
 */
export function getXPProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  isMaxLevel: boolean;
} {
  const currentLevel = getLevelFromXP(totalXP);
  const isMaxLevel = currentLevel >= MAX_LEVEL;

  if (isMaxLevel) {
    return {
      currentLevel: MAX_LEVEL,
      currentLevelXP: 0,
      nextLevelXP: 0,
      progress: 100,
      isMaxLevel: true,
    };
  }

  // Calculate how much XP was needed to reach currentLevel
  const totalForCurrentLevel = calculateTotalXPForLevel(currentLevel);
  // XP earned within the current level
  const currentLevelXP = totalXP - totalForCurrentLevel;
  // XP needed to reach next level
  const nextLevelXP = calculateXPForLevel(currentLevel);
  // Progress percentage
  const progress = nextLevelXP > 0 ? Math.min(100, Math.floor((currentLevelXP / nextLevelXP) * 100)) : 0;

  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP,
    progress,
    isMaxLevel: false,
  };
}

// ─── Player ID Generation ─────────────────────────────────────────────

const SPECIAL_IDS = new Set([
  '11111', '22222', '33333', '44444', '55555',
  '66666', '77777', '88888', '99999', '00000',
  '12345', '54321', '13579', '97531', '24680',
  '08642', '11223', '33445', '55667', '77889',
]);

/**
 * Check if a player ID is a special/premium ID.
 */
export function isSpecialId(id: string): boolean {
  return SPECIAL_IDS.has(id);
}

/**
 * Generate a unique random 5-digit player ID (10000-99999).
 */
export async function generatePlayerId(): Promise<string> {
  await ensureAdminTables();
  const c = getClient();

  for (let attempts = 0; attempts < 50; attempts++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));

    // Check uniqueness in DB
    const existing = await c.execute({
      sql: 'SELECT id FROM Subscription WHERE playerId = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      return id;
    }
  }

  // Fallback: use timestamp-based approach
  return String(Date.now()).slice(-5);
}

// ─── XP Awarding ───────────────────────────────────────────────────────

/**
 * Award XP to a player and update their level accordingly.
 */
export async function awardXP(
  subscriptionCode: string,
  amount: number,
  reason: string
): Promise<{
  success: boolean;
  newLevel: number;
  newXPTotal: number;
  leveledUp: boolean;
  error?: string;
}> {
  await ensureAdminTables();
  const c = getClient();

  // Validate reason
  const validReasons: string[] = ['game_play', 'game_win', 'event_complete', 'purchase', 'invite', 'daily_login'];
  if (!validReasons.includes(reason)) {
    return { success: false, newLevel: 0, newXPTotal: 0, leveledUp: false, error: 'Invalid XP reason' };
  }

  // Validate amount
  if (!Number.isInteger(amount) || amount <= 0) {
    return { success: false, newLevel: 0, newXPTotal: 0, leveledUp: false, error: 'Invalid XP amount' };
  }

  // Find subscriber
  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ? AND isActive = 1',
    args: [subscriptionCode],
  });

  if (result.rows.length === 0) {
    return { success: false, newLevel: 0, newXPTotal: 0, leveledUp: false, error: 'Subscriber not found' };
  }

  const sub = toSubscription(result.rows[0] as Record<string, unknown>);

  // Calculate new XP and level
  const currentTotalXP = sub.xp;
  const newTotalXP = currentTotalXP + amount;
  const oldLevel = sub.level;
  const newLevel = getLevelFromXP(newTotalXP);
  const leveledUp = newLevel > oldLevel;

  // Update XP and level in DB
  await c.execute({
    sql: 'UPDATE Subscription SET xp = ?, level = ? WHERE id = ?',
    args: [newTotalXP, newLevel, sub.id],
  });

  // Record XP history
  const historyId = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO XPHistory (id, subscriptionId, subscriptionCode, amount, reason)
          VALUES (?, ?, ?, ?, ?)`,
    args: [historyId, sub.id, subscriptionCode, amount, reason],
  });

  return { success: true, newLevel, newXPTotal: newTotalXP, leveledUp };
}

/**
 * Get XP history for a subscriber.
 */
export async function getXPHistory(subscriptionCode: string, limit = 20): Promise<XPRecord[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM XPHistory WHERE subscriptionCode = ? ORDER BY createdAt DESC LIMIT ?',
    args: [subscriptionCode, limit],
  });

  return result.rows.map((r) => ({
    id: r.id as string,
    subscriptionId: r.subscriptionId as string,
    subscriptionCode: r.subscriptionCode as string,
    amount: Number(r.amount ?? 0),
    reason: r.reason as string,
    createdAt: (r.createdAt as string) ?? new Date().toISOString(),
  }));
}

/**
 * Assign a player ID to a subscriber.
 */
export async function assignPlayerId(subscriptionCode: string): Promise<{ success: boolean; playerId?: string; error?: string }> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ? AND isActive = 1',
    args: [subscriptionCode],
  });

  if (result.rows.length === 0) {
    return { success: false, error: 'Subscriber not found' };
  }

  const sub = toSubscription(result.rows[0] as Record<string, unknown>);

  if (sub.playerId) {
    return { success: true, playerId: sub.playerId };
  }

  const playerId = await generatePlayerId();

  await c.execute({
    sql: 'UPDATE Subscription SET playerId = ? WHERE id = ?',
    args: [playerId, sub.id],
  });

  return { success: true, playerId };
}

/**
 * Get leaderboard - top players by XP/level.
 */
export async function getLeaderboard(limit = 50): Promise<{
  rank: number;
  playerId: string;
  name: string;
  level: number;
  xp: number;
  isSpecialId: boolean;
}[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: `SELECT playerId, name, level, xp FROM Subscription
          WHERE isActive = 1 AND playerId IS NOT NULL AND playerId != ''
          ORDER BY xp DESC, level DESC
          LIMIT ?`,
    args: [limit],
  });

  return result.rows.map((r, index) => ({
    rank: index + 1,
    playerId: r.playerId as string,
    name: r.name as string,
    level: Number(r.level ?? 1),
    xp: Number(r.xp ?? 0),
    isSpecialId: isSpecialId(r.playerId as string),
  }));
}
