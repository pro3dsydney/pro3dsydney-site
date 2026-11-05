import { api, ApiError, esc } from './api';

type Cfg = { provider: 'local' | 'turnstile'; siteKey?: string };

/**
 * Show the "quick check" dialog and resolve once it's passed.
 * Several parts waiting at the same time share one dialog.
 */
let pending: Promise<void> | null = null;
export function solveCaptcha(cfg: Cfg): Promise<void> {
  if (!pending) pending = open(cfg).finally(() => { pending = null; });
  return pending;
}

function open(cfg: Cfg): Promise<void> {
  return new Promise(resolve => {
    const dlg = document.createElement('dialog');
    dlg.className = 'captcha-dialog';
    dlg.innerHTML = `<form method="dialog" class="captcha-box">
      <div class="captcha-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg></div>
      <h3>Quick check</h3>
      <p class="muted">Slicing uses real printer software, so we check you’re human every few parts.</p>
      <div class="captcha-body"><div class="skeleton" style="height:46px"></div></div>
      <p class="form-error" role="alert"></p>
      <button class="btn btn-primary btn-block" type="submit" hidden>Continue</button>
    </form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener('cancel', e => e.preventDefault()); // must pass to continue slicing
    dlg.showModal();
    const body = dlg.querySelector('.captcha-body')!;
    const err = dlg.querySelector<HTMLElement>('.form-error')!;
    const btn = dlg.querySelector<HTMLButtonElement>('button[type=submit]')!;
    const done = () => { dlg.close(); dlg.remove(); resolve(); };

    async function submit(payload: object) {
      err.classList.remove('show');
      try { await api('/api/captcha', payload); done(); }
      catch (e) { err.textContent = e instanceof ApiError ? e.message : 'Please try again.'; err.classList.add('show'); load(); }
    }

    async function load() {
      if (cfg.provider === 'turnstile') {
        await loadTurnstile();
        body.innerHTML = '<div id="cf-turnstile"></div>';
        (window as any).turnstile.render('#cf-turnstile', { sitekey: cfg.siteKey, callback: (token: string) => submit({ token }) });
        return;
      }
      const ch = await api<{ question: string; id: string }>('/api/captcha');
      body.innerHTML = `<label class="label" for="capAns">${esc(ch.question)}</label>
        <input class="input" id="capAns" inputmode="numeric" autocomplete="off" required />`;
      btn.hidden = false;
      const input = body.querySelector<HTMLInputElement>('#capAns')!;
      input.focus();
      dlg.querySelector('form')!.onsubmit = e => { e.preventDefault(); submit({ id: ch.id, answer: input.value }); };
    }
    load().catch(() => { err.textContent = 'Couldn’t load the check. Please refresh the page.'; err.classList.add('show'); });
  });
}

let turnstileLoading: Promise<void> | null = null;
function loadTurnstile() {
  turnstileLoading ??= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.onload = () => res(); s.onerror = () => rej(new Error('turnstile'));
    document.head.appendChild(s);
  });
  return turnstileLoading;
}
