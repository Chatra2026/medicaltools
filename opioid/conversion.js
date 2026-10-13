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
function switchNoteBase(fromId,toId){
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
function switchNote(fromId,toId){
 const from=drugs.find(d=>d.id===fromId);
 if(from?.patch&&toId==='hydromorphone-inj')return 'ナルベイン添付文書では、フェンタニル貼付剤剥離後の血中濃度半減に17時間以上かかるため、剥離直後の使用を避け、適切に時間をあけ低用量から開始することを考慮するとされています。17時間を一律の開始時刻として扱いません。NCC表の一般的な剥離12時間後／疼痛不良時の即時半量という記載とは異なるため、個別に確認してください。';
 const note=switchNoteBase(fromId,toId);
 return toId==='hydromorphone-inj'&&fromId!==toId?note+' 換算比にも差があります：NCC表はモルヒネ注の1/12.5、ナルベイン添付文書はモルヒネ注の1/8を目安としています。本アプリの等鎮痛量はNCC表基準です。':note;
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
function infusion({from,total,volume,rate,rescueVolume,to,targetTotal,targetVolume}){
 const injection=id=>{if(!drugs.some(d=>d.id===id&&d.id.endsWith('-inj')))throw Error('注射剤を選択してください。');};
 injection(from);injection(to);
 const positive=n=>Number.isFinite(n)&&n>0;
 if(![total,volume,rate,targetTotal,targetVolume].every(positive))throw Error('薬剤総量・総液量・流速は0より大きい数値で入力してください。');
 if(rescueVolume!==null&&(!Number.isFinite(rescueVolume)||rescueVolume<0))throw Error('レスキュー量は0以上の数値で入力してください。');
 const concentration=total/volume,targetConcentration=targetTotal/targetVolume;
 const daily=concentration*rate*24,ome=equivalent(from,daily),targetDaily=target(ome,to)[0];
 const result={concentration,targetConcentration,daily,ome:ome[0],targetDaily,targetRate:targetDaily/24/targetConcentration,
  rescueMg:rescueVolume===null?null:concentration*rescueVolume,
  targetRescueMg:rescueVolume===null?null:concentration*rescueVolume/drugs.find(d=>d.id===from).factor[0]*drugs.find(d=>d.id===to).factor[0],
  referenceRescueMg:targetDaily/24};
 result.targetRescueVolume=result.targetRescueMg===null?null:result.targetRescueMg/targetConcentration;
 result.referenceRescueVolume=result.referenceRescueMg/targetConcentration;
 if(Object.values(result).some(x=>x!==null&&(!Number.isFinite(x)||x<0))||concentration===0||targetConcentration===0||daily===0||targetDaily===0||result.targetRate===0)throw Error('計算可能な範囲の数値を入力してください。');
 return result;
}
function clinicalNotes(id,route){
 const notes={
 'morphine-inj':['腎機能障害では活性代謝物などが蓄積し、副作用が強まる可能性があります。他剤からモルヒネへ変更する場合は特に、開始量と観察方法を医師が確認してください。','1%（10mg/mL）と4%（40mg/mL）は濃度が異なります。製剤規格・採取量・希釈後濃度を照合してください。'],
 'oxycodone-inj':['CYP3A4等を介する薬物相互作用に注意。特に抗真菌薬・マクロライド系抗菌薬などの追加時は、過鎮静や呼吸抑制などに注意してください。','腎機能・肝機能、併用薬に応じた用量調節が必要です。本計算では自動補正していません。'],
 'hydromorphone-inj':['高度の腎機能障害では血中濃度が上昇することがあります。腎・肝機能に応じた開始量の調整を医師が確認してください。','2mg/1mLは2mg/mL、20mg/2mLは10mg/mLで、濃度は5倍異なります。切替時に薬剤名だけでなく規格と流速を照合してください。'],
 'fentanyl-inj':['腎排泄される活性代謝物を作らないため腎機能の影響は比較的小さい薬剤ですが、安全な開始量を保証するものではありません。','CYP3A4阻害・誘導薬との相互作用に注意。抗真菌薬・マクロライド系抗菌薬などの追加時は、過鎮静や呼吸抑制などに注意してください。','mgとμgの取り違えに注意：1mg = 1000μg。製剤量・1日量・レスキュー1回量の単位を照合してください。']
 };
 const result=[...(notes[id]||[])];
 if(route==='sc')result.push('持続皮下注は同一部位から一般に1mL/h程度が吸収上限の目安。刺入部の痛み・発赤・硬結や、追加投与時の負担を確認してください。');
 result.push('切替後は疼痛、レスキュー使用状況、眠気・意識状態、呼吸状態、副作用を観察し、必要に応じ医師が投与量を調整してください。等鎮痛量と実際の開始量は一致するとは限りません。');
 return result;
}
const api={drugs,anchors,release,equivalent,target,patchMatches,switchNote,infusion,clinicalNotes};
if(typeof module!=='undefined')module.exports=api;else root.OpioidConversion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
