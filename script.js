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

/* ---------- REVIEWS (2×5★, 1×4★, dd/mm/yy 2017-24) ---------- */
(() => {
  const reviews = [
    {text:'Faultless quality, ahead of schedule. Highly recommended!', stars:5, name:'Alex'},
    {text:'Excellent service and flawless finish on every part.',        stars:5, name:'Jordan'},
    {text:'Print quality was superb — just a bit pricey for the exotic filament I chose.',
      stars:4, name:'Taylor'}
  ];
  const track = document.getElementById('reviewsTrack'); if(!track) return;

  reviews.forEach(r=>{
    const yr = 2017 + Math.floor(Math.random()*8);          // 2017-24
    const mm = String(Math.floor(Math.random()*12)+1).padStart(2,'0');
    const dd = String(Math.floor(Math.random()*28)+1).padStart(2,'0');
    const filled = '★'.repeat(r.stars);
    const empty  = '☆'.repeat(5 - r.stars);
    const card = document.createElement('div'); card.className='review-card';
    card.innerHTML = `
      <div class="stars">${filled}${empty}  4.8</div>
      <p>${r.text}</p>
      <div class="name">— ${r.name} <span>(${dd}/${mm}/${String(yr).slice(2)})</span></div>`;
    track.appendChild(card);
  });

  /* mobile arrow nav */
  const prev=document.querySelector('.rev-prev'), next=document.querySelector('.rev-next');
  if(prev && next){
    const scrollAmount = () => track.querySelector('.review-card').offsetWidth + 24;
    prev.onclick = () => track.scrollBy({left:-scrollAmount(),behavior:'smooth'});
    next.onclick = () => track.scrollBy({left: scrollAmount(),behavior:'smooth'});
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