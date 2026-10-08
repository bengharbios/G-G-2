import { createClient, Client, type InValue } from '@libsql/client';

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

// ─── PlayerFrame types ──────────────────────────────────────────────

export interface PlayerFrame {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  glowColor: string;
  pattern: 'solid' | 'gradient' | 'animated' | 'dotted' | 'double';
  price: number;
  isFree: boolean;
  isActive: boolean;
  sortOrder: number;
  totalOwned: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserFrame {
  id: string;
  userId: string;
  subscriptionId: string | null;
  frameId: string;
  isEquipped: boolean;
  obtainedFrom: 'gift' | 'purchase' | 'level' | 'event' | 'admin' | 'achievement';
  obtainedNote: string;
  obtainedAt: string;
}

// ─── AppUser types ────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  phone: string;
  avatar: string;
  bio: string;
  country: string;
  cover: string;
  frame: string;
  ornament: string;
  card: string;
  gender: string;
  birthDate: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  subscriptionId: string | null;
  lastLoginAt: string | null;
  numericId: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Client singleton ─────────────────────────────────────────────────

let _client: Client | null = null;
let _tablesReady = false;

export function getClient(): Client {
  if (_client) return _client;

  // Priority: TURSO_DATABASE_URL > DATABASE_URL > local fallback
  // On Vercel: TURSO_DATABASE_URL is always set → uses Turso cloud
  // On local dev: TURSO_DATABASE_URL may be set but DATABASE_URL=file: takes priority for speed
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const fallbackUrl = process.env.DATABASE_URL || 'file:db/data.db';
  const isLocalDev = !!process.env.NODE_ENV && process.env.NODE_ENV === 'development' && fallbackUrl.startsWith('file:');

  const dbUrl = (tursoUrl && !isLocalDev) ? tursoUrl : fallbackUrl;
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

export async function ensureAdminTables(): Promise<void> {
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

  // PlayerGameStats - per-user per-game played/won counters (profile dialog)
  await c.execute(`
    CREATE TABLE IF NOT EXISTS PlayerGameStats (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      gameSlug TEXT NOT NULL,
      played INTEGER DEFAULT 0,
      won INTEGER DEFAULT 0,
      updatedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, gameSlug)
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

  // AppUser table for user accounts
  await c.execute(`
    CREATE TABLE IF NOT EXISTS AppUser (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      displayName TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      country TEXT DEFAULT '',
      cover TEXT DEFAULT '',
      frame TEXT DEFAULT '',
      ornament TEXT DEFAULT '',
      card TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      isActive INTEGER DEFAULT 1,
      numericId INTEGER,
      subscriptionId TEXT,
      lastLoginAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migrate: add numericId column if missing
  try {
    await c.execute(`ALTER TABLE AppUser ADD COLUMN numericId INTEGER`);
  } catch {
    // Column already exists — ignore
  }  // Migrate: علامة زرع الإطارات في SiteConfig
  try {
    await c.execute(`ALTER TABLE SiteConfig ADD COLUMN framesSeeded INTEGER DEFAULT 0`);
  } catch {
    // Column already exists — ignore
  }

  // Migrate: علامة زرع كتالوج الزينة في SiteConfig
  try {
    await c.execute(`ALTER TABLE SiteConfig ADD COLUMN decorSeeded INTEGER DEFAULT 0`);
  } catch {
    // Column already exists — ignore
  }

  // PlayerFrame table - frame catalog
  await c.execute(`
    CREATE TABLE IF NOT EXISTS PlayerFrame (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameAr TEXT NOT NULL,
      description TEXT DEFAULT '',
      imageUrl TEXT DEFAULT '',
      rarity TEXT DEFAULT 'common',
      gradientFrom TEXT DEFAULT '#f59e0b',
      gradientTo TEXT DEFAULT '#eab308',
      borderColor TEXT DEFAULT 'rgba(245, 158, 11, 0.6)',
      glowColor TEXT DEFAULT 'rgba(245, 158, 11, 0.3)',
      pattern TEXT DEFAULT 'gradient',
      price INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      totalOwned INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // UserFrame table - user ownership of frames
  await c.execute(`
    CREATE TABLE IF NOT EXISTS UserFrame (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      subscriptionId TEXT,
      frameId TEXT NOT NULL,
      isEquipped INTEGER DEFAULT 0,
      obtainedFrom TEXT DEFAULT 'gift',
      obtainedNote TEXT DEFAULT '',
      obtainedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, frameId)
    )
  `);

  // ═══ كتالوج الزينة العام: معلقات جدارية / مواضيع (أغلفة) / بطاقات ═══
  // DecorItem: عنصر واحد قابل للشراء/المنح — النوع kind: ornament|theme|card
  await c.execute(`
    CREATE TABLE IF NOT EXISTS DecorItem (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      nameAr TEXT NOT NULL,
      imageUrl TEXT DEFAULT '',
      rarity TEXT DEFAULT 'common',
      price INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      totalOwned INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // UserDecor: ملكية مستخدم لعنصر زينة + المجهز الحالي لكل نوع
  await c.execute(`
    CREATE TABLE IF NOT EXISTS UserDecor (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      itemId TEXT NOT NULL,
      isEquipped INTEGER DEFAULT 0,
      obtainedFrom TEXT DEFAULT 'gift',
      obtainedNote TEXT DEFAULT '',
      obtainedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, itemId)
    )
  `);

  // FriendRequest table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS FriendRequest (
      id TEXT PRIMARY KEY, fromUserId TEXT NOT NULL, toUserId TEXT NOT NULL,
      status TEXT DEFAULT 'pending', createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now')))
  `);

  // VoiceRoom table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS VoiceRoom (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
      hostId TEXT NOT NULL, hostName TEXT DEFAULT '', maxParticipants INTEGER DEFAULT 10,
      isPrivate INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')))
  `);

  // VoiceRoomParticipant table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS VoiceRoomParticipant (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, userId TEXT NOT NULL,
      username TEXT DEFAULT '', displayName TEXT DEFAULT '', avatar TEXT DEFAULT '',
      isMuted INTEGER DEFAULT 0, joinedAt TEXT DEFAULT (datetime('now')))
  `);

  // Gift table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS Gift (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, nameAr TEXT NOT NULL,
      emoji TEXT DEFAULT '', price INTEGER DEFAULT 0, isActive INTEGER DEFAULT 1)
  `);

  // GiftHistory table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS GiftHistory (
      id TEXT PRIMARY KEY, giftId TEXT NOT NULL, fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL, roomId TEXT DEFAULT '', createdAt TEXT DEFAULT (datetime('now')))
  `);

  // Migration: add quantity column to GiftHistory if missing
  try {
    const ghCols = await c.execute('PRAGMA table_info(GiftHistory)');
    if (!ghCols.rows.some(r => r.name === 'quantity')) {
      await c.execute('ALTER TABLE GiftHistory ADD COLUMN quantity INTEGER DEFAULT 1');
    }
  } catch { /* ignore */ }

  // Migration: add bio/country columns to AppUser (profile dialog fields)
  try {
    const auCols3 = await c.execute('PRAGMA table_info(AppUser)');
    const auColNames3 = auCols3.rows.map(r => r.name);
    if (!auColNames3.includes('bio')) {
      await c.execute("ALTER TABLE AppUser ADD COLUMN bio TEXT DEFAULT ''");
    }
    if (!auColNames3.includes('country')) {
      await c.execute("ALTER TABLE AppUser ADD COLUMN country TEXT DEFAULT ''");
    }
    // Profile decoration columns (yalla-style cover/frame/ornament)
    if (!auColNames3.includes('cover')) {
      await c.execute("ALTER TABLE AppUser ADD COLUMN cover TEXT DEFAULT ''");
    }
    if (!auColNames3.includes('frame')) {
      await c.execute("ALTER TABLE AppUser ADD COLUMN frame TEXT DEFAULT ''");
    }
    if (!auColNames3.includes('ornament')) {
      await c.execute("ALTER TABLE AppUser ADD COLUMN ornament TEXT DEFAULT ''");
    }
    if (!auColNames3.includes('card')) {
      await c.execute("ALTER TABLE AppUser ADD COLUMN card TEXT DEFAULT ''");
    }
    // Profile edit form (yalla view_edit_user_info: الجنس + تاريخ الميلاد)
    if (!auColNames3.includes('gender')) {
      await c.execute("ALTER TABLE AppUser ADD COLUMN gender TEXT DEFAULT ''");
    }
    if (!auColNames3.includes('birthDate')) {
      await c.execute("ALTER TABLE AppUser ADD COLUMN birthDate TEXT DEFAULT ''");
    }
  } catch { /* ignore */ }

  // Migration: add level column to AppUser if missing
  try {
    const userCols = await c.execute('PRAGMA table_info(AppUser)');
    if (!userCols.rows.some(r => r.name === 'level')) {
      await c.execute('ALTER TABLE AppUser ADD COLUMN level INTEGER DEFAULT 1');
    }
  } catch { /* ignore */ }

  // Migration: add micSeatCount column to VoiceRoom if missing
  try {
    const vrCols = await c.execute('PRAGMA table_info(VoiceRoom)');
    if (!vrCols.rows.some(r => r.name === 'micSeatCount')) {
      await c.execute('ALTER TABLE VoiceRoom ADD COLUMN micSeatCount INTEGER DEFAULT 10');
    }
  } catch { /* ignore */ }

  // Migration: add new VoiceRoom columns
  try {
    const vrCols2 = await c.execute('PRAGMA table_info(VoiceRoom)');
    const vrColNames = vrCols2.rows.map(r => r.name);
    if (!vrColNames.includes('roomMode')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN roomMode TEXT DEFAULT 'public'");
    if (!vrColNames.includes('roomPassword')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN roomPassword TEXT DEFAULT ''");
    if (!vrColNames.includes('roomLevel')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN roomLevel INTEGER DEFAULT 1');
    if (!vrColNames.includes('micTheme')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN micTheme TEXT DEFAULT 'default'");
    if (!vrColNames.includes('bgmEnabled')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN bgmEnabled INTEGER DEFAULT 0');
    if (!vrColNames.includes('chatMuted')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN chatMuted INTEGER DEFAULT 0');
    if (!vrColNames.includes('announcement')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN announcement TEXT DEFAULT ''");
    if (!vrColNames.includes('giftSplit')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN giftSplit INTEGER DEFAULT 70');
    if (!vrColNames.includes('isAutoMode')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN isAutoMode INTEGER DEFAULT 1');
    if (!vrColNames.includes('lockedSeats')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN lockedSeats TEXT DEFAULT '[]'");
    if (!vrColNames.includes('roomImage')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN roomImage TEXT DEFAULT ''");
    if (!vrColNames.includes('roomAvatar')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN roomAvatar TEXT DEFAULT ''");
    if (!vrColNames.includes('guestMicEnabled')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN guestMicEnabled INTEGER DEFAULT 0');
    if (!vrColNames.includes('memberMicEnabled')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN memberMicEnabled INTEGER DEFAULT 1');
    if (!vrColNames.includes('joinPrice')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN joinPrice INTEGER DEFAULT 0');
  } catch { /* ignore */ }

  // Migration: add new VoiceRoomParticipant columns
  // Use direct ALTER TABLE — ignore "duplicate column" errors
  const vrpColumns = [
    { name: 'role', def: "TEXT DEFAULT 'visitor'" },
    { name: 'seatIndex', def: 'INTEGER DEFAULT -1' },
    { name: 'seatStatus', def: "TEXT DEFAULT 'open'" },
    { name: 'micFrozen', def: 'INTEGER DEFAULT 0' },
    { name: 'vipLevel', def: 'INTEGER DEFAULT 0' },
    { name: 'pendingRole', def: "TEXT DEFAULT ''" },
    { name: 'pendingMicInvite', def: 'INTEGER DEFAULT -1' },
    { name: 'lastSeen', def: "TEXT DEFAULT (datetime('now'))" },
  ];
  for (const col of vrpColumns) {
    try {
      await c.execute(`ALTER TABLE VoiceRoomParticipant ADD COLUMN ${col.name} ${col.def}`);
      console.log(`[ensureAdminTables] Added VRP column: ${col.name}`);
    } catch {
      // Column already exists — ignore
    }
  }

  // Migration: fix old rooms with micTheme='default' or legacy themes → new TUILiveKit layout IDs
  try {
    // Direct default migration
    await c.execute("UPDATE VoiceRoom SET micTheme = 'chat5', micSeatCount = 5 WHERE micTheme = 'default' AND micSeatCount IN (4, 5)");
    await c.execute("UPDATE VoiceRoom SET micTheme = 'chat10', micSeatCount = 10 WHERE micTheme = 'default' AND micSeatCount IN (6, 7, 8, 9, 10)");
    await c.execute("UPDATE VoiceRoom SET micTheme = 'chat15', micSeatCount = 15 WHERE micTheme = 'default' AND micSeatCount > 10");
    // Fallback: any remaining 'default' rooms → chat5 (most common)
    await c.execute("UPDATE VoiceRoom SET micTheme = 'chat5', micSeatCount = 5 WHERE micTheme = 'default' OR micTheme IS NULL");
    // Also fix rooms where micTheme is empty string
    await c.execute("UPDATE VoiceRoom SET micTheme = 'chat5', micSeatCount = 5 WHERE micTheme = ''");
    // Migrate legacy layout IDs to new ones
    await c.execute("UPDATE VoiceRoom SET micTheme = 'chat5', micSeatCount = 5 WHERE micTheme IN ('grid2x2', 'arc', 'radio', 'podcast')");
    await c.execute("UPDATE VoiceRoom SET micTheme = 'chat10', micSeatCount = 10 WHERE micTheme IN ('grid2x3', 'grid2x4', 'grid3x3', 'theater', 'broadcast5') AND micSeatCount >= 6");
  } catch { /* ignore */ }

  // Migration: add numericId to AppUser
  try {
    const auCols2 = await c.execute('PRAGMA table_info(AppUser)');
    const auColNames2 = auCols2.rows.map(r => r.name);
    if (!auColNames2.includes('numericId')) {
      await c.execute('ALTER TABLE AppUser ADD COLUMN numericId INTEGER UNIQUE');
    }
  } catch { /* ignore */ }

  // ReservedNumericId table — premium/special IDs for future sale
  await c.execute(`
    CREATE TABLE IF NOT EXISTS ReservedNumericId (
      id TEXT PRIMARY KEY,
      numericId INTEGER UNIQUE NOT NULL,
      status TEXT DEFAULT 'available',
      soldTo TEXT DEFAULT '',
      soldAt TEXT DEFAULT '',
      price INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')))
  `);

  // RoomBan table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomBan (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, userId TEXT NOT NULL,
      bannedBy TEXT NOT NULL, reason TEXT DEFAULT '', createdAt TEXT DEFAULT (datetime('now')))
  `);

  // RoomWaitlist table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomWaitlist (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, userId TEXT NOT NULL,
      username TEXT DEFAULT '', displayName TEXT DEFAULT '', avatar TEXT DEFAULT '',
      vipLevel INTEGER DEFAULT 0, requestedSeat INTEGER DEFAULT -1, createdAt TEXT DEFAULT (datetime('now')))
  `);

  // RoomActionLog table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomActionLog (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, actorId TEXT NOT NULL,
      actorName TEXT DEFAULT '', action TEXT NOT NULL, targetId TEXT DEFAULT '',
      targetName TEXT DEFAULT '', details TEXT DEFAULT '', createdAt TEXT DEFAULT (datetime('now')))
  `);

  // RoomTemplate - saves user's room preferences (one per user)
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomTemplate (
      id TEXT PRIMARY KEY, userId TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '', description TEXT DEFAULT '',
      micSeatCount INTEGER DEFAULT 10, roomMode TEXT DEFAULT 'public',
      roomPassword TEXT DEFAULT '', maxParticipants INTEGER DEFAULT 50,
      isAutoMode INTEGER DEFAULT 1, micTheme TEXT DEFAULT 'default',
      allowedRoles TEXT DEFAULT '["member","admin","coowner","owner"]',
      updatedAt TEXT DEFAULT (datetime('now')))
  `);

  // RoomKickTimer - temp kick with duration
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomKickTimer (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, userId TEXT NOT NULL,
      kickedBy TEXT NOT NULL, durationMinutes INTEGER DEFAULT 0,
      kickedAt TEXT DEFAULT (datetime('now')))
  `);

  // RoomBackground - catalog of room backgrounds
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomBackground (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameAr TEXT NOT NULL,
      description TEXT DEFAULT '',
      imageUrl TEXT NOT NULL,
      thumbnailUrl TEXT DEFAULT '',
      rarity TEXT DEFAULT 'common',
      price INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      isDefault INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      totalOwned INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')))
  `);

  // UserBackground - user ownership of room backgrounds
  await c.execute(`
    CREATE TABLE IF NOT EXISTS UserBackground (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      backgroundId TEXT NOT NULL,
      isEquipped INTEGER DEFAULT 0,
      obtainedFrom TEXT DEFAULT 'purchase',
      obtainedNote TEXT DEFAULT '',
      obtainedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, backgroundId))
  `);

  // RoomMember - persistent room membership (survives leave/rejoin)
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomMember (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      grantedBy TEXT NOT NULL DEFAULT '',
      grantedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(roomId, userId))
  `);

  // RoomBookmark - saving favorite rooms
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomBookmark (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      roomId TEXT NOT NULL,
      roomName TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, roomId))
  `);

  // UserReport - reporting users
  await c.execute(`
    CREATE TABLE IF NOT EXISTS UserReport (
      id TEXT PRIMARY KEY,
      reporterId TEXT NOT NULL,
      reportedUserId TEXT NOT NULL,
      reason TEXT DEFAULT '',
      category TEXT DEFAULT 'other',
      roomId TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now')))
  `);

  // UserBlock - blocking users
  await c.execute(`
    CREATE TABLE IF NOT EXISTS UserBlock (
      id TEXT PRIMARY KEY,
      blockerId TEXT NOT NULL,
      blockedId TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE(blockerId, blockedId))
  `);

  // UserAchievement - tracking unlocked achievements
  await c.execute(`
    CREATE TABLE IF NOT EXISTS UserAchievement (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      achievementKey TEXT NOT NULL,
      unlockedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, achievementKey))
  `);

  // DailyLoginReward - daily login gem rewards
  await c.execute(`
    CREATE TABLE IF NOT EXISTS DailyLoginReward (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      lastClaimDate TEXT DEFAULT '',
      streak INTEGER DEFAULT 0,
      totalGemsClaimed INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId))
  `);

  // RoomAnalytics - room stats and earnings
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomAnalytics (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      date TEXT DEFAULT '',
      totalGifts INTEGER DEFAULT 0,
      totalGiftValue INTEGER DEFAULT 0,
      totalParticipants INTEGER DEFAULT 0,
      peakParticipants INTEGER DEFAULT 0,
      durationMinutes INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE(roomId, date))
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
  {
    gameSlug: 'shifarat',
    gameName: 'الشيفرات',
    isEnabled: true,
    order: 8,
    playerRange: '4-20',
    description: 'لعبة الشيفرات الحصرية! فكّر الشفرات وتوصّل لكلمات فريقك قبل نفاد الوقت. فريقين مع تصنيفات متنوعة.',
    icon: '🎯',
    color: 'emerald',
    isComingSoon: false,
  },
];

// ── RoomBookmark functions ──
export async function addRoomBookmark(userId: string, roomId: string, roomName: string): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  try {
    await c.execute({ sql: 'INSERT INTO RoomBookmark (id, userId, roomId, roomName) VALUES (?, ?, ?, ?)', args: [crypto.randomUUID(), userId, roomId, roomName] });
  } catch { /* duplicate */ }
}

export async function removeRoomBookmark(userId: string, roomId: string): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'DELETE FROM RoomBookmark WHERE userId = ? AND roomId = ?', args: [userId, roomId] });
}

export async function getUserBookmarks(userId: string): Promise<Array<{ id: string; roomId: string; roomName: string; createdAt: string }>> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM RoomBookmark WHERE userId = ? ORDER BY createdAt DESC', args: [userId] });
  return result.rows.map(r => ({
    id: r.id as string, roomId: r.roomId as string, roomName: (r.roomName as string) || '',
    createdAt: r.createdAt as string,
  }));
}

export async function isRoomBookmarked(userId: string, roomId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT COUNT(*) as cnt FROM RoomBookmark WHERE userId = ? AND roomId = ?', args: [userId, roomId] });
  return Number(result.rows[0]?.cnt || 0) > 0;
}

// ── UserReport functions ──
export async function createUserReport(reporterId: string, reportedUserId: string, reason: string, category: string, roomId: string): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({
    sql: 'INSERT INTO UserReport (id, reporterId, reportedUserId, reason, category, roomId) VALUES (?, ?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), reporterId, reportedUserId, reason, category, roomId],
  });
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  try {
    await c.execute({ sql: 'INSERT INTO UserBlock (id, blockerId, blockedId) VALUES (?, ?, ?)', args: [crypto.randomUUID(), blockerId, blockedId] });
  } catch { /* duplicate */ }
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'DELETE FROM UserBlock WHERE blockerId = ? AND blockedId = ?', args: [blockerId, blockedId] });
}

export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT COUNT(*) as cnt FROM UserBlock WHERE blockerId = ? AND blockedId = ?', args: [blockerId, blockedId] });
  return Number(result.rows[0]?.cnt || 0) > 0;
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT blockedId FROM UserBlock WHERE blockerId = ?', args: [userId] });
  return result.rows.map(r => r.blockedId as string);
}

// ── Achievement definitions ──
export const ACHIEVEMENTS = [
  { key: 'first_room', nameAr: 'أول غرفة', nameEn: 'First Room', descriptionAr: 'أدخل أول غرفة صوتية', descriptionEn: 'Enter your first voice room', icon: '🎤', gemsReward: 10 },
  { key: 'first_speak', nameAr: 'تحدث لأول مرة', nameEn: 'First Words', descriptionAr: 'تحدث على المايك لأول مرة', descriptionEn: 'Speak on mic for the first time', icon: '🗣️', gemsReward: 20 },
  { key: 'rooms_10', nameAr: 'نشيط', nameEn: 'Active', descriptionAr: 'أدخل 10 غرف صوتية', descriptionEn: 'Enter 10 voice rooms', icon: '⭐', gemsReward: 50 },
  { key: 'rooms_50', nameAr: 'محترف', nameEn: 'Pro', descriptionAr: 'أدخل 50 غرفة صوتية', descriptionEn: 'Enter 50 voice rooms', icon: '🏆', gemsReward: 200 },
  { key: 'first_gift', nameAr: 'أول هدية', nameEn: 'First Gift', descriptionAr: 'أرسل أول هدية', descriptionEn: 'Send your first gift', icon: '🎁', gemsReward: 15 },
  { key: 'gifts_100', nameAr: 'كريم', nameEn: 'Generous', descriptionAr: 'أرسل 100 هدية', descriptionEn: 'Send 100 gifts', icon: '💎', gemsReward: 500 },
  { key: 'streak_3', nameAr: 'مثابر', nameEn: 'Consistent', descriptionAr: 'سجل دخول 3 أيام متتالية', descriptionEn: 'Login 3 days in a row', icon: '🔥', gemsReward: 30 },
  { key: 'streak_7', nameAr: 'مجتهد', nameEn: 'Dedicated', descriptionAr: 'سجل دخول 7 أيام متتالية', descriptionEn: 'Login 7 days in a row', icon: '🌟', gemsReward: 100 },
  { key: 'streak_30', nameAr: 'أسطوري', nameEn: 'Legendary', descriptionAr: 'سجل دخول 30 يوم متتالية', descriptionEn: 'Login 30 days in a row', icon: '👑', gemsReward: 1000 },
  { key: 'host_5', nameAr: 'مضيف', nameEn: 'Host', descriptionAr: 'أنشئ 5 غرف صوتية', descriptionEn: 'Create 5 voice rooms', icon: '🏠', gemsReward: 100 },
  { key: 'host_50', nameAr: 'نجمة البث', nameEn: 'Star Host', descriptionAr: 'أنشئ 50 غرفة صوتية', descriptionEn: 'Create 50 voice rooms', icon: '💫', gemsReward: 500 },
  { key: 'hours_10', nameAr: 'صديقي', nameEn: 'Social Butterfly', descriptionAr: 'قضِ 10 ساعات في الغرف', descriptionEn: 'Spend 10 hours in rooms', icon: '🦋', gemsReward: 200 },
] as const;

export type AchievementKey = typeof ACHIEVEMENTS[number]['key'];

export async function unlockAchievement(userId: string, achievementKey: string): Promise<{ isNew: boolean; achievement: typeof ACHIEVEMENTS[number] | undefined }> {
  const c = getClient();
  await ensureAdminTables();
  try {
    await c.execute({
      sql: 'INSERT INTO UserAchievement (id, userId, achievementKey) VALUES (?, ?, ?)',
      args: [crypto.randomUUID(), userId, achievementKey],
    });
    const achievement = ACHIEVEMENTS.find(a => a.key === achievementKey);
    return { isNew: true, achievement };
  } catch {
    return { isNew: false, achievement: undefined };
  }
}

export async function getUserAchievements(userId: string): Promise<string[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT achievementKey FROM UserAchievement WHERE userId = ?', args: [userId] });
  return result.rows.map(r => r.achievementKey as string);
}

// ── Daily Login Reward functions ──
export async function claimDailyReward(userId: string): Promise<{ gems: number; streak: number; isNewDay: boolean }> {
  const c = getClient();
  await ensureAdminTables();
  const today = new Date().toISOString().split('T')[0];
  
  const existing = await c.execute({ sql: 'SELECT * FROM DailyLoginReward WHERE userId = ?', args: [userId] });
  if (existing.rows.length === 0) {
    await c.execute({ sql: 'INSERT INTO DailyLoginReward (id, userId, lastClaimDate, streak, totalGemsClaimed) VALUES (?, ?, ?, 1, 10)', args: [crypto.randomUUID(), userId, today] });
    return { gems: 10, streak: 1, isNewDay: true };
  }
  
  const row = existing.rows[0];
  const lastDate = (row.lastClaimDate as string) || '';
  
  if (lastDate === today) {
    return { gems: 0, streak: Number(row.streak ?? 0), isNewDay: false };
  }
  
  // Calculate streak
  const last = new Date(lastDate);
  const now = new Date(today);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  
  let newStreak = diffDays === 1 ? Number(row.streak ?? 0) + 1 : 1;
  // Bonus gems for streaks
  const gemsReward = newStreak >= 30 ? 50 : newStreak >= 7 ? 30 : newStreak >= 3 ? 20 : 10;
  const totalGems = Number(row.totalGemsClaimed ?? 0) + gemsReward;
  
  await c.execute({
    sql: 'UPDATE DailyLoginReward SET lastClaimDate = ?, streak = ?, totalGemsClaimed = ? WHERE userId = ?',
    args: [today, newStreak, totalGems, userId],
  });
  
  return { gems: gemsReward, streak: newStreak, isNewDay: true };
}

export async function getDailyRewardStatus(userId: string): Promise<{ streak: number; lastClaimDate: string; totalGemsClaimed: number; canClaim: boolean }> {
  const c = getClient();
  await ensureAdminTables();
  const today = new Date().toISOString().split('T')[0];
  const result = await c.execute({ sql: 'SELECT * FROM DailyLoginReward WHERE userId = ?', args: [userId] });
  
  if (result.rows.length === 0) {
    return { streak: 0, lastClaimDate: '', totalGemsClaimed: 0, canClaim: true };
  }
  
  const row = result.rows[0];
  const lastDate = (row.lastClaimDate as string) || '';
  return {
    streak: Number(row.streak ?? 0),
    lastClaimDate: lastDate,
    totalGemsClaimed: Number(row.totalGemsClaimed ?? 0),
    canClaim: lastDate !== today,
  };
}

// ── Room Analytics functions ──
export async function updateRoomAnalytics(roomId: string, field: 'totalGifts' | 'totalGiftValue' | 'totalParticipants' | 'peakParticipants', value: number): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await c.execute({
      sql: `INSERT INTO RoomAnalytics (id, roomId, date, ${field}) VALUES (?, ?, ?, ?)
            ON CONFLICT(roomId, date) DO UPDATE SET ${field} = ${field} + ?`,
      args: [crypto.randomUUID(), roomId, today, value, value],
    });
  } catch {
    // If ON CONFLICT doesn't work, try upsert pattern
    const existing = await c.execute({ sql: 'SELECT id FROM RoomAnalytics WHERE roomId = ? AND date = ?', args: [roomId, today] });
    if (existing.rows.length === 0) {
      try {
        await c.execute({ sql: `INSERT INTO RoomAnalytics (id, roomId, date, ${field}) VALUES (?, ?, ?, ?)`, args: [crypto.randomUUID(), roomId, today, value] });
      } catch { /* ignore race */ }
    } else {
      await c.execute({ sql: `UPDATE RoomAnalytics SET ${field} = ${field} + ? WHERE roomId = ? AND date = ?`, args: [value, roomId, today] });
    }
  }
}

export async function getRoomEarnings(roomId: string, days: number = 30): Promise<{ totalGifts: number; totalValue: number; dailyBreakdown: Array<{ date: string; gifts: number; value: number }> }> {
  const c = getClient();
  await ensureAdminTables();
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const result = await c.execute({
    sql: 'SELECT date, totalGifts, totalGiftValue FROM RoomAnalytics WHERE roomId = ? AND date >= ? ORDER BY date DESC',
    args: [roomId, sinceDate],
  });
  
  let totalGifts = 0;
  let totalValue = 0;
  const dailyBreakdown = result.rows.map(r => {
    const gifts = Number(r.totalGifts ?? 0);
    const value = Number(r.totalGiftValue ?? 0);
    totalGifts += gifts;
    totalValue += value;
    return { date: r.date as string, gifts, value };
  });
  
  return { totalGifts, totalValue, dailyBreakdown };
}

export async function getTopGifters(roomId: string, limit: number = 10): Promise<Array<{ userId: string; displayName: string; avatar: string; totalGifts: number; totalValue: number }>> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: `SELECT gh.fromUserId as userId, MAX(vrp.displayName) as displayName, MAX(vrp.avatar) as avatar,
          COUNT(*) as totalGifts, SUM(gh.quantity) as totalValue
          FROM GiftHistory gh
          LEFT JOIN VoiceRoomParticipant vrp ON vrp.userId = gh.fromUserId AND vrp.roomId = gh.roomId
          WHERE gh.roomId = ?
          GROUP BY gh.fromUserId
          ORDER BY totalValue DESC
          LIMIT ?`,
    args: [roomId, String(limit)],
  });
  
  return result.rows.map(r => ({
    userId: r.userId as string,
    displayName: (r.displayName as string) || 'مجهول',
    avatar: (r.avatar as string) || '',
    totalGifts: Number(r.totalGifts ?? 0),
    totalValue: Number(r.totalValue ?? 0),
  }));
}

// ── Word Filter ──
export const BANNED_WORDS = [
  // Common Arabic profanity patterns
  'كس', 'زب', 'قحب', 'شرم', 'طيز', 'لخ', 'خرا', 'عير', 'كسم', 'متناك',
  'شرموطة', 'قحبة', 'كسها', 'زبي', 'نيك', 'نيج', 'لقط', 'لعنة',
  // Add more as needed
];

export function filterMessage(text: string): { filtered: string; hasBannedWords: boolean } {
  let filtered = text;
  let hasBannedWords = false;
  
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(word, 'gi');
    if (regex.test(filtered)) {
      hasBannedWords = true;
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    }
  }
  
  return { filtered, hasBannedWords };
}

export async function seedGameConfigs(): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute('SELECT COUNT(*) as count FROM GameConfig');
  const count = Number(result.rows[0]?.count ?? 0);

  if (count === 0) {
    // First run: seed all default games
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
  } else {
    // Subsequent runs: insert any missing games from defaultGames
    const existing = await c.execute('SELECT gameSlug FROM GameConfig');
    const existingSlugs = new Set(existing.rows.map(r => String(r.gameSlug)));
    for (const game of defaultGames) {
      if (!existingSlugs.has(game.gameSlug)) {
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

function toAppUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    username: (row.username as string) ?? '',
    email: (row.email as string) ?? '',
    passwordHash: (row.passwordHash as string) ?? '',
    displayName: (row.displayName as string) ?? '',
    phone: (row.phone as string) ?? '',
    avatar: (row.avatar as string) ?? '',
    bio: (row.bio as string) ?? '',
    country: (row.country as string) ?? '',
    cover: (row.cover as string) ?? '',
    frame: (row.frame as string) ?? '',
    ornament: (row.ornament as string) ?? '',
    card: (row.card as string) ?? '',
    role: ((row.role as string) ?? 'user') as AppUser['role'],
    isActive: !!(row.isActive && row.isActive !== 0),
    subscriptionId: (row.subscriptionId as string) ?? null,
    lastLoginAt: (row.lastLoginAt as string) ?? null,
    numericId: row.numericId != null ? Number(row.numericId) : null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

// ─── Frame row mappers ────────────────────────────────────────────────

function toPlayerFrame(row: Record<string, unknown>): PlayerFrame {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    nameAr: (row.nameAr as string) ?? '',
    description: (row.description as string) ?? '',
    imageUrl: (row.imageUrl as string) ?? '',
    rarity: (row.rarity as PlayerFrame['rarity']) ?? 'common',
    gradientFrom: (row.gradientFrom as string) ?? '#f59e0b',
    gradientTo: (row.gradientTo as string) ?? '#eab308',
    borderColor: (row.borderColor as string) ?? 'rgba(245, 158, 11, 0.6)',
    glowColor: (row.glowColor as string) ?? 'rgba(245, 158, 11, 0.3)',
    pattern: (row.pattern as PlayerFrame['pattern']) ?? 'gradient',
    price: Number(row.price ?? 0),
    isFree: !!(row.isFree && row.isFree !== 0),
    isActive: !!(row.isActive && row.isActive !== 0),
    sortOrder: Number(row.sortOrder ?? 0),
    totalOwned: Number(row.totalOwned ?? 0),
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

function toUserFrame(row: Record<string, unknown>): UserFrame {
  return {
    id: row.id as string,
    userId: (row.userId as string) ?? '',
    subscriptionId: (row.subscriptionId as string) ?? null,
    frameId: (row.frameId as string) ?? '',
    isEquipped: !!(row.isEquipped && row.isEquipped !== 0),
    obtainedFrom: (row.obtainedFrom as UserFrame['obtainedFrom']) ?? 'gift',
    obtainedNote: (row.obtainedNote as string) ?? '',
    obtainedAt: (row.obtainedAt as string) ?? new Date().toISOString(),
  };
}

// ─── Numeric ID system ──────────────────────────────────────────────

/** Generate all "special" 6-digit numbers (repeating, sequential, palindromes, etc.) */
function generateReservedNumericIds(): number[] {
  const reserved = new Set<number>();

  for (let d = 0; d <= 9; d++) {
    // All same digit: 111111, 222222, ..., 999999
    reserved.add(d * 111111);
    // 5 same + 1 different at start/end: 111112, 211111, etc.
    for (let diff = 0; diff <= 9; diff++) {
      if (diff !== d) {
        reserved.add(d * 100000 + d * 10000 + d * 1000 + d * 100 + d * 10 + diff);
        reserved.add(diff * 100000 + d * 10000 + d * 1000 + d * 100 + d * 10 + d);
      }
    }
  }

  // Sequential ascending: 123456, 234567, ..., 456789
  for (let start = 1; start <= 4; start++) {
    let num = 0;
    for (let i = 0; i < 6; i++) num = num * 10 + (start + i);
    reserved.add(num);
  }

  // Sequential descending: 654321, 543210
  reserved.add(654321);
  reserved.add(543210);

  // Palindromes (6 digits): abccba
  for (let a = 1; a <= 9; a++) {
    for (let b = 0; b <= 9; b++) {
      for (let c = 0; c <= 9; c++) {
        reserved.add(a * 100000 + b * 10000 + c * 1000 + c * 100 + b * 10 + a);
      }
    }
  }

  // Double triple: aaabbb patterns (e.g., 111222, 333444)
  for (let a = 1; a <= 9; a++) {
    for (let b = 0; b <= 9; b++) {
      reserved.add(a * 111000 + b * 111);
    }
  }

  // Round numbers: 100000, 200000, ..., 900000
  for (let m = 1; m <= 9; m++) reserved.add(m * 100000);

  reserved.delete(0);
  const result = Array.from(reserved).filter(n => n >= 100000 && n <= 999999);
  return [...new Set(result)].sort((a, b) => a - b);
}

/** Seed reserved numeric IDs into the database */
export async function seedReservedNumericIds(): Promise<number> {
  const c = getClient();
  await ensureAdminTables();

  const count = await c.execute({ sql: 'SELECT COUNT(*) as cnt FROM ReservedNumericId', args: [] });
  if (Number(count.rows[0]?.cnt || 0) > 0) return Number(count.rows[0]?.cnt);

  const ids = generateReservedNumericIds();
  let inserted = 0;
  for (const numId of ids) {
    try {
      await c.execute({
        sql: 'INSERT INTO ReservedNumericId (id, numericId, status, price) VALUES (?, ?, ?, ?)',
        args: [crypto.randomUUID(), numId, 'available', 0],
      });
      inserted++;
    } catch { /* duplicate skip */ }
  }
  console.log(`[seedReservedNumericIds] Seeded ${inserted} reserved IDs`);
  return inserted;
}

/** Assign a sequential 6-digit numeric ID to a new user, skipping all reserved numbers.
 *  - Oldest users get the smallest IDs (100000+)
 *  - Reserved/special numbers are permanently skipped
 *  - Race-condition safe: double-checks each candidate against DB
 */
export async function assignNumericId(): Promise<number> {
  const c = getClient();
  await ensureAdminTables();
  await seedReservedNumericIds();

  // Load all reserved numeric IDs into a Set for O(1) lookup
  const reservedResult = await c.execute({
    sql: 'SELECT numericId FROM ReservedNumericId',
    args: [],
  });
  const reservedIds = new Set(reservedResult.rows.map(r => Number(r.numericId)));

  // Find the highest currently assigned numericId in AppUser
  const maxResult = await c.execute({
    sql: 'SELECT MAX(numericId) as maxId FROM AppUser WHERE numericId IS NOT NULL',
    args: [],
  });
  let nextId = Number(maxResult.rows[0]?.maxId) || 0;
  if (nextId < 100000) nextId = 100000 - 1; // Start from 100000

  // Walk forward sequentially, skipping reserved numbers
  for (let i = 0; i < 100000; i++) {
    nextId++;
    if (nextId > 999999) break; // Stay strictly 6 digits
    if (reservedIds.has(nextId)) continue; // Skip reserved/special numbers

    // Double-check not already assigned (race condition safety)
    const taken = await c.execute({
      sql: 'SELECT id FROM AppUser WHERE numericId = ?',
      args: [nextId],
    });
    if (taken.rows.length > 0) continue;

    return nextId;
  }

  throw new Error('لا توجد أرقام متاحة في نطاق 6 أرقام');
}

/** Migration: assign sequential numeric IDs to all existing users missing one.
 *  Oldest users (by createdAt) get the smallest numbers.
 */
export async function migrateAssignNumericIds(): Promise<{ updated: number; total: number }> {
  const c = getClient();
  await ensureAdminTables();
  await seedReservedNumericIds();

  // Sort by creation date so oldest users get smallest IDs
  const users = await c.execute({
    sql: 'SELECT id FROM AppUser WHERE numericId IS NULL AND isActive = 1 ORDER BY createdAt ASC',
    args: [],
  });
  let updated = 0;

  for (const row of users.rows) {
    const userId = row.id as string;
    const numericId = await assignNumericId();
    try {
      await c.execute({
        sql: 'UPDATE AppUser SET numericId = ? WHERE id = ?',
        args: [numericId, userId],
      });
      updated++;
    } catch {
      // Skip if collision (very unlikely with sequential)
    }
  }

  return { updated, total: users.rows.length };
}

/** Get all reserved numeric IDs (for admin panel) */
export async function getReservedNumericIds(): Promise<Array<{ numericId: number; status: string; soldTo: string; soldAt: string; price: number }>> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: 'SELECT numericId, status, soldTo, soldAt, price FROM ReservedNumericId ORDER BY numericId ASC',
    args: [],
  });
  return result.rows.map(r => ({
    numericId: Number(r.numericId),
    status: (r.status as string) || 'available',
    soldTo: (r.soldTo as string) || '',
    soldAt: (r.soldAt as string) || '',
    price: Number(r.price) || 0,
  }));
}

/** Assign a reserved numeric ID to a user (admin action) */
export async function assignReservedId(numericId: number, userId: string, price: number = 0): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const check = await c.execute({ sql: 'SELECT status FROM ReservedNumericId WHERE numericId = ?', args: [numericId] });
  if (check.rows.length === 0 || check.rows[0].status !== 'available') return false;

  await c.execute({
    sql: "UPDATE ReservedNumericId SET status = 'sold', soldTo = ?, soldAt = datetime('now'), price = ? WHERE numericId = ?",
    args: [userId, price, numericId],
  });
  await c.execute({ sql: 'UPDATE AppUser SET numericId = ? WHERE id = ?', args: [numericId, userId] });
  return true;
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

// ─── PlayerGameStats operations (per-user game counters) ─────────────

export async function getPlayerGameStats(userId: string): Promise<Record<string, { played: number; won: number }>> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: 'SELECT gameSlug, played, won FROM PlayerGameStats WHERE userId = ?',
    args: [userId],
  });
  const out: Record<string, { played: number; won: number }> = {};
  for (const r of result.rows) {
    out[String(r.gameSlug)] = { played: Number(r.played ?? 0), won: Number(r.won ?? 0) };
  }
  return out;
}

export async function incrementPlayerGameStats(userId: string, gameSlug: string, played = 0, won = 0): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  try {
    await c.execute({
      sql: `INSERT INTO PlayerGameStats (id, userId, gameSlug, played, won) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(userId, gameSlug) DO UPDATE SET
              played = played + ?, won = won + ?, updatedAt = datetime('now')`,
      args: [crypto.randomUUID(), userId, gameSlug, played, won, played, won],
    });
  } catch {
    // Fallback for older libsql without ON CONFLICT DO UPDATE on this shape
    const existing = await c.execute({
      sql: 'SELECT id FROM PlayerGameStats WHERE userId = ? AND gameSlug = ?',
      args: [userId, gameSlug],
    });
    if (existing.rows.length > 0) {
      await c.execute({
        sql: 'UPDATE PlayerGameStats SET played = played + ?, won = won + ?, updatedAt = datetime(\'now\') WHERE userId = ? AND gameSlug = ?',
        args: [played, won, userId, gameSlug],
      });
    } else {
      await c.execute({
        sql: 'INSERT INTO PlayerGameStats (id, userId, gameSlug, played, won) VALUES (?, ?, ?, ?, ?)',
        args: [crypto.randomUUID(), userId, gameSlug, played, won],
      });
    }
  }
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

// ─── AppUser operations ───────────────────────────────────────────────

export { hashPassword, verifyPassword } from '@/lib/admin-auth';

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
}): Promise<Omit<AppUser, 'passwordHash'>> {
  const { hashPassword } = await import('@/lib/admin-auth');
  await ensureAdminTables();
  const c = getClient();

  // Check uniqueness
  const existingEmail = await c.execute({
    sql: 'SELECT id FROM AppUser WHERE email = ?',
    args: [data.email],
  });
  if (existingEmail.rows.length > 0) {
    throw new Error('البريد الإلكتروني مستخدم بالفعل');
  }

  const existingUsername = await c.execute({
    sql: 'SELECT id FROM AppUser WHERE username = ?',
    args: [data.username],
  });
  if (existingUsername.rows.length > 0) {
    throw new Error('اسم المستخدم مستخدم بالفعل');
  }

  const id = crypto.randomUUID();
  const numericId = await assignNumericId();
  const passwordHash = hashPassword(data.password);

  await c.execute({
    sql: `INSERT INTO AppUser (id, username, email, passwordHash, displayName, phone, numericId)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.username,
      data.email,
      passwordHash,
      data.displayName || '',
      data.phone || '',
      numericId,
    ],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE id = ?',
    args: [id],
  });

  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function getUserById(id: string): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE id = ? AND isActive = 1',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function getUserByEmail(email: string): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE email = ? AND isActive = 1',
    args: [email],
  });

  if (result.rows.length === 0) return null;
  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function getUserByUsername(username: string): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE username = ? AND isActive = 1',
    args: [username],
  });

  if (result.rows.length === 0) return null;
  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function updateUser(
  id: string,
  data: Partial<Omit<AppUser, 'id' | 'passwordHash' | 'createdAt'>>
): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getUserById(id);

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'isActive') {
      setClauses.push(`isActive = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'role') {
      setClauses.push(`role = ?`);
      values.push(val);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(id);

  await c.execute({
    sql: `UPDATE AppUser SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });

  return getUserById(id);
}

