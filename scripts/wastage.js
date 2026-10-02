(() => {
 const $=id=>document.getElementById(id), key='warren-wastage-v1';
 const inputs=[...document.querySelectorAll('.waste-count')];
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let reports={},baseline='',current=today(),dirty=false,blocked=false;
 try {baseline=localStorage.getItem(key)||'';reports=baseline?JSON.parse(baseline):{};
  if(!reports||Array.isArray(reports)||typeof reports!=='object'||Object.values(reports).some(r=>!r||!Array.isArray(r.counts)||r.counts.length!==15||r.counts.some(n=>n!==null&&(!Number.isInteger(n)||n<0||n>999999))||typeof r.reporter!=='string'||typeof r.notes!=='string'))throw Error();
  // User-confirmed zero wastage for 1 October. Apply once; retain later edits.
  const confirmedDate='2026-10-01', revision='2026-10-01-zero-wastage-1';
  if(reports[confirmedDate]?.confirmedRevision!==revision){
   reports={...reports,[confirmedDate]:{...reports[confirmedDate],counts:inputs.map(()=>0),reporter:reports[confirmedDate]?.reporter||'',notes:reports[confirmedDate]?.notes||'Confirmed no wastage.',savedAt:new Date().toISOString(),confirmedRevision:revision}};
   const serialized=JSON.stringify(reports);localStorage.setItem(key,serialized);baseline=serialized;
  }
 }catch{blocked=true;$('save-wastage').disabled=true;}
 function summary(){const values=inputs.filter(i=>i.value!==''&&i.validity.valid).map(i=>Number(i.value));$('waste-total').textContent=values.length?values.reduce((a,b)=>a+b,0).toLocaleString():'—';$('waste-counted').textContent=`${values.length} / 15`;}
 function load(date){current=date;$('waste-date').value=date;const report=reports[date];inputs.forEach((input,i)=>input.value=report?.counts[i]??'');$('reported-by').value=report?.reporter||'';$('waste-notes').value=report?.notes||'';dirty=false;summary();week();$('waste-state').textContent=report?(report.counts.every(n=>n!==null)?'Complete':'Draft'):'Not recorded';$('waste-status').textContent=blocked?'Storage unavailable. Saving is disabled to protect your data.':report?`Saved report for ${date}.`:'No report saved for this date.';}
 let displayedWeek;
 function week(date=current){
  const result=WastageWeek.summarize(date,reports);displayedWeek=result.start;
  const format=date=>new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  $('waste-week-range').textContent=`${format(result.start)} – ${format(result.end)}`;
  $('waste-week-summary').textContent=blocked?'Saved reports unavailable.':`${result.total===null?'No quantities recorded':result.total.toLocaleString()+' pastries recorded'} · ${result.complete} / 7 complete daily reports. Totals include saved drafts; missing quantities are not counted.`;
  $('waste-week-days').replaceChildren();
  const chart=$('waste-chart-bars');chart.replaceChildren();
  const maximum=Math.max(1,...result.days.map(day=>blocked?0:day.total??0));
  $('waste-chart-scale').textContent=blocked?'Reports unavailable':`Wasted pastries · scale 0–${maximum.toLocaleString()}`;
  result.days.forEach((day,index)=>{
   const total=blocked?null:day.total;
   const button=document.createElement('button');button.type='button';button.className='waste-chart-day';
   button.disabled=day.date>today()||blocked;
   button.setAttribute('aria-label',`${format(day.date)}: ${total===null?'no recorded quantity':total+' wasted pastries'}, ${blocked?'unavailable':day.state}`);
   button.title=button.getAttribute('aria-label');button.addEventListener('click',()=>select(day.date));
   const value=document.createElement('span');value.className='chart-value';value.textContent=total===null?'—':total.toLocaleString();
   const track=document.createElement('span');track.className='chart-track';track.setAttribute('aria-hidden','true');
   if(total!==null){const bar=document.createElement('span');bar.className='chart-bar'+(day.state==='Draft'?' draft':'')+(total===0?' zero':'');bar.style.height=`${total/maximum*100}%`;track.append(bar);}
   const label=document.createElement('span');label.textContent=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index];
   const state=document.createElement('small');state.textContent=blocked?'Unavailable':day.date>today()?'Upcoming':day.state;
   button.append(value,track,label,state);chart.append(button);
  });
  result.days.forEach(day=>{
   const row=document.createElement('tr');
   const heading=document.createElement('th');heading.scope='row';
   const button=document.createElement('button');button.type='button';button.className='button secondary';button.textContent=format(day.date);button.disabled=day.date>today();button.addEventListener('click',()=>select(day.date));heading.append(button);
   const state=document.createElement('td');state.textContent=blocked?'Unavailable':day.state;
   const total=document.createElement('td');total.textContent=blocked?'—':day.total?.toLocaleString()??'—';
   row.append(heading,state,total);$('waste-week-days').append(row);
  });
  $('waste-next-week').disabled=false;
 }
 function changed(){dirty=true;summary();$('waste-state').textContent='Unsaved';$('waste-status').textContent='Unsaved changes. Select Save report to keep them.';}
 inputs.forEach(i=>i.addEventListener('input',changed));$('reported-by').addEventListener('input',changed);$('waste-notes').addEventListener('input',changed);
 function select(date){if(!date||date>today()){ $('waste-date').value=current;return;}if(dirty&&!confirm('Discard unsaved changes and switch date?')){$('waste-date').value=current;return;}load(date);}
 $('waste-date').max=today();$('waste-date').addEventListener('change',()=>select($('waste-date').value));$('waste-today').addEventListener('click',()=>{$('waste-date').max=today();select(today());});
 $('fill-zero').addEventListener('click',()=>{inputs.filter(i=>i.value===''&&!i.validity.badInput).forEach(i=>i.value='0');changed();});
 $('waste-form').addEventListener('submit',event=>{event.preventDefault();if(blocked)return;
 try{if((localStorage.getItem(key)||'')!==baseline){$('waste-status').textContent='Another tab changed the reports. Reload before saving; your edits have not been saved.';return;}
 const record={...reports[current],counts:inputs.map(i=>i.value===''?null:Number(i.value)),reporter:$('reported-by').value.trim(),notes:$('waste-notes').value.trim(),savedAt:new Date().toISOString()};
 const next={...reports,[current]:record},serialized=JSON.stringify(next);localStorage.setItem(key,serialized);reports=next;baseline=serialized;load(current);$('waste-status').textContent=record.counts.every(n=>n!==null)?`Complete report saved for ${current}.`:`Draft saved for ${current}. Fill the remaining quantities to complete the report.`;
 }catch{$('waste-status').textContent='Could not save. Your edits are still here; check browser storage and try again.';}});
 $('waste-yesterday').addEventListener('click',()=>select(WastageWeek.offset(today(),-1)));
 $('waste-prev-week').addEventListener('click',()=>week(WastageWeek.offset(displayedWeek,-7)));
 $('waste-next-week').addEventListener('click',()=>week(WastageWeek.offset(displayedWeek,7)));
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});load(current);
})();
