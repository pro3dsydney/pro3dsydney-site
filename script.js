/* ---------- LOGO MARQUEE ---------- */
const logos=['logo1.webp','logo2.webp','logo3.webp','logo4.webp','logo5.webp','logo6.webp','logo7.webp'];
(function buildTrack(){
  const track=document.getElementById('logoTrack');if(!track)return;
  const frag=document.createDocumentFragment();
  for(let i=0;i<2;i++){logos.forEach(src=>{
    const img=new Image();img.src=`assets/Filament_images/${src}`;img.loading='lazy';frag.appendChild(img);
  });}
  track.appendChild(frag);
})();

/* ---------- POP-UP ---------- */
setTimeout(()=>{document.getElementById('popup')?.classList.remove('hidden');},15000);
function closePopup(){document.getElementById('popup').classList.add('hidden');}
function scrollToForm(){document.querySelector('.quote-form')?.scrollIntoView({behavior:'smooth'});closePopup();}

/* ---------- CONTACT FORM ---------- */
document.getElementById('uploadForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target,response=document.getElementById('response'),btn=form.querySelector('button');
  const email=form.email.value.trim(),phone=form.phone.value.trim();
  if(!email && !phone){response.textContent='Please provide an email or phone number.';return;}
  btn.disabled=true;response.textContent='Sending…';

  const data=new FormData();
  if(email)data.append('email',email);
  if(phone)data.append('phone',phone);
  data.append('message',form.message.value.trim());

  try{
    const res=await fetch('https://formspree.io/f/mvgqbbdk',{method:'POST',body:data,headers:{Accept:'application/json'}});
    response.textContent=res.ok?'Sent! We’ll be in touch shortly.':'Something went wrong – try again.';
    if(res.ok)form.reset();
  }catch(err){console.error(err);response.textContent='Network error.';}
  finally{btn.disabled=false;}
});