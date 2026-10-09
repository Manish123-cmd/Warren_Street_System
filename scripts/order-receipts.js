(() => {
 const key='warren-order-receipts-v1';
 function read(){
  const records=JSON.parse(localStorage.getItem(key)||'{}');
  if(!records||typeof records!=='object'||Array.isArray(records)||Object.values(records).some(r=>!r||typeof r.received!=='boolean'))throw Error('Receipt storage unavailable');
  return records;
 }
 function orders(){
  const saved=read(),confirmed=(window.CONFIRMED_DELIVERIES||[]).map(order=>({...order,status:'received',confirmed:true}));
  return [...confirmed,...(window.ADVANCE_ORDERS||[]).filter(order=>!confirmed.some(r=>r.id===order.id)).map(order=>({...order,status:saved[order.id]?saved[order.id].received?'received':'pending':order.status}))];
 }
 function setReceived(id,received){
  const order=orders().find(order=>order.id===id);
  if(!order||order.confirmed)throw Error('This delivery cannot be changed here.');
  const records=read();
  records[id]={received,updatedAt:new Date().toISOString()};
  localStorage.setItem(key,JSON.stringify(records));
  window.dispatchEvent(new Event('order-receipts-changed'));
 }
 window.OrderReceipts={orders,setReceived};
})();
