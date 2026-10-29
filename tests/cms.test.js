import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {drizzle} from 'drizzle-orm/pglite';
import {migrate} from 'drizzle-orm/pglite/migrator';
import {createApp} from '../server/app.js';
import {users,pages} from '../server/schema.js';
import {hashPassword} from '../server/auth.js';
import {cleanPage,cleanHtml} from '../server/validation.js';
let pg,db,server,url,cookie;
const headers={origin:'http://localhost:5173','content-type':'application/json'};
const call=(path,options={})=>fetch(url+path,{...options,headers:{...headers,...(cookie?{cookie}:{}),...options.headers}});
before(async()=>{
 pg=new PGlite();db=drizzle(pg);await migrate(db,{migrationsFolder:'server/migrations',migrationsSchema:'cameo_cms_migrations'});
 await db.insert(users).values({email:'test@example.com',password:await hashPassword('Test-password-123456')});
 for(const page of JSON.parse(await readFile('content/pages.json','utf8'))){const content=cleanPage(page);await db.insert(pages).values({slug:page.slug,draft:content,published:content,publishedVersion:1});}
 server=createApp(db).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));url=`http://127.0.0.1:${server.address().port}/api`;
});
after(async()=>{if(server)await new Promise(r=>server.close(r));if(pg)await pg.close();});
test('anonymous callers cannot read drafts or mutate pages',async()=>{assert.equal((await call('/admin/pages')).status,401);assert.equal((await call('/admin/pages/home',{method:'PUT',body:'{}'})).status,401);});
test('untrusted origins cannot log in',async()=>{assert.equal((await call('/auth/login',{method:'POST',headers:{origin:'https://evil.example'},body:'{}'})).status,403);});
test('draft save, conflict protection, explicit publish, logout',async()=>{
 const login=await call('/auth/login',{method:'POST',body:JSON.stringify({email:'test@example.com',password:'Test-password-123456'})});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);
 const row=await (await call('/admin/pages/home')).json();const changed={...row.draft,title:'Unpublished heading'};
 const save=await call('/admin/pages/home',{method:'PUT',body:JSON.stringify({version:row.version,content:changed})});assert.equal(save.status,200);
 assert.notEqual((await (await call('/pages/home')).json()).title,'Unpublished heading');
 assert.equal((await call('/admin/pages/home',{method:'PUT',body:JSON.stringify({version:row.version,content:changed})})).status,409);
 assert.equal((await call('/admin/pages/home/publish',{method:'POST',body:JSON.stringify({version:row.version})})).status,409);
 assert.equal((await call('/admin/pages/home/publish',{method:'POST',body:JSON.stringify({version:row.version+1})})).status,200);
 assert.equal((await (await call('/pages/home')).json()).title,'Unpublished heading');
 assert.equal((await call('/auth/logout',{method:'POST'})).status,200);assert.equal((await call('/admin/pages')).status,401);cookie=null;
});
test('enquiries validate and persist',async()=>{
 assert.equal((await call('/enquiries',{method:'POST',body:'{}'})).status,400);
 assert.equal((await call('/enquiries',{method:'POST',body:JSON.stringify({name:'Test Person',email:'test@example.com',subject:'Signage',message:'Please contact me.'})})).status,201);
});
test('HTML sanitization removes active content and preserves Cameo features',()=>{
 const cleaned=cleanHtml('<div class="ca-hero" style="background-image:linear-gradient(90deg,rgba(9,13,20,.9),rgba(9,13,20,.4)),url(\'/assets/img/test.jpg\')"><script>alert(1)</script><img src="/assets/a.jpg" onerror="alert(1)"><a href="javascript:alert(1)">Unsafe</a><iframe src="https://evil.example"></iframe></div>');
 assert.ok(!cleaned.includes('<script'));assert.ok(!cleaned.includes('onerror'));assert.ok(!cleaned.includes('javascript:'));assert.ok(!cleaned.includes('src="https://evil.example"'));assert.ok(cleaned.includes('background-image:'));assert.ok(cleaned.includes('class="ca-hero"'));
});
test('every imported page is valid and contains its original sections',async()=>{
 const imports=JSON.parse(await readFile('content/pages.json','utf8'));assert.equal(imports.length,13);
 for(const page of imports){const clean=cleanPage(page);assert.equal(clean.sections.length,page.sections.length);assert.ok(clean.sections[0].html.includes('data-cms-header'));}
});
test('service pages start as drafts and service grids cannot publish broken draft links',async()=>{
 const login=await call('/auth/login',{method:'POST',body:JSON.stringify({email:'test@example.com',password:'Test-password-123456'})});cookie=login.headers.get('set-cookie').split(';')[0];
 try{
  const created=await call('/admin/service-pages',{method:'POST',body:JSON.stringify({slug:'service-new-test',title:'Test Service',summary:'A new service summary.',image:'/assets/test.jpg'})});assert.equal(created.status,201);const detail=await created.json();assert.equal(detail.published,null);
  assert.equal((await call('/pages/service-new-test')).status,404);
  const row=await (await call('/admin/pages/services')).json();row.draft.seo={metaTitle:'Services SEO',ogImage:'/assets/og.jpg',canonical:'https://example.com/services'};row.draft.sections.find(s=>s.html.includes('signature-item')).html=row.draft.sections.find(s=>s.html.includes('signature-item')).html.replace('/service-wayfinding-signage','/service-new-test');
  const saved=await (await call('/admin/pages/services',{method:'PUT',body:JSON.stringify({version:row.version,content:row.draft})})).json();assert.equal(saved.draft.seo.metaTitle,'Services SEO');
  assert.equal((await call('/admin/pages/services/publish',{method:'POST',body:JSON.stringify({version:saved.version})})).status,422);
  assert.equal((await call('/admin/pages/service-new-test/publish',{method:'POST',body:JSON.stringify({version:detail.version})})).status,200);
  assert.equal((await call('/admin/pages/services/publish',{method:'POST',body:JSON.stringify({version:saved.version})})).status,200);
 }finally{await call('/auth/logout',{method:'POST'});cookie=null;}
});
