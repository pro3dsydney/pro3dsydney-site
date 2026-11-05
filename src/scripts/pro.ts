import { api, apiUrl, uploadFile, waitForAnalysis, fmtBytes, fmtDuration, money, esc, ApiError, type Analysis } from './api';
import { track, attribution } from './analytics';
import { solveCaptcha } from './captcha';
import { colourHex } from './colours';
import type { BufferGeometry } from 'three';

/* ---------------- types ---------------- */
type Settings = { material: string; colour: string; nozzle: string; layerHeight: number; infill: number; walls: number; supports: 'auto' | 'none' };
type SliceResult = { grams: number; seconds: number; unit: { unitPrice: number; total: number } };
type Slice = { id: string; status: 'queued' | 'running' | 'done' | 'failed'; error: string | null; result: SliceResult | null };
type Part = {
  key: string; file: File; status: 'uploading' | 'checking' | 'ready' | 'error'; progress: number; error?: string;
  uploadId?: string; analysis?: Analysis | null; geo?: BufferGeometry | null;
  settings: Settings; quantity: number; slice?: Slice; sliceSeq: number; tab?: HTMLElement;
};
type Catalog = {
  printer: { bed: { x: number; y: number; z: number } };
  nozzles: Record<string, { label: string; blurb: string; layerHeights: number[]; defaultLayer: number }>;
  materials: Record<string, { name: string; perGram: number; nozzles: string[]; use: string; colours: string[] }>;
  delivery: Record<string, { label: string; price: number }>;
  options: { infill: { presets: number[] } };
};
type OrderPrice = {
  items: { sliceId: string; filename: string; quantity: number; price: { total: number; unitPrice: number; discount: number } }[];
  totals: { subtotal: number; rush: number; orderFee: number; minimumTopUp: number; delivery: number; total: number };
  deliveryLabel: string;
};

/* ---------------- state ---------------- */
let catalog: Catalog;
const parts: Part[] = [];
let selected: Part | null = null;
let defaults: Settings = { material: 'pla', colour: 'Black', nozzle: '0.4', layerHeight: 0.2, infill: 15, walls: 2, supports: 'auto' };
let deliveryKey = 'pickup';
let rush = false;
let draftId: string | undefined;
let orderPrice: OrderPrice | null = null;
let viewer: import('./viewer').Viewer | null = null;
let checkoutInView = false;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

