import React,{useEffect,useState,useRef} from 'react';
import parse from 'html-react-parser';
import { api } from './api';
import { initPage } from './runtime';
import publicOverrides from './public-overrides.css?inline';
import {seoHead} from '../../shared/seo.js';

export function Page({content,preview=false}){
 const ref=useRef(null);
 useEffect(()=>{
  document.documentElement.className=content.htmlClass;
  const bootstrap=document.getElementById('cameo-initial-page');let initial;try{initial=JSON.parse(bootstrap?.textContent||'null');}catch{}
  document.head.querySelectorAll('[data-cms-seo],title,meta[name="description"]').forEach(el=>el.remove());
  const tags=document.createElement('template');tags.innerHTML=seoHead(content,initial?.origin||location.origin,{preview:preview||initial?.previewHost});document.head.append(tags.content);
  const links=content.styles.map(href=>{const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);return link;});
  const style=document.createElement('style');style.textContent=publicOverrides;document.head.append(style);
  const dispose=initPage(ref.current,{preview});
  return()=>{dispose();links.forEach(l=>l.remove());style.remove();};
 },[content,preview]);
 const options={replace(node){
  if(node.attribs?.['data-cms-header']) return <></>;
  // React's template children are not moved to HTMLTemplateElement.content.
  if(node.name==='template')return <template {...node.attribs} dangerouslySetInnerHTML={{__html:node.children.map(n=>n.type==='text'?n.data:serialize(n)).join('')}}/>;
 }};
 function serialize(node){if(node.type==='text')return node.data; const attrs=Object.entries(node.attribs||{}).map(([k,v])=>` ${k}="${v.replaceAll('&','&amp;').replaceAll('"','&quot;')}"`).join('');return `<${node.name}${attrs}>${(node.children||[]).map(serialize).join('')}</${node.name}>`;}
 return <div ref={ref}><div className="main-wrapper" role="main">{parse(content.header)}{content.sections.filter(s=>s.visible).map(s=><React.Fragment key={s.id}>{parse(s.html,options)}</React.Fragment>)}{parse(content.footer)}</div>{parse(content.auxiliary)}</div>;
}
export function PublicPage(){
 const [content,setContent]=useState(()=>{try{return JSON.parse(document.getElementById('cameo-initial-page')?.textContent||'null')?.content||null;}catch{return null;}}),[error,setError]=useState('');
 let slug=location.pathname.replace(/^\/+|\/+$/g,'').replace(/\.html$/,'');if(!slug||['index','index-skin2'].includes(slug))slug='home';
 useEffect(()=>{if(content?.slug===slug)return;api(`/pages/${encodeURIComponent(slug)}`).then(setContent).catch(e=>setError(e.message));},[slug]);
 if(error)return <main style={{padding:50,fontFamily:'sans-serif'}}><h1>{error}</h1><a href="/">Return home</a></main>;
 return content?<Page content={content}/>:<p style={{padding:40}}>Loading Cameo Advertising…</p>;
}
export function Preview(){
 const [content,setContent]=useState(null);
 useEffect(()=>{const receive=e=>{if(e.origin===location.origin && e.source===window.parent && e.data?.type==='cameo-preview')setContent(e.data.content);};window.addEventListener('message',receive);window.parent.postMessage({type:'cameo-preview-ready'},location.origin);return()=>window.removeEventListener('message',receive);},[]);
 return content?<Page content={content} preview/>:<p>Loading draft preview…</p>;
}
