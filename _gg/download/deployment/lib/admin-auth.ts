import { createClient, Client } from '@libsql/client';
import { createHash, randomUUID, scryptSync, timingSafeEqual } from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}

// ─── Client singleton ─────────────────────────────────────────────────

let _client: Client | null = null;

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

async function ensureAdminTables(): Promise<void> {
  const c = getClient();

  await c.execute(`
    CREATE TABLE IF NOT EXISTS AdminUser (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Seed default admin if no admin exists
  const result = await c.execute('SELECT COUNT(*) as count FROM AdminUser');
  const count = Number(result.rows[0]?.count ?? 0);

  if (count === 0) {
    const hash = hashPassword('Ghaleb@2024');
    await c.execute({
      sql: `INSERT INTO AdminUser (id, username, passwordHash, role)
            VALUES (?, ?, ?, ?)`,
      args: [randomUUID(), 'admin', hash, 'super_admin'],
    });
  }
}

// ─── Password hashing (scrypt) ────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = scryptSync(password, salt, 64).toString('hex');
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
  } catch {
    return false;
  }
}

// ─── Auth functions ───────────────────────────────────────────────────

export async function authenticateUser(
  username: string,
  password: string
): Promise<{ token: string; user: AdminUser } | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AdminUser WHERE username = ?',
    args: [username],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as Record<string, unknown>;
  const user: AdminUser = {
    id: row.id as string,
    username: row.username as string,
    passwordHash: row.passwordHash as string,
    role: (row.role as string) ?? 'admin',
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };

  if (!verifyPassword(password, user.passwordHash)) return null;

  // Create JWT-like token
  const token = randomUUID();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  // Store token hash in database (we use AdminUser table with a separate approach)
  // For simplicity, we'll store active tokens in a simple way
  await c.execute({
    sql: `CREATE TABLE IF NOT EXISTS AdminToken (
      tokenHash TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES AdminUser(id)
    )`,
    args: [],
  });

  await c.execute({
    sql: 'INSERT INTO AdminToken (tokenHash, userId, expiresAt) VALUES (?, ?, ?)',
    args: [tokenHash, user.id, expiresAt],
  });

  return { token, user };
}

export async function validateToken(token: string): Promise<AdminUser | null> {
  const c = getClient();

  // Ensure tables exist
  await ensureAdminTables();
  await c.execute({
    sql: `CREATE TABLE IF NOT EXISTS AdminToken (
      tokenHash TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES AdminUser(id)
    )`,
    args: [],
  });

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = new Date().toISOString();

  // Clean expired tokens
  await c.execute({
    sql: 'DELETE FROM AdminToken WHERE expiresAt < ?',
    args: [now],
  });

  const result = await c.execute({
    sql: `SELECT a.* FROM AdminUser a
          JOIN AdminToken t ON a.id = t.userId
          WHERE t.tokenHash = ? AND t.expiresAt > ?`,
    args: [tokenHash, now],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as Record<string, unknown>;
  return {
    id: row.id as string,
    username: row.username as string,
    passwordHash: row.passwordHash as string,
    role: (row.role as string) ?? 'admin',
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };
}

export async function revokeToken(token: string): Promise<void> {
  const c = getClient();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await c.execute({
    sql: 'DELETE FROM AdminToken WHERE tokenHash = ?',
    args: [tokenHash],
  });
}

export async function changePassword(
  username: string,
  newPassword: string
): Promise<boolean> {
  await ensureAdminTables();
  const c = getClient();

  const newHash = hashPassword(newPassword);
  const result = await c.execute({
    sql: 'UPDATE AdminUser SET passwordHash = ? WHERE username = ?',
    args: [newHash, username],
  });

  return result.rowsAffected > 0;
}
