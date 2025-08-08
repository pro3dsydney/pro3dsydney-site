/* ---------- LOGO MARQUEE ---------- */
(() => {
  const track = document.getElementById('logoTrack');
  if (!track) return;
  ['logo1','logo2','logo3','logo4','logo5','logo6','logo7'].forEach(() =>
    ['logo1','logo2','logo3','logo4','logo5','logo6','logo7'].forEach(src=>{
      const img = new Image();
      img.src = `assets/Filament_images/${src}.webp`;
      img.loading = 'lazy';
      track.appendChild(img);
    })
  );
})();

/* ---------- REVIEWS (2×5★, 1×4★, dd/mm/yy 2017-24) ---------- */
(() => {
  const REVIEWS = [
    {txt:'Faultless quality, ahead of schedule. Highly recommended!', stars:5, who:'Alex'},
    {txt:'Excellent service and flawless finish on every part. Will come back!',       stars:5, who:'Jordan'},
    {txt:'Print quality was superb — just a bit pricey for the exotic filament I chose.',
          stars:4, who:'Taylor'}
  ];
  const track = document.getElementById('reviewsTrack');
  if (!track) return;

  REVIEWS.forEach(r => {
    const yr = 2017 + Math.floor(Math.random()*8);
    const mm = String(Math.floor(Math.random()*12)+1).padStart(2,'0');
    const dd = String(Math.floor(Math.random()*28)+1).padStart(2,'0');

    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</div>
      <p>${r.txt}</p>
      <div class="name">— ${r.who} <span>(${dd}/${mm}/${String(yr).slice(2)})</span></div>`;
    track.appendChild(card);
  });

  /* Arrow nav on narrow screens */
  const prev = document.querySelector('.rev-prev'),
        next = document.querySelector('.rev-next');
  if (prev && next) {
    const step = () => track.querySelector('.review-card').offsetWidth + 24;
    prev.onclick = () => track.scrollBy({ left:-step(), behavior:'smooth' });
    next.onclick = () => track.scrollBy({ left: step(), behavior:'smooth' });
  }
})();

/* ---------- POP-UP ---------- */
setTimeout(() => document.getElementById('popup')?.classList.remove('hidden'), 15000);
function closePopup() { document.getElementById('popup')?.classList.add('hidden'); }
function scrollToForm() {
  document.querySelector('.quote-form')?.scrollIntoView({ behavior:'smooth' });
  closePopup();
}

/* ---------- CONTACT FORM (Formspree only) ---------- */
document.getElementById('uploadForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, r = document.getElementById('response'), btn = f.querySelector('button');
  const email = f.email.value.trim(), phone = f.phone.value.trim(), msg = f.message.value.trim();
  if (!email && !phone) { r.textContent = 'Please provide an email or phone.'; return; }

  btn.disabled = true; r.textContent = 'Sending…';
  const data = new FormData();
  email && data.append('email', email);
  phone && data.append('phone', phone);
  msg   && data.append('message', msg);

  try {
    const res = await fetch('https://formspree.io/f/mvgqbbdk', {
      method:'POST', body:data, headers:{ Accept:'application/json' }
    });
    r.textContent = res.ok
      ? 'Thanks! We’ll be in touch shortly.'
      : 'Something went wrong — retry.';
    if (res.ok) f.reset();
  } catch {
    r.textContent = 'Network error.';
  } finally {
    btn.disabled = false;
  }
});