(function(){
const P=OpioidPreparation,R=OpioidPrescription,C=OpioidConversion,$=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('ja-JP',{maximumSignificantDigits:9}).format(Math.abs(n)<1e-10?0:n);
const input=(id,label,placeholder='',value='')=>`<label for="${id}">${label}</label><input id="${id}" type="number" min="0" step="any" inputmode="decimal" placeholder="${placeholder}" value="${value}">`;
const drugOptions=P.products.filter((p,i,a)=>a.findIndex(x=>x.drug===p.drug)===i).map(p=>`<option value="${p.drug}">${C.drugs.find(d=>d.id===p.drug).name}</option>`).join('');
$('rx-panel').innerHTML=`<div class="notice" style="margin-bottom:18px">換算による等鎮痛量と、実際に医師が決める開始用量は別です。この画面の目標mg/日は入力値をそのまま使います。数値的な整合性と臨床的な適否を分けて確認してください。</div>
<div class="choice-row"><button id="rx-plan" aria-pressed="true" class="active">① 投与量から調製</button><button id="rx-check" aria-pressed="false">② 既存処方を検算</button></div>
<div class="layout" style="margin-top:16px"><section class="card"><h2 id="rx-title">調製条件</h2><label for="rx-drug">注射薬</label><select id="rx-drug">${drugOptions}</select><label for="rx-route">投与経路</label><select id="rx-route"><option value="iv">持続静注</option><option value="sc">持続皮下注</option></select>
<div id="rx-plan-fields">${input('rx-daily','目標のベース投与量（mg/日）','例：30')}<label for="rx-volume">生食で希釈する場合の全量（薬液＋生食）</label><select id="rx-volume"><option value="50">50 mL</option><option value="100" selected>100 mL</option><option value="250">250 mL</option></select>${input('rx-days','目標日数（日）','原液候補には必要。未入力なら全量から希釈案を探索','3')}<p class="muted">原液のままで目標日数を満たす候補を先に表示します。成立しない場合も、生食で全量を指定した候補を確認できます。</p><details><summary>使用できる規格を選択</summary><div id="rx-products" class="choice-row" style="margin-top:14px"></div></details></div>
<div id="rx-check-fields" class="hidden"><label for="rx-product1">アンプル規格</label><select id="rx-product1"></select><div class="compact"><div>${input('rx-amps1','開封本数（A）','例：2')}</div><div>${input('rx-used1','採取薬液量（mL）','例：2')}</div></div><details><summary>異なる規格を併用</summary><label for="rx-product2">追加する規格</label><select id="rx-product2"></select><div class="compact"><div>${input('rx-amps2','開封本数（A）','未使用なら空欄')}</div><div>${input('rx-used2','採取薬液量（mL）','未使用なら空欄')}</div></div></details><div class="compact"><div>${input('rx-saline','希釈液量（mL）','原液なら0')}</div><div>${input('rx-rate','持続流速（mL/h）','例：0.5')}</div></div></div>
<label for="rx-pump">ポンプ・設定モード</label><select id="rx-pump"><option value="amy">エイミーPCA CAP-100（mL）</option><option value="legacy">CADD-Legacy PCA 6300（mL）</option><option value="solis">CADD-Solis VIP PCA（mL）</option></select>
<details><summary>実機設定・容器容量・PCA</summary><div class="compact"><div>${input('rx-min','実機の流速下限（mL/h）','','0.5')}</div><div>${input('rx-max','実機の流速上限（mL/h）','','30')}</div></div>${input('rx-capacity','使用する容器の容量（mL）','','100')}<p class="muted">エイミーMPの参照規格は50・100・300mL。250mLは調製全量として扱い、実際の容器で確認してください。CADDは専用カセット／セットです。</p>
<div id="rx-pca-area"><label for="rx-pca-mode">PCA追加投与</label><select id="rx-pca-mode"><option value="none">レスキューなし</option><option value="expected">想定回数（回/24時間）</option><option value="actual">実績回数（直近24時間、回）</option></select><div id="rx-pca-fields" class="hidden"><div class="compact"><div>${input('rx-bolus','PCA 1回量（mL/回）')}</div><div>${input('rx-count','追加投与（回/24時間）')}</div></div>${input('rx-lockout','ロックアウト（分・任意、指示値）')}</div></div></details>
<button id="rx-clear" style="width:100%;margin-top:18px">数値をクリア</button></section><section class="card" aria-live="polite"><h2>計算結果</h2><div id="rx-result"><p class="muted">目標mg/日を入力してください。</p></div><div class="copybar"><button id="rx-copy" disabled>処方例と計算根拠をコピー</button><span id="rx-copy-status" role="status" class="muted"></span></div></section></div>
<p class="muted">アンプル規格は各製剤のPMDA電子添文に基づきます。候補ごとにPMDA電子添文のリンクと確認日を表示します。調製後の配合変化、安定性、保存条件、使用期限、プライミング後の残量、PCAのロックアウト・回数上限、投与部位と患者の状態は医師・薬剤師と実機で確認してください。計算上の投与可能時間は保存期限ではありません。</p>`;
let mode='plan',lastText='';
function productControls(){
 const list=P.products.filter(p=>p.drug===$('rx-drug').value);
 $('rx-product1').innerHTML=list.map(p=>`<option value="${p.id}">${p.name}（${fmt(p.mg/p.ml)} mg/mL）</option>`).join('');
 $('rx-product2').innerHTML='<option value="">併用しない</option>'+list.map(p=>`<option value="${p.id}">${p.name}（${fmt(p.mg/p.ml)} mg/mL）</option>`).join('');
 $('rx-products').innerHTML=list.map((p,i)=>`<label><input type="checkbox" name="rx-available" value="${p.id}" ${p.id===({'morphine-inj':'m50','oxycodone-inj':'o50','fentanyl-inj':'f05','hydromorphone-inj':'n2'}[$('rx-drug').value])?'checked':''}>${p.name}（${fmt(p.mg/p.ml)} mg/mL）</label>`).join('');
}
function number(id,{empty=false}={}){const s=$(id).value;if(s==='')return empty?null:undefined;return Number(s);}
function math(r){
 const lines=[...r.breakdown.map(b=>`${b.product.name}：${fmt(b.amps)} A × ${fmt(b.product.ml)} mL/A = ${fmt(b.amps*b.product.ml)} mL、採取 ${fmt(b.usedMl)} mL × ${fmt(b.product.mg/b.product.ml)} mg/mL = ${fmt(b.mg)} mg、廃棄 ${fmt(b.wasteMl)} mL（${fmt(b.wasteMg)} mg）`),
 `薬液 ${fmt(r.drugMl)} mL ＋ 生食 ${fmt(r.salineMl)} mL ＝ 全量 ${fmt(r.volume)} mL`,
 `${fmt(r.totalMg)} mg ÷ ${fmt(r.volume)} mL ＝ ${fmt(r.concentration)} mg/mL`,
 `${fmt(r.concentration)} mg/mL × ${fmt(r.rate)} mL/h ＝ ${fmt(r.hourly)} mg/h`,
 `${fmt(r.hourly)} mg/h × 24 ＝ ${fmt(r.daily)} mg/日`,
 `${fmt(r.volume)} mL ÷ ${fmt(r.rate)} mL/h ＝ ベースのみ ${fmt(r.baseHours)} 時間`];
 if(r.pca.mode!=='none')lines.push(`${fmt(r.concentration)} mg/mL × ${fmt(r.pca.bolusMl)} mL/回 ＝ ${fmt(r.pca.bolusMg)} mg/回`,
 `持続 ${fmt(r.rate)} mL/h × 24 ＝ ${fmt(r.pca.baseMlDay)} mL/日、追加 ${fmt(r.pca.bolusMl)} mL/回 × ${r.pca.usesPerDay} 回/日 ＝ ${fmt(r.pca.extraMlDay)} mL/日`,
 `合算 ${fmt(r.pca.baseMlDay)} ＋ ${fmt(r.pca.extraMlDay)} ＝ ${fmt(r.pca.combinedMlDay)} mL/日、${fmt(r.volume)} mL ÷ (${fmt(r.pca.combinedMlDay)} mL/日 ÷ 24) ＝ 約 ${fmt(r.pca.hours)} 時間`);
 return lines;
}
function result(r,{plan=false}={}){
 const recipe=`${r.breakdown.map(b=>b.product.name+' '+fmt(b.amps)+' A（採取'+fmt(b.usedMl)+' mL）').join(' ＋ ')} ＋ 生食 ${fmt(r.salineMl)} mL ＝ 全量 ${fmt(r.volume)} mL、ベース ${fmt(r.rate)} mL/h`;
 const warnings=r.warnings.map(w=>`<p class="warning">${w}</p>`).join('');
 const details=math(r);
 const clinical=C.clinicalNotes(r.drug,r.route);
 const productSources=r.breakdown.map(b=>`<a href="${b.product.source}" target="_blank" rel="noopener">${b.product.name}</a>（${fmt(b.product.concentration)} mg/mL、確認 ${b.product.checked}）`).join(' ／ ');
 const pca=r.pca.mode==='none'?'':`<h4>PCA ${r.pca.mode==='actual'?'実績':'想定'}</h4><p>1回 ${fmt(r.pca.bolusMl)} mL（${fmt(r.pca.bolusMg)} mg）／${r.pca.usesPerDay} 回/24時間${r.pca.lockoutMin?' ／ ロックアウト '+fmt(r.pca.lockoutMin)+' 分（入力値）':''}</p><p>持続 ${fmt(r.pca.baseMlDay)} mL/日 ＋ 追加 ${fmt(r.pca.extraMlDay)} mL/日 ＝ ${fmt(r.pca.combinedMlDay)} mL/日。投与可能 約 ${fmt(r.pca.hours)} 時間</p><details><summary>追加回数別の投与可能時間</summary><table><tbody>${r.pca.scenarios.map(s=>`<tr><td>${s.count} 回/24時間</td><td>${fmt(s.hours)} 時間</td></tr>`).join('')}</tbody></table><p class="muted">24時間当たりの平均回数が続くと仮定。実績から将来の使用回数を保証するものではありません。ロックアウトから最大回数は推定しません。</p></details>`;
 const text=[plan?`目標ベース ${fmt(r.targetDaily)} mg/日（等鎮痛量のまま処方確定しない）`:'既存処方の検算',recipe,`薬剤 ${fmt(r.totalMg)} mg、濃度 ${fmt(r.concentration)} mg/mL、ベース ${fmt(r.daily)} mg/日、持続のみ ${fmt(r.baseHours)} 時間`,...(plan?[`目標日数 ${r.targetDays??'指定なし'} 日、理論流速 ${fmt(r.theoreticalRate)} mL/h、実機設定 ${fmt(r.rate)} mL/h、目標との差 ${fmt(r.daily-r.targetDaily)} mg/日（${fmt((r.daily/r.targetDaily-1)*100)}%）`]:[]),...(r.pca.mode==='none'?[]:[`PCA ${fmt(r.pca.bolusMl)} mL/回（${fmt(r.pca.bolusMg)} mg/回）、${r.pca.mode==='actual'?'実績':'想定'} ${r.pca.usesPerDay} 回/日、ロックアウト ${r.pca.lockoutMin??'未入力'} 分、持続＋追加で約 ${fmt(r.pca.hours)} 時間`]),'計算根拠：',...details,...r.warnings.map(w=>'要確認：'+w),'臨床上の留意事項：',...clinical].join('\n');
 return {html:`<p><b>${recipe}</b></p><div class="ome"><span>ベースの計算上の投与量</span><strong>${fmt(r.daily)} <span>mg/日${r.drug==='fentanyl-inj'?'（'+fmt(r.daily*1000)+' μg/日）':''}</span></strong></div>${plan?`<p>目標 ${fmt(r.targetDaily)} mg/日${r.targetDays?' ／ 目標 '+fmt(r.targetDays)+' 日':''}、理論流速 ${fmt(r.theoreticalRate)} mL/h、設定流速 ${fmt(r.rate)} mL/h<br>丸めによる差 ${fmt(r.daily-r.targetDaily)} mg/日（${fmt((r.daily/r.targetDaily-1)*100)}%）</p>`:''}<p>薬剤 ${fmt(r.totalMg)} mg ／ 原液 ${fmt(r.drugMl)} mL ／ 廃棄 ${fmt(r.discardMl)} mL ／ 生食 ${fmt(r.salineMl)} mL ／ 濃度 ${fmt(r.concentration)} mg/mL</p><p>時間当たり ${fmt(r.hourly)} mg/h ／ ベースのみ 約 ${fmt(r.baseHours)} 時間</p>${pca}${warnings}<details><summary>調製・投与量・PCAの計算根拠</summary><p class="muted">${details.join('<br>')}</p></details><details><summary>規格の出典と臨床上の留意事項</summary><p class="muted">${productSources}</p><ul class="muted">${clinical.map(n=>`<li>${n}</li>`).join('')}</ul></details>`,text};
}
function render(){
 $('rx-copy-status').textContent='';lastText='';$('rx-copy').disabled=true;
 try{
  if(mode==='plan'){
   if($('rx-daily').value===''){$('rx-result').innerHTML='<p class="muted">目標のベース投与量（mg/日）を入力してください。</p>';return;}
   const ids=[...$('rx-products').querySelectorAll('input:checked')].map(x=>x.value);
   const pcaMode=$('rx-pca-mode').value;if(pcaMode!=='none'&&['rx-bolus','rx-count'].some(id=>$(id).value==='')){$('rx-result').innerHTML='<p class="muted">PCAの1回量と回数を入力してください。</p>';return;}const pca=pcaMode==='none'?{mode:'none'}:{mode:pcaMode,bolusMl:number('rx-bolus'),usesPerDay:number('rx-count'),lockoutMin:number('rx-lockout',{empty:true})};const rawDays=number('rx-days',{empty:true});const params={pca,drug:$('rx-drug').value,daily:number('rx-daily'),volume:number('rx-volume'),days:number('rx-days',{empty:true}),productIds:ids,route:$('rx-route').value,pumpId:$('rx-pump').value,rateMin:number('rx-min'),rateMax:number('rx-max'),capacityMl:number('rx-capacity')};const raw=rawDays?R.rawPlans({...params,days:rawDays}):[];let rows=[],dilutedError='';try{rows=R.plans(params);}catch(e){dilutedError=e.message;if(!raw.length)throw e;}
   if(!rows.length&&!raw.length){$('rx-result').innerHTML='<p class="error">この条件でポンプに設定できる調製候補はありません。使用規格・容器・流速上下限を確認してください。</p>';return;}
   const rawItems=raw.map((r,i)=>{const t=result(r,{plan:true});return {html:`<details ${i===0?'open':''}><summary>原液${i+1}：${r.breakdown[0].product.name} ${r.ampCount} A ／ 生食0 mL ／ ${fmt(r.rate)} mL/h ／ 約 ${fmt(r.pca.hours/24)} 日</summary>${t.html}</details>`,text:`原液${i+1}\n${t.text}`};});const items=rows.map((r,i)=>{const t=result(r,{plan:true});return {html:`<details ${i===0?'open':''}><summary>候補${i+1}：${r.breakdown.map(b=>b.product.mg+'mg×'+b.amps+'A').join('＋')} ／ 生食 ${fmt(r.salineMl)} mL ／ ${fmt(r.rate)} mL/h ／ 廃棄 ${fmt(r.discardMl)} mL</summary>${t.html}</details>`,text:`候補${i+1}\n${t.text}`};});
   $('rx-result').innerHTML='<p class="muted">目標日数は薬液の量を決めるための条件で、保存・使用期限ではありません。実機設定でのmg/日と廃棄量も確認してください。</p><h3>原液（生食なし）</h3>'+(rawItems.length?rawItems.map(x=>x.html).join(''):`<p class="warning">${rawDays?'この目標量・目標日数・採用規格では、実機の流速刻みと容器容量を満たす原液候補がありません。流速上下限を確認し、希釈案も検討してください。':'目標日数が未入力のため原液候補を計算していません。'}</p>`)+'<h3>生食で全量を指定する候補</h3>'+(items.length?items.map(x=>x.html).join(''):`<p class="warning">${dilutedError||'この全量・規格・目標日数では設定可能な候補がありません。'}</p>`);lastText=[...rawItems,...items].map(x=>x.text).join('\n\n');
  }else{
   if(['rx-amps1','rx-used1','rx-saline','rx-rate'].some(id=>$(id).value==='')){$('rx-result').innerHTML='<p class="muted">規格・本数・採取薬液量・希釈液量・流速を入力してください。原液なら希釈液量に0を入力します。</p>';return;}
   const lines=[{productId:$('rx-product1').value,amps:number('rx-amps1'),usedMl:number('rx-used1')}];
   if($('rx-product2').value||$('rx-amps2').value||$('rx-used2').value){if(!$('rx-product2').value||$('rx-amps2').value===''||$('rx-used2').value==='')throw Error('追加規格の本数・採取液量を揃えて入力してください。');lines.push({productId:$('rx-product2').value,amps:number('rx-amps2'),usedMl:number('rx-used2')});}
   const mode=$('rx-pca-mode').value;
   if(mode!=='none'&&['rx-bolus','rx-count'].some(id=>$(id).value==='')){$('rx-result').innerHTML='<p class="muted">PCAの1回量と24時間当たりの回数を入力してください。</p>';return;}
   const r=R.analyze({drug:$('rx-drug').value,route:$('rx-route').value,lines,salineMl:number('rx-saline'),rateMlH:number('rx-rate'),pumpId:$('rx-pump').value,rateMin:number('rx-min'),rateMax:number('rx-max'),capacityMl:number('rx-capacity'),pca:mode==='none'?{mode}:{mode,bolusMl:number('rx-bolus'),usesPerDay:number('rx-count'),lockoutMin:number('rx-lockout',{empty:true})}});
   const out=result(r);$('rx-result').innerHTML=out.html;lastText=out.text;
  }
  $('rx-copy').disabled=false;
 }catch(e){$('rx-result').innerHTML=`<p class="error">${e.message}</p>`;}
}
for(const id of ['rx-plan','rx-check'])$(id).addEventListener('click',()=>{mode=id==='rx-plan'?'plan':'check';for(const m of ['rx-plan','rx-check']){$(m).setAttribute('aria-pressed',String(m===id));$(m).classList.toggle('active',m===id);}$('rx-plan-fields').classList.toggle('hidden',mode!=='plan');$('rx-check-fields').classList.toggle('hidden',mode!=='check');$('rx-title').textContent=mode==='plan'?'調製条件':'既存処方を入力';render();});
$('rx-drug').addEventListener('change',()=>{productControls();for(const id of ['rx-amps1','rx-used1','rx-amps2','rx-used2'])$(id).value='';render();});
$('rx-pump').addEventListener('change',()=>{const p=P.pumps[$('rx-pump').value];$('rx-min').value=$('rx-pump').value==='amy'?'0.5':String(p.min);$('rx-max').value=String(p.max);render();});
$('rx-pca-mode').addEventListener('change',()=>{$('rx-pca-fields').classList.toggle('hidden',$('rx-pca-mode').value==='none');render();});
$('rx-panel').addEventListener('input',e=>{if(!['rx-plan','rx-check','rx-copy'].includes(e.target.id))render();});
$('rx-panel').addEventListener('change',e=>{if(!['rx-drug','rx-pump','rx-pca-mode'].includes(e.target.id))render();});
$('rx-clear').addEventListener('click',()=>{for(const id of ['rx-daily','rx-days','rx-amps1','rx-used1','rx-amps2','rx-used2','rx-saline','rx-rate','rx-bolus','rx-count','rx-lockout'])$(id).value='';render();});
$('rx-copy').addEventListener('click',()=>OpioidCopy.write(lastText,'rx-copy-status'));
productControls();render();
})();
