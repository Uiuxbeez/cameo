import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { load } from 'cheerio';
const files = ['index-skin2','about-us','services','service-wayfinding-signage','service-outdoor-signage','service-indoor-signage','service-graphics','service-led-screen','service-vehicle-branding','projects','project-details','clients','contact-us'];
const pages = [];
for (const file of files) {
  const $ = load(await readFile(`${file}.html`, 'utf8'));
  $('script, noscript').remove();
  // Normalize URLs for React routes, including nested admin previews.
  $('[src],[href],[poster]').each((_, el) => {
    for (const attr of ['src','href','poster']) {
      let value = $(el).attr(attr);
      if (!value) continue;
      if (value.startsWith('assets/')) value = `/${value}`;
      if (/^(index|index-skin2)\.html$/.test(value)) value = '/';
      else if (/^[\w-]+\.html(?:#.*)?$/.test(value)) value = '/' + value.replace('.html','');
      $(el).attr(attr, value);
    }
  });
  $('[style]').each((_, el) => $(el).attr('style', $(el).attr('style').replaceAll("url('assets/", "url('/assets/").replaceAll('url(assets/', 'url(/assets/')));
  const header = $('header').first().toString();
  $('header').replaceWith('<div data-cms-header="true"></div>');
  const footer = $('footer').first().toString();
  $('footer').remove();
  // Keep the hero's original containing block and space for the positioned header.
  const wrapper = $('.main-wrapper').first();
  const sections = [];
  wrapper.children().each((index, el) => {
    if ($(el).is('.back-to-top')) return;
    let label = $(el).hasClass('hero-section-one') ? 'Hero Banner' : $(el).find('h2,h3').first().text().replace(/\s+/g,' ').trim();
    if (!label) label = $(el).attr('aria-label') || `Section ${index+1}`;
    sections.push({ id: `${file}-${index}`, name: label.slice(0,100), visible: true, html: $.html(el) });
  });
  const forms = $('.ca-form');
  // Forms are submitted to the new API by the React runtime.
  for (const section of sections) {
    section.html = section.html.replaceAll('Prepare email enquiry','Send message').replaceAll('Opens your email app with your project details ready to send.','Your enquiry will be sent to the Cameo team.');
  }
  const auxiliary = $('body').children().filter((_,el) => !$(el).is('.main-wrapper')).toArray().map(el=>$.html(el)).join('');
  pages.push({ slug: file==='index-skin2'?'home':file, title: $('title').text(), description: $('meta[name="description"]').attr('content') || '', htmlClass: $('html').attr('class') || '', styles: $('link[rel="stylesheet"]').map((_,el)=>$(el).attr('href')).get(), header, footer, auxiliary, sections });
}
await mkdir('content', { recursive:true });
await writeFile('content/pages.json', JSON.stringify(pages,null,2));
console.log(`Imported ${pages.length} pages and ${pages.reduce((n,p)=>n+p.sections.length,0)} editable sections.`);
