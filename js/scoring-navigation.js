'use strict';
let rtLastField = '';
function rtFields(){return [...document.querySelectorAll('.rt-score-view .rt-score-input:not(:disabled)')];}
function rtFieldKey(el){return el ? [el.dataset.shooter,el.dataset.attempt,el.dataset.area].join('|') : '';}
function rtVisibleScore(){
 const el=document.activeElement;
 if(!el?.matches?.('.rt-score-input'))return;
 const vp=window.visualViewport;
 const top=vp?vp.offsetTop:0, bottom=top+(vp?vp.height:window.innerHeight);
 const rect=el.getBoundingClientRect(), safeBottom=bottom-76;
 if(rect.bottom>safeBottom)window.scrollBy(0,rect.bottom-safeBottom+12);
 else if(rect.top<top+12)window.scrollBy(0,rect.top-top-24);
}
function rtKeyboardLayout(){
 const vp=window.visualViewport;
 const active=document.activeElement?.matches?.('.rt-score-input');
 const isOpen=Boolean(vp&&active&&vp.height<window.innerHeight-110);
 const inset=isOpen?Math.max(0,window.innerHeight-vp.height-vp.offsetTop):0;
 document.documentElement.style.setProperty('--rt-keyboard-inset',inset+'px');
 document.body.classList.toggle('rt-scoring-keyboard',isOpen);
 if(isOpen)rtVisibleScore();
}
// A text input with numeric keyboard supports selection ranges on iOS Safari.
function rtSelectScoreValue(el){
 if(!el || !el.value)return;
 try{el.select();}catch(error){console.warn('RangeTrack: score selection not supported',error);}
}
function rtFocusScore(el){
 if(!el)return;
 rtLastField=rtFieldKey(el);
 el.focus({preventScroll:true});
 rtSelectScoreValue(el);
 requestAnimationFrame(rtVisibleScore);
 setTimeout(rtVisibleScore,130);
 setTimeout(rtVisibleScore,390);
}
function rtUpdateNextScoreButton(){
 const btn=document.querySelector('.rt-next-btn');
 const back=document.querySelector('.rt-prev-btn');
 if(!btn&&!back)return;
 const fields=rtFields();
 const lastIndex=fields.length-1;
 const index=fields.findIndex(el=>rtFieldKey(el)===rtLastField);
 const atEnd=index===lastIndex;
 const complete=fields.length>0&&fields.every(el=>el.value!=='');
 const finalTable=scoreTableIndex>=tableList().length-1;
 const canAdvance=atEnd&&complete&&!finalTable;
 if(back){back.disabled=!fields.length;back.setAttribute('aria-label','Go to previous scoring field');}
 if(!btn)return;
 btn.disabled=!fields.length||(atEnd&&complete&&finalTable);
 const label=btn.querySelector('small');
 if(label)label.textContent=canAdvance?'Next Table':(atEnd&&complete&&finalTable?'Complete':'Next Field');
 btn.setAttribute('aria-label',canAdvance?'Go to next firing table':atEnd&&complete&&finalTable?'Scoring complete':'Go to next scoring field');
}
function rtPreviousScoreField(){
 const fields=rtFields();
 if(!fields.length)return;
 const currentIndex=fields.findIndex(el=>rtFieldKey(el)===rtLastField);
 // From no selection, start at the last visible scoring field.
 // At the first field, remain on the first field rather than silently switching tables.
 const previous=currentIndex===-1?fields[fields.length-1]:fields[Math.max(0,currentIndex-1)];
 rtFocusScore(previous);
 rtUpdateNextScoreButton();
}
function rtNextScoreField(){
 const fields=rtFields();if(!fields.length)return;
 const index=fields.findIndex(el=>rtFieldKey(el)===rtLastField);
 const lastIndex=fields.length-1;
 if(index<lastIndex){
  // Follow the displayed scoring order, including fields that already have scores.
  rtFocusScore(fields[index+1]);
 }else if(fields.every(el=>el.value!=='')&&scoreTableIndex<tableList().length-1){
  rtLastField='';
  changeScoringTable(1);
 }else if(index===lastIndex){
  // Keep the current table until all fields have been entered.
  rtFocusScore(fields[0]);
 }else{
  rtFocusScore(fields[0]);
 }
 rtUpdateNextScoreButton();
}
document.addEventListener('focusin',e=>{
 if(!e.target.matches?.('.rt-score-input'))return;
 rtLastField=rtFieldKey(e.target);rtSelectScoreValue(e.target);rtKeyboardLayout();
 requestAnimationFrame(rtVisibleScore);
 setTimeout(rtVisibleScore,130);
 setTimeout(rtVisibleScore,390);
});
document.addEventListener('input',e=>{if(e.target.matches?.('.rt-score-input'))rtUpdateNextScoreButton();});
document.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&e.target.matches?.('.rt-score-input')){e.preventDefault();rtNextScoreField();}
});
document.addEventListener('focusout',e=>{
 if(e.target.matches?.('.rt-score-input'))setTimeout(rtKeyboardLayout,100);
});
if(window.visualViewport){
 window.visualViewport.addEventListener('resize',rtKeyboardLayout);
 window.visualViewport.addEventListener('scroll',rtKeyboardLayout);
}
window.addEventListener('resize',rtKeyboardLayout);