/* ---------------- boot ---------------- */
(async function init() {
  if (new URLSearchParams(location.search).has('cancelled')) $('cancelNotice').hidden = false;
  try {
    catalog = await api<Catalog>('/api/catalog');
  } catch (e) {
    $('priceBox').innerHTML = `<span style="color:#fca5a5">${esc((e as Error).message)}</span>`;
    return;
  }
  buildStaticControls();
  for (const id of ['pqInput', 'pqInput2']) $<HTMLInputElement>(id).addEventListener('change', e => { const i = e.target as HTMLInputElement; addFiles(i.files); i.value = ''; });
  const vc = $('viewerCard');
  ['dragenter', 'dragover'].forEach(ev => vc.addEventListener(ev, e => { e.preventDefault(); $('emptyDrop').classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => vc.addEventListener(ev, e => { e.preventDefault(); $('emptyDrop').classList.remove('over'); }));
  vc.addEventListener('drop', e => addFiles((e as DragEvent).dataTransfer?.files));
  $('resetView').addEventListener('click', () => viewer?.reset());
  $('applyAll').addEventListener('click', applyToAll);
  setupCheckout();
  // Hide the phone price bar once the checkout form (with its own total) is on screen.
  new IntersectionObserver(([e]) => { checkoutInView = e.isIntersecting; $('priceDock').hidden = !parts.length || checkoutInView; }, { rootMargin: '0px 0px -30% 0px' })
    .observe($('checkoutWrap'));
})();

/* ---------------- settings controls ---------------- */
function buildStaticControls() {
  $('matGrid').innerHTML = Object.entries(catalog.materials).map(([k, m]) =>
    `<button type="button" class="mat-btn" data-mat="${k}" aria-pressed="false">${esc(m.name)}<small>$${m.perGram.toFixed(2)}/g</small></button>`).join('');
  $('matGrid').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-mat]');
    if (!b || !selected) return;
    const m = catalog.materials[b.dataset.mat!];
    const s = selected.settings;
    s.material = b.dataset.mat!;
    if (!m.colours.includes(s.colour)) s.colour = m.colours[0];
    if (!m.nozzles.includes(s.nozzle)) { s.nozzle = '0.4'; s.layerHeight = catalog.nozzles['0.4'].defaultLayer; }
    changed();
  });

  $('swatches').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-colour]');
    if (!b || !selected) return;
    selected.settings.colour = b.dataset.colour!;
    changed(false); // colour doesn't change price
  });

  $('nozzleSeg').innerHTML = Object.entries(catalog.nozzles).map(([k, n]) =>
    `<button type="button" data-nozzle="${k}" aria-pressed="false">${k} mm<small>${k === '0.2' ? 'Fine detail' : 'Standard'}</small></button>`).join('');
  $('nozzleSeg').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-nozzle]');
    if (!b || b.disabled || !selected) return;
    selected.settings.nozzle = b.dataset.nozzle!;
    selected.settings.layerHeight = catalog.nozzles[b.dataset.nozzle!].defaultLayer;
    changed();
  });

  $('layerSeg').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-layer]');
    if (!b || !selected) return;
    selected.settings.layerHeight = Number(b.dataset.layer);
    changed();
  });

  const infill = $<HTMLInputElement>('infill');
  infill.addEventListener('input', () => { if (!selected) return; selected.settings.infill = +infill.value; renderSettings(); });
  infill.addEventListener('change', () => changed());
  $('infillPresets').innerHTML = catalog.options.infill.presets.map(p => `<button type="button" data-infill="${p}">${p}%</button>`).join('');
  $('infillPresets').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-infill]');
    if (!b || !selected) return;
    selected.settings.infill = Number(b.dataset.infill);
    changed();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(b => b.addEventListener('click', () => {
    if (!selected) return;
    const d = Number(b.dataset.d);
    if (b.dataset.step === 'walls') { selected.settings.walls = clamp(selected.settings.walls + d, 2, 6); changed(); }
    else { selected.quantity = clamp(selected.quantity + d, 1, 500); qtyChanged(); }
  }));
  $<HTMLInputElement>('walls').addEventListener('change', e => { if (!selected) return; selected.settings.walls = clamp(+(e.target as HTMLInputElement).value || 2, 2, 6); changed(); });
  $<HTMLInputElement>('qty').addEventListener('change', e => { if (!selected) return; selected.quantity = clamp(Math.round(+(e.target as HTMLInputElement).value) || 1, 1, 500); qtyChanged(); });
  $<HTMLInputElement>('supports').addEventListener('change', e => { if (!selected) return; selected.settings.supports = (e.target as HTMLInputElement).checked ? 'auto' : 'none'; changed(); });
}

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

function changed(reslice = true) {
  if (!selected) return;
  defaults = { ...selected.settings };
  renderSettings();
  viewer?.setColour(selected.settings.colour);
  if (reslice) requestSlice(selected);
  else refreshOrder();
}
function qtyChanged() { renderSettings(); renderPrice(); refreshOrder(); }

