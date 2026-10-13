(function(){
const $=id=>document.getElementById(id);
for(const id of ['base','rescue','switching','prescription'])$(id).addEventListener('click',()=>{
 for(const tab of ['base','rescue','switching','prescription'])$(tab).setAttribute('aria-pressed',String(tab===id));
 $('standard').classList.toggle('hidden',id==='switching'||id==='prescription');
 $('sw-panel').classList.toggle('hidden',id!=='switching');
 $('rx-panel').classList.toggle('hidden',id!=='prescription');
});
})();
