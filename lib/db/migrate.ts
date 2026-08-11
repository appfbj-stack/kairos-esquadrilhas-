import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index';

async function main() {
  console.log('[migrate] Rodando migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[migrate] OK');
  await pool.end();
}

main().catch((err) => {
  console.error('[migrate] Falha:', err);
  process.exit(1);
});
