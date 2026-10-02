const {test}=require('node:test');
const assert=require('node:assert/strict');
const {summarize}=require('../scripts/wastage-week.js');
test('Monday through Sunday includes month and year boundaries',()=>{
  for(const date of ['2026-09-28','2026-10-01','2026-10-04']) {
    const week=summarize(date,{});
    assert.equal(week.start,'2026-09-28');assert.equal(week.end,'2026-10-04');
  }
  assert.equal(summarize('2026-10-05',{}).start,'2026-10-05');
  assert.equal(summarize('2027-01-01',{}).start,'2026-12-28');
});
test('saved drafts, zero counts and missing reports remain distinct',()=>{
  const reports={'2026-09-28':{counts:[0,0]},'2026-09-29':{counts:[3,null]},'2026-09-30':{counts:[null,null]},'2026-10-05':{counts:[100,100]}};
  const week=summarize('2026-10-01',reports);
  assert.equal(week.total,3);assert.equal(week.complete,1);
  assert.deepEqual(week.days.map(d=>d.state),['Complete','Draft','Draft','Not recorded','Not recorded','Not recorded','Not recorded']);
  assert.equal(week.days[0].total,0);assert.equal(week.days[2].total,null);
  assert.equal(summarize('2026-10-12',reports).total,null);
});
