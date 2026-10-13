(function(){
const C=OpioidConversion,P=OpioidPreparation,$=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('ja-JP',{maximumSignificantDigits:6}).format(n);
$('sw-from').innerHTML=C.drugs.filter(d=>d.factor&&d.id!=='suppository').map(d=>`<option value="${d.id}">${d.name}（${d.brand}）</option>`).join('');
for(const [id,drug]of [['sw-fent','fentanyl-inj'],['sw-naru','hydromorphone-inj']])$(id).innerHTML='<option value="">採用規格を選択</option>'+P.products.filter(p=>p.drug===drug).map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
const fields=['sw-from','sw-dose','sw-volume','sw-hours','sw-fent','sw-naru','sw-fent-start','sw-naru-start','sw-route','sw-pump','sw-min','sw-max'];
function render(){
 if(['sw-dose','sw-volume','sw-hours'].some(id=>$(id).value==='')){$('sw-result').innerHTML='<p class="muted">現在の薬剤1日量と調製条件を入力し、採用規格を選択してください。</p>';return;}
 let ome;try{ome=C.equivalent($('sw-from').value,Number($('sw-dose').value));for(const id of ['sw-volume','sw-hours'])if(!Number.isFinite(Number($(id).value))||Number($(id).value)<=0)throw Error('調製条件は0より大きい数値で入力してください。');}catch(e){$('sw-result').innerHTML=`<p class="error">${e.message}</p>`;return;}
 let html=`<div class="ome"><span>NCC表に基づく経口モルヒネ相当量</span><strong>${fmt(ome[0])} <span>mg/日</span></strong></div>`;
 for(const [productId,targetId,startId,name]of [['sw-fent','fentanyl-inj','sw-fent-start','フェンタニル注'],['sw-naru','hydromorphone-inj','sw-naru-start','ナルベイン注']]){
  const eq=C.target(ome,targetId)[0],manual=$(startId).value!=='';let daily=eq;
  html+=`<section style="margin:24px 0"><h3>${name}</h3><p><b>NCC表の等鎮痛量：${fmt(eq)} mg/日</b>${targetId==='fentanyl-inj'?`（${fmt(eq*1000)} μg/日）`:''}</p>`;
  if(targetId==='hydromorphone-inj'){const labelDose=ome[0]/2/8;html+=`<div class="notice">換算基準の違い：NCC表は経口モルヒネの1/25（モルヒネ注の1/12.5）。ナルベイン添付文書はモルヒネ注の1/8を目安としています。モルヒネ注相当量からの添付文書比では ${fmt(labelDose)} mg/日ですが、これは処方推奨ではありません。採用する基準・開始量を医師が確認してください。</div>`;}
  if(manual){daily=Number($(startId).value);if(!Number.isFinite(daily)||daily<=0){html+='<p class="error">開始量は0より大きいmg/日で入力してください。</p></section>';continue;}}
  html+=`<p class="muted">${manual?'医師が決定し入力した開始量':'開始量は未入力。以下はNCC等鎮痛量での計算例'}：${fmt(daily)} mg/日</p>`;
  if(!$(productId).value){html+='<p class="muted">採用規格を選ぶと調製候補を表示します。</p></section>';continue;}
  let rows;try{rows=P.candidates({daily,productId:$(productId).value,volume:Number($('sw-volume').value),preferredRate:Math.max(.5,Number($('sw-min').value)),minHours:Number($('sw-hours').value),pumpId:$('sw-pump').value,rateMin:Number($('sw-min').value),rateMax:Math.min(Number($('sw-max').value),$('sw-route').value==='sc'?1:Infinity)});}catch(e){html+=`<p class="error">${e.message}</p></section>`;continue;}
  const product=P.products.find(p=>p.id===$(productId).value);html+=`<p><b>選択規格：${product.name}</b>（原液 ${fmt(product.mg/product.ml)} mg/mL）</p>`;
  if(!rows.length)html+='<p class="error">この規格・総液量・ポンプ上下限では、計算対象時間を満たす設定可能な候補がありません。規格、総液量、計算対象時間を見直してください。</p>';
  for(const [i,r]of rows.entries()){
   html+=`<details ${i===0?'open':''}><summary>候補${i+1}：${r.amps} A、全量 ${fmt(Number($('sw-volume').value))} mL</summary><table><tbody><tr><td>薬剤総量</td><td>${fmt(r.total)} mg（${r.amps} A）</td></tr><tr><td>採取する薬液</td><td>${fmt(r.drugVolume)} mL</td></tr><tr><td>生食の計算量</td><td>${fmt(r.saline)} mL</td></tr><tr><td>希釈後の総液量</td><td>${fmt(Number($('sw-volume').value))} mL</td></tr><tr><td>希釈後濃度</td><td>${fmt(r.concentration)} mg/mL</td></tr><tr><td>1日投与量からの理論流速</td><td>${fmt(r.rate)} mL/h</td></tr><tr><td>ベースのみでの計算上の持続時間</td><td>${fmt(r.hours)} 時間</td></tr><tr><td>1時間量のレスキュー参考値</td><td>${fmt(r.rescueMg)} mg/回 ／ ${fmt(r.rescueVolume)} mL/回</td></tr></tbody></table><p class="muted">${manual?'入力した開始量':'NCC等鎮痛量'}での調製計算。持続時間は薬液の保存・使用期限ではありません。レスキュー使用量、プライミング量、残液を含みません。</p>`;
   const pump=P.pumps[$('sw-pump').value];html+=`<h4>${pump.name}：設定可能な近傍値</h4><p class="muted">理論流速を自動採用せず、下側・上側の設定値を比較表示します。実際の投与量の差を確認してください。</p>`;for(const setting of r.settings){html+=`<div class="notice" style="margin-top:10px"><b>ベース ${fmt(setting.rate)} mL/h</b><br>実際のベース1日量 ${fmt(setting.daily)} mg/日 ／ 目標との差 ${setting.errorPercent>=0?'+':''}${fmt(setting.errorPercent)}%<br>ベースのみ ${fmt(setting.hours)} 時間分<br>このベースの1時間量に対するドーズ近傍値：${setting.rescue.map(b=>`${fmt(b.volume)} mL/回（${fmt(b.mg)} mg/回、差 ${b.errorPercent>=0?'+':''}${fmt(b.errorPercent)}%）`).join(' ／ ')||'設定範囲内の近傍値なし'}</div>`;}
   if($('sw-route').value==='sc'&&r.rate>1)html+='<p class="error">皮下注流速が1 mL/hを超えるため、出典の流速目安を満たしません。</p>';
   html+='</details>';
  }
  html+=`<p class="muted">${C.switchNote($('sw-from').value,targetId)}</p></section>`;
 }
 html+='<p class="muted">候補は整数アンプルと指定全量で探索。指定した実機上下限・0.1mL/h刻み・計算対象時間を満たす設定を持つ候補から、1日量のずれが小さい順、次に0.5mL/h（実機下限がそれより高ければ下限）に近い順で最大3件表示。皮下注では上限1mL/hで探索します。CADDはmL単位のPCAモードを前提とし、mg・μgモードの濃度設定や刻みは適用しません。施設の薬剤ライブラリ・ドーズ上下限・ロックアウトは未評価です。配合・安定性・保存期間・臨床上の適否やポンプ実流量精度も評価していません。開始量の自動減量は行いません。</p>';
 $('sw-result').innerHTML=html;
}
for(const id of fields)$(id).addEventListener('input',()=>{if(id==='sw-pump'){const p=P.pumps[$('sw-pump').value];$('sw-min').value=$('sw-pump').value==='amy'?'0.5':String(p.min);$('sw-max').value=String(p.max);$('sw-pump-note').textContent=p.name+'：ベース0.1mL/h刻み、ドーズ'+p.bolusStep+'mL刻み。表示した上下限を実機で確認してください。';}if(['sw-from','sw-dose'].includes(id)){$('sw-fent-start').value='';$('sw-naru-start').value='';}render();});
$('sw-reset').addEventListener('click',()=>{for(const id of ['sw-dose','sw-fent-start','sw-naru-start'])$(id).value='';render();});render();
})();
