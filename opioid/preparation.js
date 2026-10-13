/* Arithmetic preparation candidates, not a prescription or stability recommendation. */
(function(root){
const products=[
 {id:'f01',drug:'fentanyl-inj',name:'フェンタニル 0.1mg/2mL',mg:.1,ml:2},
 {id:'f025',drug:'fentanyl-inj',name:'フェンタニル 0.25mg/5mL',mg:.25,ml:5},
 {id:'f05',drug:'fentanyl-inj',name:'フェンタニル 0.5mg/10mL',mg:.5,ml:10},
 {id:'n2',drug:'hydromorphone-inj',name:'ナルベイン 2mg/1mL',mg:2,ml:1},
 {id:'n20',drug:'hydromorphone-inj',name:'ナルベイン 20mg/2mL',mg:20,ml:2}
];
function candidates({daily,productId,volume,preferredRate,minHours}){
 const p=products.find(p=>p.id===productId);
 if(!p||![daily,volume,preferredRate,minHours].every(n=>Number.isFinite(n)&&n>0))throw Error('量・総液量・目標流速・必要時間は0より大きい数値で入力してください。');
 const max=Math.floor((volume+1e-9)/p.ml),minimum=Math.max(1,Math.ceil(daily*minHours/24/p.mg-1e-9));
 if(!Number.isSafeInteger(max)||max>100000||!Number.isSafeInteger(minimum))throw Error('計算可能な範囲で入力してください。');
 const desired=daily*volume/(24*preferredRate*p.mg),counts=new Set([minimum,max]);
 if(!Number.isFinite(desired)||desired>Number.MAX_SAFE_INTEGER)throw Error('計算可能な範囲で入力してください。');
 for(let n=Math.floor(desired)-2;n<=Math.ceil(desired)+2;n++)counts.add(n);
 return [...counts].filter(n=>n>=minimum&&n<=max).map(n=>{
  const total=n*p.mg,drugVolume=n*p.ml,saline=Math.max(0,volume-drugVolume),concentration=total/volume,rate=daily/24/concentration,hours=volume/rate;
  return {amps:n,total,drugVolume,saline,concentration,rate,hours,rescueMg:daily/24,rescueVolume:rate};
 }).filter(r=>Object.values(r).every(Number.isFinite)&&r.rate>0).sort((a,b)=>Math.abs(Math.log(a.rate/preferredRate))-Math.abs(Math.log(b.rate/preferredRate))||a.amps-b.amps).slice(0,3);
}
const api={products,candidates};if(typeof module!=='undefined')module.exports=api;else root.OpioidPreparation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
