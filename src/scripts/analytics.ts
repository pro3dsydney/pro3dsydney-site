/**
 * Lightweight analytics:
 *  - first-party events go to our own API (/api/events) → Admin → Analytics
 *  - the same events go to Google Analytics 4 and Microsoft Clarity when enabled
 *  - remembers where a visitor came from (UTM tags or referrer) so every
 *    request/order in the admin shows its source.
 */
import { apiUrl } from './api';

export type Attribution = { source: string; medium: string; campaign: string; referrer: string; landing: string };

const SID_KEY = 'u3d_sid';
const ATTR_KEY = 'u3d_attr';

function store(kind: 'local' | 'session'): Storage | null {
  try { return kind === 'local' ? window.localStorage : window.sessionStorage; } catch { return null; }
}

let memSid = '';
export function sessionId(): string {
  const s = store('session');
  let id = '';
  try { id = s?.getItem(SID_KEY) || memSid; } catch { id = memSid; }
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    memSid = id;
    try { s?.setItem(SID_KEY, id); } catch { /* private mode */ }
  }
  return id;
}

const SEARCH = /google|bing|duckduckgo|yahoo|ecosia|baidu|yandex/;
const SOCIAL: Record<string, string> = { instagram: 'instagram', facebook: 'facebook', 'fb.': 'facebook', 't.co': 'x', twitter: 'x', reddit: 'reddit', tiktok: 'tiktok', linkedin: 'linkedin', youtube: 'youtube', pinterest: 'pinterest' };
const AI = /chatgpt|openai|perplexity|claude\.ai|gemini|copilot/;

function classify(): Attribution {
  const url = new URL(location.href);
  const p = url.searchParams;
  let refHost = '';
  try { const ref = document.referrer ? new URL(document.referrer) : null; refHost = ref && ref.host !== location.host ? ref.host.replace(/^www\./, '') : ''; } catch { /* bad referrer */ }
  let source = p.get('utm_source') || '';
  let medium = p.get('utm_medium') || '';
  const campaign = p.get('utm_campaign') || '';
  if (!source && p.get('gclid')) { source = 'google'; medium = 'cpc'; }
  if (!source && refHost) {
    if (AI.test(refHost)) { source = refHost.split('.')[0]; medium = 'ai'; }
    else if (SEARCH.test(refHost)) { source = refHost.match(SEARCH)![0]; medium = 'organic'; }
    else {
      const social = Object.keys(SOCIAL).find(k => refHost.includes(k));
      source = social ? SOCIAL[social] : refHost;
      medium = social ? 'social' : 'referral';
    }
  }
  return { source, medium, campaign, referrer: refHost, landing: url.pathname };
}

let cached: Attribution | null = null;
/** First-touch attribution kept for 30 days; a new campaign link (utm_source) replaces it. */
export function attribution(): Attribution {
  if (cached) return cached;
  const ls = store('local');
  const current = classify();
  const hasUtm = new URL(location.href).searchParams.has('utm_source');
  try {
    const saved = JSON.parse(ls?.getItem(ATTR_KEY) || 'null');
    if (saved && Date.now() - saved.t < 30 * 864e5 && !hasUtm) return (cached = saved.a);
    ls?.setItem(ATTR_KEY, JSON.stringify({ t: Date.now(), a: current }));
  } catch { /* storage blocked */ }
  return (cached = current);
}

let queue: object[] = [];
let timer: number | undefined;
function flush() {
  if (!queue.length) return;
  const body = JSON.stringify(queue);
  queue = [];
  const url = apiUrl('/api/events');
  if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) {
    fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  }
}
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

export function track(name: string, props: Record<string, unknown> = {}) {
  const a = attribution();
  queue.push({ name, sid: sessionId(), path: location.pathname, referrer: a.referrer, source: a.source, medium: a.medium, campaign: a.campaign, props });
  clearTimeout(timer);
  timer = window.setTimeout(flush, name === 'page_view' ? 50 : 800);
  const w = window as any;
  if (typeof w.gtag === 'function') w.gtag('event', name, props);
  if (typeof w.clarity === 'function') w.clarity('event', name);
}
