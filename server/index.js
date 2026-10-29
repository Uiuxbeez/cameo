import { db,pool } from './db.js';
import { createApp } from './app.js';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.');
if(process.env.NODE_ENV==='production' && !process.env.FRONTEND_ORIGIN)throw new Error('FRONTEND_ORIGIN is required in production.');
const app=createApp(db,{production:process.env.NODE_ENV==='production',origins:(process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s=>s.trim())});
const server=app.listen(Number(process.env.PORT || 3001),'0.0.0.0',()=>console.log('Cameo API ready.'));
process.on('SIGTERM',()=>server.close(async()=>{await pool.end();process.exit(0);}));
