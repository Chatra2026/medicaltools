const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const C=require('./conversion.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
// Each column in the reference table must map back to the same oral morphine amount.
for(const d of C.drugs.filter(d=>d.factor&&d.id!=='suppository')){
 for(const m of C.anchors){const q=m*d.factor[0];const ome=C.equivalent(d.id,q);ome.forEach(v=>near(v,m));C.target(ome,d.id).forEach(v=>near(v,q));}
}
for(const d of C.drugs.filter(d=>d.patch))d.patch.forEach((s,i)=>assert.deepEqual(C.equivalent(d.id,1,s),[C.anchors[i],C.anchors[i]]));
assert.deepEqual(C.equivalent('suppository',20),[30,40]);
assert.deepEqual(C.target([60,60],'suppository'),[30,40]);
assert.deepEqual(C.equivalent('hydromorphone',6),[30,30]);
near(C.target([30,30],'fentanyl-inj')[0],.3);
assert.deepEqual(C.patchMatches([60,60],'wond'),[1.7]);
assert.deepEqual(C.patchMatches([50,50],'wond'),[]);
for(const n of [0,-1,NaN,Infinity])assert.throws(()=>C.equivalent('morphine',n));
assert.throws(()=>C.equivalent('fentos',.5,1));
assert.throws(()=>C.equivalent('wond',1,1));
assert.throws(()=>C.equivalent('abstral',100));
assert.match(C.switchNote('fentos','morphine'),/良好.*12時間後/);
assert.match(C.switchNote('morphine-inj','fentos'),/6時間後.*50%.*12時間後/);
assert.match(C.switchNote('oxycodone','fentos'),/最終投与.*12時間後/);
assert.match(C.switchNote('tramadol','fentos'),/指定されていません/);
// Exercise the actual inline UI script, including mode switches and invalid input clearing.
const elements={};
function el(id){return elements[id]??=( {value:'',textContent:'',options:[],events:{},attrs:{},classList:{toggle(){}},focus(){},addEventListener(t,f){this.events[t]=f},setAttribute(k,v){this.attrs[k]=v},set innerHTML(v){this.html=v;this.options=[...v.matchAll(/<option value="([^"]+)"/g)].map(m=>({value:m[1]}));if(this.options.length)this.value=this.options[0].value},get innerHTML(){return this.html||''}});}
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInNewContext(script,{OpioidConversion:C,document:{getElementById:el},Intl,Number,Math,String});
el('drug').value='hydromorphone';el('drug').events.change();el('amount').value='6';el('amount').events.input();
assert.match(el('result').innerHTML,/30 <span>mg\/日/);
assert.match(el('result').innerHTML,/変更時の開始/);
el('amount').value='-1';el('amount').events.input();assert.match(el('result').innerHTML,/error/);assert.doesNotMatch(el('result').innerHTML,/<table>/);
el('rescue').events.click();assert.equal(el('amount').value,'');assert.ok(!el('drug').options.some(o=>o.value==='fentos'));
el('amount').value='2';el('amount').events.input();assert.match(el('result').innerHTML,/10 <span>mg\/回/);assert.doesNotMatch(el('result').innerHTML,/変更時の開始/);
el('reset').events.click();assert.equal(el('amount').value,'');assert.doesNotMatch(el('result').innerHTML,/<table>/);
console.log('PASS: reference columns, range math, patches, invalid inputs, switching notes, UI modes and clearing.');
