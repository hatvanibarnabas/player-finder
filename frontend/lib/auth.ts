import type { AuthUser } from "@/types/user";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function persistAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `token=${token}; path=/; max-age=86400`;
}

export function clearPersistedAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "token=; path=/; max-age=0";
}

export function readPersistedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AuthUser;
}

export function isLoggedIn(): boolean {
  return getAuthToken() !== "";
}
