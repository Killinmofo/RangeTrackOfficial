'use strict';
let rtRosterQuery='';
let rtRosterCopySelected=new Set();
let rtRosterCopyKey='';
let rtRosterCopyPending=[];
function rtRosterClearSelection(){
 rtRosterCopySync();rtRosterCopySelected.clear();
 document.querySelectorAll('.rt-shooter-row').forEach(row=>{row.classList.remove('rt-copy-checked');const check=row.querySelector('.rt-roster-checkbox');if(check)check.checked=false;});
 rtRosterCopyUpdate();
}
function rtRosterCopySync(){
 const key=sessionKey(),s=current();
 if(key!==rtRosterCopyKey){rtRosterCopySelected.clear();rtRosterCopyKey=key;}
 if(s)for(const id of rtRosterCopySelected)if(!s.shooters.some(p=>p.id===id))rtRosterCopySelected.delete(id);
}
function rtRosterToggleCopy(id,checked){
 rtRosterCopySync();
 if(checked)rtRosterCopySelected.add(id);else rtRosterCopySelected.delete(id);
 const row=[...document.querySelectorAll('.rt-shooter-row')].find(el=>el.dataset.shooterId===id);
 if(row)row.classList.toggle('rt-copy-checked',checked);
 rtRosterCopyUpdate();
}
function rtRosterSelectAll(checked){
 rtRosterCopySync();
 // Select only visible shooters when a roster search is active.
 document.querySelectorAll('.rt-shooter-row:not([hidden])').forEach(row=>{
  const id=row.dataset.shooterId;
  if(checked)rtRosterCopySelected.add(id);else rtRosterCopySelected.delete(id);
  row.classList.toggle('rt-copy-checked',checked);
  const box=row.querySelector('.rt-roster-checkbox');if(box)box.checked=checked;
 });
 rtRosterCopyUpdate();
}
function rtRosterCopyUpdate(){
 rtRosterCopySync();
 const count=rtRosterCopySelected.size;
 const label=document.getElementById('rt-roster-selected-count');
 if(label)label.textContent=String(count);
 const contextual=document.getElementById('rt-roster-selection-actions');
 if(contextual)contextual.hidden=count===0;
 const copy=document.getElementById('rt-roster-copy-selected');
 if(copy)copy.disabled=count===0;
 const remove=document.getElementById('rt-roster-remove-selected');
 if(remove)remove.disabled=count===0;
 const menu=document.getElementById('rt-menu-copy');
 if(menu)menu.textContent=count?'Copy '+count+' Selected to Class':'Copy Shooter to Class';
 const visible=[...document.querySelectorAll('.rt-shooter-row:not([hidden])')];
 const all=visible.length>0&&visible.every(row=>rtRosterCopySelected.has(row.dataset.shooterId));
 const selectAll=document.getElementById('rt-roster-select-all');
 if(selectAll){selectAll.checked=all;selectAll.indeterminate=!all&&visible.some(row=>rtRosterCopySelected.has(row.dataset.shooterId));}
}

