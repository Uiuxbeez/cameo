import { z } from 'zod';
import sanitize from 'sanitize-html';
const localAsset = z.string().max(1000).refine(s=>s.startsWith('/assets/') || /^https:\/\/(fonts\.googleapis\.com|unpkg\.com)\//.test(s),'Invalid stylesheet');
const section = z.object({id:z.string().min(1).max(150),name:z.string().min(1).max(150),visible:z.boolean(),html:z.string().max(700000)});
const seoUrl=z.string().max(2000).refine(v=>!v||/^https?:\/\/[^\s]+$/.test(v),'Use a full http(s) URL');
const seo=z.object({metaTitle:z.string().max(200).default(''),canonical:seoUrl.default(''),noindex:z.boolean().default(false),nofollow:z.boolean().default(false),ogTitle:z.string().max(200).default(''),ogDescription:z.string().max(500).default(''),ogImage:z.string().max(2000).refine(v=>!v||/^\/(?!\/)[^\s]*$/.test(v)||/^https?:\/\/[^\s]+$/.test(v),'Invalid image URL').default(''),ogImageAlt:z.string().max(300).default(''),ogType:z.enum(['website','article']).default('website'),twitterCard:z.enum(['summary','summary_large_image']).default('summary_large_image'),autoSchema:z.boolean().default(true),schemaJson:z.string().max(50000).refine(v=>{if(!v.trim())return true;try{const data=JSON.parse(v);return !!data&&typeof data==='object';}catch{return false;}},'Schema must be valid JSON-LD (an object or array), without script tags').default('')});
export const pageSchema = z.object({
 slug:z.string().regex(/^[a-z0-9-]+$/).max(100), title:z.string().min(1).max(200), description:z.string().max(500),
 seo:seo.optional(),
 htmlClass:z.string().regex(/^[\w -]*$/).max(200), styles:z.array(localAsset).max(20),
 header:z.string().max(100000), footer:z.string().max(100000), auxiliary:z.string().max(100000), sections:z.array(section).min(1).max(80),
}).refine(p=>new Set(p.sections.map(s=>s.id)).size===p.sections.length,'Duplicate section IDs');
export function cleanHtml(html) {
 return sanitize(html, {
  allowedTags:[...sanitize.defaults.allowedTags,'img','picture','source','video','iframe','form','input','textarea','button','label','select','option','template','svg','path','circle','rect','line','polyline','polygon','defs','linearGradient','stop','use'],
  allowedAttributes:{'*':['id','class','style','title','role','aria-*','data-*','tabindex','hidden'],a:['href','target','rel'],img:['src','alt','width','height','loading','decoding','fetchpriority'],video:['src','poster','autoplay','loop','muted','playsinline','controls','preload'],source:['src','type'],iframe:['src','title','loading','referrerpolicy','allowfullscreen','allow','width','height'],form:['id','class','action','method'],input:['type','name','value','required','placeholder','autocomplete','min','max','maxlength'],textarea:['name','rows','required','placeholder'],button:['type','disabled'],label:['for'],select:['name'],option:['value','selected'],svg:['viewBox','width','height','fill','xmlns'],path:['d','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin'],circle:['cx','cy','r','fill','stroke'],rect:['x','y','width','height','fill','rx'],linearGradient:['id','x1','y1','x2','y2'],stop:['offset','stop-color'],use:['href']},
  parser:{lowerCaseAttributeNames:false,lowerCaseTags:false},
  allowedSchemes:['http','https','mailto','tel'], allowProtocolRelative:false,
  allowedIframeHostnames:['maps.google.com','www.google.com','www.youtube.com','www.youtube-nocookie.com'],
  allowedStyles:{'*':{
   'background':[/^[#\w\s.,%()/-]+$/], 'background-image':[/^(?:linear-gradient\([#\w\s.,%()-]+\),\s*)?url\(["']?(?:\/assets\/|\/api\/media\/|https:\/\/)[\w./%?=&+-]+["']?\)$/],
   'background-color':[/^[#\w\s.,%()-]+$/], 'color':[/^[#\w\s.,%()-]+$/],
   'padding':[/^[\d.\s%a-z-]+$/], 'margin':[/^[\d.\s%a-z-]+$/], 'margin-top':[/^[\d.\s%a-z-]+$/], 'width':[/^[\d.%a-z-]+$/], 'height':[/^[\d.%a-z-]+$/], 'max-width':[/^[\d.%a-z-]+$/], 'min-height':[/^[\d.%a-z-]+$/], 'object-fit':[/^(contain|cover)$/], 'border-radius':[/^[\d.%a-z\s]+$/], 'display':[/^(none|block|flex|inline-block)$/], 'font-size':[/^[\d.%a-z]+$/], 'text-align':[/^(left|right|center)$/],
  }},
  transformTags:{a:(tag,attrs)=>({tagName:tag,attribs:{...attrs,...(attrs.target==='_blank'?{rel:'noopener noreferrer'}:{})}})},
 });
}
export function cleanPage(input) { const p=pageSchema.parse(input); return {...p,header:cleanHtml(p.header),footer:cleanHtml(p.footer),auxiliary:cleanHtml(p.auxiliary),sections:p.sections.map(s=>({...s,html:cleanHtml(s.html)}))}; }
export const enquirySchema = z.object({ name:z.string().trim().min(1).max(150), email:z.email().max(254), company:z.string().max(150).default(''), phone:z.string().max(50).default(''), subject:z.string().trim().min(1).max(200), message:z.string().trim().min(1).max(10000), website:z.string().max(0).optional() });
