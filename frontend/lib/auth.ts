import type { AuthUser } from "@/types/user";

const TOKEN_KEY = "token";
const USER_KEY = "user";

function cookieOptions(maxAge: number): string {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  return `Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function setTokenCookie(token: string): void {
  document.cookie = `token=${encodeURIComponent(token)}; ${cookieOptions(60 * 60 * 24)}`;
}

function clearTokenCookie(): void {
  document.cookie = `token=; ${cookieOptions(0)}`;
}

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function persistAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setTokenCookie(token);
}

export function clearPersistedAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearTokenCookie();
}

export function readPersistedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AuthUser;
}

export function isLoggedIn(): boolean {
  return getAuthToken() !== "";
}
