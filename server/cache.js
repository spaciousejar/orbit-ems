const store = new Map();

const DEFAULTS = {
  ttl: 15000,
  maxSize: 200,
};

export function setMaxSize(n) {
  DEFAULTS.maxSize = n;
}

export async function getCached(key, ttl, fetchFn) {
  const t = ttl ?? DEFAULTS.ttl;
  const cached = store.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  const data = await fetchFn();
  if (store.size >= DEFAULTS.maxSize) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { data, expiry: Date.now() + t });
  return data;
}

export function makeCacheKey(path, query) {
  const qs = query
    ? Object.keys(query).sort().map(k => `${k}=${query[k]}`).join('&')
    : '';
  return path + (qs ? '?' + qs : '');
}

export function invalidateCache(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function clearAll() {
  store.clear();
}

export function size() {
  return store.size;
}
