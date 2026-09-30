const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseOrder}=require('../scripts/order-parser.js');
const names=['Butter Croissant','Gianduja Bowtie','Pecan Cookie','Pistachio Cookie','Cruffin'];
const example=`Order #33757382
Delivery date 22/09/2026 10:00:00
Product Code Product name Qty Price Total
* Frozen Cannele Box 75 1 £115.00 £115.00
* Frozen Carmelized Pecan Cookie (50) 1 £105.00 £105.00
* Frozen Pistachio White Chocolate Cookie (50) 1 £105.00 £105.00
Frozen Almond Croissant (25 Unfilled) 1 £33.44 £33.44
Frozen Butter Croissant (25) 2 £26.16 £52.32
Frozen Gianduja Bow (25) 2 £61.42 £122.84
Qima - Almond Frangipane (Croissant Filling) 2kg 1 £28.00 £28.00`;
test('supplied order transcription: supplier aliases, Qty column, 25 units per pack',()=>{
 const result=parseOrder(example,names);
 assert.deepEqual(result.matches.map(m=>[names[m.i],m.value]),[['Pecan Cookie',25],['Pistachio Cookie',25],['Butter Croissant',50],['Gianduja Bowtie',50]]);
 assert.equal(result.skipped.length,6);
});
test('conversion includes zero and three packs',()=>{
 assert.equal(parseOrder('Butter Croissant 3',names).matches[0].value,75);
 assert.equal(parseOrder('Cruffin 0',names).matches[0].value,0);
});
test('never use pack size or price as missing Qty',()=>{
 for(const line of ['Frozen Butter Croissant (25) £26.16 £52.32','Frozen Butter Croissant (25)','Frozen Butter Croissant (25) 26.16 52.32','Butter Croissant -2','Butter Croissant 2 3','Butter Croissant 1.5']) assert.equal(parseOrder(line,names).matches.length,0,line);
});
test('table separators and numeric product codes',()=>{
 assert.equal(parseOrder('1234 Frozen Butter Croissant (25) | 2 | £26.16 | £52.32',names).matches[0].value,50);
});
test('duplicates and multiple names cannot overwrite stock',()=>{
 assert.equal(parseOrder('Cruffin 1\nCruffin 2\nCruffin 3',names).matches.length,0);
 assert.equal(parseOrder('Butter Croissant Gianduja Bow 2',names).matches.length,0);
});
