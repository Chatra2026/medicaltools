/* NCC中央病院 オピオイド・鎮静換算表 v6 (2025-04), page 1.
 * factor = drug mg / oral morphine mg. Not a prescribing algorithm.
 */
(function(root){
const drugs=[
 {id:'morphine',name:'モルヒネ経口',brand:'MSコンチン・モルヒネ徐放細粒',rescue:'オプソ・モルヒネ塩酸塩錠／末',factor:[1,1]},
 {id:'oxycodone',name:'オキシコドン経口',brand:'オキシコンチンTR',rescue:'オキノーム',factor:[2/3,2/3]},
 {id:'hydromorphone',name:'ヒドロモルフォン経口',brand:'ナルサス',rescue:'ナルラピド',factor:[1/5,1/5]},
 {id:'tramadol',name:'トラマドール経口',brand:'トラマール・ワントラム',factor:[5,5]},
 {id:'suppository',name:'モルヒネ坐剤',brand:'アンペック',factor:[1/2,2/3]},
 {id:'morphine-inj',name:'モルヒネ注',brand:'モルヒネ塩酸塩注',rescue:'モルヒネ塩酸塩注',factor:[1/2,1/2]},
 {id:'oxycodone-inj',name:'オキシコドン注',brand:'オキシコドン注',rescue:'オキシコドン注',factor:[1/2,1/2]},
 {id:'fentanyl-inj',name:'フェンタニル注',brand:'フェンタニル注',rescue:'フェンタニル注',factor:[1/100,1/100]},
 {id:'hydromorphone-inj',name:'ヒドロモルフォン注',brand:'ナルベイン',rescue:'ナルベイン',factor:[1/25,1/25]},
 {id:'fentos',name:'フェントステープ（1日）',brand:'フェントステープ',patch:[1,2,4,6]},
 {id:'durotep',name:'デュロテップMT（3日）',brand:'デュロテップMT',patch:[2.1,4.2,8.4,12.6]},
 {id:'wond',name:'ワンデュロ（1日）',brand:'ワンデュロ',patch:[0.84,1.7,3.4,5]}
];
const anchors=[30,60,120,180],release=[12.5,25,50,75];
function switchNote(fromId,toId){
 const from=drugs.find(d=>d.id===fromId),to=drugs.find(d=>d.id===toId);
 if(!from||!to)throw Error('不明な薬剤です。');
 if(from.id===to.id)return '同じ薬剤・経路です。切替開始時刻の計算は行いません。';
 if(from.patch&&to.patch)return '貼付剤同士の切替時刻は、この資料では指定されていません。含有量・交換周期が異なるため個別に確認してください。';
 if(from.patch)return '貼付剤を剥がした後：疼痛コントロール良好なら、剥離12時間後に経口・坐剤・注射を開始（出典p.4）。不良なら、特に持続注射へ変更する際、切替予定の半量を剥離と同時に開始するなどの配慮が必要です。疼痛・残存効果を評価し医師が調整してください。';
 if(to.patch){
  if(from.id.endsWith('-inj'))return '貼付時刻を0時間として：元の持続注射を継続し、6時間後に50%へ減量、12時間後に中止する図示（出典p.4）。新しい貼付剤の含有量を注射の1日量として扱わないでください。';
  if(['morphine','oxycodone'].includes(from.id))return '貼付と同時に元の12時間徐放製剤の最終投与を行い、12時間後の次回投与は行わない図示（出典p.4）。入力量は1日量のため、その全量を貼付時に投与する意味ではありません。';
  if(from.id==='hydromorphone')return 'ナルサスなどの24時間製剤は貼付と同時に最終投与する図示（出典p.4）。図の表示範囲は12時間までで、以後の追加投与・具体的な時刻は医師に確認してください。1日量の重複に注意。';
  if(from.id==='suppository')return '元のアンペック坐剤は貼付時と8時間後に投与する図示（出典p.4）。元の処方の1回量を用い、入力した1日量を各回に投与する意味ではありません。';
  return 'トラマドールから貼付剤への具体的な切替時刻は、この資料では指定されていません。適応とオピオイド耐性も含め個別に確認してください。';
 }
 return '経口・坐剤・注射の吸収や投与間隔は異なります。この組合せの「何時間後に開始」は出典に指定がなく、元の製剤の最終投与時刻・作用持続時間・疼痛状態に応じて医師が決定してください。等鎮痛量をそのまま初回処方量にしないでください。';
}
function equivalent(id,amount,strength){
 const d=drugs.find(x=>x.id===id);
 if(!d||!Number.isFinite(amount)||amount<=0)throw Error('0より大きい量を入力してください。');
 if(d.patch){const i=d.patch.indexOf(strength);if(i<0||!Number.isInteger(amount))throw Error('表にある規格と整数の枚数を指定してください。');return [anchors[i]*amount,anchors[i]*amount];}
 const result=[amount/d.factor[1],amount/d.factor[0]];
 if(result.some(x=>!Number.isFinite(x)))throw Error('入力が大きすぎます。');
 return result;
}
function target(ome,id){const d=drugs.find(x=>x.id===id);if(!d?.factor)throw Error('数値換算できない薬剤です。');return [ome[0]*d.factor[0],ome[1]*d.factor[1]];}
function patchMatches(ome,id){const d=drugs.find(x=>x.id===id);return d.patch.filter((s,i)=>Math.abs(ome[0]-anchors[i])<1e-8&&Math.abs(ome[1]-anchors[i])<1e-8);}
const api={drugs,anchors,release,equivalent,target,patchMatches,switchNote};
if(typeof module!=='undefined')module.exports=api;else root.OpioidConversion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
