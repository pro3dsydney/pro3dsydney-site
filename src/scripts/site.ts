import { track } from './analytics';

// Header border on scroll + floating "Get a quote" button
const header = document.getElementById('siteHeader');
const floatCta = document.getElementById('floatCta');
const onScroll = () => {
  header?.classList.toggle('scrolled', scrollY > 8);
  floatCta?.classList.toggle('show', scrollY > 420);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const btn = document.getElementById('menuBtn');
const nav = document.getElementById('mainNav');
btn?.addEventListener('click', () => {
  const open = nav!.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
});
nav?.addEventListener('click', e => {
  if ((e.target as HTMLElement).closest('a')) { nav.classList.remove('open'); btn?.setAttribute('aria-expanded', 'false'); }
});

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Analytics: page view, CTA clicks, FAQ opens, scroll depth
track('page_view', { title: document.title });
document.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
  if (el) track(el.dataset.track!, { label: el.dataset.label || el.textContent?.trim().slice(0, 40) });
});
document.querySelectorAll<HTMLDetailsElement>('details[data-faq]').forEach(d =>
  d.addEventListener('toggle', () => { if (d.open) track('faq_open', { id: d.dataset.faq }); }));
const marks = new Set<number>();
addEventListener('scroll', () => {
  const pct = ((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100;
  for (const m of [50, 90]) if (pct >= m && !marks.has(m)) { marks.add(m); track('scroll_depth', { pct: m }); }
}, { passive: true });

// Hero video: only plays while visible; skipped on data-saver / reduced motion
const video = document.querySelector<HTMLVideoElement>('video[data-autoplay]');
if (video) {
  const conn = (navigator as any).connection;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && !conn?.saveData) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) video.play().catch(() => {}); else video.pause(); }, { threshold: 0.25 }).observe(video);
  }
}

// "Call us": fetch the number only on a real click, then show it / start the call on phones.
let phone: { display: string; tel: string } | null = null;
document.addEventListener('click', async e => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-call]');
  if (!btn) return;
  e.preventDefault();
  track('cta_click', { label: 'call_reveal' });
  try {
    if (!phone) {
      const { api } = await import('./api');
      phone = await api<{ display: string; tel: string }>('/api/contact/phone', { human: true });
    }
    document.querySelectorAll<HTMLElement>('[data-call]').forEach(b => {
      const a = document.createElement('a');
      a.href = `tel:${phone!.tel}`;
      a.className = b.className;
      a.innerHTML = b.querySelector('svg')?.outerHTML || '';
      a.append(phone!.display);
      b.replaceWith(a);
    });
    if (matchMedia('(pointer: coarse)').matches) location.href = `tel:${phone.tel}`;
  } catch {
    btn.querySelector('span')!.textContent = 'Please email us';
  }
});
