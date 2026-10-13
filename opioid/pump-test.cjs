const assert=require('node:assert/strict'),P=require('./preparation.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
assert.deepEqual(P.neighbors(.46,.1,.1,30),[.4,.5]);
assert.deepEqual(P.neighbors(.5,.1,.1,30),[.5]);
assert.deepEqual(P.neighbors(.05,.1,.1,30),[.1]);
const settings=P.settings({rate:.46,concentration:.05,daily:.552,volume:100,pumpId:'amy',rateMin:.1,rateMax:30});
assert.deepEqual(settings.map(s=>s.rate),[.4,.5]);near(settings[0].daily,.48);near(settings[1].daily,.6);
assert.throws(()=>P.settings({rate:.5,concentration:1,daily:12,volume:100,pumpId:'amy',rateMin:.01,rateMax:30}));
for(const pumpId of Object.keys(P.pumps))for(const volume of [50,100,250])for(const product of P.products){
 const rows=P.candidates({daily:.6,productId:product.id,volume,preferredRate:.5,minHours:24,pumpId,rateMin:.1,rateMax:1});
 for(const r of rows)for(const s of r.settings){near(r.drugVolume+r.saline,volume);near(s.rate*10,Math.round(s.rate*10));near(s.daily,r.concentration*s.rate*24);assert.ok(s.rate>=.1&&s.rate<=1);assert.ok(s.hours>=24-1e-8);for(const b of s.rescue)near(b.mg,b.volume*r.concentration);}
}
// Default 100mL whole reservoir: 5 x fentanyl 0.5mg/10mL + 50mL saline.
const rows=P.candidates({daily:.6,productId:'f05',volume:100,preferredRate:1,minHours:24,pumpId:'amy',rateMin:.5,rateMax:30});
const exact=rows.find(r=>r.amps===5);assert.ok(exact);near(exact.saline,50);near(exact.settings[0].rate,1);near(exact.settings[0].daily,.6);
assert.deepEqual(P.candidates({daily:.001,productId:'n2',volume:100,preferredRate:.5,minHours:24,pumpId:'amy',rateMin:.5,rateMax:30}),[]);
console.log('PASS: pump grid boundaries, delivered daily amounts, full reservoir mass balance, administration limits, model-specific dose grids.');
