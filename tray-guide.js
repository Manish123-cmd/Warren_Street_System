(() => {
 const cards=[...document.querySelectorAll('.tray-card')];
 const dialog=document.getElementById('tray-dialog');
 document.getElementById('guide-search').addEventListener('input',event=>{
  const query=event.target.value.trim().toLowerCase();let count=0;
  cards.forEach(card=>{card.hidden=!card.dataset.name.toLowerCase().includes(query);if(!card.hidden)count++;});
  document.getElementById('guide-count').textContent=`${count} ${count===1?'guide':'guides'}`;
  document.getElementById('guide-empty').hidden=count!==0;
 });
 document.querySelectorAll('.tray-photo').forEach(button=>button.addEventListener('click',()=>{
  const image=button.querySelector('img');
  document.getElementById('tray-dialog-title').textContent=button.dataset.title;
  document.getElementById('tray-dialog-caption').textContent=button.dataset.caption;
  const full=document.getElementById('tray-dialog-image');full.src=image.src;full.alt=image.alt;
  document.getElementById('tray-original').href=image.src;
  dialog.showModal();
 }));
 document.getElementById('close-tray').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
})();
