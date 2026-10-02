(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const key = 'warren-stock-v1';
  const rows = [...document.querySelectorAll('.inventory-panel tbody tr')];
  const names = rows.map(row => row.querySelector('th').textContent.trim());
  const inputs = rows.map((row, i) => {
    const input = row.querySelector('.stock-input');
    input.setAttribute('aria-label', names[i] + ' stock count');
    return input;
  });
  const londonDate = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const dayBefore = date => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-1); return d.toISOString().slice(0,10); };
  let records = {}, dirty = false, current = londonDate(), baseline = '', blocked = false;
  const validCount = value => value === null || (Number.isInteger(value) && value >= 0 && value <= 999999);
  function read() {
    baseline = localStorage.getItem(key) || '';
    const data = baseline ? JSON.parse(baseline) : {};
    if (!data || Array.isArray(data) || typeof data !== 'object' || Object.entries(data).some(([date, record]) => !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(record.counts) || record.counts.length !== names.length || !record.counts.every(validCount))) throw Error('Invalid saved stock');
    records = data;
    const confirmed = window.CONFIRMED_STOCK;
    if (confirmed && records[confirmed.date]?.confirmedRevision !== confirmed.revision) {
      const counts = names.map(name => confirmed.quantities[name]);
      if (!counts.every(value => Number.isInteger(value) && validCount(value))) throw Error('Invalid confirmed stock');
      records[confirmed.date] = {
        counts,
        savedAt: new Date().toISOString(),
        inheritedFrom: null,
        afterProoferDeduction: confirmed.afterProoferDeduction,
        confirmedRevision: confirmed.revision
      };
      const updated = JSON.stringify(records);
      localStorage.setItem(key, updated);
      baseline = updated;
    }
  }
  function applyDue() {
    const result = ProoferSchedule.catchUp(records, names, new Date(), window.CONFIRMED_DELIVERIES || []);
    if (result.changed) {
      if ((localStorage.getItem(key) || '') !== baseline) throw Error('Stock changed in another tab');
      const serialized = JSON.stringify(result.records);
      localStorage.setItem(key, serialized); records = result.records; baseline = serialized;
    }
  }
  try { read(); applyDue(); } catch { blocked = true; $('save-status').textContent = 'Saved stock could not be read. Saving is disabled to protect existing data. Check browser storage access.'; $('save-stock').disabled = true; }
  function summary() {
    const values = inputs.filter(input => input.value !== '' && input.validity.valid).map(input => Number(input.value));
    $('counted-total').textContent = `${values.length} / ${names.length}`;
    $('stock-total').textContent = values.length ? values.reduce((a,b)=>a+b,0).toLocaleString() : '—';
    rows.forEach((row,i) => { const badge=row.querySelector('.badge'); badge.textContent=inputs[i].value === '' ? 'Awaiting count' : 'Count entered'; badge.className='badge ' + (inputs[i].value === '' ? 'pending' : 'blue'); });
  }
  function previous() {
    const counts = records[dayBefore(current)]?.counts;
    rows.forEach((row,i) => row.querySelector('.previous-count').textContent = counts?.[i] ?? '—');
  }
  function load(date) {
    current = date;
    $('stock-date').value = date;
    const formatDate = value => new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value + 'T12:00:00Z'));
    $('previous-column-date').textContent = formatDate(dayBefore(date));
    $('previous-column-date').dateTime = dayBefore(date);
    $('current-column-date').textContent = formatDate(date);
    $('current-column-date').dateTime = date;
    $('current-column-label').textContent = date === londonDate() ? "Today's stock" : 'Selected day’s stock';
    const prior = Object.keys(records).filter(d=>d<date).sort().at(-1);
    const source = records[date] ? date : prior;
    const values = source ? records[source].counts : [];
    inputs.forEach((input,i) => input.value = values[i] ?? '');
    $('inherited-date').textContent = records[date] ? (records[date].inheritedFrom || 'Saved count') : (prior || 'No saved count');
    $('save-status').textContent = blocked ? 'Storage unavailable. Saving is disabled.' : records[date] ? `Saved stock for ${date}.${records[date].afterProoferDeduction ? ' Already counted after proofer preparation; no further deduction for this date.' : ''}` : prior ? `Starting with stock saved on ${prior}. Save to record it for ${date}.` : `No earlier saved stock. Enter your first counts for ${date}.`;
    const prep = ProoferSchedule.plan(date, names);
    const shortages = records[date]?.shortages || [];
    $('proofer-status').textContent = records[date]?.automaticDeduction
      ? `10 AM preparation recorded for ${prep.bakingDate} (${prep.type.toLowerCase()}).` + (shortages.length ? ' Short stock: ' + shortages.map(s=>`${s.name}: ${s.missing} short`).join('; ') + '. Check your actual counts.' : '')
      : records[date]?.afterProoferDeduction ? 'This stock is already after proofer preparation. No further deduction for this date.'
      : `At 10 AM London time: ${prep.type.toLowerCase()} quantities for the bake on ${prep.bakingDate}.`;
    dirty = false; previous(); summary(); clearReview();
  }
  inputs.forEach(input=>input.addEventListener('input',()=>{ dirty=true; summary(); $('save-status').textContent='Unsaved changes — select Save changes to keep your counts.'; }));
  function changeDate(date) {
    if(!date || date > londonDate()) { $('stock-date').value=current; return; }
    if(dirty && !confirm('Discard unsaved changes and switch date?')) { $('stock-date').value=current; return; }
    load(date);
  }
  $('stock-date').max=londonDate();
  $('stock-date').addEventListener('change',()=>changeDate($('stock-date').value));
  $('go-today').addEventListener('click',()=>{ $('stock-date').max=londonDate(); changeDate(londonDate()); });
  $('save-stock').addEventListener('click',()=>{
    if(blocked) return;
    const invalid=inputs.find(input=>!input.checkValidity());
    if(invalid) { invalid.closest('tr').hidden=false; invalid.reportValidity(); $('save-status').textContent='Use whole numbers from 0 to 999999, or leave a count empty.'; return; }
    try {
      if((localStorage.getItem(key)||'') !== baseline) { $('save-status').textContent='Stock changed in another tab. Reload this page before saving; your current edits have not been saved.'; return; }
      const next={...records,[current]:{...records[current],afterProoferDeduction:true,automaticDeduction:false,shortages:[],counts:inputs.map(input=>input.value===''?null:Number(input.value)),savedAt:new Date().toISOString(),inheritedFrom:records[current]?.inheritedFrom || Object.keys(records).filter(d=>d<current).sort().at(-1) || null}};
      const serialized=JSON.stringify(next); localStorage.setItem(key,serialized); records=next; baseline=serialized; dirty=false;
      $('save-status').textContent=`Saved stock for ${current} on this device.`; previous();
    } catch { $('save-status').textContent='Could not save. Your edits are still here. Check available browser storage and try again.'; }
  });
  window.addEventListener('beforeunload',event=>{ if(dirty) { event.preventDefault(); event.returnValue=''; } });
  let matches=[], scanBusy=false;
  const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
  function clearReview() { matches=[]; $('scan-review').hidden=true; $('apply-scan').disabled=true; $('scan-matches').replaceChildren(); }
  function matchText() {
    matches=[]; $('scan-matches').replaceChildren();
    const result = StockOrderParser.parseOrder($('scan-text').value, names);
    matches = result.matches;
    const note=document.createElement('p'); note.textContent=`${matches.length} matched. Qty is multiplied by 25. Review final pastry counts before applying to ${current}.`; $('scan-matches').append(note);
    if (result.skipped.length) {
      const details=document.createElement('details');
      const title=document.createElement('summary'); title.textContent=`${result.skipped.length} unmatched or unclear lines (not applied)`; details.append(title);
      result.skipped.forEach(item=>{ const line=document.createElement('p'); line.textContent=item.source + ' ? ' + item.reason; details.append(line); });
      $('scan-matches').append(details);
    }
    matches.forEach(match=>{
      const label=document.createElement('label'); label.className='scan-match';
      const checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.checked=true;
      const name=document.createElement('span'); name.textContent=names[match.i] + ` ? Qty ${match.packs} ? 25 = ${match.value} pastries`;
      const value=document.createElement('input'); value.type='number'; value.min=0; value.max=999999; value.step=1; value.value=match.value; value.setAttribute('aria-label',names[match.i]+' final pastry count');
      match.checkbox=checkbox; match.input=value; label.append(checkbox,name,value); $('scan-matches').append(label);
    });
    $('apply-scan').disabled=!matches.length;
  }
  $('match-scan').addEventListener('click',matchText);
  $('scan-text').addEventListener('input',()=>{ $('apply-scan').disabled=true; $('scan-matches').replaceChildren(); matches=[]; });
  $('scan-file').addEventListener('change',()=>{ clearReview(); $('scan-status').textContent=''; });
  $('apply-scan').addEventListener('click',()=>{
    const selected=matches.filter(match=>match.checkbox.checked);
    if(!selected.length) { $('scan-status').textContent='Select at least one detected count.'; return; }
    for(const match of selected) if(match.input.value==='' || !match.input.checkValidity()) { match.input.reportValidity(); return; }
    selected.forEach(match=>inputs[match.i].value=match.input.value);
    dirty=true; summary(); clearReview(); $('scan-status').textContent=`Applied ${selected.length} counts to ${current}. Select Save changes to keep them.`; $('save-status').textContent='Scanned counts applied. Changes are not saved yet.';
  });
  let library;
  function loadOCR() {
    if(window.Tesseract) return Promise.resolve(window.Tesseract);
    if(!library) library=new Promise((resolve,reject)=>{
      const script=document.createElement('script'); script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
      script.onload=()=>resolve(window.Tesseract); script.onerror=()=>{library=null;script.remove();reject(Error('OCR download failed'));}; document.head.append(script);
    });
    return library;
  }
  $('scan-image').addEventListener('click',async()=>{
    const file=$('scan-file').files[0];
    if(!file || !['image/png','image/jpeg','image/webp','image/bmp'].includes(file.type) || file.size>15*1024*1024) { $('scan-status').textContent='Choose a PNG, JPG, WebP or BMP image under 15 MB.'; return; }
    if(scanBusy) return;
    scanBusy=true; clearReview(); $('scan-image').disabled=true; $('scan-file').disabled=true; $('stock-date').disabled=true; $('go-today').disabled=true;
    $('scan-status').textContent='Loading scanner. The first scan needs an internet connection.';
    let worker;
    try {
      const OCR=await loadOCR();
      worker=await OCR.createWorker('eng',1,{logger:message=>{ $('scan-status').textContent=`Scanning: ${message.status}${typeof message.progress==='number'?' '+Math.round(message.progress*100)+'%':''}`; }});
      const {data}=await worker.recognize(file);
      $('scan-text').value=data.text; $('scan-review').hidden=false; matchText();
      $('scan-status').textContent='Scan complete. Review the matches below. Unclear names and numbers need correction; nothing has been saved.';
    } catch { $('scan-status').textContent='The image could not be scanned. Check your internet connection and try a clear, upright image. You can still enter counts manually.'; }
    finally { if(worker) await worker.terminate().catch(()=>{}); scanBusy=false; $('scan-image').disabled=false; $('scan-file').disabled=false; $('stock-date').disabled=false; $('go-today').disabled=false; }
  });
  names.forEach(name=>{
    const row=document.createElement('tr');
    [name,...ProoferSchedule.quantities[name]].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell);});
    $('proofer-quantities').append(row);
  });
  let lastToday=londonDate();
  function checkDue() {
    if(blocked || dirty || scanBusy || !$('scan-review').hidden) return;
    try {
      const wasToday=current===lastToday;
      const oldBaseline=baseline;
      read(); applyDue();
      const today=londonDate(); $('stock-date').max=today;
      if(oldBaseline!==baseline || today!==lastToday) load(wasToday?today:current);
      lastToday=today;
    } catch { $('proofer-status').textContent='Automatic preparation could not be saved. Check browser storage and reload.'; }
  }
  setInterval(checkDue,30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) checkDue();});
  load(current);
})();
