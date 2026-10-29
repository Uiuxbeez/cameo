// Stable DOM paths keep all original markup and styling intact while editing content.
function fragment(html) { const t=document.createElement('template'); t.innerHTML=html; return t.content; }
function children(node){return Array.from(node.tagName==='TEMPLATE'?node.content.childNodes:node.childNodes);}
function at(root,path){return path.reduce((node,index)=>children(node)[index],root);}
export function fieldsFor(html) {
 const root=fragment(html),fields=[];
 function visit(node,path) {
  if(node.nodeType===3 && node.textContent.trim() && !node.parentElement?.closest('svg,style,script')) {
   const parent=node.parentElement; const tag=parent?.tagName.toLowerCase();
   fields.push({key:path.join('.'),path,type:'text',label:parent?.closest('h1,h2,h3,h4,h5,h6')?'Heading':tag==='a'||tag==='button'?'Button / link text':tag==='label'?'Field label':'Text',value:node.textContent});
  }
  if(node.nodeType===1){
   for(const attr of ['src','poster','alt','href','title','placeholder']) {
    if(node.hasAttribute(attr))fields.push({key:path.join('.')+attr,path,attr,type:['src','poster'].includes(attr)?'image':'attribute',label:({src:node.tagName==='IFRAME'?'Map / embed URL':'Media URL',poster:'Video poster',alt:'Image description',href:'Link URL',title:'Title',placeholder:'Placeholder'})[attr],value:node.getAttribute(attr)});
   }
   const background=node.style?.backgroundImage?.match(/url\(["']?([^"')]+)["']?\)/);
   if(background)fields.push({key:path.join('.')+'background',path,attr:'background',type:'image',label:'Background image',value:background[1]});
   if(node.tagName==='A')fields.push({key:path.join('.')+'target',path,attr:'target',type:'checkbox',label:'Open link in new tab',value:node.target==='_blank'});
  }
  children(node).forEach((child,i)=>visit(child,[...path,i]));
 }
 children(root).forEach((node,i)=>visit(node,[i]));return fields.sort((a,b)=>(a.label==='Heading'?0:a.type==='text'?1:2)-(b.label==='Heading'?0:b.type==='text'?1:2));
}
export function changeField(html,field,value){
 const root=fragment(html),node=at(root,field.path);
 if(!node)return html;
 if(!field.attr)node.textContent=value;
 else if(field.attr==='background')node.style.backgroundImage=node.style.backgroundImage.replace(/url\([^)]*\)/,`url("${value.replace(/["\\\n\r]/g,'')}")`);
 else if(field.attr==='target'){if(value){node.setAttribute('target','_blank');node.setAttribute('rel','noopener noreferrer');}else node.removeAttribute('target');}
 else node.setAttribute(field.attr,value);
 const t=document.createElement('div');t.append(root);return t.innerHTML;
}
export function itemGroups(html){
 const root=fragment(html),groups=[];
 function visit(node,path){
  const elements=children(node).map((n,i)=>({node:n,path:[...path,i]})).filter(x=>x.node.nodeType===1);
  if(elements.length>1 && elements.every(x=>x.node.tagName===elements[0].node.tagName) && elements.some(x=>x.node.querySelector('img,h3,h4')||x.node.tagName==='LI')) {
   groups.push({label:node.className || node.tagName || 'Items',items:elements.map(x=>({path:x.path,label:x.node.querySelector('h3,h4,img')?.textContent?.trim()||x.node.querySelector('img')?.alt||x.node.textContent.trim().slice(0,60)||'Item'}))});
  }
  elements.forEach(x=>visit(x.node,x.path));
 }
 visit(root,[]);return groups;
}
export function changeItem(html,path,action){const root=fragment(html),node=at(root,path);if(action==='duplicate'){const copy=node.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));node.after(copy);}else node.remove();const t=document.createElement('div');t.append(root);return t.innerHTML;}
