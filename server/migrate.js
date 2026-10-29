import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in the server environment.');
const url = new URL(process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL);
url.hostname = url.hostname.replace('-pooler','');
const pool = new pg.Pool({connectionString:url.href, max:1, connectionTimeoutMillis:15000});
try { await migrate(drizzle(pool), { migrationsFolder:'server/migrations', migrationsSchema:'cameo_cms_migrations' }); console.log('CMS migrations applied.'); }
finally { await pool.end(); }
