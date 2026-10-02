(() => {
 const main=document.querySelector('main');if(!main)return;
 const panel=document.createElement('aside');panel.className='order-alert';panel.setAttribute('role','status');main.prepend(panel);
 function refresh(){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const receipts=new Set((window.CONFIRMED_DELIVERIES||[]).map(order=>order.id));
  const pending=(window.ADVANCE_ORDERS||[]).filter(order=>order.status!=='received'&&!receipts.has(order.id)).sort((a,b)=>a.date.localeCompare(b.date));
  const due=pending.filter(order=>order.date===today),overdue=pending.filter(order=>order.date<today);
  const selected=due.length?due:overdue.length?overdue:pending.slice(0,1);
  panel.hidden=!selected.length;panel.classList.toggle('due',!!(due.length||overdue.length));panel.replaceChildren();
  if(!selected.length)return;
  const title=document.createElement('strong');title.textContent=due.length?'Delivery expected today':overdue.length?'Delivery receipt awaiting confirmation':'Next order to be received';panel.append(title);
  selected.forEach(order=>{const text=document.createElement('p');text.textContent=`${order.supplier} · Order ${order.orderNumber} · ${order.date} at ${order.time} (London time)`;panel.append(text);});
  const link=document.createElement('a');link.href='orders.html#receiving-title';link.textContent='View incoming orders';panel.append(link);
 }
 refresh();setInterval(refresh,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