function renderSettings() {
  const p = selected;
  $<HTMLFieldSetElement>('settings').disabled = !p || p.status === 'error';
  $('applyAll').hidden = parts.filter(x => x.status !== 'error').length < 2;
  if (!p) return;
  const s = p.settings;
  const mat = catalog.materials[s.material];
  $('partName').textContent = `${p.file.name} · ${fmtBytes(p.file.size)}`;
  document.querySelectorAll<HTMLElement>('[data-mat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mat === s.material)));
  $('matUse').textContent = mat.use;
  $('swatches').innerHTML = mat.colours.map(c =>
    `<button type="button" class="swatch" data-colour="${esc(c)}" title="${esc(c)}" aria-label="${esc(c)}" aria-pressed="${c === s.colour}" style="background:${c === 'Silk Gold' ? 'linear-gradient(135deg,#f7dc8a,#b8862b)' : colourHex(c)}"></button>`).join('');
  $('colourName').textContent = s.colour;
  document.querySelectorAll<HTMLButtonElement>('[data-nozzle]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.nozzle === s.nozzle));
    b.disabled = !mat.nozzles.includes(b.dataset.nozzle!);
    b.title = b.disabled ? `${mat.name} needs a 0.4 mm nozzle` : '';
  });
  $('nozzleTip').textContent = catalog.nozzles[s.nozzle].blurb + (mat.nozzles.length < 2 ? ` ${mat.name} is 0.4 mm only.` : '');
  $('layerSeg').innerHTML = catalog.nozzles[s.nozzle].layerHeights.map(l =>
    `<button type="button" data-layer="${l}" aria-pressed="${Math.abs(l - s.layerHeight) < 1e-6}">${l.toFixed(2)}<small>${layerWord(l)}</small></button>`).join('');
  $('layerVal').textContent = `${s.layerHeight.toFixed(2)} mm`;
  $<HTMLInputElement>('infill').value = String(s.infill);
  $('infillVal').textContent = `${s.infill}%`;
  document.querySelectorAll<HTMLElement>('[data-infill]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.infill! === s.infill)));
  $<HTMLInputElement>('walls').value = String(s.walls);
  $<HTMLInputElement>('supports').checked = s.supports === 'auto';
  $<HTMLInputElement>('qty').value = String(p.quantity);
}
const layerWord = (l: number) => (l <= 0.08 ? 'Ultra fine' : l <= 0.12 ? 'Fine' : l <= 0.16 ? 'Detailed' : l <= 0.2 ? 'Standard' : 'Draft');

/* ---------------- parts ---------------- */
async function addFiles(files?: FileList | null) {
  if (!files?.length) return;
  for (const file of Array.from(files)) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['stl', '3mf', 'obj', 'step', 'stp'].includes(ext)) { toastHud(`${file.name}: use STL, 3MF, STEP or OBJ`, 'bad'); continue; }
    if (file.size > 200 * 1048576) { toastHud(`${file.name} is over 200 MB`, 'bad'); continue; }
    const part: Part = { key: crypto.randomUUID(), file, status: 'uploading', progress: 0, settings: { ...defaults }, quantity: 1, sliceSeq: 0 };
    parts.push(part);
    track('file_added', { flow: 'pro', ext, mb: +(file.size / 1048576).toFixed(1) });
    renderTabs();
    if (!selected) select(part);
    loadPreview(part);
    upload(part);
  }
  $('emptyDrop').hidden = true;
  $('partsBar').hidden = false;
  $('viewerTools').hidden = false;
  $('checkoutWrap').hidden = false;
  refreshOrder();
}

async function ensureViewer() {
  if (viewer) return viewer;
  const { Viewer } = await import('./viewer');
  viewer = new Viewer($('viewer'), catalog.printer.bed);
  return viewer;
}

async function loadPreview(part: Part) {
  const { loadGeometry, meshVolume } = await import('./mesh');
  part.geo = await loadGeometry(part.file);
  if (part.geo && !part.analysis) {
    part.geo.computeBoundingBox();
    const s = part.geo.boundingBox!.getSize(new (await import('three')).Vector3());
    part.analysis = { size: { x: s.x, y: s.y, z: s.z }, volume: meshVolume(part.geo), printable: true, errors: [], warnings: [] };
  }
  if (selected === part) { (await ensureViewer()).show(part.geo ?? null); viewer!.setColour(part.settings.colour); renderHud(); }
}