export async function deleteUser(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'UPDATE AppUser SET isActive = 0, updatedAt = datetime(\'now\') WHERE id = ?',
    args: [id],
  });
}

export async function getAllUsers(): Promise<Omit<AppUser, 'passwordHash'>[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser ORDER BY createdAt DESC',
    args: [],
  });

  return result.rows.map((r) => {
    const user = toAppUser(r as Record<string, unknown>);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  });
}

// ─── PlayerFrame operations ──────────────────────────────────────────

export async function getAllFrames(): Promise<PlayerFrame[]> {
  await ensureAdminTables();
  await seedDefaultFrames();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM PlayerFrame ORDER BY sortOrder ASC, createdAt ASC',
    args: [],
  });
  return result.rows.map((r) => toPlayerFrame(r as Record<string, unknown>));
}

export async function getActiveFrames(): Promise<PlayerFrame[]> {
  await ensureAdminTables();
  await seedDefaultFrames();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM PlayerFrame WHERE isActive = 1 ORDER BY sortOrder ASC',
    args: [],
  });
  return result.rows.map((r) => toPlayerFrame(r as Record<string, unknown>));
}

export async function getFrameById(id: string): Promise<PlayerFrame | null> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM PlayerFrame WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return toPlayerFrame(result.rows[0] as Record<string, unknown>);
}

