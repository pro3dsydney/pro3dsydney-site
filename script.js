/* ---------- Mobile nav ---------- */
const menuBtn = document.querySelector('.menu-toggle');
const nav = document.getElementById('nav');
if (menuBtn && nav){
  menuBtn.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
}

/* ---------- Reveal on scroll ---------- */
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); observer.unobserve(e.target); }});
},{threshold:0.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

/* ---------- Reviews carousel ---------- */
const REVIEWS = [
  {t:"Faultless quality, ahead of schedule.", n:"Alex", s:5},
  {t:"Excellent service and flawless finish on every part.", n:"Jordan", s:5},
  {t:"Print quality was superb — quick turnaround too.", n:"Taylor", s:5},
  {t:"Helpful DFM tips saved us time and cost.", n:"Morgan", s:5}
];
const track = document.getElementById('revTrack');
if (track){
  REVIEWS.forEach(r=>{
    const card = document.createElement('article');
    card.className = 'review';
    card.innerHTML = `<div class="stars">${'★'.repeat(r.s)}${'☆'.repeat(5-r.s)}</div><p>${r.t}</p><div class="muted">— ${r.n}</div>`;
    track.appendChild(card);
  });
  const prev = document.querySelector('.carousel-btn.prev');
  const next = document.querySelector('.carousel-btn.next');
  function step(){ const c = track.querySelector('.review'); return c ? c.getBoundingClientRect().width + 16 : 280 }
  prev?.addEventListener('click', ()=> track.scrollBy({left:-step(), behavior:'smooth'}));
  next?.addEventListener('click', ()=> track.scrollBy({left: step(), behavior:'smooth'}));
}

/* ---------- Estimator (material curves + tiered discounts + ÷3) ---------- */
const sizeR = document.getElementById('sizeRange');
const qtyR  = document.getElementById('qtyRange');
const matS  = document.getElementById('matSelect');
const sizeOut = document.getElementById('sizeOut');
const qtyOut = document.getElementById('qtyOut');
const priceEl = document.querySelector('.price');

const MAT = {
  pla: { mult: 1.00, expo: 1.45 }, // slower ramp
  petg:{ mult: 1.50, expo: 1.80 },
  abs: { mult: 1.50, expo: 1.90 },
  tpu: { mult: 1.75, expo: 1.85 },
  pc:  { mult: 2.10, expo: 2.00 },
  cf:  { mult: 2.30, expo: 2.00 }
};

function unitPrice(longest, material){
  const cfg = MAT[material] || MAT.pla;
  const base = 15;          // handling/setup
  const rate = 25;          // hourly rate
  const time = Math.pow(longest/80, cfg.expo) * 2.4; // hours/part
  return base + rate * time * cfg.mult;
}
function totalWithTiers(perPart, qty){
  // 1–4 full price; 5–10 at 30% off; >10 at 50% off (per additional unit)
  const full = Math.min(qty, 4);
  const mid  = Math.max(Math.min(qty - 4, 6), 0);   // units 5..10
  const high = Math.max(qty - 10, 0);               // units 11+
  return perPart*full + perPart*0.70*mid + perPart*0.50*high;
}
function calc(){
  if(!sizeR || !qtyR || !matS) return;
  const L = +sizeR.value;
  const Q = +qtyR.value;
  const M = matS.value;
  sizeOut.textContent = L;
  qtyOut.textContent  = Q;
  const per = unitPrice(L, M);
  const total = totalWithTiers(per, Q) / 3; // divide all pricing by 3
  priceEl.textContent = `$${Math.round(total).toLocaleString()}+`;
}
[sizeR, qtyR, matS].forEach(el=>el?.addEventListener('input', calc));
calc();

/* ---------- Dropbox File Request flow ---------- */
const FILE_REQUEST_URL = "https://www.dropbox.com/request/fkSiA27baj2yQ9Jmptqu";
const qForm = document.getElementById('quoteForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const openBtn = document.getElementById('openUpload');
openBtn?.addEventListener('click', (e)=>{
  if (!FILE_REQUEST_URL){
    e.preventDefault();
    alert('Upload portal not set up yet. Ask us for the upload link.');
  }
});

// Send details via Formspree (files arrive via Dropbox)
qForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  statusEl.textContent = 'Sending…';
  submitBtn.disabled = true;
  try{
    const payload = {
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      material: document.getElementById('material').value,
      quantity: document.getElementById('qty').value,
      message: document.getElementById('message').value,
      uploaded_via: 'Dropbox file request'
    };
    const FORMSPREE = "https://formspree.io/f/mvgqbbdk";
    const fs = await fetch(FORMSPREE, {
      method:'POST',
      headers:{ 'Accept':'application/json', 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    if (fs.ok){
      statusEl.textContent = 'Thanks! We\'ll be in touch shortly.';
      qForm.reset();
    } else {
      statusEl.textContent = 'Message failed. Please retry.';
    }
  } catch(err){
    console.error(err);
    statusEl.textContent = 'Could not send. Please try again.';
  } finally {
    submitBtn.disabled = false;
  }
});