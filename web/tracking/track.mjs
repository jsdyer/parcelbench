const $ = id => document.getElementById(id);
const key = 'coolcode:parcelbench:tracked:v1';
const alerts = {
  ca:['Canadian delivery alerts (PDF)','https://www.canadapost-postescanada.ca/cpc/doc/en/news-and-media/delivery-service-alerts.pdf'],
  international:['U.S. and international delivery alerts','https://www.canadapost-postescanada.ca/cpc/en/our-company/support-dashboard.page']
};
const official = number => 'https://www.canadapost-postescanada.ca/track-reperage/en#/details/'+encodeURIComponent(number);
const valid = number => /^(?:[A-Z0-9]{12,13}|[0-9]{15,16})$/.test(number);
function readEntries() {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data.filter(p => p && valid(p.number) && typeof p.label === 'string' && Object.hasOwn(alerts,p.area)).slice(0,30) : [];
  } catch { return []; }
}
function writeEntries(rows) {
  try { localStorage.setItem(key,JSON.stringify(rows)); draw(); return true; }
  catch { $('notice').textContent = 'This browser could not save the list. You can still open official tracking.'; return false; }
}
function alertLink(a,area) {
  const [text,href] = alerts[area] || alerts.ca;
  a.textContent = text;
  a.href = href;
}
function draw() {
  const list = $('saved'), rows = readEntries();
  list.replaceChildren();
  if (!rows.length) { const item=document.createElement('li'); item.textContent='No parcels saved.'; list.append(item); }
  for (const row of rows) {
    const item=document.createElement('li'),track=document.createElement('a'),region=document.createElement('a'),remove=document.createElement('button');
    track.href=official(row.number); track.textContent=row.label ? row.label+' · '+row.number : row.number;
    alertLink(region,row.area); remove.type='button'; remove.textContent='Remove'; remove.setAttribute('aria-label','Remove '+(row.label || row.number));
    remove.addEventListener('click',()=>writeEntries(readEntries().filter(p=>p.number!==row.number)));
    item.append(track,' · ',region,' ',remove);list.append(item);
  }
}
function entry() {
  const number=$('number').value.replace(/[\s-]/g,'').toUpperCase();
  if (!valid(number)) { $('notice').textContent='Enter a 12-, 13- or 16-character parcel number, or a 15-digit notice number.'; $('number').focus(); return null; }
  return {number,label:$('label').value.trim().slice(0,60),area:$('area').value};
}
$('track').addEventListener('submit',event=>{event.preventDefault();const row=entry();if(row)location.assign(official(row.number));});
$('area').addEventListener('change',()=>alertLink($('alerts'),$('area').value));
$('save').addEventListener('click',()=>{
  const row=entry();if(!row)return;
  const items=readEntries().filter(p=>p.number!==row.number);
  if(items.length>=30){$('notice').textContent='This device has 30 saved parcels. Remove one before saving another.';return;}
  if(writeEntries([row,...items]))$('notice').textContent='Parcel saved on this device.';
});
let generation=0;
$('number').addEventListener('input',()=>{generation++;$('history').hidden=true;$('notice').textContent='';});
async function enableInline() {
  const response=await fetch('../config.json');
  if(!response.ok)return;
  const cfg=await response.json();
  if(cfg.inlineTracking !== true)return;
  const gateway=new URL(cfg.gateway);
  if(gateway.protocol !== 'https:')return;
  $('events').hidden=false;
  $('events').insertAdjacentText('afterend',' Checking events here sends the tracking number to Canada Post through CoolCode’s private, uncached gateway.');
  $('events').addEventListener('click',async()=>{
    const row=entry();if(!row)return;
    const current=++generation;
    $('events').disabled=true;$('history').hidden=true;$('notice').textContent='Requesting tracking events…';
    try{
      const response=await fetch(new URL('/api/parcelbench/tracking',gateway),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:row.number}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(24000)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error?.message || 'Tracking service unavailable.');
      if(current!==generation)return;
      const data=result.data;
      if(!Array.isArray(data?.events))throw new Error('No readable tracking response.');
      $('summary').textContent=[data.service,data.expected?'Expected '+data.expected:'','Checked '+new Date(result.fetched_at).toLocaleString()].filter(Boolean).join(' · ');
      $('timeline').replaceChildren(...data.events.map(event=>{const item=document.createElement('li');item.textContent=[event.date,event.time,event.zone,event.description,event.city,event.province].filter(Boolean).join(' · ');return item;}));
      $('history').hidden=false;$('notice').textContent=data.events.length+' events returned.';
    }catch(error){if(current===generation)$('notice').textContent=error.message+' Open official tracking to check directly.';}
    finally{$('events').disabled=false;}
  });
}
draw();enableInline().catch(()=>{});
