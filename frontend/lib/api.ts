import { getAuthToken } from "@/lib/auth";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type ApiRequest = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  fallbackError: string;
  networkError?: string;
};

type ErrorBody = {
  error?: unknown;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEFAULT_NETWORK_ERROR = "Nem sikerült csatlakozni a szerverhez!";

function errorMessage(body: ErrorBody | null, fallback: string): string {
  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error;
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  request: ApiRequest,
): Promise<ApiResult<T>> {
  const token = getAuthToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (request.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${apiBase}${path}`, {
      method: request.method ?? "GET",
      headers,
      body:
        request.body !== undefined ? JSON.stringify(request.body) : undefined,
    });
    const body = (await response.json().catch(() => null)) as
      | (T & ErrorBody)
      | null;

    if (!response.ok) {
      return { ok: false, error: errorMessage(body, request.fallbackError) };
    }
    if (body === null) {
      return {
        ok: false,
        error: request.networkError ?? DEFAULT_NETWORK_ERROR,
      };
    }

    return { ok: true, data: body };
  } catch {
    return {
      ok: false,
      error: request.networkError ?? DEFAULT_NETWORK_ERROR,
    };
  }
}
