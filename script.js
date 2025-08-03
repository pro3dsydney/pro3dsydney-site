// ---------- LOGO MARQUEE ----------
(() => {
  const logos=['logo1.webp','logo2.webp','logo3.webp','logo4.webp','logo5.webp','logo6.webp','logo7.webp'];
  const track=document.getElementById('logoTrack');if(!track)return;
  const frag=document.createDocumentFragment();
  for(let i=0;i<2;i++)logos.forEach(src=>{const img=new Image();img.src=`assets/Filament_images/${src}`;img.loading='lazy';frag.appendChild(img);});
  track.appendChild(frag);
})();

// ---------- REVIEWS SECTION ----------
(() => {
  const REVIEWS=[
    {text:'Faultless quality, ahead of schedule. Highly recommended!',stars:5,name:'Alex'},
    {text:'Excellent service and flawless finish on every part.',stars:5,name:'Jordan'},
    {text:'Print quality was superb — just a bit pricey for the exotic filament I chose.',stars:4,name:'Taylor'}
  ];
  const track=document.getElementById('reviewsTrack');if(!track)return;
  REVIEWS.forEach(r=>{
    const yr=2017+Math.floor(Math.random()*8);  // 2017‑24
    const mm=String(Math.floor(Math.random()*12)+1).padStart(2,'0');
    const dd=String(Math.floor(Math.random()*28)+1).padStart(2,'0');
    const card=document.createElement('div');card.className='review-card';
    const filled='★'.repeat(r.stars), empty='☆'.repeat(5-r.stars);
    card.innerHTML=`<div class="stars">${filled}${empty}</div>
      <p>${r.text}</p>
      <div class="name">— ${r.name} <span>(${dd}/${mm}/${String(yr).slice(2)})</span></div>`;
    track.appendChild(card);
  });
  /* Mobile arrow nav */
  const prev=document.querySelector('.rev-prev'),next=document.querySelector('.rev-next');
  if(prev&&next){
    const jump=()=>track.querySelector('.review-card').offsetWidth+24;
    prev.onclick=()=>track.scrollBy({left:-jump(),behavior:'smooth'});
    next.onclick=()=>track.scrollBy({left: jump(),behavior:'smooth'});
  }
})();

// ---------- POP-UP ----------
setTimeout(()=>document.getElementById('popup')?.classList.remove('hidden'),15000);
function closePopup(){document.getElementById('popup').classList.add('hidden');}
function scrollToForm(){document.querySelector('.quote-form')?.scrollIntoView({behavior:'smooth'});closePopup();}

// ---------- CONTACT FORM (no file upload) ----------
const form=document.getElementById('uploadForm');
form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const response=document.getElementById('response');
  const btn=form.querySelector('button');
  const email=form.email.value.trim();
  const phone=form.phone.value.trim();
  const message=form.message.value.trim();
  if(!email&&!phone){response.textContent='Please supply an email or phone.';return;}
  btn.disabled=true;response.textContent='Sending…';
  const data=new FormData();
  if(email)data.append('email',email);
  if(phone)data.append('phone',phone);
  if(message)data.append('message',message);
  try{
    const r=await fetch('https://formspree.io/f/mvgqbbdk',{method:'POST',body:data,headers:{Accept:'application/json'}});
    response.textContent=r.ok?'Thank you! We’ll be in touch shortly.':'Something went wrong — please retry.';
    if(r.ok)form.reset();
  }catch(err){console.error(err);response.textContent='Network error.';}
  finally{btn.disabled=false;}
});
