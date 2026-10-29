import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { pages,users,sessions,media,enquiries } from './schema.js';
import { checkPassword,tokenHash,newToken,hashPassword } from './auth.js';
import { cleanPage,enquirySchema } from './validation.js';

export function createApp(db, { origins=['http://localhost:5173','http://127.0.0.1:5173'], production=false }={}) {
 const app=express(); app.disable('x-powered-by'); app.set('trust proxy',1);
 app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
 app.use(express.json({limit:'3mb'}));
 app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store'); next();});
 // Same-origin Cloudflare proxy + Vite proxy: no cross-site cookies or wildcard CORS.
 app.use('/api',(req,res,next)=>{
  if (!['GET','HEAD','OPTIONS'].includes(req.method) && !origins.includes(req.get('origin'))) return res.status(403).json({error:'Untrusted request origin.'});
  next();
 });
 const auth=async(req,res,next)=>{
  const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('cameo_session='))?.slice(14);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({error:'Please sign in.'});
  const [row]=await db.select({id:users.id,email:users.email}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.hash,tokenHash(token)),gt(sessions.expiresAt,new Date())));
  if (!row) return res.status(401).json({error:'Your session expired. Please sign in.'});
  req.user=row; req.sessionHash=tokenHash(token); next();
 };
 const cookie={httpOnly:true,secure:production,sameSite:'lax',path:'/api',maxAge:12*60*60*1000};
 app.get('/api/health',async(_req,res)=>{await db.execute(sql`select 1`);res.json({ok:true});});
 app.post('/api/auth/login',rateLimit({windowMs:15*60*1000,limit:15,standardHeaders:'draft-7',legacyHeaders:false}),async(req,res)=>{
  const {email,password}=z.object({email:z.email(),password:z.string().min(1).max(200)}).parse(req.body);
  const [user]=await db.select().from(users).where(eq(users.email,email.toLowerCase().trim()));
  // Run a password derivation even for unknown accounts.
  const valid=user?await checkPassword(password,user.password):(await hashPassword(password),false);
  if (!valid) return res.status(401).json({error:'Email or password is incorrect.'});
  const token=newToken(); await db.insert(sessions).values({hash:tokenHash(token),userId:user.id,expiresAt:new Date(Date.now()+cookie.maxAge)});
  res.cookie('cameo_session',token,cookie).json({email:user.email});
 });
 app.get('/api/auth/me',auth,(req,res)=>res.json(req.user));
 app.post('/api/auth/logout',auth,async(req,res)=>{await db.delete(sessions).where(eq(sessions.hash,req.sessionHash));res.clearCookie('cameo_session',{...cookie,maxAge:undefined}).json({ok:true});});
 app.post('/api/auth/password',auth,async(req,res)=>{
  const {current,password}=z.object({current:z.string().max(200),password:z.string().min(14).max(200)}).parse(req.body);
  const [user]=await db.select().from(users).where(eq(users.id,req.user.id));
  if (!await checkPassword(current,user.password)) return res.status(400).json({error:'Current password is incorrect.'});
  await db.transaction(async tx=>{await tx.update(users).set({password:await hashPassword(password)}).where(eq(users.id,user.id));await tx.delete(sessions).where(eq(sessions.userId,user.id));});
  res.clearCookie('cameo_session',{...cookie,maxAge:undefined}).json({ok:true});
 });
 app.get('/api/pages/:slug',async(req,res)=>{const [row]=await db.select({content:pages.published}).from(pages).where(eq(pages.slug,req.params.slug)); if(!row?.content)return res.status(404).json({error:'Page not found.'});res.json(row.content);});
 app.get('/api/admin/pages',auth,async(_req,res)=>res.json(await db.select({slug:pages.slug,title:sql`${pages.draft}->>'title'`,version:pages.version,publishedVersion:pages.publishedVersion,updatedAt:pages.updatedAt}).from(pages).orderBy(pages.slug)));
 app.get('/api/admin/pages/:slug',auth,async(req,res)=>{const [row]=await db.select().from(pages).where(eq(pages.slug,req.params.slug));if(!row)return res.status(404).json({error:'Page not found.'});res.json(row);});
 app.put('/api/admin/pages/:slug',auth,async(req,res)=>{
  const version=z.number().int().positive().parse(req.body.version); const content=cleanPage(req.body.content);
  if(content.slug!==req.params.slug)return res.status(400).json({error:'Page slug cannot be changed.'});
  const [row]=await db.update(pages).set({draft:content,version:sql`${pages.version}+1`,updatedAt:new Date()}).where(and(eq(pages.slug,req.params.slug),eq(pages.version,version))).returning();
  if(!row)return res.status(409).json({error:'This page changed in another session. Reload it before saving.'});res.json(row);
 });
 app.post('/api/admin/pages/:slug/publish',auth,async(req,res)=>{
  const version=z.number().int().positive().parse(req.body.version);
  const [row]=await db.update(pages).set({published:sql`${pages.draft}`,publishedVersion:pages.version,updatedAt:new Date()}).where(and(eq(pages.slug,req.params.slug),eq(pages.version,version))).returning();
  if(!row)return res.status(409).json({error:'The draft changed. Reload before publishing.'});res.json(row);
 });
 app.post('/api/admin/pages',auth,async(req,res)=>{
  const {source,slug,title}=z.object({source:z.string(),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).refine(s=>!['admin','preview','api','assets','index','index-skin2'].includes(s)),title:z.string().min(1).max(200)}).parse(req.body);
  const [old]=await db.select().from(pages).where(eq(pages.slug,source));if(!old)return res.status(404).json({error:'Source page not found.'});
  const [row]=await db.insert(pages).values({slug,draft:{...old.draft,slug,title}}).onConflictDoNothing().returning();
  if(!row)return res.status(409).json({error:'That page URL already exists.'});res.status(201).json(row);
 });
 const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:1}});
 app.post('/api/admin/media',auth,upload.single('file'),async(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Choose an image.'});const type=await fileTypeFromBuffer(req.file.buffer);
  if(!type || !['image/png','image/jpeg','image/webp','image/gif','image/avif'].includes(type.mime))return res.status(400).json({error:'Use a PNG, JPEG, WebP, GIF or AVIF image.'});
  const [row]=await db.insert(media).values({name:req.file.originalname.slice(0,150),mime:type.mime,data:req.file.buffer}).returning({id:media.id,name:media.name});res.status(201).json({...row,url:`/api/media/${row.id}`});
 });
 app.get('/api/admin/media',auth,async(_req,res)=>res.json(await db.select({id:media.id,name:media.name,mime:media.mime}).from(media).orderBy(desc(media.createdAt)).limit(200)));
 app.get('/api/media/:id',async(req,res)=>{
  const id=z.uuid().parse(req.params.id);const [row]=await db.select().from(media).where(eq(media.id,id));if(!row)return res.sendStatus(404);
  res.set({'Content-Type':row.mime,'Cache-Control':'public, max-age=31536000, immutable','Content-Disposition':'inline'}).send(Buffer.from(row.data));
 });
 app.post('/api/enquiries',rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false}),async(req,res)=>{const data=enquirySchema.parse(req.body);delete data.website;await db.insert(enquiries).values(data);res.status(201).json({message:'Thank you. Your enquiry has been received.'});});
 app.get('/api/admin/enquiries',auth,async(_req,res)=>res.json(await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(200)));
 app.patch('/api/admin/enquiries/:id',auth,async(req,res)=>{const id=z.uuid().parse(req.params.id);const status=z.enum(['new','read','closed']).parse(req.body.status);await db.update(enquiries).set({status}).where(eq(enquiries.id,id));res.json({ok:true});});
 app.use((err,req,res,_next)=>{
  if(err instanceof z.ZodError)return res.status(400).json({error:err.issues.map(i=>i.message).join('; ')});
  if(err.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'Images must be 8 MB or smaller.'});
  if(err.type==='entity.too.large')return res.status(413).json({error:'Page content is too large.'});
  if(err instanceof SyntaxError)return res.status(400).json({error:'Invalid request body.'});
  console.error('API error:',err.code || err.name);res.status(500).json({error:'The request could not be completed. Please try again.'});
 });
 return app;
}
