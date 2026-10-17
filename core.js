(function(root){
const money=x=>x!==''&&x!==null&&x!==undefined&&Number.isFinite(Number(x))&&Number(x)>=0;
function plan(p){const keys=['cash','bills','living','home','tax','emergency','goals','floor'];if(!p.confirmed||!keys.every(k=>money(p[k])))return null;const protectedMoney=keys.slice(1).reduce((s,k)=>s+Number(p[k]),0),delta=Number(p.cash)-protectedMoney;const complete=['saving','invest','debt'].every(k=>money(p[k]));return {available:Math.max(0,delta),shortfall:Math.max(0,-delta),remaining:complete?Math.max(0,delta)-['saving','invest','debt'].reduce((s,k)=>s+Number(p[k]),0):null};}
function home(h){const k=['pedro','orlanis','water','power','internet','food','housing','other','margin','saving','buffer'];if(!k.every(x=>money(h[x]))||Number(h.pedro)+Number(h.orlanis)<=0)return null;const ratio=Number(h.pedro)/(Number(h.pedro)+Number(h.orlanis)),total=k.slice(2).reduce((s,x)=>s+Number(h[x]),0),p=Math.round(total*ratio*100)/100;return {ratio,total,pedro:p,orlanis:Math.round((total-p)*100)/100};}
function csvParse(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(q&&text[i+1]==='"'){cell+='"';i++;}else q=!q;}else if(c===','&&!q){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}if(q)throw Error('Comillas sin cerrar en el CSV.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;}
function validateRows(rows){if(!rows.length)throw Error('CSV vacío.');const headers=rows[0].map(v=>v.replace(/^\uFEFF/,'').trim().toLowerCase());const keys=['fecha','cuenta','descripcion','tipo','categoria','monto','ambito'];if(keys.some(k=>!headers.includes(k)))throw Error('Faltan columnas. Descarga la plantilla para ver el formato.');return rows.slice(1).map((r,i)=>{const t=Object.fromEntries(keys.map(k=>[k,(r[headers.indexOf(k)]||'').trim()]));if(!/^\d{4}-\d{2}-\d{2}$/.test(t.fecha)||Number.isNaN(Date.parse(t.fecha))||new Date(t.fecha).toISOString().slice(0,10)!==t.fecha)throw Error('Fecha inválida en fila '+(i+2));if(!money(t.monto)||!['Ingreso','Gasto','Transferencia','Reembolso'].includes(t.tipo)||!['Personal','Hogar'].includes(t.ambito)||!t.cuenta||!t.descripcion)throw Error('Monto, tipo, ámbito o descripción inválidos en fila '+(i+2));t.monto=Number(t.monto);return t;});}
function fingerprint(t){return [t.fecha,t.cuenta,t.descripcion,t.tipo,t.categoria,Number(t.monto),t.ambito].join('|');}
function trends(rows,month){const end=new Date(month+'-01T00:00:00Z'),start=new Date(end);start.setUTCDate(start.getUTCDate()-90);const startKey=start.toISOString().slice(0,10),endKey=end.toISOString().slice(0,10);const current=rows.filter(t=>t.ambito==='Personal'&&t.tipo==='Gasto'&&t.fecha.startsWith(month));const historical=rows.filter(t=>t.ambito==='Personal'&&t.tipo==='Gasto'&&t.fecha>=startKey&&t.fecha<endKey);const groups={};for(const t of current){const key=t.categoria||'Sin categoría';groups[key]=(groups[key]||0)+Number(t.monto);}const alerts=[];for(const t of current){const prior=historical.filter(x=>x.categoria===t.categoria).map(x=>Number(x.monto)).sort((a,b)=>a-b);if(prior.length<5)continue;const mid=Math.floor(prior.length/2),median=prior.length%2?prior[mid]:(prior[mid-1]+prior[mid])/2;if(Number(t.monto)>2*median&&Number(t.monto)-median>=25)alerts.push({...t,median,samples:prior.length});}return {groups,alerts,baseline:historical.length};}
function mergeFinance(remote,local){
 const data=JSON.parse(JSON.stringify(remote)),old=local||{};let changes=0,added=0;
 const ids=new Set(data.transactions.map(t=>t.id));
 for(const t of old.transactions||[]){if(!ids.has(t.id)){data.transactions.push(t);ids.add(t.id);changes++;added++;}}
 for(const key of ['plans','homes']){
  for(const [month,fields] of Object.entries(old[key]||{})){
   if(!/^\d{4}-\d{2}$/.test(month)||!fields||typeof fields!=='object')continue;
   for(const [field,value] of Object.entries(fields)){
    if(value===''||value===null||value===undefined)continue;
    data[key][month]??={};
    if(data[key][month][field]!==value){data[key][month][field]=value;changes++;}
   }
  }
 }
 data.accounts=data.accounts.map((cloud,i)=>{const own=old.accounts?.[i];if(!own||own.balance===''||own.balance===null||own.balance===undefined)return cloud;
  if(cloud.balance!==''&&cloud.date&&own.date&&own.date<cloud.date)return cloud;
  if(own.balance!==cloud.balance||own.date!==cloud.date){changes++;return {...cloud,balance:own.balance,date:own.date||cloud.date};}
  return cloud;
 });
 if(old.priority&&old.priority!==data.priority&&!/^Movimientos desde junio importados\./.test(old.priority)){data.priority=old.priority;changes++;}
 if(old.month&&old.month!==data.month){data.month=old.month;changes++;}
 if(old.preferences){data.preferences={...(data.preferences||{}),...old.preferences};}
 return {data,changed:changes>0,added,changes};
}
const api={money,plan,home,csvParse,validateRows,fingerprint,trends,mergeFinance};if(typeof module!=='undefined')module.exports=api;else root.Core=api;
})(typeof window!=='undefined'?window:globalThis);
