/* SlotBook — Premium layer (index only): live hero mini-booking on the REAL engine
   (BOOKING_LOGIC.generateSlots + BE_APP state), Lenis smooth scroll, GSAP chapters.
   Everything degrades: no JS / no libs / reduced motion = complete static page. */
(function(){
'use strict';
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Static capture mode (?static=1 / data-static): the mini-booking below is
   functional content and still runs; only the motion layer stands down. */
var STATIC=/[?&]static=1(?:&|$)/.test(window.location.search)||document.documentElement.hasAttribute('data-static');
if(STATIC)document.documentElement.setAttribute('data-static','');

/* ---------- Live mini-booking (hero) ---------- */
var L=window.BOOKING_LOGIC,A=window.BE_APP;
var svcSel=document.querySelector('[data-mb-service]'),dateIn=document.querySelector('[data-mb-date]'),
    slotsBox=document.querySelector('[data-mb-slots]'),note=document.querySelector('[data-mb-note]'),
    summary=document.querySelector('[data-mb-summary]'),bizEl=document.querySelector('[data-mb-biz]');
var chosen='';
function cfg(){return L.getConfig(A.getSkin());}
function renderServices(){
 var c=cfg(),cur=svcSel.value;
 svcSel.innerHTML=c.services.map(function(s){return '<option value="'+s.id+'">'+s.name+' — '+s.duration+' min · '+L.formatPKR(s.price)+'</option>';}).join('');
 if(L.serviceById(c,cur))svcSel.value=cur;
}
function renderSlots(){
 var c=cfg();chosen='';bizEl.textContent=c.business;
 var dateErr=L.validateDate(c,dateIn.value);
 if(dateErr){note.textContent=dateErr;slotsBox.innerHTML='';summary.textContent='Pick another date to see live slots.';return;}
 var slots=L.generateSlots(c,svcSel.value,'any',dateIn.value,A.getBookings());
 if(slots.length&&slots[0].closed){note.textContent=slots[0].reason;slotsBox.innerHTML='';summary.textContent='';return;}
 note.textContent='First available · '+c.business+' · demo clock Tue 24 Nov 2026, 09:00 · '+c.leadHours+'h lead time applies.';
 slotsBox.innerHTML=slots.map(function(s){return '<button type="button" class="slot" data-mb-time="'+s.time+'" '+(s.disabled?'disabled':'')+' aria-pressed="false">'+s.time+(s.disabled?'<small>'+s.reason+'</small>':'<small>to '+s.end+'</small>')+'</button>';}).join('');
 slotsBox.querySelectorAll('.slot:not([disabled])').forEach(function(b){b.addEventListener('click',function(){
   slotsBox.querySelectorAll('.slot').forEach(function(x){x.setAttribute('aria-pressed','false');});
   b.setAttribute('aria-pressed','true');chosen=b.getAttribute('data-mb-time');
   var svc=L.serviceById(cfg(),svcSel.value);
   summary.textContent=svc.name+' · '+dateIn.value+' at '+chosen+' · First available · '+L.formatPKR(svc.price)+' — continue to the full demo to confirm it.';
 });});
 summary.textContent='Live slots from the engine — pick one.';
}
if(svcSel&&dateIn&&slotsBox){
 dateIn.min=L.toStr(L.demoNow());
 renderServices();renderSlots();
 svcSel.addEventListener('change',renderSlots);
 dateIn.addEventListener('change',renderSlots);
 document.addEventListener('skinchange',function(){renderServices();renderSlots();});
}

/* ---------- Smooth scroll + GSAP chapters (P2/P3) ---------- */
if(reduced||STATIC||!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
if(window.Lenis){
 var lenis=new Lenis({lerp:.1});
 lenis.on('scroll',ScrollTrigger.update);
 gsap.ticker.add(function(t){lenis.raf(t*1000);});
 gsap.ticker.lagSmoothing(0);
}
/* Hero: headline masked rise + mini-booking settles in (once) */
gsap.from('.hero h1',{y:36,opacity:0,duration:.9,ease:'power3.out'});
gsap.from('.mini-book',{y:28,opacity:0,duration:.9,delay:.15,ease:'power3.out'});
/* Chapters: each section enters differently — no uniform fade-up */
gsap.utils.toArray('[data-chapter]').forEach(function(sec,i){
 var cards=sec.querySelectorAll('.card');
 if(!cards.length)return;
 gsap.from(cards,{y:i%2?34:22,x:i%2?-14:0,opacity:0,duration:.8,stagger:.1,ease:'power3.out',immediateRender:false,
  scrollTrigger:{trigger:sec,start:'top 88%',once:true}});
});
window.addEventListener('load',function(){ScrollTrigger.refresh();});
/* Stat numerals count up when reached */
document.querySelectorAll('[data-count]').forEach(function(el){
 var target=+el.getAttribute('data-count'),obj={v:0};
 gsap.to(obj,{v:target,duration:1.1,ease:'power2.out',
  scrollTrigger:{trigger:el,start:'top 92%',once:true},
  onUpdate:function(){el.textContent=Math.round(obj.v);}});
});
})();
