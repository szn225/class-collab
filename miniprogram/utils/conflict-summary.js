// Pure comparison of the two saved snapshots; it never changes either version.
function decode(value,fallback){if(typeof value!=='string')return value??fallback;try{return JSON.parse(value)}catch{return fallback}}
function list(values,key){const result=decode(values[key],[]);return Array.isArray(result)?result:[]}
function stable(value){if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';return JSON.stringify(value)}
function latest(records){const dates=records.map(r=>r.updatedAt||r.createdAt).filter(Boolean).map(v=>new Date(v).getTime()).filter(Number.isFinite);if(!dates.length)return '暂无更新时间';const d=new Date(Math.max(...dates));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function summarize(local={},remote={}){
 const lr=list(local,'records'),rr=list(remote,'records'),lp=list(local,'plans'),rp=list(remote,'plans');const changes=[]
 for(const [key,label,title] of [['records','考试','examName'],['plans','复盘','title']]){
  const left=list(local,key),right=list(remote,key),lm=new Map(left.map(r=>[r.id,r])),rm=new Map(right.map(r=>[r.id,r]));
  for(const id of new Set([...lm.keys(),...rm.keys()])){const l=lm.get(id),r=rm.get(id);if(l&&r&&stable(l)===stable(r))continue;changes.push({id:key+':'+id,label:(l||r)[title]||'未命名'+label,detail:!r?'仅本机有此'+label:!l?'仅云端有此'+label:'两边内容不同'})}
 }
 const other=new Set([...Object.keys(local),...Object.keys(remote)].filter(k=>!['records','plans'].includes(k)));const otherChanged=[...other].some(k=>stable(decode(local[k],null))!==stable(decode(remote[k],null)))
 return {local:{records:lr.length,plans:lp.length,updated:latest(lr)},remote:{records:rr.length,plans:rp.length,updated:latest(rr)},changes,otherChanged}
}
module.exports={summarize}
