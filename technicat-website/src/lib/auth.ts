export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getRole(): string | null {
  return localStorage.getItem("role");
}

export function setAuth(token: string, role: string): void {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

export function clearAuth(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

export function decodeRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload)).role ?? null;
  } catch {
    return null;
  }
}