export async function createFrame(data: {
  name: string;
  nameAr: string;
  description?: string;
  imageUrl?: string;
  rarity?: PlayerFrame['rarity'];
  gradientFrom?: string;
  gradientTo?: string;
  borderColor?: string;
  glowColor?: string;
  pattern?: PlayerFrame['pattern'];
  price?: number;
  isFree?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlayerFrame> {
  await ensureAdminTables();
  const c = getClient();
  const id = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO PlayerFrame (id, name, nameAr, description, imageUrl, rarity, gradientFrom, gradientTo, borderColor, glowColor, pattern, price, isFree, isActive, sortOrder)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, data.name, data.nameAr, data.description ?? '', data.imageUrl ?? '',
      data.rarity ?? 'common', data.gradientFrom ?? '#f59e0b', data.gradientTo ?? '#eab308',
      data.borderColor ?? 'rgba(245, 158, 11, 0.6)', data.glowColor ?? 'rgba(245, 158, 11, 0.3)',
      data.pattern ?? 'gradient', data.price ?? 0, data.isFree ? 1 : 0,
      data.isActive !== false ? 1 : 0, data.sortOrder ?? 0,
    ],
  });
  const result = await c.execute({ sql: 'SELECT * FROM PlayerFrame WHERE id = ?', args: [id] });
  return toPlayerFrame(result.rows[0] as Record<string, unknown>);
}

export async function updateFrame(id: string, data: Partial<PlayerFrame>): Promise<PlayerFrame | null> {
  await ensureAdminTables();
  const c = getClient();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getFrameById(id);

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'id' || key === 'createdAt' || key === 'totalOwned') continue;
    if (key === 'isActive' || key === 'isFree' || key === 'isEquipped') {
      setClauses.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(id);
  await c.execute({
    sql: `UPDATE PlayerFrame SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });
  return getFrameById(id);
}

export async function deleteFrame(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM UserFrame WHERE frameId = ?', args: [id] });
  await c.execute({ sql: 'DELETE FROM PlayerFrame WHERE id = ?', args: [id] });
}

// ─── UserFrame operations ────────────────────────────────────────────

export async function getUserFrames(userId: string): Promise<(UserFrame & { frame: PlayerFrame })[]> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: `SELECT uf.*, pf.name, pf.nameAr, pf.description as frameDesc, pf.imageUrl, pf.rarity,
          pf.gradientFrom, pf.gradientTo, pf.borderColor, pf.glowColor, pf.pattern, pf.price,
          pf.isFree, pf.isActive as frameActive, pf.sortOrder as frameSortOrder
          FROM UserFrame uf
          JOIN PlayerFrame pf ON uf.frameId = pf.id
          WHERE uf.userId = ?
          ORDER BY uf.isEquipped DESC, pf.sortOrder ASC`,
    args: [userId],
  });
  return result.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...toUserFrame(row),
      frame: {
        id: row.frameId as string,
        name: row.name as string,
        nameAr: row.nameAr as string,
        description: row.frameDesc as string,
        imageUrl: row.imageUrl as string,
        rarity: row.rarity as PlayerFrame['rarity'],
        gradientFrom: row.gradientFrom as string,
        gradientTo: row.gradientTo as string,
        borderColor: row.borderColor as string,
        glowColor: row.glowColor as string,
        pattern: row.pattern as PlayerFrame['pattern'],
        price: Number(row.price ?? 0),
        isFree: !!(row.isFree && row.isFree !== 0),
        isActive: !!(row.frameActive && row.frameActive !== 0),
        sortOrder: Number(row.frameSortOrder ?? 0),
        totalOwned: 0,
        createdAt: '',
        updatedAt: '',
      },
    };
  });
}

export async function grantFrameToUser(data: {
  userId: string;
  subscriptionId?: string;
  frameId: string;
  obtainedFrom?: UserFrame['obtainedFrom'];
  obtainedNote?: string;
}): Promise<UserFrame | null> {
  await ensureAdminTables();
  const c = getClient();

  const existing = await c.execute({
    sql: 'SELECT id FROM UserFrame WHERE userId = ? AND frameId = ?',
    args: [data.userId, data.frameId],
  });
  if (existing.rows.length > 0) return null;

  const id = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO UserFrame (id, userId, subscriptionId, frameId, isEquipped, obtainedFrom, obtainedNote)
          VALUES (?, ?, ?, ?, 0, ?, ?)`,
    args: [id, data.userId, data.subscriptionId ?? null, data.frameId, data.obtainedFrom ?? 'gift', data.obtainedNote ?? ''],
  });

  await c.execute({
    sql: 'UPDATE PlayerFrame SET totalOwned = totalOwned + 1 WHERE id = ?',
    args: [data.frameId],
  });

  const result = await c.execute({ sql: 'SELECT * FROM UserFrame WHERE id = ?', args: [id] });
  if (result.rows.length === 0) return null;
  return toUserFrame(result.rows[0] as Record<string, unknown>);
}

export async function equipFrame(userId: string, frameId: string | null): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  if (frameId) {
    // حماية الملكية: لا يمكن تجهيز إطار لا يملكه المستخدم
    const owned = await c.execute({
      sql: 'SELECT id FROM UserFrame WHERE userId = ? AND frameId = ? LIMIT 1',
      args: [userId, frameId],
    });
    if (owned.rows.length === 0) {
      throw new Error('غير مصرح: هذا الإطار غير مملوك لك');
    }
  }
  await c.execute({ sql: 'UPDATE UserFrame SET isEquipped = 0 WHERE userId = ?', args: [userId] });
  if (frameId) {
    await c.execute({ sql: 'UPDATE UserFrame SET isEquipped = 1 WHERE userId = ? AND frameId = ?', args: [userId, frameId] });
  }
  // عمود frame في AppUser هو مصدر العرض في الهيدر والبروفايل — نزامنه مع التجهيز
  await c.execute({
    sql: "UPDATE AppUser SET frame = ?, updatedAt = datetime('now') WHERE id = ?",
    args: [frameId ?? '', userId],
  });
}

export async function removeFrameFromUser(userId: string, frameId: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM UserFrame WHERE userId = ? AND frameId = ?', args: [userId, frameId] });
  await c.execute({ sql: 'UPDATE PlayerFrame SET totalOwned = MAX(0, totalOwned - 1) WHERE id = ?', args: [frameId] });
}

export async function getEquippedFrame(userId: string): Promise<(UserFrame & { frame: PlayerFrame }) | null> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: `SELECT uf.*, pf.name, pf.nameAr, pf.description as frameDesc, pf.imageUrl, pf.rarity,
          pf.gradientFrom, pf.gradientTo, pf.borderColor, pf.glowColor, pf.pattern, pf.price,
          pf.isFree, pf.isActive as frameActive, pf.sortOrder as frameSortOrder
          FROM UserFrame uf
          JOIN PlayerFrame pf ON uf.frameId = pf.id
          WHERE uf.userId = ? AND uf.isEquipped = 1
          LIMIT 1`,
    args: [userId],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as Record<string, unknown>;
  return {
    ...toUserFrame(row),
    frame: {
      id: row.frameId as string, name: row.name as string, nameAr: row.nameAr as string,
      description: row.frameDesc as string, imageUrl: row.imageUrl as string,
      rarity: row.rarity as PlayerFrame['rarity'], gradientFrom: row.gradientFrom as string,
      gradientTo: row.gradientTo as string, borderColor: row.borderColor as string,
      glowColor: row.glowColor as string, pattern: row.pattern as PlayerFrame['pattern'],
      price: Number(row.price ?? 0), isFree: !!(row.isFree && row.isFree !== 0),
      isActive: !!(row.frameActive && row.frameActive !== 0),
      sortOrder: Number(row.frameSortOrder ?? 0), totalOwned: 0, createdAt: '', updatedAt: '',
    },
  };
}

// ─── Seed default frames ─────────────────────────────────────────────

// ─── كتالوج الإطارات (صور PNG حقيقية محلية في public/yalla-frames — مستقل تماماً عن أي طرف خارجي) ─────

const YALLA_FRAMES: Array<{ id: string; nameAr: string; rarity: PlayerFrame['rarity']; price: number; isFree: boolean }> = [
  // دوري الأسطورة (2000xx) — أسطورية
  { id: '200001', nameAr: 'نجوم الأسطورة 7', rarity: 'legendary', price: 1000, isFree: false },
  { id: '200002', nameAr: 'نجوم الأسطورة 37', rarity: 'legendary', price: 1000, isFree: false },
  { id: '200003', nameAr: 'نجوم الأسطورة 77', rarity: 'legendary', price: 1000, isFree: false },
  { id: '200004', nameAr: 'نجوم الأسطورة 177', rarity: 'legendary', price: 1000, isFree: false },
  { id: '200005', nameAr: 'نجوم الأسطورة 277', rarity: 'legendary', price: 1000, isFree: false },
  { id: '200006', nameAr: 'نجوم الأسطورة 377', rarity: 'legendary', price: 1000, isFree: false },
  { id: '200007', nameAr: 'نجوم الأسطورة 477', rarity: 'legendary', price: 1000, isFree: false },
  { id: '200008', nameAr: 'نجوم الأسطورة 577', rarity: 'legendary', price: 1000, isFree: false },
  // رويال (121023..121027) — أسطورية
  { id: '121023', nameAr: 'حصري رويال 1', rarity: 'legendary', price: 1000, isFree: false },
  { id: '121024', nameAr: 'حصري رويال 2', rarity: 'legendary', price: 1000, isFree: false },
  { id: '121025', nameAr: 'حصري رويال 3', rarity: 'legendary', price: 1000, isFree: false },
  { id: '121026', nameAr: 'حصري رويال 4', rarity: 'legendary', price: 1000, isFree: false },
  { id: '121027', nameAr: 'حصري رويال 5', rarity: 'legendary', price: 1000, isFree: false },
  // VIP — ملحمية
  { id: '121017', nameAr: 'VIP — الفارس', rarity: 'epic', price: 600, isFree: false },
  { id: '121018', nameAr: 'VIP — اللواء', rarity: 'epic', price: 600, isFree: false },
  // الترتيب العالمي (1100xx) — ملحمية
  { id: '110001', nameAr: 'البطل في الترتيب العالمي', rarity: 'epic', price: 500, isFree: false },
  { id: '110002', nameAr: 'الثاني في الترتيب العالمي', rarity: 'epic', price: 500, isFree: false },
  { id: '110003', nameAr: 'الثالث في الترتيب العالمي', rarity: 'epic', price: 500, isFree: false },
  { id: '110004', nameAr: 'أعلى 100 عالمياً', rarity: 'epic', price: 500, isFree: false },
  { id: '110005', nameAr: 'أعلى 500 عالمياً', rarity: 'epic', price: 500, isFree: false },
  { id: '110006', nameAr: 'أعلى 1000 عالمياً', rarity: 'epic', price: 500, isFree: false },
  // الشراء (1200xx) — نادرة
  { id: '120001', nameAr: 'إطار مميز أ', rarity: 'rare', price: 300, isFree: false },
  { id: '120002', nameAr: 'إطار مميز ب', rarity: 'rare', price: 300, isFree: false },
  { id: '120003', nameAr: 'إطار أسبوعي أ', rarity: 'rare', price: 300, isFree: false },
  { id: '120004', nameAr: 'إطار أسبوعي ب', rarity: 'rare', price: 300, isFree: false },
  { id: '120005', nameAr: 'إطار أسبوعي ج', rarity: 'rare', price: 300, isFree: false },
  { id: '120006', nameAr: 'إطار أسبوعي د', rarity: 'rare', price: 300, isFree: false },
  { id: '120008', nameAr: 'إطار أسبوعي هـ', rarity: 'rare', price: 300, isFree: false },
  { id: '120009', nameAr: 'إطار أسبوعي و', rarity: 'rare', price: 300, isFree: false },
  { id: '121001', nameAr: 'إطار المتجر', rarity: 'rare', price: 300, isFree: false },
  { id: '121003', nameAr: 'إطار أسبوعي ز', rarity: 'rare', price: 300, isFree: false },
  { id: '121039', nameAr: 'إطار أسبوعي ح', rarity: 'rare', price: 300, isFree: false },
  // هدايا (1210xx) — نادرة
  { id: '121013', nameAr: 'هدية فريق الأكروبات', rarity: 'rare', price: 250, isFree: false },
  { id: '121014', nameAr: 'هدية الجزيرة', rarity: 'rare', price: 250, isFree: false },
  { id: '121015', nameAr: 'هدية تساقط الشهب', rarity: 'rare', price: 250, isFree: false },
  { id: '121016', nameAr: 'هدية القلعة', rarity: 'rare', price: 250, isFree: false },
  { id: '121031', nameAr: 'هدية عجلة الملاهي', rarity: 'rare', price: 250, isFree: false },
  // نشاطات (1210xx) — عادية
  { id: '121019', nameAr: 'نشاط عيد الفطر 2021', rarity: 'common', price: 100, isFree: false },
  { id: '121020', nameAr: 'نشاط عيد الأضحى 2021', rarity: 'common', price: 100, isFree: false },
  { id: '121021', nameAr: 'نشاط أضئ البرج أ', rarity: 'common', price: 100, isFree: false },
  { id: '121022', nameAr: 'نشاط عيد الفطر 2022', rarity: 'common', price: 100, isFree: false },
  { id: '121032', nameAr: 'نشاط أضئ البرج ب', rarity: 'common', price: 100, isFree: false },
  { id: '121033', nameAr: 'نشاط من هو الفائز', rarity: 'common', price: 100, isFree: false },
  { id: '121035', nameAr: 'محصول النشاط أ', rarity: 'common', price: 100, isFree: false },
  { id: '121036', nameAr: 'نشاط عيد الفطر 2023', rarity: 'common', price: 100, isFree: false },
  { id: '121041', nameAr: 'نشاط دعوة الأصدقاء', rarity: 'common', price: 100, isFree: false },
  { id: '121044', nameAr: 'نشاط وقت القهوة', rarity: 'common', price: 100, isFree: false },
  { id: '121046', nameAr: 'محصول النشاط ب', rarity: 'common', price: 100, isFree: false },
  { id: '132309', nameAr: 'دخول سبتمبر', rarity: 'common', price: 100, isFree: false },
  { id: '132311', nameAr: 'دخول نوفمبر', rarity: 'common', price: 100, isFree: false },
  { id: '132312', nameAr: 'دخول ديسمبر', rarity: 'common', price: 100, isFree: false },
  { id: '132323', nameAr: 'إطارات 2023 الشهرية', rarity: 'common', price: 100, isFree: false },
  // مجانية (تبدأ بها — بلا سعر)
  { id: '121037', nameAr: 'هدية اللاعبين الجدد', rarity: 'common', price: 0, isFree: true },
  { id: '121038', nameAr: 'أعد بدء الرحلة', rarity: 'common', price: 0, isFree: true },
  { id: '121028', nameAr: 'مكافأة ربط YallaChat', rarity: 'common', price: 0, isFree: true },
  { id: '121029', nameAr: 'مكافأة ربط الهاتف', rarity: 'common', price: 0, isFree: true },
  { id: '121042', nameAr: 'رخصة الغرفة الممتازة', rarity: 'common', price: 0, isFree: true },
  { id: '121043', nameAr: 'رخصة الغرفة المجانية', rarity: 'common', price: 0, isFree: true },
  { id: '121045', nameAr: 'محدود عيد الميلاد', rarity: 'common', price: 0, isFree: true },
  { id: 'silver_moon', nameAr: 'فضة القمر', rarity: 'common', price: 0, isFree: true },
  { id: 'golden_classic', nameAr: 'ذهبي كلاسيكي', rarity: 'common', price: 0, isFree: true },
];

