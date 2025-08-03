/* ========== LOGO MARQUEE ========== */
const logos = ['logo1.webp','logo2.webp','logo3.webp','logo4.webp','logo5.webp','logo6.webp','logo7.webp'];
(function buildLogoTrack(){
  const track = document.getElementById('logoTrack');
  if(!track) return;
  const frag = document.createDocumentFragment();
  for(let i=0;i<2;i++){
    logos.forEach(src=>{
      const img = new Image();
      img.src = `assets/Filament_images/${src}`;
      img.loading = 'lazy';
      frag.appendChild(img);
    });
  }
  track.appendChild(frag);
})();

/* ========== REVIEWS (4.8 ⭐ random) ========== */
(function buildReviews(){
  const names   = ['Alex','Jordan','Casey','Taylor','Morgan','Riley','Sam','Jamie','Drew','Quinn'];
  const quotes  = [
    'Fantastic quality and lightning-fast turnaround.',
    'Clear communication and impressive results.',
    'My go-to for functional prototypes—reliable every time.',
    'Affordable yet top-notch. Highly recommended.',
    'Exceeded expectations on detail and finish.'
  ];
  const track = document.getElementById('reviewsTrack');
  if(!track) return;
  for(let i=0;i<6;i++){
    const card  = document.createElement('div');
    card.className = 'review-card';
    const yr    = 2019 + Math.floor(Math.random()*7);          // 2019-2025
    const mm    = String(Math.floor(Math.random()*12)+1).padStart(2,'0');
    const dd    = String(Math.floor(Math.random()*28)+1).padStart(2,'0');
    const date  = `${yr}-${mm}-${dd}`;
    card.innerHTML = `
      <div class="stars">★★★★☆ 4.8</div>
      <p>${quotes[Math.floor(Math.random()*quotes.length)]}</p>
      <div class="name">— ${names[Math.floor(Math.random()*names.length)]} <span>(${date})</span></div>`;
    track.appendChild(card);
  }
})();

/* ========== POP-UP ========== */
setTimeout(()=>document.getElementById('popup')?.classList.remove('hidden'),15000);
function closePopup(){document.getElementById('popup').classList.add('hidden');}
function scrollToForm(){
  document.querySelector('.quote-form')?.scrollIntoView({behavior:'smooth'});
  closePopup();
}

/* ========== CONTACT FORM ========== */
document.getElementById('uploadForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form = e.target;
  const response = document.getElementById('response');
  const btn = form.querySelector('button');
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const files = form.files.files;
  const message = form.message.value.trim();

  if(!email && !phone){response.textContent = 'Please provide an email or phone.';return;}

  btn.disabled = true;
  response.textContent = 'Sending…';

  const data = new FormData();
  if(email)   data.append('email',   email);
  if(phone)   data.append('phone',   phone);
  if(message) data.append('message', message);
  if(files.length) Array.from(files).forEach(f=>data.append('files',f));

  const endpoint = files.length
      ? 'https://pro3dsydney-backend.onrender.com/upload'
      : 'https://formspree.io/f/mvgqbbdk';

  try{
    const res = await fetch(endpoint,{method:'POST',body:data,headers:{Accept:'application/json'}});
    response.textContent = res.ok
      ? 'Thanks! We’ll be in touch within one business day.'
      : 'Something went wrong – please retry.';
    if(res.ok) form.reset();
  }catch(err){
    console.error(err);
    response.textContent = 'Network error.';
  }finally{
    btn.disabled = false;
  }
});