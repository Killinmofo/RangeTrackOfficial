'use strict';
function dashboard(){
 const activeCount=Object.keys(db.sessions).length;
 const selected=selectedCourse();
 const weaponOpen=dashboardSection==='weapon',courseOpen=dashboardSection==='course';
 return `<div class="rt-dashboard-view">
  <section class="rt-dashboard-hero">
   <div class="rt-dashboard-hero-top"><span class="rt-eyebrow">RANGETRACK · CLASS OPERATIONS</span><span class="rt-dashboard-live"><i></i>READY</span></div>
   <h2>Range <span>Dashboard</span></h2>
   <p>Manage weapons, qualification courses, and active training sessions from one place.</p>
   <div class="rt-dashboard-hero-foot"><span>QUALIFICATION SYSTEM</span><strong>${activeCount} ACTIVE ${activeCount===1?'CLASS':'CLASSES'}</strong></div>
  </section>
  <section class="rt-dashboard-active-overview" aria-label="Active classes overview">
   <div class="rt-dashboard-active-count"><strong>${activeCount}</strong><small>ACTIVE ${activeCount===1?'CLASS':'CLASSES'}</small></div>
   <div class="rt-dashboard-active-courses"><span>ACTIVE COURSE${activeCount===1?'':'S'}</span>
    ${activeCount?Object.entries(db.sessions).map(([key,session],index)=>{
      const courseName=session.template?.name||courseById(key.split('|')[1])?.name||'Unnamed Course';
      const weaponName=key.split('|')[0]||'';
      return `<button type="button" class="rt-dashboard-active-course" onclick="rtDashboardOpenActive(${index})" aria-label="Open ${safe(courseName)}"><strong>${safe(courseName)}</strong>${weaponName?`<small>${safe(weaponName)}</small>`:''}<span class="rt-dashboard-active-arrow" aria-hidden="true">›</span></button>`;
    }).join(''):'<p>No active courses</p>'}
   </div>
  </section>
  <section class="rt-dashboard-shell">
   <header class="rt-dashboard-section-heading"><span class="rt-eyebrow">01 / CLASS SETUP</span><h3>Start or Continue Training</h3></header>
   <button type="button" class="rt-dashboard-card ${weaponOpen?'rt-dashboard-card-open':''}" onclick="toggleDashboardSection('weapon')" aria-expanded="${weaponOpen}">
    <span class="rt-dashboard-card-icon">◎</span><span class="rt-dashboard-card-copy"><strong>Select Weapon System</strong><small>${db.weapon?'Selected: '+safe(db.weapon):'Choose the weapon being used for qualification'}</small></span><span class="rt-dashboard-card-chevron">${weaponOpen?'⌄':'›'}</span>
   </button>
   ${weaponOpen?`<div class="rt-dashboard-expand">
     <h4>Weapon Systems</h4>
     <div class="rt-dashboard-choices">${WEAPONS.map((w,i)=>`<button type="button" class="${db.weapon===w?'rt-dashboard-selected':''}" onclick="chooseWeapon(WEAPONS[${i}])">${safe(w)}</button>`).join('')||'<p class="rt-dashboard-help">No weapon systems configured.</p>'}</div>
    </div>`:''}
   <button type="button" class="rt-dashboard-card ${courseOpen?'rt-dashboard-card-open':''}" onclick="toggleDashboardSection('course')" aria-expanded="${courseOpen}">
    <span class="rt-dashboard-card-icon">▤</span><span class="rt-dashboard-card-copy"><strong>Select Course</strong><small>${selected?'Selected: '+safe(selected.name):'Choose the course and open the class'}</small></span><span class="rt-dashboard-card-chevron">${courseOpen?'⌄':'›'}</span>
   </button>
   ${courseOpen?`<div class="rt-dashboard-expand">
     <h4>${db.weapon?safe(db.weapon)+' Courses':'Select a Weapon First'}</h4>
     ${db.weapon?`<div class="rt-dashboard-choices rt-dashboard-course-choices">${availableCourses(db.weapon).map(c=>`<button type="button" class="${db.course===c.id?'rt-dashboard-selected':''}" onclick="chooseCourse('${safe(c.id)}')">${safe(c.name)}</button>`).join('')||'<p class="rt-dashboard-help">No courses assigned. Use Course Editor to assign one.</p>'}</div>
     ${selected?`<div class="rt-dashboard-selection"><p>${safe(selected.notes||'Ready to begin qualification.')}</p><button type="button" class="rt-dashboard-start" onclick="openCourse()">${db.sessions[sessionKey()]?'Continue':'Start'} ${safe(selected.name)} <span>›</span></button></div>`:''}`:'<p class="rt-dashboard-help">Select a weapon system above to see its available courses.</p>'}
    </div>`:''}
  </section>
  <section class="rt-dashboard-shell">
   <header class="rt-dashboard-section-heading"><span class="rt-eyebrow">02 / COURSE MANAGEMENT</span><h3>Course Management</h3></header>
   <button type="button" class="rt-dashboard-card" onclick="tab('editor')"><span class="rt-dashboard-card-icon">⚙</span><span class="rt-dashboard-card-copy"><strong>Course Editor</strong><small>Create and edit reusable qualification courses</small></span><span class="rt-dashboard-card-chevron">›</span></button>
   <button type="button" class="rt-dashboard-card" onclick="tab('weapons')"><span class="rt-dashboard-card-icon">✎</span><span class="rt-dashboard-card-copy"><strong>Manage Weapon Systems</strong><small>Add or remove available weapon systems</small></span><span class="rt-dashboard-card-chevron">›</span></button>
  </section>
 </div>`;
}
function rtDashboardOpenActive(index){
 const key=Object.keys(db.sessions)[index];
 if(key&&db.sessions[key])resume(key);
}
let dashboardSection='';
function toggleDashboardSection(section){dashboardSection=dashboardSection===section?'':section;render()}

