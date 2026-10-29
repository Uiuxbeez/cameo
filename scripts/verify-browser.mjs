import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('.local',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const origin='http://127.0.0.1:5173';let original;
try {
 await page.goto(`${origin}/admin/page-builder`);
 await page.getByLabel('Password',{exact:true}).fill(process.env.ADMIN_PASSWORD);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.locator('.cms-pages nav button').filter({hasText:'Contact Us'}).click();
 await page.getByRole('button',{name:'Page settings & SEO',exact:true}).click();
 await page.getByLabel('Page title',{exact:true}).waitFor();
 original=await (await page.request.get(`${origin}/api/admin/pages/contact-us`)).json();
 await page.getByLabel('Page title',{exact:true}).fill('Contact verification | Cameo Advertising');
 await page.getByRole('button',{name:'Save Draft',exact:true}).click();
 await page.getByRole('status').filter({hasText:'Draft saved'}).waitFor();
 let published=await (await page.request.get(`${origin}/api/pages/contact-us`)).json();assert.equal(published.title,original.published.title);
 await page.getByRole('button',{name:'↑ Publish',exact:true}).click();
 await page.getByRole('status').filter({hasText:'Published successfully'}).waitFor();
 published=await (await page.request.get(`${origin}/api/pages/contact-us`)).json();assert.equal(published.title,'Contact verification | Cameo Advertising');
 await page.getByRole('button',{name:'Mobile view',exact:true}).click();
 await page.screenshot({path:'.local/builder-mobile-preview.png'});
 console.log('PASS: admin login, edit, save draft, publish, private draft isolation and mobile preview.');
} finally {
 if(original){
  const current=await (await page.request.get(`${origin}/api/admin/pages/contact-us`)).json();
  const restored=await (await page.request.put(`${origin}/api/admin/pages/contact-us`,{headers:{origin},data:{version:current.version,content:original.draft}})).json();
  const response=await page.request.post(`${origin}/api/admin/pages/contact-us/publish`,{headers:{origin},data:{version:restored.version}});assert.equal(response.status(),200);
 }
 await page.goto(`${origin}/contact-us`);await page.waitForSelector('h1');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);
 await page.locator('#mobile_btn').click();await page.waitForTimeout(600);
 const bounds=await page.locator('.main-menu-wrapper').boundingBox();assert.ok(bounds.x>=0&&bounds.x<390,`Menu is offscreen: ${bounds.x}`);
 await page.locator('#menu_close').click();await page.waitForTimeout(500);
 await page.screenshot({path:'.local/contact-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: mobile navigation opens onscreen; no browser runtime errors; original page restored.');
 await browser.close();
}
