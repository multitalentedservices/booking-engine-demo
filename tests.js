/* SlotBook Engine — Node battery sharing js/logic.js (lesson 13). Deterministic: fixed demo clock. */
const fs=require('fs'),path=require('path');
const L=require('./js/logic.js');
let pass=0,fail=0;const fails=[];
function t(name,cond){if(cond){pass++;console.log('PASS',name);}else{fail++;fails.push(name);console.log('FAIL',name);}}
function eq(name,a,b){t(name+' ['+a+' === '+b+']',a===b);}
const now=L.demoNow();
eq('demo clock is Tue 2026-11-24',L.toStr(now),'2026-11-24');
eq('demo weekday Tuesday',L.weekdayOf('2026-11-24'),2);
// Config integrity
['engine','salon','clinic'].forEach(id=>{const c=L.getConfig(id);t(id+' has 3 services',c.services.length===3);t(id+' has 2 resources',c.resources.length===2);t(id+' closed Sunday',c.closedDays.includes(0));});
// Slot generation: salon haircut Wed 25 Nov with Ayesha
const salon=L.getConfig('salon'),clinic=L.getConfig('clinic'),engine=L.getConfig('engine');
let slots=L.generateSlots(salon,'haircut','ayesha','2026-11-25',[]);
t('salon slots generated',slots.length>10);
t('salon first slot 09:00',slots[0].time==='09:00');
// duration+buffer: 45+10=55 must fit before Ayesha ends 17:00 -> last start <=16:05, interval 30 -> 16:00
const lastAvail=slots.filter(s=>s.available).pop(); t('buffer respected: last available start <=16:00 ('+(lastAvail&&lastAvail.time)+')',lastAvail&&lastAvail.time<='16:00');
// clinic interval 20 vs salon 30
let cslots=L.generateSlots(clinic,'gp','sana','2026-11-25',[]);
t('clinic uses 20-min interval',cslots[1]&&cslots[1].time==='09:20');
t('salon uses 30-min interval',slots[1]&&slots[1].time==='09:30');
// resource intersection: Omar off Mondays (hours null Mon) -> Monday slots all disabled naming Omar
let mon=L.generateSlots(clinic,'dental','omar','2026-11-30',[]); // Monday
t('Omar Monday: no available slots',mon.every(s=>s.disabled));
t('Omar Monday: reason names Omar pattern',mon.some(s=>/does not work on Mondays/.test(s.reason)));
// Omar day off 2026-11-28 (Saturday)
let off=L.generateSlots(clinic,'dental','omar','2026-11-28',[]);
t('Omar day-off: no available',off.every(s=>s.disabled)); t('day-off reason named',off.some(s=>/is off on 2026-11-28/.test(s.reason)));
// Mahnoor off Tuesdays + day off 26 Nov
let tue=L.generateSlots(salon,'facial','mahnoor','2026-11-24',[]);
t('Mahnoor Tuesday off: no available',tue.every(s=>s.disabled));
// closed Sunday
let sun=L.generateSlots(salon,'haircut','ayesha','2026-11-29',[]);
t('Sunday closed flagged',sun.length===1&&sun[0].closed===true); t('Sunday reason names Sunday',/closed on Sundays/.test(sun[0].reason));
// taken slots deterministic
let s1=L.generateSlots(salon,'haircut','ayesha','2026-11-25',[]),s2=L.generateSlots(salon,'haircut','ayesha','2026-11-25',[]);
eq('taken slots deterministic',JSON.stringify(s1),JSON.stringify(s2));
t('some seeded taken slots exist',s1.some(s=>s.disabled&&/already booked/.test(s.reason)));
// lead time: demo now Tue 09:00, lead 2h -> slots before 11:00 today disabled too-soon; past date
let today=L.generateSlots(salon,'haircut','ayesha','2026-11-24',[]);
t('lead-time: 09:00 today disabled too soon',today[0].disabled&&/Too soon/.test(today[0].reason));
t('lead-time: 10:30 today disabled too soon',today.find(s=>s.time==='10:30').disabled);
t('lead-time boundary: 11:00 not too-soon reason',(today.find(s=>s.time==='11:00')||{}).reason!=='Too soon — bookings need at least 2 hours\u2019 notice');
// validateDate
t('past date rejected',/past/.test(L.validateDate(salon,'2026-11-20',now)));
t('Sunday rejected naming closed',/closed on Sundays/.test(L.validateDate(salon,'2026-11-29',now)));
t('valid date passes',L.validateDate(salon,'2026-11-25',now)===null);
t('empty date rejected',!!L.validateDate(salon,'',now));
// Skin swap integrity (headline, lesson 23)
t('skin services differ',salon.services[0].id!==clinic.services[0].id);
t('skin business differs',salon.business!==clinic.business);
t('skin interval differs',salon.slotInterval!==clinic.slotInterval);
t('theme accent differs salon vs clinic',L.THEMES.salon.accent!==L.THEMES.clinic.accent);
t('theme accent differs engine vs salon',L.THEMES.engine.accent!==L.THEMES.salon.accent);
const css=fs.readFileSync('css/style.css','utf8');
t('CSS has salon theme block',css.includes('html[data-skin="salon"]')); t('CSS has clinic theme block',css.includes('html[data-skin="clinic"]'));
// no state leak: booking in salon still listed/filterable under salon, not clinic
const seeds=L.seedBookings(); eq('seed bookings =5',seeds.length,5);
t('filter salon seeds =2',L.filterBookings(seeds,{skin:'salon'}).length===2);
t('filter clinic seeds =2',L.filterBookings(seeds,{skin:'clinic'}).length===2);
t('filter by resource ayesha =1',L.filterBookings(seeds,{resourceId:'ayesha'}).length===1);
t('filter by status confirmed =3',L.filterBookings(seeds,{status:'confirmed'}).length===3);
t('filter by date 2026-11-25 =3',L.filterBookings(seeds,{date:'2026-11-25'}).length===3);
t('filter combined date+status =2',L.filterBookings(seeds,{date:'2026-11-25',status:'confirmed'}).length===2);
// booking blocks slot + cancel frees slot (headline proof in logic)
const bk={ref:'BE-DEMO-9999',skin:'salon',serviceId:'haircut',resourceId:'ayesha',date:'2026-11-25',time:'09:00',duration:45,status:'confirmed'};
let withBk=L.generateSlots(salon,'haircut','ayesha','2026-11-25',[bk]);
t('persisted booking blocks its slot',withBk.find(s=>s.time==='09:00').disabled===true);
let cancelled=Object.assign({},bk,{status:'cancelled'});
let afterCancel=L.generateSlots(salon,'haircut','ayesha','2026-11-25',[cancelled]);
let base=L.generateSlots(salon,'haircut','ayesha','2026-11-25',[]);
eq('cancel frees slot (matches no-booking state)',afterCancel.find(s=>s.time==='09:00').disabled,base.find(s=>s.time==='09:00').disabled);
// overlap: booking 09:00 45min blocks 09:30 start for same resource
t('overlap blocks 09:30',withBk.find(s=>s.time==='09:30').disabled===true);
// validation + refs
t('valid phone passes',Object.keys(L.validateDetails({name:'Fatima Khan',phone:'0321 1234567'})).length===0);
t('bad phone fails with phone error',!!L.validateDetails({name:'Fatima Khan',phone:'123'}).phone);
t('short name fails',!!L.validateDetails({name:'Al',phone:'03211234567'}).name);
t('live-clear logic: fixed phone clears error',!L.validateDetails({name:'Fatima Khan',phone:'03211234567'}).phone);
const ref=L.makeRef({skin:'salon',serviceId:'haircut',resourceId:'ayesha',date:'2026-11-25',time:'10:00',phone:'03211234567'});
t('ref format BE-DEMO-####',/^BE-DEMO-\d{4}$/.test(ref));
eq('ref deterministic',ref,L.makeRef({skin:'salon',serviceId:'haircut',resourceId:'ayesha',date:'2026-11-25',time:'10:00',phone:'03211234567'}));
// WhatsApp
const wa=L.whatsappLink(salon,Object.assign({},bk,{serviceName:'Haircut & Finish',resourceName:'Ayesha Khan',name:'Fatima Khan'}));
t('whatsapp link wa.me salon number',wa.startsWith('https://wa.me/923215551234?text='));
t('whatsapp contains ref',decodeURIComponent(wa).includes('BE-DEMO-9999')); t('whatsapp contains service',decodeURIComponent(wa).includes('Haircut & Finish'));
// contrast per skin (headline-adjacent: each skin AA)
Object.keys(L.THEMES).forEach(k=>{const th=L.THEMES[k];t(k+' ink on bg >=4.5 ('+L.contrast(th.ink,th.bg).toFixed(2)+')',L.contrast(th.ink,th.bg)>=4.5);t(k+' white on accent >=4.5 ('+L.contrast('#FFFFFF',th.accent).toFixed(2)+')',L.contrast('#FFFFFF',th.accent)>=4.5);t(k+' muted on bg >=4.5 ('+L.contrast(th.muted,th.bg).toFixed(2)+')',L.contrast(th.muted,th.bg)>=4.5);t(k+' accent focus on bg >=3 ('+L.contrast(th.accent,th.bg).toFixed(2)+')',L.contrast(th.accent,th.bg)>=3);});
t('error red on white >=4.5 ('+L.contrast('#B3261E','#FFFFFF').toFixed(2)+')',L.contrast('#B3261E','#FFFFFF')>=4.5);
// link integrity + SEO + demo labelling
const pages=['index.html','book.html','admin.html','docs.html'];const titles=new Set();
pages.forEach(p=>{const h=fs.readFileSync(p,'utf8');const m=h.match(/<title>([^<]+)<\/title>/);titles.add(m&&m[1]);t(p+' has DEMO labelling',/DEMO/.test(h));t(p+' has skip link',h.includes('skip-link'));const refs=[...h.matchAll(/(?:href|src)="([^"#]+)"/g)].map(x=>x[1]).filter(u=>!u.startsWith('http')&&!u.startsWith('https://fonts'));refs.forEach(u=>{t(p+' -> '+u+' exists',fs.existsSync(path.join('.',u.split('?')[0])));});});
eq('unique titles',titles.size,4);
t('JSON-LD SoftwareApplication on index',fs.readFileSync('index.html','utf8').includes('SoftwareApplication'));
t('sitemap exists with 4 pages',(fs.readFileSync('sitemap.xml','utf8').match(/<url>/g)||[]).length===4);
t('robots exists',fs.existsSync('robots.txt'));
t('no lorem ipsum',!pages.some(p=>/lorem/i.test(fs.readFileSync(p,'utf8'))));
t('no third-party CDN except Google Fonts',!pages.some(p=>/(cdn\.|unpkg|jsdelivr)/.test(fs.readFileSync(p,'utf8'))));
// weights
let code=0;['index.html','book.html','admin.html','docs.html','css/style.css','js/logic.js','js/app.js','js/book.js','js/admin.js'].forEach(f=>code+=fs.statSync(f).size);
t('code weight <400KB ('+Math.round(code/1024)+'KB)',code<400*1024);
let media=0,maxImg=0;fs.readdirSync('assets').filter(f=>/\.jpg$/.test(f)).forEach(f=>{const s=fs.statSync('assets/'+f).size;media+=s;maxImg=Math.max(maxImg,s);});
t('each image <=120KB (max '+Math.round(maxImg/1024)+'KB)',maxImg<=120*1024); t('media total <=1.6MB',media<=1.6*1024*1024);
console.log('\nTOTAL: '+pass+' PASS / '+fail+' FAIL'); if(fails.length)console.log('FAILURES:',fails.join(' | ')); process.exit(fail?1:0);
