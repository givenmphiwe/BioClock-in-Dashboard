import axios, { AxiosError } from "axios";
import type { LoginResponse } from "../types/auth";

const api = axios.create({
  baseURL: "http://localhost:5099/",
});

type StorageLike = Pick<Storage, "getItem"|"setItem"|"removeItem">;

const STORAGE_KEYS = {
  ACCESS: "auth:accessToken",
  REFRESH: "auth:refreshToken",
  EXPIRES: "auth:expiresAt",
  USER: "auth:user",
  REMEMBER: "auth:remember",
} as const;

let store: StorageLike = sessionStorage; // default (no remember)

function setStore(remember: boolean) {
  store = remember ? localStorage : sessionStorage;
  // record preference so interceptors survive reloads
  localStorage.setItem(STORAGE_KEYS.REMEMBER, remember ? "1" : "0");
}

function getRemember(): boolean {
  return localStorage.getItem(STORAGE_KEYS.REMEMBER) === "1";
}

function setTokens(data: LoginResponse, remember: boolean) {
  setStore(remember);
  store.setItem(STORAGE_KEYS.ACCESS, data.accessToken);
  store.setItem(STORAGE_KEYS.REFRESH, data.refreshToken);
  store.setItem(STORAGE_KEYS.EXPIRES, data.expiresAt);
  const user = {
    userId: data.userId,
    userName: data.userName,
    displayName: data.displayName,
    email: data.email,
    clientId: data.clientId,
  };
  store.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function clearTokens() {
  [localStorage, sessionStorage].forEach(s => {
    s.removeItem(STORAGE_KEYS.ACCESS);
    s.removeItem(STORAGE_KEYS.REFRESH);
    s.removeItem(STORAGE_KEYS.EXPIRES);
    s.removeItem(STORAGE_KEYS.USER);
  });
  localStorage.removeItem(STORAGE_KEYS.REMEMBER);
}

function getAccessToken() {
  const remember = getRemember();
  const s = remember ? localStorage : sessionStorage;
  return s.getItem(STORAGE_KEYS.ACCESS);
}
function getRefreshToken() {
  const remember = getRemember();
  const s = remember ? localStorage : sessionStorage;
  return s.getItem(STORAGE_KEYS.REFRESH);
}
function getExpiresAt(): number | null {
  const remember = getRemember();
  const s = remember ? localStorage : sessionStorage;
  const v = s.getItem(STORAGE_KEYS.EXPIRES);
  return v ? Date.parse(v) : null;
}

let refreshingPromise: Promise<void> | null = null;

async function refreshIfNeeded(force = false) {
  const expiresAt = getExpiresAt();
  if (!expiresAt) return;

  const now = Date.now();
  const skewMs = 20_000; // 20s safety
  if (!force && now + skewMs < expiresAt) return;

  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return;
      }
      const remember = getRemember();
      const { data } = await api.post<LoginResponse>("/api/Auth/refresh", {
        refreshToken,
      });
      setTokens(data, remember);
    })().finally(() => (refreshingPromise = null));
  }
  await refreshingPromise;
}

// Attach access token
api.interceptors.request.use(async (config) => {
  await refreshIfNeeded(); // refresh a moment before expiry
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One retry on 401 via forced refresh
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        await refreshIfNeeded(true); // force
        const token = getAccessToken();
        if (token && error.config) {
          error.config.headers = error.config.headers ?? {};
          (error.config.headers as any).Authorization = `Bearer ${token}`;
          return api.request(error.config);
        }
      } catch {
        clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

export const AuthApi = {
  async login(userNameOrEmail: string, password: string, remember: boolean) {
    const { data } = await api.post<LoginResponse>("/api/Auth/login", {
      userNameOrEmail,
      password,
    });
    setTokens(data, remember);
    return data;
  },
  async logout() {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.post("/api/Auth/logout", { refreshToken });
      }
    } finally {
      clearTokens();
    }
  },
  getUser() {
    const remember = getRemember();
    const s = remember ? localStorage : sessionStorage;
    const raw = s.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  isAuthenticated() {
    return !!getAccessToken();
  },
  api,
};
