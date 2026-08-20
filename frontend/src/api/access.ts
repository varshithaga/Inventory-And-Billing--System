// Single source of truth for reading/writing the JWT access & refresh tokens.
// client.ts's axios interceptors read/write through these instead of touching
// localStorage directly, so every other module goes through one place.

const ACCESS_KEY = "ib_access";
const REFRESH_KEY = "ib_refresh";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string | null): void {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
