const tursoUrl = process.env.TURSO_DATABASE_URL;
const fallbackUrl = process.env.DATABASE_URL || 'file:db/data.db';
const nodeEnv = process.env.NODE_ENV;
const isLocalDev = !!nodeEnv && nodeEnv === 'development' && fallbackUrl.startsWith('file:');
const dbUrl = (tursoUrl && !isLocalDev) ? tursoUrl : fallbackUrl;

console.log('NODE_ENV:', nodeEnv || '(empty)');
console.log('TURSO_DATABASE_URL:', tursoUrl || '(empty)');
console.log('DATABASE_URL:', fallbackUrl);
console.log('isLocalDev:', isLocalDev);
console.log('>>> ACTUAL DB URL:', dbUrl);
process.exit(0);
