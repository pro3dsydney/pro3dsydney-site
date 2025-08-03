// ---------- LOGO CAROUSEL ----------
const logos = ['logo1.webp','logo2.webp','logo3.webp','logo4.webp','logo5.webp','logo6.webp','logo7.webp'];
(function buildTrack(){
  const track=document.getElementById('logoTrack');
  if(!track)return;
  const frag=document.createDocumentFragment();
  for(let i=0;i<2;i++){
    logos.forEach(src=>{
      const img=new Image();
      img.src=`assets/Filament_images/${src}`;
      img.loading='lazy';
      frag.appendChild(img);
    });
  }
  track.appendChild(frag);
})();

// ---------- POPUP ----------
setTimeout(()=>{
  const pop=document.getElementById('popup');
  if(pop)pop.classList.remove('hidden');
},15000);
function closePopup(){document.getElementById('popup').classList.add('hidden');}
function scrollToForm(){document.querySelector('.quote-form')?.scrollIntoView({behavior:'smooth'});closePopup();}

// ---------- FORM SUBMISSION ----------
document.getElementById('uploadForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target;
  const email=form.querySelector('#email');
  const phone=form.querySelector('#phone');
  const message=form.querySelector('#message');
  const response=document.getElementById('response');
  const btn=form.querySelector('button[type="submit"]');

  if(!email.value && !phone.value){
    response.textContent='Please provide an email or phone number.';
    return;
  }

  btn.disabled=true;
  response.textContent='Sending…';
  const data=new FormData();
  if(email.value) data.append('email',email.value);
  if(phone.value) data.append('phone',phone.value);
  data.append('message',message.value);

  try{
    const res=await fetch('https://formspree.io/f/mvgqbbdk',{
      method:'POST',body:data,headers:{'Accept':'application/json'}
    });
    if(res.ok){
      response.textContent='Sent! We’ll get back to you shortly.';
      form.reset();
    }else{
      response.textContent='Something went wrong. Please try again.';
    }
  }catch(err){
    console.error(err);
    response.textContent='Network error.';
  }finally{btn.disabled=false;}
});
