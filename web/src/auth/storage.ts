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

export function getAuth(): { token: string | null; user: unknown | null } {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!userRaw) return { token, user: null };
  try {
    return { token, user: JSON.parse(userRaw) as unknown };
  } catch {
    // Corrupt JSON in storage — treat as logged out
    return { token, user: null };
  }
}

export function setReturnTo(path: string) {
  try {
    localStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    /* noop: storage may be unavailable (private mode, quota, etc.) */
  }
}

export function getAndClearReturnTo(): string | null {
  try {
    const v = localStorage.getItem(RETURN_TO_KEY);
    localStorage.removeItem(RETURN_TO_KEY);
    return v;
  } catch {
    /* noop */ 
    return null;
  }
}