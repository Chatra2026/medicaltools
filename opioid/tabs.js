(function(){
const $=id=>document.getElementById(id);
for(const id of ['base','rescue','switching'])$(id).addEventListener('click',()=>{
 for(const tab of ['base','rescue','switching'])$(tab).setAttribute('aria-pressed',String(tab===id));
 $('standard').classList.toggle('hidden',id==='switching');
 $('sw-panel').classList.toggle('hidden',id!=='switching');
});
})();
