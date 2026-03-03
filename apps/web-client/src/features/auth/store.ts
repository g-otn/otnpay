const ACCESS_TOKEN_KEY = 'otnpay_access_token';
const REFRESH_TOKEN_KEY = 'otnpay_refresh_token';

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): null | string {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return localStorage.getItem(ACCESS_TOKEN_KEY) !== null;
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}