function rtRosterIcon(type){
 const shapes={
 users:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20v-2a6 6 0 0 1 12 0v2H2zM15 15a5 5 0 0 1 7 5h-6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 edit:'<path d="m4 20 4-.8L19 8.2l-4.2-4.2L4 14.9V20zM13 6l4 4"/>',
 more:'<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
 close:'<path d="M5 5l14 14M19 5L5 19"/>',
 score:'<circle cx="12" cy="12" r="8"/><path d="M12 1v7m0 8v7M1 12h7m8 0h7"/>',
 courses:'<path d="M3 5h7l4 3 7-3v14l-7 3-4-3-7 1zM10 5v14M14 8v14"/>',
 report:'<path d="M6 2h8l5 5v15H6zM14 2v5h5M9 12h7M9 16h7"/>'
 };
 return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[type]||'')+'</svg>';
}
function rtRosterSort(mode){
 const s=current();if(!s)return;
 s.rosterSort=mode==='name'?'name':'lane';save();render();
}
function rtSelectRosterShooter(id){
 const s=current();if(!s)return;
 s.selected=id;save();
 document.querySelectorAll('.rt-shooter-row').forEach(el=>{
  const active=el.dataset.shooterId===id;
  el.classList.toggle('selected',active);
  const pick=el.querySelector('.rt-shooter-pick');if(pick)pick.setAttribute('aria-pressed',String(active));
 });
 const edit=document.getElementById('rt-roster-edit');if(edit)edit.disabled=false;
}
function rtFilterRoster(value){
 rtRosterQuery=String(value||'');
 const needle=rtRosterQuery.trim().toLocaleLowerCase();
 let shown=0;
 document.querySelectorAll('.rt-shooter-row').forEach(el=>{
  const match=!needle||el.dataset.search.includes(needle);
  el.hidden=!match;if(match)shown++;
 });
 const status=document.getElementById('rt-roster-search-status');
 if(status)status.textContent=needle?(shown+' matching '+(shown===1?'shooter':'shooters')):'';
 rtRosterCopyUpdate();
}
function rtClearRoster(){
 const s=current();if(!s||!s.shooters.length)return;
 if(!window.confirm('Clear all '+s.shooters.length+' shooters from this class? This permanently removes their saved scores and personnel details from this class.'))return;
 s.shooters=[];s.selected='';rtRosterCopySelected.clear();save();rtRosterQuery='';render();
}
function rtRosterRemove(){
 const s=current(),p=s?.shooters.find(shooter=>shooter.id===s.selected);
 if(!p){window.alert('Select the shooter you want to remove from the roster first.');return;}
 if(!window.confirm('Remove '+p.name+' from this class? Their saved scores and personnel details for this class will also be deleted.'))return;
 s.shooters=s.shooters.filter(shooter=>shooter.id!==p.id);
 s.selected='';rtRosterCopySelected.delete(p.id);
 save();
 render();
}
function rtRosterRemoveSelected(){
 rtRosterCopySync();
 const s=current();if(!s)return;
 const selected=s.shooters.filter(p=>rtRosterCopySelected.has(p.id));
 if(!selected.length){window.alert('Check the shooters you want to remove first.');return;}
 const names=selected.slice(0,8).map(p=>'• '+p.name).join('\n');
 const overflow=selected.length>8?'\n...and '+(selected.length-8)+' more.':'';
 const ok=window.confirm('Remove '+selected.length+' selected '+(selected.length===1?'shooter':'shooters')+' from this class?\n\n'+names+overflow+'\n\nThis permanently deletes their shooter information, scores, and remedial records in this class only. Copies in other classes will not be affected.');
 if(!ok)return;
 const ids=new Set(selected.map(p=>p.id));
 s.shooters=s.shooters.filter(p=>!ids.has(p.id));
 if(ids.has(s.selected))s.selected=s.shooters[0]?.id||'';
 rtRosterCopySelected.clear();
 save();render();
}
function rtRosterEdit(){
 const s=current();if(!s)return;
 if(!s.selected||!s.shooters.some(p=>p.id===s.selected)){
  window.alert('Select a shooter from the roster first.');
  return;
 }
 openScoreShooterModal('edit');
}
function rtRosterCopy(onlySelected=false){
 rtRosterCopySync();
 const source=current();
 const people=rtRosterCopySelected.size
  ?source.shooters.filter(p=>rtRosterCopySelected.has(p.id))
  :onlySelected?[]:source.shooters.filter(p=>p.id===source.selected);
 if(!people.length){window.alert(onlySelected?'Check the shooters you want to copy first.':'Select a shooter or check one or more boxes first.');return;}
 const destinations=Object.entries(db.sessions).filter(([key,s])=>key!==sessionKey()&&s?.template?.phases?.length);
 if(!destinations.length){window.alert('There are no other active classes to copy into. Start another class first.');return;}
 const menu=document.getElementById('rt-roster-menu');if(menu)menu.hidden=true;
 const root=document.getElementById('rt-modal-root');if(!root)return;
 rtRosterCopyPending=people.map(p=>p.id);
 root.innerHTML=`<div class="rt-modal-overlay" onclick="rtCloseCopyShooter(event)"><section class="rt-modal rt-copy-modal" role="dialog" aria-modal="true" aria-labelledby="rt-copy-title">
  <header><div><small>CLASS ROSTER</small><h3 id="rt-copy-title">Copy ${people.length===1?'Shooter':'Shooters'} to Class</h3></div><button type="button" class="rt-modal-close" onclick="rtCloseCopyShooter()">✕</button></header>
  <form onsubmit="rtSaveCopyShooter(event)">
   <p class="rt-copy-person"><strong>${people.length} ${people.length===1?'shooter':'shooters'} selected</strong></p>
   <div class="rt-copy-names">${people.map(p=>`<span>${safe(p.name)}</span>`).join('')}</div>
   <label>Destination Active Class<select name="target" required>${destinations.map(([key,s],i)=>`<option value="${i}">${safe(s.template?.name||'Saved Class')} (${safe(key.split('|')[0])})${s.date?' · '+safe(s.date):''}</option>`).join('')}</select></label>
   <p class="rt-copy-note">Name, grade/rank, organization, and assigned lane are copied. You can change the lane afterward. Butt number, weapon SN, scores, and remedials stay with the original class. New shooters use the destination class's default initial rounds. Existing names in the destination will be skipped.</p>
   <footer><button type="button" onclick="rtCloseCopyShooter()">Cancel</button><button type="submit" class="primary">Copy ${people.length===1?'Shooter':'Shooters'}</button></footer>
  </form></section></div>`;
 document.body.classList.add('rt-modal-open');
 root.querySelector('select[name="target"]')?.focus();
}
function rtCloseCopyShooter(event){
 if(event&&event.target!==event.currentTarget)return;
 const root=document.getElementById('rt-modal-root');if(root)root.innerHTML='';
 rtRosterCopyPending=[];
 document.body.classList.remove('rt-modal-open');
}
function rtSaveCopyShooter(event){
 event.preventDefault();
 const source=current();
 const people=rtRosterCopyPending.map(id=>source?.shooters.find(item=>item.id===id)).filter(Boolean);
 if(!people.length){window.alert('The selected shooters are no longer available.');rtCloseCopyShooter();return;}
 const destinations=Object.entries(db.sessions).filter(([key,s])=>key!==sessionKey()&&s?.template?.phases?.length);
 const selected=Number(new FormData(event.currentTarget).get('target'));
 if(!Number.isInteger(selected)||selected<0||selected>=destinations.length){window.alert('Choose a valid active class.');return;}
 const [key,target]=destinations[selected];
 const names=new Set(target.shooters.map(p=>String(p.name||'').trim().toLocaleLowerCase()));
 let added=0,skipped=0;
 for(const p of people){
  const normalized=String(p.name||'').trim().toLocaleLowerCase();
  if(names.has(normalized)){skipped++;continue;}
  const copied=makeShooter(p.name,p.lane??'',n(target.defaultRounds??target.template?.defaultRounds??0));
  copied.grade=p.grade||'';
  copied.organization=p.organization||'';
  target.shooters.push(copied);names.add(normalized);added++;
 }
 if(added)save();
 rtCloseCopyShooter();
 rtRosterCopySelected.clear();
 window.alert(added+' '+(added===1?'shooter':'shooters')+' copied to '+(target.template?.name||'the selected class')+' ('+key.split('|')[0]+').'+(skipped?' '+skipped+' already present and skipped.':'')+' Open that class from the Dashboard to review lanes and assign weapon details.');
 render();
}
function rtRosterMoreToggle(){
 const menu=document.getElementById('rt-roster-menu');
 if(menu)menu.hidden=!menu.hidden;
}
function roster(){
 const s=current();
 if(!s)return '<section class="panel">No active class.</section>';
 const shooters=s.shooters||[];
 rtRosterCopySync();
 const ordered=[...shooters].sort((a,b)=>s.rosterSort==='name'
  ?a.name.localeCompare(b.name)
  :(Number(a.lane)>0?Number(a.lane):Number.MAX_SAFE_INTEGER)-(Number(b.lane)>0?Number(b.lane):Number.MAX_SAFE_INTEGER)||a.name.localeCompare(b.name));
 const assigned=shooters.filter(p=>Number(p.lane)>0).length;
 const incomplete=shooters.filter(p=>!p.name?.trim()||!p.grade?.trim()||!p.organization?.trim()).length;
 return `<div class="rt-shooters-view">
  <section class="rt-shooters-card">
   <header class="rt-shooters-card-head">
    <div class="rt-roster-heading">${rtRosterIcon('users')}<div class="rt-roster-heading-text"><h2>Shooters</h2><div class="rt-roster-class-name"><strong>${safe(s.template?.name||selectedCourse()?.name||'Saved Class')}</strong><span>${safe(db.weapon||'Weapon not specified')}</span></div></div></div>
    <span class="rt-roster-count">${shooters.length} ${shooters.length===1?'Shooter':'Shooters'}</span>
   </header>
   <div class="rt-shooters-body">
    <div class="rt-shooters-stats">
     <div class="rt-stat-total"><strong>${shooters.length}</strong><span>Total Shooters</span></div>
     <div class="rt-stat-assigned"><strong>${assigned}</strong><span>Lane Assigned</span></div>
     <div class="rt-stat-incomplete"><strong>${incomplete}</strong><span title="Missing personnel information">Missing Prsnl Info</span></div>
    </div>
    <details class="rt-class-settings">
     <summary><span class="rt-class-settings-title"><span class="rt-class-settings-icon" aria-hidden="true">⚙</span><span><strong>Class Settings</strong><small>Date and ammunition defaults</small></span></span><span class="rt-class-settings-chevron" aria-hidden="true"></span></summary>
     <div class="rt-class-settings-content"><div class="rt-class-settings-fields">
      <label>Class Date<input type="date" value="${safe(s.date)}" onchange="updateSession('date',this.value)"></label>
      <label>Default Initial Rounds<input type="number" min="0" value="${safe(s.defaultRounds||0)}" onchange="updateSession('defaultRounds',this.value)"></label>
     </div>
     <button type="button" onclick="applyRounds()">Apply rounds to all shooters</button>
     <p class="muted">Set the qualification date and default ammunition for this class.</p>
    </div>
    </details>
    <label class="rt-roster-search">${rtRosterIcon('search')}<span class="sr-only">Search shooters</span><input type="search" placeholder="Search shooters..." aria-label="Search shooters" autocomplete="off" oninput="rtFilterRoster(this.value)" value="${safe(rtRosterQuery)}"></label>
    <div class="rt-roster-bulkbar">
     <label class="rt-roster-all-label"><input id="rt-roster-select-all" type="checkbox" aria-label="Select all visible shooters" onchange="rtRosterSelectAll(this.checked)" ${shooters.length&&shooters.every(p=>rtRosterCopySelected.has(p.id))?'checked':''}><span>Select All</span></label>
     <span class="rt-roster-select-hint">Check shooters for bulk actions</span>
    </div>
    <div class="rt-roster-selection-actions" id="rt-roster-selection-actions" ${rtRosterCopySelected.size?'':'hidden'} role="group" aria-label="Selected shooter actions">
     <span class="rt-roster-selected-badge" id="rt-roster-selected-count" aria-live="polite">${rtRosterCopySelected.size}</span>
     <span class="rt-roster-selected-copy"><strong>Selected</strong><small>Ready for bulk action</small></span>
     <button type="button" id="rt-roster-copy-selected" class="rt-roster-context-copy" onclick="rtRosterCopy(true)" aria-label="Copy selected shooters to another class" title="Copy selected">${rtRosterIcon('copy')}</button>
     <button type="button" id="rt-roster-remove-selected" class="rt-roster-context-remove" onclick="rtRosterRemoveSelected()" aria-label="Remove selected shooters from this class" title="Remove selected">${rtRosterIcon('trash')}</button>
     <button type="button" class="rt-roster-context-clear" onclick="rtRosterClearSelection()" aria-label="Clear shooter selection" title="Clear selection">${rtRosterIcon('close')}</button>
    </div>
    <div class="rt-roster-table" role="group" aria-label="Class shooter roster">
     <div class="rt-roster-columns"><span class="rt-roster-check-space"></span><span>#</span><span>Shooter</span><span>Lane</span><span>Ammo</span></div>
     ${ordered.map((p,i)=>`<div class="rt-shooter-row ${s.selected===p.id?'selected':''} ${rtRosterCopySelected.has(p.id)?'rt-copy-checked':''}" data-shooter-id="${safe(p.id)}" data-search="${safe((p.name+' '+p.grade+' '+p.organization+' '+p.lane).toLocaleLowerCase())}">
       <input type="checkbox" class="rt-roster-checkbox" aria-label="Select ${safe(p.name)} for bulk actions" ${rtRosterCopySelected.has(p.id)?'checked':''} onchange="rtRosterToggleCopy('${p.id}',this.checked)">
       <button type="button" class="rt-shooter-pick" aria-pressed="${s.selected===p.id?'true':'false'}" onclick="rtSelectRosterShooter('${p.id}')"><span class="rt-roster-number">${i+1}</span><strong class="rt-shooter-name">${safe(shortScoreName(p.name))}</strong><span class="rt-lane-value">${p.lane?'<b>'+safe(p.lane)+'</b>':'—'}</span><span class="rt-ammo-value">${safe(Number(p.initial)||0)}</span></button>
      </div>`).join('')||'<p class="rt-roster-empty">No shooters added yet. Tap Add Shooter below to get started.</p>'}
    </div>
    <p id="rt-roster-search-status" class="rt-search-status" aria-live="polite"></p>

   </div>
  </section>
  <div id="rt-modal-root"></div>
 </div>
 <div class="rt-roster-more-menu" id="rt-roster-menu" hidden role="group" aria-label="More shooter options">
  <strong>Roster options</strong>
  <button type="button" onclick="rtRosterSort('lane')">Sort by lane ${s.rosterSort!=='name'?'✓':''}</button>
  <button type="button" onclick="rtRosterSort('name')">Sort by name ${s.rosterSort==='name'?'✓':''}</button>
  <button type="button" id="rt-menu-copy" onclick="rtRosterCopy()" ${shooters.length?'':'disabled'}>${rtRosterCopySelected.size?'Copy '+rtRosterCopySelected.size+' Selected to Class':'Copy Shooter to Class'}</button>
  <button type="button" class="rt-clear-roster" onclick="rtRosterRemoveSelected()" ${rtRosterCopySelected.size?'':'disabled'}>Remove Selected</button>
  <button type="button" class="rt-clear-roster" onclick="rtRosterRemove()" ${shooters.length?'':'disabled'}>Remove Shooter</button>
  <button type="button" class="rt-clear-roster" onclick="rtClearRoster()" ${shooters.length?'':'disabled'}>Clear Roster</button>
 </div>
 <nav class="rt-roster-footer" aria-label="Shooter management">
  <button type="button" class="rt-add-shooter" onclick="openScoreShooterModal('add')">${rtRosterIcon('plus')}<span>Add Shooter</span></button>
  <button type="button" id="rt-roster-edit" onclick="rtRosterEdit()" ${shooters.length?'':'disabled'}>${rtRosterIcon('edit')}<span>Edit</span></button>
  <button type="button" class="rt-more-shooters" onclick="rtRosterMoreToggle()" aria-controls="rt-roster-menu">${rtRosterIcon('more')}<span>More</span></button>
 </nav>`;
}
function phaseCell(p,attempt,phase){const obj=(attempt==='initial'?p.initialScores:p.refireScores)[phase]||blank();return `<td>${['head','body','exterior'].map(k=>`<label class="cellfield"><span>${k==='exterior'?'Exterior':k==='head'?'Head':'Body'}</span><input type="number" min="0" inputmode="numeric" placeholder="—" value="${safe(obj[k])}" oninput="setScore('${p.id}','${attempt}','${phase}','${k}',this.value)"></label>`).join('')}<div class="overall"><strong>Overall</strong><strong id="sum-${attempt}-${phase.replace(' ','')}">${sumPhase(obj)}</strong></div></td>`}

