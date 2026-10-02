const {test}=require('node:test');const assert=require('node:assert/strict');
const {summarize}=require('../scripts/sales-summary.js');
const days=Array.from({length:7},(_,i)=>({date:`2026-10-${String(i+5).padStart(2,'0')}`}));
const names=['Butter Croissant'];
const prep={automaticDeduction:true,counts:[20],preparation:{bakingDate:'2026-10-05',amounts:[12]},shortages:[]};
test('zero waste sells prepared quantity, not pending orders',()=>{
 const r=summarize(days,names,[{date:'2026-10-06',status:'pending',quantities:{'Butter Croissant':50}}],{'2026-10-05':{counts:[0]}},{'2026-10-04':prep});
 assert.deepEqual(r.products[0],{name:'Butter Croissant',ordered:50,sold:12,covered:1});
});
test('missing reports and preparation stay unknown; shortages reduce available quantity',()=>{
 assert.equal(summarize(days,names,[],{},{}).products[0].sold,null);
 assert.equal(summarize(days,names,[],{'2026-10-05':{counts:[0]}},{}).products[0].sold,null);
 const stock={'2026-10-04':{...prep,shortages:[{name:names[0],missing:4}]}};
 assert.equal(summarize(days,names,[],{'2026-10-05':{counts:[3]}},stock).products[0].sold,5);
 assert.equal(summarize(days,names,[],{'2026-10-05':{counts:[9]}},stock).products[0].sold,null);
});
test('orders outside selected Monday–Sunday week are excluded',()=>{
 const r=summarize(days,names,[{date:'2026-10-12',quantities:{'Butter Croissant':25}}],{},{});
 assert.equal(r.weekly.length,0);assert.equal(r.products[0].ordered,0);
});
