
'use strict';
const KEY='rangetrack-development-v1', PREV='rangetrack-development-legacy-v1'; // Development has separate storage from stable Range-Scores
const CATALOG={'M18':['AFQC','DQC','BAT','Sustainment'],'Glock 19':['BAT'],'Glock 26':['BAT'],'M4A1':['Zero Fire','AFQC','DQC','Sustainment'],'M4':['Zero Fire','AFQC','DQC','Sustainment'],'M110A1':['Annual','Recurring','Sustainment']};
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DEFAULT_WEAPONS=['M18','Glock 19','Glock 26','M4A1','M4','M110A1'];
const STARTERS=[['AFQC',['M18','M4A1','M4']],['DQC',['M18','M4A1','M4']],['BAT',['M18','Glock 19','Glock 26']],['Zero Fire',['M4A1','M4']],['Annual',['M110A1']],['Recurring',['M110A1']],['Sustainment',['M18','M4A1','M4','M110A1']]];
const starterCourses=()=>STARTERS.map(([name,weapons],i)=>({id:'c'+i,name,weapons,phases:[{id:'p1',name:'Table 1',rounds:'',areas:[{id:'a1',name:'Scoring Requirement 1',mode:'manual',sources:[],qual:'',expert:''}],time:{enabled:false,seconds:''}}],defaultRounds:0,notes:'Unverified placeholder. Set actual course requirements before operational use.',version:1}));
// Verified M18 DQC scoring configuration (DAFMAN 31-131V2, para 19.3.4).
// Three cumulative evaluation tables; every scoreable area remains fully editable.
const M18_DQC_ID='c-m18-dqc-preloaded';
function m18DqcCourse(){
 const area=(id,name,expert)=>({id,name,mode:'manual',sources:[],qual:'',expert,countScore:true});
 const table=(id,name,rounds,qualMin,expertTotal,vital,head)=>({
  id,name,rounds,qualMin,expertTotal,
  areas:[area(id+'-vital','Vital Area (10-inch)',vital),area(id+'-head','Head (6-inch)',head),area(id+'-outside','Outside Zones (Silhouette)','')],
  time:{enabled:false,seconds:''}
 });
 return {id:M18_DQC_ID,name:'M18 DQC (Preloaded)',weapons:['M18'],defaultRounds:100,version:1,
  notes:'DAFMAN 31-131V2 para 19.3.4. Score each table cumulatively after all orders of fire. Expert requires every table to meet its Expert thresholds. Verify refire rules before operational use.',
  phases:[table('m18dqc-t1','Phase I: Basic Marksmanship Evaluation',25,18,25,19,2),
          table('m18dqc-t2','Phase II: Advanced Marksmanship Evaluation',25,18,25,20,2),
          table('m18dqc-t3','Phase III: Limited Visibility Evaluation',50,35,50,43,1)]};
}
const fresh=()=>({weapon:'',course:'',view:'home',sessions:{},courses:starterCourses(),editing:''});
let db;try{db=JSON.parse(localStorage.getItem(KEY))||JSON.parse(localStorage.getItem(PREV))||fresh()}catch{db=fresh()};if(!db.sessions)db=fresh();if(!Array.isArray(db.courses))db.courses=starterCourses();if(!db.editing)db.editing='';if(!Array.isArray(db.weapons))db.weapons=[...DEFAULT_WEAPONS];db.weapons=[...new Set(db.weapons.filter(w=>typeof w==='string'&&w.trim()).map(w=>w.trim()))];if(!localStorage.getItem(KEY)){const migrated={};for(const [k,s] of Object.entries(db.sessions)){const [w,name]=k.split('|');const c=db.courses.find(c=>c.name===name&&c.weapons.includes(w));if(c){s.template=JSON.parse(JSON.stringify(c));migrated[w+'|'+c.id]=s}else migrated[k]=s}db.sessions=migrated;db.course='';db.view='home'}
// Add the official M18-specific starter once, without overwriting any saved templates or sessions.
if(!db.courses.some(c=>c.id===M18_DQC_ID))db.courses.push(m18DqcCourse());
const WEAPONS=db.weapons;
const courseById=id=>db.courses.find(c=>c.id===id);
const selectedCourse=()=>courseById(db.course);
const availableCourses=w=>db.courses.filter(c=>c.weapons.includes(w));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const attr=safe;
const phases=()=>selectedCourse()?.phases||[];
const keyFor=(w,c)=>w+'|'+c;
const courseKey=c=>c.id;
const sessionKey=()=>keyFor(db.weapon,db.course);
const currentTemplate=()=>selectedCourse();
const sid=(w,c)=>keyFor(w,c), current=()=>db.sessions[sessionKey()], shooter=()=>current()?.shooters.find(x=>x.id===current().selected)||current()?.shooters[0];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){alert('Unable to save locally. Check Safari storage settings.')}};
const n=x=>x===''?'':Math.max(0,Math.floor(Number(x)||0));
const blank=()=>({head:'',body:'',exterior:''});
const newArea=(name='New area',mode='manual',sources=[])=>({id:'a'+uid(),name,mode,sources,qual:'',expert:'',countScore:true});
function normalizeTable(t){
 // V9 templates used nested firing phases. Preserve every area as an editable table area.
 if((t.scoringPhases||[]).length===1 && !t.v10Migrated){t.areas=t.scoringPhases[0].areas||t.areas;t.v10Migrated=true;}
 if(!Array.isArray(t.areas)||!t.areas.length){
  const groups=t.scoringPhases||[];
  if(groups.length===1)t.areas=groups[0].areas||[];
  else if(groups.length>1){
   t.areas=groups.flatMap(ph=>(ph.areas||[]).map(a=>({...a,id:'a'+uid(),name:ph.name+' / '+a.name})));
  }else t.areas=[newArea('Scoring Area 1')];
 }
 t.areas.forEach(a=>{if(a.countScore===undefined)a.countScore=a.mode!=='sum';if(!Array.isArray(a.sources))a.sources=[];});
 if(t.qualMin===undefined)t.qualMin='';
 if(t.expertTotal===undefined)t.expertTotal='';
 return t;
}
function normalizeCourse(c){if(!Array.isArray(c.phases)||!c.phases.length)c.phases=[{id:'p'+uid(),name:'Table 1',rounds:''}];c.phases.forEach(normalizeTable);if(!c.requirements)c.requirements={qual:'',expert:''};return c}
db.courses.forEach(c=>{if((c.version||1)!==1||c.phases?.length!==3)return;const untouched=c.phases.every((t,i)=>t.name==='Phase '+(i+1)&&(!t.rounds||t.rounds==='')&&(!t.time||!t.time.enabled)&&(!t.areas||t.areas.length===4&&t.areas.map(a=>a.name).join('|')==='Head|Body|Exterior|Overall'&&t.areas.every(a=>a.qual===''&&a.expert==='')));if(untouched)c.phases=[{id:'p'+uid(),name:'Table 1',rounds:'',areas:[newArea('Scoring Area 1')],time:{enabled:false,seconds:''}}]});
db.courses.forEach(normalizeCourse);Object.values(db.sessions).forEach(s=>{if(s.template){
 for(const t of s.template.phases||[]){const old=t.scoringPhases||[];
  if(old.length===1){for(const shooter of s.shooters||[]){for(const key of ['initialScores','refireScores']){const dest=shooter[key]||{};if(dest[old[0].id]&&!dest[t.id])dest[t.id]={...dest[old[0].id]};}}}
 }
 normalizeCourse(s.template);
}});
const tableList=()=>current()?.template?.phases||[];
const scoringPhases=t=>[t];
const phaseAsTable=(t,ph)=>t;
const areaValue=(record,table,area,seen=new Set())=>{if(!area||seen.has(area.id))return '';const raw=record?.[area.id];if(area.mode!=='sum')return raw==null?'':raw;const next=new Set(seen);next.add(area.id);const values=(area.sources||[]).map(id=>areaValue(record,table,table.areas.find(a=>a.id===id),next));return values.length&&values.every(v=>v!==''&&Number.isFinite(Number(v)))?values.reduce((sum,v)=>sum+Number(v),0):''};
const countSelected=(rec,table,key)=>{const areas=table.areas.filter(a=>a.mode!=='sum'&&a[key]);if(!areas.length)return '';const vals=areas.map(a=>areaValue(rec,table,a));return vals.every(v=>v!==''&&Number.isFinite(Number(v)))?vals.reduce((n,v)=>n+Number(v),0):''};
const countAllPaper=(rec,table)=>{const areas=table.areas.filter(a=>a.mode!=='sum');if(!areas.length)return '';const vals=areas.map(a=>areaValue(rec,table,a));return vals.every(v=>v!==''&&Number.isFinite(Number(v)))?vals.reduce((sum,v)=>sum+Number(v),0):''};
const scoreTotals=(rec,table)=>({qualifying:countSelected(rec,table,'countScore'),paper:countAllPaper(rec,table)});
const attemptRecord=(p,attempt,table)=>{const dest=attempt==='initial'?p.initialScores:p.refireScores;return dest[table.id]||{}};
function evaluateTable(p,attempt,table){
 const rec=attemptRecord(p,attempt,table);
 const manual=table.areas.filter(a=>a.mode!=='sum');
 if(!manual.length||manual.some(a=>(rec[a.id]??'')===''))return 'Incomplete';
 const totals=scoreTotals(rec,table);
 if(table.qualMin!==''&&table.qualMin!=null&&Number(totals.qualifying)<Number(table.qualMin))return 'Fail';
 for(const a of table.areas){if(a.qual!==''&&a.qual!=null&&Number(areaValue(rec,table,a))<Number(a.qual))return 'Fail'}
 return table.qualMin!==''||table.areas.some(a=>a.qual!=='')?'Pass':'Recorded';
}
function evaluateExpert(p,attempt,table){
 const rec=attemptRecord(p,attempt,table),totals=scoreTotals(rec,table);
 if(evaluateTable(p,attempt,table)==='Incomplete'||evaluateTable(p,attempt,table)==='Fail')return false;
 const has=table.expertTotal!==''||table.areas.some(a=>a.expert!=='');
 if(!has)return false;
 if(table.expertTotal!==''&&Number(totals.qualifying)<Number(table.expertTotal))return false;
 return table.areas.every(a=>a.expert===''||Number(areaValue(rec,table,a))>=Number(a.expert));
}
function tableStatus(p,attempt,t){
 const basic=evaluateTable(p,attempt,t);
 if(basic==='Incomplete')return 'Incomplete';
 if(basic==='Fail')return 'Fail';
 if(evaluateExpert(p,attempt,t))return 'Expert';
 return basic==='Pass'?'Qualified':'Recorded';
}
// Only explicitly initiated remedial attempts appear. Existing recorded refires remain visible
// for backwards compatibility with earlier RangeTrack versions.
function hasLegacyRefire(p){return p.remedialInitiated===undefined&&Object.values(p.refireScores||{}).some(rec=>Object.values(rec||{}).some(v=>v!==''&&v!==null&&v!==undefined))}
function remedialActive(p){return p.remedialInitiated===true||hasLegacyRefire(p)||Object.values(p.remedialTables||{}).some(Boolean)}
function refireEligible(p,t){return (p.remedialTables?.[t.id]===true||(!p.remedialTables&&p.remedialInitiated===true)||hasLegacyRefire(p))&&tableStatus(p,'initial',t)==='Fail'}
function remedialPendingForTable(t){return (current()?.shooters||[]).filter(p=>tableStatus(p,'initial',t)==='Fail'&&!refireEligible(p,t))}
function initiateTableRemedials(){
 const t=tableList()[scoreTableIndex];if(!t)return;
 const pending=remedialPendingForTable(t);if(!pending.length)return;
 for(const p of pending){if(!p.remedialTables)p.remedialTables={};p.remedialTables[t.id]=true}
 save();render();
}
function initiateRemedial(){initiateTableRemedials()}
function effectiveTableStatus(p,t){
 const initial=tableStatus(p,'initial',t);
 if(!refireEligible(p,t))return initial;
 const retry=tableStatus(p,'refire',t);
 return retry==='Incomplete'?initial:retry;
}
function effectivePaperTotal(p){
 const vals=tableList().map(t=>scoreTotals(attemptRecord(p,refireEligible(p,t)&&tableStatus(p,'refire',t)!=='Incomplete'?'refire':'initial',t),t).paper);
 return vals.every(v=>v!=='')?vals.reduce((sum,v)=>sum+Number(v),0):'';
}
function overallStatus(p){
 const statuses=tableList().map(t=>effectiveTableStatus(p,t));
 if(!statuses.length||statuses.some(x=>x==='Incomplete'||x==='Recorded'))return 'Incomplete';
 if(statuses.some(x=>x==='Fail'))return 'Fail';
 return statuses.every(x=>x==='Expert')?'Expert':'Qualified';
}
function coursePaperTotal(p,attempt){
 const vals=tableList().map(t=>scoreTotals(attemptRecord(p,attempt,t),t).paper);
 return vals.every(x=>x!=='')?vals.reduce((sum,x)=>sum+Number(x),0):'';
}
function overallSummary(p){
 const initial=effectivePaperTotal(p);
 const status=overallStatus(p);
 return `<section class="panel" id="overallSummary"><h2>Overall Course Summary</h2><div class="row between"><strong>Total Hits on Paper (All Tables)</strong><strong style="font-size:24px" data-course-paper="initial">${initial===''?'—':initial}</strong></div><div class="row between" style="margin-top:12px"><strong>Overall Status</strong><strong style="font-size:24px" data-course-status>${status}</strong></div><p class="muted">Each failed Table uses its completed refire score in place of its initial score for final status and total hits. Incomplete refires retain the initial failed result.</p></section>`;
}
function rtScoreWarning(message){
 const el=document.getElementById('rt-score-warning');
 if(!el)return;
 el.textContent=message;
 el.hidden=!message;
}
function setAreaScore(id,attempt,tableId,areaId,value,input){
 const session=current(),p=session?.shooters.find(x=>x.id===id);
 const table=session?.template?.phases?.find(t=>t.id===tableId);
 const area=table?.areas?.find(a=>a.id===areaId);
 if(!p||!table||!area||area.mode==='sum')return false;
 const dest=attempt==='initial'?p.initialScores:p.refireScores;
 const scores=dest[tableId]||(dest[tableId]={});
 const old=scores[areaId]??'';
 const raw=String(value).trim();
 const restore=message=>{
  if(input)input.value=old;
  rtScoreWarning(message);
  return false;
 };
 if(raw!==''&&!/^[0-9]+$/.test(raw))return restore('Enter a whole-number score (0 or higher).');
 const next=raw===''?'':Number(raw);
 if(next!==''&&!Number.isSafeInteger(next))return restore('Enter a valid whole-number score.');
 const limit=Number(table.rounds);
 if(table.rounds!==''&&table.rounds!=null&&Number.isFinite(limit)&&limit>0){
  const others=table.areas.filter(a=>a.mode!=='sum'&&a.id!==areaId)
   .reduce((total,a)=>total+(Number(scores[a.id])||0),0);
  if(others+(next===''?0:next)>limit){
   return restore('Maximum '+limit+' rounds for '+table.name+'. Other scoring areas total '+others+'; this field can be no more than '+Math.max(0,limit-others)+'.');
  }
 }
 scores[areaId]=next;
 rtScoreWarning('');
 save();
 if(db.view==='score')refreshScoringTable();else refreshLive();
 return true;
}
function setTimeResult(id,attempt,tableId,value){const p=current().shooters.find(x=>x.id===id);if(!p)return;const key=attempt==='initial'?'initialTimes':'refireTimes';if(!p[key])p[key]={};p[key][tableId]=value;save();refreshLive()}

const makeShooter=(name,lane,rounds)=>({grade:'',organization:'',buttNumber:'',weaponSerial:'',id:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,lane,initial:rounds,extra:0,initialScores:{},refireScores:{},initialTimes:{},refireTimes:{},refire:false,remedialInitiated:false,remedialTables:{}});
const makeSession=()=>({date:new Date().toLocaleDateString('en-CA'),defaultRounds:0,selected:'',shooters:[],view:'roster'});
const isCustom=c=>c==='Sustainment';
function phaseNames(){return current()?.template?.phases?.map(p=>p.id)||phases().map(p=>p.id)};
function phaseTitle(id){return (current()?.template?.phases||phases()).find(p=>p.id===id)?.name||id};
