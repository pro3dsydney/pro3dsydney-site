// ---------- LOGO CAROUSEL ----------
const logos = [
  'logo1.webp','logo2.webp','logo3.webp','logo4.webp',
  'logo5.webp','logo6.webp','logo7.webp'
];
(function buildTrack() {
  const track = document.getElementById('logoTrack');
  if (!track) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 2; i++) {
    logos.forEach(src => {
      const img = new Image();
      img.src = `assets/Filament_images/${src}`;
      img.loading = 'lazy';
      frag.appendChild(img);
    });
  }
  track.appendChild(frag);
})();

// ---------- POPUP ----------
setTimeout(() => {
  const pop = document.getElementById('popup');
  if (pop) pop.classList.remove('hidden');
}, 15000);

function closePopup() {
  document.getElementById('popup').classList.add('hidden');
}
function scrollToForm() {
  document.querySelector('.quote-form')?.scrollIntoView({ behavior: 'smooth' });
  closePopup();
}

// ---------- FORM SUBMISSION ----------
document.getElementById('uploadForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const responseText = document.getElementById('response');
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  responseText.textContent = 'Sending...';

  try {
    // Option A: If using static + Formspree, change to your Formspree URL:
    const res = await fetch('https://formspree.io/f/mvgqbbdk', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      responseText.textContent = 'Sent! We’ll get back to you shortly.';
      form.reset();
    } else {
      responseText.textContent = 'Upload failed. Please try again.';
    }
  } catch (err) {
    console.error(err);
    responseText.textContent = 'Could not connect to server.';
  } finally {
    btn.disabled = false;
  }
});