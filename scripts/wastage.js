(() => {
 const $=id=>document.getElementById(id), key='warren-wastage-v1';
 const inputs=[...document.querySelectorAll('.waste-count')];
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let reports={},baseline='',current=today(),dirty=false,blocked=false;
 try {baseline=localStorage.getItem(key)||'';reports=baseline?JSON.parse(baseline):{};
  if(!reports||Array.isArray(reports)||typeof reports!=='object'||Object.values(reports).some(r=>!r||!Array.isArray(r.counts)||r.counts.length!==15||r.counts.some(n=>n!==null&&(!Number.isInteger(n)||n<0||n>999999))||typeof r.reporter!=='string'||typeof r.notes!=='string'))throw Error();
 }catch{blocked=true;$('save-wastage').disabled=true;}
 function summary(){const values=inputs.filter(i=>i.value!==''&&i.validity.valid).map(i=>Number(i.value));$('waste-total').textContent=values.length?values.reduce((a,b)=>a+b,0).toLocaleString():'—';$('waste-counted').textContent=`${values.length} / 15`;}
 function load(date){current=date;$('waste-date').value=date;const report=reports[date];inputs.forEach((input,i)=>input.value=report?.counts[i]??'');$('reported-by').value=report?.reporter||'';$('waste-notes').value=report?.notes||'';dirty=false;summary();$('waste-state').textContent=report?(report.counts.every(n=>n!==null)?'Complete':'Draft'):'Not recorded';$('waste-status').textContent=blocked?'Storage unavailable. Saving is disabled to protect your data.':report?`Saved report for ${date}.`:'No report saved for this date.';}
 function changed(){dirty=true;summary();$('waste-state').textContent='Unsaved';$('waste-status').textContent='Unsaved changes. Select Save report to keep them.';}
 inputs.forEach(i=>i.addEventListener('input',changed));$('reported-by').addEventListener('input',changed);$('waste-notes').addEventListener('input',changed);
 function select(date){if(!date||date>today()){ $('waste-date').value=current;return;}if(dirty&&!confirm('Discard unsaved changes and switch date?')){$('waste-date').value=current;return;}load(date);}
 $('waste-date').max=today();$('waste-date').addEventListener('change',()=>select($('waste-date').value));$('waste-today').addEventListener('click',()=>{$('waste-date').max=today();select(today());});
 $('fill-zero').addEventListener('click',()=>{inputs.filter(i=>i.value===''&&!i.validity.badInput).forEach(i=>i.value='0');changed();});
 $('waste-form').addEventListener('submit',event=>{event.preventDefault();if(blocked)return;
 try{if((localStorage.getItem(key)||'')!==baseline){$('waste-status').textContent='Another tab changed the reports. Reload before saving; your edits have not been saved.';return;}
 const record={counts:inputs.map(i=>i.value===''?null:Number(i.value)),reporter:$('reported-by').value.trim(),notes:$('waste-notes').value.trim(),savedAt:new Date().toISOString()};
 const next={...reports,[current]:record},serialized=JSON.stringify(next);localStorage.setItem(key,serialized);reports=next;baseline=serialized;load(current);$('waste-status').textContent=record.counts.every(n=>n!==null)?`Complete report saved for ${current}.`:`Draft saved for ${current}. Fill the remaining quantities to complete the report.`;
 }catch{$('waste-status').textContent='Could not save. Your edits are still here; check browser storage and try again.';}});
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});load(current);
})();
