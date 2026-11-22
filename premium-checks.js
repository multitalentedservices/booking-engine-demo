/* SlotBook — Premium checks (separate from tests.js): screenshots 390+1440 every page,
   signature moment (live mini-booking mid-interaction), functional premium assertions. */
const { chromium } = require('/home/hatch/workspace/tools/screenshot-engine/node_modules/playwright');
const fs=require('fs'),path=require('path');
const ROOT='/home/hatch/workspace/portfolio-builds/booking-engine-demo';
const EXEC='/home/hatch/workspace/tools/screenshot-engine/browsers/chrome-headless-shell-linux64/chrome-headless-shell';
const OUT=path.join(ROOT,'screenshots','premium');
const PAGES=[['index','index.html'],['book','book.html'],['admin','admin.html'],['docs','docs.html']];
const results=[];function t(n,c){results.push({name:n,pass:!!c});console.log((c?'PASS':'FAIL'),n);}
async function audit(page){return page.evaluate(()=>{const vw=window.innerWidth;const bad=[];document.querySelectorAll('body *').forEach(el=>{const r=el.getBoundingClientRect();if(r.width>0&&(r.right>vw+1||r.left<-1)){if(el.closest('.skip-link'))return;let cl=false;for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){const ox=getComputedStyle(a).overflowX;if(['hidden','clip','auto','scroll'].includes(ox)){cl=true;break;}}if(!cl)bad.push(el.tagName+'.'+String(el.className).split(' ').join('.'));}});const broken=[...document.querySelectorAll('img')].filter(im=>im.complete&&im.naturalWidth===0).map(im=>im.getAttribute('src'));return{overflowX:document.documentElement.scrollWidth-vw,badEls:bad.slice(0,8),broken};});}
async function humanScroll(page){/* wheel-driven so Lenis (when active) moves too */const H=await page.evaluate(()=>document.body.scrollHeight);for(let y=0;y<H;y+=420){await page.mouse.wheel(0,420);await page.waitForTimeout(110);}await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(1600);}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:EXEC,args:['--proxy-server=http://hatch-egress-proxy:3128','--no-sandbox','--force-color-profile=srgb']});
 const errors=[];
 for(const [name,file] of PAGES){
  for(const [vp,w,h] of [['phone',390,844],['desktop',1440,900]]){
   const ctx=await browser.newContext({viewport:{width:w,height:h}});
   const page=await ctx.newPage();
   page.on('console',m=>{if(m.type()==='error'){const loc=(m.location()&&m.location().url)||'';if(/fonts\.googleapis|fonts\.gstatic/.test(loc))return;errors.push(name+'/'+vp+': '+m.text()+' @'+loc);}});
   page.on('pageerror',e=>errors.push(name+'/'+vp+' PAGEERROR: '+e.message));
   await page.goto('file://'+path.join(ROOT,file),{waitUntil:'load'});
   await page.waitForTimeout(700);
   await humanScroll(page);
   const a=await audit(page);
   t(name+' '+vp+' no overflow/broken',a.overflowX<=1&&a.badEls.length===0&&a.broken.length===0);
   await page.screenshot({path:path.join(OUT,name+'-'+vp+'.png'),fullPage:true});
   await ctx.close();
  }
 }
 /* Signature moment + functional checks on index (desktop) */
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push('index-func PAGEERROR: '+e.message));
 await page.goto('file://'+path.join(ROOT,'index.html'),{waitUntil:'load'});
 await page.waitForTimeout(900);
 const slotCount=await page.locator('[data-mb-slots] .slot').count();
 const freeCount=await page.locator('[data-mb-slots] .slot:not([disabled])').count();
 t('mini-booking renders live slots ('+slotCount+')',slotCount>10);
 t('mini-booking has bookable slots ('+freeCount+')',freeCount>0);
 t('Lenis active',await page.evaluate(()=>!!document.querySelector('html.lenis, .lenis-smooth')||document.documentElement.classList.contains('lenis')));
 t('GSAP + ScrollTrigger loaded',await page.evaluate(()=>!!(window.gsap&&window.ScrollTrigger)));
 await page.locator('[data-mb-slots] .slot:not([disabled])').first().click();
 await page.waitForTimeout(300);
 const sum=await page.textContent('[data-mb-summary]');
 t('slot click writes summary',/at \d{2}:\d{2}/.test(sum||''));
 await page.locator('.hero').screenshot({path:path.join(OUT,'signature-moment.png')});
 /* skin switch re-renders the mini-booking with the salon config */
 await page.click('[data-skin-btn="salon"]');await page.waitForTimeout(400);
 const biz=await page.textContent('[data-mb-biz]');
 const salonSlots=await page.locator('[data-mb-slots] .slot').count();
 t('skin switch re-renders mini-booking (Glow & Grace, '+salonSlots+' slots)',/Glow/.test(biz||'')&&salonSlots>10);
 /* P1 re-probe: no default-styled links on index */
 const linkBad=await page.evaluate(()=>{let bad=0;document.querySelectorAll('a').forEach(a=>{const cs=getComputedStyle(a);const col=cs.color;if(col==='rgb(0, 0, 238)')bad++;});return bad;});
 t('P1: zero browser-blue links on index',linkBad===0);
 await ctx.close();
 /* JS-disabled index: content complete */
 const ctx2=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
 const p2=await ctx2.newPage();
 await p2.goto('file://'+path.join(ROOT,'index.html'),{waitUntil:'load'});
 const nojsText=await p2.textContent('body');
 t('no-JS index complete (chapters + stats + fallback note)',/What the engine actually does/.test(nojsText)&&/full booking demo is on the/.test(nojsText)&&/minimum lead time/.test(nojsText));
 await p2.screenshot({path:path.join(OUT,'index-phone-nojs.png'),fullPage:true});
 await ctx2.close();
 /* Reduced motion: Lenis off, content visible */
 const ctx3=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const p3=await ctx3.newPage();
 await p3.goto('file://'+path.join(ROOT,'index.html'),{waitUntil:'load'});await p3.waitForTimeout(600);
 t('reduced-motion: no lenis class',await p3.evaluate(()=>!document.documentElement.classList.contains('lenis')));
 const a3=await audit(p3);t('reduced-motion index clean',a3.badEls.length===0&&a3.broken.length===0);
 await ctx3.close();
 t('zero console/page errors',errors.length===0);
 if(errors.length)console.log('ERRORS:',errors.join(' | '));
 const pass=results.filter(r=>r.pass).length;
 console.log('\nPREMIUM CHECKS: '+pass+' PASS / '+(results.length-pass)+' FAIL');
 fs.writeFileSync(path.join(OUT,'premium-checks.json'),JSON.stringify({results,errors},null,2));
 await browser.close();
 process.exit(results.every(r=>r.pass)?0:1);
})();
