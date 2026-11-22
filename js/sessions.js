'use strict';
function openCourse(){
 if(!db.weapon)return;
 const key=sessionKey(),existing=db.sessions[key];
 if(existing){
  // Existing classes retain their own course configuration, even if the library template is deleted.
  if(!existing.template?.phases?.length){
   alert('This saved class has no course configuration. Its records have not been changed.');
   return;
  }
 }else{
  const template=selectedCourse();
  if(!template)return;
  db.sessions[key]=makeSession();
  db.sessions[key].template=JSON.parse(JSON.stringify(template));
  db.sessions[key].defaultRounds=template.defaultRounds||0;
 }
 db.view='roster';save();render();
}
function home(){db.view='home';dashboardSection='';save();render()}
function tab(v){db.view=v;save();render()}
function chooseWeapon(w){dashboardSection='course';db.weapon=w;db.course='';save();render()}
function chooseCourse(c){db.course=c;save();render()}
function removeShooter(id){if(!confirm('Remove this shooter and their scores?'))return;const s=current();s.shooters=s.shooters.filter(p=>p.id!==id);if(s.selected===id)s.selected=s.shooters[0]?.id||'';save();render()}
function editShooter(id,k,v){const p=current().shooters.find(x=>x.id===id);if(!p)return;p[k]=['initial','extra','lane'].includes(k)?n(v):v;save();if(k==='lane'||k==='name')render();else refreshLive()}
function updateSession(k,v){current()[k]=k==='defaultRounds'?n(v):v;save()}
function applyRounds(){if(!confirm('Replace the initial ammunition count for all shooters in this course?'))return;const s=current();s.shooters.forEach(p=>p.initial=n(s.defaultRounds));save();render()}
function openShooter(id){current().selected=id;tab('score')}
function next(d){const s=current();if(!s.shooters.length)return;let i=s.shooters.findIndex(p=>p.id===s.selected);s.selected=s.shooters[(i+d+s.shooters.length)%s.shooters.length].id;save();render()}
function toggleRefire(checked){const p=shooter();if(!p)return;if(!checked&&Object.values(p.refireScores).some(o=>Object.values(o).some(v=>v!==''))&&!confirm('Hide the refire row? Existing refire scores will be preserved.')){render();return}p.refire=checked;save();render()}
function setScore(id,attempt,phase,field,v){const p=current().shooters.find(x=>x.id===id);if(!p)return;const dest=attempt==='initial'?p.initialScores:p.refireScores;if(!dest[phase])dest[phase]=blank();dest[phase][field]=n(v);save();refreshLive()}
function sumPhase(o){if(!o||['head','body','exterior'].some(k=>o[k]===''||o[k]==null))return '—';return ['head','body','exterior'].reduce((a,k)=>a+Number(o[k]),0)}
function progress(p){return tableList().filter(t=>{
 const rec=p.initialScores[t.id]||{};
 return t.areas.filter(a=>a.mode!=='sum').every(a=>(rec[a.id]??'')!=='');
}).length}
function total(p){return (Number(p.initial)||0)+(Number(p.extra)||0)}
function clearAll(){
 const s=current();if(!s)return;
 const template=s.template||selectedCourse();
 if(!template){alert('Cannot reset this class because its course configuration is unavailable. No data was changed.');return;}
 const ok=confirm('CLEAR ALL for '+db.weapon+' '+(template.name||db.course)+'?\\n\\nThis permanently deletes all shooters, lanes, scores, refires and ammunition for this course. Other courses will not be affected.');
 if(!ok)return;
 if(prompt('Type CLEAR to confirm:')!=='CLEAR')return;
 const freshSession=makeSession();
 freshSession.template=JSON.parse(JSON.stringify(template));
 freshSession.defaultRounds=template.defaultRounds||0;
 db.sessions[sessionKey()]=freshSession;
 db.view='roster';save();render();
}