async function upload(part: Part) {
  try {
    const rec = await uploadFile(part.file, 'pro', pct => { part.progress = pct; renderTabs(); if (selected === part) renderPrice(); });
    part.uploadId = rec.id;
    part.status = 'checking';
    renderTabs(); if (selected === part) renderPrice();
    const analysed = await waitForAnalysis(rec.id);
    part.analysis = analysed.analysis ?? part.analysis;
    if (analysed.analysis && !analysed.analysis.printable) {
      part.status = 'error';
      part.error = analysed.analysis.errors[0] || 'This file can’t be printed.';
    } else {
      part.status = 'ready';
      requestSlice(part);
    }
    saveDraft();
  } catch (e) {
    part.status = 'error';
    part.error = (e as Error).message;
  }
  renderTabs();
  if (selected === part) { renderHud(); renderSettings(); renderPrice(); }
  refreshOrder();
}

function select(part: Part) {
  selected = part;
  renderTabs(); renderSettings(); renderPrice();
  ensureViewer().then(v => { v.show(part.geo ?? null); v.setColour(part.settings.colour); renderHud(); });
}

function removePart(part: Part) {
  parts.splice(parts.indexOf(part), 1);
  if (selected === part) selected = null;
  if (parts.length) select(selected ?? parts[0]);
  else {
    viewer?.show(null);
    $('emptyDrop').hidden = false; $('partsBar').hidden = true; $('viewerTools').hidden = true; $('checkoutWrap').hidden = true;
    $('hud').innerHTML = ''; $('partName').textContent = 'Upload a file to start';
    $('priceBox').innerHTML = '<div style="color:#8d9bbb">Your price appears here as soon as your file is sliced.</div>';
    $<HTMLFieldSetElement>('settings').disabled = true;
  }
  renderTabs(); refreshOrder(); saveDraft();
}

function renderTabs() {
  const bar = $('partsBar');
  bar.querySelectorAll('.part-tab:not(.part-add)').forEach(t => t.remove());
  const add = bar.querySelector('.part-add')!;
  for (const p of parts) {
    const st = p.status === 'error' || p.slice?.status === 'failed' ? 'bad'
      : p.status === 'uploading' || p.status === 'checking' || p.slice?.status === 'queued' || p.slice?.status === 'running' ? 'busy'
      : p.slice?.status === 'done' ? 'ok' : '';
    const tab = document.createElement('div');
    tab.className = 'part-tab';
    tab.setAttribute('role', 'tab');
    tab.tabIndex = 0;
    tab.setAttribute('aria-selected', String(p === selected));
    tab.innerHTML = `<i class="st ${st}"></i><span>${esc(p.file.name)}</span>${p.quantity > 1 ? `<b>×${p.quantity}</b>` : ''}
      <button type="button" class="icon-btn" style="width:24px;height:24px" aria-label="Remove ${esc(p.file.name)}">×</button>`;
    tab.addEventListener('click', e => { if ((e.target as HTMLElement).closest('button')) removePart(p); else select(p); });
    tab.addEventListener('keydown', e => { if (e.key === 'Enter') select(p); });
    bar.insertBefore(tab, add);
  }
}

function renderHud() {
  const p = selected; const hud = $('hud');
  if (!p) { hud.innerHTML = ''; return; }
  const a = p.analysis;
  const chips: string[] = [];
  if (a?.size) chips.push(`<span class="chip">${a.size.x.toFixed(1)} × ${a.size.y.toFixed(1)} × ${a.size.z.toFixed(1)} mm</span>`);
  if (a?.volume) chips.push(`<span class="chip">${(a.volume / 1000).toFixed(1)} cm³</span>`);
  if (p.status === 'error') chips.push(`<span class="chip bad">✕ ${esc(p.error)}</span>`);
  else if (a && p.status === 'ready') {
    if (a.errors.length) chips.push(`<span class="chip bad">✕ ${esc(a.errors[0])}</span>`);
    else if (!a.oversize) chips.push(`<span class="chip ok">✓ Fits our printers</span>`);
    for (const w of a.warnings || []) chips.push(`<span class="chip warn">! ${esc(w)}</span>`);
  }
  if (!p.geo && p.status !== 'error') chips.push(`<span class="chip">${/\.(step|stp)$/i.test(p.file.name) ? 'STEP files are previewed after slicing in our system' : 'Preview loading…'}</span>`);
  hud.innerHTML = chips.join('');
}
function toastHud(msg: string, cls = '') {
  const c = document.createElement('span'); c.className = `chip ${cls}`; c.textContent = msg;
  $('hud').appendChild(c); setTimeout(() => c.remove(), 5000);
}

