import { createClient, Client } from '@libsql/client';

// ─── Types ────────────────────────────────────────────────────────────

export interface RoomRow {
  id: string;
  code: string;
  phase: string;
  round: number;
  gameWinner: string | null;
  hostName: string;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
  stateJson: string;
  resultsJson: string | null;
  gameType: string | null;
  hostLastSeen: string;
}

export interface RoomPlayerRow {
  id: string;
  roomId: string;
  name: string;
  role: string | null;
  isAlive: boolean;
  isSilenced: boolean;
  hasRevealedMayor: boolean;
  eliminatedBy: string | null;
  eliminatedRound: number | null;
  voteTarget: string | null;
  nightActionTarget: string | null;
  nightActionType: string | null;
  hasJoined: boolean;
  joinedAt: string;
  updatedAt: string;
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

// ─── Table creation ───────────────────────────────────────────────────

async function ensureTables(): Promise<void> {
  if (_tablesReady) return;
  const c = getClient();

  await c.execute(`
    CREATE TABLE IF NOT EXISTS Room (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      phase TEXT DEFAULT 'waiting',
      round INTEGER DEFAULT 0,
      gameWinner TEXT,
      hostName TEXT NOT NULL,
      playerCount INTEGER DEFAULT 14,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      stateJson TEXT DEFAULT '{}',
      resultsJson TEXT,
      gameType TEXT,
      hostLastSeen TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomPlayer (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      isAlive INTEGER DEFAULT 1,
      isSilenced INTEGER DEFAULT 0,
      hasRevealedMayor INTEGER DEFAULT 0,
      eliminatedBy TEXT,
      eliminatedRound INTEGER,
      voteTarget TEXT,
      nightActionTarget TEXT,
      nightActionType TEXT,
      hasJoined INTEGER DEFAULT 0,
      joinedAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (roomId) REFERENCES Room(id) ON DELETE CASCADE
    )
  `);

  _tablesReady = true;
}

// ─── Row mappers ──────────────────────────────────────────────────────

function toRoomRow(row: Record<string, unknown>): RoomRow {
  return {
    id: row.id as string,
    code: row.code as string,
    phase: row.phase as string,
    round: (row.round as number) ?? 0,
    gameWinner: (row.gameWinner as string) ?? null,
    hostName: row.hostName as string,
    playerCount: (row.playerCount as number) ?? 14,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
    stateJson: (row.stateJson as string) ?? '{}',
    resultsJson: (row.resultsJson as string) ?? null,
    gameType: (row.gameType as string) ?? null,
    hostLastSeen: (row.hostLastSeen as string) ?? new Date().toISOString(),
  };
}

function toPlayerRow(row: Record<string, unknown>): RoomPlayerRow {
  return {
    id: row.id as string,
    roomId: row.roomId as string,
    name: row.name as string,
    role: (row.role as string) ?? null,
    isAlive: !!row.isAlive && row.isAlive !== 0,
    isSilenced: !!row.isSilenced && row.isSilenced !== 0,
    hasRevealedMayor: !!row.hasRevealedMayor && row.hasRevealedMayor !== 0,
    eliminatedBy: (row.eliminatedBy as string) ?? null,
    eliminatedRound: row.eliminatedRound != null ? (row.eliminatedRound as number) : null,
    voteTarget: (row.voteTarget as string) ?? null,
    nightActionTarget: (row.nightActionTarget as string) ?? null,
    nightActionType: (row.nightActionType as string) ?? null,
    hasJoined: !!row.hasJoined && row.hasJoined !== 0,
    joinedAt: (row.joinedAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

// ─── ID generator ─────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ─── SQL value converter ──────────────────────────────────────────────
// Converts JS values (booleans, Dates) to SQLite-compatible values

function sqlVal(val: unknown): unknown {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

// ─── Room operations ──────────────────────────────────────────────────

export async function getRoomByCode(code: string): Promise<RoomRow | null> {
  await ensureTables();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM Room WHERE code = ?',
    args: [code],
  });
  if (result.rows.length === 0) return null;
  return toRoomRow(result.rows[0] as Record<string, unknown>);
}

export async function getRoomWithPlayers(
  code: string
): Promise<(RoomRow & { players: RoomPlayerRow[] }) | null> {
  await ensureTables();
  const c = getClient();

  const roomResult = await c.execute({
    sql: 'SELECT * FROM Room WHERE code = ?',
    args: [code],
  });
  if (roomResult.rows.length === 0) return null;

  const room = toRoomRow(roomResult.rows[0] as Record<string, unknown>);

  const playerResult = await c.execute({
    sql: 'SELECT * FROM RoomPlayer WHERE roomId = ?',
    args: [room.id],
  });

  const players = playerResult.rows.map(
    (r) => toPlayerRow(r as Record<string, unknown>)
  );

  return { ...room, players };
}

export async function createRoom(data: {
  id: string;
  code: string;
  hostName: string;
  playerCount: number;
  phase: string;
  stateJson: string;
  gameType: string | null;
}): Promise<RoomRow> {
  await ensureTables();
  const c = getClient();
  await c.execute({
    sql: `INSERT INTO Room (id, code, phase, hostName, playerCount, stateJson, gameType)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.id,
      data.code,
      data.phase,
      data.hostName,
      data.playerCount,
      data.stateJson,
      data.gameType,
    ],
  });
  const room = await getRoomByCode(data.code);
  return room!;
}

export async function updateRoom(
  code: string,
  data: Record<string, unknown>
): Promise<RoomRow | null> {
  await ensureTables();
  const c = getClient();

  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) {
    return getRoomByCode(code);
  }

  // Always update updatedAt
  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(code);

  await c.execute({
    sql: `UPDATE Room SET ${setClauses.join(', ')} WHERE code = ?`,
    args: values,
  });

  return getRoomByCode(code);
}

export async function updateRoomWithPlayers(
  code: string,
  data: Record<string, unknown>
): Promise<(RoomRow & { players: RoomPlayerRow[] }) | null> {
  await updateRoom(code, data);
  return getRoomWithPlayers(code);
}

// ─── RoomPlayer operations ────────────────────────────────────────────

export async function createPlayer(data: {
  id: string;
  roomId: string;
  name: string;
  hasJoined: boolean;
}): Promise<RoomPlayerRow> {
  await ensureTables();
  const c = getClient();
  await c.execute({
    sql: `INSERT INTO RoomPlayer (id, roomId, name, hasJoined)
          VALUES (?, ?, ?, ?)`,
    args: [data.id, data.roomId, data.name, data.hasJoined ? 1 : 0],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM RoomPlayer WHERE id = ?',
    args: [data.id],
  });
  return toPlayerRow(result.rows[0] as Record<string, unknown>);
}

export async function updatePlayer(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureTables();
  const c = getClient();

  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) return;

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(id);

  await c.execute({
    sql: `UPDATE RoomPlayer SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });
}

export async function updatePlayersByRoomId(
  roomId: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureTables();
  const c = getClient();

  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) return;

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(roomId);

  await c.execute({
    sql: `UPDATE RoomPlayer SET ${setClauses.join(', ')} WHERE roomId = ?`,
    args: values,
  });
}

export async function updatePlayersByName(
  roomId: string,
  name: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureTables();
  const c = getClient();

  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) return;

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(roomId, name);

  await c.execute({
    sql: `UPDATE RoomPlayer SET ${setClauses.join(', ')} WHERE roomId = ? AND name = ?`,
    args: values,
  });
}

export async function deletePlayer(id: string): Promise<void> {
  await ensureTables();
  const c = getClient();
  await c.execute({
    sql: 'DELETE FROM RoomPlayer WHERE id = ?',
    args: [id],
  });
}

export async function deleteRoomByCode(code: string): Promise<void> {
  await ensureTables();
  const c = getClient();
  await c.execute({
    sql: 'DELETE FROM RoomPlayer WHERE roomId IN (SELECT id FROM Room WHERE code = ?)',
    args: [code],
  });
  await c.execute({
    sql: 'DELETE FROM Room WHERE code = ?',
    args: [code],
  });
}

export async function getAllActiveRooms(): Promise<RoomRow[]> {
  await ensureTables();
  const c = getClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = await c.execute({
    sql: 'SELECT * FROM Room WHERE updatedAt > ? ORDER BY createdAt DESC LIMIT 100',
    args: [cutoff],
  });
  return result.rows.map(row => ({
    id: row.id as string,
    code: row.code as string,
    phase: row.phase as string,
    round: Number(row.round || 0),
    gameWinner: row.gameWinner as string | null,
    hostName: row.hostName as string,
    playerCount: Number(row.playerCount || 0),
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
    stateJson: row.stateJson as string,
    resultsJson: row.resultsJson as string | null,
    gameType: row.gameType as string | null,
    hostLastSeen: row.hostLastSeen as string,
  }));
}

export async function deleteInactiveRooms(hoursOld: number = 24): Promise<number> {
  await ensureTables();
  const c = getClient();
  const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
  const rooms = await c.execute({
    sql: 'SELECT id, code FROM Room WHERE updatedAt < ?',
    args: [cutoff],
  });
  let deleted = 0;
  for (const room of rooms.rows) {
    await c.execute({
      sql: 'DELETE FROM RoomPlayer WHERE roomId = ?',
      args: [room.id],
    });
    await c.execute({
      sql: 'DELETE FROM Room WHERE id = ?',
      args: [room.id],
    });
    deleted++;
  }
  return deleted;
}

// ═══════════════════════════════════════════════════════════════════════
// Admin Panel Types
// ═══════════════════════════════════════════════════════════════════════

export interface EventRow {
  id: string;
  title: string;
  description: string;
  type: string;
  rewardType: string;
  rewardAmount: number;
  rewardBadge: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerRow {
  id: string;
  name: string;
  level: number;
  xp: number;
  gamesPlayed: number;
  gamesWon: number;
  gems: number;
  rankBadge: string;
  createdAt: string;
  updatedAt: string;
}

export interface PremiumIdRow {
  id: string;
  displayName: string;
  priceGems: number;
  status: string;
  soldTo: string | null;
  soldDate: string | null;
  createdAt: string;
}

export interface GemOrderRow {
  id: string;
  playerName: string;
  packageName: string;
  gems: number;
  priceSAR: number;
  paymentMethod: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Admin Session Management
// ═══════════════════════════════════════════════════════════════════════

let _adminTablesReady = false;

async function ensureAdminTables(): Promise<void> {
  if (_adminTablesReady) return;
  const c = getClient();

  await c.execute(`
    CREATE TABLE IF NOT EXISTS AdminSession (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      expiresAt TEXT NOT NULL
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS Event (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT DEFAULT 'permanent',
      rewardType TEXT DEFAULT 'gems',
      rewardAmount INTEGER DEFAULT 0,
      rewardBadge TEXT,
      isActive INTEGER DEFAULT 1,
      startsAt TEXT,
      endsAt TEXT,
      imageUrl TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS Player (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      gamesPlayed INTEGER DEFAULT 0,
      gamesWon INTEGER DEFAULT 0,
      gems INTEGER DEFAULT 0,
      rankBadge TEXT DEFAULT 'beginner',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS PremiumId (
      id TEXT PRIMARY KEY,
      displayName TEXT NOT NULL,
      priceGems INTEGER DEFAULT 100,
      status TEXT DEFAULT 'available',
      soldTo TEXT,
      soldDate TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS GemOrder (
      id TEXT PRIMARY KEY,
      playerName TEXT NOT NULL,
      packageName TEXT NOT NULL,
      gems INTEGER DEFAULT 0,
      priceSAR REAL DEFAULT 0,
      paymentMethod TEXT DEFAULT 'manual',
      status TEXT DEFAULT 'pending',
      adminNotes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  _adminTablesReady = true;
}

// ─── Admin session CRUD ──────────────────────────────────────────────

export async function createAdminSession(username: string): Promise<string> {
  await ensureAdminTables();
  const c = getClient();
  const id = generateId();
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
  // Expires in 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await c.execute({
    sql: `INSERT INTO AdminSession (id, username, token, expiresAt) VALUES (?, ?, ?, ?)`,
    args: [id, username, token, expiresAt],
  });

  return token;
}

export async function validateAdminSession(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    await ensureAdminTables();
    const c = getClient();
    const result = await c.execute({
      sql: 'SELECT * FROM AdminSession WHERE token = ? AND expiresAt > datetime("now")',
      args: [token],
    });

    if (result.rows.length === 0) {
      return { valid: false };
    }

    const row = result.rows[0] as Record<string, unknown>;
    return { valid: true, username: row.username as string };
  } catch {
    return { valid: false };
  }
}

export async function deleteAdminSession(token: string): Promise<void> {
  try {
    await ensureAdminTables();
    const c = getClient();
    await c.execute({
      sql: 'DELETE FROM AdminSession WHERE token = ?',
      args: [token],
    });
  } catch {
    // Ignore cleanup errors
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Event operations
// ═══════════════════════════════════════════════════════════════════════

function toEventRow(row: Record<string, unknown>): EventRow {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    type: (row.type as string) ?? 'permanent',
    rewardType: (row.rewardType as string) ?? 'gems',
    rewardAmount: (row.rewardAmount as number) ?? 0,
    rewardBadge: (row.rewardBadge as string) ?? null,
    isActive: !!row.isActive && row.isActive !== 0,
    startsAt: (row.startsAt as string) ?? null,
    endsAt: (row.endsAt as string) ?? null,
    imageUrl: (row.imageUrl as string) ?? null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

export async function getAllEvents(): Promise<EventRow[]> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM Event ORDER BY createdAt DESC',
    args: [],
  });
  return result.rows.map(r => toEventRow(r as Record<string, unknown>));
}

export async function getEventById(id: string): Promise<EventRow | null> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM Event WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return toEventRow(result.rows[0] as Record<string, unknown>);
}

export async function createEvent(data: {
  id: string;
  title: string;
  description?: string;
  type?: string;
  rewardType?: string;
  rewardAmount?: number;
  rewardBadge?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  imageUrl?: string;
}): Promise<EventRow> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({
    sql: `INSERT INTO Event (id, title, description, type, rewardType, rewardAmount, rewardBadge, isActive, startsAt, endsAt, imageUrl)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.id, data.title, data.description ?? '', data.type ?? 'permanent',
      data.rewardType ?? 'gems', data.rewardAmount ?? 0, data.rewardBadge ?? null,
      data.isActive ? 1 : 0, data.startsAt ?? null, data.endsAt ?? null, data.imageUrl ?? null,
    ],
  });
  const ev = await getEventById(data.id);
  return ev!;
}

export async function updateEvent(id: string, data: Record<string, unknown>): Promise<EventRow | null> {
  await ensureAdminTables();
  const c = getClient();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getEventById(id);

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'isActive') {
      setClauses.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(id);
  await c.execute({
    sql: `UPDATE Event SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });

  return getEventById(id);
}

export async function deleteEvent(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM Event WHERE id = ?', args: [id] });
}

// ═══════════════════════════════════════════════════════════════════════
// Player operations
// ═══════════════════════════════════════════════════════════════════════

function toAdminPlayerRow(row: Record<string, unknown>): PlayerRow {
  return {
    id: row.id as string,
    name: row.name as string,
    level: (row.level as number) ?? 1,
    xp: (row.xp as number) ?? 0,
    gamesPlayed: (row.gamesPlayed as number) ?? 0,
    gamesWon: (row.gamesWon as number) ?? 0,
    gems: (row.gems as number) ?? 0,
    rankBadge: (row.rankBadge as string) ?? 'beginner',
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

export async function getAllPlayers(search?: string): Promise<PlayerRow[]> {
  await ensureAdminTables();
  const c = getClient();
  let result;
  if (search && search.trim()) {
    result = await c.execute({
      sql: "SELECT * FROM Player WHERE name LIKE ? ORDER BY xp DESC",
      args: [`%${search}%`],
    });
  } else {
    result = await c.execute({
      sql: 'SELECT * FROM Player ORDER BY xp DESC',
      args: [],
    });
  }
  return result.rows.map(r => toAdminPlayerRow(r as Record<string, unknown>));
}

export async function getPlayerCount(): Promise<number> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({ sql: 'SELECT COUNT(*) as cnt FROM Player', args: [] });
  return (result.rows[0] as Record<string, unknown>).cnt as number ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════
// Premium ID operations
// ═══════════════════════════════════════════════════════════════════════

function toPremiumIdRow(row: Record<string, unknown>): PremiumIdRow {
  return {
    id: row.id as string,
    displayName: row.displayName as string,
    priceGems: (row.priceGems as number) ?? 100,
    status: (row.status as string) ?? 'available',
    soldTo: (row.soldTo as string) ?? null,
    soldDate: (row.soldDate as string) ?? null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };
}

export async function getAllPremiumIds(): Promise<PremiumIdRow[]> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM PremiumId ORDER BY createdAt DESC',
    args: [],
  });
  return result.rows.map(r => toPremiumIdRow(r as Record<string, unknown>));
}

export async function createPremiumId(data: {
  id: string;
  displayName: string;
  priceGems: number;
}): Promise<PremiumIdRow> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({
    sql: 'INSERT INTO PremiumId (id, displayName, priceGems) VALUES (?, ?, ?)',
    args: [data.id, data.displayName, data.priceGems],
  });
  const result = await c.execute({ sql: 'SELECT * FROM PremiumId WHERE id = ?', args: [data.id] });
  return toPremiumIdRow(result.rows[0] as Record<string, unknown>);
}

export async function deletePremiumId(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM PremiumId WHERE id = ?', args: [id] });
}

export async function getPremiumSoldCount(): Promise<number> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({ sql: "SELECT COUNT(*) as cnt FROM PremiumId WHERE status = 'sold'", args: [] });
  return (result.rows[0] as Record<string, unknown>).cnt as number ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════
// Gem Order operations
// ═══════════════════════════════════════════════════════════════════════

function toGemOrderRow(row: Record<string, unknown>): GemOrderRow {
  return {
    id: row.id as string,
    playerName: row.playerName as string,
    packageName: row.packageName as string,
    gems: (row.gems as number) ?? 0,
    priceSAR: (row.priceSAR as number) ?? 0,
    paymentMethod: (row.paymentMethod as string) ?? 'manual',
    status: (row.status as string) ?? 'pending',
    adminNotes: (row.adminNotes as string) ?? null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

export async function getAllGemOrders(statusFilter?: string): Promise<GemOrderRow[]> {
  await ensureAdminTables();
  const c = getClient();
  let result;
  if (statusFilter && statusFilter !== 'all') {
    result = await c.execute({
      sql: 'SELECT * FROM GemOrder WHERE status = ? ORDER BY createdAt DESC',
      args: [statusFilter],
    });
  } else {
    result = await c.execute({
      sql: 'SELECT * FROM GemOrder ORDER BY createdAt DESC',
      args: [],
    });
  }
  return result.rows.map(r => toGemOrderRow(r as Record<string, unknown>));
}

export async function updateGemOrder(id: string, data: Record<string, unknown>): Promise<GemOrderRow | null> {
  await ensureAdminTables();
  const c = getClient();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const r = await c.execute({ sql: 'SELECT * FROM GemOrder WHERE id = ?', args: [id] });
    if (r.rows.length === 0) return null;
    return toGemOrderRow(r.rows[0] as Record<string, unknown>);
  }

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(id);
  await c.execute({
    sql: `UPDATE GemOrder SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });

  const r = await c.execute({ sql: 'SELECT * FROM GemOrder WHERE id = ?', args: [id] });
  if (r.rows.length === 0) return null;
  return toGemOrderRow(r.rows[0] as Record<string, unknown>);
}

export async function getGemOrderCount(status?: string): Promise<number> {
  await ensureAdminTables();
  const c = getClient();
  let sql = 'SELECT COUNT(*) as cnt FROM GemOrder';
  const args: unknown[] = [];
  if (status) {
    sql += ' WHERE status = ?';
    args.push(status);
  }
  const result = await c.execute({ sql, args });
  return (result.rows[0] as Record<string, unknown>).cnt as number ?? 0;
}

export async function getTotalGemsSold(): Promise<number> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: "SELECT COALESCE(SUM(gems), 0) as total FROM GemOrder WHERE status = 'confirmed'",
    args: [],
  });
  return (result.rows[0] as Record<string, unknown>).total as number ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════
