const BASE = (import.meta.env.PUBLIC_API_URL || '').replace(/\/$/, '');

export const apiUrl = (path: string) => (/^https?:/.test(path) ? path : BASE + path);

export class ApiError extends Error {}

export async function api<T = any>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Can’t reach our server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Something went wrong (${res.status}). Please try again.`);
  return data as T;
}

export type Analysis = {
  size?: { x: number; y: number; z: number }; volume?: number; manifold?: boolean;
  printable: boolean; errors: string[]; warnings: string[];
};
export type UploadRecord = { id: string; filename: string; size: number; ext: string; status: string; analysis: Analysis | null };

/**
 * Upload one file: ask the API for a signed URL, PUT the file straight to storage
 * (with progress), then confirm. Works the same with local disk or Cloudflare R2.
 */
export async function uploadFile(file: File, purpose: 'inquiry' | 'pro', onProgress: (pct: number) => void, signal?: AbortSignal): Promise<UploadRecord> {
  const { id, upload } = await api<{ id: string; upload: { url: string; method: string; headers: Record<string, string> } }>(
    '/api/uploads', { filename: file.name, size: file.size, contentType: file.type || 'application/octet-stream', purpose });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upload.method, apiUrl(upload.url));
    for (const [k, v] of Object.entries(upload.headers || {})) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new ApiError('Upload failed — please try again.')));
    xhr.onerror = () => reject(new ApiError('Upload interrupted — check your connection and try again.'));
    signal?.addEventListener('abort', () => { xhr.abort(); reject(new ApiError('Cancelled')); });
    xhr.send(file);
  });
  onProgress(100);
  return api<UploadRecord>(`/api/uploads/${id}/complete`, {});
}

/** Poll an upload until server-side mesh analysis is done (or give up). */
export async function waitForAnalysis(id: string, tries = 40): Promise<UploadRecord> {
  for (let i = 0; i < tries; i++) {
    const u = await api<UploadRecord>(`/api/uploads/${id}`);
    if (u.analysis) return u;
    await new Promise(r => setTimeout(r, 400 + i * 100));
  }
  return api<UploadRecord>(`/api/uploads/${id}`);
}

export const fmtBytes = (b: number) => (b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);
export const money = (n: number) => `$${n.toFixed(2)}`;
export const fmtDuration = (s: number) => {
  const mins = Math.max(1, Math.round(s / 60));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
