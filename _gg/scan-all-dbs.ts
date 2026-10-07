import { createClient } from '@libsql/client';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

async function checkDb(path: string) {
  try {
    const stats = statSync(path);
    if (stats.size === 0) { console.log(`  ${path}: EMPTY (0 bytes)`); return; }
    const c = createClient({ url: `file:${path}` });
    const tables = await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='VoiceRoom'");
    if (tables.rows.length === 0) { console.log(`  ${path}: No VoiceRoom table`); return; }
    const rooms = await c.execute('SELECT id, name, hostId, hostName FROM VoiceRoom');
    console.log(`  ${path}: ${rooms.rows.length} rooms`);
    for (const r of rooms.rows) {
      console.log(`    id=${r.id} name=${r.name} host=${r.hostName}`);
    }
  } catch(e: any) {
    console.log(`  ${path}: ERROR - ${e.message}`);
  }
}

async function main() {
  // Check known paths
  const paths = [
    '/home/z/my-project/db/custom.db',
    '/home/z/my-project/db/dev.db',
    '/home/z/my-project/db/data.db',
    '/home/z/my-project/data.db',
  ];
  
  for (const p of paths) await checkDb(p);
  
  // Also check if app uses a different file at runtime
  console.log('\n--- Checking DATABASE_URL resolution ---');
  const url = process.env.DATABASE_URL || 'file:db/data.db';
  console.log('DATABASE_URL env:', url);
  
  process.exit(0);
}

main();
