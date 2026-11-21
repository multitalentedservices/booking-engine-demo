(function(){
'use strict';var L=window.BOOKING_LOGIC,A=window.BE_APP;
var state={step:1,serviceId:'',resourceId:'',date:'',time:'',duration:0};
function cfg(){return L.getConfig(A.getSkin());}
function $(s){return document.querySelector(s);}
function renderServices(){var c=cfg();$('[data-services]').innerHTML=c.services.map(function(s){return '<label class="pick"><input type="radio" name="service" value="'+s.id+'"><strong>'+s.name+'</strong><span>'+s.desc+'</span><br><span class="pill">'+s.duration+' min · '+L.formatPKR(s.price)+' · '+s.buffer+' min buffer</span></label>';}).join('');}
function renderResources(){var c=cfg();var html='<label class="pick"><input type="radio" name="resource" value="any"><strong>First available</strong><span>Any resource who is working and free.</span></label>';html+=c.resources.map(function(r){return '<label class="pick"><input type="radio" name="resource" value="'+r.id+'"><strong>'+r.name+'</strong><span>'+r.role+'</span></label>';}).join('');$('[data-resources]').innerHTML=html;}
function showStep(n){state.step=n;document.querySelectorAll('.step-panel').forEach(function(p){p.classList.toggle('on',+p.getAttribute('data-step')===n);});document.querySelectorAll('.steps span').forEach(function(s,i){s.classList.toggle('on',i<n);});window.scrollTo(0,0);}
function err(step,msg){$('[data-step-error="'+step+'"]').textContent=msg||'';}
function renderSlots(){
 var c=cfg();var dateErr=L.validateDate(c,state.date);var note=$('[data-slot-note]');var box=$('[data-slots]');
 if(dateErr){note.textContent=dateErr;box.innerHTML='';return;}
 var slots=L.generateSlots(c,state.serviceId,state.resourceId,state.date,A.getBookings());
 if(slots.length&&slots[0].closed){note.textContent=slots[0].reason;box.innerHTML='';return;}
 note.textContent='Demo clock: Tuesday 24 November 2026, 09:00. Bookings need at least '+c.leadHours+' hours\u2019 notice. Disabled slots name their reason.';
 box.innerHTML=slots.map(function(s){return '<button type="button" class="slot" data-time="'+s.time+'" '+(s.disabled?'disabled':'')+' aria-pressed="false">'+s.time+(s.disabled?'<small>'+s.reason+'</small>':'<small>to '+s.end+'</small>')+'</button>';}).join('');
 box.querySelectorAll('.slot:not([disabled])').forEach(function(b){b.addEventListener('click',function(){box.querySelectorAll('.slot').forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');state.time=b.getAttribute('data-time');err(3,'');});});
}
function review(){
 var c=cfg();var svc=L.serviceById(c,state.serviceId);var resName=state.resourceId==='any'?'First available':L.resourceById(c,state.resourceId).name;
 // resolve any -> first free resource for record
 var resId=state.resourceId;
 if(resId==='any'){var slots=L.generateSlots(c,state.serviceId,'any',state.date,A.getBookings()); resId=c.resources[0].id; for(var i=0;i<c.resources.length;i++){var s2=L.generateSlots(c,state.serviceId,c.resources[i].id,state.date,A.getBookings());var f=s2.find(function(x){return x.time===state.time&&x.available;}); if(f){resId=c.resources[i].id;resName=c.resources[i].name;break;}} }
 state.resolvedResourceId=resId;state.resolvedResourceName=resName;state.duration=svc.duration;
 $('[data-review]').innerHTML='<p><strong>Business:</strong> '+c.business+'</p><p><strong>Service:</strong> '+svc.name+' ('+svc.duration+' min, '+L.formatPKR(svc.price)+')</p><p><strong>With:</strong> '+resName+'</p><p><strong>When:</strong> '+state.date+' at '+state.time+'</p><p><strong>Name:</strong> '+$('[data-name]').value+'</p><p><strong>Phone:</strong> '+$('[data-phone]').value+'</p>';
}
document.addEventListener('DOMContentLoaded',function(){
 renderServices();renderResources();
 var dateInput=$('[data-date]');dateInput.min=L.toStr(L.demoNow());dateInput.addEventListener('change',function(){state.date=dateInput.value;state.time='';renderSlots();});
 document.addEventListener('skinchange',function(){state.serviceId='';state.resourceId='';state.time='';renderServices();renderResources();$('[data-slots]').innerHTML='';$('[data-slot-note]').textContent='Pick a date to see slots for '+cfg().business+'.';showStep(1);var b=$('[data-biz-book]');if(b)b.textContent=cfg().business;});
 document.querySelectorAll('[data-next]').forEach(function(btn){btn.addEventListener('click',function(){
   var step=+btn.closest('.step-panel').getAttribute('data-step');
   if(step===1){var s=document.querySelector('input[name="service"]:checked');if(!s){err(1,'Please choose a service.');return;}state.serviceId=s.value;err(1,'');showStep(2);}
   else if(step===2){var r=document.querySelector('input[name="resource"]:checked');if(!r){err(2,'Please choose who you want — or First available.');return;}state.resourceId=r.value;err(2,'');showStep(3);}
   else if(step===3){if(!state.date){err(3,'Please choose a date.');return;}var de=L.validateDate(cfg(),state.date);if(de){err(3,de);return;}if(!state.time){err(3,'Please choose an available time slot.');return;}err(3,'');showStep(4);}
   else if(step===4){var p={name:$('[data-name]').value,phone:$('[data-phone]').value};var e=L.validateDetails(p);$('[data-error-for="name"]').textContent=e.name||'';$('[data-error-for="phone"]').textContent=e.phone||'';if(Object.keys(e).length)return;review();showStep(5);}
 });});
 document.querySelectorAll('[data-back]').forEach(function(b){b.addEventListener('click',function(){showStep(state.step-1);});});
 ['name','phone'].forEach(function(f){$('[data-'+f+']').addEventListener('input',function(){var p={name:$('[data-name]').value,phone:$('[data-phone]').value};var e=L.validateDetails(p);if(!e[f])$('[data-error-for="'+f+'"]').textContent='';});});
 $('[data-confirm]').addEventListener('click',function(){
   var c=cfg();var svc=L.serviceById(c,state.serviceId);
   var b={ref:'',skin:c.id,serviceId:svc.id,serviceName:svc.name,resourceId:state.resolvedResourceId,resourceName:state.resolvedResourceName,date:state.date,time:state.time,duration:svc.duration,price:svc.price,name:$('[data-name]').value.trim(),phone:L.normalisePhone($('[data-phone]').value),notes:$('[data-notes]').value.trim(),status:'confirmed'};
   b.ref=L.makeRef(b);var all=A.getBookings();all.push(b);A.saveBookings(all);
   var wa=L.whatsappLink(c,b);
   $('[data-confirmation]').innerHTML='<h2>Booking confirmed — demo</h2><p>Reference <strong>'+b.ref+'</strong></p><p>'+b.serviceName+' with '+b.resourceName+' on '+b.date+' at '+b.time+' at '+c.business+'. Total: '+L.formatPKR(b.price)+'.</p><p class="hint">This is a demo confirmation — no real appointment has been booked. The booking is saved in this browser and appears in the Admin view.</p><p><a class="btn" data-wa href="'+wa+'" target="_blank" rel="noopener">Confirm on WhatsApp</a> <a class="btn secondary" href="book.html">Add another booking</a> <a class="btn secondary" href="admin.html">View in Admin</a></p>';
   $('[data-confirmation]').hidden=false;showStep(6);
   var waBtn=document.querySelector('[data-wa]');waBtn.addEventListener('click',function(){A.logWa({ref:b.ref,at:'demo-clock',href:wa});});
 });
});
})();
