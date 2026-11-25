export const postal = value => String(value).toUpperCase().replace(/\s/g,'');
export const validPostal = value => /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(postal(value));
export function quoteParams(values,box='A') {
  if(!validPostal(values.origin)||!validPostal(values.destination))throw new Error('Enter two valid Canadian postal codes.');
  const result={origin:postal(values.origin),destination:postal(values.destination),mailingDate:values.mailingDate};
  if(!/^\d{4}-\d\d-\d\d$/.test(result.mailingDate)||new Date(result.mailingDate+'T12:00:00Z').toISOString().slice(0,10)!==result.mailingDate)throw new Error('Choose a valid mailing date.');
  for(const key of ['weight','length','width','height']){
    const n=Number(values[key+(box==='B'?'B':'')]);
    if(!Number.isFinite(n)||n<=0||n>(key==='weight'?30:200))throw new Error('Use a weight up to 30 kg and dimensions up to 200 cm.');
    result[key]=String(n);
  }
  return result;
}
export function deliveryLabel(date,target) {
  if(!date)return 'Delivery date not returned';
  if(!target)return 'Expected '+date;
  return date<=target?'Expected by your target':'Expected after your target';
}
export function rankedQuotes(quotes,target) {
  return [...quotes].sort((a,b)=>a.total-b.total).map(q=>({...q,deliveryLabel:deliveryLabel(q.expectedDeliveryDate,target),meetsTarget:q.expectedDeliveryDate&&target?q.expectedDeliveryDate<=target:null}));
}
export function comparison(a,b) {
  return a.map(x=>{const y=b.find(v=>v.code===x.code);return y?{name:x.name,a:x.total,b:y.total,saving:Math.round((x.total-y.total)*100)/100}:null;}).filter(Boolean);
}
export function hoursText(hours,loaded=false) {
  if(hours===null&&!loaded)return 'Load the published opening hours.';
  if(!Array.isArray(hours)||!hours.length)return 'Opening hours are unavailable here. Check this outlet in Canada Post’s finder before visiting.';
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return hours.map(h=>`${days[h.day-1]}: ${h.times.length?Array.from({length:Math.ceil(h.times.length/2)},(_,i)=>h.times[i*2]+'–'+(h.times[i*2+1]||'end of day')).join(', '):'hours unavailable here'}`).join('\n');
}
export function officeMap(office) {
  if(!office.coordinates)return null;
  const {latitude:lat,longitude:lon}=office.coordinates;
  return 'https://www.openstreetmap.org/export/embed.html?'+new URLSearchParams({bbox:[lon-.018,lat-.012,lon+.018,lat+.012].join(','),layer:'mapnik',marker:lat+','+lon});
}