/* ---------------- slicing ---------------- */
const timers = new WeakMap<Part, number>();
function requestSlice(part: Part) {
  if (part.status !== 'ready' || !part.uploadId) return;
  clearTimeout(timers.get(part));
  const seq = ++part.sliceSeq;
  part.slice = { id: '', status: 'queued', error: null, result: null };
  renderTabs(); if (part === selected) renderPrice();
  timers.set(part, window.setTimeout(async () => {
    try {
      track('slice_requested', { material: part.settings.material, nozzle: part.settings.nozzle });
      let s: Slice;
      for (;;) {
        try { s = await api<Slice>('/api/slices', { uploadId: part.uploadId, settings: part.settings }); break; }
        catch (e) {
          // After a few free slices the server asks for a quick human check.
          if (e instanceof ApiError && e.code === 'captcha_required') {
            part.slice = { id: '', status: 'queued', error: null, result: null };
            await solveCaptcha(e.data.captcha);
            if (seq !== part.sliceSeq) return;
            continue;
          }
          throw e;
        }
      }
      while (s.status === 'queued' || s.status === 'running') {
        if (seq !== part.sliceSeq) return; // settings changed meanwhile
        await new Promise(r => setTimeout(r, 700));
        s = await api<Slice>(`/api/slices/${s.id}`);
      }
      if (seq !== part.sliceSeq) return;
      part.slice = s;
      if (s.status === 'done') track('slice_done', { grams: s.result?.grams });
    } catch (e) {
      if (seq !== part.sliceSeq) return;
      const limited = e instanceof ApiError && e.code === 'slice_limit';
      part.slice = { id: '', status: 'failed', error: limited ? (e as Error).message : `Couldn’t slice this model: ${(e as Error).message}`, result: null };
    }
    renderTabs(); if (part === selected) renderPrice();
    refreshOrder();
  }, 450));
}

function applyToAll() {
  if (!selected) return;
  for (const p of parts) if (p !== selected && p.status !== 'error') {
    const mat = catalog.materials[selected.settings.material];
    p.settings = { ...selected.settings };
    if (!mat.nozzles.includes(p.settings.nozzle)) p.settings.nozzle = '0.4';
    requestSlice(p);
  }
  toastHud('Settings applied to all parts', 'ok');
}

