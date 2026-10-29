import { readFile } from 'node:fs/promises';
import { db, pool } from './db.js';
import { pages } from './schema.js';
import { cleanPage } from './validation.js';
const content = JSON.parse(await readFile('content/pages.json','utf8'));
try {
  await db.transaction(async tx => {
    for (const page of content) { const clean = cleanPage(page); await tx.insert(pages).values({slug:page.slug,draft:clean,published:clean,publishedVersion:1}).onConflictDoNothing(); }
  });
  console.log(`Seed checked ${content.length} pages; existing edits preserved.`);
} finally { await pool.end(); }
