/**
 * Applies ../../schema.sql to the database in DATABASE_URL.
 * Alternative to pasting schema.sql into the Supabase SQL Editor.
 *
 *   npm run db:schema
 */
require('dotenv/config');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const sql = fs.readFileSync(path.resolve(__dirname, '../../schema.sql'), 'utf8');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    const { rows } = await client.query(
      'SELECT (SELECT COUNT(*) FROM admins)::int AS admins, (SELECT COUNT(*) FROM inquiries)::int AS inquiries',
    );
    console.log(`Schema applied. admins=${rows[0].admins} inquiries=${rows[0].inquiries}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Failed to apply schema:', err.message);
  process.exit(1);
});