let scoreTableIndex=0;
function scoringTableMissingCount(){
 const s=current(),table=tableList()[scoreTableIndex];
 if(!s||!table||db.view!=='score')return 0;
 let missing=0;
 for(const p of s.shooters||[]){
  for(const attempt of ['initial','refire']){
   if(attempt==='refire'&&!refireEligible(p,table))continue;
   const scores=attemptRecord(p,attempt,table);
   for(const a of table.areas||[]){
    if(a.mode==='sum')continue;
    if(scores[a.id]===undefined||scores[a.id]===null||scores[a.id]==='')missing++;
   }
  }
 }
 return missing;
}
function rtSetScoringTable(target){
 const tables=tableList();
 if(!tables.length || !Number.isInteger(target)||target<0||target>=tables.length)return false;
 if(target===scoreTableIndex)return true;
 const missing=scoringTableMissingCount();
 if(missing>0&&!window.confirm('This firing table has '+missing+' incomplete scoring '+(missing===1?'field':'fields')+'. Continue to another table?'))return false;
 scoreTableIndex=target;
 if(typeof rtLastField!=='undefined')rtLastField='';
 render();
 document.getElementById('app')?.scrollIntoView({block:'start'});
 return true;
}
function selectScoringTable(select){
 const target=Number(select.value);
 if(!rtSetScoringTable(target))select.value=String(scoreTableIndex);
}
function changeScoringTable(delta){
 rtSetScoringTable(scoreTableIndex+delta);
}
function initiateRemedialRow(id){const t=tableList()[scoreTableIndex],p=current()?.shooters.find(x=>x.id===id);if(!t||!p||tableStatus(p,'initial',t)!=='Fail')return;if(!p.remedialTables)p.remedialTables={};p.remedialTables[t.id]=true;save();render()}
function refreshScoringTable(){
 const t=tableList()[scoreTableIndex],session=current();if(!t||!session||db.view!=='score')return;
 for(const p of session.shooters){
  for(const attempt of ['initial','refire']){
   const row=[...document.querySelectorAll('.rt-score-person[data-shooter-id]')].find(el=>el.dataset.shooterId===p.id&&el.dataset.attemptRow===attempt);
   if(!row)continue;
   const record=attemptRecord(p,attempt,t);
   for(const a of t.areas)if(a.mode==='sum'){
    const el=[...row.querySelectorAll('[data-cell]')].find(x=>x.dataset.cell===p.id+'|'+attempt+'|'+a.id);
    if(el){const value=areaValue(record,t,a);el.textContent=value===''?'—':value}
   }
   const hits=row.querySelector('.rt-score-paper');
   if(hits){const value=scoreTotals(record,t).qualifying;hits.textContent=value===''?'—':value}
   const status=attempt==='initial'?effectiveTableStatus(p,t):tableStatus(p,'refire',t),abbr=shortScoreStatus(status);
   const badge=row.querySelector('.rt-status');
   if(badge){badge.textContent=abbr;badge.className='rt-status '+(abbr==='UQ'?'rt-uq':abbr==='Q'?'rt-q':abbr==='E'?'rt-e':'rt-empty')}
  }
 }
 const shooters=session.shooters;
 const stats=[['[data-rt-completed]',shooters.filter(p=>tableStatus(p,'initial',t)!=='Incomplete').length],['[data-rt-passing]',shooters.filter(p=>['Qualified','Expert'].includes(effectiveTableStatus(p,t))).length],['[data-rt-failing]',shooters.filter(p=>effectiveTableStatus(p,t)==='Fail').length]];
 for(const [selector,value] of stats){const el=document.querySelector(selector);if(el)el.textContent=value}
 const pending=remedialPendingForTable(t).length,button=document.querySelector('.rt-remedial-btn');
 if(button){
  button.disabled=!pending;button.classList.toggle('rt-has-pending',pending>0);
  const icon=button.querySelector('.rt-footer-icon');
  if(icon)icon.innerHTML='↻'+(pending?'<b class="rt-remedial-count">'+pending+'</b>':'');
 }
 if(typeof rtUpdateNextScoreButton==='function')rtUpdateNextScoreButton();
}

