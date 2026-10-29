import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seoHead,safeJson,initialBody} from '../shared/seo.js';
import {cleanPage} from '../server/validation.js';
import {servicePage} from '../server/service-template.js';
import {readFile} from 'node:fs/promises';
import {onRequest} from '../functions/_middleware.js';
const templates=JSON.parse(await readFile('content/pages.json','utf8'));
test('SEO values survive page validation and safely produce social metadata',()=>{
 const page=cleanPage({...templates[0],seo:{metaTitle:'Custom <title>',canonical:'https://example.com/',ogImage:'/api/media/image',ogImageAlt:'Signage',noindex:true,schemaJson:'{"@type":"Organization","name":"</script><script>alert(1)</script>"}'}});
 const head=seoHead(page,'https://example.com');assert.match(head,/Custom &lt;title&gt;/);assert.match(head,/noindex, follow/);assert.match(head,/og:image/);assert.match(head,/https:\/\/example.com\/api\/media\/image/);assert.ok(!head.includes('<script>alert'));assert.match(head,/application\/ld\+json/);
 assert.throws(()=>cleanPage({...page,seo:{schemaJson:'{broken'}}));assert.throws(()=>cleanPage({...page,seo:{canonical:'javascript:alert(1)'}}));
});
test('service draft uses the service template and has unique content',()=>{
 const p=servicePage(templates.find(p=>p.slug==='service-outdoor-signage'),{slug:'service-test',title:'New Service',summary:'New service summary',image:'/assets/new.jpg'});
 assert.equal(p.sections.length,5);assert.match(p.sections[0].html,/<h1>New Service<\/h1>/);assert.ok(p.sections[1].html.includes('/assets/new.jpg'));assert.ok(!p.sections[1].html.includes('Outdoor Signage'));assert.ok(initialBody(p).includes('New service summary'));
});
test('serialized initial state cannot escape its JSON script',()=>{assert.ok(!safeJson({title:'</script><script>alert(1)'}).includes('<'));});
test('edge middleware returns real 404 and robots excludes admin',async()=>{
 const fetchOriginal=globalThis.fetch;globalThis.fetch=async()=>new Response('{}',{status:404});
 const ctx=path=>({request:new Request('https://example.com'+path),env:{API_ORIGIN:'https://api.example.com',SITE_URL:'https://example.com'},next:async()=>new Response('app')});
 try{const missing=await onRequest(ctx('/missing'));assert.equal(missing.status,404);assert.match(await missing.text(),/noindex/);const robots=await onRequest(ctx('/robots.txt'));assert.match(await robots.text(),/Disallow: \/admin/);const admin=await onRequest(ctx('/admin/page-builder'));assert.equal(admin.headers.get('X-Robots-Tag'),'noindex, nofollow');}finally{globalThis.fetch=fetchOriginal;}
});
test('sitemap excludes drafts via API, noindex pages and alternate canonicals',async()=>{
 const fetchOriginal=globalThis.fetch;globalThis.fetch=async()=>Response.json([{slug:'home',seo:{},updatedAt:'2026-01-01'},{slug:'private',seo:{noindex:true},updatedAt:'2026-01-01'},{slug:'duplicate',seo:{canonical:'https://example.com/other'},updatedAt:'2026-01-01'}]);
 try{const r=await onRequest({request:new Request('https://example.com/sitemap.xml'),env:{API_ORIGIN:'https://api.example.com'},next:()=>{}});const xml=await r.text();assert.match(xml,/<loc>https:\/\/example.com\/<\/loc>/);assert.ok(!xml.includes('private'));assert.ok(!xml.includes('duplicate'));}finally{globalThis.fetch=fetchOriginal;}
});
