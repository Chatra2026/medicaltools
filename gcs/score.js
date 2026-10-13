(function(root){
const items={
 E:{name:'開眼',english:'Eye opening',max:4,options:[
  [4,'自然に開眼','声や身体刺激を加える前から開眼している。'],
  [3,'呼びかけで開眼','通常の声や大きな声への反応として開眼する。'],
  [2,'圧刺激で開眼','身体への圧刺激で開眼する。'],
  [1,'開眼しない','適切に評価しても開眼せず、評価を妨げる局所因子もない。'],
  ['NT','評価不能','眼の腫脹などで開眼を評価できない。']]},
 V:{name:'言語反応',english:'Verbal response',max:5,options:[
  [5,'見当識が保たれる','自分の名前・いる場所・日付について正しく答えられる。'],
  [4,'混乱した会話','見当識に誤りがあるが、会話として受け答えが成立する。'],
  [3,'単語での反応','意味のわかる単語は出るが、会話として成立しない。'],
  [2,'声・うめきのみ','うめき声などは出るが、意味のわかる言葉にならない。'],
  [1,'発声しない','適切に評価しても発声せず、評価を妨げる要因もない。'],
  ['NT','評価不能','挿管などで言語反応を評価できない。']]},
 M:{name:'最良の運動反応',english:'Best motor response',max:6,options:[
  [6,'指示に従う','2段階の指示に沿った動作を行える。'],
  [5,'刺激部位に手を持っていく','頭・頸部の刺激に対して、手を鎖骨より上へ持っていき、刺激部位へ向かう。'],
  [4,'正常な屈曲・逃避','刺激に対して肘を速く曲げ、腕を引っ込める。明らかな異常屈曲の特徴がない。'],
  [3,'異常な屈曲','ゆっくりした定型的な屈曲で、腕が胸の前へ寄る・前腕が内旋するなどの異常姿勢を示す。'],
  [2,'伸展','刺激に対して肘が伸びる。'],
  [1,'運動反応なし','適切に評価しても四肢が動かず、評価を妨げる要因もない。'],
  ['NT','評価不能','麻痺などの制限因子のため運動反応を評価できない。']]}
};
function evaluate(values){
 for(const k of ['E','V','M'])if(values[k]!==null&&values[k]!==undefined&&values[k]!=='NT'&&(!Number.isInteger(values[k])||values[k]<1||values[k]>items[k].max))throw Error('不正な評価値です。');
 const missing=['E','V','M'].filter(k=>values[k]===null||values[k]===undefined);
 const nt=['E','V','M'].filter(k=>values[k]==='NT');
 return {missing,nt,total:missing.length||nt.length?null:values.E+values.V+values.M,notation:['E','V','M'].map(k=>k+(values[k]??'—')).join(' ')};
}
function record(values,reasons={}){
 const r=evaluate(values);if(r.missing.length)throw Error('E・V・Mをすべて選択してください。');
 const lines=[`GCS ${r.total===null?'合計算出せず（NTあり）':r.total+'点'}（${r.notation}）`];
 for(const k of ['E','V','M']){const o=items[k].options.find(o=>o[0]===values[k]);lines.push(`${k}${values[k]}：${o[1]}${values[k]==='NT'?'／理由：'+(String(reasons[k]||'').trim()||'未記載'):''}`);}
 return lines.join('\n');
}
const api={items,evaluate,record};if(typeof module!=='undefined')module.exports=api;else root.GCS=api;
})(typeof globalThis!=='undefined'?globalThis:this);
