import {seoHead,initialBody,safeJson,escapeHtml,absolute,pagePath} from '../shared/seo.js';
function unavailable(){return new Response('The website is temporarily unavailable. Please try again.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Retry-After':'60','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
export async function onRequest(context){
 const {request,env}=context,url=new URL(request.url),path=url.pathname;
 if(path.startsWith('/api/')||path.startsWith('/assets/')||!['GET','HEAD'].includes(request.method))return context.next();
 if(path.startsWith('/admin')||path==='/preview'){const response=await context.next();const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex, nofollow');return new Response(response.body,{status:response.status,headers});}
 if(/\.[a-z0-9]+$/i.test(path)&&!path.endsWith('.html')&&!['/sitemap.xml','/robots.txt'].includes(path))return context.next();
 let upstream,origin;
 try{upstream=new URL(env.API_ORIGIN);if(upstream.protocol!=='https:')return unavailable();origin=env.SITE_URL?new URL(env.SITE_URL).origin:url.origin;}catch{return unavailable();}
 const previewHost=Boolean(env.SITE_URL&&url.origin!==origin);
 if(path==='/robots.txt')return new Response(`User-agent: *\n${previewHost?'Disallow: /':'Allow: /\nDisallow: /admin\nDisallow: /preview\nDisallow: /api/'}\nSitemap: ${origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
 try{
  if(path==='/sitemap.xml'){
   const result=await fetch(new URL('/api/seo/pages',upstream));if(!result.ok)return unavailable();const rows=await result.json();
   const urls=rows.filter(r=>!r.seo?.noindex&&(!r.seo?.canonical||absolute(r.seo.canonical,origin)===absolute(pagePath(r.slug),origin))).map(r=>`<url><loc>${escapeHtml(absolute(pagePath(r.slug),origin))}</loc><lastmod>${escapeHtml(new Date(r.updatedAt).toISOString())}</lastmod></url>`).join('');
   return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-cache'}});
  }
  let slug=path.replace(/^\/+|\/+$/g,'').replace(/\.html$/,'');if(!slug||['index','index-skin2'].includes(slug))slug='home';
  if(!/^[a-z0-9-]+$/.test(slug))return new Response('Page not found',{status:404});
  const response=await fetch(new URL(`/api/pages/${encodeURIComponent(slug)}`,upstream),{headers:{Accept:'application/json'}});
  if(response.status===404)return new Response('<!doctype html><html lang="en"><head><title>Page not found | Cameo Advertising</title><meta name="robots" content="noindex"></head><body><h1>Page not found</h1><a href="/">Return home</a></body></html>',{status:404,headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'}});
  if(!response.ok)return unavailable();
  const content=await response.json();
  if(path!==pagePath(slug)){const dest=new URL(pagePath(slug),url.origin);dest.search=url.search;return Response.redirect(dest.href,301);}
  const shell=await context.env.ASSETS.fetch(new URL('/index.html',url.origin));if(!shell.ok)return unavailable();
  const head=seoHead(content,origin,{preview:previewHost})+content.styles.map(href=>`<link data-cms-style rel="stylesheet" href="${escapeHtml(href)}">`).join('')+'<style>.wow{visibility:visible!important}[data-service-hidden="true"]{display:none!important}</style>';
  const bootstrap=`<script id="cameo-initial-page" type="application/json">${safeJson({content,origin,previewHost})}</script>`;
  const rewritten=new HTMLRewriter().on('html',{element(el){el.setAttribute('class',content.htmlClass);}}).on('title',{element(el){el.remove();}}).on('head',{element(el){el.append(head,{html:true});}}).on('#root',{element(el){el.setInnerContent(initialBody(content),{html:true});}}).on('body',{element(el){el.append(bootstrap,{html:true});}}).transform(shell);
  const headers=new Headers(rewritten.headers);headers.set('Cache-Control','no-store');headers.delete('Content-Length');headers.delete('ETag');if(previewHost||content.seo?.noindex)headers.set('X-Robots-Tag','noindex');
  return new Response(request.method==='HEAD'?null:rewritten.body,{status:200,headers});
 }catch{return unavailable();}
}
