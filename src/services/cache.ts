export interface CacheEntry<T> {
  ts: number;
  data: T;
}

export function makeKey(parts: Record<string, string | number | boolean>): string {
  const sorted = Object.keys(parts).sort().map(k => `${k}=${parts[k]}`);
  return `wa:${sorted.join('|')}`;
}

export function setCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { ts: Date.now(), data };
  try { localStorage.setItem(key, JSON.stringify(entry)); } catch {}
}

export function getCacheFresh<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts <= ttlMs) return entry.data;
    return null;
  } catch { return null; }
}

export function getCacheStale<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return entry.data;
  } catch { return null; }
}


