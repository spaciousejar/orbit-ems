import { auth } from '../firebase';

const BASE = '/api';

type Req = Record<string, unknown> | FormData | undefined;

type Params = Record<string, string | undefined | null>;

async function request<T>(method: string, path: string, body?: Req, params?: Params): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers: Record<string, string> = {};
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = `${BASE}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>('GET', path, undefined, params),
  post: <T>(path: string, body?: Req) => request<T>('POST', path, body),
  put: <T>(path: string, body?: Req) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: Req) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
