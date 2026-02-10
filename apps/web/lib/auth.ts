const ACCESS_TOKEN_KEY = 'resolv_access_token';
const REFRESH_TOKEN_KEY = 'resolv_refresh_token';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  organizationId: string;
}

export interface AuthUser extends User {
  organizationName?: string;
  organizationSlug?: string;
}

// Token storage
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasTokens(): boolean {
  return !!getAccessToken() && !!getRefreshToken();
}

// JWT decode (simple, sans vérification)
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded.exp !== 'number') return true;
  // Add 10s buffer to avoid edge cases
  return decoded.exp * 1000 < Date.now() + 10_000;
}

// ============================================================================
// CENTRALIZED TOKEN REFRESH (singleton lock)
// ============================================================================

let refreshPromise: Promise<string | null> | null = null;

/**
 * Returns a valid access token, refreshing if needed.
 * - If access token is valid → returns it
 * - If expired → refreshes (single attempt, no loop)
 * - If refresh fails → clears tokens, returns null
 * Concurrent callers share the same refresh promise.
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // No tokens at all
  if (!accessToken && !refreshToken) return null;

  // Access token still valid
  if (accessToken && !isTokenExpired(accessToken)) return accessToken;

  // No refresh token → can't refresh
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  // Need to refresh — use singleton promise to avoid parallel refresh calls
  if (!refreshPromise) {
    refreshPromise = performRefresh(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function performRefresh(refreshToken: string): Promise<string | null> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Any non-200 (401, 403, 500) → stop, clear tokens
      clearTokens();
      return null;
    }

    const data = await response.json();
    if (data.accessToken && data.refreshToken) {
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data.accessToken;
    }

    clearTokens();
    return null;
  } catch {
    // Network error
    clearTokens();
    return null;
  }
}
