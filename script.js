/* ---------- LOGO MARQUEE ---------- */
const logos=['logo1.webp','logo2.webp','logo3.webp','logo4.webp','logo5.webp','logo6.webp','logo7.webp'];
(function(){
  const track=document.getElementById('logoTrack');if(!track)return;
  const frag=document.createDocumentFragment();
  for(let i=0;i<2;i++)logos.forEach(src=>{
    const img=new Image();img.src=`assets/Filament_images/${src}`;img.loading='lazy';frag.appendChild(img);
  });
  track.appendChild(frag);
})();

/* ---------- REVIEWS (avg 4.8★) ---------- */
(function(){
  const names=['Alex','Jordan','Casey','Taylor','Morgan','Riley','Sam','Jamie','Drew','Quinn'];
  const quotes=[
    'Fantastic quality and lightning-fast turnaround.',
    'Clear communication and impressive results.',
    'My go-to for functional prototypes—reliable every time.'
  ];
  const track=document.getElementById('reviewsTrack');if(!track)return;
  for(let i=0;i<3;i++){
    const card=document.createElement('div');card.className='review-card';
    const yr=2019+Math.floor(Math.random()*7);
    const mm=String(Math.floor(Math.random()*12)+1).padStart(2,'0');
    const dd=String(Math.floor(Math.random()*28)+1).padStart(2,'0');
    card.innerHTML=`<div class="stars">★★★★☆ 4.8</div>
      <p>${quotes[i]}</p>
      <div class="name">— ${names[i]} <span>(${yr}-${mm}-${dd})</span></div>`;
    track.appendChild(card);
  }

  /* simple arrow navigation on mobile */
  const prev=document.querySelector('.rev-prev'),next=document.querySelector('.rev-next');
  if(prev&&next){
    const scrollByCard=()=>track.querySelector('.review-card').offsetWidth+24;
    prev.onclick=()=>track.scrollBy({left:-scrollByCard(),behavior:'smooth'});
    next.onclick=()=>track.scrollBy({left: scrollByCard(),behavior:'smooth'});
  }
})();

/* ---------- POP-UP ---------- */
setTimeout(()=>document.getElementById('popup')?.classList.remove('hidden'),15000);
function closePopup(){document.getElementById('popup').classList.add('hidden');}
function scrollToForm(){document.querySelector('.quote-form')?.scrollIntoView({behavior:'smooth'});closePopup();}

/* ---------- CONTACT FORM ---------- */
document.getElementById('uploadForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target,response=document.getElementById('response'),btn=form.querySelector('button');
  const email=form.email.value.trim(),phone=form.phone.value.trim(),files=form.files.files,message=form.message.value.trim();
  if(!email&&!phone){response.textContent='Please provide an email or phone.';return;}
  btn.disabled=true;response.textContent='Sending…';

  const data=new FormData();
  if(email)data.append('email',email);
  if(phone)data.append('phone',phone);
  if(message)data.append('message',message);
  if(files.length)Array.from(files).forEach(f=>data.append('files',f));
  const endpoint=files.length?'https://pro3dsydney-backend.onrender.com/upload':'https://formspree.io/f/mvgqbbdk';

  try{
    const res=await fetch(endpoint,{method:'POST',body:data,headers:{Accept:'application/json'}});
    response.textContent=res.ok?'Thanks! We’ll be in touch shortly.':'Something went wrong – please retry.';
    if(res.ok)form.reset();
  }catch(err){console.error(err);response.textContent='Network error.';}
  finally{btn.disabled=false;}
});