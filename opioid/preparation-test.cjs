const assert=require('node:assert/strict'),P=require('./preparation.js'),C=require('./conversion.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
for(const product of P.products)for(const daily of [.1,.6,1,2.4,25,100])for(const volume of [50,100,250]){
 const rows=P.candidates({daily,productId:product.id,volume,preferredRate:.5,minHours:24});
 assert.ok(rows.length<=3);
 for(const r of rows){assert.ok(Number.isInteger(r.amps)&&r.amps>0);near(r.drugVolume+r.saline,volume);near(r.concentration*r.rate*24,daily);near(r.rescueVolume*r.concentration,r.rescueMg);assert.ok(r.hours>=24-1e-8);assert.ok(r.saline>=0);}
}
assert.equal(P.products.find(p=>p.id==='n2').ml,1);
assert.equal(P.products.find(p=>p.id==='n20').mg/P.products.find(p=>p.id==='n20').ml,10);
const x={daily:.6,productId:'f05',volume:50,preferredRate:.5,minHours:24};
near(P.candidates(x)[0].rate,.5);assert.equal(P.candidates(x)[0].amps,5);
assert.deepEqual(P.candidates({...x,daily:100}),[]);
for(const key of ['daily','volume','preferredRate','minHours'])for(const n of [0,-1,NaN,Infinity])assert.throws(()=>P.candidates({...x,[key]:n}));
assert.throws(()=>P.candidates({...x,productId:'unknown'}));
assert.throws(()=>P.candidates({...x,preferredRate:1e-308}));
assert.match(C.switchNote('fentos','hydromorphone-inj'),/剥離直後の使用を避け/);
console.log('PASS: preparation mass balance, daily delivery, whole ampoules, reservoir bounds, duration, invalid inputs, label-specific timing.');
