'use strict';
function score(){
 const session=current(),tables=tableList();
 if(!session)return '<section class="panel">No active course</section>';
 if(!tables.length)return '<section class="panel">No firing tables configured.</section>';
 scoreTableIndex=Math.min(Math.max(0,scoreTableIndex),tables.length-1);
 const t=tables[scoreTableIndex],shooters=[...session.shooters].sort((a,b)=>(Number(a.lane)||999)-(Number(b.lane)||999)||a.name.localeCompare(b.name));
 const completed=shooters.filter(p=>tableStatus(p,'initial',t)!=='Incomplete').length;
 const passing=shooters.filter(p=>['Qualified','Expert'].includes(effectiveTableStatus(p,t))).length;
 const failed=shooters.filter(p=>effectiveTableStatus(p,t)==='Fail').length;
 const pending=remedialPendingForTable(t).length;
 const cols=`minmax(82px,1.35fr) repeat(${t.areas.length},minmax(38px,1fr)) 45px 37px`;
 const label=a=>{const v=String(a||'Score');return /head/i.test(v)?'Head':/body/i.test(v)?'Body':/exterior|outer/i.test(v)?'Outer':/vital/i.test(v)?'Vital':/paper/i.test(v)?'Paper':/total/i.test(v)?'Total':v.length>7?v.slice(0,6)+'…':v};
 const input=(p,at,a)=>{const record=attemptRecord(p,at,t),value=areaValue(record,t,a);return a.mode==='sum'?`<output class="rt-score-calc" data-cell="${safe(p.id+'|'+at+'|'+a.id)}">${value===''?'—':safe(value)}</output>`:`<input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" class="rt-score-input" data-shooter="${safe(p.id)}" data-attempt="${at}" data-area="${safe(a.id)}" aria-label="${safe(p.name+' '+a.name+' '+at)}" value="${safe(record[a.id]??'')}" placeholder="—" oninput="setAreaScore('${p.id}','${at}','${t.id}','${a.id}',this.value,this)">`};
 const renderRow=(p,at)=>{
  const retry=at==='refire',raw=tableStatus(p,at,t),status=retry?raw:effectiveTableStatus(p,t);
  const paper=scoreTotals(attemptRecord(p,at,t),t).qualifying;
  const countStatus=shortScoreStatus(status), selected=session.selected===p.id;
  return `<div class="rt-score-person ${retry?'rt-refire-row':''} ${selected?'rt-selected':''}" data-shooter-id="${safe(p.id)}" data-attempt-row="${at}" style="--rt-cols:${cols}">
   <div class="rt-score-person-name"><button type="button" onclick="selectScoreShooter('${p.id}')" aria-label="Select ${safe(p.name)}"><strong>${retry?'↳ RE-FIRE':safe(shortScoreName(p.name))}</strong><small>${retry?'Table '+(scoreTableIndex+1):'LANE '+safe(p.lane||'—')}</small></button></div>
   ${t.areas.map(a=>`<div class="rt-score-cell">${input(p,at,a)}</div>`).join('')}
   <div class="rt-score-paper" data-rt-hits="${safe(p.id+'|'+at)}">${paper===''?'—':paper}</div>
   <div class="rt-score-result"><span class="rt-status ${countStatus==='UQ'?'rt-uq':countStatus==='Q'?'rt-q':countStatus==='E'?'rt-e':'rt-empty'}" data-rt-status="${safe(p.id+'|'+at)}">${countStatus}</span></div>
   </div>`;
 };
 return `<div class="rt-score-view">
 <section class="rt-course-banner">
 <div class="rt-banner-top"><span class="rt-eyebrow">CATM · LIVE CLASS</span><span class="rt-live"><i></i> AUTO-SAVED</span></div>
 <div class="rt-banner-main"><div><h2>${safe(db.weapon)} <span>Qualification</span></h2><p>${safe(session.template?.name||db.course)} · ${safe(session.date)}</p></div><span class="rt-table-counter">TABLE ${scoreTableIndex+1} / ${tables.length}</span></div>
 <div class="rt-table-control"><button type="button" onclick="changeScoringTable(-1)" ${scoreTableIndex===0?'disabled':''}>‹</button><select aria-label="Firing table" onchange="selectScoringTable(this)">${tables.map((x,i)=>`<option value="${i}" ${i===scoreTableIndex?'selected':''}>${safe(x.name)}</option>`).join('')}</select><button type="button" onclick="changeScoringTable(1)" ${scoreTableIndex===tables.length-1?'disabled':''}>›</button></div>
 </section>
 <div class="rt-stats"><div><small>SHOOTERS</small><strong data-rt-shooters>${shooters.length}</strong></div><div><small>SCORED</small><strong data-rt-completed>${completed}</strong></div><div><small>QUALIFIED</small><strong class="rt-lime" data-rt-passing>${passing}</strong></div><div><small>UNQUALIFIED</small><strong class="rt-red" data-rt-failing>${failed}</strong></div></div>
 <section class="rt-table-shell">
 <div class="rt-table-heading"><div><span class="rt-eyebrow">SCORING MATRIX</span><h3>${safe(t.name)}</h3></div><small>${t.rounds===''?'':safe(t.rounds)+' RDS'} · ${shooters.length} SHOOTERS</small></div>
 <div id="rt-score-warning" class="rt-score-warning" role="alert" aria-live="assertive" hidden></div>
 <div class="rt-score-grid" style="--rt-cols:${cols}">
 <div class="rt-score-columns"><span>SHOOTER</span>${t.areas.map(a=>`<span title="${safe(a.name)}">${safe(label(a.name))}</span>`).join('')}<span>HITS</span><span>QUAL</span></div>
 ${shooters.map(p=>renderRow(p,'initial')+(refireEligible(p,t)?renderRow(p,'refire'):'' )).join('')||'<div class="rt-empty-state">No shooters added yet. Use Add below to start scoring.</div>'}
 </div>
 <div class="rt-table-legend"><span><i class="rt-dot q"></i> Q Qualified</span><span><i class="rt-dot uq"></i> UQ Unqualified</span><span><i class="rt-dot e"></i> E Expert</span></div>
 </section>
 <div id="rt-modal-root"></div>
 </div>
 <nav class="rt-sticky-footer" aria-label="Scoring actions">
  <button type="button" onclick="openScoreShooterModal('add')"><span class="rt-footer-icon">＋</span><small>Add</small></button>
  <button type="button" onclick="openScoreShooterModal('edit')" ${!session.shooters.length?'disabled':''}><span class="rt-footer-icon">✎</span><small>Edit</small></button>
  <button type="button" class="rt-remedial-btn ${pending?'rt-has-pending':''}" onclick="initiateTableRemedials()" ${!pending?'disabled':''}><span class="rt-footer-icon">↻${pending?`<b class="rt-remedial-count">${pending}</b>`:''}</span><small>Remedial</small></button>
  <button type="button" class="rt-prev-btn" onclick="rtPreviousScoreField()" aria-label="Go to previous scoring field"><span class="rt-footer-icon">←</span><small>Previous</small></button>
  <button type="button" class="rt-next-btn" onclick="rtNextScoreField()"><span class="rt-footer-icon">➜</span><small>Next Field</small></button>
 </nav>`;
}

// Compact operational summary; detailed scoring remains in stored shooter records.
