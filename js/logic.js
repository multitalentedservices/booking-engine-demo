/* SlotBook Engine (Demo) — pure logic shared by site + Node battery. No DOM. */
(function(global){
'use strict';
var DEMO_NOW_ISO='2026-11-24T09:00:00'; // fixed demo clock: Tue 24 Nov 2026, 09:00 — deterministic tests
var DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function demoNow(){return new Date(DEMO_NOW_ISO);}
function pad(n){return (n<10?'0':'')+n;}
function toStr(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function parseDate(s){var p=String(s||'').split('-');return new Date(+p[0],(+p[1])-1,+p[2]);}
function weekdayOf(s){return parseDate(s).getDay();}
function mins(t){return (+t.slice(0,2))*60+(+t.slice(3,5));}
function fmtMins(m){return pad(Math.floor(m/60))+':'+pad(m%60);}
function hashCode(str){var h=0;for(var i=0;i<str.length;i++)h=((h<<5)-h+str.charCodeAt(i))|0;return Math.abs(h);}
function formatPKR(n){return 'PKR '+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');}

var CONFIGS={
 engine:{id:'engine',label:'Engine default',business:'SlotBook Demo Studio',tagline:'The engine, unskinned',phone:'0300 1234567',whatsapp:'923001234567',slotInterval:30,leadHours:2,closedDays:[0],
  hours:{0:null,1:[540,1080],2:[540,1080],3:[540,1080],4:[540,1080],5:[540,1080],6:[540,840]},
  services:[{id:'consult',name:'Discovery Consultation',duration:30,price:0,buffer:10,desc:'A 30-minute walkthrough of the engine with a demo specialist.'},{id:'setup',name:'Setup Session',duration:60,price:5000,buffer:15,desc:'A guided configuration session for services, hours and resources.'},{id:'training',name:'Team Training',duration:90,price:9000,buffer:15,desc:'Hands-on training for the people who will run the diary.'}],
  resources:[{id:'amara',name:'Amara Shah',role:'Demo Specialist',hours:{0:null,1:[540,1080],2:[540,1080],3:[540,1080],4:[540,1080],5:[540,1080],6:[540,840]},daysOff:[]},{id:'daniyal',name:'Daniyal Reed',role:'Setup Specialist',hours:{0:null,1:[600,1080],2:[600,1080],3:null,4:[600,1080],5:[600,1080],6:null},daysOff:['2026-11-27']}]},
 salon:{id:'salon',label:'Salon skin',business:'Glow & Grace Salon',tagline:'Hair, skin and nails — DHA, Lahore (demo)',phone:'0321 5551234',whatsapp:'923215551234',slotInterval:30,leadHours:2,closedDays:[0],
  hours:{0:null,1:[540,1140],2:[540,1140],3:[540,1140],4:[540,1140],5:[540,1140],6:[540,1140]},
  services:[{id:'haircut',name:'Haircut & Finish',duration:45,price:2500,buffer:10,desc:'Consultation, cut, wash and finish.'},{id:'facial',name:'Signature Facial',duration:60,price:4500,buffer:15,desc:'Cleanse, exfoliation, mask and massage.'},{id:'manicure',name:'Manicure',duration:30,price:1800,buffer:5,desc:'Shape, cuticle care and polish.'}],
  resources:[{id:'ayesha',name:'Ayesha Khan',role:'Senior Stylist',hours:{0:null,1:[540,1020],2:[540,1020],3:[540,1020],4:[540,1020],5:[540,1020],6:[540,1020]},daysOff:[]},{id:'mahnoor',name:'Mahnoor Ali',role:'Skin & Nails Specialist',hours:{0:null,1:[600,1140],2:null,3:[600,1140],4:[600,1140],5:[600,1140],6:[600,1140]},daysOff:['2026-11-26']}]},
 clinic:{id:'clinic',label:'Clinic skin',business:'Sehat Plus Clinic',tagline:'Family care — Model Town, Gujranwala (demo)',phone:'0300 9876543',whatsapp:'923009876543',slotInterval:20,leadHours:2,closedDays:[0],
  hours:{0:null,1:[540,1200],2:[540,1200],3:[540,1200],4:[540,1200],5:[540,1200],6:[540,1200]},
  services:[{id:'gp',name:'GP Consultation',duration:20,price:1500,buffer:10,desc:'General consultation with a family physician.'},{id:'dental',name:'Dental Check-up',duration:30,price:3500,buffer:10,desc:'Examination, scale and polish assessment.'},{id:'physio',name:'Physiotherapy Session',duration:45,price:3000,buffer:15,desc:'Assessment and guided therapy session.'}],
  resources:[{id:'sana',name:'Dr Sana Tariq',role:'Family Physician',hours:{0:null,1:[540,840],2:[540,840],3:[540,840],4:[540,840],5:[540,840],6:null},daysOff:[]},{id:'omar',name:'Dr Omar Farooq',role:'Dentist & Physiotherapist',hours:{0:null,1:null,2:[840,1200],3:[840,1200],4:[840,1200],5:[840,1200],6:[840,1200]},daysOff:['2026-11-28']}]}
};
function getConfig(id){return CONFIGS[id]||CONFIGS.engine;}
function serviceById(c,id){for(var i=0;i<c.services.length;i++)if(c.services[i].id===id)return c.services[i];return null;}
function resourceById(c,id){for(var i=0;i<c.resources.length;i++)if(c.resources[i].id===id)return c.resources[i];return null;}
function seededTaken(c,dateStr,resourceId,time){return hashCode(c.id+'|'+dateStr+'|'+resourceId+'|'+time)%5===0;}
function overlaps(aStart,aEnd,bStart,bEnd){return aStart<bEnd&&bStart<aEnd;}
function generateSlots(cfg,serviceId,resourceId,dateStr,bookings,now){
 now=now||demoNow(); bookings=bookings||[];
 var svc=serviceById(cfg,serviceId); if(!svc||!dateStr) return [];
 var wd=weekdayOf(dateStr);
 if(cfg.closedDays.indexOf(wd)!==-1) return [{closed:true,reason:cfg.business+' is closed on '+DAY_NAMES[wd]+'s — please choose another day.'}];
 var biz=cfg.hours[wd]; if(!biz) return [{closed:true,reason:cfg.business+' is closed on '+DAY_NAMES[wd]+'s — please choose another day.'}];
 var pool=resourceId&&resourceId!=='any'?[resourceById(cfg,resourceId)]:cfg.resources.slice();
 pool=pool.filter(Boolean);
 var nowMins=now.getHours()*60+now.getMinutes(); var today=toStr(now);
 var out=[]; var need=svc.duration+svc.buffer;
 for(var start=biz[0]; start+need<=biz[1]; start+=cfg.slotInterval){
   var time=fmtMins(start); var end=start+svc.duration;
   // per-resource evaluation
   var anyFree=false, reasons=[];
   pool.forEach(function(r){
     var rh=r.hours[wd];
     if(!rh){reasons.push(r.name+' does not work on '+DAY_NAMES[wd]+'s');return;}
     if(r.daysOff.indexOf(dateStr)!==-1){reasons.push(r.name+' is off on '+dateStr);return;}
     if(start<rh[0]||start+need>rh[1]){reasons.push(r.name+' is not working at '+time);return;}
     if(seededTaken(cfg,dateStr,r.id,time)){reasons.push(r.name+' is already booked at '+time);return;}
     var clash=bookings.some(function(b){return b.resourceId===r.id&&b.date===dateStr&&b.status!=='cancelled'&&overlaps(start,end,mins(b.time),mins(b.time)+b.duration);});
     if(clash){reasons.push(r.name+' is already booked at '+time);return;}
     anyFree=true;
   });
   var past=dateStr<today, tooSoon=dateStr===today&&(start<nowMins+cfg.leadHours*60);
   var disabled=false, reason='';
   if(past){disabled=true;reason='This date is in the past';}
   else if(tooSoon){disabled=true;reason='Too soon — bookings need at least '+cfg.leadHours+' hours\u2019 notice';}
   else if(!anyFree){disabled=true;reason=reasons[0]||'No resource is free at this time';}
   out.push({time:time,end:fmtMins(end),disabled:disabled,reason:disabled?reason:'',available:!disabled});
 }
 return out;
}
function validateDate(cfg,dateStr,now){
 now=now||demoNow();
 if(!dateStr)return 'Please choose a date.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))return 'Please choose a valid date.';
 if(dateStr<toStr(now))return 'That date is in the past — please choose a future date.';
 if(cfg.closedDays.indexOf(weekdayOf(dateStr))!==-1)return cfg.business+' is closed on '+DAY_NAMES[weekdayOf(dateStr)]+'s — please choose another day.';
 return null;
}
function normalisePhone(raw){return String(raw||'').replace(/[\s-]/g,'').replace(/^\+92/,'0');}
function validPhone(raw){return /^03\d{9}$/.test(normalisePhone(raw));}
function validateDetails(p){var e={}; if(!p.name||p.name.trim().length<3)e.name='Please enter your full name.'; if(!validPhone(p.phone))e.phone='Please enter a valid Pakistani mobile number (e.g. 0321 1234567).'; return e;}
function makeRef(b){return 'BE-DEMO-'+(1000+hashCode(b.skin+b.serviceId+b.resourceId+b.date+b.time+b.phone)%9000);}
function seedBookings(){
 return [
  {ref:'BE-DEMO-4101',skin:'salon',serviceId:'haircut',serviceName:'Haircut & Finish',resourceId:'ayesha',resourceName:'Ayesha Khan',date:'2026-11-25',time:'10:00',duration:45,price:2500,name:'Demo Customer — Hira',phone:'03210001122',notes:'',status:'confirmed'},
  {ref:'BE-DEMO-4102',skin:'salon',serviceId:'facial',serviceName:'Signature Facial',resourceId:'mahnoor',resourceName:'Mahnoor Ali',date:'2026-11-25',time:'12:00',duration:60,price:4500,name:'Demo Customer — Zara',phone:'03210003344',notes:'Sensitive skin',status:'pending'},
  {ref:'BE-DEMO-4103',skin:'clinic',serviceId:'gp',serviceName:'GP Consultation',resourceId:'sana',resourceName:'Dr Sana Tariq',date:'2026-11-24',time:'10:00',duration:20,price:1500,name:'Demo Patient — Ahmed',phone:'03000001122',notes:'',status:'confirmed'},
  {ref:'BE-DEMO-4104',skin:'clinic',serviceId:'dental',serviceName:'Dental Check-up',resourceId:'omar',resourceName:'Dr Omar Farooq',date:'2026-11-26',time:'15:00',duration:30,price:3500,name:'Demo Patient — Fatima',phone:'03000003344',notes:'',status:'completed'},
  {ref:'BE-DEMO-4105',skin:'engine',serviceId:'consult',serviceName:'Discovery Consultation',resourceId:'amara',resourceName:'Amara Shah',date:'2026-11-25',time:'11:00',duration:30,price:0,name:'Demo Lead — Bilal',phone:'03001112233',notes:'',status:'confirmed'}
 ];
}
function filterBookings(list,f){f=f||{};return list.filter(function(b){ if(f.date&&b.date!==f.date)return false; if(f.resourceId&&b.resourceId!==f.resourceId)return false; if(f.status&&b.status!==f.status)return false; if(f.skin&&b.skin!==f.skin)return false; return true;});}
function whatsappLink(cfg,b){var msg='Booking '+b.ref+' — '+b.serviceName+' with '+b.resourceName+' on '+b.date+' at '+b.time+' at '+cfg.business+'. Name: '+b.name+'. (Demo booking — no real appointment.)'; return 'https://wa.me/'+cfg.whatsapp+'?text='+encodeURIComponent(msg);}
function lum(hex){var c=hex.replace('#','');var rgb=[0,2,4].map(function(i){var v=parseInt(c.substr(i,2),16)/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];}
function contrast(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
var THEMES={engine:{accent:'#4338CA',accentDark:'#3730A3',ink:'#17203A',muted:'#475069',bg:'#FFFFFF',surface:'#F1F3F8'},salon:{accent:'#9D174D',accentDark:'#831843',ink:'#2B1A20',muted:'#5C4450',bg:'#FFF9F7',surface:'#FBEFF3'},clinic:{accent:'#0F766E',accentDark:'#115E59',ink:'#12312E',muted:'#3F5B57',bg:'#FFFFFF',surface:'#EDF6F4'}};
global.BOOKING_LOGIC={DEMO_NOW_ISO:DEMO_NOW_ISO,DAY_NAMES:DAY_NAMES,demoNow:demoNow,toStr:toStr,weekdayOf:weekdayOf,mins:mins,fmtMins:fmtMins,hashCode:hashCode,formatPKR:formatPKR,CONFIGS:CONFIGS,getConfig:getConfig,serviceById:serviceById,resourceById:resourceById,generateSlots:generateSlots,validateDate:validateDate,validPhone:validPhone,normalisePhone:normalisePhone,validateDetails:validateDetails,makeRef:makeRef,seedBookings:seedBookings,filterBookings:filterBookings,whatsappLink:whatsappLink,contrast:contrast,THEMES:THEMES,seededTaken:seededTaken};
if(typeof module!=='undefined'&&module.exports)module.exports=global.BOOKING_LOGIC;
})(typeof window!=='undefined'?window:globalThis);
