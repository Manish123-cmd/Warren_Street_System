(() => {
 // Overview-only delivery card: overdue and today's deliveries can be confirmed here; otherwise shows the next one.
 const heading=document.querySelector('main .page-heading');if(!heading)return;
 const panel=document.createElement('section');panel.className='order-alert';panel.setAttribute('aria-labelledby','order-alert-title');heading.after(panel);
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const london=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const v=type=>parts.find(p=>p.type===type).value;return {date:`${v('year')}-${v('month')}-${v('day')}`,hour:Number(v('hour'))};};
 const days=(from,to)=>Math.round((new Date(to+'T12:00:00Z')-new Date(from+'T12:00:00Z'))/864e5);
 const part=(date,option)=>new Intl.DateTimeFormat('en-GB',{[option]:option==='day'?'numeric':'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z M3 7.5l9 4.5 9-4.5 M12 12v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
 let message='';
 function refresh(){
  const now=london();
  let orders;
  try{orders=OrderReceipts.orders();}catch{panel.hidden=false;panel.className='order-alert';panel.replaceChildren(el('p','order-alert-status','Delivery receipt status unavailable. Refresh to try again.'));return;}
  const pending=orders.filter(order=>order.status!=='received').sort((a,b)=>a.date.localeCompare(b.date));
  const overdue=pending.filter(order=>order.date<now.date),due=pending.filter(order=>order.date===now.date);
  const selected=overdue.length||due.length?[...overdue,...due]:pending.slice(0,1);
  panel.hidden=!selected.length;if(!selected.length)return;
  const state=overdue.length?'overdue':due.length?'today':'upcoming';
  panel.className='order-alert '+state;panel.replaceChildren();
  const head=el('header','order-alert-head');
  const badge=el('span','order-alert-icon');badge.innerHTML=icon;
  const copy=el('div','order-alert-copy');
  const count=selected.length;
  copy.append(
   el('p','order-alert-kicker',state==='overdue'?`Action needed · ${count}`:state==='today'?'Today · from 8 am':'Coming up'),
   el('h2','',state==='overdue'?`${count} ${count===1?'delivery':'deliveries'} to confirm`:state==='today'?'Delivery expected today':'Next delivery'));
  copy.lastChild.id='order-alert-title';
  copy.append(el('p','order-alert-sub',state==='upcoming'?'Nothing to confirm right now. Here is what arrives next.':'Mark each delivery received once it is in the kitchen.'));
  const all=el('a','button secondary order-alert-link','All deliveries →');all.href='orders.html#receiving-title';
  head.append(badge,copy,all);
  const list=el('ul','order-alert-list');
  selected.forEach(order=>{
   const item=el('li','order-alert-item');
   const date=el('div','order-alert-date');date.append(el('span','',part(order.date,'weekday')),el('strong','',part(order.date,'day')),el('span','',part(order.date,'month')));
   const pastries=Object.values(order.quantities||{}).reduce((a,b)=>a+b,0);
   const info=el('div','order-alert-info');info.append(el('strong','',order.supplier||'Pastry order'),el('span','',[order.orderNumber?'Order '+order.orderNumber:null,(order.time||'08:00')+' London',pastries?pastries.toLocaleString()+' pastries':null].filter(Boolean).join(' · ')));
   const gap=days(now.date,order.date);
   const chip=el('span','order-alert-chip '+(gap<0?'overdue':gap===0?'today':'upcoming'),gap<0?`Overdue · ${-gap} ${gap===-1?'day':'days'}`:gap===0?(now.hour<8?'Arrives 8 am':'Due now'):gap===1?'Tomorrow':`In ${gap} days`);
   item.append(date,info,chip);
   if(gap<=0&&!order.confirmed){
    const button=el('button','button order-alert-confirm','Mark received');button.type='button';
    button.setAttribute('aria-label',`Mark order ${order.orderNumber} on ${order.date} as received`);
    button.disabled=gap===0&&now.hour<8;if(button.disabled)button.title='Available from 8 am London time';
    button.addEventListener('click',()=>{
     try{OrderReceipts.setReceived(order.id,true);message=`Order ${order.orderNumber} marked as received.`;}
     catch(error){message=error.message||'Could not save receipt status. Please try again.';}
     refresh();
    });
    item.append(button);
   }
   list.append(item);
  });
  const status=el('p','order-alert-status',message);status.setAttribute('role','status');
  panel.append(head,list,status);
 }
 refresh();setInterval(refresh,60000);window.addEventListener('storage',refresh);window.addEventListener('order-receipts-changed',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