// زرع كتالوج الإطارات: يزيل القديم (بذور تدرجات CSS/UUID) ويزرع الكتالوج كاملاً بمعرفات مستقرة
// SEED_VERSION: ارفعه عند أي تغيير في الكتالوج لإعادة الزرع تلقائياً
const YALLA_FRAMES_SEED_VERSION = 2;

async function seedYallaFrames(): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute('SELECT COUNT(*) as count FROM PlayerFrame');
  const count = Number(result.rows[0]?.count ?? 0);
  // علامة الزرع: تمنع إعادة الزرع في كل استدعاء (idempotent عبر قاعدة البيانات نفسها)
  const marker = await c.execute({
    sql: "SELECT framesSeeded FROM SiteConfig WHERE id = 'main' LIMIT 1",
    args: [],
  });
  const mrow = marker.rows[0] as Record<string, unknown> | undefined;
  if (count > 0 && Number(mrow?.framesSeeded ?? 0) >= YALLA_FRAMES_SEED_VERSION) return; // مزروعة فعلاً
  const markupNames = YALLA_FRAMES.map((f) => f.id);
  const placeholders = markupNames.map(() => '?').join(', ');
  // الحذف بمطابقة المعرف (id) — يزيل صفوف البذور القديمة بمعرفات UUID وغيرها
  await c.execute({
    sql: `DELETE FROM PlayerFrame WHERE id NOT IN (${placeholders})`,
    args: markupNames,
  });
  for (const [i, f] of YALLA_FRAMES.entries()) {
    const isPng = /^\d+$/.test(f.id);
    await c.execute({
      sql: `INSERT OR REPLACE INTO PlayerFrame (id, name, nameAr, description, imageUrl, rarity, gradientFrom, gradientTo, borderColor, glowColor, pattern, price, isFree, isActive, sortOrder)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        f.id, f.id, f.nameAr,
        isPng ? 'إطار حصري للملف الشخصي' : 'إطار مصمم للملف الشخصي',
        isPng ? `/yalla-frames/${f.id}.png` : '',
        f.rarity, '#f59e0b', '#eab308', 'rgba(245, 158, 11, 0.6)', 'rgba(245, 158, 11, 0.3)',
        'gradient', f.price, f.isFree ? 1 : 0, 1, i,
      ],
    });
  }
  // تنظيف ملكيات المستخدمين لأطر لم تعد موجودة (القديمة المزروعة سابقاً)
  await c.execute(`DELETE FROM UserFrame WHERE frameId NOT IN (SELECT id FROM PlayerFrame)`);
  await c.execute(`UPDATE UserFrame SET isEquipped = 0 WHERE frameId NOT IN (SELECT id FROM PlayerFrame)`);
  await c.execute(`UPDATE AppUser SET frame = '' WHERE TRIM(COALESCE(frame, '')) <> '' AND UPPER(TRIM(frame)) NOT IN (SELECT UPPER(id) FROM PlayerFrame)`);
  await c.execute(`INSERT OR IGNORE INTO SiteConfig (id) VALUES ('main')`);
  await c.execute({
    sql: `UPDATE SiteConfig SET framesSeeded = ?, updatedAt = datetime('now') WHERE id = 'main'`,
    args: [YALLA_FRAMES_SEED_VERSION],
  });
}

// ─── Seed default frames (متوافق مع الكود السابق — يعتمد الآن كتالوج الإطارات الحقيقي) ───

export async function seedDefaultFrames(): Promise<void> {
  await seedYallaFrames();
  await seedDefaultDecor();
}


// ═══════════════════════ الزينة (معلقات/مواضيع/بطاقات) ═══════════════════════

export type DecorKind = 'ornament' | 'theme' | 'card';

export interface DecorItem {
  id: string;
  kind: DecorKind;
  nameAr: string;
  imageUrl: string;
  rarity: PlayerFrame['rarity'];
  price: number;
  isFree: boolean;
  isActive: boolean;
  sortOrder: number;
  totalOwned: number;
}

export interface UserDecorRec {
  id: string;
  userId: string;
  itemId: string;
  isEquipped: boolean;
  obtainedFrom: UserFrame['obtainedFrom'];
  obtainedNote: string;
  obtainedAt: string;
  item: DecorItem;
}

// كتالوج البذر — مصدره الأصول المحلية نفسها المتاحة في النوافذ: public/yalla-ornaments و yalla-covers
const DECOR_SEED: Array<{ id: string; kind: DecorKind; nameAr: string; imageUrl: string; rarity: DecorItem['rarity']; price: number; isFree: boolean }> = [
  // المعلقات الجدارية (تفوق غلاف البروفايل)
  { id: 'orn_banner', kind: 'ornament', nameAr: 'لافتة الاحتفال', imageUrl: '/yalla-ornaments/orn_banner.png', rarity: 'rare', price: 250, isFree: false },
  { id: 'orn_lights', kind: 'ornament', nameAr: 'أضواء البطولة', imageUrl: '/yalla-ornaments/orn_lights.png', rarity: 'epic', price: 500, isFree: false },
  { id: 'orn_sparkle', kind: 'ornament', nameAr: 'بريق ذهبي', imageUrl: '/yalla-ornaments/orn_sparkle.png', rarity: 'legendary', price: 800, isFree: false },
  // المواضيع (أغلفة البروفايل) — المعرف = مسار الملف كما يُخزن في AppUser.cover
  { id: '/yalla-covers/bg_profile_theme_default.webp', kind: 'theme', nameAr: 'افتراضي', imageUrl: '/yalla-covers/bg_profile_theme_default.webp', rarity: 'common', price: 0, isFree: true },
  { id: '/yalla-games/mafia.png', kind: 'theme', nameAr: 'المافيا', imageUrl: '/yalla-games/mafia.png', rarity: 'rare', price: 300, isFree: false },
  { id: '/yalla-games/tobol.png', kind: 'theme', nameAr: 'طبول الحرب', imageUrl: '/yalla-games/tobol.png', rarity: 'rare', price: 300, isFree: false },
  { id: '/yalla-games/tabot.png', kind: 'theme', nameAr: 'الهروب من التابوت', imageUrl: '/yalla-games/tabot.png', rarity: 'rare', price: 300, isFree: false },
  { id: '/yalla-games/prison.png', kind: 'theme', nameAr: 'السجن', imageUrl: '/yalla-games/prison.png', rarity: 'rare', price: 300, isFree: false },
  { id: '/yalla-games/risk.png', kind: 'theme', nameAr: 'المجازفة', imageUrl: '/yalla-games/risk.png', rarity: 'rare', price: 300, isFree: false },
  { id: '/yalla-games/risk2.png', kind: 'theme', nameAr: 'المجازفة 2', imageUrl: '/yalla-games/risk2.png', rarity: 'rare', price: 300, isFree: false },
  { id: '/yalla-games/familyfeud.png', kind: 'theme', nameAr: 'فاميلي فيود', imageUrl: '/yalla-games/familyfeud.png', rarity: 'rare', price: 300, isFree: false },
  { id: '/yalla-games/baharharb.png', kind: 'theme', nameAr: 'بحر و حرب', imageUrl: '/yalla-games/baharharb.png', rarity: 'rare', price: 300, isFree: false },
  { id: '/yalla-games/shifarat.png', kind: 'theme', nameAr: 'الشيفرات', imageUrl: '/yalla-games/shifarat.png', rarity: 'rare', price: 300, isFree: false },
  // البطاقات (فنيات خلفية + بطاقات هوية) — المعرف = اسم الملف كما يُخزن في AppUser.card
  // card_emerald_royal: البطاقة المرجعية للتصميم (عريضة، شفافة، زخرفة الأطراف والمركز مفتوح للأفاتار)
  // card_royal_deer: بطاقة الغزالين الزمردين — هوامش آمنة لمنع الاقتطاع الجانبي
  { id: 'card_royal_deer', kind: 'card', nameAr: 'الغزلان الملكية', imageUrl: '/yalla-ornaments/card_royal_deer.png', rarity: 'legendary', price: 800, isFree: false },
  // card_golden_love: العشاق الذهبيون (خلفية سوداء أزيلت بالمعالجة)
  { id: 'card_golden_love', kind: 'card', nameAr: 'العشاق الذهبيون', imageUrl: '/yalla-ornaments/card_golden_love.png', rarity: 'legendary', price: 800, isFree: false },
  { id: 'card_emerald_royal', kind: 'card', nameAr: 'الزمرد الملكي', imageUrl: '/yalla-ornaments/card_emerald_royal.png', rarity: 'legendary', price: 600, isFree: false },
  { id: 'card_astronaut', kind: 'card', nameAr: 'حديقة الفضاء', imageUrl: '/yalla-ornaments/card_astronaut.png', rarity: 'epic', price: 500, isFree: false },
  { id: 'card_glow', kind: 'card', nameAr: 'هالة ضوئية', imageUrl: '/yalla-ornaments/card_glow.png', rarity: 'epic', price: 500, isFree: false },
  { id: 'room_profile_member_bg', kind: 'card', nameAr: 'بطاقة العضوية', imageUrl: '/yalla-ornaments/room_profile_member_bg.png', rarity: 'rare', price: 400, isFree: false },
  { id: 'charge_reward_profile_card', kind: 'card', nameAr: 'بطاقة الشحن', imageUrl: '/yalla-ornaments/charge_reward_profile_card.png', rarity: 'rare', price: 400, isFree: false },
];

const DECOR_SEED_VERSION = 4;

export async function seedDefaultDecor(): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  const marker = await c.execute({
    sql: "SELECT framesSeeded FROM SiteConfig WHERE id = 'main' LIMIT 1",
    args: [],
  });
  const mrow = marker.rows[0] as Record<string, unknown> | undefined;
  if (Number(mrow?.decorSeeded ?? 0) >= DECOR_SEED_VERSION) return;
  await c.execute('DELETE FROM DecorItem');
  for (const [i, f] of DECOR_SEED.entries()) {
    await c.execute({
      sql: `INSERT OR REPLACE INTO DecorItem (id, kind, nameAr, imageUrl, rarity, price, isFree, isActive, sortOrder, totalOwned)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [f.id, f.kind, f.nameAr, f.imageUrl, f.rarity, f.price, f.isFree ? 1 : 0, i, 0],
    });
  }
  // تنظيف ملكيات التيّم + إعادة تعيين القيم غير الموجودة في الكتالوج الجديد
  await c.execute('DELETE FROM UserDecor WHERE itemId NOT IN (SELECT id FROM DecorItem)');
  await c.execute(`UPDATE AppUser SET ornament = '' WHERE TRIM(COALESCE(ornament, '')) <> '' AND ornament NOT IN (SELECT id FROM DecorItem WHERE kind = 'ornament')`);
  await c.execute(`UPDATE AppUser SET cover = '' WHERE TRIM(COALESCE(cover, '')) <> '' AND cover NOT IN (SELECT id FROM DecorItem WHERE kind = 'theme')`);
  await c.execute(`UPDATE AppUser SET card = '' WHERE TRIM(COALESCE(card, '')) <> '' AND card NOT IN (SELECT id FROM DecorItem WHERE kind = 'card')`);
  await c.execute({
    sql: `UPDATE SiteConfig SET decorSeeded = ?, updatedAt = datetime('now') WHERE id = 'main'`,
    args: [DECOR_SEED_VERSION],
  });
}

function toDecorItem(row: Record<string, unknown>): DecorItem {
  return {
    id: String(row.id),
    kind: (String(row.kind) as DecorKind),
    nameAr: String(row.nameAr ?? ''),
    imageUrl: String(row.imageUrl ?? ''),
    rarity: (String(row.rarity) as PlayerFrame['rarity']) || 'common',
    price: Number(row.price ?? 0),
    isFree: Number(row.isFree ?? 0) === 1,
    isActive: Number(row.isActive ?? 1) === 1,
    sortOrder: Number(row.sortOrder ?? 0),
    totalOwned: Number(row.totalOwned ?? 0),
  };
}

export async function getDecorItems(kind?: DecorKind): Promise<DecorItem[]> {
  await ensureAdminTables();
  const c = getClient();
  if (kind) {
    const res = await c.execute({
      sql: 'SELECT * FROM DecorItem WHERE kind = ? AND isActive = 1 ORDER BY sortOrder ASC',
      args: [kind],
    });
    return res.rows.map((r) => toDecorItem(r as Record<string, unknown>));
  }
  const res = await c.execute('SELECT * FROM DecorItem WHERE isActive = 1 ORDER BY sortOrder ASC');
  return res.rows.map((r) => toDecorItem(r as Record<string, unknown>));
}

export async function getAllDecorItems(): Promise<DecorItem[]> {
  await ensureAdminTables();
  const c = getClient();
  const res = await c.execute('SELECT * FROM DecorItem ORDER BY kind ASC, sortOrder ASC');
  return res.rows.map((r) => toDecorItem(r as Record<string, unknown>));
}

export async function createDecorItem(data: Partial<DecorItem> & { kind: DecorKind; nameAr: string }): Promise<DecorItem> {
  await ensureAdminTables();
  const c = getClient();
  const id = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO DecorItem (id, kind, nameAr, imageUrl, rarity, price, isFree, isActive, sortOrder, totalOwned)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 0)`,
    args: [id, data.kind, data.nameAr, data.imageUrl ?? '', data.rarity ?? 'common', data.price ?? 0, data.isFree ? 1 : 0, data.sortOrder ?? 0],
  });
  const res = await c.execute({ sql: 'SELECT * FROM DecorItem WHERE id = ?', args: [id] });
  return toDecorItem(res.rows[0] as Record<string, unknown>);
}

export async function updateDecorItem(id: string, data: Partial<DecorItem>): Promise<DecorItem | null> {
  await ensureAdminTables();
  const c = getClient();
  const entries = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'id');
  if (entries.length === 0) {
    const res = await c.execute({ sql: 'SELECT * FROM DecorItem WHERE id = ?', args: [id] });
    return res.rows.length ? toDecorItem(res.rows[0] as Record<string, unknown>) : null;
  }
  const setClauses: string[] = []; const values: InValue[] = [];
  for (const [k, v] of entries) {
    if (k === 'rarity' && !['common', 'rare', 'epic', 'legendary'].includes(String(v))) continue;
    if (k === 'kind' && !['ornament', 'theme', 'card'].includes(String(v))) continue;
    setClauses.push(`${k} = ?`); values.push(sqlVal(v) as InValue);
  }
  if (setClauses.length > 0) {
    values.push(id);
    await c.execute({ sql: `UPDATE DecorItem SET ${setClauses.join(', ')}, updatedAt = datetime('now') WHERE id = ?`, args: values });
  }
  const res = await c.execute({ sql: 'SELECT * FROM DecorItem WHERE id = ?', args: [id] });
  return res.rows.length ? toDecorItem(res.rows[0] as Record<string, unknown>) : null;
}

export async function deleteDecorItem(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM DecorItem WHERE id = ?', args: [id] });
  await c.execute({ sql: 'DELETE FROM UserDecor WHERE itemId = ?', args: [id] });
}

export async function grantDecorToUser(data: { userId: string; itemId: string; obtainedFrom?: UserFrame['obtainedFrom']; obtainedNote?: string }): Promise<UserDecorRec | null> {
  await ensureAdminTables();
  const c = getClient();
  const existing = await c.execute({
    sql: 'SELECT id FROM UserDecor WHERE userId = ? AND itemId = ?',
    args: [data.userId, data.itemId],
  });
  if (existing.rows.length > 0) return null;
  const id = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO UserDecor (id, userId, itemId, isEquipped, obtainedFrom, obtainedNote)
          VALUES (?, ?, ?, 0, ?, ?)`,
    args: [id, data.userId, data.itemId, data.obtainedFrom ?? 'gift', data.obtainedNote ?? ''],
  });
  await c.execute({ sql: 'UPDATE DecorItem SET totalOwned = totalOwned + 1 WHERE id = ?', args: [data.itemId] });
  const res = await c.execute({ sql: 'SELECT * FROM UserDecor WHERE id = ?', args: [id] });
  const row = res.rows[0] as Record<string, unknown>;
  const itemRes = await c.execute({ sql: 'SELECT * FROM DecorItem WHERE id = ?', args: [data.itemId] });
  if (itemRes.rows.length === 0) return null;
  return {
    id: String(row.id), userId: String(row.userId), itemId: String(row.itemId),
    isEquipped: Number(row.isEquipped ?? 0) === 1,
    obtainedFrom: (String(row.obtainedFrom) as UserFrame['obtainedFrom']) ?? 'gift',
    obtainedNote: String(row.obtainedNote ?? ''), obtainedAt: String(row.obtainedAt ?? ''),
    item: toDecorItem(itemRes.rows[0] as Record<string, unknown>),
  };
}

// تجهيز زينة (المعلق/الموضوع/البطاقة) — يقبل فارغاً للإزالة. يكتب في أعمدة AppUser الأصلية
// ornament → ornament ، theme → cover ، card → card
export async function equipDecor(userId: string, kind: DecorKind, itemId: string | null): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  if (itemId) {
    const itemRes = await c.execute({ sql: 'SELECT kind FROM DecorItem WHERE id = ? AND isActive = 1', args: [itemId] });
    if (itemRes.rows.length === 0) throw new Error('عنصر الزينة غير موجود');
    if (String((itemRes.rows[0] as Record<string, unknown>).kind) !== kind) throw new Error('نوع العنصر غير مطابق');
    const owned = await c.execute({
      sql: 'SELECT id FROM UserDecor WHERE userId = ? AND itemId = ? LIMIT 1',
      args: [userId, itemId],
    });
    if (owned.rows.length === 0) throw new Error('غير مصرح: عنصر الزينة غير مملوك لك');
  }
  const col = kind === 'ornament' ? 'ornament' : kind === 'theme' ? 'cover' : 'card';
  await c.execute({
    sql: `UPDATE AppUser SET ${col} = ?, updatedAt = datetime('now') WHERE id = ?`,
    args: [itemId ?? '', userId],
  });
}

export async function getUserDecor(userId: string): Promise<UserDecorRec[]> {
  await ensureAdminTables();
  const c = getClient();
  const res = await c.execute({
    sql: `SELECT ud.*, d.kind as dKind, d.nameAr as dNameAr, d.imageUrl as dImageUrl, d.rarity as dRarity,
          d.price as dPrice, d.isFree as dIsFree, d.isActive as dIsActive, d.totalOwned as dTotalOwned, d.sortOrder as dSortOrder
          FROM UserDecor ud JOIN DecorItem d ON ud.itemId = d.id WHERE ud.userId = ? ORDER BY d.sortOrder ASC`,
    args: [userId],
  });
  return res.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id), userId: String(row.userId), itemId: String(row.itemId),
      isEquipped: Number(row.isEquipped ?? 0) === 1,
      obtainedFrom: (String(row.obtainedFrom) as UserFrame['obtainedFrom']) ?? 'gift',
      obtainedNote: String(row.obtainedNote ?? ''), obtainedAt: String(row.obtainedAt ?? ''),
      item: {
        id: String(row.itemId),
        kind: (String(row.dKind) as DecorKind),
        nameAr: String(row.dNameAr ?? ''),
        imageUrl: String(row.dImageUrl ?? ''),
        rarity: (String(row.dRarity) as PlayerFrame['rarity']) || 'common',
        price: Number(row.dPrice ?? 0),
        isFree: Number(row.dIsFree ?? 0) === 1,
        isActive: Number(row.dIsActive ?? 1) === 1,
        sortOrder: Number(row.dSortOrder ?? 0),
        totalOwned: Number(row.dTotalOwned ?? 0),
      },
    };
  });
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<Omit<AppUser, 'passwordHash'> | null> {
  const { verifyPassword } = await import('@/lib/admin-auth');
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE email = ? AND isActive = 1',
    args: [email],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as Record<string, unknown>;
  const passwordHash = row.passwordHash as string;

  if (!verifyPassword(password, passwordHash)) return null;

  // Update last login
  await c.execute({
    sql: "UPDATE AppUser SET lastLoginAt = datetime('now') WHERE id = ?",
    args: [row.id as string],
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = toAppUser(row);
  return safeUser;
}

export async function linkUserToSubscription(
  userId: string,
  subscriptionId: string
): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'UPDATE AppUser SET subscriptionId = ?, updatedAt = datetime(\'now\') WHERE id = ?',
    args: [subscriptionId, userId],
  });
}

