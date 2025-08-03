// ---------- LOGO MARQUEE ----------
const logos=['logo1.webp','logo2.webp','logo3.webp','logo4.webp','logo5.webp','logo6.webp','logo7.webp'];
(function buildLogoTrack(){const track=document.getElementById('logoTrack');if(!track)return;const frag=document.createDocumentFragment();for(let i=0;i<2;i++){logos.forEach(src=>{const img=new Image();img.src=`assets/Filament_images/${src}`;img.loading='lazy';frag.appendChild(img);});}track.appendChild(frag);})();

// ---------- REVIEWS ----------
(function buildReviews(){
  const names=['Alex','Jordan','Casey','Taylor','Morgan','Riley','Sam','Jamie','Drew','Quinn'];
  const reviews=[
    'Fantastic print quality and super quick turnaround!','Great communication and seriously impressive results.',
    'My go‑to for prototypes—reliable every time.','Affordable yet top‑notch quality, highly recommend.',
    'Exceeded expectations with attention to detail.'
  ];
  const track=document.getElementById('reviewsTrack');if(!track)return;
  for(let i=0;i<6;i++){
    const card=document.createElement('div');card.className='review-card';
    const yr=Math.floor(Math.random()*7)+2019; // 2019‑2025
    const date=`${yr}-${String(Math.floor(Math.random()*12)+1).padStart(2,'0')}-${String(Math.floor(Math.random()*28)+1).padStart(2,'0')}`;
    card.innerHTML=`<div class="stars">★★★★☆ 4.8</div>
      <p>${reviews[Math.floor(Math.random()*reviews.length)]}</p>
      <div class="name">— ${names[Math.floor(Math.random()*names.length)]} <span style="font-weight:400">(${date})</span></div>`;
    track.appendChild(card);
  }
})();

// ---------- POP‑UP ----------
setTimeout(()=>{document.getElementById('popup')?.classList.remove('hidden');},15000);
function closePopup(){document.getElementById('popup').classList.add('hidden');}
function scrollToForm(){document.querySelector('.quote-form')?.scrollIntoView({behavior:'smooth'});closePopup();}

// ---------- CONTACT FORM ----------
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

  // If files are attached, use backend; else use Formspree
  const endpoint=files.length? 'https://pro3dsydney-backend.onrender.com/upload':'https://formspree.io/f/mvgqbbdk';
  try{
    const res=await fetch(endpoint,{method:'POST',body:data,headers:{Accept:'application/json'}});
    response.textContent=res.ok?'Sent! We’ll be in touch shortly.':'Something went wrong – try again.';
    if(res.ok)form.reset();
  }catch(err){console.error(err);response.textContent='Network error.';}
  finally{btn.disabled=false;}
});
