import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/user";

export type LoginResponse = {
  token?: string;
  user?: AuthUser;
};

export function loginRequest(email: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    fallbackError: "Hiba történt!",
    networkError: "Nem sikerült csatlakozni a szerverhez!",
  });
}
