(function(){
const $=id=>document.getElementById(id),values={E:null,V:null,M:null},reasons={E:'',V:'',M:''};
$('cards').innerHTML=Object.entries(GCS.items).map(([k,item])=>`<section class="card"><h2>${k} ｜ ${item.name}</h2><div class="muted">${item.english}</div><fieldset><legend>${item.name}の最良の反応を1つ選択</legend>${item.options.map(([value,label,description])=>`<label class="choice"><input type="radio" name="${k}" value="${value}"><span><span class="badge">${k}${value}</span>　<strong>${label}</strong><small>${description}</small></span></label>`).join('')}</fieldset><div id="reason-${k}" class="reason hidden"><label for="reason-input-${k}">NTの理由（任意）</label><input id="reason-input-${k}" type="text" maxlength="200" autocomplete="off" placeholder="${k==='E'?'例：眼瞼腫脹':k==='V'?'例：気管挿管':'例：評価を妨げる麻痺'}"></div></section>`).join('');
function render(){
 const r=GCS.evaluate(values);$('notation').textContent=r.notation;
 $('score').textContent=r.missing.length?'未評価（'+r.missing.join('・')+'未選択）':r.nt.length?'合計算出せず（NTあり）':'GCS '+r.total+'点';
 $('formula').textContent=r.missing.length?'E・V・Mをすべて選ぶと記録用テキストをコピーできます。':r.nt.length?'評価できる項目の内訳を記録します。NTは加算しません。':`${values.E} ＋ ${values.V} ＋ ${values.M} ＝ ${r.total}（3～15点）`;
 $('nt-notice').classList.toggle('hidden',!r.nt.length);$('copy').disabled=!!r.missing.length;
 for(const k of ['E','V','M'])$('reason-'+k).classList.toggle('hidden',values[k]!=='NT');
 $('copy-status').textContent='';$('fallback').classList.add('hidden');
}
for(const radio of document.querySelectorAll('input[type="radio"]'))radio.addEventListener('change',()=>{values[radio.name]=radio.value==='NT'?'NT':Number(radio.value);if(values[radio.name]!=='NT'){reasons[radio.name]='';$('reason-input-'+radio.name).value='';}render();});
for(const k of ['E','V','M'])$('reason-input-'+k).addEventListener('input',()=>{reasons[k]=$('reason-input-'+k).value;render();});
$('reset').addEventListener('click',()=>{for(const k of ['E','V','M']){values[k]=null;reasons[k]='';$('reason-input-'+k).value='';}for(const radio of document.querySelectorAll('input[type="radio"]'))radio.checked=false;render();});
$('copy').addEventListener('click',async()=>{
 let text;try{text=GCS.record(values,reasons);}catch(e){$('copy-status').textContent=e.message;return;}
 try{await navigator.clipboard.writeText(text);$('copy-status').textContent='記録用テキストをコピーしました。';}catch{$('record').value=text;$('fallback').classList.remove('hidden');$('record').focus();$('record').select();$('copy-status').textContent='下のテキストからコピーしてください。';}
});render();
})();
