(function(root){
 function summarize(days,names,orders,reports,stock){
  const start=days[0].date,end=days[6].date;
  const weekly=orders.filter(order=>order.date>=start&&order.date<=end);
  const products=names.map((name,i)=>{
   const ordered=weekly.reduce((sum,order)=>sum+(order.quantities[name]||0),0);
   let sold=0,covered=0;
   days.forEach(({date})=>{
    const report=reports[date];
    const prep=Object.values(stock).find(record=>record.automaticDeduction&&record.preparation?.bakingDate===date);
    const amount=prep?.preparation.amounts[i],waste=report?.counts[i];
    if(!Number.isInteger(amount)||prep.counts[i]===null||!Number.isInteger(waste))return;
    const available=amount-(prep.shortages||[]).filter(s=>s.name===name).reduce((sum,s)=>sum+s.missing,0);
    if(waste>available)return;
    sold+=available-waste;covered++;
   });
   return {name,ordered,sold:covered?sold:null,covered};
  });
  return {weekly,products};
 }
 root.SalesSummary={summarize};
 if(typeof module!=='undefined')module.exports=root.SalesSummary;
})(typeof window==='undefined'?globalThis:window);
