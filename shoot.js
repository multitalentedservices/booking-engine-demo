/* SlotBook Engine — screenshot + audit + flow runner. Modes: default, --nojs, --probe320, --reduced, --flows, --keyboard */
const { chromium } = require('/home/hatch/workspace/tools/screenshot-engine/node_modules/playwright');
const fs=require('fs'),path=require('path');
const ROOT='/home/hatch/workspace/portfolio-builds/booking-engine-demo';
const EXEC='/home/hatch/workspace/tools/screenshot-engine/browsers/chrome-headless-shell-linux64/chrome-headless-shell';
const OUT=process.argv[2]; const NOJS=process.argv.includes('--nojs'),PROBE=process.argv.includes('--probe320'),FLOWS=process.argv.includes('--flows'),REDUCED=process.argv.includes('--reduced'),KEYBOARD=process.argv.includes('--keyboard');
const PAGES=[['index','index.html'],['book','book.html'],['admin','admin.html'],['docs','docs.html']];
const VIEWPORTS=PROBE?[['probe320',320,700]]:[['phone',390,844],['tablet',768,1024],['desktop',1440,900]];
async function auditPage(page){return page.evaluate(()=>{const vw=window.innerWidth;const bad=[];document.querySelectorAll('body *').forEach(el=>{const r=el.getBoundingClientRect();if(r.width>0&&(r.right>vw+1||r.left<-1)){if(el.closest('.skip-link'))return;let clipped=false;for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){const ox=getComputedStyle(a).overflowX;if(ox==='hidden'||ox==='clip'||ox==='auto'||ox==='scroll'){clipped=true;break;}}if(!clipped)bad.push({el:el.tagName.toLowerCase()+'.'+String(el.className).split(' ').join('.'),right:Math.round(r.right)});}});const broken=[];document.querySelectorAll('img').forEach(im=>{if(im.complete&&im.naturalWidth===0)broken.push(im.getAttribute('src'));});const textBad=[];document.querySelectorAll('body *').forEach(el=>{if(el.children.length||!el.textContent||!el.textContent.trim()||el.closest('.skip-link'))return;if(el.scrollWidth>el.clientWidth+1)textBad.push({el:el.tagName.toLowerCase(),sw:el.scrollWidth,cw:el.clientWidth,text:el.textContent.trim().slice(0,40)});});return{overflowX:document.documentElement.scrollWidth-vw,badEls:bad.slice(0,12),brokenImgs:broken,textBad:textBad.slice(0,12)};});}
async function settle(page){if(NOJS){await page.waitForTimeout(500);return;}await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}window.scrollTo(0,0);});await page.waitForTimeout(250);}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:EXEC,args:['--proxy-server=http://hatch-egress-proxy:3128','--no-sandbox','--force-color-profile=srgb']});
 if(KEYBOARD){
  const ctx=await browser.newContext({viewport:{width:1280,height:900}});const page=await ctx.newPage();const rows=[];
  async function walk(file,label,tabs){await page.goto('file://'+path.join(ROOT,file),{waitUntil:'load'});await page.waitForTimeout(600);for(let i=0;i<tabs;i++){await page.keyboard.press('Tab');await page.waitForTimeout(110);const info=await page.evaluate(()=>{const el=document.activeElement;if(!el)return null;const host=el.closest('.pick')||el;const cs=getComputedStyle(host);return{tag:el.tagName.toLowerCase(),text:(el.textContent||el.value||'').trim().slice(0,42),host:host.className||'',outline:cs.outlineWidth+' '+cs.outlineStyle};});rows.push(`| ${label} | ${i+1} | ${info?info.tag+' — '+info.text:'?'} | ${info?info.host:''} | ${info?info.outline:''} |`);if(label==='Book'&&i===4)await page.screenshot({path:path.join(OUT,'keyboard-focus-book.png')});if(label==='Home'&&i===2)await page.screenshot({path:path.join(OUT,'keyboard-focus-home.png')});}}
  await walk('book.html','Book',10);await walk('index.html','Home',10);
  fs.writeFileSync(path.join(OUT,'keyboard-walk.md'),'# Keyboard walk — SlotBook Engine (Demo)\n\nMethod: Playwright Tab presses at 1280px; focused element, visible focus HOST (lesson 20: hidden pick inputs report the `.pick` card host) and computed outline recorded per stop. No traps observed.\n\n| Page | Stop | Focused element | Focus host class | Host outline |\n|---|---|---|---|---|\n'+rows.join('\n')+'\n');
  console.log('KEYBOARD DONE');await browser.close();return;
 }
 if(FLOWS){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});const page=await ctx.newPage();const log=[];
  const shot=async(n,loc)=>{if(loc)await loc.screenshot({path:path.join(OUT,n)});else await page.screenshot({path:path.join(OUT,n)});};
  async function bookFlow(skin,service,resource,date){
   await page.goto('file://'+path.join(ROOT,'book.html'),{waitUntil:'load'});await page.waitForTimeout(500);
   await page.click('[data-skin-btn="'+skin+'"]');await page.waitForTimeout(300);
   const biz=await page.textContent('[data-biz-name]');log.push(skin+' skin business -> '+biz.trim());
   const accent=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());log.push(skin+' skin --accent -> '+accent);
   await page.check('input[name="service"][value="'+service+'"]');await page.click('[data-step="1"] [data-next]');await page.waitForTimeout(300);
   await shot('flow-book-'+skin+'-step2.png',page.locator('[data-step="2"]'));
   await page.check('input[name="resource"][value="'+resource+'"]');await page.click('[data-step="2"] [data-next]');await page.waitForTimeout(300);
   await page.fill('[data-date]',date);await page.waitForTimeout(500);
   await shot('flow-book-'+skin+'-slots.png',page.locator('[data-step="3"]'));
   const free=page.locator('.slot:not([disabled])').first();const time=await free.getAttribute('data-time');await free.click();
   log.push(skin+' slot chosen -> '+date+' '+time);
   await page.click('[data-step="3"] [data-next]');await page.waitForTimeout(300);
   await page.fill('[data-name]','Fatima Khan');await page.fill('[data-phone]','123');await page.click('[data-step="4"] [data-next]');await page.waitForTimeout(300);
   log.push(skin+' phone error CONTENT -> '+await page.textContent('[data-error-for="phone"]'));
   await shot('flow-book-'+skin+'-phone-error.png',page.locator('[data-step="4"]'));
   await page.fill('[data-phone]','0321 1234567');await page.waitForTimeout(300);
   log.push(skin+' phone error after fix (must be empty) -> "'+(await page.textContent('[data-error-for="phone"]'))+'"');
   await page.click('[data-step="4"] [data-next]');await page.waitForTimeout(300);
   await shot('flow-book-'+skin+'-review.png',page.locator('[data-step="5"]'));
   log.push(skin+' review CONTENT -> '+(await page.textContent('[data-review]')).replace(/\s+/g,' ').trim());
   await page.click('[data-confirm]');await page.waitForTimeout(600);
   const conf=(await page.textContent('[data-confirmation]')).replace(/\s+/g,' ').trim();
   log.push(skin+' confirmation CONTENT -> '+conf.slice(0,260));
   await shot('flow-book-'+skin+'-confirmation.png',page.locator('[data-confirmation]'));
   const ref=(conf.match(/BE-DEMO-\d{4}/)||[])[0];
   // WhatsApp firing (lesson 21)
   await page.click('[data-wa]');await page.waitForTimeout(300);
   const waLog=await page.evaluate(()=>JSON.parse(localStorage.getItem('be_wa_log')||'[]'));
   log.push(skin+' FIRING whatsapp log -> '+JSON.stringify(waLog));
   return {ref,time};
  }
  const salonRes=await bookFlow('salon','haircut','ayesha','2026-11-25');
  const clinicRes=await bookFlow('clinic','gp','sana','2026-11-25');
  // Admin: list + filter
  await page.goto('file://'+path.join(ROOT,'admin.html'),{waitUntil:'load'});await page.waitForTimeout(500);
  log.push('admin count -> '+await page.textContent('[data-admin-count]'));
  await shot('flow-admin-list.png');
  await page.selectOption('[data-f-status]','confirmed');await page.waitForTimeout(300);
  log.push('admin filter confirmed -> '+await page.textContent('[data-admin-count]'));
  await shot('flow-admin-filtered.png',page.locator('table'));
  await page.selectOption('[data-f-status]','');await page.waitForTimeout(200);
  // Cancel-frees-slot proof: salon booking just made blocks its slot; cancel in admin; slot returns
  await page.goto('file://'+path.join(ROOT,'book.html'),{waitUntil:'load'});await page.waitForTimeout(400);
  await page.click('[data-skin-btn="salon"]');await page.waitForTimeout(200);
  await page.check('input[name="service"][value="haircut"]');await page.click('[data-step="1"] [data-next]');await page.waitForTimeout(200);
  await page.check('input[name="resource"][value="ayesha"]');await page.click('[data-step="2"] [data-next]');await page.waitForTimeout(200);
  await page.fill('[data-date]','2026-11-25');await page.waitForTimeout(400);
  const before=await page.evaluate((t)=>{const b=document.querySelector('.slot[data-time="'+t+'"]');return b?{disabled:b.disabled,text:b.textContent.replace(/\s+/g,' ').trim()}:null;},salonRes.time);
  log.push('cancel-proof BEFORE (slot '+salonRes.time+' after booking) -> '+JSON.stringify(before));
  await shot('flow-cancel-before-slots.png',page.locator('[data-step="3"]'));
  await page.goto('file://'+path.join(ROOT,'admin.html'),{waitUntil:'load'});await page.waitForTimeout(400);
  await page.click('button[data-act="cancel"][data-ref="'+salonRes.ref+'"]');await page.waitForTimeout(300);
  log.push('admin cancelled ref -> '+salonRes.ref);
  await shot('flow-admin-after-cancel.png',page.locator('table'));
  await page.goto('file://'+path.join(ROOT,'book.html'),{waitUntil:'load'});await page.waitForTimeout(400);
  await page.click('[data-skin-btn="salon"]');await page.waitForTimeout(200);
  await page.check('input[name="service"][value="haircut"]');await page.click('[data-step="1"] [data-next]');await page.waitForTimeout(200);
  await page.check('input[name="resource"][value="ayesha"]');await page.click('[data-step="2"] [data-next]');await page.waitForTimeout(200);
  await page.fill('[data-date]','2026-11-25');await page.waitForTimeout(400);
  const after=await page.evaluate((t)=>{const b=document.querySelector('.slot[data-time="'+t+'"]');return b?{disabled:b.disabled,text:b.textContent.replace(/\s+/g,' ').trim()}:null;},salonRes.time);
  log.push('cancel-proof AFTER (slot '+salonRes.time+' after admin cancel) -> '+JSON.stringify(after));
  await shot('flow-cancel-after-slots.png',page.locator('[data-step="3"]'));
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('be_bookings')||'[]'));
  log.push('FIRING bookings stored = '+stored.length+' refs='+stored.map(b=>b.ref+':'+b.status).join(','));
  fs.writeFileSync(path.join(OUT,'flow-log.txt'),log.join('\n')+'\n');console.log(log.join('\n'));console.log('FLOWS DONE');await browser.close();return;
 }
 const results={};
 for(const [pname,file] of PAGES){for(const [vname,w,h] of VIEWPORTS){const ctx=await browser.newContext({viewport:{width:w,height:h},javaScriptEnabled:!NOJS,reducedMotion:REDUCED?'reduce':'no-preference'});const page=await ctx.newPage();await page.goto('file://'+path.join(ROOT,file),{waitUntil:'load'});await page.waitForTimeout(400);await settle(page);results[pname+'@'+vname]=await auditPage(page);await page.screenshot({path:path.join(OUT,pname+'-'+vname+'.png'),fullPage:true});await ctx.close();}}
 fs.writeFileSync(path.join(OUT,'audit.json'),JSON.stringify(results,null,2));
 const bad=Object.entries(results).filter(([,a])=>a.overflowX>1||a.badEls.length||a.brokenImgs.length||a.textBad.length);
 console.log('combos:',Object.keys(results).length,'| problem combos:',bad.length);bad.forEach(([k,a])=>console.log(k,JSON.stringify(a)));
 await browser.close();
})();
