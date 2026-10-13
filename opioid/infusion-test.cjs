const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./conversion.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const input={from:'morphine-inj',total:100,volume:100,rate:.5,rescueVolume:.5,to:'fentanyl-inj',targetTotal:2.5,targetVolume:50};
let r=C.infusion(input);
for(const [k,v]of Object.entries({concentration:1,daily:12,ome:24,targetDaily:.24,targetRate:.2,rescueMg:.5,targetRescueMg:.01,targetRescueVolume:.2,referenceRescueVolume:.2}))near(r[k],v);
// Dilution-only changes preserve mass and adjust flow and bolus separately.
r=C.infusion({...input,to:'morphine-inj',targetTotal:200,targetVolume:100,rescueVolume:.3});
near(r.targetRate,.25);near(r.targetRescueVolume,.15);near(r.referenceRescueVolume,.25);
r=C.infusion({...input,to:'hydromorphone-inj',targetTotal:20,targetVolume:100});near(r.targetDaily,.96);near(r.targetRate,.2);
// Reference page 5: validate dose versus speed for all listed concentration columns.
for(const [id,concs]of [['morphine-inj',[1,2,5,10]],['hydromorphone-inj',[.2,.4,.8]],['fentanyl-inj',[.05]]]){
 for(const concentration of concs)for(let i=1;i<=10;i++){
  const rate=i/10;r=C.infusion({...input,from:id,total:concentration*100,volume:100,rate,to:id,targetTotal:concentration*100,targetVolume:100});
  near(r.daily,concentration*rate*24);near(r.targetRate,rate);
 }
}
r=C.infusion({...input,rescueVolume:null});assert.equal(r.targetRescueVolume,null);
r=C.infusion({...input,rescueVolume:0});assert.equal(r.targetRescueVolume,0);
for(const key of ['total','volume','rate','targetTotal','targetVolume'])for(const value of [0,-1,NaN,Infinity])assert.throws(()=>C.infusion({...input,[key]:value}));
assert.throws(()=>C.infusion({...input,from:'morphine'}));assert.throws(()=>C.infusion({...input,rescueVolume:-1}));
assert.throws(()=>C.infusion({...input,total:1e308,rate:1e308}));
// Run both real UI scripts with a minimal DOM and multiple event listeners.
const els={};
function el(id){return els[id]??={value:'',options:[],attrs:{},events:{},hidden:false,textContent:'',classList:{toggle(_,v){el(id).hidden=v}},focus(){},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},addEventListener(k,f){(this.events[k]??=[]).push(f)},fire(k){for(const f of this.events[k]??[])f()},set innerHTML(v){this.html=v;this.options=[...v.matchAll(/<option value="([^"]+)"/g)].map(m=>({value:m[1]}));if(this.options.length)this.value=this.options[0].value},get innerHTML(){return this.html||''}};}
const context=vm.createContext({OpioidConversion:C,document:{getElementById:el},Intl,Number,Math,String});
const html=fs.readFileSync(__dirname+'/index.html','utf8');
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
vm.runInContext(fs.readFileSync(__dirname+'/tabs.js','utf8'),context);
context.OpioidPreparation=require('./preparation.js');
vm.runInContext(fs.readFileSync(__dirname+'/switching.js','utf8'),context);
el('switching').fire('click');assert.equal(el('sw-panel').hidden,false);
for(const [id,value]of Object.entries({'sw-from':'morphine-inj','sw-dose':'30','sw-volume':'50','sw-flow':'.5','sw-hours':'24','sw-fent':'f05','sw-naru':'n2','sw-route':'iv','sw-pump':'amy','sw-min':'.5','sw-max':'30'}))el(id).value=value;
el('sw-dose').fire('input');assert.match(el('sw-result').innerHTML,/0.6 mg\/日/);assert.match(el('sw-result').innerHTML,/2.4 mg\/日/);assert.match(el('sw-result').innerHTML,/2mg\/1mL/);assert.match(el('sw-result').innerHTML,/3.75 mg\/日/);
el('sw-fent-start').value='.3';el('sw-fent-start').fire('input');assert.match(el('sw-result').innerHTML,/医師が決定し入力した開始量：0.3/);
el('sw-dose').value='60';el('sw-dose').fire('input');assert.equal(el('sw-fent-start').value,'');
el('sw-dose').value='-1';el('sw-dose').fire('input');assert.match(el('sw-result').innerHTML,/error/);assert.doesNotMatch(el('sw-result').innerHTML,/<table>/);
el('switching').fire('click');el('base').fire('click');assert.equal(el('sw-panel').hidden,true);assert.equal(el('standard').hidden,false);
console.log('PASS: switching candidate UI, clinical-start override and clearing, label comparison, three-tab navigation.');