export async function getUserBySubscriptionId(
  subscriptionId: string
): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE subscriptionId = ? AND isActive = 1',
    args: [subscriptionId],
  });

  if (result.rows.length === 0) return null;
  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

// ─── Friends & Voice Rooms types ──────────────────────────────────────

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  fromUsername?: string;
  fromDisplayName?: string;
  fromAvatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FriendWithUser {
  friendshipId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  createdAt: string;
}

export interface VoiceRoom {
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostName: string;
  maxParticipants: number;
  isPrivate: boolean;
  micSeatCount: number;
  roomMode: 'public' | 'key' | 'private';
  roomPassword: string;
  roomLevel: number;
  micTheme: string;
  bgmEnabled: boolean;
  chatMuted: boolean;
  announcement: string;
  giftSplit: number;
  isAutoMode: boolean;
  lockedSeats: number[];
  participantCount?: number;
  createdAt: string;
  roomImage: string;
  roomAvatar: string;
  joinPrice: number;
  guestMicEnabled: boolean;
  memberMicEnabled: boolean;
}

export type RoomRole = 'owner' | 'coowner' | 'admin' | 'member' | 'visitor';
export type SeatStatus = 'open' | 'locked' | 'request' | 'reserved';

export interface VoiceRoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  isMuted: boolean;
  micFrozen: boolean;
  role: RoomRole;
  seatIndex: number;
  seatStatus: SeatStatus;
  vipLevel: number;
  joinedAt: string;
  pendingRole?: string;
  pendingMicInvite?: number;
}

export interface RoomBan {
  id: string;
  roomId: string;
  userId: string;
  bannedBy: string;
  reason: string;
  createdAt: string;
}

export interface RoomWaitlist {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  vipLevel: number;
  requestedSeat: number;
  createdAt: string;
}

export interface RoomActionLog {
  id: string;
  roomId: string;
  actorId: string;
  actorName: string;
  action: string;
  targetId: string;
  targetName: string;
  details: string;
  createdAt: string;
}

export const ROLE_HIERARCHY: Record<RoomRole, number> = {
  owner: 5,
  coowner: 4,
  admin: 3,
  member: 2,
  visitor: 1,
};

export interface Gift {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  price: number;
  isActive: boolean;
}

// ─── Friends functions ────────────────────────────────────────────────

export async function sendFriendRequest(fromUserId: string, toUsername: string): Promise<{ success: boolean; error?: string }> {
  const c = getClient();
  await ensureAdminTables();
  const targetResult = await c.execute({ sql: 'SELECT id FROM AppUser WHERE username = ?', args: [toUsername] });
  if (targetResult.rows.length === 0) return { success: false, error: 'المستخدم غير موجود' };
  const toUserId = targetResult.rows[0].id as string;
  if (fromUserId === toUserId) return { success: false, error: 'لا يمكنك إرسال طلب لنفسك' };
  const existing = await c.execute({ sql: 'SELECT id, status FROM FriendRequest WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?)', args: [fromUserId, toUserId, toUserId, fromUserId] });
  if (existing.rows.length > 0) {
    const status = existing.rows[0].status as string;
    if (status === 'pending') return { success: false, error: 'يوجد طلب معلق بالفعل' };
    if (status === 'accepted') return { success: false, error: 'أصدقاء بالفعل' };
    await c.execute({ sql: 'DELETE FROM FriendRequest WHERE id = ?', args: [existing.rows[0].id] });
  }
  await c.execute({ sql: 'INSERT INTO FriendRequest (id, fromUserId, toUserId, status) VALUES (?, ?, ?, ?)', args: [crypto.randomUUID(), fromUserId, toUserId, 'pending'] });
  return { success: true };
}

export async function acceptFriendRequest(requestId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: "UPDATE FriendRequest SET status = 'accepted', updatedAt = datetime('now') WHERE id = ? AND status = 'pending'", args: [requestId] });
  return result.rowsAffected > 0;
}

export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: "UPDATE FriendRequest SET status = 'rejected', updatedAt = datetime('now') WHERE id = ? AND status = 'pending'", args: [requestId] });
  return result.rowsAffected > 0;
}

export async function removeFriend(friendshipId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: "DELETE FROM FriendRequest WHERE id = ? AND status = 'accepted' AND (fromUserId = ? OR toUserId = ?)", args: [friendshipId, userId, userId] });
  return result.rowsAffected > 0;
}

export async function getFriendsList(userId: string): Promise<FriendWithUser[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: `SELECT f.id as friendshipId, u.id as userId, u.username, COALESCE(u.displayName, u.username) as displayName, u.avatar, COALESCE(u.level,1) as level, f.createdAt
    FROM FriendRequest f JOIN AppUser u ON CASE WHEN f.fromUserId = ? THEN u.id = f.toUserId ELSE u.id = f.fromUserId END
    WHERE f.status = 'accepted' AND (f.fromUserId = ? OR f.toUserId = ?) ORDER BY f.updatedAt DESC`, args: [userId, userId, userId] });
  return result.rows.map(row => ({
    friendshipId: row.friendshipId as string, userId: row.userId as string, username: row.username as string,
    displayName: row.displayName as string, avatar: (row.avatar as string) || '', level: Number(row.level) || 1,
    createdAt: row.createdAt as string,
  }));
}

export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: `SELECT f.*, u.username as fromUsername, COALESCE(u.displayName, u.username) as fromDisplayName, u.avatar as fromAvatar
    FROM FriendRequest f JOIN AppUser u ON u.id = f.fromUserId WHERE f.toUserId = ? AND f.status = 'pending' ORDER BY f.createdAt DESC`, args: [userId] });
  return result.rows.map(row => ({
    id: row.id as string, fromUserId: row.fromUserId as string, toUserId: row.toUserId as string,
    status: 'pending' as const, fromUsername: row.fromUsername as string,
    fromDisplayName: row.fromDisplayName as string, fromAvatar: (row.fromAvatar as string) || '',
    createdAt: row.createdAt as string, updatedAt: row.updatedAt as string,
  }));
}

export async function searchUsers(query: string, currentUserId: string): Promise<{ id: string; username: string; displayName: string; avatar: string }[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: `SELECT id, username, COALESCE(displayName, username) as displayName, avatar FROM AppUser WHERE (username LIKE ? OR displayName LIKE ?) AND id != ? LIMIT 20`, args: [`%${query}%`, `%${query}%`, currentUserId] });
  return result.rows.map(row => ({ id: row.id as string, username: row.username as string, displayName: row.displayName as string, avatar: (row.avatar as string) || '' }));
}

// ─── Voice Rooms functions ────────────────────────────────────────────

// Helper: insert action log
async function logAction(roomId: string, actorId: string, actorName: string, action: string, targetId: string, targetName: string, details: string = ''): Promise<void> {
  const c = getClient();
  await c.execute({
    sql: 'INSERT INTO RoomActionLog (id, roomId, actorId, actorName, action, targetId, targetName, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), roomId, actorId, actorName, action, targetId, targetName, details],
  });
}

// Helper: get user VIP level from AppUser
async function getUserVipLevel(userId: string): Promise<number> {
  const c = getClient();
  const result = await c.execute({ sql: 'SELECT vipLevel FROM AppUser WHERE id = ?', args: [userId] });
  if (result.rows.length === 0) return 0;
  return Number(result.rows[0].vipLevel) || 0;
}

// 23. getRoomById - Return full room details including password
export async function getRoomById(roomId: string): Promise<VoiceRoom | null> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: `SELECT vr.*, au.numericId as hostNumericId FROM VoiceRoom vr
          LEFT JOIN AppUser au ON vr.hostId = au.id
          WHERE vr.id = ?`,
    args: [roomId],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  let lockedSeats: number[] = [];
  try {
    lockedSeats = JSON.parse((row.lockedSeats as string) || '[]');
  } catch { lockedSeats = []; }

  return {
    id: row.id as string, name: row.name as string, description: (row.description as string) || '',
    hostId: row.hostId as string, hostName: (row.hostName as string) || '',
    hostNumericId: row.hostNumericId ? Number(row.hostNumericId) : null,
    maxParticipants: Number(row.maxParticipants) || 10, isPrivate: Boolean(row.isPrivate),
    micSeatCount: Number(row.micSeatCount) || 10,
    roomMode: (row.roomMode as VoiceRoom['roomMode']) || 'public',
    roomPassword: (row.roomPassword as string) || '',
    roomLevel: Number(row.roomLevel) || 1,
    micTheme: (row.micTheme as string) || 'default',
    bgmEnabled: Boolean(row.bgmEnabled),
    chatMuted: Boolean(row.chatMuted),
    announcement: (row.announcement as string) || '',
    giftSplit: Number(row.giftSplit) || 70,
    isAutoMode: Boolean(row.isAutoMode),
    lockedSeats,
    createdAt: row.createdAt as string,
    roomImage: (row.roomImage as string) || '',
    roomAvatar: (row.roomAvatar as string) || '',
    joinPrice: Number(row.joinPrice) || 0,
    guestMicEnabled: Boolean(row.guestMicEnabled),
    memberMicEnabled: Boolean(row.memberMicEnabled),
  };
}

// 1. createVoiceRoom - Updated with new fields
export async function createVoiceRoom(
  hostId: string, hostName: string, name: string, description: string,
  maxParticipants: number, isPrivate: boolean, micSeatCount: number = 10,
  roomMode: 'public' | 'key' | 'private' = 'public', roomPassword: string = '',
  micTheme: string = 'default', isAutoMode: boolean = true,
  roomAvatar: string = '', roomImage: string = ''
): Promise<VoiceRoom> {
  const c = getClient();
  await ensureAdminTables();

  // Get user's numericId to use as room ID
  const userResult = await c.execute({ sql: 'SELECT numericId FROM AppUser WHERE id = ?', args: [hostId] });
  const numericId = userResult.rows.length > 0 ? Number(userResult.rows[0].numericId) : null;

  // Check if user already has a room (one room per user)
  const existingRoom = await c.execute({ sql: 'SELECT id, name FROM VoiceRoom WHERE hostId = ?', args: [hostId] });
  if (existingRoom.rows.length > 0) {
    const existingName = existingRoom.rows[0].name as string;
    throw new Error(`لديك غرفة بالفعل: ${existingName}`);
  }

  // Room ID = user's numericId (e.g., "123456") or fallback to UUID
  const id = numericId ? String(numericId) : crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO VoiceRoom (id, name, description, hostId, hostName, maxParticipants, isPrivate, micSeatCount, roomMode, roomPassword, micTheme, isAutoMode, roomImage, roomAvatar)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, description, hostId, hostName, maxParticipants, isPrivate ? 1 : 0, micSeatCount, roomMode, roomPassword, micTheme, isAutoMode ? 1 : 0, roomImage, roomAvatar],
  });
  // Insert host as owner on seat 0
  const hostVip = await getUserVipLevel(hostId);
  await c.execute({
    sql: `INSERT INTO VoiceRoomParticipant (id, roomId, userId, username, displayName, avatar, isMuted, role, seatIndex, seatStatus, micFrozen, vipLevel)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), id, hostId, hostName, hostName, '', 0, 'owner', 0, 'locked', 0, hostVip],
  });
  await logAction(id, hostId, hostName, 'create_room', '', '', `Created room: ${name}`);
  return {
    id, name, description, hostId, hostName, maxParticipants, isPrivate, micSeatCount,
    roomMode, roomPassword, roomLevel: 1, micTheme, bgmEnabled: false, chatMuted: false,
    announcement: '', giftSplit: 70, isAutoMode, createdAt: new Date().toISOString(),
    roomImage, roomAvatar,
  };
}

// 2. getAllVoiceRooms - Only return public/key rooms, hide password
export async function getAllVoiceRooms(): Promise<VoiceRoom[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: `SELECT vr.*, COUNT(vrp.id) as participantCount, au.numericId as hostNumericId
          FROM VoiceRoom vr
          LEFT JOIN VoiceRoomParticipant vrp ON vr.id = vrp.roomId
          LEFT JOIN AppUser au ON vr.hostId = au.id
          WHERE vr.roomMode IN ('public', 'key')
          GROUP BY vr.id ORDER BY vr.createdAt DESC`,
    args: [],
  });
  return result.rows.map(row => ({
    id: row.id as string, name: row.name as string, description: (row.description as string) || '',
    hostId: row.hostId as string, hostName: (row.hostName as string) || '',
    hostNumericId: row.hostNumericId ? Number(row.hostNumericId) : null,
    maxParticipants: Number(row.maxParticipants) || 10, isPrivate: Boolean(row.isPrivate),
    micSeatCount: Number(row.micSeatCount) || 10,
    roomMode: (row.roomMode as VoiceRoom['roomMode']) || 'public',
    roomPassword: '', // Never expose password in list
    roomLevel: Number(row.roomLevel) || 1,
    micTheme: (row.micTheme as string) || 'default',
    bgmEnabled: Boolean(row.bgmEnabled),
    chatMuted: Boolean(row.chatMuted),
    announcement: (row.announcement as string) || '',
    giftSplit: Number(row.giftSplit) || 70,
    isAutoMode: Boolean(row.isAutoMode),
    participantCount: Number(row.participantCount) || 0,
    createdAt: row.createdAt as string,
    roomImage: (row.roomImage as string) || '',
    roomAvatar: (row.roomAvatar as string) || '',
  }));
}

// 3b. getRoomByHostId - Get room created by specific user
export async function getRoomByHostId(hostId: string): Promise<VoiceRoom | null> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT vr.*, COUNT(vrp.id) as participantCount FROM VoiceRoom vr LEFT JOIN VoiceRoomParticipant vrp ON vr.id = vrp.roomId WHERE vr.hostId = ? GROUP BY vr.id', args: [hostId] });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as string, name: row.name as string, description: (row.description as string) || '',
    hostId: row.hostId as string, hostName: (row.hostName as string) || '',
    maxParticipants: Number(row.maxParticipants) || 10, isPrivate: Boolean(row.isPrivate),
    micSeatCount: Number(row.micSeatCount) || 10,
    roomMode: (row.roomMode as VoiceRoom['roomMode']) || 'public',
    roomPassword: '', roomLevel: Number(row.roomLevel) || 1,
    micTheme: (row.micTheme as string) || 'default',
    bgmEnabled: Boolean(row.bgmEnabled), chatMuted: Boolean(row.chatMuted),
    announcement: (row.announcement as string) || '',
    giftSplit: Number(row.giftSplit) || 70, isAutoMode: Boolean(row.isAutoMode),
    participantCount: Number(row.participantCount) || 0,
    createdAt: row.createdAt as string, roomImage: (row.roomImage as string) || '', roomAvatar: (row.roomAvatar as string) || '',
  };
}

// 3c. updateRoomImage
export async function updateRoomImage(roomId: string, roomImage: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const roomResult = await c.execute({ sql: 'SELECT hostId FROM VoiceRoom WHERE id = ?', args: [roomId] });
  if (roomResult.rows.length === 0) return false;
  if (roomResult.rows[0].hostId !== userId) return false;
  await c.execute({ sql: 'UPDATE VoiceRoom SET roomImage = ? WHERE id = ?', args: [roomImage, roomId] });
  return true;
}

// 3d. cleanupGhostParticipants - remove users not seen in last 30 min
export async function cleanupGhostParticipants(roomId: string): Promise<void> {
  const c = getClient();
 await ensureAdminTables();
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await c.execute({
    sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ? AND userId != (SELECT hostId FROM VoiceRoom WHERE id = ?) AND role = \'visitor\' AND joinedAt < ?',
    args: [roomId, roomId, thirtyMinAgo],
  });
}

// 4. getVoiceRoomParticipants - Include all new fields, exclude banned users, mic first
export async function getVoiceRoomParticipants(roomId: string): Promise<VoiceRoomParticipant[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: `SELECT vrp.*, au.numericId FROM VoiceRoomParticipant vrp
          LEFT JOIN AppUser au ON vrp.userId = au.id
          WHERE vrp.roomId = ? AND vrp.userId NOT IN (SELECT userId FROM RoomBan WHERE roomId = ?)
          ORDER BY CASE WHEN vrp.seatIndex >= 0 THEN 0 ELSE 1 END, vrp.seatIndex ASC, vrp.joinedAt ASC`,
    args: [roomId, roomId],
  });
  return result.rows.map(row => ({
    id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
    username: row.username as string, displayName: (row.displayName as string) || '',
    avatar: (row.avatar as string) || '', numericId: row.numericId ? Number(row.numericId) : null,
    isMuted: Boolean(row.isMuted),
    micFrozen: Boolean(row.micFrozen),
    role: (row.role as RoomRole) || 'visitor',
    seatIndex: Number(row.seatIndex) ?? -1,
    seatStatus: (row.seatStatus as SeatStatus) || 'open',
    vipLevel: Number(row.vipLevel) || 0,
    joinedAt: row.joinedAt as string,
    pendingRole: (row.pendingRole as string) || '',
    pendingMicInvite: Number(row.pendingMicInvite) ?? -1,
  }));
}

// 3. joinVoiceRoom - Check ban, roomMode, password
export async function joinVoiceRoom(roomId: string, userId: string, username: string, displayName: string, avatar: string, password?: string): Promise<{ success: boolean; error?: string }> {
  const c = getClient();
  await ensureAdminTables();

  // Check if banned
  const banned = await c.execute({ sql: 'SELECT id FROM RoomBan WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (banned.rows.length > 0) return { success: false, error: 'محظور من هذه الغرفة' };

  // Check if already in room
  const existing = await c.execute({ sql: 'SELECT id FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (existing.rows.length > 0) return { success: true };

  // Cleanup ghost participants (visitors inactive for 30+ minutes)
  await cleanupGhostParticipants(roomId);

  // Check room mode and host identity together
  const roomResult = await c.execute({ sql: 'SELECT roomMode, roomPassword, hostId FROM VoiceRoom WHERE id = ?', args: [roomId] });
  if (roomResult.rows.length === 0) return { success: false, error: 'الغرفة غير موجودة' };
  const room = roomResult.rows[0];
  const mode = room.roomMode as string;
  const isHost = room.hostId === userId;

  if (mode === 'private') {
    // Owner can always enter their own private room
    if (!isHost) return { success: false, error: 'الغرفة خاصة - دعوة فقط' };
  }
  if (mode === 'key' && !isHost) {
    // Owner bypasses password check; visitors must provide correct password
    if (!password || password !== room.roomPassword) return { success: false, error: 'كلمة المرور غير صحيحة' };
  }

  // Get VIP level and check persistent membership
  const vipLevel = await getUserVipLevel(userId);
  let joinRole: string = 'visitor';
  if (isHost) {
    joinRole = 'owner';
  } else {
    // Check RoomMember table for saved role (member/admin/coowner)
    const savedMember = await c.execute({
      sql: 'SELECT role FROM RoomMember WHERE roomId = ? AND userId = ?',
      args: [roomId, userId],
    });
    if (savedMember.rows.length > 0) {
      const savedRole = savedMember.rows[0].role as string;
      // Only restore if it's a higher role than visitor
      if (savedRole === 'coowner' || savedRole === 'admin' || savedRole === 'member') {
        joinRole = savedRole;
      }
    }
  }
  const joinSeat = -1;
  const joinStatus = 'open';

  await c.execute({
    sql: `INSERT INTO VoiceRoomParticipant (id, roomId, userId, username, displayName, avatar, isMuted, role, seatIndex, seatStatus, micFrozen, vipLevel, lastSeen)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [crypto.randomUUID(), roomId, userId, username, displayName, avatar, 0, joinRole, joinSeat, joinStatus, 0, vipLevel],
  });

  // Roles are PERMANENT — no one affects anyone else's role.
  // Each user gets their fixed role from RoomMember, nothing more.
  await logAction(roomId, userId, username, 'join_room', '', '', '');
  return { success: true };
}

