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

/* ---------- Estimator ---------- */
const sizeR = document.getElementById('sizeRange');
const qtyR  = document.getElementById('qtyRange');
const matS  = document.getElementById('matSelect');
const sizeOut = document.getElementById('sizeOut');
const qtyOut = document.getElementById('qtyOut');
const priceEl = document.querySelector('.price');

function calc(){
  if(!sizeR) return;
  const L = +sizeR.value; const Q = +qtyR.value; const M = matS.value;
  sizeOut.textContent = L; qtyOut.textContent = Q;
  // Pricing multipliers: PLA -60%, PETG/ABS -40%, others -30%
  const matK = {pla:0.4, petg:0.6, abs:0.6, tpu:0.7, pc:0.7, cf:0.7}[M] || 1;
  const time = Math.pow(L/80, 2) * 2.4; // hours per part baseline (illustrative)
  const base = 15; const rate = 25;
  const perPart = base + rate * time * matK;
  const bulk = Q>=10 ? 0.85 : Q>=5 ? 0.92 : 1;
  const total = perPart * Q * bulk;
  priceEl.textContent = `$${Math.round(total).toLocaleString()}+`;
}
[sizeR, qtyR, matS].forEach(el=>el?.addEventListener('input', calc));
calc();

/* ---------- File upload to Google Apps Script (Drive) ---------- */
const UPLOAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbwphNAJ5uy4n_kjKE53x29v4M5zrn-IUqL2zHm2o8kDS5GTzxP6EVOPLqKsZZR0UjH7/exec";

const qForm = document.getElementById('quoteForm');
const fileInput = document.getElementById('files');
const fileList = document.getElementById('fileList');
const progressEl = document.getElementById('uploadProgress');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Selected files list
function renderFiles(files){
  fileList.innerHTML = "";
  [...files].forEach(f=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${f.name} <span class="muted">(${Math.round(f.size/1024/1024*10)/10} MB)</span></span>`;
    fileList.appendChild(li);
  });
}
fileInput?.addEventListener('change', (e)=> renderFiles(e.target.files));

// Drag & drop
const zone = document.getElementById('uploadZone');
if (zone){
  ['dragenter','dragover'].forEach(evt=> zone.addEventListener(evt, e=>{e.preventDefault(); zone.style.borderColor = '#c7d2fe';}));
  ;['dragleave','drop'].forEach(evt=> zone.addEventListener(evt, e=>{e.preventDefault(); zone.style.borderColor = 'var(--line)';}));
  zone.addEventListener('drop', e=>{
    const dt = e.dataTransfer; if(!dt?.files?.length) return;
    fileInput.files = dt.files; renderFiles(dt.files);
  });
}

async function uploadFiles(files){
  if(!UPLOAD_ENDPOINT){ throw new Error('Upload endpoint not configured.'); }
  const data = new FormData();
  [...files].forEach((f,i)=> data.append('file'+i, f, f.name));
  return await fetch(UPLOAD_ENDPOINT, { method:'POST', body:data })
    .then(r=>r.json());
}

qForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  statusEl.textContent = 'Sending…';
  submitBtn.disabled = true;
  try{
    // 1) upload files (if any)
    let uploadResult = { links: [] };
    const files = fileInput?.files || [];
    if (files.length){
      progressEl.hidden = false;
      progressEl.removeAttribute('value'); // indeterminate
      uploadResult = await uploadFiles(files);
      progressEl.hidden = true;
    }
    // 2) send details + links via Formspree (JSON)
    const payload = {
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      material: document.getElementById('material').value,
      quantity: document.getElementById('qty').value,
      message: document.getElementById('message').value,
      file_links: uploadResult?.links?.join(', ') || ''
    };
    const FORMSPREE = "https://formspree.io/f/mvgqbbdk";
    const fs = await fetch(FORMSPREE, {
      method:'POST',
      headers:{ 'Accept':'application/json', 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    if (fs.ok){
      statusEl.textContent = 'Thanks! We\'ll be in touch shortly.';
      qForm.reset(); fileList.innerHTML = '';
    } else {
      statusEl.textContent = 'Sent files. Couldn\'t send details — please retry the form.';
    }
  } catch(err){
    console.error(err);
    statusEl.textContent = err.message.includes('endpoint') ?
      'Files not uploaded yet — set the upload endpoint.' :
      'Upload failed. Please try again.';
  } finally {
    submitBtn.disabled = false;
  }
});
