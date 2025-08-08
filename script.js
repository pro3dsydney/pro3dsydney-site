/* ---------- Mobile nav ---------- */
const menuBtn = document.querySelector('.menu-toggle');
const nav = document.getElementById('nav');
if (menuBtn && nav){
  menuBtn.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
}

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

/* ---------- Estimator (HALVED pricing) ---------- */
const sizeR = document.getElementById('sizeRange');
const qtyR  = document.getElementById('qtyRange');
const matS  = document.getElementById('matSelect');
const sizeOut = document.getElementById('sizeOut');
const qtyOut = document.getElementById('qtyOut');
const priceEl = document.querySelector('.price');

function calc(){
  if(!sizeR) return;
  const L = +sizeR.value; const Q = +qtyR.value;
  sizeOut.textContent = L; qtyOut.textContent = Q;
  const time = Math.pow(L/80, 2) * 2.4; // hours per part baseline (illustrative)
  const base = 15; const rate = 25;
  const perPart = base + rate * time;
  const bulk = Q>=10 ? 0.85 : Q>=5 ? 0.92 : 1;
  const total = perPart * Q * bulk * 0.5; // halved for everything
  priceEl.textContent = `$${Math.round(total).toLocaleString()}+`;
}
[sizeR, qtyR, matS].forEach(el=>el?.addEventListener('input', calc));
calc();

/* ---------- Dropbox File Request flow ---------- */
// Anyone with this link can upload; no Dropbox account required (per Dropbox Help).
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
    return;
  }
  // link element already has href; this keeps it accessible
});

// Submit details via Formspree (no attachments; files arrive via Dropbox)
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