// 5. leaveVoiceRoom - Remove from waitlist, transfer ownership
export async function leaveVoiceRoom(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Get participant info before leaving
  const partResult = await c.execute({ sql: 'SELECT * FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  const participant = partResult.rows[0] as Record<string, unknown> | undefined;
  const leavingRole = participant?.role as string || 'visitor';
  const leavingName = (participant?.username as string) || (participant?.displayName as string) || '';

  // Remove from waitlist
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, userId] });

  // Remove participant
  await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });

  await logAction(roomId, userId, leavingName, 'leave_room', '', '', '');

  // Roles are PERMANENT — leaving does NOT affect anyone else's role.
  // Owner leaves? The room stays. Others keep their roles unchanged.
  // No ownership transfer, no role swapping, no confusion.

  // Room persists even when empty — owner can rejoin anytime.

  return true;
}

export async function cleanupStaleParticipants(roomId: string): Promise<number> {
  const c = getClient();
  await ensureAdminTables();
  // Remove participants whose lastSeen is older than 60 seconds
  // IMPORTANT: Never delete the room host
  const result = await c.execute({
    sql: `DELETE FROM VoiceRoomParticipant 
          WHERE roomId = ? 
          AND userId != (SELECT hostId FROM VoiceRoom WHERE id = ?)
          AND (
            (lastSeen IS NOT NULL AND lastSeen < datetime('now', '-60 seconds'))
            OR (lastSeen IS NULL AND joinedAt < datetime('now', '-60 seconds'))
          )`,
    args: [roomId, roomId],
  });
  return result.rowsAffected;
}

export async function updateParticipantLastSeen(roomId: string, userId: string): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({
    sql: `UPDATE VoiceRoomParticipant SET lastSeen = datetime('now') WHERE roomId = ? AND userId = ?`,
    args: [roomId, userId],
  });
}

export async function toggleMicInRoom(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT isMuted, micFrozen FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (result.rows.length === 0) return false;
  const current = Boolean(result.rows[0].isMuted);
  const frozen = Boolean(result.rows[0].micFrozen);
  if (!current && frozen) return current; // Can't unmute if frozen
  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET isMuted = ? WHERE roomId = ? AND userId = ?', args: [current ? 0 : 1, roomId, userId] });
  return !current;
}

export async function sendGiftInRoom(roomId: string, giftId: string, fromUserId: string, toUserId: string | undefined, quantity?: number, unitPrice?: number): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const c = getClient();
  await ensureAdminTables();
  const qty = quantity || 1;

  // Use provided unitPrice, or look up from DB
  let price = unitPrice || 0;
  if (!price) {
    const giftResult = await c.execute({ sql: 'SELECT price FROM Gift WHERE id = ? AND isActive = 1', args: [giftId] });
    if (giftResult.rows.length === 0) {
      return { success: false, newBalance: 0, error: 'الهدية غير موجودة' };
    }
    price = Number(giftResult.rows[0].price) || 0;
  }
  const totalCost = price * qty;

  if (totalCost <= 0) {
    return { success: false, newBalance: 0, error: 'سعر الهدية غير صالح' };
  }

  // Get sender's gemsBalance
  const senderResult = await c.execute({
    sql: `SELECT s.gemsBalance FROM Subscription s JOIN AppUser u ON u.subscriptionId = s.id WHERE u.id = ? AND u.isActive = 1`,
    args: [fromUserId],
  });
  if (senderResult.rows.length === 0) {
    return { success: false, newBalance: 0, error: 'المستخدم غير موجود' };
  }
  const senderBalance = Number(senderResult.rows[0].gemsBalance ?? 0);
  if (senderBalance < totalCost) {
    return { success: false, newBalance: senderBalance, error: 'رصيد الجواهر غير كافٍ' };
  }

  // Deduct gems from sender
  const newSenderBalance = senderBalance - totalCost;
  await c.execute({
    sql: `UPDATE Subscription SET gemsBalance = gemsBalance - ? WHERE id IN (SELECT subscriptionId FROM AppUser WHERE id = ?)`,
    args: [totalCost, fromUserId],
  });

  // If toUserId is provided, add gems to receiver
  if (toUserId) {
    await c.execute({
      sql: `UPDATE Subscription SET gemsBalance = gemsBalance + ? WHERE id IN (SELECT subscriptionId FROM AppUser WHERE id = ?)`,
      args: [totalCost, toUserId],
    });
  }

  // Insert the GiftHistory record
  await c.execute({
    sql: 'INSERT INTO GiftHistory (id, giftId, fromUserId, toUserId, roomId, quantity) VALUES (?, ?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), giftId, fromUserId, toUserId || '', roomId, qty],
  });

  return { success: true, newBalance: newSenderBalance };
}

export async function getUserGemsBalance(userId: string): Promise<number> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: `SELECT s.gemsBalance FROM Subscription s 
          JOIN AppUser u ON u.subscriptionId = s.id 
          WHERE u.id = ? AND u.isActive = 1`,
    args: [userId],
  });
  if (result.rows.length === 0) return 0;
  return Number(result.rows[0].gemsBalance ?? 0);
}

// Get top gifts sent in a room (for Moments tab)
export async function getRoomTopGifts(roomId: string, limit: number = 20): Promise<Array<{
  giftName: string; giftEmoji: string; gems: number;
  senderName: string; senderAvatar: string;
  receiverName: string; receiverAvatar: string;
  createdAt: string;
}>> {
  const c = getClient();
  await ensureAdminTables();

  const result = await c.execute({
    sql: `SELECT gh.giftId, gh.fromUserId, gh.toUserId, gh.createdAt,
                 g.nameAr as giftName, g.emoji as giftEmoji, g.price as gems,
                 fu.displayName as senderName, fu.avatar as senderAvatar,
                 tu.displayName as receiverName, tu.avatar as receiverAvatar
          FROM GiftHistory gh
          JOIN Gift g ON gh.giftId = g.id
          LEFT JOIN VoiceRoomParticipant fu ON fu.roomId = ? AND fu.userId = gh.fromUserId
          LEFT JOIN VoiceRoomParticipant tu ON tu.roomId = ? AND tu.userId = gh.toUserId
          WHERE gh.roomId = ?
          ORDER BY g.price DESC
          LIMIT ?`,
    args: [roomId, roomId, roomId, limit],
  });

  return result.rows.map(row => ({
    giftName: (row.giftName as string) || '',
    giftEmoji: (row.giftEmoji as string) || '',
    gems: Number(row.gems) || 0,
    senderName: (row.senderName as string) || 'مجهول',
    senderAvatar: (row.senderAvatar as string) || '',
    receiverName: (row.receiverName as string) || 'مجهول',
    receiverAvatar: (row.receiverAvatar as string) || '',
    createdAt: row.createdAt as string,
  }));
}

export async function deleteVoiceRoom(roomId: string, hostId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'DELETE FROM VoiceRoom WHERE id = ? AND hostId = ?', args: [roomId, hostId] });
  if (result.rowsAffected > 0) {
    await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomBan WHERE roomId = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomActionLog WHERE roomId = ?', args: [roomId] });
    return true;
  }
  return false;
}

export async function getGifts(): Promise<Gift[]> {
  const c = getClient();
  await ensureAdminTables();
  await seedGifts();
  const result = await c.execute({ sql: 'SELECT * FROM Gift WHERE isActive = 1 ORDER BY price', args: [] });
  return result.rows.map(row => ({ id: row.id as string, name: row.name as string, nameAr: row.nameAr as string, emoji: (row.emoji as string) || '', price: Number(row.price) || 0, isActive: Boolean(row.isActive) }));
}

async function seedGifts(): Promise<void> {
  const c = getClient();
  const count = await c.execute({ sql: 'SELECT COUNT(*) as c FROM Gift', args: [] });
  if (Number(count.rows[0].c) > 0) return;
  const gifts = [
    // Popular
    { name: 'Rose', nameAr: 'ورد', emoji: '🌹', price: 3 },
    { name: 'Star', nameAr: 'نجمة', emoji: '⭐', price: 9 },
    { name: 'Heart', nameAr: 'قلب', emoji: '💖', price: 19 },
    { name: 'Fire', nameAr: 'نار', emoji: '🔥', price: 49 },
    // Luxury
    { name: 'GiftBox', nameAr: 'هدية', emoji: '🎁', price: 99 },
    { name: 'Crown', nameAr: 'تاج', emoji: '👑', price: 199 },
    { name: 'Rose99', nameAr: 'بوكيه ورد', emoji: '💐', price: 520 },
    { name: 'Rocket', nameAr: 'صاروخ', emoji: '🚀', price: 1314 },
    // Special
    { name: 'Diamond', nameAr: 'ماسة', emoji: '💎', price: 2999 },
    { name: 'Trophy', nameAr: 'كأس', emoji: '🏆', price: 5200 },
    { name: 'GoldStar', nameAr: 'نجم ذهبي', emoji: '🌟', price: 10000 },
    { name: 'Castle', nameAr: 'قلعة', emoji: '🏰', price: 52000 },
    // Live SVGA Gifts
    { name: 'RedSportsCar', nameAr: 'سيارة حمراء رياضية', emoji: '🔴', price: 1314 },
    { name: 'SuperRocket', nameAr: 'صاروخ خارق', emoji: '🚀', price: 52000 },
    { name: 'GodOfWealth', nameAr: 'إله الثروة', emoji: '💰', price: 9999 },
    { name: 'PurpleCastle', nameAr: 'قلعة بنفسجية', emoji: '🏰', price: 6666 },
    { name: 'Pegasus', nameAr: 'حصان مجنح', emoji: '🐴', price: 5200 },
    { name: 'LoveBottle', nameAr: 'زجاجة حب', emoji: '💌', price: 520 },
    { name: 'HeartCopter', nameAr: 'مروحية قلوب', emoji: '💖', price: 999 },
    { name: 'HappyCarriage', nameAr: 'عربة السعادة', emoji: '🐴', price: 666 },
    { name: 'HeartBalloons', nameAr: 'بالون القلوب', emoji: '🎈', price: 520 },
    { name: 'LoveBear', nameAr: 'دب القلوب', emoji: '🧸', price: 1314 },
    { name: 'ShinyDiamond', nameAr: 'ماسة متوهجة', emoji: '💎', price: 10000 },
    { name: 'PurpleRose', nameAr: 'وردة بنفسجية', emoji: '💜', price: 1314 },
    { name: 'Lucky666', nameAr: '666 محظوظ', emoji: '🎲', price: 666 },
    { name: 'LvBag', nameAr: 'حقيبة LV', emoji: '👜', price: 5200 },
  ];
  for (const g of gifts) {
    await c.execute({ sql: 'INSERT INTO Gift (id, name, nameAr, emoji, price) VALUES (?, ?, ?, ?, ?)', args: [crypto.randomUUID(), g.name, g.nameAr, g.emoji, g.price] });
  }
}

// 6. banUserFromRoom
export async function banUserFromRoom(roomId: string, targetUserId: string, actorId: string, reason: string = ''): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Get actor name
  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  // Get target name
  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  // Check not already banned
  const existing = await c.execute({ sql: 'SELECT id FROM RoomBan WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (existing.rows.length > 0) return true;

  await c.execute({
    sql: 'INSERT INTO RoomBan (id, roomId, userId, bannedBy, reason) VALUES (?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), roomId, targetUserId, actorId, reason],
  });

  // Remove from participants
  await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  // Remove from waitlist
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });

  await logAction(roomId, actorId, actorName, 'ban', targetUserId, targetName, reason);
  return true;
}

// 7. unbanUserFromRoom
export async function unbanUserFromRoom(roomId: string, targetUserId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'DELETE FROM RoomBan WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  return true;
}

// 8. getBannedUsers
export async function getBannedUsers(roomId: string): Promise<RoomBan[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM RoomBan WHERE roomId = ? ORDER BY createdAt DESC', args: [roomId] });
  return result.rows.map(row => ({
    id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
    bannedBy: row.bannedBy as string, reason: (row.reason as string) || '',
    createdAt: row.createdAt as string,
  }));
}

// 9. isUserBanned
export async function isUserBanned(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT id FROM RoomBan WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  return result.rows.length > 0;
}

// 10. kickFromMic
export async function kickFromMic(roomId: string, targetUserId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await c.execute({
    sql: 'UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = \'open\', isMuted = 0 WHERE roomId = ? AND userId = ?',
    args: [roomId, targetUserId],
  });

  await logAction(roomId, actorId, actorName, 'kick_from_mic', targetUserId, targetName, '');
  return true;
}

// 11. freezeSeat
export async function freezeSeat(roomId: string, targetUserId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actor = actorResult.rows[0] as Record<string, unknown> | undefined;
  if (!actor) return false;
  const actorRole = actor.role as RoomRole;
  // Only owner/coowner can freeze
  if (ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.coowner) return false;

  const actorName = (actor.username || actor.displayName || '') as string;
  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET micFrozen = 1 WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  await logAction(roomId, actorId, actorName, 'freeze_seat', targetUserId, targetName, '');
  return true;
}

// 12. unfreezeSeat
export async function unfreezeSeat(roomId: string, targetUserId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET micFrozen = 0 WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  return true;
}

// 13. muteUserChat
export async function muteUserChat(roomId: string, targetUserId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await logAction(roomId, actorId, actorName, 'mute_chat', targetUserId, targetName, '');
  return true;
}

// 14. assignSeat
export async function assignSeat(roomId: string, userId: string, seatIndex: number, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  // Kick anyone currently on that seat
  await c.execute({
    sql: "UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = 'open', isMuted = 0 WHERE roomId = ? AND seatIndex = ?",
    args: [roomId, seatIndex],
  });

  // Assign the user to the seat
  await c.execute({
    sql: "UPDATE VoiceRoomParticipant SET seatIndex = ?, seatStatus = 'open' WHERE roomId = ? AND userId = ?",
    args: [seatIndex, roomId, userId],
  });

  // Verify after write: confirm the target user actually owns the seat
  const verifyAssign = await c.execute({
    sql: 'SELECT userId FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ?',
    args: [roomId, seatIndex],
  });
  if (!verifyAssign.rows.some(r => r.userId === userId)) {
    return false; // Race condition: someone else took the seat
  }

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await logAction(roomId, actorId, actorName, 'assign_seat', userId, targetName, `Seat ${seatIndex}`);
  return true;
}

