(() => {
 const $=id=>document.getElementById(id),list=$('order-document-list'),urls=[];
 let db;
 const shared=window.SharedOrders?.enabled;
 if(shared){
  $('order-login').hidden=false;$('save-order-pdf').textContent='Upload shared PDF';
  $('order-sharing-note').textContent='Uploaded PDFs are visible to everyone with access to this site. Uploading does not update stock or chart quantities.';
 }
 $('order-login').addEventListener('submit',async event=>{
  event.preventDefault();
  try{await SharedOrders.login($('order-email').value,$('order-password').value);$('order-login').hidden=true;$('order-logout').hidden=false;$('order-pdf-status').textContent='Signed in. You can upload if your account has uploader access.';}
  catch(error){$('order-pdf-status').textContent=error.message;}
  finally{$('order-password').value='';}
 });
 $('order-logout').addEventListener('click',async()=>{try{await SharedOrders.logout();}catch{}$('order-login').hidden=false;$('order-logout').hidden=true;$('order-pdf-status').textContent='Signed out.';});
 function row(date,name,url,local){
  const entry=document.createElement('p');entry.className='receiving-row';
  const label=document.createElement('span');label.textContent=`${date} · ${name}${local?' · This device only':''}`;
  const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener';link.textContent='Open PDF';
  entry.append(label,link);list.append(entry);
 }
 async function render(){
  urls.splice(0).forEach(url=>URL.revokeObjectURL(url));list.replaceChildren();
  (window.ADVANCE_ORDERS||[]).filter(o=>o.sourceFile).slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(o=>row(o.date,o.sourceFile,'Assets/orders/'+encodeURIComponent(o.sourceFile),false));
  if(shared){
   try{for(const doc of await SharedOrders.list())row(doc.delivery_date,doc.file_name,SharedOrders.url(doc.object_path),false);}
   catch(error){$('order-pdf-status').textContent=error.message;}
   return;
  }
  if(!db)return;
  const request=db.transaction('pdfs').objectStore('pdfs').getAll();
  request.onsuccess=()=>request.result.sort((a,b)=>a.date.localeCompare(b.date)).forEach(file=>{const url=URL.createObjectURL(file.blob);urls.push(url);row(file.date,file.name,url,true);});
  request.onerror=()=>{$('order-pdf-status').textContent='Could not read saved PDFs on this device.';};
 }
 render();
 if(!shared)try{
  const request=indexedDB.open('warren-order-documents-v1',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('pdfs',{keyPath:'id'});
  request.onsuccess=()=>{db=request.result;render();};
  request.onerror=()=>{$('order-pdf-status').textContent='PDF storage unavailable in this browser.';$('save-order-pdf').disabled=true;};
 }catch{$('order-pdf-status').textContent='PDF storage unavailable in this browser.';$('save-order-pdf').disabled=true;}
 $('order-pdf-file').addEventListener('change',()=>{
  const match=$('order-pdf-file').files[0]?.name.match(/^(\d{2})-(\d{2})-(\d{4})\.pdf$/i);
  if(match)$('order-pdf-date').value=`${match[3]}-${match[2]}-${match[1]}`;
 });
 $('order-pdf-form').addEventListener('submit',async event=>{
  event.preventDefault();const file=$('order-pdf-file').files[0],date=$('order-pdf-date').value;
  if(!shared&&!db){$('order-pdf-status').textContent='PDF storage is not ready. Try again.';return;}
  if(!file||!date)return;
  if(file.size>20*1024*1024){$('order-pdf-status').textContent='Choose a PDF smaller than 20 MB.';return;}
  $('save-order-pdf').disabled=true;
  try{
   if(!/\.pdf$/i.test(file.name)||!new TextDecoder().decode(await file.slice(0,1024).arrayBuffer()).includes('%PDF-'))throw Error('Choose a valid PDF document.');
   if(shared)await SharedOrders.upload(file,date);
   else await new Promise((resolve,reject)=>{
    const transaction=db.transaction('pdfs','readwrite');
    transaction.objectStore('pdfs').put({id:date+'|'+file.name,date,name:file.name,blob:file});
    transaction.oncomplete=resolve;transaction.onerror=()=>reject(Error('Could not save the PDF. Check browser storage space.'));transaction.onabort=transaction.onerror;
   });
   $('order-pdf-status').textContent=shared?`Shared ${file.name} for ${date}. Others can now open it from Order PDFs.`:`Saved ${file.name} for ${date} on this device. It is not yet shared with other devices.`;
   $('order-pdf-file').value='';render();
  }catch(error){$('order-pdf-status').textContent=error.message;}
  finally{$('save-order-pdf').disabled=false;}
 });
 window.addEventListener('pagehide',()=>urls.splice(0).forEach(url=>URL.revokeObjectURL(url)));
})();
