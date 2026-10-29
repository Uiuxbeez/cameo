// Cloudflare Pages same-origin proxy. API_ORIGIN is a server-side Pages variable.
export async function onRequest({request,env}) {
 if(!env.API_ORIGIN)return Response.json({error:'API_ORIGIN is not configured.'},{status:503});
 const original=new URL(request.url),upstream=new URL(env.API_ORIGIN);
 if(upstream.protocol!=='https:')return Response.json({error:'API_ORIGIN must use HTTPS.'},{status:503});
 upstream.pathname=original.pathname;upstream.search=original.search;
 const headers=new Headers(request.headers);headers.delete('host');headers.delete('x-forwarded-host');headers.delete('x-forwarded-for');
 headers.set('x-forwarded-for',request.headers.get('cf-connecting-ip')||'');
 try {return await fetch(new Request(upstream,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,redirect:'manual'}));}
 catch {return Response.json({error:'The API is temporarily unavailable.'},{status:502});}
}
