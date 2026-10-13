const assert=require('node:assert/strict'),C=require('./score.js');
assert.equal(C.evaluate({E:4,V:5,M:6}).total,15);
assert.equal(C.evaluate({E:1,V:1,M:1}).total,3);
assert.equal(C.evaluate({E:3,V:4,M:6}).total,13);
for(const k of ['E','V','M']){
 const s={E:4,V:5,M:6};s[k]='NT';assert.equal(C.evaluate(s).total,null);assert.ok(C.evaluate(s).notation.includes(k+'NT'));
 s[k]=null;assert.equal(C.evaluate(s).total,null);assert.throws(()=>C.record(s));
 for(const invalid of [0,-1,7,1.5,'1',Infinity,NaN]){s[k]=invalid;assert.throws(()=>C.evaluate(s));}
}
assert.match(C.record({E:3,V:4,M:6}),/GCS 13点（E3 V4 M6）/);
assert.match(C.record({E:4,V:'NT',M:6},{V:'気管挿管'}),/VNT：評価不能／理由：気管挿管/);
assert.doesNotMatch(C.record({E:4,V:'NT',M:6}),/GCS 11/);
console.log('PASS: GCS totals, component limits, incomplete evaluations, NT exclusion, recording format.');
const fs=require('node:fs'),vm=require('node:vm'),els={},radios=[];
function el(id){return els[id]??={value:'',textContent:'',disabled:false,events:{},classList:{hidden:new Set(),toggle(k,v){v?this.hidden.add(k):this.hidden.delete(k)},add(k){this.hidden.add(k)},remove(k){this.hidden.delete(k)}},focus(){},select(){},addEventListener(k,f){this.events[k]=f},set innerHTML(v){this.html=v;if(id==='cards')for(const m of v.matchAll(/type="radio" name="([EVM])" value="([^"]+)"/g))radios.push({name:m[1],value:m[2],checked:false,events:{},addEventListener(k,f){this.events[k]=f}})},get innerHTML(){return this.html||''}};}
let copied='';
vm.runInNewContext(fs.readFileSync(__dirname+'/app.js','utf8'),{GCS:C,document:{getElementById:el,querySelectorAll:()=>radios},Number,navigator:{clipboard:{writeText:async t=>{copied=t}}}});
assert.equal(el('copy').disabled,true);assert.match(el('score').textContent,/未評価/);
function choose(k,v){const r=radios.find(r=>r.name===k&&r.value===String(v));assert.ok(r);r.checked=true;r.events.change();}
choose('E',3);choose('V',4);choose('M',6);assert.equal(el('score').textContent,'GCS 13点');assert.equal(el('copy').disabled,false);
choose('V','NT');el('reason-input-V').value='気管挿管';el('reason-input-V').events.input();assert.equal(el('score').textContent,'合計算出せず（NTあり）');
(async()=>{await el('copy').events.click();assert.match(copied,/VNT：評価不能／理由：気管挿管/);el('reset').events.click();assert.equal(el('copy').disabled,true);assert.equal(el('reason-input-V').value,'');assert.equal(radios.some(r=>r.checked),false);console.log('PASS: real UI selection, NT reason, clipboard recording and reset.');})().catch(e=>{console.error(e);process.exitCode=1});
