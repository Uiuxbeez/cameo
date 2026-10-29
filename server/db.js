import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis:15000, idleTimeoutMillis:30000 });
export const db = drizzle(pool);
