const {test}=require('node:test');
const assert=require('node:assert/strict');
const {change}=require('../scripts/wastage-trends.js');
const points=values=>values.map((value,i)=>({date:`2026-10-0${i+1}`,value}));
test('day-by-day change compares with the closest earlier recorded day',()=>{
  assert.deepEqual(change(points([8,null,6]),2),{text:'↓ 25.0%',tone:'good',detail:'vs Thu 1 Oct'});
  assert.equal(change(points([4,5]),1).tone,'bad');
  assert.equal(change(points([0,3]),1).text,'↑ from 0');
  assert.equal(change(points([3,3]),1).text,'No change');
  assert.equal(change(points([null,3]),1).text,'First record');
});
