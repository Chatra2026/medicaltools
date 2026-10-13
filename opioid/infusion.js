/* UI for diluted continuous infusions. No patient data or pump programming. */
(function(){
const C=OpioidConversion,$=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('ja-JP',{maximumSignificantDigits:6}).format(n);
const fields=['inf-from','inf-total','inf-volume','inf-rate','inf-rescue','inf-to','inf-target-total','inf-target-volume'];
const options=C.drugs.filter(d=>d.id.endsWith('-inj')).map(d=>`<option value="${d.id}">${d.name}（${d.brand}）</option>`).join('');
$('inf-from').innerHTML=options;$('inf-to').innerHTML=options;
function show(){const isInf=$('infusion').getAttribute('aria-pressed')==='true',isSwitch=$('switching').getAttribute('aria-pressed')==='true';$('standard').classList.toggle('hidden',isInf||isSwitch);$('inf-panel').classList.toggle('hidden',!isInf);$('sw-panel').classList.toggle('hidden',!isSwitch);}
$('infusion').addEventListener('click',()=>{for(const id of ['base','rescue','infusion','switching'])$(id).setAttribute('aria-pressed',String(id==='infusion'));show();});
$ ('switching').addEventListener('click',()=>{for(const id of ['base','rescue','infusion','switching'])$(id).setAttribute('aria-pressed',String(id==='switching'));show();});
for(const id of ['base','rescue'])$(id).addEventListener('click',()=>{for(const tab of ['base','rescue','infusion','switching'])$(tab).setAttribute('aria-pressed',String(tab===id));show();});
function drugNote(id){return $(id).value==='hydromorphone-inj'?'ナルベインは2mg/1mLと20mg/2mLなど製剤濃度が異なります。総量はmgで確認。':$(id).value==='fentanyl-inj'?'フェンタニルも薬剤総量はmgで入力。1000 μg = 1 mg。':'製剤から取った薬剤の合計量（mg）を入力してください。';}
function render(){
 $('inf-source-note').textContent=drugNote('inf-from');$('inf-target-note').textContent=drugNote('inf-to');
 const required=fields.filter(id=>id!=='inf-rescue');
 if(required.some(id=>$(id).value==='')){$('inf-result').innerHTML='<p class="muted">現在と変更先の組成、現在のベース流速を入力してください。レスキューは任意です。</p>';return;}
 let r;try{r=C.infusion({from:$('inf-from').value,total:Number($('inf-total').value),volume:Number($('inf-volume').value),rate:Number($('inf-rate').value),rescueVolume:$('inf-rescue').value===''?null:Number($('inf-rescue').value),to:$('inf-to').value,targetTotal:Number($('inf-target-total').value),targetVolume:Number($('inf-target-volume').value)});}catch(e){$('inf-result').innerHTML=`<p class="error">${e.message}</p>`;return;}
 const from=C.drugs.find(d=>d.id===$('inf-from').value),to=C.drugs.find(d=>d.id===$('inf-to').value);
 const mass=(n,id,unit)=>`${fmt(n)} mg/${unit}${id==='fentanyl-inj'?`<small>${fmt(n*1000)} μg/${unit}</small>`:''}`;
 let html=`<div class="ome"><span>現在のベース：経口モルヒネ相当量</span><strong>${fmt(r.ome)} <span>mg/日</span></strong></div><h3>ベースの比較（24時間量）</h3><table><thead><tr><th></th><th>現在：${from.name}</th><th>変更先：${to.name}</th></tr></thead><tbody><tr><td>希釈後の濃度</td><td>${fmt(r.concentration)} mg/mL</td><td>${fmt(r.targetConcentration)} mg/mL</td></tr><tr><td>ベース流速の換算値</td><td>${fmt(Number($('inf-rate').value))} mL/h</td><td>${fmt(r.targetRate)} mL/h</td></tr><tr><td>薬剤1日量</td><td>${mass(r.daily,from.id,'日')}</td><td>${mass(r.targetDaily,to.id,'日')}</td></tr></tbody></table>`;
 html+='<h3>レスキューの比較（1回量）</h3>';
 if(r.rescueMg!==null)html+=`<table><thead><tr><th></th><th>現在</th><th>変更先の等量換算</th></tr></thead><tbody><tr><td>薬剤量</td><td>${mass(r.rescueMg,from.id,'回')}</td><td>${mass(r.targetRescueMg,to.id,'回')}</td></tr><tr><td>液量</td><td>${fmt(Number($('inf-rescue').value))} mL/回</td><td>${fmt(r.targetRescueVolume)} mL/回</td></tr></tbody></table>`;
 else html+='<p class="muted">現在のレスキュー液量が未入力のため、等量換算は表示していません。</p>';
 html+=`<div class="notice" style="margin-top:18px"><b>別計算：変更先ベースの1時間量を用いた参考値</b><br>${mass(r.referenceRescueMg,to.id,'回')} ／ ${fmt(r.referenceRescueVolume)} mL/回<br>出典p.1の目安です。上の「現在のレスキューの等量換算」とは別で、投与量・ロックアウト・投与上限の自動指示ではありません。</div><p class="muted">経口モルヒネ相当量はベースのみ。レスキューの使用回数・1日使用量は加算していません。</p><p class="muted">${C.switchNote(from.id,to.id)}</p>`;
 if($('inf-route').value==='sc'&&(Number($('inf-rate').value)>1||r.targetRate>1))html+='<p class="error">持続皮下注：流速が1 mL/hを超えています。出典p.3では1 mL/h以下とされています。投与部位・濃度・流速を医師に確認してください。</p>';
 html+='<p class="muted">等鎮痛量からの理論流速です。ポンプの設定刻みへの丸め、残液・ルート内薬液・切替時のデッドスペース、不完全交差耐性による調整は計算していません。</p>';
 $('inf-result').innerHTML=html;
}
for(const id of fields.concat('inf-route'))$(id).addEventListener('input',render);
$('inf-reset').addEventListener('click',()=>{for(const id of fields.filter(x=>!['inf-from','inf-to'].includes(x)))$(id).value='';render();});
render();show();
})();