function renderPrice() {
  const p = selected; const box = $('priceBox');
  if (!p) return;
  if (p.status === 'uploading') { box.innerHTML = `<span class="slicing"><i class="spinner"></i> Uploading… ${p.progress}%</span><div class="progress" style="background:rgba(255,255,255,.12)"><i style="width:${p.progress}%"></i></div>`; return; }
  if (p.status === 'checking') { box.innerHTML = `<span class="slicing"><i class="spinner"></i> Checking your model…</span>`; return; }
  if (p.status === 'error') { box.innerHTML = `<div style="color:#fca5a5">${esc(p.error)}</div><p style="margin:10px 0 0;font-size:.9rem;color:#a9b6d3">Want us to fix it? <a href="/quote/" style="color:#b9cdff">Send it as a design &amp; print request</a> and we’ll sort it out.</p>`; return; }
  const s = p.slice;
  if (!s || s.status === 'queued' || s.status === 'running') {
    box.innerHTML = `<span class="slicing"><i class="spinner"></i> Slicing with your settings…</span><div class="stats-row" style="margin-top:12px">${['Material', 'Print time', 'Per part'].map(l => `<div class="stat"><b class="skeleton" style="height:18px;width:60%;opacity:.25">&nbsp;</b><span>${l}</span></div>`).join('')}</div>`;
    return;
  }
  if (s.status === 'failed') { box.innerHTML = `<div style="color:#fca5a5">${esc(s.error)}</div><p style="margin:10px 0 0;font-size:.9rem;color:#a9b6d3">Try different settings, or <a href="/quote/" style="color:#b9cdff">send it to us</a> and we’ll take a look.</p>`; return; }
  const r = s.result!;
  const line = orderPrice?.items.find(i => i.sliceId === s.id && i.quantity === p.quantity);
  box.innerHTML = `<div class="stats-row">
      <div class="stat"><b>${r.grams} g</b><span>Material</span></div>
      <div class="stat"><b>${fmtDuration(r.seconds)}</b><span>Print time</span></div>
      <div class="stat"><b>${money(line ? line.price.unitPrice : r.unit.unitPrice)}</b><span>Per part</span></div>
    </div>
    ${line?.price.discount ? `<div class="price-line"><span>Quantity discount</span><b>−${Math.round(line.price.discount * 100)}%</b></div>` : ''}
    <div class="price-total"><span>This part × ${p.quantity}</span><span class="amt">${line ? money(line.price.total) : '…'}</span></div>`;
}

/* ---------------- order total ---------------- */
let orderTimer: number | undefined;
let orderSeq = 0;
function refreshOrder() {
  clearTimeout(orderTimer);
  orderTimer = window.setTimeout(async () => {
    const seq = ++orderSeq;
    const ready = parts.filter(p => p.slice?.status === 'done');
    const pending = parts.some(p => p.status !== 'error' && p.slice?.status !== 'done' && p.slice?.status !== 'failed');
    if (!ready.length) { orderPrice = null; renderSummary(pending); return; }
    try {
      const o = await api<OrderPrice>('/api/orders/price', { items: ready.map(p => ({ sliceId: p.slice!.id, quantity: p.quantity })), delivery: deliveryKey, rush });
      if (seq !== orderSeq) return;
      orderPrice = o;
    } catch { orderPrice = null; }
    renderSummary(pending);
    renderPrice();
    renderTabs();
  }, 150);
}

function renderSummary(pending: boolean) {
  const o = orderPrice;
  const skipped = parts.filter(p => p.status === 'error' || p.slice?.status === 'failed');
  $('summaryLines').innerHTML = (o?.items.map(i => `<li><span>${esc(i.filename)} × ${i.quantity}</span><span>${money(i.price.total)}</span></li>`).join('') || '')
    + (pending ? `<li class="muted"><span><i class="spinner" style="display:inline-block;vertical-align:-2px;color:var(--accent)"></i> Pricing parts…</span><span></span></li>` : '')
    + skipped.map(p => `<li class="muted"><span>${esc(p.file.name)}</span><span>not included</span></li>`).join('');
  $('summaryTotals').innerHTML = o ? [
    o.totals.rush ? ['Rush', o.totals.rush] : null,
    ['Order fee', o.totals.orderFee],
    o.totals.minimumTopUp ? ['Minimum order top-up', o.totals.minimumTopUp] : null,
    [o.deliveryLabel.split(' — ')[0], o.totals.delivery],
  ].filter(Boolean).map(x => `<li><span>${esc((x as any)[0])}</span><span>${(x as any)[1] ? money((x as any)[1]) : 'Free'}</span></li>`).join('') : '';
  $('summaryTotal').textContent = o ? money(o.totals.total) : '—';
  $('priceDock').hidden = !parts.length || checkoutInView;
  $('dockAmt').textContent = o ? money(o.totals.total) : '—';
  $('dockSub').textContent = pending ? 'Slicing…' : o ? `${o.items.reduce((n, i) => n + i.quantity, 0)} part(s) · inc. GST & delivery` : 'Add a printable file';
  $<HTMLButtonElement>('payBtn').disabled = !o || pending;
}

