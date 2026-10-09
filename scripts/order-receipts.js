(() => {
 const key='warren-order-receipts-v1';
 function read(){
  const records=JSON.parse(localStorage.getItem(key)||'{}');
  if(!records||typeof records!=='object'||Array.isArray(records)||Object.values(records).some(r=>!r||typeof r.received!=='boolean'))throw Error('Receipt storage unavailable');
  return records;
 }
 function orders(){
  const saved=read(),confirmed=(window.CONFIRMED_DELIVERIES||[]).map(order=>({...order,status:'received',confirmed:true}));
  return [...confirmed,...(window.ADVANCE_ORDERS||[]).filter(order=>!confirmed.some(r=>r.id===order.id)).map(order=>({...order,confirmed:!!saved[order.id]?.stockReceipt,status:saved[order.id]?saved[order.id].received?'received':'pending':order.status}))];
 }
 function setReceived(id,received){
  const order=orders().find(order=>order.id===id);
  if(!order||order.confirmed)throw Error('This delivery cannot be changed here.');
  const records=read();
  if(received){
   const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
   const value=type=>parts.find(p=>p.type===type).value;
   const date=`${value('year')}-${value('month')}-${value('day')}`;
   if(order.date>date||(order.date===date&&Number(value('hour'))<8))throw Error('Receipt can be confirmed from 8 am London time on the delivery date.');
  }
  records[id]={received,stockReceipt:received&&order.date>='2026-10-10',updatedAt:new Date().toISOString()};
  localStorage.setItem(key,JSON.stringify(records));
  window.dispatchEvent(new Event('order-receipts-changed'));
 }
 function deliveries(){
  const records=read();
  return [...(window.CONFIRMED_DELIVERIES||[]),...(window.ADVANCE_ORDERS||[]).filter(order=>records[order.id]?.stockReceipt&&records[order.id]?.received&&!(window.CONFIRMED_DELIVERIES||[]).some(d=>d.id===order.id))];
 }
 window.OrderReceipts={orders,setReceived,deliveries};
})();
