'use strict';
function editor(){
 const count=db.courses.length;
 const assigned=db.courses.filter(c=>c.weapons.length).length;
 return `<div class="rt-config-view rt-library-view">
  <section class="rt-config-hero">
   <div class="rt-config-hero-top"><span class="rt-eyebrow">RANGETRACK · COURSE MANAGEMENT</span><span class="rt-config-tag">LIBRARY</span></div>
   <h2>Course <span>Editor</span></h2>
   <p>Create, customize, and manage qualification course templates. Changes to templates affect new classes only.</p>
   <div class="rt-config-hero-foot"><span>${count} COURSE ${count===1?'TEMPLATE':'TEMPLATES'}</span><strong>${assigned} ASSIGNED</strong></div>
  </section>
  <section class="rt-config-shell">
   <header class="rt-config-heading"><div><span class="rt-eyebrow">COURSE LIBRARY</span><h3>Course Templates</h3></div><button type="button" class="rt-config-primary" onclick="newCourse()">+ New Course</button></header>
   <div class="rt-config-list">
    ${db.courses.map(c=>`<div class="rt-config-row rt-library-course">
     <div class="rt-config-row-main"><strong>${safe(c.name)}</strong><small>${c.weapons.map(safe).join(', ')||'No weapons assigned'} · ${c.phases.length} ${c.phases.length===1?'table':'tables'} · v${c.version||1}</small></div>
     <div class="rt-config-row-actions"><button type="button" class="rt-config-action" onclick="editCourse('${c.id}')">Edit</button><button type="button" class="rt-config-action" onclick="duplicateCourse('${c.id}')">Copy</button><button type="button" class="rt-config-danger" aria-label="Delete ${safe(c.name)}" onclick="deleteCourse('${c.id}')">Delete</button></div>
    </div>`).join('')||'<p class="rt-config-empty">No course templates yet. Select New Course to create one.</p>'}
   </div>
   <div class="rt-config-note">The preloaded M18 DQC includes DAFMAN scoring thresholds. Other starter templates may contain placeholders.</div>
  </section>
  <section class="rt-config-shell">
   <header class="rt-config-heading"><div><span class="rt-eyebrow">LOCAL BACKUP</span><h3>Course Library Backup</h3></div></header>
   <div class="rt-config-content">
    <p>Export your templates to a JSON backup or import a previously saved library. Your course templates are stored on this device, not GitHub.</p>
    <div class="rt-config-backup-actions"><button type="button" class="rt-config-secondary" onclick="exportLibrary()">Export Templates</button><label>Import Templates<input type="file" accept="application/json,.json" onchange="importLibrary(this.files[0])"></label></div>
   </div>
  </section>
  <button type="button" class="rt-config-back" onclick="home()">‹ Back to Dashboard</button>
 </div>`;
}
function newCourse(){const c={id:'c'+uid(),name:'New Course',weapons:[],phases:[normalizeTable({id:'p'+uid(),name:'Table 1',rounds:'',areas:[newArea('Scoring Area 1')]})],defaultRounds:0,notes:'Custom template',version:1};db.courses.push(c);db.editing=c.id;db.view='edit';save();render()}
function editCourse(id){db.editing=id;db.view='edit';save();render()}
function duplicateCourse(id){const c=courseById(id);if(!c)return;const d=JSON.parse(JSON.stringify(c));d.id='c'+uid();d.name=c.name+' Copy';d.version=1;db.courses.push(d);db.editing=d.id;db.view='edit';save();render()}
function deleteCourse(id){if(!confirm('Delete this course template from the library? Existing class scores will remain saved.'))return;db.courses=db.courses.filter(c=>c.id!==id);if(db.course===id)db.course='';db.view='editor';save();render()}
function updateTemplate(k,v){const c=courseById(db.editing);if(!c)return;c[k]=k==='defaultRounds'?n(v):v;c.version=(c.version||1)+1;save()}
function toggleWeapon(w,checked){const c=courseById(db.editing);if(!c)return;c.weapons=checked?[...new Set([...c.weapons,w])]:c.weapons.filter(x=>x!==w);c.version++;save()}
function updatePhase(id,k,v){const c=courseById(db.editing);const t=c?.phases.find(x=>x.id===id);if(!t)return;t[k]=k==='rounds'?(v===''?'':n(v)):v;c.version++;save()}
function addPhase(){const c=courseById(db.editing);if(!c)return;c.phases.push(normalizeTable({id:'p'+uid(),name:'Table '+(c.phases.length+1),rounds:'',areas:[newArea('Scoring Area 1')]}));c.version++;save();render()}
function removePhase(id){const c=courseById(db.editing);if(!c||c.phases.length===1)return alert('A course must have at least one table.');if(!confirm('Remove this table from the template?'))return;c.phases=c.phases.filter(x=>x.id!==id);c.version++;save();render()}
function editArea(tableId,areaId,k,v){const c=courseById(db.editing),t=c?.phases.find(x=>x.id===tableId),a=t?.areas.find(x=>x.id===areaId);if(!a)return;a[k]=['qual','expert'].includes(k)?(v===''?'':n(v)):v;if(k==='mode'&&v==='sum'&&!a.sources)a.sources=[];c.version++;save();if(k==='mode')render()}
function addArea(tableId){const c=courseById(db.editing),t=c?.phases.find(x=>x.id===tableId);if(!t)return;t.areas.push(newArea('Scoreable Area '+(t.areas.length+1)));c.version++;save();render()}
function removeArea(tableId,areaId){const c=courseById(db.editing),t=c?.phases.find(x=>x.id===tableId);if(!t||t.areas.length===1)return alert('Keep at least one scoring area.');if(!confirm('Remove this scoreable area?'))return;t.areas=t.areas.filter(x=>x.id!==areaId);t.areas.forEach(a=>a.sources=(a.sources||[]).filter(x=>x!==areaId));c.version++;save();render()}
function toggleSource(tableId,areaId,sourceId,checked){const c=courseById(db.editing),t=c?.phases.find(x=>x.id===tableId),a=t?.areas.find(x=>x.id===areaId);if(!a)return;a.sources=checked?[...new Set([...(a.sources||[]),sourceId])]:(a.sources||[]).filter(x=>x!==sourceId);c.version++;save()}
function toggleAreaCount(tableId,areaId,k,checked){const c=courseById(db.editing),t=c?.phases.find(x=>x.id===tableId),a=t?.areas.find(x=>x.id===areaId);if(!a)return;a[k]=checked;c.version++;save()}
function setTableTime(tableId,k,v){const c=courseById(db.editing),t=c?.phases.find(x=>x.id===tableId);if(!t)return;t.time[k]=k==='seconds'?(v===''?'':n(v)):v;c.version++;save();if(k==='enabled')render()}
function addScoringPhase(tableId){
 const c=courseById(db.editing),t=c?.phases.find(x=>x.id===tableId);if(!t)return;
 t.scoringPhases.push({id:'sp'+uid(),name:'Phase '+(t.scoringPhases.length+1),time:{enabled:false,seconds:''},areas:[newArea('Scoring Area 1')]});
 c.version++;save();render();
}
function removeScoringPhase(tableId,phaseId){
 const c=courseById(db.editing),t=c?.phases.find(x=>x.id===tableId);if(!t)return;
 if(t.scoringPhases.length<2)return alert('Keep at least one Phase per Table.');
 if(!confirm('Remove this Phase and its scoring fields?'))return;
 t.scoringPhases=t.scoringPhases.filter(p=>p.id!==phaseId);c.version++;save();render();
}
function editScoringPhase(tableId,phaseId,name){
 const c=courseById(db.editing),ph=c?.phases.find(t=>t.id===tableId)?.scoringPhases.find(p=>p.id===phaseId);
 if(ph){ph.name=name;c.version++;save()}
}
function setPhaseTime(tableId,phaseId,k,v){
 const c=courseById(db.editing),ph=findEditorPhase(tableId,phaseId);if(!ph)return;
 if(!ph.time)ph.time={enabled:false,seconds:''};
 ph.time[k]=k==='seconds'?(v===''?'':n(v)):v;c.version++;save();if(k==='enabled')render();
}
function findEditorPhase(tableId,phaseId){
 return courseById(db.editing)?.phases.find(t=>t.id===tableId)?.scoringPhases.find(p=>p.id===phaseId);
}
function editScoringArea(tableId,phaseId,areaId,k,v){
 const c=courseById(db.editing),ph=findEditorPhase(tableId,phaseId),a=ph?.areas.find(x=>x.id===areaId);if(!a)return;
 a[k]=['qual','expert'].includes(k)?(v===''?'':n(v)):v;
 if(k==='mode'&&v==='sum')a.sources=a.sources||[];
 c.version++;save();if(k==='mode')render();
}
function addScoringArea(tableId,phaseId){
 const c=courseById(db.editing),ph=findEditorPhase(tableId,phaseId);if(!ph)return;
 ph.areas.push(newArea('Scoring Area '+(ph.areas.length+1)));c.version++;save();render();
}
function removeScoringArea(tableId,phaseId,areaId){
 const c=courseById(db.editing),ph=findEditorPhase(tableId,phaseId);if(!ph)return;
 if(ph.areas.length<2)return alert('Keep at least one scoring area.');
 ph.areas=ph.areas.filter(a=>a.id!==areaId);
 ph.areas.forEach(a=>a.sources=(a.sources||[]).filter(id=>id!==areaId));
 c.version++;save();render();
}
function setScoringAreaCount(tableId,phaseId,areaId,checked){
 const c=courseById(db.editing),a=findEditorPhase(tableId,phaseId)?.areas.find(a=>a.id===areaId);
 if(a){a.countScore=checked;c.version++;save()}
}
function setScoringSource(tableId,phaseId,areaId,sourceId,checked){
 const c=courseById(db.editing),a=findEditorPhase(tableId,phaseId)?.areas.find(a=>a.id===areaId);
 if(a){a.sources=checked?[...new Set([...(a.sources||[]),sourceId])]:(a.sources||[]).filter(id=>id!==sourceId);c.version++;save()}
}
function updateTableRule(id,k,v){const c=courseById(db.editing),t=c?.phases.find(x=>x.id===id);if(!t)return;t[k]=v===''?'':n(v);c.version++;save()}
function editForm(){
 const c=courseById(db.editing);if(!c)return editor();
 return `<div class="rt-config-view rt-template-edit">
 <section class="rt-config-hero"><div class="rt-config-hero-top"><span class="rt-eyebrow">RANGETRACK · COURSE EDITOR</span><span class="rt-config-tag">EDIT TEMPLATE</span></div><h2>Edit <span>Course</span></h2><p>${safe(c.name)} · ${c.phases.length} firing ${c.phases.length===1?'table':'tables'}. Edits save automatically; active classes keep their existing course configuration.</p></section>
 <section class="panel rt-config-edit-panel"><div class="row between"><h2>Course Settings</h2><button type="button" class="rt-config-secondary" onclick="tab('editor')">Done ✓</button></div>
 <label>Course name<input value="${attr(c.name)}" onchange="updateTemplate('name',this.value)"></label>
 <p class="muted">Available for these weapons:</p><div class="grid">${WEAPONS.map((w,i)=>`<label class="row" style="display:flex"><input type="checkbox" style="width:20px" ${c.weapons.includes(w)?'checked':''} onchange="toggleWeapon(WEAPONS[${i}],this.checked)">${safe(w)}</label>`).join('')}</div>
 <label>Default ammunition<input type="number" min="0" value="${c.defaultRounds||0}" onchange="updateTemplate('defaultRounds',this.value)"></label></section>
 ${c.phases.map(t=>`<section class="panel rt-config-edit-panel"><div class="row between"><h2>Firing Table: ${safe(t.name)}</h2><button onclick="removePhase('${t.id}')">Remove Table</button></div>
 <div class="grid"><label>Firing Table name<input value="${attr(t.name)}" onchange="updatePhase('${t.id}','name',this.value)"></label>
 <label>Rounds fired<input type="number" min="0" value="${attr(t.rounds)}" onchange="updatePhase('${t.id}','rounds',this.value)"></label>
 <label>Minimum qualifying hits (Table)<input type="number" min="0" placeholder="Optional" value="${attr(t.qualMin)}" onchange="updateTableRule('${t.id}','qualMin',this.value)"></label>
 <label>Minimum Expert qualifying hits (Table)<input type="number" min="0" placeholder="Optional" value="${attr(t.expertTotal)}" onchange="updateTableRule('${t.id}','expertTotal',this.value)"></label></div>
 <p class="muted">Score the target once after the entire Table. Qualifying Hits counts checked manual areas; Total Hits on Paper counts all manual areas. Do not create overlapping manual areas.</p>
 <h3>Editable Scoreable Areas</h3>
 ${t.areas.map(a=>`<div class="areaedit"><div class="row between"><strong>${safe(a.name)}</strong><button onclick="removeArea('${t.id}','${a.id}')">×</button></div>
 <div class="grid"><label>Scoreable area name<input value="${attr(a.name)}" onchange="editArea('${t.id}','${a.id}','name',this.value)"></label>
 <label>Entry type<select onchange="editArea('${t.id}','${a.id}','mode',this.value)"><option value="manual" ${a.mode!=='sum'?'selected':''}>Manual hits</option><option value="sum" ${a.mode==='sum'?'selected':''}>Calculated Total</option></select></label>
 <label>Minimum qualifying hits (area)<input type="number" min="0" placeholder="Optional" value="${attr(a.qual)}" onchange="editArea('${t.id}','${a.id}','qual',this.value)"></label>
 <label>Minimum Expert hits (area)<input type="number" min="0" placeholder="Optional" value="${attr(a.expert)}" onchange="editArea('${t.id}','${a.id}','expert',this.value)"></label></div>
 ${a.mode!=='sum'?`<label class="row" style="display:flex;margin-top:10px"><input type="checkbox" style="width:20px" ${a.countScore?'checked':''} onchange="toggleAreaCount('${t.id}','${a.id}','countScore',this.checked)"> Include in Qualifying Hits</label>`:
 `<p class="muted">Add these manual areas:</p>${t.areas.filter(x=>x.id!==a.id&&x.mode!=='sum').map(x=>`<label class="row" style="display:flex"><input type="checkbox" style="width:20px" ${(a.sources||[]).includes(x.id)?'checked':''} onchange="toggleSource('${t.id}','${a.id}','${x.id}',this.checked)">${safe(x.name)}</label>`).join('')}`}
 </div>`).join('')}
 <button onclick="addArea('${t.id}')">+ Add Scoreable Area</button></section>`).join('')}
 <section class="panel rt-config-edit-panel rt-config-edit-footer"><button class="primary" onclick="addPhase()">+ Add Table</button><p><button onclick="tab('editor')">Save and return to library</button></p><p class="muted">Saved automatically. Existing class sessions keep their original course snapshot.</p></section></div>`;
}
function exportLibrary(){const blob=new Blob([JSON.stringify({type:'catm-course-library',version:1,courses:db.courses},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='catm-course-library.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
async function importLibrary(file){if(!file)return;try{const obj=JSON.parse(await file.text());if(obj.type!=='catm-course-library'||!Array.isArray(obj.courses)||!obj.courses.every(c=>typeof c.id==='string'&&typeof c.name==='string'&&Array.isArray(c.weapons)&&Array.isArray(c.phases)&&c.phases.length))throw Error('Not a valid CATM course library');if(!confirm('Replace all saved course templates with this backup? Existing class scores will remain unchanged.'))return;db.courses=obj.courses.map(normalizeCourse);db.course='';save();render();alert('Templates imported successfully.')}catch(e){alert('Import failed: '+e.message)}}

function deleteSession(key){
 const s=db.sessions[key];if(!s)return;
 const label=(s.template?.name||'Saved class')+' ('+key.split('|')[0]+')';
 if(!confirm('Delete saved class: '+label+'?\n\nThis permanently deletes all shooters, scores, refires, and ammunition for this class. The reusable course template and other saved classes will not be affected.'))return;
 if(prompt('Type DELETE to permanently remove this saved class:')!=='DELETE')return;
 delete db.sessions[key];
 if(sessionKey()===key){db.course='';}
 db.view='active';save();render();
}
function completeCourse(){
 const key=sessionKey(),session=current();
 if(!session)return alert('No active class is open.');
 const name=session.template?.name||selectedCourse()?.name||'Course';
 if(!confirm('Complete and remove this class?\\n\\n'+name+' ('+db.weapon+')\\n'+session.shooters.length+' shooter(s)\\n\\nThis permanently deletes the saved class, including all scores, shooters, refires and ammunition records. Course templates and other classes are preserved.'))return;
 delete db.sessions[key];
 db.weapon='';db.course='';db.view='home';
 save();render();
}
function resume(key){const i=key.indexOf('|');db.weapon=key.slice(0,i);db.course=key.slice(i+1);openCourse()}