// 15. requestSeat
export async function requestSeat(roomId: string, userId: string, username: string, displayName: string, avatar: string, vipLevel: number, requestedSeat: number = -1): Promise<{ success: boolean; autoAssigned?: boolean; seatIndex?: number; error?: string }> {
  const c = getClient();
  await ensureAdminTables();

  // Get user role to determine if they can sit directly
  const participantRow = await c.execute({ sql: 'SELECT role, seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  const userRole = participantRow.rows.length > 0 ? (participantRow.rows[0].role as string) : 'visitor';
  const currentSeat = participantRow.rows.length > 0 ? Number(participantRow.rows[0].seatIndex) : -1;

  // Only the actual accepted role grants mic access — pendingRole is just an invitation
  const canSitDirectly = ['member', 'admin', 'coowner', 'owner'].includes(userRole);

  // Check if user is already on this exact seat
  if (currentSeat === requestedSeat) {
    return { success: false };
  }

  // Check if auto mode is on
  const roomResult = await c.execute({ sql: 'SELECT micSeatCount, isAutoMode, lockedSeats, guestMicEnabled, memberMicEnabled FROM VoiceRoom WHERE id = ?', args: [roomId] });
  if (roomResult.rows.length === 0) return { success: false };
  const room = roomResult.rows[0];
  const micCount = Number(room.micSeatCount) || 10;
  const isAutoMode = Boolean(room.isAutoMode);
  const guestMicEnabled = Boolean(room.guestMicEnabled);
  const memberMicEnabled = Boolean(room.memberMicEnabled);
  const lockedSeats: number[] = [];
  try { const ls = JSON.parse(room.lockedSeats as string || '[]'); if (Array.isArray(ls)) ls.forEach((s: any) => lockedSeats.push(Number(s))); } catch {}

  // Check mic permissions: visitors and members
  // In auto mode, visitors can only sit if guestMicEnabled is true
  // Members can always sit in auto mode
  if (!canSitDirectly && !guestMicEnabled) {
    // Visitor with guest mic disabled — cannot sit even in auto mode
    return { success: false, error: 'المايك للأعضاء فقط - اطلب العضوية من إدارة الغرفة' };
  }

  if (isAutoMode || (canSitDirectly && memberMicEnabled) || (canSitDirectly && ['admin', 'coowner', 'owner'].includes(userRole)) || (!canSitDirectly && guestMicEnabled)) {
    // Find an open seat
    const occupiedSeats = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex >= 0 AND userId != ?', args: [roomId, userId] });
    const occupied = new Set(occupiedSeats.rows.map(r => Number(r.seatIndex)));

    let targetSeat = requestedSeat >= 0 ? requestedSeat : -1;
    // Check if target seat is valid
    if (targetSeat >= 0) {
      if (lockedSeats.includes(targetSeat) || targetSeat >= micCount) {
        targetSeat = -1; // Locked or invalid, find another
      } else if (occupied.has(targetSeat)) {
        // If admin/owner moving to an occupied seat, kick the occupant first
        if (canSitDirectly) {
          // Remove the person currently on this seat
          await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = ?, isMuted = 0 WHERE roomId = ? AND seatIndex = ?', args: ['open', roomId, targetSeat] });
          // Re-check: another admin may have taken this seat between our check and update
          const recheck = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ? AND userId != ?', args: [roomId, targetSeat, userId] });
          if (recheck.rows.length > 0) {
            targetSeat = -1; // Seat was taken by someone else after our kick
          }
        } else {
          targetSeat = -1; // Regular user can't take occupied seat
        }
      }
    }
    if (targetSeat < 0) {
      for (let i = 0; i < micCount; i++) {
        if (!occupied.has(i) && !lockedSeats.includes(i)) { targetSeat = i; break; }
      }
    }

    if (targetSeat >= 0) {
      // If user is already on a different seat, move them (preserve mute state)
      if (currentSeat >= 0) {
        // Get current mute state to preserve it
        const muteResult = await c.execute({ sql: 'SELECT isMuted FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
        const currentMute = muteResult.rows.length > 0 ? Number(muteResult.rows[0].isMuted) : 1;
        // Atomic claim: check seat is still free AND assign in one update
        await c.execute({
          sql: `UPDATE VoiceRoomParticipant SET seatIndex = ?, seatStatus = 'open', isMuted = ?
                WHERE roomId = ? AND userId = ?
                AND NOT EXISTS (
                  SELECT 1 FROM VoiceRoomParticipant p2
                  WHERE p2.roomId = ? AND p2.seatIndex = ? AND p2.userId != ?
                )`,
          args: [targetSeat, currentMute, roomId, userId, roomId, targetSeat, userId],
        });
      } else {
        // New to mic: atomic claim — only succeed if seat is still free
        await c.execute({
          sql: `UPDATE VoiceRoomParticipant SET seatIndex = ?, seatStatus = 'open', isMuted = 1
                WHERE roomId = ? AND userId = ? AND seatIndex < 0
                AND NOT EXISTS (
                  SELECT 1 FROM VoiceRoomParticipant p2
                  WHERE p2.roomId = ? AND p2.seatIndex = ? AND p2.userId != ?
                )`,
          args: [targetSeat, roomId, userId, roomId, targetSeat, userId],
        });
      }
      // ── Verify after write: confirm WE actually own this seat ──
      // This catches race conditions where rowsAffected may be unreliable
      // (libsql/Turso distributed edge case)
      const verify = await c.execute({
        sql: 'SELECT userId FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ?',
        args: [roomId, targetSeat],
      });
      if (!verify.rows.some(r => r.userId === userId)) {
        // Someone else got the seat — undo our assignment
        await c.execute({
          sql: 'UPDATE VoiceRoomParticipant SET seatIndex = -1, isMuted = 1 WHERE roomId = ? AND userId = ? AND seatIndex = ?',
          args: [roomId, userId, targetSeat],
        });
        return { success: false, error: 'المقعد لم يعد متاحاً، حاول مرة أخرى' };
      }
      return { success: true, autoAssigned: true, seatIndex: targetSeat };
    }
  }

  // Visitors in non-auto mode: add to waitlist (only if not already on a seat)
  if (currentSeat >= 0) return { success: false };

  // Add to waitlist
  const existingWaitlist = await c.execute({ sql: 'SELECT id FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (existingWaitlist.rows.length > 0) return { success: false };

  await c.execute({
    sql: 'INSERT INTO RoomWaitlist (id, roomId, userId, username, displayName, avatar, vipLevel, requestedSeat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), roomId, userId, username, displayName, avatar, vipLevel, requestedSeat],
  });

  return { success: true, autoAssigned: false };
}

// 16. approveWaitlist
export async function approveWaitlist(waitlistId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const wlResult = await c.execute({ sql: 'SELECT * FROM RoomWaitlist WHERE id = ?', args: [waitlistId] });
  if (wlResult.rows.length === 0) return false;
  const wl = wlResult.rows[0] as Record<string, unknown>;

  // Permission check: admin+ only
  const actorPermResult = await c.execute({ sql: 'SELECT role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [wl.roomId, actorId] });
  if (actorPermResult.rows.length === 0) return false;
  const actorRole = actorPermResult.rows[0].role as string;
  if (ROLE_HIERARCHY[actorRole as RoomRole] < ROLE_HIERARCHY['admin' as RoomRole]) return false;

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [wl.roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  // Find an open seat for the user
  const roomResult = await c.execute({ sql: 'SELECT micSeatCount FROM VoiceRoom WHERE id = ?', args: [wl.roomId] });
  if (roomResult.rows.length === 0) return false;
  const micCount = Number(roomResult.rows[0].micSeatCount) || 10;

  const occupiedSeats = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex >= 0', args: [wl.roomId] });
  const occupied = new Set(occupiedSeats.rows.map(r => Number(r.seatIndex)));

  let targetSeat = Number(wl.requestedSeat) >= 0 ? Number(wl.requestedSeat) : -1;
  if (targetSeat < 0 || occupied.has(targetSeat)) {
    targetSeat = -1;
    for (let i = 0; i < micCount; i++) {
      if (!occupied.has(i)) { targetSeat = i; break; }
    }
  }

  if (targetSeat < 0) return false; // No seats available

  // Assign seat
  await c.execute({
    sql: "UPDATE VoiceRoomParticipant SET seatIndex = ?, seatStatus = 'open' WHERE roomId = ? AND userId = ?",
    args: [targetSeat, wl.roomId, wl.userId],
  });

  // Verify after write: confirm seat is ours
  const verifyWL = await c.execute({
    sql: 'SELECT userId FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ?',
    args: [wl.roomId, targetSeat],
  });
  if (!verifyWL.rows.some(r => r.userId === wl.userId)) {
    // Race condition: seat taken by someone else
    return false;
  }

  // Remove from waitlist
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE id = ?', args: [waitlistId] });

  await logAction(wl.roomId as string, actorId, actorName, 'approve_waitlist', wl.userId as string, (wl.username || wl.displayName || '') as string, `Seat ${targetSeat}`);
  return true;
}

// 17. rejectWaitlist
export async function rejectWaitlist(waitlistId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const wlResult = await c.execute({ sql: 'SELECT * FROM RoomWaitlist WHERE id = ?', args: [waitlistId] });
  if (wlResult.rows.length === 0) return false;
  const wl = wlResult.rows[0] as Record<string, unknown>;

  // Permission check: admin+ only
  const actorPermResult = await c.execute({ sql: 'SELECT role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [wl.roomId, actorId] });
  if (actorPermResult.rows.length === 0) return false;
  const actorRole = actorPermResult.rows[0].role as string;
  if (ROLE_HIERARCHY[actorRole as RoomRole] < ROLE_HIERARCHY['admin' as RoomRole]) return false;

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [wl.roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE id = ?', args: [waitlistId] });

  await logAction(wl.roomId as string, actorId, actorName, 'reject_waitlist', wl.userId as string, (wl.username || wl.displayName || '') as string, '');
  return true;
}

// 18. getWaitlist
export async function getWaitlist(roomId: string): Promise<RoomWaitlist[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: 'SELECT * FROM RoomWaitlist WHERE roomId = ? ORDER BY vipLevel DESC, createdAt ASC',
    args: [roomId],
  });
  return result.rows.map(row => ({
    id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
    username: row.username as string, displayName: row.displayName as string, avatar: row.avatar as string,
    vipLevel: Number(row.vipLevel) || 0, requestedSeat: Number(row.requestedSeat) ?? -1,
    createdAt: row.createdAt as string,
  }));
}

// 19. changeUserRole
// Get persistent room members (includes members not currently in room)
export async function getRoomMembers(roomId: string): Promise<Array<{ userId: string; username: string; displayName: string; avatar: string; role: string; grantedAt: string }>> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: `SELECT rm.userId, rm.role as memberRole, rm.grantedAt,
                 COALESCE(vrp.username, au.username, '') as username,
                 COALESCE(vrp.displayName, au.displayName, '') as displayName,
                 COALESCE(vrp.avatar, au.avatar, '') as avatar
          FROM RoomMember rm
          LEFT JOIN VoiceRoomParticipant vrp ON vrp.roomId = rm.roomId AND vrp.userId = rm.userId
          LEFT JOIN AppUser au ON au.id = rm.userId
          WHERE rm.roomId = ?
          ORDER BY CASE rm.role
            WHEN 'coowner' THEN 0 WHEN 'admin' THEN 1 WHEN 'member' THEN 2 ELSE 3 END,
            rm.grantedAt ASC`,
    args: [roomId],
  });
  return result.rows.map(r => ({
    userId: r.userId as string,
    username: (r.username as string) || '',
    displayName: (r.displayName as string) || '',
    avatar: (r.avatar as string) || '',
    role: (r.memberRole as string) || 'member',
    grantedAt: (r.grantedAt as string) || '',
  }));
}

export async function changeUserRole(roomId: string, targetUserId: string, newRole: RoomRole, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Get actor info
  const actorResult = await c.execute({ sql: 'SELECT username, displayName, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  if (actorResult.rows.length === 0) return false;
  const actor = actorResult.rows[0] as Record<string, unknown>;
  const actorRole = actor.role as RoomRole;
  const actorName = (actor.username || actor.displayName || '') as string;

  // Get target info
  const targetResult = await c.execute({ sql: 'SELECT username, displayName, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const target = targetResult.rows[0] as Record<string, unknown>;
  const targetRole = target.role as RoomRole;
  const targetName = (target.username || target.displayName || '') as string;

  // Cannot change role of someone with higher or equal role
  if (ROLE_HIERARCHY[targetRole] >= ROLE_HIERARCHY[actorRole]) return false;

  // Only owner can set coowner or admin
  if ((newRole === 'coowner' || newRole === 'admin') && ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.owner) return false;

  // Coowner can ONLY give membership (member role) — nothing else
  if (ROLE_HIERARCHY[actorRole] === ROLE_HIERARCHY.coowner && newRole !== 'member') return false;

  // Cannot promote someone to your level or above
  if (ROLE_HIERARCHY[newRole] >= ROLE_HIERARCHY[actorRole]) return false;

  // If demoting from a seated role, also remove from mic seat
  const seatResult = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ? AND seatIndex >= 0', args: [roomId, targetUserId] });
  if (seatResult.rows.length > 0 && newRole === 'visitor') {
    await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = "open" WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  }

  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET role = ?, pendingRole = "" WHERE roomId = ? AND userId = ?', args: [newRole, roomId, targetUserId] });

  // Persist membership in RoomMember table (survives leave/rejoin)
  if (newRole === 'member' || newRole === 'admin' || newRole === 'coowner') {
    try {
      await c.execute({
        sql: `INSERT INTO RoomMember (id, roomId, userId, role, grantedBy)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(roomId, userId) DO UPDATE SET role = excluded.role, grantedBy = excluded.grantedBy`,
        args: [crypto.randomUUID(), roomId, targetUserId, newRole, actorId],
      });
    } catch (err) {
      console.error('[changeUserRole] Failed to persist RoomMember:', err);
    }
  } else if (newRole === 'visitor') {
    // If demoted to visitor, remove persistent membership
    try {
      await c.execute({ sql: 'DELETE FROM RoomMember WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
    } catch (err) {
      console.error('[changeUserRole] Failed to remove RoomMember:', err);
    }
  }

  await logAction(roomId, actorId, actorName, 'change_role', targetUserId, targetName, `${targetRole} -> ${newRole}`);
  return true;
}

// Helper: ensure a specific column exists in a table
async function ensureColumn(tableName: string, columnName: string, columnDef: string): Promise<boolean> {
  const c = getClient();
  try {
    const cols = await c.execute({ sql: `PRAGMA table_info(${tableName})`, args: [] });
    if (cols.rows.some((r) => r.name === columnName)) return true;
    await c.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    console.log(`[ensureColumn] Added ${tableName}.${columnName}`);
    return true;
  } catch (err) {
    console.error(`[ensureColumn] Failed to add ${tableName}.${columnName}:`, err);
    return false;
  }
}

// 22b. Invite a user to a role (sets pendingRole instead of directly changing)
export async function inviteRoleToRoom(roomId: string, targetUserId: string, newRole: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  
  // Force-ensure pendingRole column exists
  await ensureColumn('VoiceRoomParticipant', 'pendingRole', "TEXT DEFAULT ''");
  
  const actorResult = await c.execute({ sql: 'SELECT role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  if (actorResult.rows.length === 0) return false;
  const actorRole = actorResult.rows[0].role as string;
  
  const targetResult = await c.execute({ sql: 'SELECT role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetRole = targetResult.rows[0].role as string;
  
  // Owner and co-owner can send role invitations
  if (ROLE_HIERARCHY[actorRole as RoomRole] < ROLE_HIERARCHY['coowner' as RoomRole]) return false;
  if (ROLE_HIERARCHY[targetRole as RoomRole] >= ROLE_HIERARCHY[actorRole as RoomRole]) return false;
  // Cannot promote above own level
  if (ROLE_HIERARCHY[newRole as RoomRole] >= ROLE_HIERARCHY[actorRole as RoomRole]) return false;
  
  // Set pendingRole (user must accept via dialog)
  try {
    await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET pendingRole = ? WHERE roomId = ? AND userId = ?', args: [newRole, roomId, targetUserId] });
    console.log(`[inviteRoleToRoom] Set pendingRole='${newRole}' for userId=${targetUserId} in room=${roomId}`);
  } catch (err) {
    console.error('[inviteRoleToRoom] Failed to set pendingRole:', err);
    return false;
  }
  
  // Log action
  await c.execute({ sql: 'INSERT INTO RoomActionLog (id, roomId, actorId, actorName, action, targetId, targetName, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', args: [
    crypto.randomUUID(), roomId, actorId, '', 'invite-role', targetUserId, '', `دعوة لتغيير الدور إلى ${newRole}`,
  ]});
  
  return true;
}

export async function acceptRoleInvite(roomId: string, userId: string): Promise<{ success: boolean; role?: string }> {
  const c = getClient();
  await ensureAdminTables();
  
  // Force-ensure pendingRole column exists
  await ensureColumn('VoiceRoomParticipant', 'pendingRole', "TEXT DEFAULT ''");
  
  try {
    // First, check current state
    const check = await c.execute({ sql: 'SELECT pendingRole, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
    if (check.rows.length === 0) {
      console.log(`[acceptRoleInvite] Participant not found: roomId=${roomId} userId=${userId}`);
      return { success: false };
    }
    const currentPending = String(check.rows[0].pendingRole || '').trim();
    const currentRole = String(check.rows[0].role || 'visitor');
    
    if (!currentPending) {
      console.log(`[acceptRoleInvite] No pending role: roomId=${roomId} userId=${userId}, pendingRole='${check.rows[0].pendingRole}'`);
      return { success: false };
    }
    
    // Atomic UPDATE: set role = pendingRole and clear pendingRole
    const result = await c.execute({
      sql: `UPDATE VoiceRoomParticipant 
            SET role = ?, pendingRole = '' 
            WHERE roomId = ? AND userId = ?`,
      args: [currentPending, roomId, userId],
    });
    
    if (result.rowsAffected === 0) {
      // Fallback: try to clear pendingRole to prevent infinite loop
      await c.execute({ sql: "UPDATE VoiceRoomParticipant SET pendingRole = '' WHERE roomId = ? AND userId = ?", args: [roomId, userId] });
      console.log(`[acceptRoleInvite] Failed to update but cleared pendingRole: roomId=${roomId} userId=${userId}`);
      return { success: false };
    }
    
    // Persist membership in RoomMember table so it survives leave/rejoin
    if (currentPending === 'member' || currentPending === 'admin' || currentPending === 'coowner') {
      try {
        await c.execute({
          sql: `INSERT INTO RoomMember (id, roomId, userId, role, grantedBy)
                VALUES (?, ?, ?, ?, '')
                ON CONFLICT(roomId, userId) DO UPDATE SET role = excluded.role`,
          args: [crypto.randomUUID(), roomId, userId, currentPending],
        });
        console.log(`[acceptRoleInvite] Persisted RoomMember: role='${currentPending}' for userId=${userId}`);
      } catch (err) {
        console.error('[acceptRoleInvite] Failed to persist RoomMember:', err);
      }
    }
    
    console.log(`[acceptRoleInvite] Accepted! role='${currentPending}' (was '${currentRole}') for userId=${userId}`);
    return { success: true, role: currentPending };
  } catch (err) {
    console.error('[acceptRoleInvite] DB error:', err);
    // On DB error, try to clear pendingRole to prevent infinite dialog loop
    try {
      await c.execute({ sql: "UPDATE VoiceRoomParticipant SET pendingRole = '' WHERE roomId = ? AND userId = ?", args: [roomId, userId] });
    } catch { /* ignore */ }
    return { success: false };
  }
}

export async function rejectRoleInvite(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  
  // Force-ensure pendingRole column exists
  await ensureColumn('VoiceRoomParticipant', 'pendingRole', "TEXT DEFAULT ''");
  
  try {
    const result = await c.execute({ sql: 'SELECT pendingRole FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
    if (result.rows.length === 0) return false;
    const pendingRole = String(result.rows[0].pendingRole || '');
    
    // If member invitation was rejected, revert role to visitor
    if (pendingRole === 'member') {
      await c.execute({ sql: "UPDATE VoiceRoomParticipant SET role = 'visitor', pendingRole = '' WHERE roomId = ? AND userId = ?", args: [roomId, userId] });
    } else {
      await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET pendingRole = "" WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
    }
  } catch (err) {
    console.error('[rejectRoleInvite] DB error:', err);
  }
  return true;
}

// 22c. Invite a user to a specific mic seat (admin sends, user accepts/rejects)
export async function inviteToMic(roomId: string, targetUserId: string, seatIndex: number, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Force-ensure pendingMicInvite column exists
  await ensureColumn('VoiceRoomParticipant', 'pendingMicInvite', 'INTEGER DEFAULT -1');

  // Verify actor is admin+
  const actorResult = await c.execute({ sql: 'SELECT role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  if (actorResult.rows.length === 0) return false;
  const actorRole = actorResult.rows[0].role as string;
  if (ROLE_HIERARCHY[actorRole as RoomRole] < ROLE_HIERARCHY['admin' as RoomRole]) return false;

  // Verify target is in the room
  const targetResult = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  if (Number(targetResult.rows[0].seatIndex) >= 0) return false; // Already on a seat

  // Verify seat is empty
  const seatResult = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ?', args: [roomId, seatIndex] });
  if (seatResult.rows.length > 0) return false; // Seat is occupied

  // Set pending mic invite
  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET pendingMicInvite = ? WHERE roomId = ? AND userId = ?', args: [seatIndex, roomId, targetUserId] });

  // Log action
  const actorNameResult = await c.execute({ sql: 'SELECT displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorNameResult.rows[0]?.displayName || '') as string;
  const targetNameResult = await c.execute({ sql: 'SELECT displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  const targetName = (targetNameResult.rows[0]?.displayName || '') as string;
  await logAction(roomId, actorId, actorName, 'invite-to-mic', targetUserId, targetName, `Seat ${seatIndex + 1}`);

  return true;
}

// 22d. Accept mic invitation
export async function acceptMicInvite(roomId: string, userId: string): Promise<{ success: boolean; seatIndex?: number }> {
  const c = getClient();
  await ensureAdminTables();

  // Force-ensure pendingMicInvite column exists
  await ensureColumn('VoiceRoomParticipant', 'pendingMicInvite', 'INTEGER DEFAULT -1');

  const result = await c.execute({ sql: 'SELECT pendingMicInvite FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ? AND pendingMicInvite >= 0', args: [roomId, userId] });
  if (result.rows.length === 0) return { success: false };

  const seatIndex = Number(result.rows[0].pendingMicInvite);

  // Verify seat is still empty
  const seatResult = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ?', args: [roomId, seatIndex] });
  if (seatResult.rows.length > 0) {
    // Seat taken, clear invite
    await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET pendingMicInvite = -1 WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
    return { success: false };
  }

  // Assign seat
  await c.execute({ sql: "UPDATE VoiceRoomParticipant SET seatIndex = ?, seatStatus = 'open', pendingMicInvite = -1 WHERE roomId = ? AND userId = ?", args: [seatIndex, roomId, userId] });

  // Verify after write: confirm seat is ours
  const verifyMic = await c.execute({
    sql: 'SELECT userId FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ?',
    args: [roomId, seatIndex],
  });
  if (!verifyMic.rows.some(r => r.userId === userId)) {
    // Race condition: seat taken
    await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET pendingMicInvite = -1 WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
    return { success: false };
  }

  return { success: true, seatIndex };
}

// 22e. Reject mic invitation
export async function rejectMicInvite(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET pendingMicInvite = -1 WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  return true;
}

// 20. transferOwnership
export async function transferOwnership(roomId: string, newOwnerId: string, currentOwnerId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Verify current owner
  const ownerResult = await c.execute({ sql: 'SELECT username, displayName, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, currentOwnerId] });
  if (ownerResult.rows.length === 0) return false;
  const owner = ownerResult.rows[0] as Record<string, unknown>;
  if (owner.role !== 'owner') return false;
  const ownerName = (owner.username || owner.displayName || '') as string;

  // Get new owner info
  const newOwnerResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, newOwnerId] });
  if (newOwnerResult.rows.length === 0) return false;
  const newOwner = newOwnerResult.rows[0] as Record<string, unknown>;
  const newOwnerName = (newOwner.username || newOwner.displayName || '') as string;

  // Demote current owner to coowner
  await c.execute({ sql: "UPDATE VoiceRoomParticipant SET role = 'coowner' WHERE roomId = ? AND userId = ?", args: [roomId, currentOwnerId] });

  // Promote new owner
  await c.execute({ sql: "UPDATE VoiceRoomParticipant SET role = 'owner' WHERE roomId = ? AND userId = ?", args: [roomId, newOwnerId] });

  // Update VoiceRoom host
  await c.execute({ sql: 'UPDATE VoiceRoom SET hostId = ?, hostName = ? WHERE id = ?', args: [newOwnerId, newOwnerName, roomId] });

  await logAction(roomId, currentOwnerId, ownerName, 'transfer_ownership', newOwnerId, newOwnerName, '');
  return true;
}

// 21. updateRoomSettings
export async function updateRoomSettings(roomId: string, settings: Partial<VoiceRoom>, userId: string): Promise<VoiceRoom | null> {
  const c = getClient();
  await ensureAdminTables();

  // Get actor role
  const actorResult = await c.execute({ sql: 'SELECT role, username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (actorResult.rows.length === 0) return null;
  const actor = actorResult.rows[0] as Record<string, unknown>;
  const actorRole = actor.role as RoomRole;
  const actorName = (actor.username || actor.displayName || '') as string;

  // Owner-only settings
  const ownerOnlyKeys = ['roomMode', 'roomPassword', 'micTheme', 'giftSplit', 'micSeatCount', 'roomImage'];
  // Owner/coowner settings
  const adminKeys = ['chatMuted', 'bgmEnabled', 'announcement', 'isAutoMode', 'roomLevel'];
  // Known VoiceRoom columns (ignore unknown keys)
  const knownColumns = ['roomMode', 'roomPassword', 'micTheme', 'giftSplit', 'micSeatCount',
    'chatMuted', 'bgmEnabled', 'announcement', 'isAutoMode', 'roomLevel', 'name', 'description',
    'maxParticipants', 'lockedSeats', 'roomImage', 'roomAvatar', 'guestMicEnabled', 'memberMicEnabled'];

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(settings)) {
    if (val === undefined) continue;
    // Skip unknown columns to avoid DB errors
    if (!knownColumns.includes(key)) continue;

    // Check permissions
    if (ownerOnlyKeys.includes(key) && ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.owner) continue;
    if (adminKeys.includes(key) && ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.coowner) continue;

    // Handle boolean to integer conversion
    if (key === 'chatMuted' || key === 'bgmEnabled' || key === 'isAutoMode') {
      setClauses.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'roomMode') {
      setClauses.push(`${key} = ?`);
      values.push(val as string);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (setClauses.length === 0) return getRoomById(roomId);

  values.push(roomId);
  await c.execute({ sql: `UPDATE VoiceRoom SET ${setClauses.join(', ')} WHERE id = ?`, args: values });

  // If micSeatCount was reduced, eject participants from seats beyond the new count
  if (settings.micSeatCount !== undefined) {
    const newCount = Number(settings.micSeatCount);
    // Get current room mic count
    const roomResult = await c.execute({ sql: 'SELECT micSeatCount FROM VoiceRoom WHERE id = ?', args: [roomId] });
    if (roomResult.rows.length > 0) {
      const currentCount = Number(roomResult.rows[0].micSeatCount) || 10;
      // If the seat count was reduced, remove participants from seats >= newCount
      if (newCount < currentCount) {
        await c.execute({
          sql: 'UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = \'open\' WHERE roomId = ? AND seatIndex >= ?',
          args: [roomId, newCount],
        });
      }
    }
  }

  await logAction(roomId, userId, actorName, 'update_settings', '', '', JSON.stringify(settings));
  return getRoomById(roomId);
}

// 22. getActionLog
export async function getActionLog(roomId: string, limit: number = 50): Promise<RoomActionLog[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: 'SELECT * FROM RoomActionLog WHERE roomId = ? ORDER BY createdAt DESC LIMIT ?',
    args: [roomId, limit],
  });
  return result.rows.map(row => ({
    id: row.id as string, roomId: row.roomId as string, actorId: row.actorId as string,
    actorName: (row.actorName as string) || '', action: row.action as string,
    targetId: (row.targetId as string) || '', targetName: (row.targetName as string) || '',
    details: (row.details as string) || '', createdAt: row.createdAt as string,
  }));
}

// 24. kickFromRoom
export async function kickFromRoom(roomId: string, targetUserId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  // Remove participant
  await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  // Remove from waitlist
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });

  await logAction(roomId, actorId, actorName, 'kick_from_room', targetUserId, targetName, '');
  return true;
}

// 25. setSeatStatus
export async function setSeatStatus(roomId: string, seatIndex: number, status: SeatStatus, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  // Get current locked seats from room
  const roomResult = await c.execute({ sql: 'SELECT lockedSeats FROM VoiceRoom WHERE id = ?', args: [roomId] });
  let lockedSeats: number[] = [];
  if (roomResult.rows.length > 0) {
    try { lockedSeats = JSON.parse((roomResult.rows[0].lockedSeats as string) || '[]'); } catch { lockedSeats = []; }
  }

  // Find participant on that seat
  const seatResult = await c.execute({ sql: 'SELECT * FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ?', args: [roomId, seatIndex] });
  if (seatResult.rows.length > 0) {
    // If status is 'open' and there's someone on the seat, kick them from mic
    if (status === 'open') {
      await c.execute({
        sql: "UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = 'open', isMuted = 0 WHERE roomId = ? AND seatIndex = ?",
        args: [roomId, seatIndex],
      });
      // Remove from locked seats
      lockedSeats = lockedSeats.filter(s => s !== seatIndex);
    } else {
      // Just update the seat status
      await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET seatStatus = ? WHERE roomId = ? AND seatIndex = ?', args: [status, roomId, seatIndex] });
    }
  }

  // Update locked seats in room
  if (status === 'locked') {
    if (!lockedSeats.includes(seatIndex)) lockedSeats.push(seatIndex);
  } else {
    lockedSeats = lockedSeats.filter(s => s !== seatIndex);
  }
  await c.execute({ sql: 'UPDATE VoiceRoom SET lockedSeats = ? WHERE id = ?', args: [JSON.stringify(lockedSeats), roomId] });

  await logAction(roomId, actorId, actorName, 'set_seat_status', '', '', `Seat ${seatIndex} -> ${status}`);
  return true;
}

// Get participant by roomId and userId
export async function getParticipant(roomId: string, userId: string): Promise<VoiceRoomParticipant | null> {
  const c = getClient();
  await ensureAdminTables();
  
  try {
    const result = await c.execute({ sql: 'SELECT id, roomId, userId, username, displayName, avatar, isMuted, micFrozen, role, seatIndex, seatStatus, vipLevel, joinedAt, pendingRole, pendingMicInvite FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
      username: row.username as string, displayName: (row.displayName as string) || '',
      avatar: (row.avatar as string) || '', isMuted: Boolean(row.isMuted),
      micFrozen: Boolean(row.micFrozen),
      role: (row.role as RoomRole) || 'visitor',
      seatIndex: Number(row.seatIndex) ?? -1,
      seatStatus: (row.seatStatus as SeatStatus) || 'open',
      vipLevel: Number(row.vipLevel) || 0,
      joinedAt: row.joinedAt as string,
      pendingRole: (row.pendingRole as string) || '',
      pendingMicInvite: Number(row.pendingMicInvite) ?? -1,
    };
  } catch {
    // Fallback: columns may not exist yet, use basic query
    const result = await c.execute({ sql: 'SELECT id, roomId, userId, username, displayName, avatar, isMuted, micFrozen, role, seatIndex, seatStatus, vipLevel, joinedAt FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
      username: row.username as string, displayName: (row.displayName as string) || '',
      avatar: (row.avatar as string) || '', isMuted: Boolean(row.isMuted),
      micFrozen: Boolean(row.micFrozen),
      role: (row.role as RoomRole) || 'visitor',
      seatIndex: Number(row.seatIndex) ?? -1,
      seatStatus: (row.seatStatus as SeatStatus) || 'open',
      vipLevel: Number(row.vipLevel) || 0,
      joinedAt: row.joinedAt as string,
      pendingRole: '',
      pendingMicInvite: -1,
    };
  }
}

// ─── RoomTemplate ──────────────────────────────────────────────────

export interface RoomTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  micSeatCount: number;
  roomMode: 'public' | 'key' | 'private';
  roomPassword: string;
  maxParticipants: number;
  isAutoMode: boolean;
  micTheme: string;
  allowedRoles: string[]; // JSON array of roles allowed on mic
  updatedAt: string;
}

export async function getRoomTemplate(userId: string): Promise<RoomTemplate | null> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM RoomTemplate WHERE userId = ?', args: [userId] });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  let allowedRoles: string[] = ['member', 'admin', 'coowner', 'owner'];
  try { const parsed = JSON.parse((row.allowedRoles as string) || '[]'); if (Array.isArray(parsed)) allowedRoles = parsed; } catch {}
  return {
    id: row.id as string, userId: row.userId as string,
    name: (row.name as string) || '', description: (row.description as string) || '',
    micSeatCount: Number(row.micSeatCount) || 10,
    roomMode: (row.roomMode as RoomTemplate['roomMode']) || 'public',
    roomPassword: (row.roomPassword as string) || '',
    maxParticipants: Number(row.maxParticipants) || 50,
    isAutoMode: Boolean(row.isAutoMode),
    micTheme: (row.micTheme as string) || 'default',
    allowedRoles,
    updatedAt: row.updatedAt as string,
  };
}

export async function saveRoomTemplate(data: {
  userId: string; name: string; description: string;
  micSeatCount: number; roomMode: string; roomPassword: string;
  maxParticipants: number; isAutoMode: boolean; micTheme: string;
  allowedRoles: string[];
}): Promise<RoomTemplate> {
  const c = getClient();
  await ensureAdminTables();
  const existing = await c.execute({ sql: 'SELECT id FROM RoomTemplate WHERE userId = ?', args: [data.userId] });
  if (existing.rows.length > 0) {
    await c.execute({
      sql: `UPDATE RoomTemplate SET name=?, description=?, micSeatCount=?, roomMode=?, roomPassword=?,
            maxParticipants=?, isAutoMode=?, micTheme=?, allowedRoles=?, updatedAt=datetime('now') WHERE userId=?`,
      args: [data.name, data.description, data.micSeatCount, data.roomMode, data.roomPassword,
        data.maxParticipants, data.isAutoMode ? 1 : 0, data.micTheme, JSON.stringify(data.allowedRoles), data.userId],
    });
  } else {
    await c.execute({
      sql: `INSERT INTO RoomTemplate (id, userId, name, description, micSeatCount, roomMode, roomPassword,
            maxParticipants, isAutoMode, micTheme, allowedRoles)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), data.userId, data.name, data.description, data.micSeatCount,
        data.roomMode, data.roomPassword, data.maxParticipants, data.isAutoMode ? 1 : 0,
        data.micTheme, JSON.stringify(data.allowedRoles)],
    });
  }
  return (await getRoomTemplate(data.userId))!;
}

// ─── Temp Kick with Duration ──────────────────────────────────────

export async function kickFromRoomTimed(roomId: string, targetUserId: string, actorId: string, durationMinutes: number): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });

  if (durationMinutes > 0) {
    await c.execute({
      sql: 'INSERT INTO RoomKickTimer (id, roomId, userId, kickedBy, durationMinutes) VALUES (?, ?, ?, ?, ?)',
      args: [crypto.randomUUID(), roomId, targetUserId, actorId, durationMinutes],
    });
  }

  await logAction(roomId, actorId, actorName, 'kick_timed', targetUserId, targetName, `${durationMinutes} minutes`);
  return true;
}

export async function isUserKicked(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT id, kickedAt, durationMinutes FROM RoomKickTimer WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (result.rows.length === 0) return false;
  const row = result.rows[0];
  const durationMs = Number(row.durationMinutes) * 60 * 1000;
  if (durationMs <= 0) return true; // permanent kick
  const kickedAt = new Date(row.kickedAt as string).getTime();
  return Date.now() - kickedAt < durationMs;
}

export async function cleanExpiredKicks(roomId: string): Promise<void> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT id, kickedAt, durationMinutes FROM RoomKickTimer WHERE roomId = ?', args: [roomId] });
  for (const row of result.rows) {
    const durationMs = Number(row.durationMinutes) * 60 * 1000;
    if (durationMs > 0) {
      const kickedAt = new Date(row.kickedAt as string).getTime();
      if (Date.now() - kickedAt >= durationMs) {
        await c.execute({ sql: 'DELETE FROM RoomKickTimer WHERE id = ?', args: [row.id as string] });
      }
    }
  }
}

export async function getUserGiftStats(userId: string, roomId?: string): Promise<{ giftsSent: number; giftsReceived: number; totalSentValue: number; totalReceivedValue: number }> {
  const c = getClient();
  await ensureAdminTables();
  const sentResult = await c.execute({
    sql: 'SELECT COUNT(*) as cnt, COALESCE(SUM(g.price),0) as total FROM GiftHistory gh JOIN Gift g ON g.id = gh.giftId WHERE gh.fromUserId = ?',
    args: [userId],
  });
  const receivedResult = await c.execute({
    sql: 'SELECT COUNT(*) as cnt, COALESCE(SUM(g.price),0) as total FROM GiftHistory gh JOIN Gift g ON g.id = gh.giftId WHERE gh.toUserId = ?',
    args: [userId],
  });
  const sentRow = sentResult.rows[0] as Record<string, unknown>;
  const receivedRow = receivedResult.rows[0] as Record<string, unknown>;
  return {
    giftsSent: Number(sentRow.cnt ?? 0),
    giftsReceived: Number(receivedRow.cnt ?? 0),
    totalSentValue: Number(sentRow.total ?? 0),
    totalReceivedValue: Number(receivedRow.total ?? 0),
  };
}

// Get total gems spent in a room this week (since Monday 00:00)
export async function getRoomWeeklyGems(roomId: string): Promise<number> {
  const c = getClient();
  await ensureAdminTables();
  // Get the start of the current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString();

  const result = await c.execute({
    sql: `SELECT COALESCE(SUM(g.price), 0) as total
          FROM GiftHistory gh JOIN Gift g ON g.id = gh.giftId
          WHERE gh.roomId = ? AND gh.createdAt >= ?`,
    args: [roomId, weekStart],
  });
  return Number((result.rows[0] as Record<string, unknown>)?.total ?? 0);
}

// ─── Room Background operations ──────────────────────────────────────

export interface RoomBackground {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  isFree: boolean;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  totalOwned: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserBackground {
  id: string;
  userId: string;
  backgroundId: string;
  isEquipped: boolean;
  obtainedFrom: 'purchase' | 'event' | 'admin' | 'reward';
  obtainedNote: string;
  obtainedAt: string;
}

function toRoomBackground(row: Record<string, unknown>): RoomBackground {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    nameAr: (row.nameAr as string) ?? '',
    description: (row.description as string) ?? '',
    imageUrl: (row.imageUrl as string) ?? '',
    thumbnailUrl: (row.thumbnailUrl as string) ?? '',
    rarity: (row.rarity as RoomBackground['rarity']) ?? 'common',
    price: Number(row.price ?? 0),
    isFree: !!(row.isFree && row.isFree !== 0),
    isDefault: !!(row.isDefault && row.isDefault !== 0),
    isActive: !!(row.isActive && row.isActive !== 0),
    sortOrder: Number(row.sortOrder ?? 0),
    totalOwned: Number(row.totalOwned ?? 0),
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

function toUserBackground(row: Record<string, unknown>): UserBackground {
  return {
    id: row.id as string,
    userId: (row.userId as string) ?? '',
    backgroundId: (row.backgroundId as string) ?? '',
    isEquipped: !!(row.isEquipped && row.isEquipped !== 0),
    obtainedFrom: (row.obtainedFrom as UserBackground['obtainedFrom']) ?? 'purchase',
    obtainedNote: (row.obtainedNote as string) ?? '',
    obtainedAt: (row.obtainedAt as string) ?? new Date().toISOString(),
  };
}

export async function getAllRoomBackgrounds(): Promise<RoomBackground[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM RoomBackground ORDER BY sortOrder ASC, createdAt DESC', args: [] });
  return result.rows.map(r => toRoomBackground(r as Record<string, unknown>));
}

export async function getActiveRoomBackgrounds(): Promise<RoomBackground[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM RoomBackground WHERE isActive = 1 ORDER BY sortOrder ASC', args: [] });
  return result.rows.map(r => toRoomBackground(r as Record<string, unknown>));
}

export async function getDefaultRoomBackgrounds(): Promise<RoomBackground[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM RoomBackground WHERE isActive = 1 AND (isDefault = 1 OR isFree = 1 OR price = 0) ORDER BY sortOrder ASC', args: [] });
  return result.rows.map(r => toRoomBackground(r as Record<string, unknown>));
}

export async function getRoomBackgroundById(id: string): Promise<RoomBackground | null> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM RoomBackground WHERE id = ?', args: [id] });
  if (result.rows.length === 0) return null;
  return toRoomBackground(result.rows[0] as Record<string, unknown>);
}

export async function createRoomBackground(data: {
  name: string; nameAr: string; description?: string; imageUrl: string;
  thumbnailUrl?: string; rarity?: string; price?: number; isFree?: boolean;
  isDefault?: boolean; sortOrder?: number;
}): Promise<RoomBackground> {
  const c = getClient();
  await ensureAdminTables();
  const id = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO RoomBackground (id, name, nameAr, description, imageUrl, thumbnailUrl, rarity, price, isFree, isDefault, isActive, sortOrder)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.name, data.nameAr, data.description || '', data.imageUrl, data.thumbnailUrl || '',
      data.rarity || 'common', data.price || 0, data.isFree ? 1 : 0, data.isDefault ? 1 : 0, 1, data.sortOrder || 0],
  });
  const bg = await getRoomBackgroundById(id);
  return bg!;
}

export async function updateRoomBackground(id: string, data: Partial<Omit<RoomBackground, 'id' | 'createdAt'>>): Promise<RoomBackground | null> {
  const c = getClient();
  await ensureAdminTables();
  const entries = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'createdAt');
  if (entries.length === 0) return getRoomBackgroundById(id);
  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];
  for (const [key, val] of entries) {
    if (key === 'isFree' || key === 'isDefault' || key === 'isActive') {
      setClauses.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(val);
    }
  }
  values.push(id);
  await c.execute({ sql: `UPDATE RoomBackground SET ${setClauses.join(', ')} WHERE id = ?`, args: values });
  return getRoomBackgroundById(id);
}

export async function deleteRoomBackground(id: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'DELETE FROM UserBackground WHERE backgroundId = ?', args: [id] });
  const result = await c.execute({ sql: 'DELETE FROM RoomBackground WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}

export async function getUserRoomBackgrounds(userId: string): Promise<UserBackground[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM UserBackground WHERE userId = ? ORDER BY obtainedAt DESC', args: [userId] });
  return result.rows.map(r => toUserBackground(r as Record<string, unknown>));
}

export async function getBackgroundsAvailableToUser(userId: string): Promise<{ background: RoomBackground; owned: boolean }[]> {
  const c = getClient();
  await ensureAdminTables();
  // Get all active backgrounds
  const allBgs = await getActiveRoomBackgrounds();
  // Get user's owned backgrounds
  const owned = await getUserRoomBackgrounds(userId);
  const ownedIds = new Set(owned.map(o => o.backgroundId));
  return allBgs.map(bg => ({ background: bg, owned: ownedIds.has(bg.id) || bg.isFree || bg.isDefault }));
}

export async function purchaseRoomBackground(userId: string, backgroundId: string): Promise<{ success: boolean; error?: string }> {
  const c = getClient();
  await ensureAdminTables();
  // Check if background exists
  const bg = await getRoomBackgroundById(backgroundId);
  if (!bg) return { success: false, error: 'الخلفية غير موجودة' };
  if (!bg.isActive) return { success: false, error: 'الخلفية غير متاحة' };
  if (bg.isFree || bg.isDefault || bg.price === 0) {
    // Free background - just grant it
    try {
      await c.execute({
        sql: 'INSERT INTO UserBackground (id, userId, backgroundId, isEquipped, obtainedFrom, obtainedNote) VALUES (?, ?, ?, 0, ?, ?)',
        args: [crypto.randomUUID(), userId, backgroundId, 'purchase', 'خلفية مجانية'],
      });
      await c.execute({ sql: 'UPDATE RoomBackground SET totalOwned = totalOwned + 1 WHERE id = ?', args: [backgroundId] });
      return { success: true };
    } catch {
      // Already owned
      return { success: false, error: 'تمتلك هذه الخلفية بالفعل' };
    }
  }
  // Paid background - check gems balance
  const userResult = await c.execute({ sql: 'SELECT gemsBalance FROM Subscription WHERE subscriptionId IN (SELECT subscriptionId FROM AppUser WHERE id = ?)', args: [userId] });
  if (userResult.rows.length === 0) return { success: false, error: 'المستخدم غير موجود' };
  const userGems = Number(userResult.rows[0].gemsBalance ?? 0);
  if (userGems < bg.price) return { success: false, error: 'رصيد الجواهر غير كافٍ' };
  // Deduct gems and grant background
  await c.execute({
    sql: 'UPDATE Subscription SET gemsBalance = gemsBalance - ? WHERE subscriptionId IN (SELECT subscriptionId FROM AppUser WHERE id = ?)',
    args: [bg.price, userId],
  });
  try {
    await c.execute({
      sql: 'INSERT INTO UserBackground (id, userId, backgroundId, isEquipped, obtainedFrom, obtainedNote) VALUES (?, ?, ?, 0, ?, ?)',
      args: [crypto.randomUUID(), userId, backgroundId, 'purchase', `شراء بـ ${bg.price} جوهرة`],
    });
    await c.execute({ sql: 'UPDATE RoomBackground SET totalOwned = totalOwned + 1 WHERE id = ?', args: [backgroundId] });
    return { success: true };
  } catch {
    // Refund gems if insert fails (already owned)
    await c.execute({
      sql: 'UPDATE Subscription SET gemsBalance = gemsBalance + ? WHERE subscriptionId IN (SELECT subscriptionId FROM AppUser WHERE id = ?)',
      args: [bg.price, userId],
    });
    return { success: false, error: 'تمتلك هذه الخلفية بالفعل' };
  }
}

export async function grantRoomBackground(userId: string, backgroundId: string, source: string, note?: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  try {
    await c.execute({
      sql: 'INSERT INTO UserBackground (id, userId, backgroundId, isEquipped, obtainedFrom, obtainedNote) VALUES (?, ?, ?, 0, ?, ?)',
      args: [crypto.randomUUID(), userId, backgroundId, source, note || ''],
    });
    await c.execute({ sql: 'UPDATE RoomBackground SET totalOwned = totalOwned + 1 WHERE id = ?', args: [backgroundId] });
    return true;
  } catch {
    return false; // Already owned
  }
}
