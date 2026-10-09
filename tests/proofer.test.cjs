const {test}=require('node:test');const assert=require('node:assert/strict');const {plan,catchUp,quantities}=require('../scripts/proofer.js');
const names=Object.keys(quantities);const seed={'2026-09-30':{counts:names.map(()=>100),afterProoferDeduction:true}};
const vm=require('node:vm');const fs=require('node:fs');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../scripts/initial-stock.js'),'utf8'),context);
const deliveries=JSON.parse(JSON.stringify(context.window.CONFIRMED_DELIVERIES));
const actualSeed={'2026-09-30':{counts:names.map(name=>context.window.CONFIRMED_STOCK_HISTORY[0].quantities[name]),afterProoferDeduction:true}};
test('late delivery repairs automatic history and capped shortages exactly once',()=>{
  const now=new Date('2026-10-02T10:00Z');
  const old=catchUp(actualSeed,names,now).records;
  assert.equal(old['2026-10-02'].counts[names.indexOf('Labneh Twist')],0);
  const result=catchUp(old,names,now,deliveries);
  const expected={'Butter Croissant':66,'Pain au Chocolat':46,'Labneh Twist':47,'Cinnamon Bun':37,'Pistachio Flan':18,'Strawberry & Lemon Verbena Danish':44};
  for(const [name,count] of Object.entries(expected)) assert.equal(result.records['2026-10-02'].counts[names.indexOf(name)],count,name);
  assert.equal(result.records['2026-10-01'].counts[names.indexOf('Labneh Twist')],59);
  assert.equal(result.records['2026-10-02'].shortages.some(s=>s.name==='Labneh Twist'),false);
  assert.equal(catchUp(result.records,names,now,deliveries).changed,false);
  assert.deepEqual(catchUp(actualSeed,names,now,deliveries).records,result.records);
  assert.equal(old['2026-10-02'].counts[names.indexOf('Labneh Twist')],0);
});
test('delivery preserves later manual stock counts and unknown counts',()=>{
  const now=new Date('2026-10-03T10:00Z');
  const records={...actualSeed,'2026-10-01':{counts:names.map(()=>null)},'2026-10-02':{counts:names.map(()=>100),automaticDeduction:false}};
  const result=catchUp(records,names,now,deliveries);
  assert.equal(result.records['2026-10-01'].counts[0],null);
  assert.equal(result.records['2026-10-02'].counts[0],100);
  assert.equal(result.records['2026-10-03'].counts[0],88);
  assert.equal(catchUp(result.records,names,now,deliveries).changed,false);
});
test('weekday and weekend baking dates',()=>{assert.equal(plan('2026-10-02',names).type,'Weekend');assert.equal(plan('2026-10-03',names).type,'Weekend');assert.equal(plan('2026-10-04',names).type,'Weekday');});
test('today exempt, London 10AM boundary, repeat safe',()=>{assert.equal(catchUp(seed,names,new Date('2026-09-30T15:00Z')).changed,false);assert.equal(catchUp(seed,names,new Date('2026-10-01T08:59Z')).changed,false);const r=catchUp(seed,names,new Date('2026-10-01T09:00Z'));assert.equal(r.records['2026-10-01'].counts[0],88);assert.equal(catchUp(r.records,names,new Date('2026-10-01T12:00Z')).changed,false);});
test('missed days, manual snapshots, shortages, nulls',()=>{const r=catchUp(seed,names,new Date('2026-10-03T10:00Z'));assert.equal(r.records['2026-10-03'].counts[names.indexOf('Gianduja Bowtie')],26);const manual={...seed,'2026-10-01':{counts:names.map(()=>null)}};assert.equal(catchUp(manual,names,new Date('2026-10-02T10:00Z')).records['2026-10-02'].counts[0],null);const low={'2026-09-30':{counts:names.map(()=>2)}};const s=catchUp(low,names,new Date('2026-10-01T10:00Z')).records['2026-10-01'];assert.equal(s.counts[0],0);assert.equal(s.shortages[0].missing,10);});
test('winter London time',()=>{const records={'2026-10-31':{counts:names.map(()=>100)}};assert.equal(catchUp(records,names,new Date('2026-11-01T09:59Z')).changed,false);assert.equal(catchUp(records,names,new Date('2026-11-01T10:00Z')).records['2026-11-01'].counts[0],88);});

test('8 am receipts add once before 10 am preparation, which deducts once',()=>{
 const baseline={'2026-10-09':{counts:names.map(()=>32),afterProoferDeduction:true}};
 const delivery=[{id:'saturday',date:'2026-10-10',quantities:{'Butter Croissant':25}}];
 assert.equal(catchUp(baseline,names,new Date('2026-10-10T06:59Z'),delivery).changed,false);
 const received=catchUp(baseline,names,new Date('2026-10-10T07:00Z'),delivery);
 assert.equal(received.records['2026-10-10'].counts[0],57);
 assert.equal(received.records['2026-10-10'].afterProoferDeduction,false);
 assert.equal(catchUp(received.records,names,new Date('2026-10-10T08:00Z'),delivery).changed,false);
 const prepared=catchUp(received.records,names,new Date('2026-10-10T09:00Z'),delivery);
 assert.equal(prepared.records['2026-10-10'].counts[0],45);
 assert.equal(catchUp(prepared.records,names,new Date('2026-10-10T10:00Z'),delivery).changed,false);
});