const refireOpenIds=new Set();
function setScoringRefireOpen(id,isOpen){
 if(isOpen)refireOpenIds.add(id);else refireOpenIds.delete(id);
}
function shortScoreName(name){
 const raw=String(name||'').trim();if(!raw)return '—';
 if(raw.includes(',')){const [last,first]=raw.split(',');return last.trim().toUpperCase()+', '+(first.trim().charAt(0)||'').toUpperCase()+'.'}
 const parts=raw.split(/\s+/);return parts.length>1?parts.at(-1).toUpperCase()+', '+parts[0].charAt(0).toUpperCase()+'.':raw.toUpperCase();
}

function shortScoreStatus(v){return v==='Expert'?'E':v==='Qualified'||v==='Pass'?'Q':v==='Fail'?'UQ':'—'}

function selectScoreShooter(id){
 const session=current();if(!session)return;session.selected=id;save();
 document.querySelectorAll('.rt-score-person').forEach(row=>row.classList.toggle('rt-selected',row.dataset.shooterId===id));
}

function openScoreShooterModal(mode){
 const s=current();if(!s)return;
 const p=mode==='edit'?s.shooters.find(x=>x.id===s.selected):null;
 if(mode==='edit'&&!p){alert('Select a shooter from the score table first.');return}
 const root=document.getElementById('rt-modal-root');if(!root)return;
 root.innerHTML=`<div class="rt-modal-overlay" onclick="closeScoreShooterModal(event)"><section class="rt-modal" role="dialog" aria-modal="true" aria-labelledby="rt-dialog-title"><header><div><small>CLASS ROSTER</small><h3 id="rt-dialog-title">${p?'Edit Shooter':'Add Shooter'}</h3></div><button type="button" class="rt-modal-close" onclick="closeScoreShooterModal()">✕</button></header>
 <form id="rt-shooter-form" onsubmit="saveScoreShooterModal(event,'${p?p.id:''}')">
 <label>Full name<input name="name" required autocomplete="off" value="${safe(p?.name||'')}" placeholder="Smith, John"></label>
 <div class="rt-modal-grid"><label>Lane<input name="lane" type="number" min="1" value="${safe(p?.lane??'')}"></label><label>Initial Ammo<input name="initial" type="number" min="0" value="${safe(p?.initial??s.defaultRounds??0)}"></label></div>
 <div class="rt-modal-grid"><label>Grade/Rank (optional)<input name="grade" autocomplete="off" value="${safe(p?.grade||'')}"></label><label>Organization (optional)<input name="organization" autocomplete="off" value="${safe(p?.organization||'')}"></label></div>
 <div class="rt-modal-grid"><label>Butt # (optional)<input name="buttNumber" autocomplete="off" value="${safe(p?.buttNumber||'')}" placeholder="Butt number"></label><label>Weapon SN (optional)<input name="weaponSerial" autocomplete="off" value="${safe(p?.weaponSerial||'')}" placeholder="Serial number"></label></div>
 <footer><button type="button" onclick="closeScoreShooterModal()">Cancel</button><button type="submit" class="primary">${p?'Save Changes':'Add Shooter'}</button></footer>
 </form></section></div>`;
 document.body.classList.add('rt-modal-open');
 root.querySelector('[name="name"]')?.focus();
}

function closeScoreShooterModal(e){if(e&&e.target!==e.currentTarget)return;const root=document.getElementById('rt-modal-root');if(root)root.innerHTML='';document.body.classList.remove('rt-modal-open')}

function saveScoreShooterModal(e,id){
 e.preventDefault();const data=new FormData(e.target),s=current();if(!s)return;
 const name=String(data.get('name')||'').trim();if(!name)return;
 let p=s.shooters.find(x=>x.id===id);
 if(!p){p=makeShooter(name,'',n(s.defaultRounds));s.shooters.push(p)}
 for(const key of ['name','grade','organization','buttNumber','weaponSerial'])if(data.has(key))p[key]=String(data.get(key)||'').trim();
 p.lane=data.get('lane')===''?'':n(data.get('lane'));p.initial=n(data.get('initial'));
 s.selected=p.id;save();closeScoreShooterModal();render();
}

