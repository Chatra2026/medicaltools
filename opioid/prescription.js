/* Numeric preparation and prescription verification. No clinical dose decisions. */
(function(root){
const P=typeof module!=='undefined'?require('./preparation.js'):root.OpioidPreparation;
const LIMIT=1e6,EPS=1e-8;
function num(value,name,{zero=false,integer=false}={}){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||(!zero&&value===0)||value>LIMIT||(integer&&!Number.isSafeInteger(value)))throw Error(`${name}は${zero?'0以上':'0より大きい'}${integer?'整数の':''}数値で入力してください。`);
 return value;
}
function device({pumpId,rateMin,rateMax,capacityMl}){
 const pump=P.pumps[pumpId];if(!pump)throw Error('ポンプ機種を選択してください。');
 const min=num(rateMin??pump.min,'実機の流速下限'),max=num(rateMax??pump.max,'実機の流速上限');
 if(min<pump.min-EPS||max>pump.max+EPS||min>max)throw Error('実機の流速上下限が選択機種の参照仕様外です。');
 return {pump,min,max,capacity:num(capacityMl,'実機の容器容量')};
}
function rateOnGrid(value,step){return Math.abs(value/step-Math.round(value/step))<EPS;}
function routeWarnings(drug,route,rate){
 if(!['iv','sc'].includes(route))throw Error('投与経路を選択してください。');
 if(!P.products.some(x=>x.drug===drug))throw Error('注射薬を選択してください。');
 const warnings=[];
 if(route==='sc'&&rate>1+EPS)warnings.push('皮下注の流速がNCC表の目安1 mL/hを超えます。投与部位・投与経路を確認してください。');
 if(route==='sc'&&drug==='fentanyl-inj')warnings.push('フェンタニル「テルモ」の参照添文では、癌性疼痛への持続投与は点滴静注と記載されています。皮下注の適応・根拠・指示を個別に確認してください。');
 return warnings;
}
function analyze(input){
 const {drug,route,pumpId,lines,salineMl,rateMlH,capacityMl}=input;
 const {pump,min,max,capacity}=device({pumpId,rateMin:input.rateMin,rateMax:input.rateMax,capacityMl});
 if(!Array.isArray(lines)||!lines.length)throw Error('薬剤の規格と薬液量を入力してください。');
 let totalMg=0,drugMl=0,discardMg=0,discardMl=0,ampCount=0;
 const breakdown=[];
 for(const l of lines){
  const product=P.products.find(p=>p.id===l.productId);
  if(!product||product.drug!==drug)throw Error('選択薬剤とアンプル規格が一致しません。');
  if(Math.abs(product.mg/product.ml-l.concentration)>EPS&&l.concentration!==undefined)throw Error('アンプル規格と原液濃度が一致しません。');
  const amps=num(l.amps,'アンプル本数',{zero:true,integer:true}),usedMl=num(l.usedMl,'採取する薬液量',{zero:true});
  if(usedMl>amps*product.ml+EPS)throw Error(`${product.name}：採取液量が使用アンプル数の内容量を超えます。`);
  if(amps===0&&usedMl===0)continue;
  const mg=usedMl*product.mg/product.ml,wasteMl=amps*product.ml-usedMl,wasteMg=wasteMl*product.mg/product.ml;
  totalMg+=mg;drugMl+=usedMl;discardMl+=wasteMl;discardMg+=wasteMg;ampCount+=amps;
  breakdown.push({product,amps,usedMl,mg,wasteMl,wasteMg});
 }
 if(!breakdown.length||!totalMg)throw Error('採取する薬液量を入力してください。');
 const saline=num(salineMl,'希釈液量',{zero:true}),rate=num(rateMlH,'持続流速');
 const volume=drugMl+saline,concentration=totalMg/volume,hourly=concentration*rate,daily=hourly*24,baseHours=volume/rate;
 const warnings=routeWarnings(drug,route,rate);
 if(volume>capacity+EPS)warnings.push(`調製全量 ${volume} mL が入力した容器容量 ${capacity} mL を超えます。`);
 if(rate<min-EPS||rate>max+EPS||!rateOnGrid(rate,pump.step))warnings.push(`持続流速 ${rate} mL/h は${pump.name}の確認した範囲・刻み（${min}～${max} mL/h、${pump.step} mL刻み）に一致しません。`);
 if(discardMl>EPS)warnings.push(`開封したアンプルの残液 ${discardMl} mL（${discardMg} mg）は調製量に含めていません。麻薬の残液処理を確認してください。`);
 let bolusMl=0,bolusMg=0,usesPerDay=0,mode='none',lockoutMin=null;
 const pca=input.pca||{mode:'none'};mode=pca.mode;
 if(!['none','expected','actual'].includes(mode))throw Error('PCAの回数区分を選択してください。');
 if(mode!=='none'){
  bolusMl=num(pca.bolusMl,'PCAの1回液量');usesPerDay=num(pca.usesPerDay,'24時間当たりの追加投与回数',{zero:true,integer:true});
  if(pca.lockoutMin!==undefined&&pca.lockoutMin!==null&&pca.lockoutMin!=='')lockoutMin=num(pca.lockoutMin,'ロックアウト時間');
  bolusMg=concentration*bolusMl;
  if(bolusMl<pump.bolusMin-EPS||bolusMl>pump.bolusMax+EPS||!rateOnGrid(bolusMl,pump.bolusStep))warnings.push(`PCA 1回 ${bolusMl} mL は${pump.name}の参照設定範囲・刻み（${pump.bolusMin}～${pump.bolusMax} mL、${pump.bolusStep} mL刻み）に一致しません。`);
  if(bolusMl>volume+EPS)warnings.push('PCA 1回量が調製全量を超えます。');
 }
 const baseMlDay=rate*24,extraMlDay=bolusMl*usesPerDay,combinedMlDay=baseMlDay+extraMlDay;
 const pcaHours=mode==='none'?baseHours:volume*24/combinedMlDay;
 if(combinedMlDay>volume+EPS)warnings.push('現在の持続流速とPCA追加回数が24時間続くと、薬液は24時間より前に不足します。');
 const counts=mode==='none'?[0]:[...new Set([0,usesPerDay,1,3,6])].sort((a,b)=>a-b);
 const scenarios=counts.map(count=>({count,baseMlDay,extraMlDay:bolusMl*count,totalMlDay:baseMlDay+bolusMl*count,hours:volume*24/(baseMlDay+bolusMl*count)}));
 return {drug,route,pump,rateMin:min,rateMax:max,capacity,breakdown,ampCount,drugMl,discardMl,discardMg,salineMl:saline,totalMg,volume,concentration,rate,hourly,daily,baseHours,pca:{mode,bolusMl,bolusMg,usesPerDay,lockoutMin,baseMlDay,extraMlDay,combinedMlDay,hours:pcaHours,scenarios},warnings};
}
function plans({drug,daily,volume,days,productIds,route,pumpId,rateMin,rateMax,capacityMl,pca={mode:'none'}}){
 num(daily,'目標投与量');num(volume,'調製全量');
 if(days!==null&&days!==undefined)num(days,'目標日数');
 const {pump,min,max,capacity}=device({pumpId,rateMin,rateMax,capacityMl});
 routeWarnings(drug,route,0);
 if(volume>capacity+EPS)throw Error('指定した調製全量が実機の容器容量を超えます。');
 if(!Array.isArray(productIds)||!productIds.length||productIds.length>3||new Set(productIds).size!==productIds.length)throw Error('使用可能なアンプル規格を1～3種類選択してください。');
 const products=productIds.map(id=>P.products.find(p=>p.id===id));
 if(products.some(p=>!p||p.drug!==drug))throw Error('薬剤とアンプル規格が一致しません。');
 const pcaCount=pca.mode==='none'?0:num(pca.usesPerDay,'24時間当たりの追加投与回数',{zero:true,integer:true});
 const pcaBolus=pca.mode==='none'?0:num(pca.bolusMl,'PCAの1回液量');
 if(!['none','expected','actual'].includes(pca.mode))throw Error('PCAの回数区分を選択してください。');
 const fraction=days?1-pcaBolus*pcaCount*days/volume:1;
 if(fraction<=0)throw Error('指定した日数では追加投与だけで容器容量を使い切ります。');
 const ideal=days?daily*days/fraction:daily*volume/(24*Math.max(.5,min));
 if(!Number.isFinite(ideal)||ideal>LIMIT)throw Error('計算可能な量で入力してください。');
 const rows=[],seen=new Set();
 function add(parts,used){
  const lines=parts.map((amps,i)=>({productId:products[i].id,amps,usedMl:used[i]})).filter(l=>l.amps);
  if(!lines.length)return;
  const totalMg=lines.reduce((a,l)=>{const p=products.find(p=>p.id===l.productId);return a+l.usedMl*p.mg/p.ml},0);
  const drugMl=lines.reduce((a,l)=>a+l.usedMl,0);
  if(totalMg<=0||drugMl>volume+EPS)return;
  const key=lines.map(l=>l.productId+':'+l.amps+':'+l.usedMl.toFixed(8)).join('|');if(seen.has(key))return;seen.add(key);
  const concentration=totalMg/volume,theoreticalRate=daily/(24*concentration);
  const upper=route==='sc'?Math.min(max,1):max;
  if(upper<min)return;
  const options=P.settings({rate:theoreticalRate,concentration,daily,volume,pumpId,rateMin:min,rateMax:upper});
  if(!options.length)return;
  const selected=options.reduce((a,b)=>Math.abs(a.errorPercent)<=Math.abs(b.errorPercent)?a:b);
  const composition=analyze({drug,route,pumpId,rateMin:min,rateMax:max,capacityMl:capacity,lines,salineMl:Math.max(0,volume-drugMl),rateMlH:selected.rate,pca});
  if(days&&composition.pca.hours+EPS<days*24)composition.warnings.push(`設定流速と追加投与では指定 ${days} 日に対し、薬液が約 ${composition.pca.hours/24} 日で不足します。`);
  rows.push({...composition,targetDaily:daily,targetDays:days??null,theoreticalRate,options,selected,dayDifference:days?composition.pca.hours-days*24:null});
 }
 const maxCounts=products.map(p=>Math.min(30,Math.ceil(volume/p.ml),Math.ceil(ideal/p.mg)+2));
 // Complete ampoule combinations (up to three verified strengths).
 function enumerate(i,parts,usedMl){
  if(i===products.length){add(parts,parts.map((n,j)=>n*products[j].ml));return;}
  for(let n=0;n<=maxCounts[i];n++){
   const next=usedMl+n*products[i].ml;if(next>volume+EPS)break;
   enumerate(i+1,[...parts,n],next);
  }
 }
 enumerate(0,[],0);
 // Partial last ampoule: exact target mass for the specified days or near a 0.5 mL/h flow.
 for(const [i,p]of products.entries()){
  const count=Math.ceil(ideal/p.mg-EPS),take=ideal/(p.mg/p.ml);
  if(count>0&&count<=maxCounts[i]){const ns=products.map((_,j)=>j===i?count:0),us=products.map((_,j)=>j===i?take:0);add(ns,us);}
  for(const [j,q]of products.entries())if(j!==i){
   const full=Math.floor(ideal/p.mg),remain=ideal-full*p.mg;
   if(full>0&&remain>EPS){const other=Math.ceil(remain/q.mg-EPS),ns=products.map((_,k)=>k===i?full:k===j?other:0),us=products.map((_,k)=>k===i?full*p.ml:k===j?remain/(q.mg/q.ml):0);add(ns,us);}
  }
 }
 rows.sort((a,b)=>Math.abs(a.selected.errorPercent)-Math.abs(b.selected.errorPercent)||Math.abs(a.dayDifference??0)-Math.abs(b.dayDifference??0)||a.discardMg-b.discardMg||a.ampCount-b.ampCount);
 const output=rows.slice(0,3);
 // Keep a mixed-strength and a partial-ampoule example visible when feasible.
 for(const predicate of [r=>r.breakdown.length>1,r=>r.discardMl>EPS]){
  const distinct=rows.find(r=>predicate(r)&&!output.includes(r));
  if(distinct&&!output.some(predicate))output.push(distinct);
 }
 for(const row of rows)if(output.length<5&&!output.includes(row))output.push(row);
 return output;
}
const api={analyze,plans};if(typeof module!=='undefined')module.exports=api;else root.OpioidPrescription=api;
})(typeof globalThis!=='undefined'?globalThis:this);
