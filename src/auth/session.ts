const KEYS = {
  ACCESS: "auth:accessToken",
  REFRESH: "auth:refreshToken",
  EXPIRES: "auth:expiresAt",
  USER: "auth:user",
  REMEMBER: "auth:remember",
} as const;

function pickStore() {
  // If we saved REMEMBER=1 earlier, use localStorage; else sessionStorage
  return localStorage.getItem(KEYS.REMEMBER) === "1" ? localStorage : sessionStorage;
}

export function getStored<T = string>(key: string): T | null {
  // Try the chosen store first, then the other one as a fallback
  const preferred = pickStore();
  const other = preferred === localStorage ? sessionStorage : localStorage;
  const v = preferred.getItem(key) ?? other.getItem(key);
  return (v as unknown as T) ?? null;
}

export function isSessionValid(): boolean {
  const access = getStored<string>(KEYS.ACCESS);
  const expiresAt = getStored<string>(KEYS.EXPIRES);
  if (!access || !expiresAt) return false;

  const expMs = Date.parse(expiresAt);
  if (Number.isNaN(expMs)) return false;

  const skewMs = 20_000; // 20s safety window
  return Date.now() + skewMs < expMs;
}

export function clearSession(): void {
  const keys = [KEYS.ACCESS, KEYS.REFRESH, KEYS.EXPIRES, KEYS.USER, KEYS.REMEMBER];
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of keys) storage.removeItem(key);
  }
}
