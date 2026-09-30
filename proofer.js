(function(root) {
  const quantities = {
    'Butter Croissant':[12,12], 'Pain au Chocolat':[16,16], 'Gianduja Bowtie':[20,27],
    'Labneh Twist':[10,12], 'Cinnamon Bun':[18,20], 'Yemeny Honey Brioche':[15,24],
    'Adani Chai Bun':[10,12], 'Pistachio Flan':[9,11], 'Olive & Goat Cheese Suisse':[10,11],
    'Strawberry & Lemon Verbena Danish':[12,12], 'Red Croissant':[6,9], 'Cruffin':[8,12],
    'Dark Chocolate Cookie':[7,7], 'Pecan Cookie':[7,7], 'Pistachio Cookie':[7,7]
  };
  function nextDay(date) { const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+1); return d.toISOString().slice(0,10); }
  function plan(date,names) {
    const bakingDate=nextDay(date), day=new Date(bakingDate+'T12:00:00Z').getUTCDay();
    const weekend=day===0||day===6;
    return {bakingDate,type:weekend?'Weekend':'Weekday',amounts:names.map(name=>quantities[name][weekend?1:0])};
  }
  function catchUp(records,names,now=new Date()) {
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
    const get=type=>parts.find(p=>p.type===type).value;
    const today=`${get('year')}-${get('month')}-${get('day')}`;
    const updated={...records}; let changed=false;
    // The confirmed 30 September count is already after preparation.
    for(let date='2026-10-01';date<=today;date=nextDay(date)) {
      if(date===today && Number(get('hour'))<10) break;
      if(updated[date]) continue; // Saved manual counts already represent post-proofer stock.
      const previous=Object.keys(updated).filter(d=>d<date).sort().at(-1);
      if(!previous) continue;
      const scheduled=plan(date,names), shortages=[];
      const counts=updated[previous].counts.map((count,i)=>{
        if(count===null) return null;
        if(count<scheduled.amounts[i]) shortages.push({name:names[i],missing:scheduled.amounts[i]-count});
        return Math.max(0,count-scheduled.amounts[i]);
      });
      updated[date]={counts,savedAt:now.toISOString(),inheritedFrom:previous,afterProoferDeduction:true,automaticDeduction:true,preparation:scheduled,shortages}; changed=true;
    }
    return {records:updated,changed};
  }
  root.ProoferSchedule={quantities,plan,catchUp};
  if(typeof module!=='undefined') module.exports=root.ProoferSchedule;
})(typeof window==='undefined'?globalThis:window);
