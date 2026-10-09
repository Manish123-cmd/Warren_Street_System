(() => {
 const $=id=>document.getElementById(id);
 const names=["Butter Croissant", "Pain au Chocolat", "Gianduja Bowtie", "Labneh Twist", "Cinnamon Bun", "Yemeny Honey Brioche", "Adani Chai Bun", "Pistachio Flan", "Olive & Goat Cheese Suisse", "Strawberry & Lemon Verbena Danish", "Red Croissant", "Cruffin", "Dark Chocolate Cookie", "Pistachio Cookie", "Pecan Cookie"];
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let current=today(),reports={},blocked=false;
 function render(){
  blocked=false;
  try{reports=JSON.parse(localStorage.getItem('warren-wastage-v1')||'{}');if(!reports||Array.isArray(reports)||typeof reports!=='object'||Object.values(reports).some(r=>!Array.isArray(r.counts)||r.counts.length!==names.length))throw Error();}
  catch{reports={};blocked=true;}
  const week=WastageWeek.summarize(current,reports);current=week.start;
  const format=date=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  $('orders-week-range').textContent=format(week.start)+' - '+format(week.end);
  orderChart(week);
 }
 function orderChart(week){

  let orders;
  try{orders=OrderReceipts.orders();}
  catch{$('receiving-list').textContent='Receipt storage unavailable. Refresh before changing delivery status.';return;}
  let stock={},unavailable=false;
  try{stock=JSON.parse(localStorage.getItem('warren-stock-v1')||'{}');if(!stock||Array.isArray(stock)||typeof stock!=='object')throw Error();}catch{stock={};unavailable=true;}
  let data;
  try{data=SalesSummary.summarize(week.days,names,orders,blocked?{}:reports,stock);}catch{data=SalesSummary.summarize(week.days,names,orders,{},{});unavailable=true;}
  const count=order=>Object.values(order.quantities).reduce((a,b)=>a+b,0);
  const total=status=>data.weekly.filter(o=>!status||o.status===status).reduce((sum,o)=>sum+count(o),0);
  $('orders-total').textContent=total().toLocaleString();
  $('orders-received').textContent=total('received').toLocaleString();
  $('orders-pending').textContent=data.weekly.filter(o=>o.status!=='received').reduce((sum,o)=>sum+count(o),0).toLocaleString();
  const list=$('receiving-list');list.replaceChildren();
  data.weekly.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(order=>{
   const row=document.createElement('article');row.className='incoming-order';
   const date=document.createElement('div');date.className='incoming-date';
   const deliveryDate=new Date(order.date+'T12:00:00Z');
   const month=document.createElement('span');month.textContent=new Intl.DateTimeFormat('en-GB',{month:'short',timeZone:'UTC'}).format(deliveryDate);
   const day=document.createElement('strong');day.textContent=deliveryDate.getUTCDate();date.append(month,day);
   const info=document.createElement('div');info.className='incoming-info';
   const name=document.createElement('h4');name.textContent=order.supplier||'Pastry order';
   const detail=document.createElement('p');detail.textContent=[order.orderNumber?'Order #'+order.orderNumber:null,order.time?order.time+' London':null,count(order)+' tracked pastries'].filter(Boolean).join(' | ');
   info.append(name,detail);
   const status=document.createElement('span');status.className='incoming-status'+(order.status==='received'?' received':'');status.textContent=order.status==='received'?'Received':'To be received';
   row.append(date,info,status);
   if(!order.confirmed){
    const button=document.createElement('button');button.type='button';button.className='button secondary incoming-pdf';
    button.textContent=order.status==='received'?'Undo received':'Mark as received';
    button.setAttribute('aria-label',button.textContent+' for order '+order.orderNumber+' on '+order.date);
    const londonHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
    button.disabled=order.status!=='received'&&(order.date>today()||(order.date===today()&&londonHour<8));
    button.addEventListener('click',()=>{
     try{OrderReceipts.setReceived(order.id,order.status!=='received');$('receipt-status').textContent=order.status==='received'?'Order marked as pending.':'Order marked as received.';}
     catch{$('receipt-status').textContent='Could not save receipt status. Please check browser storage and try again.';}
    });
    row.append(button);
   }
   if(order.sourceFile){const pdf=document.createElement('a');pdf.href='Assets/orders/'+encodeURIComponent(order.sourceFile);pdf.target='_blank';pdf.rel='noopener';pdf.textContent='Open PDF';pdf.className='button secondary incoming-pdf';pdf.setAttribute('aria-label','Open PDF for order '+order.orderNumber+' on '+order.date);row.append(pdf);}
   list.append(row);
  });
  if(!data.weekly.length)list.textContent='No orders recorded for this week. Advance orders will appear here when shared.';
  const chart=$('sales-chart-bars');chart.replaceChildren();
  const maximum=Math.max(1,...data.products.flatMap(p=>[p.ordered,p.sold||0]));
  $('sales-coverage').textContent=(unavailable||blocked?'Saved data unavailable. ': '')+`Scale: 0–${maximum} pastries. Sales estimates use saved preparation records for the baking date and reported wastage.`;
  data.products.forEach(product=>{
   const group=document.createElement('div');group.className='sales-product';
   const bars=document.createElement('div');bars.className='sales-pair';
   [['Ordered',product.ordered,'ordered'],['Estimated sold',product.sold,'sold']].forEach(([label,value,kind])=>{
    const column=document.createElement('div');column.className='sales-column';
    const count=document.createElement('span');count.textContent=value===null?'—':value.toLocaleString();
    const track=document.createElement('div');track.className='sales-track';
    const bar=document.createElement('div');bar.className='sales-bar '+kind;bar.style.height=`${(value||0)/maximum*100}%`;
    track.append(bar);column.append(count,track);column.title=`${product.name}: ${label} ${value===null?'unknown':value}`;bars.append(column);
   });
   const name=document.createElement('strong');name.textContent=product.name;
   const coverage=document.createElement('small');coverage.textContent=product.covered?`Sales: ${product.covered}/7 days`:'Sales not yet known';
   group.append(bars,name,coverage);chart.append(group);
  });
 }
 $('orders-prev-week').addEventListener('click',()=>{current=WastageWeek.offset(current,-7);render();});
 $('orders-next-week').addEventListener('click',()=>{current=WastageWeek.offset(current,7);render();});
 $('orders-this-week').addEventListener('click',()=>{current=today();render();});
 window.addEventListener('storage',render);
 window.addEventListener('order-receipts-changed',render);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
 render();
})();
