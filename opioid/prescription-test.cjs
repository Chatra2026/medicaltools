const assert=require('node:assert/strict');
const C=require('./conversion.js'),P=require('./preparation.js'),R=require('./prescription.js');
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`);
const base={drug:'morphine-inj',route:'iv',pumpId:'amy',rateMin:.5,rateMax:30,capacityMl:100,lines:[{productId:'m50',amps:1,usedMl:5}],salineMl:95,rateMlH:.5,pca:{mode:'none'}};
// Independent NCC v6 reference: oral morphine 60 mg/day -> morphine injection 30 mg/day.
near(C.target(C.equivalent('morphine',60),'morphine-inj')[0],30);
// Morphine injection 30 mg/day -> fentanyl injection 0.6 mg/day, hydromorphone 2.4 mg/day.
near(C.target(C.equivalent('morphine-inj',30),'fentanyl-inj')[0],.6);
near(C.target(C.equivalent('morphine-inj',30),'hydromorphone-inj')[0],2.4);
// Undiluted and diluted mass/volume balance, product strength independent of algorithm.
const raw=R.analyze({...base,lines:[{productId:'m10',amps:2,usedMl:2}],salineMl:0,rateMlH:.5});
near(raw.totalMg,20);near(raw.volume,2);near(raw.concentration,10);near(raw.daily,120);near(raw.baseHours,4);
const diluted=R.analyze(base);
near(diluted.totalMg,50);near(diluted.volume,100);near(diluted.concentration,.5);near(diluted.hourly,.25);near(diluted.daily,6);near(diluted.baseHours,200);
// A mixed-strength prescription: one 50 mg/5 mL and one 10 mg/1 mL.
const mixed=R.analyze({...base,lines:[{productId:'m50',amps:1,usedMl:5},{productId:'m10',amps:1,usedMl:1}],salineMl:94});
near(mixed.totalMg,60);near(mixed.volume,100);near(mixed.daily,7.2);
const partial=R.analyze({...base,lines:[{productId:'m10',amps:2,usedMl:1.5}],salineMl:98.5});
near(partial.totalMg,15);near(partial.discardMl,.5);near(partial.discardMg,5);
// No bolus versus four 0.5mL boluses per 24 hours. No lockout-derived maximum is inferred.
near(diluted.pca.hours,200);near(diluted.pca.extraMlDay,0);
const pca=R.analyze({...base,pca:{mode:'expected',bolusMl:.5,usesPerDay:4,lockoutMin:15}});
near(pca.pca.bolusMg,.25);near(pca.pca.baseMlDay,12);near(pca.pca.extraMlDay,2);near(pca.pca.combinedMlDay,14);near(pca.pca.hours,100*24/14);
assert.equal(pca.pca.scenarios.find(s=>s.count===0).hours,200);
assert.equal(R.analyze({...base,pca:{mode:'actual',bolusMl:.5,usesPerDay:4}}).pca.mode,'actual');
const warn=(input,needle)=>assert.ok(R.analyze({...base,...input}).warnings.some(w=>w.includes(needle)),needle);
warn({capacityMl:50},'容器容量');
warn({rateMlH:.3},'流速');warn({rateMlH:.55},'刻み');
warn({lines:[{productId:'m10',amps:1,usedMl:1}],salineMl:0,pca:{mode:'expected',bolusMl:1,usesPerDay:4}},'24時間より前に不足');
warn({drug:'fentanyl-inj',route:'sc',lines:[{productId:'f05',amps:1,usedMl:10}],salineMl:90},'点滴静注');
warn({route:'sc',rateMlH:1.1},'1 mL/h');
for(const input of [{lines:[{productId:'m10',amps:1,usedMl:2}]},{lines:[{productId:'o10',amps:1,usedMl:1}]},{lines:[{productId:'m50',amps:1.5,usedMl:5}]},{lines:[{productId:'m50',amps:1,usedMl:5,concentration:1}]},{rateMlH:0},{rateMlH:-1},{rateMlH:Infinity},{rateMlH:1e7},{salineMl:-1},{route:'oral'},{pca:{mode:'expected',bolusMl:0,usesPerDay:1}},{pca:{mode:'actual',bolusMl:.5,usesPerDay:1.5}}])assert.throws(()=>R.analyze({...base,...input}));
const parameters={drug:'morphine-inj',daily:12,volume:100,days:5,productIds:['m10','m50'],route:'iv',pumpId:'amy',rateMin:.5,rateMax:30,capacityMl:100};
const plans=R.plans(parameters);assert.ok(plans.length>1);assert.ok(plans.some(r=>r.breakdown.length===2));
for(const r of plans){near(r.totalMg,r.breakdown.reduce((n,b)=>n+b.mg,0));near(r.drugMl+r.salineMl,100);near(r.daily,r.concentration*r.rate*24);}
const fraction=R.plans({...parameters,daily:7.5,days:2,productIds:['m10']});
assert.ok(fraction.some(r=>r.discardMl>.01));assert.ok(fraction.some(r=>Math.abs(r.daily-7.5)>.0001));
const rescuePlan=R.plans({...parameters,daily:6,days:2,productIds:['m10'],pca:{mode:'expected',bolusMl:.5,usesPerDay:4}});
assert.ok(rescuePlan.length>0);near(rescuePlan[0].pca.extraMlDay,2);assert.ok(rescuePlan.every(r=>r.pca.hours<r.baseHours));
// Undiluted 1% morphine at 120 mg/day needs 0.5 mL/h; 8 x 50mg/5mL cover 80 hours.
const rawPlan=R.rawPlans({...parameters,daily:120,days:3,productIds:['m50']});
assert.equal(rawPlan[0].ampCount,8);near(rawPlan[0].salineMl,0);near(rawPlan[0].rate,.5);near(rawPlan[0].daily,120);near(rawPlan[0].pca.hours,80);
assert.deepEqual(R.rawPlans({...parameters,daily:30,days:3,productIds:['m10']}),[]);
const rawPca=R.rawPlans({...parameters,daily:120,days:3,productIds:['m50'],pca:{mode:'expected',bolusMl:.5,usesPerDay:4}});
assert.equal(rawPca[0].ampCount,9);near(rawPca[0].pca.hours,45*24/14);
assert.ok(R.plans({...parameters,daily:30,days:null,productIds:['m10']}).every(r=>r.pca.hours>=24));
assert.throws(()=>R.plans({...parameters,capacityMl:50}),/容量/);
assert.throws(()=>R.plans({...parameters,daily:-1}),/目標投与量/);
assert.throws(()=>R.plans({...parameters,productIds:['o10']}),/一致/);
for(const p of P.products){assert.ok(p.source.startsWith('https://www.pmda.go.jp/'));assert.equal(p.checked,'2026-10-13');near(p.concentration,p.mg/p.ml);}
console.log('PASS: independent NCC anchors, raw/diluted/mixed/partial calculations, PCA scenarios, capacity/rate/units/route/shortage warnings, plans and source metadata.');
