export type RateRecord = { readonly count: number; readonly resetTime: number };

export function isAllowed(
  store: Map<string, RateRecord>,
  windowMs: number,
  max: number,
  key: string,
): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= max) return false;

  store.set(key, { ...record, count: record.count + 1 });
  return true;
}
