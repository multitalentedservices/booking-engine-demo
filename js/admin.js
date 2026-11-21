(function(){
'use strict';var L=window.BOOKING_LOGIC,A=window.BE_APP;
function $(s){return document.querySelector(s);}
function render(){
 var f={date:$('[data-f-date]').value||'',resourceId:$('[data-f-resource]').value||'',status:$('[data-f-status]').value||''};
 var all=A.getBookings();var list=L.filterBookings(all,f);
 $('[data-admin-count]').textContent=list.length+' booking'+(list.length===1?'':'s')+' shown (demo data)';
 $('[data-admin-rows]').innerHTML=list.map(function(b){return '<tr><td><strong>'+b.ref+'</strong><br>'+b.skin+'</td><td>'+b.date+' '+b.time+'</td><td>'+b.serviceName+'<br><span class="hint">'+b.resourceName+'</span></td><td>'+b.name+'<br><span class="hint">'+b.phone+'</span></td><td><span class="pill">'+b.status+'</span></td><td>'+(b.status!=='cancelled'?'<button class="btn secondary" data-act="confirm" data-ref="'+b.ref+'">Confirm</button> <button class="btn secondary" data-act="complete" data-ref="'+b.ref+'">Complete</button> <button class="btn secondary" data-act="cancel" data-ref="'+b.ref+'">Cancel</button>':'<span class="hint">Cancelled — slot freed</span>')+'</td></tr>';}).join('')||'<tr><td colspan="6">No bookings match these filters. Clear a filter to see more demo bookings.</td></tr>';
 document.querySelectorAll('[data-act]').forEach(function(btn){btn.addEventListener('click',function(){var bookings=A.getBookings();var b=bookings.find(function(x){return x.ref===btn.getAttribute('data-ref');});if(!b)return;b.status=btn.getAttribute('data-act')==='cancel'?'cancelled':btn.getAttribute('data-act')==='complete'?'completed':'confirmed';A.saveBookings(bookings);render();});});
}
document.addEventListener('DOMContentLoaded',function(){
 // resource filter across all skins (ids unique)
 var sel=$('[data-f-resource]');var seen={};A.getBookings().forEach(function(b){if(!seen[b.resourceId]){seen[b.resourceId]=1;var o=document.createElement('option');o.value=b.resourceId;o.textContent=b.resourceName;sel.appendChild(o);}});
 ['[data-f-date]','[data-f-resource]','[data-f-status]'].forEach(function(s){$(s).addEventListener('change',render);});
 render();
});
})();
