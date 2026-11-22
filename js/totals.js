'use strict';
function totals(){
 const s=current();
 if(!s)return '<section class="panel">No active class.</section>';
 const tables=tableList(),counts=reportCounts();
 const passRate=counts.count?Math.round(100*counts.passed/counts.count):0;
 const ammo=s.shooters.reduce((sum,p)=>sum+total(p),0);
 const statusStyle=status=>status==='PASS'?'pass':status==='FAIL'?'fail':'incomplete';
 return `<div class="rt-summary-view">
  <section class="rt-summary-hero">
   <div class="rt-summary-hero-top"><span class="rt-eyebrow">CATM · CLASS SUMMARY</span><span class="rt-summary-pill">QUALIFICATION</span></div>
   <h2>Class <span>Summary</span></h2>
   <p>${safe(db.weapon)} · ${safe(s.template?.name||db.course)} <span>·</span> ${safe(s.date||'—')}</p>
   <div class="rt-summary-hero-bottom"><span>${tables.length} firing ${tables.length===1?'table':'tables'}</span><strong>${ammo} rounds allocated</strong></div>
  </section>
  <section class="rt-summary-stats" aria-label="Class qualification counts">
   <div><strong>${counts.count}</strong><small>SHOOTERS</small></div>
   <div class="rt-summary-green"><strong>${counts.passed}</strong><small>QUALIFIED</small></div>
   <div class="rt-summary-red"><strong>${counts.failed}</strong><small>UNQUALIFIED</small></div>
   <div class="rt-summary-yellow"><strong>${counts.incomplete}</strong><small>INCOMPLETE</small></div>
  </section>
  <section class="rt-summary-shell">
   <div class="rt-summary-heading"><div><small class="rt-eyebrow">CLASS RESULTS</small><h3>Shooter Results</h3></div><div class="rt-summary-rate"><strong>${passRate}%</strong><small>PASS RATE</small></div></div>
   <div class="rt-summary-columns"><span>SHOOTER / LANE</span><span>TABLES</span><span>RESULT</span></div>
   <div class="rt-summary-persons">
   ${[...s.shooters].sort((a,b)=>(Number(a.lane)||999)-(Number(b.lane)||999)||a.name.localeCompare(b.name)).map(p=>{
     const result=reportResult(overallStatus(p));
     const finished=tables.filter(t=>reportTableResult(p,t)!=='INCOMPLETE').length;
     const refires=tables.filter(t=>refireEligible(p,t)&&tableStatus(p,'refire',t)!=='Incomplete').length;
     return `<div class="rt-summary-person">
       <div class="rt-summary-person-label"><strong>${safe(p.name)}</strong><small>LANE ${safe(p.lane||'—')} · ${total(p)} RDS${refires?' · '+refires+' REFIRE'+(refires===1?'':'S'):''}</small></div>
       <div class="rt-summary-progress"><strong>${finished}/${tables.length}</strong><small>TABLES</small></div>
       <span class="rt-summary-result rt-summary-${statusStyle(result)}">${result==='PASS'?'QUALIFIED':result==='FAIL'?'UNQUALIFIED':'INCOMPLETE'}</span>
      </div>`;
   }).join('')||'<p class="rt-summary-empty">No shooters added to this class yet.</p>'}
   </div>
  </section>
  <section class="rt-summary-shell rt-summary-report">
   <div class="rt-summary-heading"><div><small class="rt-eyebrow">DETAILED BREAKDOWN</small><h3>Qualification Results</h3></div></div>
   <div class="rt-summary-detail-scroll" role="region" aria-label="Scrollable qualification details" tabindex="0">
   <div class="rt-summary-detail-columns"><span>SHOOTER / LANE</span><span>BUTT #</span><span>WEAPON SN</span><span>TOTAL SCORE</span><span>PASS / FAIL</span></div>
   <div class="rt-summary-detail-rows">
    ${[...s.shooters].sort((a,b)=>(Number(a.lane)||999)-(Number(b.lane)||999)||a.name.localeCompare(b.name)).map(p=>{
      const result=reportResult(overallStatus(p)),score=effectivePaperTotal(p);
      return `<div class="rt-summary-detail-row">
       <div class="rt-summary-detail-shooter"><strong title="${safe(p.name)}">${safe(p.name)}</strong><small>LANE ${safe(p.lane||'—')}</small></div>
       <span class="rt-summary-detail-equipment" title="${safe(p.buttNumber||'Not entered')}">${safe(p.buttNumber||'—')}</span>
       <span class="rt-summary-detail-equipment rt-summary-detail-serial" title="${safe(p.weaponSerial||'Not entered')}">${safe(p.weaponSerial||'—')}</span>
       <strong class="rt-summary-detail-score">${score===''?'—':safe(score)}</strong>
       <span class="rt-summary-detail-result rt-summary-${statusStyle(result)}">${result}</span>
      </div>`;
    }).join('')||'<p class="rt-summary-empty">No shooters added to this class yet.</p>'}
   </div>
   </div>
  </section>
  <section class="rt-summary-shell rt-summary-actions">
   <div class="rt-summary-heading"><div><small class="rt-eyebrow">DOWNLOAD / PRINT</small><h3>Export Results</h3></div></div>
   <p>Export the same concise breakdown shown above: shooter, lane, butt number, weapon SN, total score, and pass/fail.</p>
   <div class="rt-summary-export-buttons">
    <button type="button" onclick="exportExcel()">Export Excel (CSV)</button>
    <button type="button" class="rt-summary-export-primary" onclick="exportPDF()">Export PDF</button>
   </div>
  </section>
  <details class="rt-summary-manage">
   <summary>Course Management</summary>
   <div class="rt-summary-manage-content">
    <section><h3>Complete Course</h3><p>Remove this completed class from Active Courses. Its shooter records and scores will be deleted, so export any results you need first.</p><button class="danger" type="button" onclick="completeCourse()">Complete Course</button></section>
    <section><h3>Reset This Class</h3><p>Remove all shooters, scores, refires, lane assignments, and ammunition for this class. Other classes are unaffected.</p><button class="danger" type="button" onclick="clearAll()">Clear All</button></section>
   </div>
  </details>
 </div>`;
}
function refreshLive(){
 const p=shooter();if(!p)return;
 const r=document.getElementById('roundTotal');if(r)r.textContent='Total ammunition: '+total(p)+' rounds';
 const x=document.getElementById('scoreProgress');if(x)x.textContent=progress(p)+'/'+tableList().length+' Tables completed';
 for(const t of tableList())for(const at of ['initial','refire']){
 const rec=attemptRecord(p,at,t);
 for(const a of t.areas){const e=document.querySelector(`[data-calc="${at}-${t.id}-${a.id}"]`);if(e){const v=areaValue(rec,t,a);e.textContent=v===''?'—':v}}
 const sums=scoreTotals(rec,t);
 for(const [key,val] of [['qual-total',sums.qualifying],['paper-total',sums.paper]]){const e=document.querySelector(`[data-${key}="${at}-${t.id}"]`);if(e)e.textContent=val===''?'—':val}
 const st=document.querySelector(`[data-status="${at}-${t.id}"]`);if(st)st.textContent=tableStatus(p,at,t);
 const ex=document.querySelector(`[data-expert="${at}-${t.id}"]`);if(ex)ex.textContent=evaluateExpert(p,at,t)?'Expert':'—';
 }
 const coursePaper=document.querySelector('[data-course-paper="initial"]');if(coursePaper){const value=effectivePaperTotal(p);coursePaper.textContent=value===''?'—':value;}
 const courseStatus=document.querySelector('[data-course-status]');if(courseStatus)courseStatus.textContent=overallStatus(p);
}
function render(){const isHome=db.view==='home'||((db.view!=='editor'&&db.view!=='edit'&&db.view!=='active'&&db.view!=='weapons')&&!current());document.getElementById('nav').innerHTML=(isHome||db.view==='editor'||db.view==='edit'||db.view==='active'||db.view==='weapons')?'':`<button onclick="home()">⌂ Home</button><button class="${db.view==='roster'?'active':''}" onclick="tab('roster')">Shooters</button><button class="${db.view==='score'?'active':''}" onclick="tab('score')">Score</button><button class="${db.view==='totals'?'active':''}" onclick="tab('totals')">Summary</button>`;document.getElementById('app').innerHTML=db.view==='editor'?editor():db.view==='edit'?editForm():db.view==='active'?activeCourses():db.view==='weapons'?manageWeapons():isHome?dashboard():({roster,score,totals}[db.view]||roster)();if(typeof rtUpdateNextScoreButton==='function')rtUpdateNextScoreButton();}
render();
