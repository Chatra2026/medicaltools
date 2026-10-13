/* Arithmetic preparation candidates, not a prescription or stability recommendation. */
(function(root){
const products=[
 {id:'m10',drug:'morphine-inj',name:'モルヒネ塩酸塩注 10mg/1mL（1%）',mg:10,ml:1},
 {id:'m50',drug:'morphine-inj',name:'モルヒネ塩酸塩注 50mg/5mL（1%）',mg:50,ml:5},
 {id:'m200',drug:'morphine-inj',name:'モルヒネ塩酸塩注 200mg/5mL（4%）',mg:200,ml:5},
 {id:'o10',drug:'oxycodone-inj',name:'オキファスト 10mg/1mL',mg:10,ml:1},
 {id:'o50',drug:'oxycodone-inj',name:'オキファスト 50mg/5mL',mg:50,ml:5},
 {id:'f01',drug:'fentanyl-inj',name:'フェンタニル 0.1mg/2mL',mg:.1,ml:2},
 {id:'f025',drug:'fentanyl-inj',name:'フェンタニル 0.25mg/5mL',mg:.25,ml:5},
 {id:'f05',drug:'fentanyl-inj',name:'フェンタニル 0.5mg/10mL',mg:.5,ml:10},
 {id:'n2',drug:'hydromorphone-inj',name:'ナルベイン 2mg/1mL',mg:2,ml:1},
 {id:'n20',drug:'hydromorphone-inj',name:'ナルベイン 20mg/2mL',mg:20,ml:2}
];
const pumps={
 amy:{name:'エイミーPCA CAP-100（mL）',min:.1,max:30,step:.1,bolusMin:.1,bolusMax:50,bolusStep:.1},
 legacy:{name:'CADD-Legacy PCA 6300（mL）',min:.1,max:50,step:.1,bolusMin:.05,bolusMax:9.9,bolusStep:.05},
 solis:{name:'CADD-Solis VIP PCA（mL）',min:.1,max:100,step:.1,bolusMin:.05,bolusMax:50,bolusStep:.05}
};
function neighbors(value,step,min,max){
 return [...new Set([Math.floor(value/step+1e-9),Math.ceil(value/step-1e-9)].map(n=>Number((n*step).toFixed(8))))].filter(n=>n>=min-1e-9&&n<=max+1e-9&&n>0);
}
function settings({rate,concentration,daily,volume,pumpId,rateMin,rateMax,minHours=0}){
 const p=pumps[pumpId];if(!p)throw Error('ポンプ機種を選択してください。');
 const min=rateMin??p.min,max=rateMax??p.max;
 if(![rate,concentration,daily,volume,min,max].every(n=>Number.isFinite(n)&&n>0)||min<p.min||max>p.max||min>max)throw Error('実機の流速上下限を仕様の範囲内で入力してください。');
 return neighbors(rate,p.step,min,max).map(r=>({rate:r,daily:concentration*r*24,errorPercent:(concentration*r*24/daily-1)*100,hours:volume/r,
  rescue:neighbors(r,p.bolusStep,p.bolusMin,p.bolusMax).map(v=>({volume:v,mg:v*concentration,errorPercent:(v/r-1)*100}))})).filter(s=>s.hours>=minHours-1e-8);
}
function candidates({daily,productId,volume,preferredRate,minHours=0,pumpId,rateMin,rateMax}){
 const p=products.find(p=>p.id===productId);
 if(!p||(![daily,volume,preferredRate].every(n=>Number.isFinite(n)&&n>0)||!Number.isFinite(minHours)||minHours<0))throw Error('量・総液量・目標流速・必要時間は0より大きい数値で入力してください。');
 const max=Math.floor((volume+1e-9)/p.ml),minimum=Math.max(1,Math.ceil(daily*minHours/24/p.mg-1e-9));
 if(!Number.isSafeInteger(max)||max>100000||!Number.isSafeInteger(minimum))throw Error('計算可能な範囲で入力してください。');
 const desired=daily*volume/(24*preferredRate*p.mg),counts=new Set([minimum,max]);
 if(!Number.isFinite(desired)||desired>Number.MAX_SAFE_INTEGER)throw Error('計算可能な範囲で入力してください。');
 const center=Math.min(max,Math.max(minimum,Math.floor(desired)));
 for(let n=center-2;n<=center+3;n++)counts.add(n);
 if(pumpId)for(let n=minimum;n<=max;n++)counts.add(n);
 return [...counts].filter(n=>n>=minimum&&n<=max).map(n=>{
  const total=n*p.mg,drugVolume=n*p.ml,saline=Math.max(0,volume-drugVolume),concentration=total/volume,rate=daily/24/concentration,hours=volume/rate;
  const row={amps:n,total,drugVolume,saline,concentration,rate,hours,rescueMg:daily/24,rescueVolume:rate};
  if(pumpId)row.settings=settings({rate,concentration,daily,volume,pumpId,rateMin,rateMax,minHours});
  return row;
 }).filter(r=>Object.entries(r).every(([k,v])=>k==='settings'||Number.isFinite(v))&&r.rate>0&&(!pumpId||r.settings.length)).sort((a,b)=>{
  if(pumpId){const error=r=>Math.min(...r.settings.map(s=>Math.abs(s.errorPercent)));const difference=error(a)-error(b);if(Math.abs(difference)>1e-8)return difference;}
  return Math.abs(Math.log(a.rate/preferredRate))-Math.abs(Math.log(b.rate/preferredRate))||a.amps-b.amps;
 }).slice(0,3);
}
const api={products,pumps,neighbors,settings,candidates};if(typeof module!=='undefined')module.exports=api;else root.OpioidPreparation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
