(function(root){
function extract(id){
 const html=document.getElementById(id).innerHTML.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:tr|p|div|details|section|table)>/gi,'\n');
 const el=document.createElement('div');el.innerHTML=html;return el.textContent.replace(/\n{3,}/g,'\n\n').trim();
}
async function write(value,statusId){
 const status=document.getElementById(statusId);if(!value)return;
 try{await navigator.clipboard.writeText(value);status.textContent='コピーしました。';}
 catch{
  const box=document.getElementById('copy-fallback');box.classList.remove('hidden');
  const field=document.getElementById('copy-fallback-text');field.value=value;field.focus();field.select();
  status.textContent='自動コピーできませんでした。下のテキストを選択してコピーしてください。';
 }
}
const api={extract,write};root.OpioidCopy=api;
for(const [button,result,status]of [['copy','result','copy-status'],['sw-copy','sw-result','sw-copy-status']])document.getElementById(button).addEventListener('click',()=>write(extract(result),status));
})(typeof globalThis!=='undefined'?globalThis:this);