/* ---------------- checkout ---------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function setupCheckout() {
  $('deliveryList').innerHTML = Object.entries(catalog.delivery).map(([k, d]) =>
    `<label class="radio-row"><input type="radio" name="delivery" value="${k}" ${k === deliveryKey ? 'checked' : ''}/> <span>${esc(d.label)}</span><span class="p">${d.price ? money(d.price) : 'Free'}</span></label>`).join('');
  $('deliveryList').addEventListener('change', e => {
    deliveryKey = (e.target as HTMLInputElement).value;
    $('addressField').hidden = deliveryKey === 'pickup';
    refreshOrder();
  });
  $<HTMLInputElement>('rush').addEventListener('change', e => { rush = (e.target as HTMLInputElement).checked; refreshOrder(); });

  const email = $<HTMLInputElement>('cemail');
  let emailTracked = false;
  email.addEventListener('blur', () => {
    const ok = EMAIL_RE.test(email.value.trim());
    $('cemailField').classList.toggle('invalid', !!email.value && !ok);
    if (ok) { if (!emailTracked) { track('email_entered', { flow: 'pro' }); emailTracked = true; } saveDraft(); }
  });
  for (const id of ['cname', 'cemail', 'address']) $(id).addEventListener('input', () => $(id).closest('.field')!.classList.remove('invalid'));

  $<HTMLFormElement>('checkoutForm').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('checkoutError'); err.classList.remove('show');
    const name = $<HTMLInputElement>('cname').value.trim();
    const em = email.value.trim();
    const address = $<HTMLTextAreaElement>('address').value.trim();
    let bad = false;
    if (!name) { $('nameField').classList.add('invalid'); bad = true; }
    if (!EMAIL_RE.test(em)) { $('cemailField').classList.add('invalid'); bad = true; }
    if (deliveryKey !== 'pickup' && address.length < 8) { $('addressField').classList.add('invalid'); bad = true; }
    if (!$<HTMLInputElement>('terms').checked) { err.textContent = 'Please tick the box to accept the print terms.'; err.classList.add('show'); bad = true; }
    if (bad) { track('form_error', { flow: 'pro' }); return; }
    const ready = parts.filter(p => p.slice?.status === 'done');
    const btn = $<HTMLButtonElement>('payBtn');
    btn.disabled = true; btn.textContent = 'Preparing checkout…';
    try {
      const res = await api<{ ref: string; checkoutUrl: string }>('/api/orders', {
        draftId, name, email: em, phone: $<HTMLInputElement>('cphone').value, notes: $<HTMLInputElement>('cnotes').value,
        address, delivery: deliveryKey, rush, acceptTerms: true, attribution: attribution(),
        items: ready.map(p => ({ sliceId: p.slice!.id, quantity: p.quantity })),
      });
      track('checkout_started', { value: orderPrice?.totals.total, parts: ready.length });
      location.href = apiUrl(res.checkoutUrl);
    } catch (e2) {
      err.textContent = e2 instanceof ApiError ? e2.message : 'Something went wrong. Please try again.';
      err.classList.add('show');
      btn.disabled = false; btn.innerHTML = 'Continue to secure checkout <span class="arrow">→</span>';
    }
  });
}

async function saveDraft() {
  const em = $<HTMLInputElement>('cemail').value.trim();
  if (!EMAIL_RE.test(em)) return;
  try {
    const r = await api<{ id: string }>('/api/drafts', { id: draftId, email: em, kind: 'pro', uploadIds: parts.map(p => p.uploadId).filter(Boolean) });
    draftId = r.id;
  } catch { /* non-critical */ }
}
