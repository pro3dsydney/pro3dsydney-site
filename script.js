/* ---------- LOGO MARQUEE ---------- */
const logos=['logo1.webp','logo2.webp','logo3.webp','logo4.webp','logo5.webp','logo6.webp','logo7.webp'];
(() => {
  const track=document.getElementById('logoTrack'); if(!track) return;
  const frag=document.createDocumentFragment();
  for(let i=0;i<2;i++) logos.forEach(src=>{
    const img=new Image(); img.src=`assets/Filament_images/${src}`; img.loading='lazy'; frag.appendChild(img);
  });
  track.appendChild(frag);
})();

/* ---------- REVIEWS (2 × 5★, 1 × 4★) ---------- */
(() => {
  const data=[
    {q:'Faultless quality, ahead of schedule. Highly recommended!',star:5},
    {q:'Excellent service and flawless finish on every part.',star:5},
    {q:'Print quality was superb — just a bit pricey for the exotic filament I chose.',star:4}
  ];
  const names=['Alex','Jordan','Taylor'];
  const track=document.getElementById('reviewsTrack'); if(!track) return;

  data.forEach((r,i)=>{
    const yr = 2017+Math.floor(Math.random()*8);  /* 2017-2024 */
    const mm = String(Math.floor(Math.random()*12)+1).padStart(2,'0');
    const dd = String(Math.floor(Math.random()*28)+1).padStart(2,'0');
    const card = document.createElement('div'); card.className='review-card';
    const starStr = '★'.repeat(r.star)+'☆'.repeat(5-r.star);
    card.innerHTML = `
      <div class="stars">${starStr} 4.8</div>
      <p>${r.q}</p>
      <div class="name">— ${names[i]} <span>(${dd}/${mm}/${String(yr).slice(2)})</span></div>`;
    track.appendChild(card);
  });

  /* simple arrows on narrow screens */
  const prev=document.querySelector('.rev-prev'), next=document.querySelector('.rev-next');
  if(prev && next){
    const w = () => track.querySelector('.review-card').offsetWidth + 24;
    prev.onclick = () => track.scrollBy({left:-w(),behavior:'smooth'});
    next.onclick = () => track.scrollBy({left: w(),behavior:'smooth'});
  }
})();

/* ---------- POP-UP ---------- */
setTimeout(()=>document.getElementById('popup')?.classList.remove('hidden'),15000);
function closePopup(){document.getElementById('popup').classList.add('hidden');}
function scrollToForm(){document.querySelector('.quote-form')?.scrollIntoView({behavior:'smooth'}); closePopup();}

/* ---------- CONTACT FORM ---------- */
document.getElementById('uploadForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target, resTxt=document.getElementById('response'), btn=form.querySelector('button');
  const email=form.email.value.trim(), phone=form.phone.value.trim(), files=form.files.files, msg=form.message.value.trim();
  if(!email && !phone){resTxt.textContent='Please supply an email or phone.'; return;}
  btn.disabled=true; resTxt.textContent='Uploading…';

  const data=new FormData();
  if(email)   data.append('email',email);
  if(phone)   data.append('phone',phone);
  if(msg)     data.append('message',msg);
  Array.from(files).forEach(f=>data.append('files',f));

  /* POST to backend always (stores file & emails you) */
  try{
    const res=await fetch('https://pro3dsydney-backend.onrender.com/upload',{method:'POST',body:data});
    resTxt.textContent=res.ok?'Success! Check your inbox.':'Upload failed.';
    if(res.ok) form.reset();
  }catch(err){
    console.error(err);
    resTxt.textContent='Network error.';
  }finally{btn.disabled=false;}
});