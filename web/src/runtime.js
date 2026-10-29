import { api } from './api';
const loaded=new Map();
function script(src){if(!loaded.has(src))loaded.set(src,new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(new Error(`Could not load ${src}`));document.head.append(el);}));return loaded.get(src);}
export function initPage(root,{preview}){
 const abort=new AbortController(),signal=abort.signal,cleanups=[];
 const on=(el,event,handler)=>el?.addEventListener(event,handler,{signal});
 const all=selector=>Array.from(root.querySelectorAll(selector));
 let saved;try{saved=localStorage.getItem('cameo-theme');}catch{}
 const theme=value=>{document.documentElement.dataset.cameoTheme=value;all('.cameo-theme-toggle').forEach(b=>{b.setAttribute('aria-pressed',String(value==='dark'));b.setAttribute('aria-label',`Switch to ${value==='dark'?'light':'dark'} mode`);b.innerHTML=`<i class="ti ti-${value==='dark'?'sun':'moon'}"></i>`;});};
 theme(saved||'light');all('.cameo-theme-toggle').forEach(b=>on(b,'click',()=>{const value=document.documentElement.dataset.cameoTheme==='dark'?'light':'dark';theme(value);try{localStorage.setItem('cameo-theme',value);}catch{}}));
 const scroll=()=>{root.querySelector('.s2-header')?.classList.toggle('is-scrolled',window.scrollY>10);const top=root.querySelector('.hero-section-one > .header-top');if(top)top.hidden=window.scrollY>10;};on(window,'scroll',scroll);scroll();
 on(root.querySelector('.back-to-top button'),'click',()=>window.scrollTo({top:0,behavior:'smooth'}));
 const closeMenu=()=>{document.documentElement.classList.remove('menu-opened');root.querySelector('.main-menu-wrapper')?.classList.remove('opened');root.querySelector('.sidebar-overlay')?.classList.remove('opened');};
 on(root.querySelector('#mobile_btn'),'click',()=>{document.documentElement.classList.add('menu-opened');root.querySelector('.main-menu-wrapper')?.classList.add('opened');root.querySelector('.sidebar-overlay')?.classList.add('opened');});
 on(root.querySelector('#menu_close'),'click',closeMenu);on(root.querySelector('.sidebar-overlay'),'click',closeMenu);
 all('.has-submenu > a').forEach(a=>on(a,'click',e=>{if(window.innerWidth<992){e.preventDefault();const menu=a.nextElementSibling;menu.style.display=menu.style.display==='block'?'none':'block';a.setAttribute('aria-expanded',String(menu.style.display==='block'));}}));
 const slides=all('.cameo-hero-slider > .tab-content > .tab-pane');
 if(slides.length>1 && !matchMedia('(prefers-reduced-motion: reduce)').matches){let active=0;const timer=setInterval(()=>{slides[active].classList.remove('active','show');active=(active+1)%slides.length;slides[active].classList.add('active','show');},6000);cleanups.push(()=>clearInterval(timer));}
 all('.ca-client-track').forEach(track=>{if(!track.firstElementChild)return;const clone=track.firstElementChild.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.querySelectorAll('[tabindex]').forEach(el=>el.removeAttribute('tabindex'));track.append(clone);cleanups.push(()=>clone.remove());});
 all('.s2-portfolio').forEach(section=>section.querySelectorAll('[data-filter]').forEach(button=>on(button,'click',()=>{section.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));section.querySelectorAll('[data-category]').forEach(card=>card.hidden=button.dataset.filter!=='All'&&button.dataset.filter!==card.dataset.category);})));
 const template=root.querySelector('#project-cards'),results=root.querySelector('#project-results'),more=root.querySelector('#load-projects');let lightbox;
 if(template&&results&&more){const cards=Array.from(template.content.children);let matching=cards,shown=0;const render=()=>{const batch=matching.slice(shown,shown+6);results.append(...batch.map(c=>c.cloneNode(true)));shown+=batch.length;more.hidden=shown>=matching.length;root.querySelector('.ca-project-status').textContent=`Showing ${shown} of ${matching.length} projects`;lightbox?.reload();};
 all('.ca-project-filters [data-filter]').forEach(button=>on(button,'click',()=>{all('.ca-project-filters [data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));matching=cards.filter(c=>button.dataset.filter==='All'||c.dataset.category===button.dataset.filter);shown=0;results.replaceChildren();render();}));on(more,'click',render);render();let lastY=window.scrollY;on(window,'scroll',()=>{const down=window.scrollY>lastY;lastY=window.scrollY;if(down&&!more.hidden&&results.getBoundingClientRect().bottom<innerHeight+100)render();});}
 all('#ca-enquiry').forEach(form=>{
  const note=form.querySelector('[role="status"]');on(form,'submit',async e=>{e.preventDefault();if(preview){if(note)note.textContent='Preview only. Enquiries are submitted from the published page.';return;}const button=form.querySelector('[type="submit"]');button.disabled=true;try{const data=Object.fromEntries(new FormData(form));const result=await api('/enquiries',{method:'POST',body:JSON.stringify(data)});if(note)note.textContent=result.message;form.reset();}catch(error){if(note)note.textContent=error.message;}finally{button.disabled=false;}});
 });
 if(preview)on(root,'click',e=>{const a=e.target.closest('a');if(a?.getAttribute('href')&&!a.getAttribute('href').startsWith('#'))e.preventDefault();});
 (async()=>{
  try{
   await script('/assets/js/bootstrap.bundle.min.js');
   if(signal.aborted)return;
   if(root.querySelector('.swiper')){await script('/assets/plugins/swiper/swiper-bundle.min.js');if(signal.aborted)return;all('.swiper').forEach(el=>{const instance=new window.Swiper(el,{slidesPerView:1,spaceBetween:24,loop:el.querySelectorAll('.swiper-slide').length>3,autoplay:matchMedia('(prefers-reduced-motion: reduce)').matches?false:{delay:5000},breakpoints:{768:{slidesPerView:2},1200:{slidesPerView:3}},navigation:{nextEl:el.parentElement.querySelector('.swiper-button-next'),prevEl:el.parentElement.querySelector('.swiper-button-prev')},pagination:{el:el.querySelector('.swiper-pagination'),clickable:true}});cleanups.push(()=>instance.destroy());});}
   if(root.querySelector('.image-popup,.video-popup')){await script('/assets/plugins/lightbox/glightbox.min.js');if(signal.aborted)return;lightbox=window.GLightbox({selector:'.image-popup,.video-popup'});cleanups.push(()=>lightbox.destroy());}
   const mapEl=root.querySelector('#cameo-uae-map');
   if(mapEl){await script('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');if(signal.aborted)return;const L=window.L,map=L.map(mapEl,{scrollWheelZoom:false}).setView([24.65,54.8],7);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);const places={dubai:[25.2048,55.2708],abudhabi:[24.4539,54.3773],sharjah:[25.3463,55.4209]};Object.entries(places).forEach(([name,point])=>L.marker(point).addTo(map).bindTooltip(name==='abudhabi'?'Abu Dhabi':name));all('[data-location]').forEach(b=>on(b,'click',()=>{map.flyTo(places[b.dataset.location],10);all('[data-location]').forEach(x=>x.classList.toggle('is-selected',x===b));}));cleanups.push(()=>map.remove());}
  }catch(error){console.warn(error.message);}
 })();
 return()=>{abort.abort();cleanups.forEach(fn=>fn());closeMenu();all('.offcanvas').forEach(el=>window.bootstrap?.Offcanvas?.getInstance(el)?.dispose());document.querySelectorAll('.offcanvas-backdrop').forEach(el=>el.remove());};
}
