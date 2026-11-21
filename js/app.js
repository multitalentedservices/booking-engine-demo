/* Shared app: skin state is ONE surface (lesson 28) — control, theme and config all read/write here. */
(function(){
'use strict';var L=window.BOOKING_LOGIC;
function getSkin(){try{return localStorage.getItem('be_skin')||'engine';}catch(e){return 'engine';}}
function setSkin(id){ if(!L.CONFIGS[id])id='engine'; try{localStorage.setItem('be_skin',id);}catch(e){} applySkin(id); document.dispatchEvent(new CustomEvent('skinchange',{detail:{skin:id}})); }
function applySkin(id){ document.documentElement.setAttribute('data-skin',id); document.querySelectorAll('[data-skin-btn]').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-skin-btn')===id));}); var c=L.getConfig(id); document.querySelectorAll('[data-biz-name]').forEach(function(el){el.textContent=c.business;}); document.querySelectorAll('[data-biz-tag]').forEach(function(el){el.textContent=c.tagline;}); }
function getBookings(){ try{var raw=localStorage.getItem('be_bookings'); if(!raw){var s=L.seedBookings(); localStorage.setItem('be_bookings',JSON.stringify(s)); return s;} return JSON.parse(raw);}catch(e){return L.seedBookings();} }
function saveBookings(b){try{localStorage.setItem('be_bookings',JSON.stringify(b));}catch(e){} }
function logWa(entry){try{var l=JSON.parse(localStorage.getItem('be_wa_log')||'[]');l.push(entry);localStorage.setItem('be_wa_log',JSON.stringify(l));}catch(e){} }
document.addEventListener('DOMContentLoaded',function(){ applySkin(getSkin()); document.querySelectorAll('[data-skin-btn]').forEach(function(b){b.addEventListener('click',function(){setSkin(b.getAttribute('data-skin-btn'));});}); });
window.BE_APP={getSkin:getSkin,setSkin:setSkin,applySkin:applySkin,getBookings:getBookings,saveBookings:saveBookings,logWa:logWa};
})();
