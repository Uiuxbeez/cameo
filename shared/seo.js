export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeJson=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export const pagePath=slug=>slug==='home'?'/':`/${slug}`;
export function absolute(value,origin){try{const u=new URL(value,origin);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function seoData(page,origin){
 const s=page.seo||{},canonical=absolute(s.canonical||pagePath(page.slug),origin);
 return {title:s.metaTitle||page.title,description:page.description,canonical,robots:`${s.noindex?'noindex':'index'}, ${s.nofollow?'nofollow':'follow'}`,ogTitle:s.ogTitle||s.metaTitle||page.title,ogDescription:s.ogDescription||page.description,image:s.ogImage?absolute(s.ogImage,origin):'',imageAlt:s.ogImageAlt||'',type:s.ogType||'website',twitterCard:s.twitterCard||'summary_large_image'};
}
export function schemaData(page,origin){
 const s=page.seo||{},m=seoData(page,origin),name=page.title.replace(/\s*\|.*$/,'');
 const graph=[];
 if(s.autoSchema!==false){
  graph.push({'@type':page.slug.startsWith('service-')?'Service':'WebPage','@id':m.canonical+'#page',name,url:m.canonical,description:page.description,...(page.slug.startsWith('service-')?{provider:{'@type':'Organization',name:'Cameo Advertising',url:origin}}:{})});
  if(page.slug!=='home')graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:absolute('/',origin)},{'@type':'ListItem',position:2,name,item:m.canonical}]});
 }
 if(s.schemaJson){try{const custom=JSON.parse(s.schemaJson);graph.push(...(Array.isArray(custom)?custom:[custom]));}catch{}}
 return graph.length?{'@context':'https://schema.org','@graph':graph}:null;
}
export function seoHead(page,origin,{preview=false}={}){
 const m=seoData(page,origin),e=escapeHtml;
 const tags=[`<title data-cms-seo>${e(m.title)}</title>`,`<meta data-cms-seo name="description" content="${e(m.description)}">`,`<link data-cms-seo rel="canonical" href="${e(m.canonical)}">`,`<meta data-cms-seo name="robots" content="${preview?'noindex, nofollow':m.robots}">`];
 for(const [key,value] of Object.entries({'og:title':m.ogTitle,'og:description':m.ogDescription,'og:url':m.canonical,'og:type':m.type,'og:site_name':'Cameo Advertising',...(m.image?{'og:image':m.image,'og:image:alt':m.imageAlt}:{})}))tags.push(`<meta data-cms-seo property="${key}" content="${e(value)}">`);
 for(const [key,value] of Object.entries({'twitter:card':m.twitterCard,'twitter:title':m.ogTitle,'twitter:description':m.ogDescription,...(m.image?{'twitter:image':m.image,'twitter:image:alt':m.imageAlt}:{})}))tags.push(`<meta data-cms-seo name="${key}" content="${e(value)}">`);
 const schema=schemaData(page,origin);if(schema)tags.push(`<script data-cms-seo type="application/ld+json">${safeJson(schema)}</script>`);
 return tags.join('\n');
}
export function initialBody(page){return `<div class="main-wrapper" role="main">${page.header}${page.sections.filter(s=>s.visible).map(s=>s.html.replace(/<div data-cms-header="true"><\/div>/g,'')).join('')}${page.footer}</div>${page.auxiliary}`;}
