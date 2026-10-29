import { db,pool } from './db.js';
import { users } from './schema.js';
import { hashPassword } from './auth.js';
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length<14) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters).');
try {
 await db.insert(users).values({email:process.env.ADMIN_EMAIL.toLowerCase().trim(),password:await hashPassword(process.env.ADMIN_PASSWORD)}).onConflictDoNothing();
 console.log('Administrator created if absent; existing password unchanged.');
} finally { await pool.end(); }
