document.addEventListener('DOMContentLoaded',()=>{
 const dialog=document.querySelector('#nurse-lightbox');if(!dialog)return;
 const img=document.querySelector('#nurse-lightbox-image'),caption=document.querySelector('#nurse-lightbox-caption'),close=document.querySelector('#nurse-lightbox-close');
 document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{img.src=button.dataset.photo;img.alt=button.dataset.caption||'';caption.textContent=button.dataset.caption||'';dialog.showModal()}));
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',()=>{img.removeAttribute('src')});
});
