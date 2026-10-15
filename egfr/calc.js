(function(root){
function stage(g){return g>=90?'G1':g>=60?'G2':g>=45?'G3a':g>=30?'G3b':g>=15?'G4':'G5'}
function calculate(age,sex,cr){if(!Number.isInteger(age)||age<18||!['male','female'].includes(sex)||!Number.isFinite(cr)||cr<=0)throw Error('18歳以上の整数の年齢・性別・0より大きいクレアチニン値を入力してください。');const value=194*Math.pow(cr,-1.094)*Math.pow(age,-0.287)*(sex==='female'?0.739:1);if(!Number.isFinite(value))throw Error('入力値を確認してください。');return {value,stage:stage(value)}}
root.egfr={calculate,stage};if(typeof module!=='undefined')module.exports=root.egfr;
})(typeof window!=='undefined'?window:globalThis);
