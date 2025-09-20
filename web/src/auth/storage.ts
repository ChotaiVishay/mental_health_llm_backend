const TOKEN_KEY = 'sa_token';
const USER_KEY = 'sa_user';
const RETURN_TO_KEY = 'sa_return_to';

export function saveAuth(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  return { token, user: userRaw ? JSON.parse(userRaw) : null };
}

export function setReturnTo(path: string) {
  try { localStorage.setItem(RETURN_TO_KEY, path); } catch {}
}

export function getAndClearReturnTo(): string | null {
  try {
    const v = localStorage.getItem(RETURN_TO_KEY);
    localStorage.removeItem(RETURN_TO_KEY);
    return v;
  } catch {
    return null;
  }
}