// Dashboard Stats
// ═══════════════════════════════════════════════════════════════════════

export async function getDashboardStats(): Promise<{
  totalPlayers: number;
  totalGames: number;
  totalGemsSold: number;
  totalEvents: number;
  activeEvents: number;
  premiumSold: number;
}> {
  await ensureAdminTables();
  const c = getClient();

  const players = await c.execute({ sql: 'SELECT COUNT(*) as cnt FROM Player', args: [] });
  const games = await c.execute({ sql: 'SELECT COUNT(*) as cnt FROM Room', args: [] });
  const gems = await c.execute({ sql: "SELECT COALESCE(SUM(gems), 0) as total FROM GemOrder WHERE status = 'confirmed'", args: [] });
  const events = await c.execute({ sql: 'SELECT COUNT(*) as cnt FROM Event', args: [] });
  const activeEvents = await c.execute({ sql: 'SELECT COUNT(*) as cnt FROM Event WHERE isActive = 1', args: [] });
  const premium = await c.execute({ sql: "SELECT COUNT(*) as cnt FROM PremiumId WHERE status = 'sold'", args: [] });

  return {
    totalPlayers: (players.rows[0] as Record<string, unknown>).cnt as number ?? 0,
    totalGames: (games.rows[0] as Record<string, unknown>).cnt as number ?? 0,
    totalGemsSold: (gems.rows[0] as Record<string, unknown>).total as number ?? 0,
    totalEvents: (events.rows[0] as Record<string, unknown>).cnt as number ?? 0,
    activeEvents: (activeEvents.rows[0] as Record<string, unknown>).cnt as number ?? 0,
    premiumSold: (premium.rows[0] as Record<string, unknown>).cnt as number ?? 0,
  };
}