function activeCourses(){return `<section class="panel"><div class="row between"><h2>Active Courses</h2><button onclick="home()">⌂ Dashboard</button></div><p class="muted">Manage saved class sessions. Deleting a class does not delete its course template.</p>${Object.entries(db.sessions).length?Object.entries(db.sessions).map(([k,s])=>`<div class="entry row between"><span><strong>${safe(k.split('|')[0])} • ${safe(s.template?.name||courseById(k.split('|')[1])?.name||'Legacy course')}</strong><div class="muted">${s.shooters.length} shooter(s) • ${safe(s.date||'Date not set')}</div></span><div class="row"><button class="primary" onclick="resume('${safe(k)}')">Open</button><button class="danger" onclick="deleteSession('${safe(k)}')" aria-label="Delete saved class">Delete</button></div></div>`).join(''):'<p class="muted">No active courses yet. Start a course from the dashboard.</p>'}</section>`}

function manageWeapons(){
 const used=w=>Object.entries(db.sessions).filter(([k])=>k.startsWith(w+'|')).length;
 return `<div class="rt-config-view rt-weapons-view">
  <section class="rt-config-hero">
   <div class="rt-config-hero-top"><span class="rt-eyebrow">RANGETRACK · COURSE MANAGEMENT</span><span class="rt-config-tag">WEAPONS</span></div>
   <h2>Weapon <span>Systems</span></h2>
   <p>Manage the weapons available for qualification courses at this location.</p>
   <div class="rt-config-hero-foot"><span>${WEAPONS.length} AVAILABLE ${WEAPONS.length===1?'SYSTEM':'SYSTEMS'}</span><strong>LOCAL CONFIGURATION</strong></div>
  </section>
  <section class="rt-config-shell">
   <header class="rt-config-heading"><div><span class="rt-eyebrow">SYSTEM INVENTORY</span><h3>Available Weapon Systems</h3></div></header>
   <div class="rt-config-list">
    ${WEAPONS.map((w,i)=>`<div class="rt-config-row rt-weapon-row"><div class="rt-config-weapon-icon" aria-hidden="true">◎</div><div class="rt-config-row-main"><strong>${safe(w)}</strong><small>${db.courses.filter(c=>c.weapons.includes(w)).length} assigned ${db.courses.filter(c=>c.weapons.includes(w)).length===1?'template':'templates'} · ${used(w)} active ${used(w)===1?'class':'classes'}</small></div><button type="button" class="rt-config-danger" onclick="removeWeapon(${i})">Remove</button></div>`).join('')||'<p class="rt-config-empty">No weapon systems configured.</p>'}
   </div>
   <div class="rt-config-note">Removing a weapon hides it from selection and the Course Editor. Saved classes and course templates are preserved.</div>
  </section>
  <section class="rt-config-shell">
   <header class="rt-config-heading"><div><span class="rt-eyebrow">ADD A SYSTEM</span><h3>Add Weapon System</h3></div></header>
   <div class="rt-config-content"><label>Weapon Name<input id="newWeaponName" maxlength="70" placeholder="e.g., M249"></label><button type="button" class="rt-config-primary rt-config-add-weapon" onclick="addWeapon()">+ Add Weapon System</button><p>Once added, assign the weapon to courses in the Course Editor.</p></div>
  </section>
  <button type="button" class="rt-config-back" onclick="home()">‹ Back to Dashboard</button>
 </div>`;
}
function addWeapon(){
 const el=document.getElementById('newWeaponName');const name=el?.value.trim().replace(/\s+/g,' ');
 if(!name)return alert('Enter a weapon system name.');
 if(WEAPONS.some(w=>w.toLowerCase()===name.toLowerCase()))return alert('That weapon system already exists.');
 WEAPONS.push(name);save();render();
}
function removeWeapon(i){
 const name=WEAPONS[i];if(!name)return;
 const saved=Object.keys(db.sessions).filter(k=>k.startsWith(name+'|')).length;
 if(!confirm('Remove '+name+' from this location?'+(saved?'\n\n'+saved+' saved class(es) will be preserved under Active Courses.':'')+'\n\nCourse templates and scoring data will NOT be deleted.'))return;
 WEAPONS.splice(i,1);
 if(db.weapon===name){db.weapon='';db.course='';dashboardSection='';}
 save();render();
}

