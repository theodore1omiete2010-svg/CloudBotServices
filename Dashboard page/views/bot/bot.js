export function init(){
  const btn=document.getElementById("botPageToggle");
  if(!btn || btn.dataset.bound) return;
  btn.dataset.bound="1";
  let online=true;
  btn.addEventListener("click",()=>{
    online=!online;
    btn.textContent=online?"Pause Bot":"Resume Bot";
  });
}