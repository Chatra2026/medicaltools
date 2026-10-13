(function(){
const C=OpioidConversion,P=OpioidPreparation,$=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('ja-JP',{maximumSignificantDigits:6}).format(n);
$('sw-from').innerHTML=C.drugs.filter(d=>d.factor&&d.id!=='suppository').map(d=>`<option value="${d.id}">${d.name}（${d.brand}）</option>`).join('');
for(const [id,drug]of [['sw-fent','fentanyl-inj'],['sw-naru','hydromorphone-inj']])$(id).innerHTML='<option value="">採用規格を選択</option>'+P.products.filter(p=>p.drug===drug).map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
const fields=['sw-from','sw-dose','sw-volume','sw-flow','sw-hours','sw-fent','sw-naru','sw-fent-start','sw-naru-start','sw-route'];
function render(){
 if(['sw-dose','sw-volume','sw-flow','sw-hours'].some(id=>$(id).value==='')){$('sw-result').innerHTML='<p class="muted">現在の薬剤1日量と調製条件を入力し、採用規格を選択してください。</p>';return;}
 let ome;try{ome=C.equivalent($('sw-from').value,Number($('sw-dose').value));for(const id of ['sw-volume','sw-flow','sw-hours'])if(!Number.isFinite(Number($(id).value))||Number($(id).value)<=0)throw Error('調製条件は0より大きい数値で入力してください。');}catch(e){$('sw-result').innerHTML=`<p class="error">${e.message}</p>`;return;}
 let html=`<div class="ome"><span>NCC表に基づく経口モルヒネ相当量</span><strong>${fmt(ome[0])} <span>mg/日</span></strong></div>`;
 for(const [productId,targetId,startId,name]of [['sw-fent','fentanyl-inj','sw-fent-start','フェンタニル注'],['sw-naru','hydromorphone-inj','sw-naru-start','ナルベイン注']]){
  const eq=C.target(ome,targetId)[0],manual=$(startId).value!=='';let daily=eq;
  html+=`<section style="margin:24px 0"><h3>${name}</h3><p><b>NCC表の等鎮痛量：${fmt(eq)} mg/日</b>${targetId==='fentanyl-inj'?`（${fmt(eq*1000)} μg/日）`:''}</p>`;
  if(targetId==='hydromorphone-inj'){const labelDose=ome[0]/2/8;html+=`<div class="notice">換算基準の違い：NCC表は経口モルヒネの1/25（モルヒネ注の1/12.5）。ナルベイン添付文書はモルヒネ注の1/8を目安としています。モルヒネ注相当量からの添付文書比では ${fmt(labelDose)} mg/日ですが、これは処方推奨ではありません。採用する基準・開始量を医師が確認してください。</div>`;}
  if(manual){daily=Number($(startId).value);if(!Number.isFinite(daily)||daily<=0){html+='<p class="error">開始量は0より大きいmg/日で入力してください。</p></section>';continue;}}
  html+=`<p class="muted">${manual?'医師が決定し入力した開始量':'開始量は未入力。以下はNCC等鎮痛量での計算例'}：${fmt(daily)} mg/日</p>`;
  if(!$(productId).value){html+='<p class="muted">採用規格を選ぶと調製候補を表示します。</p></section>';continue;}
  let rows;try{rows=P.candidates({daily,productId:$(productId).value,volume:Number($('sw-volume').value),preferredRate:Number($('sw-flow').value),minHours:Number($('sw-hours').value)});}catch(e){html+=`<p class="error">${e.message}</p></section>`;continue;}
  const product=P.products.find(p=>p.id===$(productId).value);html+=`<p><b>選択規格：${product.name}</b>（原液 ${fmt(product.mg/product.ml)} mg/mL）</p>`;
  if(!rows.length)html+='<p class="error">この規格・総液量では必要なベース量を満たす候補がありません。規格、総液量、計算対象時間を見直してください。</p>';
  for(const [i,r]of rows.entries()){
   html+=`<details ${i===0?'open':''}><summary>候補${i+1}：${r.amps} A、ベース ${fmt(r.rate)} mL/h</summary><table><tbody><tr><td>薬剤総量</td><td>${fmt(r.total)} mg（${r.amps} A）</td></tr><tr><td>採取する薬液</td><td>${fmt(r.drugVolume)} mL</td></tr><tr><td>生食の計算量</td><td>${fmt(r.saline)} mL</td></tr><tr><td>希釈後の総液量</td><td>${fmt(Number($('sw-volume').value))} mL</td></tr><tr><td>希釈後濃度</td><td>${fmt(r.concentration)} mg/mL</td></tr><tr><td>ベース流速</td><td>${fmt(r.rate)} mL/h</td></tr><tr><td>ベースのみでの計算上の持続時間</td><td>${fmt(r.hours)} 時間</td></tr><tr><td>1時間量のレスキュー参考値</td><td>${fmt(r.rescueMg)} mg/回 ／ ${fmt(r.rescueVolume)} mL/回</td></tr></tbody></table><p class="muted">${manual?'入力した開始量':'NCC等鎮痛量'}での調製計算。持続時間は薬液の保存・使用期限ではありません。レスキュー使用量、プライミング量、残液を含みません。</p>`;
   if($('sw-route').value==='sc'&&r.rate>1)html+='<p class="error">皮下注流速が1 mL/hを超えるため、出典の流速目安を満たしません。</p>';
   html+='</details>';
  }
  html+=`<p class="muted">${C.switchNote($('sw-from').value,targetId)}</p></section>`;
 }
 html+='<p class="muted">候補は選択した規格を整数アンプル使用し、指定時間分のベース量を確保できるものから、希望流速に近い順で最大3件表示。配合・安定性・保存期間・ポンプ性能・臨床上の適否は評価していません。流速の丸めや開始量の減量を自動では行いません。</p>';
 $('sw-result').innerHTML=html;
}
for(const id of fields)$(id).addEventListener('input',()=>{if(['sw-from','sw-dose'].includes(id)){$('sw-fent-start').value='';$('sw-naru-start').value='';}render();});
$('sw-reset').addEventListener('click',()=>{for(const id of ['sw-dose','sw-fent-start','sw-naru-start'])$(id).value='';render();});render();
})();
